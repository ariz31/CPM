import { useState } from 'react';
import type { Activity, Relationship, RelationshipType } from '../domain/schedule/types';
import { NumericInput } from './NumericInput';

interface RelationshipEditorProps {
  activities: Activity[];
  relationships: Relationship[];
  onAdd: (relationship: Relationship) => void;
  onDelete: (relationshipId: string) => void;
}

export function RelationshipEditor({ activities, relationships, onAdd, onDelete }: RelationshipEditorProps) {
  const [predecessorId, setPredecessorId] = useState(activities[0]?.id ?? '');
  const [successorId, setSuccessorId] = useState(activities[1]?.id ?? activities[0]?.id ?? '');
  const [type, setType] = useState<RelationshipType>('FS');
  const [lag, setLag] = useState<number>();

  return (
    <section className="surface panel-stack" aria-labelledby="logic-title">
      <div className="surface-heading">
        <div>
          <p className="eyebrow">Network logic</p>
          <h2 id="logic-title">Relationships</h2>
        </div>
        <span className="count-badge">{relationships.length}</span>
      </div>
      <form
        className="inline-form relationship-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!predecessorId || !successorId || predecessorId === successorId) return;
          onAdd({ id: crypto.randomUUID(), predecessorId, successorId, type, lag: lag ?? 0 });
          setLag(undefined);
        }}
      >
        <label>Predecessor<select value={predecessorId} onChange={(event) => setPredecessorId(event.target.value)}>{activities.map((activity) => <option key={activity.id} value={activity.id}>{activity.id}</option>)}</select></label>
        <label>Type<select value={type} onChange={(event) => setType(event.target.value as RelationshipType)}><option>FS</option><option>SS</option><option>FF</option><option>SF</option></select></label>
        <label>Lag (days)<NumericInput step={0.25} value={lag} placeholder="0 if blank" calculatorLabel="relationship lag" onValueChange={setLag} /></label>
        <label>Successor<select value={successorId} onChange={(event) => setSuccessorId(event.target.value)}>{activities.map((activity) => <option key={activity.id} value={activity.id}>{activity.id}</option>)}</select></label>
        <button className="button button-primary" type="submit">Add link</button>
      </form>
      <div className="relationship-list" role="list">
        {relationships.map((relationship) => (
          <div className="relationship-row" role="listitem" key={relationship.id}>
            <span className="activity-id">{relationship.predecessorId}</span>
            <strong>{relationship.type}{relationship.lag === 0 ? '' : relationship.lag > 0 ? `+${relationship.lag}d` : `${relationship.lag}d`}</strong>
            <span className="activity-id">{relationship.successorId}</span>
            <button className="icon-button" type="button" onClick={() => onDelete(relationship.id)} aria-label={`Delete relationship ${relationship.id}`}>×</button>
          </div>
        ))}
      </div>
    </section>
  );
}
