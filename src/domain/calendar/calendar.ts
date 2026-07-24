import type { CalendarValidationIssue, WorkCalendar, WorkInstant, WorkInterval } from './types';

const MINUTES_PER_DAY = 1_440;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function createStandardCalendar(
  id = 'CAL-DEFAULT',
  name = 'Standard 5-day calendar',
  timezone = 'UTC'
): WorkCalendar {
  const fullDay: WorkInterval[] = [
    { startMinute: 8 * 60, endMinute: 12 * 60 },
    { startMinute: 13 * 60, endMinute: 17 * 60 }
  ];

  return {
    id,
    name,
    timezone,
    standardMinutesPerDay: 8 * 60,
    week: {
      0: [],
      1: fullDay,
      2: fullDay,
      3: fullDay,
      4: fullDay,
      5: fullDay,
      6: []
    },
    holidays: [],
    exceptions: []
  };
}

export function validateCalendar(calendar: WorkCalendar): CalendarValidationIssue[] {
  const issues: CalendarValidationIssue[] = [];

  if (!calendar.id.trim()) issues.push({ code: 'CALENDAR_ID_REQUIRED', message: 'Calendar ID is required.' });
  if (!calendar.name.trim()) issues.push({ code: 'CALENDAR_NAME_REQUIRED', message: 'Calendar name is required.' });
  if (!Number.isInteger(calendar.standardMinutesPerDay) || calendar.standardMinutesPerDay <= 0) {
    issues.push({ code: 'INVALID_STANDARD_DAY', message: 'Standard minutes per day must be a positive integer.' });
  }

  for (let day = 0; day <= 6; day += 1) {
    const intervals = calendar.week[day] ?? [];
    validateIntervals(intervals, `weekday ${day}`, issues);
  }

  for (const holiday of calendar.holidays) {
    if (!DATE_PATTERN.test(holiday)) issues.push({ code: 'INVALID_HOLIDAY', message: `Invalid holiday date: ${holiday}` });
  }

  for (const exception of calendar.exceptions) {
    if (!DATE_PATTERN.test(exception.date)) {
      issues.push({ code: 'INVALID_EXCEPTION_DATE', message: `Invalid exception date: ${exception.date}` });
    }
    if (exception.working) validateIntervals(exception.intervals ?? [], exception.date, issues);
  }

  return issues;
}

function validateIntervals(
  intervals: WorkInterval[],
  context: string,
  issues: CalendarValidationIssue[]
): void {
  const ordered = [...intervals].sort((left, right) => left.startMinute - right.startMinute);
  let previousEnd = -1;
  for (const interval of ordered) {
    if (
      !Number.isInteger(interval.startMinute) ||
      !Number.isInteger(interval.endMinute) ||
      interval.startMinute < 0 ||
      interval.endMinute > MINUTES_PER_DAY ||
      interval.startMinute >= interval.endMinute
    ) {
      issues.push({ code: 'INVALID_INTERVAL', message: `Invalid work interval in ${context}.` });
      continue;
    }
    if (interval.startMinute < previousEnd) {
      issues.push({ code: 'OVERLAPPING_INTERVAL', message: `Overlapping work intervals in ${context}.` });
    }
    previousEnd = Math.max(previousEnd, interval.endMinute);
  }
}

export function getWorkIntervals(calendar: WorkCalendar, date: string): WorkInterval[] {
  const exception = calendar.exceptions.find((item) => item.date === date);
  if (exception) return exception.working ? normalizeIntervals(exception.intervals ?? []) : [];
  if (calendar.holidays.includes(date)) return [];
  const weekday = weekdayOf(date);
  return normalizeIntervals(calendar.week[weekday] ?? []);
}

export function isWorkingDate(calendar: WorkCalendar, date: string): boolean {
  return getWorkIntervals(calendar, date).length > 0;
}

export function workingMinutesOnDate(calendar: WorkCalendar, date: string): number {
  return getWorkIntervals(calendar, date).reduce(
    (total, interval) => total + interval.endMinute - interval.startMinute,
    0
  );
}

export function normalizeForward(calendar: WorkCalendar, instant: WorkInstant): WorkInstant {
  let current = clampInstant(instant);
  for (let guard = 0; guard < 3_700; guard += 1) {
    const intervals = getWorkIntervals(calendar, current.date);
    for (const interval of intervals) {
      if (current.minute <= interval.startMinute) return { date: current.date, minute: interval.startMinute };
      if (current.minute < interval.endMinute) return current;
    }
    current = { date: addCalendarDays(current.date, 1), minute: 0 };
  }
  throw new Error(`Calendar ${calendar.id} has no reachable working time.`);
}

export function normalizeBackward(calendar: WorkCalendar, instant: WorkInstant): WorkInstant {
  let current = clampInstant(instant);
  for (let guard = 0; guard < 3_700; guard += 1) {
    const intervals = getWorkIntervals(calendar, current.date);
    for (let index = intervals.length - 1; index >= 0; index -= 1) {
      const interval = intervals[index];
      if (current.minute >= interval.endMinute) return { date: current.date, minute: interval.endMinute };
      if (current.minute > interval.startMinute) return current;
      if (current.minute === interval.startMinute) return current;
    }
    current = { date: addCalendarDays(current.date, -1), minute: MINUTES_PER_DAY };
  }
  throw new Error(`Calendar ${calendar.id} has no reachable working time.`);
}

export function shiftWorkingMinutes(
  calendar: WorkCalendar,
  start: WorkInstant,
  minutes: number
): WorkInstant {
  if (!Number.isFinite(minutes)) throw new Error('Working-minute shift must be finite.');
  if (minutes === 0) return normalizeForward(calendar, start);
  return minutes > 0
    ? addWorkingMinutes(calendar, start, Math.round(minutes))
    : subtractWorkingMinutes(calendar, start, Math.round(-minutes));
}

export function addWorkingMinutes(
  calendar: WorkCalendar,
  start: WorkInstant,
  minutes: number
): WorkInstant {
  let remaining = Math.max(0, Math.round(minutes));
  let current = normalizeForward(calendar, start);
  if (remaining === 0) return current;

  for (let guard = 0; guard < 200_000; guard += 1) {
    const intervals = getWorkIntervals(calendar, current.date);
    const interval = intervals.find(
      (item) => current.minute >= item.startMinute && current.minute < item.endMinute
    );
    if (!interval) {
      current = normalizeForward(calendar, { date: current.date, minute: current.minute + 1 });
      continue;
    }
    const available = interval.endMinute - current.minute;
    if (remaining <= available) return { date: current.date, minute: current.minute + remaining };
    remaining -= available;
    current = normalizeForward(calendar, { date: current.date, minute: interval.endMinute });
  }
  throw new Error('Working-minute addition exceeded safety limit.');
}

export function subtractWorkingMinutes(
  calendar: WorkCalendar,
  start: WorkInstant,
  minutes: number
): WorkInstant {
  let remaining = Math.max(0, Math.round(minutes));
  let current = normalizeBackward(calendar, start);
  if (remaining === 0) return current;

  for (let guard = 0; guard < 200_000; guard += 1) {
    const intervals = getWorkIntervals(calendar, current.date);
    const interval = [...intervals]
      .reverse()
      .find((item) => current.minute > item.startMinute && current.minute <= item.endMinute);
    if (!interval) {
      current = normalizeBackward(calendar, { date: current.date, minute: current.minute - 1 });
      continue;
    }
    const available = current.minute - interval.startMinute;
    if (remaining <= available) return { date: current.date, minute: current.minute - remaining };
    remaining -= available;
    current = normalizeBackward(calendar, { date: current.date, minute: interval.startMinute });
  }
  throw new Error('Working-minute subtraction exceeded safety limit.');
}

export function workingMinutesBetween(
  calendar: WorkCalendar,
  start: WorkInstant,
  finish: WorkInstant
): number {
  const comparison = compareInstants(start, finish);
  if (comparison === 0) return 0;
  if (comparison > 0) return -workingMinutesBetween(calendar, finish, start);

  let total = 0;
  let date = start.date;
  for (let guard = 0; guard < 20_000; guard += 1) {
    const intervals = getWorkIntervals(calendar, date);
    for (const interval of intervals) {
      const lower = date === start.date ? Math.max(start.minute, interval.startMinute) : interval.startMinute;
      const upper = date === finish.date ? Math.min(finish.minute, interval.endMinute) : interval.endMinute;
      if (upper > lower) total += upper - lower;
    }
    if (date === finish.date) return total;
    date = addCalendarDays(date, 1);
  }
  throw new Error('Working-minute difference exceeded safety limit.');
}

export function compareInstants(left: WorkInstant, right: WorkInstant): number {
  return instantScalar(left) - instantScalar(right);
}

export function maxInstant(...instants: WorkInstant[]): WorkInstant {
  if (instants.length === 0) throw new Error('At least one instant is required.');
  return instants.reduce((latest, item) => (compareInstants(item, latest) > 0 ? item : latest));
}

export function minInstant(...instants: WorkInstant[]): WorkInstant {
  if (instants.length === 0) throw new Error('At least one instant is required.');
  return instants.reduce((earliest, item) => (compareInstants(item, earliest) < 0 ? item : earliest));
}

export function startOfDate(date: string): WorkInstant {
  return { date, minute: 0 };
}

export function endOfDate(date: string): WorkInstant {
  return { date, minute: MINUTES_PER_DAY };
}

export function formatInstant(instant: WorkInstant): string {
  const hours = Math.floor(instant.minute / 60) % 24;
  const minutes = instant.minute % 60;
  return `${instant.date} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function addCalendarDays(date: string, days: number): string {
  const ordinal = dateToOrdinal(date) + days;
  return ordinalToDate(ordinal);
}

export function dateToOrdinal(date: string): number {
  if (!DATE_PATTERN.test(date)) throw new Error(`Invalid date: ${date}`);
  const [year, month, day] = date.split('-').map(Number);
  const value = Date.UTC(year, month - 1, day);
  const parsed = new Date(value);
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new Error(`Invalid date: ${date}`);
  }
  return Math.floor(value / 86_400_000);
}

export function ordinalToDate(ordinal: number): string {
  return new Date(ordinal * 86_400_000).toISOString().slice(0, 10);
}

function weekdayOf(date: string): number {
  return new Date(dateToOrdinal(date) * 86_400_000).getUTCDay();
}

function normalizeIntervals(intervals: WorkInterval[]): WorkInterval[] {
  return [...intervals].sort((left, right) => left.startMinute - right.startMinute);
}

function instantScalar(instant: WorkInstant): number {
  return dateToOrdinal(instant.date) * MINUTES_PER_DAY + instant.minute;
}

function clampInstant(instant: WorkInstant): WorkInstant {
  if (!DATE_PATTERN.test(instant.date)) throw new Error(`Invalid date: ${instant.date}`);
  return { date: instant.date, minute: Math.max(0, Math.min(MINUTES_PER_DAY, instant.minute)) };
}
