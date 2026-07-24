import { useMemo, useState } from 'react';
import type { Activity, Relationship, RelationshipType } from '../domain/schedule/types';
import {
  RELATIONSHIP_TYPE_HELP,
  RELATIONSHIP_TYPE_LABELS,
  activityReferenceFromId,
  lagDescription,
  relationshipReferenceLabel
} from '../utils/activityReferences';
import { NumericInput } from './NumericInput';

interface RelationshipEditorProps {
  activities: Activity[];
  relationships: Relationship[];
  onAdd: (relationship: Relationship) => void;
  onDelete: (relationshipId: string) => void;
}

export function RelationshipEditor({ activities, relationships, onAdd, onDelete }: RelationshipEditorProps) {
  const initialPair = useMemo(() => findInitialRelationshipPair(activities, relationships), []);
  const [predecessorId, setPredecessorId] = useState(initialPair.predecessorId);
  const [successorId, setSuccessorId] = useState(initialPair.successorId);
  const [type, setType] = useState<RelationshipType>('FS');
  const [lag, setLag] = useState<number>();
  const effectiveLag = lag ?? 0;
  const activityById = useMemo(() => new Map(activities.map((activity) => [activity.id, activity])), [activities]);
  const effectivePredecessorId = activityById.has(predecessorId) ? predecessorId : activities[0]?.id ?? '';
  const effectiveSuccessorId = activityById.has(successorId) && successorId !== effectivePredecessorId
    ? successorId
    : findAvailableSuccessor(activities, relationships, effectivePredecessorId, type, effectiveLag);
  const hasPreview = Boolean(effectivePredecessorId && effectiveSuccessorId);
  const previewDescriptionId = hasPreview ? 'relationship-preview-help' : undefined;
  const isDuplicate = relationships.some((relationship) => isSameRelationship(relationship, effectivePredecessorId, effectiveSuccessorId, type, effectiveLag));
  const canAdd = activities.length >= 2
    && hasPreview
    && effectivePredecessorId !== effectiveSuccessorId
    && !isDuplicate;

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
          if (!canAdd) return;
          const relationship = { id: crypto.randomUUID(), predecessorId: effectivePredecessorId, successorId: effectiveSuccessorId, type, lag: effectiveLag };
          onAdd(relationship);
          const nextPredecessorId = effectiveSuccessorId;
          setPredecessorId(nextPredecessorId);
          setSuccessorId(findAvailableSuccessor(activities, [...relationships, relationship], nextPredecessorId, type, 0));
          setLag(undefined);
        }}
      >
        <label>
          Predecessor activity
          <select
            value={effectivePredecessorId}
            onChange={(event) => {
              const nextPredecessorId = event.target.value;
              setPredecessorId(nextPredecessorId);
              if (nextPredecessorId === effectiveSuccessorId) {
                setSuccessorId(findAvailableSuccessor(activities, relationships, nextPredecessorId, type, effectiveLag));
              }
            }}
            aria-describedby={previewDescriptionId}
          >
            {activities.map((activity) => <option key={activity.id} value={activity.id}>{activity.name} ({activity.id})</option>)}
          </select>
        </label>
        <label>
          Relationship type
          <select value={type} onChange={(event) => setType(event.target.value as RelationshipType)} aria-describedby={previewDescriptionId}>
            {(Object.keys(RELATIONSHIP_TYPE_LABELS) as RelationshipType[]).map((relationshipType) => (
              <option key={relationshipType} value={relationshipType}>{RELATIONSHIP_TYPE_LABELS[relationshipType]} ({relationshipType})</option>
            ))}
          </select>
        </label>
        <label>
          Lag / lead (days)
          <NumericInput
            step={0.25}
            value={lag}
            placeholder="0 if blank"
            calculatorLabel="relationship lag or lead"
            aria-describedby={previewDescriptionId}
            onValueChange={setLag}
          />
        </label>
        <label>
          Successor activity
          <select
            value={effectiveSuccessorId}
            onChange={(event) => setSuccessorId(event.target.value)}
            aria-describedby={previewDescriptionId}
          >
            {activities.map((activity) => <option key={activity.id} value={activity.id} disabled={activity.id === effectivePredecessorId}>{activity.name} ({activity.id})</option>)}
          </select>
        </label>
        <button className="button button-primary" type="submit" disabled={!canAdd}>Add relationship</button>
        {hasPreview ? (
          <div className="relationship-preview" id="relationship-preview-help" role="status">
            <span className="activity-reference">
              <strong>{activityById.get(effectivePredecessorId)?.name ?? 'Missing activity'}</strong>
              <small>{effectivePredecessorId}</small>
            </span>
            <span className="relationship-preview-arrow" aria-hidden="true">→</span>
            <span className="activity-reference">
              <strong>{activityById.get(effectiveSuccessorId)?.name ?? 'Missing activity'}</strong>
              <small>{effectiveSuccessorId}</small>
            </span>
            <p className="relationship-preview-copy">{RELATIONSHIP_TYPE_HELP[type]} {lagDescription(effectiveLag)}. Negative values are leads; positive values are lags.</p>
          </div>
        ) : null}
        {activities.length < 2 ? <p className="relationship-form-status">Add at least two activities before creating logic.</p> : null}
        {isDuplicate ? <p className="relationship-form-status">This exact relationship already exists.</p> : null}
      </form>
      <div className="relationship-list" role="list" aria-label="Current activity relationships">
        {relationships.map((relationship) => {
          const predecessor = activityById.get(relationship.predecessorId);
          const successor = activityById.get(relationship.successorId);
          const accessibleLabel = relationshipReferenceLabel(relationship, activities);
          return (
            <div className="relationship-row" role="listitem" key={relationship.id} aria-label={accessibleLabel}>
              <span className="activity-reference" title={activityReferenceFromId(activities, relationship.predecessorId)}>
                <strong>{predecessor?.name ?? 'Missing activity'}</strong>
                <small>{relationship.predecessorId}</small>
              </span>
              <span className="relationship-rule">
                <strong>{relationship.type}{relationship.lag === 0 ? '' : relationship.lag > 0 ? `+${relationship.lag}d` : `${relationship.lag}d`}</strong>
                <span>{RELATIONSHIP_TYPE_LABELS[relationship.type]} · {lagDescription(relationship.lag)}</span>
              </span>
              <span className="activity-reference" title={activityReferenceFromId(activities, relationship.successorId)}>
                <strong>{successor?.name ?? 'Missing activity'}</strong>
                <small>{relationship.successorId}</small>
              </span>
              <button className="icon-button" type="button" onClick={() => onDelete(relationship.id)} aria-label={`Delete ${accessibleLabel}`}>×</button>
            </div>
          );
        })}
        {relationships.length === 0 ? <div className="empty-state compact"><strong>No relationships yet</strong><span>Choose two activities and define how their starts or finishes depend on each other.</span></div> : null}
      </div>
    </section>
  );
}

function findInitialRelationshipPair(activities: Activity[], relationships: Relationship[]): { predecessorId: string; successorId: string } {
  for (const predecessor of activities) {
    const successorId = findAvailableSuccessor(activities, relationships, predecessor.id, 'FS', 0);
    if (successorId) return { predecessorId: predecessor.id, successorId };
  }
  return { predecessorId: activities[0]?.id ?? '', successorId: activities[1]?.id ?? '' };
}

function findAvailableSuccessor(
  activities: Activity[],
  relationships: Relationship[],
  predecessorId: string,
  type: RelationshipType,
  lag: number
): string {
  const predecessorIndex = activities.findIndex((activity) => activity.id === predecessorId);
  const candidates = predecessorIndex >= 0
    ? [...activities.slice(predecessorIndex + 1), ...activities.slice(0, predecessorIndex)]
    : activities;
  return candidates.find((activity) =>
    activity.id !== predecessorId
    && !relationships.some((relationship) => isSameRelationship(relationship, predecessorId, activity.id, type, lag))
  )?.id ?? '';
}

function isSameRelationship(
  relationship: Relationship,
  predecessorId: string,
  successorId: string,
  type: RelationshipType,
  lag: number
): boolean {
  return relationship.predecessorId === predecessorId
    && relationship.successorId === successorId
    && relationship.type === type
    && relationship.lag === lag;
}
