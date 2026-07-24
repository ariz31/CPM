import { describe, expect, it } from 'vitest';
import { createStandardCalendar } from '../calendar/calendar';
import { calculateSchedule } from './cpm';
import type { Activity, Relationship } from './types';

// PERF-P3-AT-001
describe('professional-scale CPM benchmark guard', () => {
  it('calculates a 10,000-activity chain within a generous CI safety budget', () => {
    const calendar = createStandardCalendar();
    const activities: Activity[] = Array.from({ length: 10_000 }, (_, index) => ({
      id: `A${String(index).padStart(4, '0')}`,
      name: `Activity ${index}`,
      duration: 1,
      type: 'task',
      wbsId: 'WBS',
      calendarId: calendar.id
    }));
    const relationships: Relationship[] = activities.slice(1).map((activity, index) => ({
      id: `R${index}`,
      predecessorId: activities[index].id,
      successorId: activity.id,
      type: 'FS',
      lag: 0
    }));
    const started = performance.now();
    const result = calculateSchedule({
      projectStartDate: '2026-01-05',
      defaultCalendarId: calendar.id,
      criticalFloatThresholdDays: 0,
      nearCriticalFloatThresholdDays: 5,
      calendars: [calendar],
      activities,
      relationships
    });
    const elapsed = performance.now() - started;
    expect(result.activities).toHaveLength(10_000);
    expect(elapsed).toBeLessThan(5_000);
  });
});
