import type { CalculatedActivity } from '../domain/schedule/types';

interface GanttPreviewProps {
  activities: CalculatedActivity[];
  projectDuration: number;
}

export function GanttPreview({ activities, projectDuration }: GanttPreviewProps) {
  const denominator = Math.max(projectDuration, 1);
  return (
    <div className="gantt-panel" aria-label="Calendar-aware early-date timeline">
      <div className="gantt-scale" aria-hidden="true"><span>Start</span><span>{Math.round(projectDuration / 2)}d</span><span>{projectDuration}d</span></div>
      <div className="gantt-rows">
        {activities.filter((activity) => activity.type !== 'summary').map((activity) => {
          const left = (activity.earlyStartOffsetDays / denominator) * 100;
          const width = activity.duration === 0 ? 0.9 : Math.max((activity.duration / denominator) * 100, 1.5);
          return (
            <div className="gantt-row" key={activity.id}>
              <span className="gantt-label">{activity.id}</span>
              <div className="gantt-track">
                <span
                  className={`gantt-bar ${activity.isCritical ? 'gantt-critical' : activity.isNearCritical ? 'gantt-near-critical' : ''} ${activity.type === 'milestone' ? 'gantt-milestone' : ''}`}
                  style={{ left: `${Math.max(0, left)}%`, width: `${width}%` }}
                  title={`${activity.name}: ${activity.earlyStartDate} to ${activity.earlyFinishDate}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
