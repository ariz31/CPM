import { useEffect, useState } from 'react';
import { calculateScheduleInWorker } from '../application/scheduleWorkerClient';
import type { ScheduleResult } from '../domain/schedule/types';
import { saveProject, type ProjectRecord } from '../infrastructure/projectRepository';
import { ActivityTable } from './ActivityTable';
import { GanttPreview } from './GanttPreview';
import { MetricCard } from './MetricCard';

interface ScheduleWorkspaceProps {
  project: ProjectRecord;
  onBack: () => void;
  onProjectChange: (project: ProjectRecord) => void;
}

export function ScheduleWorkspace({ project, onBack, onProjectChange }: ScheduleWorkspaceProps) {
  const [result, setResult] = useState<ScheduleResult>();
  const [calculationError, setCalculationError] = useState<string>();
  const [isCalculating, setIsCalculating] = useState(true);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'failed'>('saved');

  useEffect(() => {
    let active = true;
    setIsCalculating(true);
    setCalculationError(undefined);

    void calculateScheduleInWorker({ activities: project.activities, relationships: project.relationships })
      .then((nextResult) => {
        if (active) {
          setResult(nextResult);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setCalculationError(error instanceof Error ? error.message : 'Unable to calculate this schedule.');
        }
      })
      .finally(() => {
        if (active) {
          setIsCalculating(false);
        }
      });

    return () => {
      active = false;
    };
  }, [project.activities, project.relationships]);

  async function handleDurationChange(activityId: string, duration: number): Promise<void> {
    if (!Number.isFinite(duration) || duration < 0) {
      return;
    }

    const updatedProject: ProjectRecord = {
      ...project,
      activities: project.activities.map((activity) =>
        activity.id === activityId ? { ...activity, duration } : activity
      )
    };

    onProjectChange(updatedProject);
    setSaveState('saving');

    try {
      const saved = await saveProject(updatedProject);
      onProjectChange(saved);
      setSaveState('saved');
    } catch {
      setSaveState('failed');
    }
  }

  const criticalCount = result?.criticalActivityIds.length ?? 0;
  const warningCount = result?.warnings.length ?? 0;

  return (
    <main className="workspace-shell">
      <header className="workspace-header">
        <div className="workspace-title-group">
          <button className="back-button" type="button" onClick={onBack} aria-label="Return to project library">
            ←
          </button>
          <div>
            <p className="eyebrow">Schedule workspace</p>
            <h1>{project.name}</h1>
          </div>
        </div>
        <div className={`save-indicator save-${saveState}`} role="status">
          <span aria-hidden="true" />
          {saveState === 'saved' ? 'Saved locally' : saveState === 'saving' ? 'Saving…' : 'Save failed'}
        </div>
      </header>

      <section className="metric-grid" aria-label="Project schedule metrics">
        <MetricCard label="Project duration" value={result ? `${result.projectDuration}d` : '—'} detail="Calculated working days" />
        <MetricCard label="Activities" value={project.activities.length} detail={`${project.relationships.length} logic relationships`} />
        <MetricCard label="Critical activities" value={criticalCount} detail="Total float ≤ 0" tone="critical" />
        <MetricCard label="Schedule warnings" value={warningCount} detail="Open ends, leads, or float issues" tone={warningCount > 0 ? 'warning' : 'default'} />
      </section>

      {calculationError ? <div className="notice notice-error" role="alert">{calculationError}</div> : null}
      {isCalculating ? <div className="notice" role="status">Recalculating in a dedicated worker…</div> : null}

      <section className="workspace-grid">
        <article className="surface schedule-surface">
          <div className="surface-heading">
            <div>
              <p className="eyebrow">Authoritative inputs and dates</p>
              <h2>Activity schedule</h2>
            </div>
            <span className="engine-badge">Engine {result?.engineVersion ?? '—'}</span>
          </div>
          <ActivityTable
            activities={project.activities}
            calculatedActivities={result?.activities ?? []}
            onDurationChange={(activityId, duration) => void handleDurationChange(activityId, duration)}
          />
        </article>

        <article className="surface timeline-surface">
          <div className="surface-heading">
            <div>
              <p className="eyebrow">Early-date plan</p>
              <h2>Timeline preview</h2>
            </div>
          </div>
          <GanttPreview activities={result?.activities ?? []} projectDuration={result?.projectDuration ?? 0} />
        </article>
      </section>
    </main>
  );
}
