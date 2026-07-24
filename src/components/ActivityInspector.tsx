import type { Activity, ConstraintType } from '../domain/schedule/types';

interface ActivityInspectorProps {
  activity?: Activity;
  onUpdate: (activityId: string, changes: Partial<Activity>) => void;
}

const constraintOptions: Array<{ value: ConstraintType; label: string }> = [
  { value: 'ASAP', label: 'As soon as possible' },
  { value: 'START_NO_EARLIER_THAN', label: 'Start no earlier than' },
  { value: 'FINISH_NO_LATER_THAN', label: 'Finish no later than' },
  { value: 'MUST_START_ON', label: 'Must start on' },
  { value: 'MUST_FINISH_ON', label: 'Must finish on' }
];

export function ActivityInspector({ activity, onUpdate }: ActivityInspectorProps) {
  if (!activity) {
    return <aside className="surface inspector-panel"><div className="empty-state compact"><strong>No activity selected</strong><span>Select one row to edit constraints, deadline, code, and notes.</span></div></aside>;
  }
  const constraint = activity.constraint ?? { type: 'ASAP' as const };
  return (
    <aside className="surface inspector-panel" aria-labelledby="inspector-title">
      <div className="surface-heading"><div><p className="eyebrow">Activity details</p><h2 id="inspector-title">{activity.id}</h2></div></div>
      <div className="form-stack">
        <label>Code<input value={activity.code ?? ''} onChange={(event) => onUpdate(activity.id, { code: event.target.value })} /></label>
        <label>Constraint<select value={constraint.type} onChange={(event) => {
          const type = event.target.value as ConstraintType;
          onUpdate(activity.id, { constraint: type === 'ASAP' ? { type } : { type, date: constraint.date ?? new Date().toISOString().slice(0, 10) } });
        }}>{constraintOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        {constraint.type !== 'ASAP' ? <label>Constraint date<input type="date" value={constraint.date ?? ''} onChange={(event) => onUpdate(activity.id, { constraint: { ...constraint, date: event.target.value } })} /></label> : null}
        <label>Deadline<input type="date" value={activity.deadline ?? ''} onChange={(event) => onUpdate(activity.id, { deadline: event.target.value || undefined })} /></label>
        <label>Notes<textarea rows={5} value={activity.notes ?? ''} onChange={(event) => onUpdate(activity.id, { notes: event.target.value })} /></label>
      </div>
    </aside>
  );
}
