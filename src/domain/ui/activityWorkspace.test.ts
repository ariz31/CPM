import { describe, expect, it } from 'vitest';
import type { Activity } from '../schedule/types';
import {
  createFillDownUpdates,
  filterAndSortActivities,
  normalizeActivityColumnKeys,
  parseClipboardUpdates
} from './activityWorkspace';

const activity = (id: string, name: string, duration: number, wbsId = 'wbs-1'): Activity => ({
  id,
  name,
  duration,
  type: 'task',
  wbsId,
  calendarId: 'calendar-1',
  audit: { createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', source: 'manual' }
});

describe('activity workspace model', () => {
  it('retains required pinned columns and rejects unknown column keys', () => {
    expect(normalizeActivityColumnKeys(['duration', 'unknown', 'name'])).toEqual(['select', 'id', 'name', 'duration']);
    expect(normalizeActivityColumnKeys(null)).toContain('status');
  });

  it('filters across names, identifiers, notes, and WBS codes and sorts naturally', () => {
    const activities = [
      { ...activity('A-10', 'Install doors', 3, 'wbs-2'), notes: 'Level 2' },
      activity('A-2', 'Excavate foundations', 5, 'wbs-1')
    ];
    const wbsCodes = new Map([['wbs-1', '1.1'], ['wbs-2', '2.1']]);
    expect(filterAndSortActivities(activities, 'level 2', 'id', 'asc', wbsCodes).map((item) => item.id)).toEqual(['A-10']);
    expect(filterAndSortActivities(activities, '', 'id', 'asc', wbsCodes).map((item) => item.id)).toEqual(['A-2', 'A-10']);
  });

  it('parses spreadsheet clipboard rows into safe editable activity changes', () => {
    const activities = [activity('A-1', 'One', 2), activity('A-2', 'Two', 4)];
    const updates = parseClipboardUpdates(
      'Replacement name\t7\nSecond replacement\t9',
      ['select', 'id', 'name', 'duration'],
      'name',
      activities,
      0
    );
    expect(updates).toEqual([
      { activityId: 'A-1', changes: { name: 'Replacement name', duration: 7 } },
      { activityId: 'A-2', changes: { name: 'Second replacement', duration: 9 } }
    ]);
  });

  it('creates deterministic fill-down changes from the first selected activity', () => {
    const activities = [activity('A-1', 'Source', 2), activity('A-2', 'Target', 4), activity('A-3', 'Other', 6)];
    const updates = createFillDownUpdates(activities, new Set(['A-1', 'A-2']), 'duration');
    expect(updates).toEqual([{ activityId: 'A-2', changes: { duration: 2 } }]);
  });
});
