import type { Activity, CalculatedActivity } from '../domain/schedule/types';

interface ActivityTableProps {
  activities: Activity[];
  calculatedActivities: CalculatedActivity[];
  onDurationChange: (activityId: string, duration: number) => void;
}

export function ActivityTable({ activities, calculatedActivities, onDurationChange }: ActivityTableProps) {
  const calculatedById = new Map(calculatedActivities.map((activity) => [activity.id, activity]));

  return (
    <div className="table-scroll" tabIndex={0} aria-label="Schedule activities table">
      <table className="activity-table">
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Activity</th>
            <th scope="col">WBS</th>
            <th scope="col">Duration</th>
            <th scope="col">Early start</th>
            <th scope="col">Early finish</th>
            <th scope="col">Total float</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((activity) => {
            const calculated = calculatedById.get(activity.id);
            return (
              <tr key={activity.id} className={calculated?.isCritical ? 'critical-row' : undefined}>
                <td><span className="activity-id">{activity.id}</span></td>
                <td>{activity.name}</td>
                <td>{activity.wbs}</td>
                <td>
                  <label className="sr-only" htmlFor={`duration-${activity.id}`}>
                    Duration for {activity.name}
                  </label>
                  <input
                    id={`duration-${activity.id}`}
                    className="duration-input"
                    type="number"
                    min={0}
                    step={1}
                    value={activity.duration}
                    disabled={activity.type === 'milestone'}
                    onChange={(event) => onDurationChange(activity.id, Number(event.target.value))}
                  />
                </td>
                <td>{calculated?.earlyStart ?? '—'}</td>
                <td>{calculated?.earlyFinish ?? '—'}</td>
                <td>{calculated?.totalFloat ?? '—'}</td>
                <td>
                  <span className={calculated?.isCritical ? 'pill pill-critical' : 'pill'}>
                    {calculated?.isCritical ? 'Critical' : 'Available float'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
