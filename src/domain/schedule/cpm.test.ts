import { describe, expect, it } from 'vitest';
import { calculateSchedule } from './cpm';
import { type ScheduleProject, ScheduleValidationError } from './types';

function activity(id: string, duration: number) {
  return { id, name: id, duration, type: duration === 0 ? 'milestone' as const : 'task' as const, wbs: '1' };
}

describe('CPM engine', () => {
  it('[CPM-001][CPM-002][CPM-003] calculates a finish-to-start critical chain', () => {
    const project: ScheduleProject = {
      activities: [activity('A', 2), activity('B', 3), activity('C', 1)],
      relationships: [
        { id: 'R1', predecessorId: 'A', successorId: 'B', type: 'FS', lag: 0 },
        { id: 'R2', predecessorId: 'B', successorId: 'C', type: 'FS', lag: 0 }
      ]
    };

    const result = calculateSchedule(project);

    expect(result.projectDuration).toBe(6);
    expect(result.activities.map(({ id, earlyStart, earlyFinish, totalFloat }) => ({ id, earlyStart, earlyFinish, totalFloat }))).toEqual([
      { id: 'A', earlyStart: 0, earlyFinish: 2, totalFloat: 0 },
      { id: 'B', earlyStart: 2, earlyFinish: 5, totalFloat: 0 },
      { id: 'C', earlyStart: 5, earlyFinish: 6, totalFloat: 0 }
    ]);
  });

  it('[LOG-001][LOG-002] supports SS, FF, and SF relationship boundaries', () => {
    const project: ScheduleProject = {
      activities: [activity('A', 5), activity('B', 3), activity('C', 2), activity('D', 1)],
      relationships: [
        { id: 'SS', predecessorId: 'A', successorId: 'B', type: 'SS', lag: 2 },
        { id: 'FF', predecessorId: 'A', successorId: 'C', type: 'FF', lag: 1 },
        { id: 'SF', predecessorId: 'B', successorId: 'D', type: 'SF', lag: 4 }
      ]
    };

    const result = calculateSchedule(project);
    const byId = new Map(result.activities.map((item) => [item.id, item]));

    expect(byId.get('B')?.earlyStart).toBe(2);
    expect(byId.get('C')?.earlyStart).toBe(4);
    expect(byId.get('D')?.earlyStart).toBe(5);
  });

  it('[LOG-004] rejects circular logic', () => {
    const project: ScheduleProject = {
      activities: [activity('A', 1), activity('B', 1)],
      relationships: [
        { id: 'R1', predecessorId: 'A', successorId: 'B', type: 'FS', lag: 0 },
        { id: 'R2', predecessorId: 'B', successorId: 'A', type: 'FS', lag: 0 }
      ]
    };

    expect(() => calculateSchedule(project)).toThrow(ScheduleValidationError);
  });

  it('[CPM-008][AUD-002] is deterministic for identical input', () => {
    const project: ScheduleProject = {
      activities: [activity('A', 2), activity('B', 4)],
      relationships: [{ id: 'R1', predecessorId: 'A', successorId: 'B', type: 'FS', lag: 1 }]
    };

    const first = calculateSchedule(project);
    const second = calculateSchedule(project);

    expect(first.activities).toEqual(second.activities);
    expect(first.projectDuration).toBe(second.projectDuration);
    expect(first.criticalActivityIds).toEqual(second.criticalActivityIds);
  });
});
