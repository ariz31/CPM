import type { Activity, Relationship, RelationshipType } from '../domain/schedule/types';

export const RELATIONSHIP_TYPE_LABELS: Record<RelationshipType, string> = {
  FS: 'Finish to start',
  SS: 'Start to start',
  FF: 'Finish to finish',
  SF: 'Start to finish'
};

export const RELATIONSHIP_TYPE_HELP: Record<RelationshipType, string> = {
  FS: 'The predecessor must finish before the successor can start.',
  SS: 'The predecessor must start before the successor can start.',
  FF: 'The predecessor must finish before the successor can finish.',
  SF: 'The predecessor must start before the successor can finish.'
};

export function activityReferenceLabel(activity: Pick<Activity, 'id' | 'name'>): string {
  const name = activity.name.trim() || 'Unnamed activity';
  return `${name} (${activity.id})`;
}

export function activityReferenceFromId(activities: Activity[], activityId: string): string {
  const activity = activities.find((candidate) => candidate.id === activityId);
  return activity ? activityReferenceLabel(activity) : `Missing activity (${activityId})`;
}

export function lagDescription(lag: number): string {
  if (lag === 0) return 'No lag or lead';
  const absoluteDays = Math.abs(lag);
  const unit = absoluteDays === 1 ? 'day' : 'days';
  return lag > 0 ? `${absoluteDays} ${unit} lag` : `${absoluteDays} ${unit} lead`;
}

export function relationshipRuleLabel(type: RelationshipType, lag: number): string {
  return `${RELATIONSHIP_TYPE_LABELS[type]} (${type}) · ${lagDescription(lag)}`;
}

export function relationshipReferenceLabel(relationship: Relationship, activities: Activity[]): string {
  return `${activityReferenceFromId(activities, relationship.predecessorId)} → ${activityReferenceFromId(activities, relationship.successorId)} · ${relationshipRuleLabel(relationship.type, relationship.lag)}`;
}
