import { describe, expect, it } from 'vitest';
import {
  addCalendarDays,
  addWorkingMinutes,
  createStandardCalendar,
  getWorkIntervals,
  isWorkingDate,
  normalizeForward,
  subtractWorkingMinutes,
  workingMinutesBetween
} from './calendar';

// CAL-AT-001 through CAL-AT-005
describe('work calendar engine', () => {
  it('applies split shifts without counting the lunch break', () => {
    const calendar = createStandardCalendar();
    const finish = addWorkingMinutes(calendar, { date: '2026-01-05', minute: 8 * 60 }, 8 * 60);
    expect(finish).toEqual({ date: '2026-01-05', minute: 17 * 60 });
    expect(workingMinutesBetween(calendar, { date: '2026-01-05', minute: 8 * 60 }, finish)).toBe(480);
  });

  it('skips weekends, holidays, and non-working exceptions', () => {
    const calendar = createStandardCalendar();
    calendar.holidays = ['2026-01-06'];
    calendar.exceptions = [{ date: '2026-01-07', working: false, name: 'Site closure' }];
    const finish = addWorkingMinutes(calendar, { date: '2026-01-05', minute: 8 * 60 }, 16 * 60);
    expect(finish).toEqual({ date: '2026-01-08', minute: 17 * 60 });
    expect(isWorkingDate(calendar, '2026-01-06')).toBe(false);
    expect(getWorkIntervals(calendar, '2026-01-07')).toEqual([]);
  });

  it('uses a working exception on a normally non-working day', () => {
    const calendar = createStandardCalendar();
    calendar.exceptions = [{
      date: '2026-01-10',
      working: true,
      intervals: [{ startMinute: 9 * 60, endMinute: 13 * 60 }],
      name: 'Saturday recovery shift'
    }];
    expect(normalizeForward(calendar, { date: '2026-01-10', minute: 0 })).toEqual({ date: '2026-01-10', minute: 9 * 60 });
  });

  it('handles leap-year date arithmetic without local timezone drift', () => {
    expect(addCalendarDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addCalendarDays('2028-02-29', 1)).toBe('2028-03-01');
  });

  it('subtracts working time through split shifts and weekends', () => {
    const calendar = createStandardCalendar();
    const start = subtractWorkingMinutes(calendar, { date: '2026-01-12', minute: 8 * 60 }, 8 * 60);
    expect(start).toEqual({ date: '2026-01-09', minute: 8 * 60 });
  });
});
