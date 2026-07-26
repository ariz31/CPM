import { useEffect, useMemo, useRef, useState } from 'react';
import { executeProjectCommand, type ProjectCommand } from '../application/projectCommands';
import { calculateScheduleInWorker } from '../application/scheduleWorkerClient';
import type { JournalEntry, ProjectRecord, ProjectSnapshot } from '../domain/project/types';
import type { Activity, ScheduleResult } from '../domain/schedule/types';
import { applyActivityCsv, previewActivityCsv, type CsvImportPreview } from '../infrastructure/csvImport';
import {
  createProjectSnapshot,
  listJournal,
  listProjectSnapshots,
  restoreProjectSnapshot,
  saveProject
} from '../infrastructure/projectRepository';
import { ActivityDictionaryWorkspace } from './ActivityDictionaryWorkspace';
import { ActivityScheduleWorkspace } from './ActivityScheduleWorkspace';
import { BaselineProgressPanel } from './BaselineProgressPanel';
import { BoqWorkspace } from './BoqWorkspace';
import { CalendarPanel } from './CalendarPanel';
import { ControlOverview } from './ControlOverview';
import { CostControlPanel } from './CostControlPanel';
import { EnterprisePanel } from './EnterprisePanel';
import { ExecutiveDashboard } from './ExecutiveDashboard';
import { HealthPanel } from './HealthPanel';
import { NetworkDiagram } from './NetworkDiagram';
import { ProjectControlsDashboard } from './ProjectControlsDashboard';
import { ProjectDashboard } from './ProjectDashboard';
import { ProjectSettingsPanel } from './ProjectSettingsPanel';
import { RecoveryCenter } from './RecoveryCenter';
import { RelationshipEditor } from './RelationshipEditor';
import { RiskResourcesPanel } from './RiskResourcesPanel';
import { ScheduleReportsPanel } from './ScheduleReportsPanel';
import { WbsPanel } from './WbsPanel';
import { WorkspaceFullscreenToggle } from './WorkspaceFullscreenToggle';
import { TAB_LABELS, WorkspaceNavigation, type SidebarMode, type WorkspaceTab } from './WorkspaceNavigation';

const SIDEBAR_STORAGE_KEY = 'cpm-workspace-sidebar-mode';

interface ScheduleWorkspaceProps {
  project: ProjectRecord;
  onBack: () => void;
  onProjectChange: (project: ProjectRecord) => void;
}

export function ScheduleWorkspace({ project, onBack, onProjectChange }: ScheduleWorkspaceProps) {
  const [tab, setTab] = useState<WorkspaceTab>('dashboard');
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(readSidebarMode);
  const [lastVisibleSidebarMode, setLastVisibleSidebarMode] = useState<Exclude<SidebarMode, 'hidden'>>('expanded');
  const [dictionarySelection, setDictionarySelection] = useState<string>();
  const [result, setResult] = useState<ScheduleResult>();
  const [calculationError, setCalculationError] = useState<string>();
  const [interactionError, setInteractionError] = useState<string>();
  const [isCalculating, setIsCalculating] = useState(true);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'failed'>('saved');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'duration' | 'wbs'>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [undoStack, setUndoStack] = useState<ProjectCommand[]>([]);
  const [redoStack, setRedoStack] = useState<ProjectCommand[]>([]);
  const [snapshots, setSnapshots] = useState<ProjectSnapshot[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [csvPreview, setCsvPreview] = useState<CsvImportPreview>();
  const [snapshotName, setSnapshotName] = useState('');
  const csvInputRef = useRef<HTMLInputElement | null>(null);
  const deleteDialogRef = useRef<HTMLDialogElement | null>(null);
  const snapshotDialogRef = useRef<HTMLDialogElement | null>(null);
  const projectRef = useRef(project);
  projectRef.current = project;

  useEffect(() => {
    try { localStorage.setItem(SIDEBAR_STORAGE_KEY, sidebarMode); } catch { /* Preferences remain optional. */ }
    if (sidebarMode !== 'hidden') setLastVisibleSidebarMode(sidebarMode);
  }, [sidebarMode]);

  useEffect(() => {
    const request = calculateScheduleInWorker({
      projectStartDate: project.metadata.startDate,
      defaultCalendarId: project.settings.defaultCalendarId,
      criticalFloatThresholdDays: project.settings.criticalFloatThresholdDays,
      nearCriticalFloatThresholdDays: project.settings.nearCriticalFloatThresholdDays,
      calendars: project.calendars,
      activities: project.activities,
      relationships: project.relationships
    }, project.revision);
    let active = true;
    setIsCalculating(true);
    setCalculationError(undefined);
    void request.result
      .then((nextResult) => { if (active) setResult(nextResult); })
      .catch((error: unknown) => { if (active && !String(error).includes('cancelled')) setCalculationError(error instanceof Error ? error.message : 'Unable to calculate schedule.'); })
      .finally(() => { if (active) setIsCalculating(false); });
    return () => { active = false; request.cancel(); };
  }, [project]);

  useEffect(() => { void refreshRecovery(); }, [project.id, project.revision]);

  async function refreshRecovery(): Promise<void> {
    const [nextSnapshots, nextJournal] = await Promise.all([listProjectSnapshots(project.id), listJournal(project.id)]);
    setSnapshots(nextSnapshots);
    setJournal(nextJournal);
  }

  async function applyCommand(command: ProjectCommand, historyMode: 'normal' | 'undo' | 'redo' = 'normal'): Promise<void> {
    setInteractionError(undefined);
    try {
      const commandResult = executeProjectCommand(projectRef.current, command);
      projectRef.current = commandResult.project;
      onProjectChange(commandResult.project);
      setSaveState('saving');
      const saved = await saveProject(commandResult.project, command.type, commandResult.summary, commandResult.commandId);
      projectRef.current = saved;
      onProjectChange(saved);
      setSaveState('saved');
      if (historyMode === 'normal') {
        setUndoStack((stack) => [...stack.slice(-49), commandResult.inverse]);
        setRedoStack([]);
      } else if (historyMode === 'undo') setRedoStack((stack) => [...stack.slice(-49), commandResult.inverse]);
      else setUndoStack((stack) => [...stack.slice(-49), commandResult.inverse]);
    } catch (error) {
      setSaveState('failed');
      setInteractionError(error instanceof Error ? error.message : 'Unable to apply project change.');
    }
  }

  async function undo(): Promise<void> {
    const command = undoStack.at(-1);
    if (!command) return;
    setUndoStack((stack) => stack.slice(0, -1));
    await applyCommand(command, 'undo');
  }

  async function redo(): Promise<void> {
    const command = redoStack.at(-1);
    if (!command) return;
    setRedoStack((stack) => stack.slice(0, -1));
    await applyCommand(command, 'redo');
  }

  function toggleSelection(activityId: string): void {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(activityId)) next.delete(activityId); else next.add(activityId);
      return next;
    });
  }

  function selectOnly(activityId: string): void {
    setSelectedIds(new Set([activityId]));
  }

  async function deleteSelectedActivities(): Promise<void> {
    deleteDialogRef.current?.close();
    for (const id of selectedIds) await applyCommand({ type: 'DELETE_ACTIVITY', activityId: id });
    setSelectedIds(new Set());
  }

  function addDictionaryActivities(activities: Partial<Activity>[]): void {
    void applyCommand({ type: 'ADD_ACTIVITIES', activities });
  }

  function openSnapshotDialog(): void {
    setSnapshotName(`Snapshot ${new Date().toLocaleString('en-US')}`);
    snapshotDialogRef.current?.showModal();
  }

  function toggleSidebarVisibility(): void {
    setSidebarMode((current) => current === 'hidden' ? lastVisibleSidebarMode : 'hidden');
  }

  async function createNamedSnapshot(): Promise<void> {
    const normalized = snapshotName.trim();
    if (!normalized) return;
    snapshotDialogRef.current?.close();
    await createProjectSnapshot(project, normalized);
    setSnapshotName('');
    await refreshRecovery();
  }

  const selectedActivity = useMemo(
    () => selectedIds.size === 1 ? project.activities.find((item) => selectedIds.has(item.id)) : undefined,
    [project.activities, selectedIds]
  );

  return (
    <main className="workspace-shell modern-workspace">
      <header className="workspace-header compact-project-context">
        <div className="workspace-title-group compact">
          <button className="back-button" type="button" onClick={onBack} aria-label="Return to project library">←</button>
          <div>
            <div className="workspace-breadcrumb"><span>Projects</span><span aria-hidden="true">/</span><strong>{TAB_LABELS[tab]}</strong></div>
            <h1>{project.name}</h1>
            <span className="workspace-subtitle">Status {project.statusDate} · Revision {project.revision} · {project.activities.length} activities</span>
          </div>
        </div>
        <div className="workspace-header-status">
          <span className={`save-indicator save-${saveState}`} role="status"><span aria-hidden="true" />{saveState === 'saved' ? 'Saved locally' : saveState === 'saving' ? 'Saving…' : 'Save failed'}</span>
          <button className="button button-small workspace-navigation-toggle" type="button" aria-expanded={sidebarMode !== 'hidden'} aria-label={sidebarMode === 'hidden' ? 'Show project navigation' : 'Hide project navigation'} onClick={toggleSidebarVisibility}><span aria-hidden="true">☰</span><span>{sidebarMode === 'hidden' ? 'Show navigation' : 'Hide navigation'}</span></button>
          <WorkspaceFullscreenToggle />
          <button className="button button-small workspace-undo" type="button" onClick={() => void undo()} disabled={undoStack.length === 0}>Undo</button>
          <button className="button button-small workspace-redo" type="button" onClick={() => void redo()} disabled={redoStack.length === 0}>Redo</button>
        </div>
      </header>

      <div className={`workspace-frame sidebar-${sidebarMode}`}>
        <WorkspaceNavigation active={tab} onChange={setTab} sidebarMode={sidebarMode} onSidebarModeChange={setSidebarMode} />
        <section className="workspace-main" aria-label="Selected project workspace">
          {isCalculating ? <div className="notice" role="status">Recalculating in a dedicated worker…</div> : null}
          {calculationError ? <div className="notice notice-error" role="alert">{calculationError}</div> : null}
          {interactionError ? <div className="notice notice-error" role="alert">{interactionError}</div> : null}

          {tab === 'dashboard' ? <ProjectDashboard project={project} result={result} onReplace={(next) => void applyCommand({ type: 'REPLACE_PROJECT', project: next })} onNavigate={setTab} onAddActivity={() => { void applyCommand({ type: 'ADD_ACTIVITY' }); setTab('schedule'); }} onCreateSnapshot={openSnapshotDialog} /> : null}
          {tab === 'project-controls' ? <ProjectControlsDashboard project={project} result={result} onNavigate={setTab} /> : null}

          {tab === 'schedule' ? <>
            <section className="surface schedule-action-surface">
              <div className="surface-heading schedule-toolbar"><div><p className="eyebrow">Schedule commands</p><h2>Activity actions</h2></div><div className="toolbar-group wrap schedule-actions"><button className="button button-primary" type="button" onClick={() => void applyCommand({ type: 'ADD_ACTIVITY' })}>Add activity</button><button className="button button-secondary" type="button" onClick={() => csvInputRef.current?.click()}>Import CSV</button><input ref={csvInputRef} className="sr-only" type="file" aria-label="Import activity CSV file" accept=".csv,text/csv" onChange={(event) => { const file = event.target.files?.[0]; if (file) void file.text().then((text) => setCsvPreview(previewActivityCsv(project, text))); event.currentTarget.value = ''; }} /><button className="button button-danger" type="button" disabled={selectedIds.size === 0} onClick={() => deleteDialogRef.current?.showModal()}>Delete selected</button></div></div>
              {csvPreview ? <div className={`import-preview ${csvPreview.errors.length > 0 ? 'invalid' : ''}`} role="status"><strong>{csvPreview.rows.length} valid rows</strong><span>{csvPreview.errors.length} errors · {csvPreview.warnings.length} warnings</span>{csvPreview.errors.map((error) => <p key={error}>{error}</p>)}<div><button className="button button-primary" type="button" disabled={csvPreview.errors.length > 0} onClick={() => { const next = applyActivityCsv(project, csvPreview); void applyCommand({ type: 'REPLACE_PROJECT', project: next }); setCsvPreview(undefined); }}>Commit import</button><button className="button button-small" type="button" onClick={() => setCsvPreview(undefined)}>Cancel</button></div></div> : null}
              {selectedIds.size > 1 ? <div className="bulk-bar"><strong>{selectedIds.size} selected</strong><label>Calendar<select onChange={(event) => { if (event.target.value) void applyCommand({ type: 'BULK_UPDATE_ACTIVITIES', activityIds: [...selectedIds], changes: { calendarId: event.target.value } }); }} defaultValue=""><option value="">Choose…</option>{project.calendars.map((calendar) => <option key={calendar.id} value={calendar.id}>{calendar.name}</option>)}</select></label></div> : null}
            </section>
            <ActivityScheduleWorkspace project={project} result={result} selectedIds={selectedIds} selectedActivity={selectedActivity} query={query} sortBy={sortBy} sortDirection={sortDirection} onQueryChange={setQuery} onSortByChange={setSortBy} onSortDirectionChange={setSortDirection} onToggle={toggleSelection} onSelectOnly={selectOnly} onUpdate={(activityId, changes) => void applyCommand({ type: 'UPDATE_ACTIVITY', activityId, changes })} onReplace={(next) => void applyCommand({ type: 'REPLACE_PROJECT', project: next })} />
          </> : null}

          {tab === 'dictionary' ? <ActivityDictionaryWorkspace project={project} mode="dictionary" initialCode={dictionarySelection} onChooseForCalculator={(code) => { setDictionarySelection(code); setTab('duration'); }} onAddActivity={(activity) => void applyCommand({ type: 'ADD_ACTIVITY', activity })} onAddActivities={addDictionaryActivities} onUpdateActivity={(activityId, changes) => void applyCommand({ type: 'UPDATE_ACTIVITY', activityId, changes })} /> : null}
          {tab === 'duration' ? <ActivityDictionaryWorkspace project={project} mode="calculator" initialCode={dictionarySelection} onChooseForCalculator={(code) => { setDictionarySelection(code); setTab('duration'); }} onAddActivity={(activity) => void applyCommand({ type: 'ADD_ACTIVITY', activity })} onAddActivities={addDictionaryActivities} onUpdateActivity={(activityId, changes) => void applyCommand({ type: 'UPDATE_ACTIVITY', activityId, changes })} /> : null}
          {tab === 'wbs' ? <WbsPanel project={project} calculatedActivities={result?.activities ?? []} onReplace={(next) => void applyCommand({ type: 'REPLACE_PROJECT', project: next })} /> : null}
          {tab === 'network' ? <NetworkDiagram project={project} result={result} focusActivityId={selectedActivity?.id} onFocus={selectOnly} /> : null}
          {tab === 'logic' ? <div className="workspace-grid"><RelationshipEditor activities={project.activities} relationships={project.relationships} onAdd={(relationship) => void applyCommand({ type: 'ADD_RELATIONSHIP', relationship })} onDelete={(relationshipId) => void applyCommand({ type: 'DELETE_RELATIONSHIP', relationshipId })} /><HealthPanel result={result} calculationError={calculationError} /></div> : null}
          {tab === 'calendars' ? <CalendarPanel calendars={project.calendars} defaultCalendarId={project.settings.defaultCalendarId} onAdd={(calendar) => void applyCommand({ type: 'ADD_CALENDAR', calendar })} onUpdate={(calendarId, changes) => void applyCommand({ type: 'UPDATE_CALENDAR', calendarId, changes })} /> : null}
          {tab === 'control-overview' ? <ControlOverview project={project} result={result} onReplace={(next) => void applyCommand({ type: 'REPLACE_PROJECT', project: next })} onNavigate={setTab} /> : null}
          {tab === 'progress' ? <BaselineProgressPanel project={project} result={result} onReplace={(next) => void applyCommand({ type: 'REPLACE_PROJECT', project: next })} /> : null}
          {tab === 'boq' ? <BoqWorkspace project={project} onReplace={(next) => void applyCommand({ type: 'REPLACE_PROJECT', project: next })} /> : null}
          {tab === 'controls' ? <CostControlPanel project={project} result={result} onReplace={(next) => void applyCommand({ type: 'REPLACE_PROJECT', project: next })} /> : null}
          {tab === 'risk' ? <RiskResourcesPanel project={project} result={result} onReplace={(next) => void applyCommand({ type: 'REPLACE_PROJECT', project: next })} /> : null}
          {tab === 'executive' ? <ExecutiveDashboard project={project} result={result} onNavigate={setTab} /> : null}
          {tab === 'reports' ? <ScheduleReportsPanel project={project} result={result} /> : null}
          {tab === 'enterprise' ? <EnterprisePanel project={project} result={result} journal={journal} onReplace={(next) => void applyCommand({ type: 'REPLACE_PROJECT', project: next })} /> : null}
          {tab === 'project' ? <ProjectSettingsPanel project={project} onChange={(changes) => void applyCommand({ type: 'REPLACE_PROJECT', project: { ...projectRef.current, ...changes } })} /> : null}
          {tab === 'recovery' ? <RecoveryCenter snapshots={snapshots} journal={journal} onCreateSnapshot={openSnapshotDialog} onRestoreSnapshot={(snapshotId) => void restoreProjectSnapshot(snapshotId).then((restored) => { onProjectChange(restored); setUndoStack([]); setRedoStack([]); })} /> : null}
        </section>
      </div>

      <dialog className="project-action-dialog" ref={deleteDialogRef} aria-labelledby="delete-activities-title"><form method="dialog" onSubmit={(event) => { event.preventDefault(); void deleteSelectedActivities(); }}><div className="dialog-heading"><div><p className="eyebrow">Schedule change</p><h2 id="delete-activities-title">Delete selected activities?</h2><p>{selectedIds.size} activities and their live cross-module references will be removed. Immutable history remains retained.</p></div><button className="icon-button" type="button" onClick={() => deleteDialogRef.current?.close()} aria-label="Close dialog">×</button></div><div className="dialog-actions"><button className="button button-secondary" type="button" onClick={() => deleteDialogRef.current?.close()}>Cancel</button><button className="button button-danger" type="submit">Delete {selectedIds.size}</button></div></form></dialog>
      <dialog className="project-action-dialog" ref={snapshotDialogRef} aria-labelledby="snapshot-title"><form method="dialog" onSubmit={(event) => { event.preventDefault(); void createNamedSnapshot(); }}><div className="dialog-heading"><div><p className="eyebrow">Recovery point</p><h2 id="snapshot-title">Create project snapshot</h2><p>Use a meaningful name so the recovery point can be identified later.</p></div><button className="icon-button" type="button" onClick={() => snapshotDialogRef.current?.close()} aria-label="Close dialog">×</button></div><label className="dialog-field">Snapshot name<input autoFocus value={snapshotName} onChange={(event) => setSnapshotName(event.target.value)} /></label><div className="dialog-actions"><button className="button button-secondary" type="button" onClick={() => snapshotDialogRef.current?.close()}>Cancel</button><button className="button button-primary" type="submit">Create snapshot</button></div></form></dialog>
    </main>
  );
}

function readSidebarMode(): SidebarMode {
  if (typeof window === 'undefined') return 'expanded';
  try {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return stored === 'compact' || stored === 'hidden' || stored === 'expanded' ? stored : 'expanded';
  } catch {
    return 'expanded';
  }
}
