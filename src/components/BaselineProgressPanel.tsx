import { useMemo, useState } from 'react';
import {
  addBaseline,
  addProgressUpdateSnapshot,
  analyzeProgress,
  createBaseline,
  createDefaultProgress,
  createProgressUpdateSnapshot,
  updateActivityProgress
} from '../domain/progress/progress';
import type { ProgressMethod } from '../domain/progress/types';
import type { ProjectRecord } from '../domain/project/types';
import type { ScheduleResult } from '../domain/schedule/types';
import { NumericInput } from './NumericInput';

interface BaselineProgressPanelProps {
  project: ProjectRecord;
  result?: ScheduleResult;
  onReplace: (project: ProjectRecord) => void;
}

export function BaselineProgressPanel({ project, result, onReplace }: BaselineProgressPanelProps) {
  const [filter, setFilter] = useState<'all' | 'not-started' | 'in-progress' | 'complete' | 'out-of-sequence'>('all');
  const summary = useMemo(() => result ? analyzeProgress(project, result) : undefined, [project, result]);
  const analysisById = useMemo(() => new Map(summary?.activities.map((activity) => [activity.activityId, activity]) ?? []), [summary]);
  const visibleActivities = project.activities.filter((activity) => {
    const analysis = analysisById.get(activity.id);
    if (filter === 'all') return true;
    if (filter === 'out-of-sequence') return analysis?.isOutOfSequence;
    return analysis?.state === filter;
  });

  function createNewBaseline(kind: 'original' | 'revised'): void {
    if (!result) return;
    const name = window.prompt('Baseline name', kind === 'original' ? 'Original baseline' : `Revised baseline ${project.baselines.length + 1}`);
    if (!name) return;
    onReplace(addBaseline(project, createBaseline(project, result, name, kind)));
  }

  function createWeeklySnapshot(): void {
    const name = window.prompt('Update snapshot name', `Update ${project.statusDate}`);
    if (!name) return;
    onReplace(addProgressUpdateSnapshot(project, createProgressUpdateSnapshot(project, name)));
  }

  return (
    <section className="surface phase-surface" aria-labelledby="progress-title">
      <div className="surface-heading phase-toolbar"><div><p className="eyebrow">Status-date control and reproducible updates</p><h2 id="progress-title">Baselines and progress</h2></div><div className="toolbar-group wrap"><label>Status date<input type="date" value={project.statusDate} onChange={(event) => onReplace({ ...project, statusDate: event.target.value })} /></label><button className="button button-primary" type="button" disabled={!result} onClick={() => createNewBaseline(project.baselines.length === 0 ? 'original' : 'revised')}>Create baseline</button><button className="button button-secondary" type="button" onClick={createWeeklySnapshot}>Capture weekly update</button></div></div>
      <div className="progress-metrics">
        <article><span>Overall complete</span><strong>{summary?.overallPercentComplete ?? 0}%</strong></article>
        <article><span>In progress</span><strong>{summary?.inProgressCount ?? 0}</strong></article>
        <article><span>Complete</span><strong>{summary?.completeCount ?? 0}</strong></article>
        <article className={(summary?.outOfSequenceCount ?? 0) > 0 ? 'warning-card' : ''}><span>Out of sequence</span><strong>{summary?.outOfSequenceCount ?? 0}</strong></article>
      </div>
      <div className="phase-toolbar secondary-toolbar">
        <label>Active baseline<select value={project.activeBaselineId ?? ''} onChange={(event) => onReplace({ ...project, activeBaselineId: event.target.value || undefined })}><option value="">No active baseline</option>{project.baselines.map((baseline) => <option key={baseline.id} value={baseline.id}>{baseline.name} · rev {baseline.projectRevision}</option>)}</select></label>
        <label>Rows<select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}><option value="all">All</option><option value="not-started">Not started</option><option value="in-progress">In progress</option><option value="complete">Complete</option><option value="out-of-sequence">Out of sequence</option></select></label>
        <span className="muted">{project.updateSnapshots.length} update snapshots · {project.baselines.length} baselines</span>
      </div>
      <div className="report-table-scroll" tabIndex={0} aria-label="Scrollable activity progress table"><table className="report-table progress-table"><thead><tr><th>Activity</th><th>Method</th><th>Actual start</th><th>Actual finish</th><th>Remaining</th><th>Physical / units</th><th>% complete</th><th>Forecast finish</th><th>Baseline variance</th><th>OOS rule</th></tr></thead><tbody>{visibleActivities.map((activity) => {
        const progress = project.progress[activity.id] ?? createDefaultProgress(activity, project.updatedAt);
        const analysis = analysisById.get(activity.id);
        return <tr key={activity.id} className={analysis?.isOutOfSequence ? 'warning-row' : ''}><td><strong>{activity.id}</strong><br /><span>{activity.name}</span></td><td><select value={progress.method} onChange={(event) => onReplace(updateActivityProgress(project, activity.id, { method: event.target.value as ProgressMethod }))}><option value="duration">Duration</option><option value="physical">Physical</option><option value="units">Units</option><option value="milestone">Milestone</option></select></td><td><input type="date" value={progress.actualStart ?? ''} onChange={(event) => onReplace(updateActivityProgress(project, activity.id, { actualStart: event.target.value || undefined }))} /></td><td><input type="date" value={progress.actualFinish ?? ''} onChange={(event) => onReplace(updateActivityProgress(project, activity.id, { actualFinish: event.target.value || undefined }))} /></td><td><NumericInput value={progress.remainingDuration} min={0} step={0.25} calculatorLabel={`remaining duration for ${activity.id}`} aria-label={`Remaining duration for ${activity.id}`} onValueChange={(remainingDuration) => { if (remainingDuration !== undefined) onReplace(updateActivityProgress(project, activity.id, { remainingDuration })); }} /></td><td>{progress.method === 'physical' ? <NumericInput value={progress.physicalPercent} min={0} max={100} step={0.1} calculatorLabel={`physical progress for ${activity.id}`} aria-label={`Physical progress percentage for ${activity.id}`} onValueChange={(physicalPercent) => onReplace(updateActivityProgress(project, activity.id, { physicalPercent }))} /> : progress.method === 'units' ? <span className="inline-fields"><NumericInput value={progress.unitsComplete} min={0} calculatorLabel={`completed units for ${activity.id}`} aria-label={`Completed units for ${activity.id}`} onValueChange={(unitsComplete) => onReplace(updateActivityProgress(project, activity.id, { unitsComplete }))} /><span>/</span><NumericInput value={progress.totalUnits} min={0} calculatorLabel={`total units for ${activity.id}`} aria-label={`Total units for ${activity.id}`} onValueChange={(totalUnits) => onReplace(updateActivityProgress(project, activity.id, { totalUnits }))} /></span> : '—'}</td><td><strong>{analysis?.percentComplete ?? progress.percentComplete}%</strong></td><td>{analysis?.forecastFinish ?? '—'}</td><td>{analysis?.baselineFinishVarianceDays === undefined ? '—' : `${analysis.baselineFinishVarianceDays > 0 ? '+' : ''}${analysis.baselineFinishVarianceDays}d`}</td><td><select value={progress.outOfSequenceMode} onChange={(event) => onReplace(updateActivityProgress(project, activity.id, { outOfSequenceMode: event.target.value as typeof progress.outOfSequenceMode }))}><option value="retained-logic">Retained logic</option><option value="progress-override">Progress override</option></select>{analysis?.isOutOfSequence ? <span className="pill pill-warning">Out of sequence</span> : null}</td></tr>;
      })}</tbody></table></div>
    </section>
  );
}
