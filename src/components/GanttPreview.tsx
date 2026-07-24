import type { CalculatedActivity } from '../domain/schedule/types';

interface GanttPreviewProps {
  activities: CalculatedActivity[];
  projectDuration: number;
}

export function GanttPreview({ activities, projectDuration }: GanttPreviewProps) {
  const denominator = Math.max(projectDuration, 1);

  return (
    <div className="gantt-panel" aria-label="Schedule timeline preview">
      <div className="gantt-scale" aria-hidden="true">
        <span>Day 0</span>
        <span>Day {Math.round(projectDuration / 2)}</span>
        <span>Day {projectDuration}</span>
      </div>
      <div className="gantt-rows">
        {activities.map((activity) => {
          const left = (activity.earlyStart / denominator) * 100;
          const width = activity.duration === 0 ? 1 : Math.max((activity.duration / denominator) * 100, 1.5);
          return (
            <div className="gantt-row" key={activity.id}>
              <span className="gantt-label">{activity.id}</span>
              <div className="gantt-track">
                <span
                  className={`gantt-bar ${activity.isCritical ? 'gantt-critical' : ''} ${activity.type === 'milestone' ? 'gantt-milestone' : ''}`}
                  style={{ left: `${left}%`, width: `${width}%` }}
                  title={`${activity.name}: day ${activity.earlyStart} to ${activity.earlyFinish}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
