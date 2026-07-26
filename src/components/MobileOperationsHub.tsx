import { useEffect, useMemo, useRef, useState } from 'react';
import { executeProjectCommand } from '../application/projectCommands';
import { calculateScheduleInWorker } from '../application/scheduleWorkerClient';
import { calculateCostControl } from '../domain/controls/costControl';
import {
  applyMobileProgressUpdate,
  buildMobileWorkflowSummary,
  upsertMobileRisk
} from '../domain/mobile/mobileWorkflow';
import type { ProjectRecord, ProjectSnapshot } from '../domain/project/types';
import { analyzeRiskResources } from '../domain/riskResources/riskResources';
import type { RiskRecord } from '../domain/riskResources/types';
import type { ScheduleResult } from '../domain/schedule/types';
import { createProjectFile, downloadProjectFile } from '../infrastructure/projectFile';
import {
  createProjectSnapshot,
  listProjectSnapshots,
  restoreProjectSnapshot,
  saveProject
} from '../infrastructure/projectRepository';
import { NumericInput } from './NumericInput';

type MobileWorkflowView = 'overview' | 'activity' | 'progress' | 'risk' | 'recovery';

interface MobileOperationsHubProps {
  project: ProjectRecord;
  onProjectChange: (project: ProjectRecord) => void;
}

const EMPTY_RISK: RiskRecord = {
  id: '',
  title: '',
  probabilityPercent: 25,
  impactDays: 0,
  impactCost: 0,
  owner: '',
  status: 'open',
  linkedActivityIds: [],
  response: ''
};

export function MobileOperationsHub({ project, onProjectChange }: MobileOperationsHubProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [view, setView] = useState<MobileWorkflowView>('overview');
  const [schedule, setSchedule] = useState<ScheduleResult>();
  const [scheduleError, setScheduleError] = useState<string>();
  const [isCalculating, setIsCalculating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Mobile workflows are ready.');
  const [snapshots, setSnapshots] = useState<ProjectSnapshot[]>([]);
  const [snapshotName, setSnapshotName] = useState('Mobile field snapshot');
  const [activityQuery, setActivityQuery] = useState('');
  const [activityId, setActivityId] = useState('');
  const [activityName, setActivityName] = useState('');
  const [activityDuration, setActivityDuration] = useState<number>();
  const [activityNotes, setActivityNotes] = useState('');
  const [progressActivityId, setProgressActivityId] = useState('');
  const [percentComplete, setPercentComplete] = useState<number>(0);
  const [remainingDuration, setRemainingDuration] = useState<number>(0);
  const [actualStart, setActualStart] = useState('');
  const [actualFinish, setActualFinish] = useState('');
  const [progressNotes, setProgressNotes] = useState('');
  const [riskDraft, setRiskDraft] = useState<RiskRecord>(EMPTY_RISK);

  const taskActivities = useMemo(
    () => project.activities.filter((activity) => activity.type === 'task'),
    [project.activities]
  );
  const filteredActivities = useMemo(() => {
    const normalized = activityQuery.trim().toLowerCase();
    if (!normalized) return taskActivities.slice(0, 30);
    return taskActivities
      .filter((activity) => `${activity.id} ${activity.name} ${activity.code ?? ''}`.toLowerCase().includes(normalized))
      .slice(0, 30);
  }, [activityQuery, taskActivities]);
  const selectedActivity = project.activities.find((activity) => activity.id === activityId);
  const progressActivity = project.activities.find((activity) => activity.id === progressActivityId);

  const controls = useMemo(() => {
    if (!schedule) return undefined;
    try { return calculateCostControl(project, schedule); }
    catch { return undefined; }
  }, [project, schedule]);
  const riskAnalysis = useMemo(() => {
    if (!schedule) return undefined;
    try { return analyzeRiskResources(project, schedule); }
    catch { return undefined; }
  }, [project, schedule]);
  const summary = useMemo(
    () => buildMobileWorkflowSummary(project, schedule, controls, riskAnalysis),
    [project, schedule, controls, riskAnalysis]
  );

  useEffect(() => {
    if (!dialogRef.current?.open) return;
    void refreshSnapshots();
  }, [project.id, project.revision]);

  useEffect(() => {
    if (!selectedActivity) return;
    setActivityName(selectedActivity.name);
    setActivityDuration(selectedActivity.duration);
    setActivityNotes(selectedActivity.notes ?? '');
  }, [selectedActivity]);

  useEffect(() => {
    if (!progressActivity) return;
    const progress = project.progress[progressActivity.id];
    setPercentComplete(progress?.percentComplete ?? 0);
    setRemainingDuration(progress?.remainingDuration ?? progressActivity.duration);
    setActualStart(progress?.actualStart ?? '');
    setActualFinish(progress?.actualFinish ?? '');
    setProgressNotes(progress?.notes ?? '');
  }, [progressActivity, project.progress]);

  function openHub(nextView: MobileWorkflowView = 'overview'): void {
    setView(nextView);
    dialogRef.current?.showModal();
    void recalculate();
    void refreshSnapshots();
  }

  async function recalculate(): Promise<void> {
    setIsCalculating(true);
    setScheduleError(undefined);
    const request = calculateScheduleInWorker({
      projectStartDate: project.metadata.startDate,
      defaultCalendarId: project.settings.defaultCalendarId,
      criticalFloatThresholdDays: project.settings.criticalFloatThresholdDays,
      nearCriticalFloatThresholdDays: project.settings.nearCriticalFloatThresholdDays,
      calendars: project.calendars,
      activities: project.activities,
      relationships: project.relationships
    }, project.revision);
    try {
      setSchedule(await request.result);
    } catch (error) {
      setScheduleError(error instanceof Error ? error.message : 'Unable to calculate the schedule.');
    } finally {
      setIsCalculating(false);
    }
  }

  async function refreshSnapshots(): Promise<void> {
    setSnapshots(await listProjectSnapshots(project.id));
  }

  async function persist(next: ProjectRecord, commandType: string, summaryText: string): Promise<void> {
    const saved = await saveProject(next, commandType, summaryText);
    onProjectChange(saved);
    setStatusMessage(summaryText);
  }

  async function saveActivity(): Promise<void> {
    if (!selectedActivity || activityDuration === undefined) return;
    const result = executeProjectCommand(project, {
      type: 'UPDATE_ACTIVITY',
      activityId: selectedActivity.id,
      changes: { name: activityName.trim() || selectedActivity.name, duration: activityDuration, notes: activityNotes }
    });
    await persist(result.project, 'MOBILE_ACTIVITY_UPDATE', `Updated ${selectedActivity.id} from mobile workflows.`);
  }

  async function saveProgress(): Promise<void> {
    if (!progressActivity || percentComplete === undefined || remainingDuration === undefined) return;
    const next = applyMobileProgressUpdate(project, progressActivity.id, {
      percentComplete,
      remainingDuration,
      actualStart: actualStart || undefined,
      actualFinish: actualFinish || undefined,
      notes: progressNotes
    });
    await persist(next, 'MOBILE_PROGRESS_UPDATE', `Recorded progress for ${progressActivity.id}.`);
  }

  async function saveRisk(): Promise<void> {
    const next = upsertMobileRisk(project, riskDraft);
    const savedRisk = next.riskResources.risks.find((item) => item.id === riskDraft.id)
      ?? next.riskResources.risks.at(-1);
    await persist(next, 'MOBILE_RISK_UPSERT', `Saved risk ${savedRisk?.title ?? 'record'}.`);
    if (savedRisk) setRiskDraft(savedRisk);
  }

  async function createSnapshot(): Promise<void> {
    const snapshot = await createProjectSnapshot(project, snapshotName || 'Mobile field snapshot');
    setStatusMessage(`Created snapshot ${snapshot.name}.`);
    await refreshSnapshots();
  }

  async function restoreSnapshot(snapshotId: string): Promise<void> {
    const restored = await restoreProjectSnapshot(snapshotId);
    onProjectChange(restored);
    setStatusMessage('Snapshot restored. An automatic recovery snapshot was created first.');
    await refreshSnapshots();
  }

  async function exportProject(): Promise<void> {
    const blob = await createProjectFile(project);
    downloadProjectFile(blob, `${project.name.replace(/[^a-z0-9-_]+/gi, '-')}-mobile-backup`);
    setStatusMessage('Portable project backup prepared.');
  }

  function beginNewRisk(): void {
    setRiskDraft({ ...EMPTY_RISK, id: crypto.randomUUID(), linkedActivityIds: activityId ? [activityId] : [] });
  }

  function selectRisk(riskId: string): void {
    const risk = project.riskResources.risks.find((item) => item.id === riskId);
    if (risk) setRiskDraft(structuredClone(risk));
  }

  return <>
    <button className="mobile-operations-launcher" type="button" onClick={() => openHub()} aria-label="Open mobile project workflows">
      <span aria-hidden="true">＋</span><strong>Field actions</strong>
    </button>
    <dialog className="mobile-operations-dialog" ref={dialogRef} aria-labelledby="mobile-operations-title">
      <div className="mobile-operations-shell">
        <header className="mobile-operations-header">
          <div><p className="eyebrow">Complete compact workflow</p><h2 id="mobile-operations-title">Mobile project controls</h2><p>{project.name}</p></div>
          <button className="icon-button" type="button" aria-label="Close mobile project workflows" onClick={() => dialogRef.current?.close()}>×</button>
        </header>
        <nav className="mobile-operations-tabs" aria-label="Mobile workflow sections">
          {([
            ['overview', 'Overview'], ['activity', 'Activity'], ['progress', 'Progress'], ['risk', 'Risk'], ['recovery', 'Backup']
          ] as Array<[MobileWorkflowView, string]>).map(([id, label]) => <button key={id} type="button" className={view === id ? 'active' : ''} aria-current={view === id ? 'page' : undefined} onClick={() => setView(id)}>{label}</button>)}
        </nav>
        <div className="mobile-operations-content">
          {view === 'overview' ? <section aria-labelledby="mobile-overview-title">
            <div className="mobile-workflow-heading"><div><p className="eyebrow">Decision snapshot</p><h3 id="mobile-overview-title">Project position</h3></div><button className="button button-small" type="button" disabled={isCalculating} onClick={() => void recalculate()}>{isCalculating ? 'Calculating…' : 'Refresh'}</button></div>
            {scheduleError ? <div className="notice notice-error" role="alert">{scheduleError}</div> : null}
            <div className="mobile-metric-grid">
              <MobileMetric label="Critical" value={summary.criticalCount.toLocaleString('en-US')} />
              <MobileMetric label="Near critical" value={summary.nearCriticalCount.toLocaleString('en-US')} />
              <MobileMetric label="Progress" value={`${summary.weightedProgress.toFixed(1)}%`} />
              <MobileMetric label="Open risks" value={summary.openRiskCount.toLocaleString('en-US')} />
              <MobileMetric label="BAC" value={formatCurrency(summary.bac, project.metadata.currency)} />
              <MobileMetric label="Risk exposure" value={formatCurrency(summary.riskCostExposure, project.metadata.currency)} />
              <MobileMetric label="SPI" value={formatIndex(summary.spi)} />
              <MobileMetric label="CPI" value={formatIndex(summary.cpi)} />
            </div>
            <div className="mobile-workflow-card"><h4>Milestone outlook</h4>{summary.nextMilestones.length ? <ul className="mobile-milestone-list">{summary.nextMilestones.map((milestone) => <li key={milestone.id}><span><strong>{milestone.name}</strong><small>{milestone.id}</small></span><time>{milestone.date || 'Unscheduled'}</time><em data-status={milestone.status}>{milestone.status}</em></li>)}</ul> : <p className="muted">No upcoming milestones are available.</p>}</div>
            <div className="mobile-quick-actions"><button className="button button-primary" type="button" onClick={() => setView('progress')}>Record progress</button><button className="button button-secondary" type="button" onClick={() => setView('risk')}>Add risk</button><button className="button button-secondary" type="button" onClick={() => void exportProject()}>Export project</button></div>
          </section> : null}

          {view === 'activity' ? <section aria-labelledby="mobile-activity-title">
            <div className="mobile-workflow-heading"><div><p className="eyebrow">Find and edit</p><h3 id="mobile-activity-title">Schedule activity</h3></div></div>
            <label className="mobile-field">Search activities<input value={activityQuery} onChange={(event) => setActivityQuery(event.target.value)} placeholder="ID, name, or code" /></label>
            <label className="mobile-field">Activity to edit<select value={activityId} onChange={(event) => setActivityId(event.target.value)}><option value="">Choose an activity…</option>{filteredActivities.map((activity) => <option key={activity.id} value={activity.id}>{activity.id} — {activity.name}</option>)}</select></label>
            {selectedActivity ? <div className="mobile-form-stack"><label className="mobile-field">Activity name<input value={activityName} onChange={(event) => setActivityName(event.target.value)} /></label><label className="mobile-field">Duration<NumericInput value={activityDuration} min={0} step="any" calculatorLabel="mobile activity duration" onValueChange={setActivityDuration} /></label><label className="mobile-field">Notes<textarea rows={4} value={activityNotes} onChange={(event) => setActivityNotes(event.target.value)} /></label><button className="button button-primary" type="button" disabled={activityDuration === undefined} onClick={() => void saveActivity()}>Save activity</button></div> : <div className="empty-state compact">Choose an activity to edit it without switching to desktop mode.</div>}
          </section> : null}

          {view === 'progress' ? <section aria-labelledby="mobile-progress-title">
            <div className="mobile-workflow-heading"><div><p className="eyebrow">Field update</p><h3 id="mobile-progress-title">Record progress</h3></div></div>
            <label className="mobile-field">Progress activity<select value={progressActivityId} onChange={(event) => setProgressActivityId(event.target.value)}><option value="">Choose an activity…</option>{taskActivities.map((activity) => <option key={activity.id} value={activity.id}>{activity.id} — {activity.name}</option>)}</select></label>
            {progressActivity ? <div className="mobile-form-stack"><label className="mobile-field">Percent complete<NumericInput value={percentComplete} min={0} max={100} step={1} calculatorLabel="mobile percent complete" onValueChange={(value) => setPercentComplete(value ?? 0)} /></label><label className="mobile-field">Remaining duration<NumericInput value={remainingDuration} min={0} step="any" calculatorLabel="mobile remaining duration" onValueChange={(value) => setRemainingDuration(value ?? 0)} /></label><div className="mobile-two-columns"><label className="mobile-field">Actual start<input type="date" value={actualStart} onChange={(event) => setActualStart(event.target.value)} /></label><label className="mobile-field">Actual finish<input type="date" value={actualFinish} onChange={(event) => setActualFinish(event.target.value)} /></label></div><label className="mobile-field">Field notes<textarea rows={4} value={progressNotes} onChange={(event) => setProgressNotes(event.target.value)} /></label><button className="button button-primary" type="button" disabled={percentComplete === undefined || remainingDuration === undefined} onClick={() => void saveProgress()}>Save progress update</button></div> : <div className="empty-state compact">Choose an activity to record status-date progress.</div>}
          </section> : null}

          {view === 'risk' ? <section aria-labelledby="mobile-risk-title">
            <div className="mobile-workflow-heading"><div><p className="eyebrow">Site exposure</p><h3 id="mobile-risk-title">Add or update risk</h3></div><button className="button button-small" type="button" onClick={beginNewRisk}>New risk</button></div>
            <label className="mobile-field">Existing risk<select value={project.riskResources.risks.some((item) => item.id === riskDraft.id) ? riskDraft.id : ''} onChange={(event) => event.target.value ? selectRisk(event.target.value) : beginNewRisk()}><option value="">New risk…</option>{project.riskResources.risks.map((risk) => <option key={risk.id} value={risk.id}>{risk.title}</option>)}</select></label>
            <div className="mobile-form-stack"><label className="mobile-field">Risk title<input value={riskDraft.title} onChange={(event) => setRiskDraft((current) => ({ ...current, title: event.target.value }))} /></label><div className="mobile-two-columns"><label className="mobile-field">Probability (%)<NumericInput value={riskDraft.probabilityPercent} min={0} max={100} step={1} calculatorLabel="risk probability" onValueChange={(value) => setRiskDraft((current) => ({ ...current, probabilityPercent: value ?? 0 }))} /></label><label className="mobile-field">Schedule impact (days)<NumericInput value={riskDraft.impactDays} min={0} step="any" calculatorLabel="risk schedule impact" onValueChange={(value) => setRiskDraft((current) => ({ ...current, impactDays: value ?? 0 }))} /></label></div><label className="mobile-field">Cost impact ({project.metadata.currency})<NumericInput value={riskDraft.impactCost} min={0} step="any" calculatorLabel="risk cost impact" onValueChange={(value) => setRiskDraft((current) => ({ ...current, impactCost: value ?? 0 }))} /></label><label className="mobile-field">Owner<input value={riskDraft.owner} onChange={(event) => setRiskDraft((current) => ({ ...current, owner: event.target.value }))} /></label><label className="mobile-field">Status<select value={riskDraft.status} onChange={(event) => setRiskDraft((current) => ({ ...current, status: event.target.value as RiskRecord['status'] }))}><option value="open">Open</option><option value="mitigating">Mitigating</option><option value="accepted">Accepted</option><option value="closed">Closed</option></select></label><label className="mobile-field">Linked activity<select value={riskDraft.linkedActivityIds[0] ?? ''} onChange={(event) => setRiskDraft((current) => ({ ...current, linkedActivityIds: event.target.value ? [event.target.value] : [] }))}><option value="">No linked activity</option>{taskActivities.map((activity) => <option key={activity.id} value={activity.id}>{activity.id} — {activity.name}</option>)}</select></label><label className="mobile-field">Response<textarea rows={4} value={riskDraft.response} onChange={(event) => setRiskDraft((current) => ({ ...current, response: event.target.value }))} /></label><button className="button button-primary" type="button" disabled={!riskDraft.title.trim()} onClick={() => void saveRisk()}>Save risk</button></div>
          </section> : null}

          {view === 'recovery' ? <section aria-labelledby="mobile-recovery-title">
            <div className="mobile-workflow-heading"><div><p className="eyebrow">Offline recovery</p><h3 id="mobile-recovery-title">Backup and restore</h3></div></div>
            <div className="mobile-form-stack"><label className="mobile-field">Mobile snapshot name<input value={snapshotName} onChange={(event) => setSnapshotName(event.target.value)} /></label><button className="button button-primary" type="button" onClick={() => void createSnapshot()}>Create snapshot</button><button className="button button-secondary" type="button" onClick={() => void exportProject()}>Export portable project</button></div>
            <div className="mobile-workflow-card"><h4>Snapshot history</h4>{snapshots.length ? <ul className="mobile-snapshot-list">{snapshots.map((snapshot) => <li key={snapshot.id}><span><strong>{snapshot.name}</strong><small>{new Date(snapshot.createdAt).toLocaleString('en-US')}</small></span><button className="button button-small" type="button" onClick={() => void restoreSnapshot(snapshot.id)}>Restore</button></li>)}</ul> : <p className="muted">No snapshots have been created yet.</p>}</div>
          </section> : null}
        </div>
        <footer className="mobile-operations-footer"><span role="status" aria-live="polite">{statusMessage}</span><button className="button button-secondary" type="button" onClick={() => dialogRef.current?.close()}>Done</button></footer>
      </div>
    </dialog>
  </>;
}

function MobileMetric({ label, value }: { label: string; value: string }) {
  return <div className="mobile-metric"><span>{label}</span><strong>{value}</strong></div>;
}

function formatCurrency(value: number, currency: string): string {
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value); }
  catch { return `${currency} ${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`; }
}

function formatIndex(value: number | null): string {
  return value === null ? '—' : value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
