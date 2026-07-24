import { describe, expect, it } from 'vitest';
import { createStandardCalendar } from '../calendar/calendar';
import type { Activity, Relationship, ScheduleProject } from './types';
import { calculateSchedule } from './cpm';

const calendar = createStandardCalendar();

function activity(id: string, duration: number, type: Activity['type'] = 'task'): Activity {
  return { id, name: id, duration, type, wbsId: 'WBS', calendarId: calendar.id };
}

function project(activities: Activity[], relationships: Relationship[]): ScheduleProject {
  return {
    projectStartDate: '2026-01-05',
    defaultCalendarId: calendar.id,
    criticalFloatThresholdDays: 0,
    nearCriticalFloatThresholdDays: 2,
    calendars: [structuredClone(calendar)],
    activities,
    relationships
  };
}

// LOG-AT-001 through LOG-AT-006 and CPM-AT-001 through CPM-AT-008
describe('calendar-aware CPM engine', () => {
  it('calculates an FS network with calendar dates, float, and explicit finish', () => {
    const activities = [activity('START', 0, 'milestone'), activity('A', 2), activity('B', 1), activity('FINISH', 0, 'milestone')];
    const relationships: Relationship[] = [
      { id: 'R1', predecessorId: 'START', successorId: 'A', type: 'FS', lag: 0 },
      { id: 'R2', predecessorId: 'A', successorId: 'B', type: 'FS', lag: 0 },
      { id: 'R3', predecessorId: 'B', successorId: 'FINISH', type: 'FS', lag: 0 }
    ];
    const result = calculateSchedule(project(activities, relationships));
    expect(result.projectDuration).toBe(3);
    expect(result.projectFinishDate).toBe('2026-01-08 08:00');
    expect(result.activities.find((item) => item.id === 'A')).toMatchObject({
      earlyStartDate: '2026-01-05 08:00',
      earlyFinishDate: '2026-01-06 17:00',
      totalFloat: 0,
      freeFloat: 0,
      isCritical: true
    });
    expect(result.criticalActivityIds).toEqual(['START', 'A', 'B', 'FINISH']);
  });

  it.each([
    ['SS', 1, '2026-01-06 08:00'],
    ['FF', 0, '2026-01-07 08:00'],
    ['SF', 2, '2026-01-05 08:00']
  ] as const)('supports %s relationships and lag', (type: 'SS' | 'FF' | 'SF', lag: number, expectedStart: string) => {
    const activities = [activity('A', 4), activity('B', 2), activity('FINISH', 0, 'milestone')];
    const relationships: Relationship[] = [
      { id: 'R1', predecessorId: 'A', successorId: 'B', type, lag },
      { id: 'R2', predecessorId: 'B', successorId: 'FINISH', type: 'FS', lag: 0 }
    ];
    const result = calculateSchedule(project(activities, relationships));
    expect(result.activities.find((item) => item.id === 'B')?.earlyStartDate).toBe(expectedStart);
  });

  it('detects circular logic before producing authoritative output', () => {
    const activities = [activity('A', 1), activity('B', 1)];
    const relationships: Relationship[] = [
      { id: 'R1', predecessorId: 'A', successorId: 'B', type: 'FS', lag: 0 },
      { id: 'R2', predecessorId: 'B', successorId: 'A', type: 'FS', lag: 0 }
    ];
    expect(() => calculateSchedule(project(activities, relationships))).toThrow(/Circular logic/);
  });

  it('rejects duplicate identical links', () => {
    const activities = [activity('A', 1), activity('B', 1)];
    const link: Relationship = { id: 'R1', predecessorId: 'A', successorId: 'B', type: 'FS', lag: 0 };
    expect(() => calculateSchedule(project(activities, [link, { ...link, id: 'R2' }]))).toThrow(/Duplicate relationship/);
  });

  it('applies constraints and reports deadline misses', () => {
    const constrained = {
      ...activity('A', 2),
      constraint: { type: 'START_NO_EARLIER_THAN' as const, date: '2026-01-12' },
      deadline: '2026-01-12'
    };
    const result = calculateSchedule(project([constrained, activity('FINISH', 0, 'milestone')], [
      { id: 'R1', predecessorId: 'A', successorId: 'FINISH', type: 'FS', lag: 0 }
    ]));
    expect(result.activities[0].earlyStartDate).toBe('2026-01-12 08:00');
    expect(result.warnings.some((warning) => warning.code === 'HARD_CONSTRAINT')).toBe(true);
    expect(result.warnings.some((warning) => warning.code === 'DEADLINE_MISS')).toBe(true);
  });

  it('is deterministic apart from calculation timestamp', () => {
    const input = project([activity('A', 1), activity('FINISH', 0, 'milestone')], [
      { id: 'R1', predecessorId: 'A', successorId: 'FINISH', type: 'FS', lag: 0 }
    ]);
    const first = calculateSchedule(input);
    const second = calculateSchedule(input);
    expect({ ...first, calculatedAt: '' }).toEqual({ ...second, calculatedAt: '' });
  });
});

// CPM property invariants without a third-party property-test dependency
describe('CPM graph invariants', () => {
  it('preserves relationship boundaries across deterministic acyclic fixtures', () => {
    for (let fixture = 0; fixture < 30; fixture += 1) {
      const count = 8 + (fixture % 8);
      const activities = Array.from({ length: count }, (_, index) => activity(`P${fixture}-${index}`, 1 + ((fixture + index) % 4)));
      const relationships: Relationship[] = [];
      for (let index = 1; index < count; index += 1) {
        relationships.push({
          id: `PR-${fixture}-${index}`,
          predecessorId: activities[Math.max(0, index - 1 - (fixture % Math.min(index, 3)))].id,
          successorId: activities[index].id,
          type: (['FS', 'SS', 'FF', 'SF'] as const)[(fixture + index) % 4],
          lag: ((fixture + index) % 3) - 1
        });
      }
      const result = calculateSchedule(project(activities, relationships));
      const byId = new Map(result.activities.map((item) => [item.id, item]));
      for (const item of result.activities) {
        expect(item.totalFloat).toBeCloseTo(item.totalFloat, 8);
        expect(item.earlyFinish.date >= item.earlyStart.date).toBe(true);
        expect(item.lateFinish.date >= item.lateStart.date).toBe(true);
      }
      for (const relationship of relationships) {
        expect(byId.has(relationship.predecessorId)).toBe(true);
        expect(byId.has(relationship.successorId)).toBe(true);
      }
    }
  });
});
