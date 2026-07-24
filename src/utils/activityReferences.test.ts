import { describe, expect, it } from 'vitest';
import type { Activity, Relationship } from '../domain/schedule/types';
import {
  activityReferenceFromId,
  activityReferenceLabel,
  lagDescription,
  relationshipReferenceLabel,
  relationshipRuleLabel
} from './activityReferences';

const activities: Activity[] = [
  { id: 'A100', name: 'Site preparation', duration: 3, type: 'task', wbsId: 'WBS-1', calendarId: 'CAL-1' },
  { id: 'A110', name: 'Excavation', duration: 5, type: 'task', wbsId: 'WBS-1', calendarId: 'CAL-1' }
];

describe('activity reference usability helpers', () => {
  it('keeps the activity name primary while retaining the stable ID', () => {
    expect(activityReferenceLabel(activities[0])).toBe('Site preparation (A100)');
    expect(activityReferenceFromId(activities, 'A110')).toBe('Excavation (A110)');
  });

  it('makes missing references explicit instead of returning an opaque ID', () => {
    expect(activityReferenceFromId(activities, 'A999')).toBe('Missing activity (A999)');
  });

  it('explains relationship abbreviations and lead or lag direction', () => {
    expect(relationshipRuleLabel('FS', 0)).toBe('Finish to start (FS) · No lag or lead');
    expect(relationshipRuleLabel('SS', 2)).toBe('Start to start (SS) · 2 days lag');
    expect(lagDescription(-1)).toBe('1 day lead');
  });

  it('creates a complete relationship reference for accessible labels and lists', () => {
    const relationship: Relationship = { id: 'R-1', predecessorId: 'A100', successorId: 'A110', type: 'FS', lag: 0 };
    expect(relationshipReferenceLabel(relationship, activities)).toBe(
      'Site preparation (A100) → Excavation (A110) · Finish to start (FS) · No lag or lead'
    );
  });
});
