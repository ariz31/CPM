import { useEffect, useMemo, useRef, useState } from 'react';
import { executeProjectCommand, type ProjectCommand } from '../application/projectCommands';
import { calculateScheduleInWorker } from '../application/scheduleWorkerClient';
import type { ProjectRecord, ProjectSnapshot, JournalEntry } from '../domain/project/types';
import type { Activity, ScheduleResult } from '../domain/schedule/types';
import { applyActivityCsv, previewActivityCsv, type CsvImportPreview } from '../infrastructure/csvImport';
import {
  createProjectSnapshot,
  listJournal,
  listProjectSnapshots,
  restoreProjectSnapshot,
  saveProject
} from '../infrastructure/projectRepository';
import { ActivityGrid } from './ActivityGrid';
import { ActivityInspector } from './ActivityInspector';
import { CalendarPanel } from './CalendarPanel';
import { GanttPreview } from './GanttPreview';
import { HealthPanel } from './HealthPanel';
import { MetricCard } from './MetricCard';
import { RecoveryCenter } from './RecoveryCenter';
import { RelationshipEditor } from './RelationshipEditor';
import { WbsPanel } from './WbsPanel';
import { ProjectSettingsPanel } from './ProjectSettingsPanel';

type WorkspaceTab = 'schedule' | 'logic' | 'calendars' | 'project' | 'recovery';

interface ScheduleWorkspaceProps {
  project: ProjectRecord;
  onBack: () => void;
  onProjectChange: (project: ProjectRecord) => void;
}

export function ScheduleWorkspace({ project, onBack, onProjectChange }: ScheduleWorkspaceProps) {
  const [tab, setTab] = useState<WorkspaceTab>('schedule');
  const [result, setResult] = useState<ScheduleResult>();
  const [calculationError, setCalculationError] = useState<string>();
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
  const csvInputRef = useRef<HTMLInputElement | null>(null);
  const projectRef = useRef(project);
  projectRef.current = project;

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
    const [nextSnapshots, nextJournal] = await Promise.all([
      listProjectSnapshots(project.id),
      listJournal(project.id)
    ]);
    setSnapshots(nextSnapshots);
    setJournal(nextJournal);
  }

  async function applyCommand(command: ProjectCommand, historyMode: 'normal' | 'undo' | 'redo' = 'normal'): Promise<void> {
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
      } else if (historyMode === 'undo') {
        setRedoStack((stack) => [...stack.slice(-49), commandResult.inverse]);
      } else {
        setUndoStack((stack) => [...stack.slice(-49), commandResult.inverse]);
      }
    } catch (error) {
      setSaveState('failed');
      window.alert(error instanceof Error ? error.message : 'Unable to apply project change.');
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

  const selectedActivity = useMemo(() => selectedIds.size === 1 ? project.activities.find((item) => selectedIds.has(item.id)) : undefined, [project.activities, selectedIds]);
  const criticalCount = result?.criticalActivityIds.length ?? 0;
  const warningCount = result?.warnings.length ?? 0;

  return (
    <main className="workspace-shell">
      <header className="workspace-header">
        <div className="workspace-title-group">
          <button className="back-button" type="button" onClick={onBack} aria-label="Return to project library">←</button>
          <div><p className="eyebrow">Schedule workspace · revision {project.revision}</p><h1>{project.name}</h1><span className="workspace-subtitle">{project.metadata.location || 'No location'} · starts {project.metadata.startDate}</span></div>
        </div>
        <div className={`save-indicator save-${saveState}`} role="status"><span aria-hidden="true" />{saveState === 'saved' ? 'Saved locally' : saveState === 'saving' ? 'Saving…' : 'Save failed'}</div>
      </header>

      <nav className="workspace-tabs" aria-label="Project workspace sections">
        {(['schedule', 'logic', 'calendars', 'project', 'recovery'] as WorkspaceTab[]).map((item) => <button key={item} className={tab === item ? 'active' : ''} type="button" onClick={() => setTab(item)}>{item}</button>)}
      </nav>

      <section className="metric-grid" aria-label="Project schedule metrics">
        <MetricCard label="Project duration" value={result ? `${result.projectDuration}d` : '—'} detail={result?.projectFinishDate ?? 'Calendar-aware finish'} />
        <MetricCard label="Activities" value={project.activities.length} detail={`${project.relationships.length} relationships · ${project.calendars.length} calendars`} />
        <MetricCard label="Critical activities" value={criticalCount} detail={`${result?.nearCriticalActivityIds.length ?? 0} near-critical`} tone="critical" />
        <MetricCard label="Schedule findings" value={warningCount} detail="Logic, calendar, float, constraints" tone={warningCount > 0 ? 'warning' : 'default'} />
      </section>

      {isCalculating ? <div className="notice" role="status">Recalculating in a dedicated worker…</div> : null}

      {tab === 'schedule' ? (
        <>
          <section className="surface schedule-surface">
            <div className="surface-heading schedule-toolbar">
              <div><p className="eyebrow">Virtualized activity grid</p><h2>Activities</h2></div>
              <div className="toolbar-group wrap">
                <input className="search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter activities" aria-label="Filter activities" />
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} aria-label="Sort activities"><option value="id">ID</option><option value="name">Name</option><option value="duration">Duration</option><option value="wbs">WBS</option></select>
                <button className="button button-small" type="button" onClick={() => setSortDirection((direction) => direction === 'asc' ? 'desc' : 'asc')}>{sortDirection === 'asc' ? 'Ascending' : 'Descending'}</button>
                <button className="button button-small" type="button" onClick={() => void undo()} disabled={undoStack.length === 0}>Undo</button>
                <button className="button button-small" type="button" onClick={() => void redo()} disabled={redoStack.length === 0}>Redo</button>
                <button className="button button-primary" type="button" onClick={() => void applyCommand({ type: 'ADD_ACTIVITY' })}>Add activity</button>
                <button className="button button-secondary" type="button" onClick={() => csvInputRef.current?.click()}>Import CSV</button>
                <input ref={csvInputRef} className="sr-only" type="file" accept=".csv,text/csv" onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void file.text().then((text) => setCsvPreview(previewActivityCsv(project, text)));
                  event.currentTarget.value = '';
                }} />
                <button className="button button-danger" type="button" disabled={selectedIds.size === 0} onClick={() => {
                  if (!window.confirm(`Delete ${selectedIds.size} selected activities?`)) return;
                  void (async () => {
                    for (const id of selectedIds) await applyCommand({ type: 'DELETE_ACTIVITY', activityId: id });
                    setSelectedIds(new Set());
                  })();
                }}>Delete selected</button>
              </div>
            </div>
            {csvPreview ? <div className={`import-preview ${csvPreview.errors.length > 0 ? 'invalid' : ''}`} role="status"><strong>{csvPreview.rows.length} valid rows</strong><span>{csvPreview.errors.length} errors · {csvPreview.warnings.length} warnings</span>{csvPreview.errors.map((error) => <p key={error}>{error}</p>)}<div><button className="button button-primary" type="button" disabled={csvPreview.errors.length > 0} onClick={() => {
              const next = applyActivityCsv(project, csvPreview);
              void applyCommand({ type: 'REPLACE_PROJECT', project: next });
              setCsvPreview(undefined);
            }}>Commit import</button><button className="button button-small" type="button" onClick={() => setCsvPreview(undefined)}>Cancel</button></div></div> : null}
            {selectedIds.size > 1 ? <div className="bulk-bar"><strong>{selectedIds.size} selected</strong><label>Calendar<select onChange={(event) => { if (event.target.value) void applyCommand({ type: 'BULK_UPDATE_ACTIVITIES', activityIds: [...selectedIds], changes: { calendarId: event.target.value } }); }} defaultValue=""><option value="">Choose…</option>{project.calendars.map((calendar) => <option key={calendar.id} value={calendar.id}>{calendar.name}</option>)}</select></label></div> : null}
            <div className="schedule-layout">
              <ActivityGrid
                activities={project.activities}
                calculatedActivities={result?.activities ?? []}
                wbs={project.wbs}
                calendars={project.calendars}
                selectedIds={selectedIds}
                query={query}
                sortBy={sortBy}
                sortDirection={sortDirection}
                onToggle={toggleSelection}
                onUpdate={(activityId, changes) => void applyCommand({ type: 'UPDATE_ACTIVITY', activityId, changes })}
              />
              <ActivityInspector activity={selectedActivity} onUpdate={(activityId, changes) => void applyCommand({ type: 'UPDATE_ACTIVITY', activityId, changes })} />
            </div>
          </section>
          <section className="surface timeline-surface"><div className="surface-heading"><div><p className="eyebrow">Calendar-aware early dates</p><h2>Timeline preview</h2></div><span className="engine-badge">Engine {result?.engineVersion ?? '—'}</span></div><GanttPreview activities={result?.activities ?? []} projectDuration={result?.projectDuration ?? 0} /></section>
        </>
      ) : null}

      {tab === 'logic' ? <div className="workspace-grid"><RelationshipEditor activities={project.activities} relationships={project.relationships} onAdd={(relationship) => void applyCommand({ type: 'ADD_RELATIONSHIP', relationship })} onDelete={(relationshipId) => void applyCommand({ type: 'DELETE_RELATIONSHIP', relationshipId })} /><HealthPanel result={result} calculationError={calculationError} /></div> : null}

      {tab === 'calendars' ? <div className="workspace-grid"><CalendarPanel calendars={project.calendars} defaultCalendarId={project.settings.defaultCalendarId} onAdd={(calendar) => void applyCommand({ type: 'ADD_CALENDAR', calendar })} onUpdate={(calendarId, changes) => void applyCommand({ type: 'UPDATE_CALENDAR', calendarId, changes })} /><WbsPanel nodes={project.wbs} onAdd={(node) => void applyCommand({ type: 'ADD_WBS', node })} /></div> : null}

      {tab === 'project' ? <ProjectSettingsPanel project={project} onChange={(changes) => void applyCommand({ type: 'REPLACE_PROJECT', project: { ...projectRef.current, ...changes } })} /> : null}

      {tab === 'recovery' ? <RecoveryCenter snapshots={snapshots} journal={journal} onCreateSnapshot={() => {
        const name = window.prompt('Snapshot name', `Snapshot ${new Date().toLocaleString()}`);
        if (name) void createProjectSnapshot(project, name).then(refreshRecovery);
      }} onRestoreSnapshot={(snapshotId) => void restoreProjectSnapshot(snapshotId).then((restored) => { onProjectChange(restored); setUndoStack([]); setRedoStack([]); })} /> : null}
    </main>
  );
}
