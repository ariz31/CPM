import {
  addWorkingMinutes,
  compareInstants,
  dateToOrdinal,
  endOfDate,
  formatInstant,
  getWorkIntervals,
  maxInstant,
  minInstant,
  normalizeBackward,
  normalizeForward,
  ordinalToDate,
  shiftWorkingMinutes,
  startOfDate,
  subtractWorkingMinutes,
  validateCalendar,
  workingMinutesOnDate
} from '../calendar/calendar';
import type { WorkCalendar, WorkInstant } from '../calendar/types';
import type {
  Activity,
  CalculatedActivity,
  Relationship,
  ScheduleProject,
  ScheduleResult,
  ScheduleWarning
} from './types';
import { ScheduleValidationError } from './types';

const ENGINE_VERSION = '0.3.0-calendar-cpm';

interface InterimActivity {
  activity: Activity;
  earlyStart: WorkInstant;
  earlyFinish: WorkInstant;
  lateStart: WorkInstant;
  lateFinish: WorkInstant;
  drivingRelationshipIds: string[];
}

export function calculateSchedule(project: ScheduleProject): ScheduleResult {
  const { order, activitiesById, relationshipsBySuccessor, relationshipsByPredecessor, calendarById } = validateAndPrepare(project);
  const defaultCalendar = requireCalendar(calendarById, project.defaultCalendarId);
  const metricByCalendarId = new Map(project.calendars.map((calendar) => [calendar.id, new CalendarMetric(calendar, project.projectStartDate)]));
  const projectStart = normalizeForward(defaultCalendar, startOfDate(project.projectStartDate));
  const interim = new Map<string, InterimActivity>();
  const warnings = buildStaticWarnings(project, relationshipsBySuccessor, relationshipsByPredecessor);

  for (const activityId of order) {
    const activity = activitiesById.get(activityId)!;
    const calendar = requireCalendar(calendarById, activity.calendarId);
    const durationMinutes = durationToMinutes(activity, calendar);
    const incoming = relationshipsBySuccessor.get(activityId) ?? [];
    const candidates: Array<{ instant: WorkInstant; relationshipId?: string }> = [
      { instant: normalizeForward(calendar, projectStart) }
    ];

    for (const relationship of incoming) {
      const predecessor = interim.get(relationship.predecessorId)!;
      candidates.push({
        instant: forwardRelationshipBoundary(relationship, predecessor, activity, calendar),
        relationshipId: relationship.id
      });
    }

    applyForwardConstraint(activity, calendar, durationMinutes, candidates, warnings);
    const earlyStart = candidates.reduce(
      (latest, candidate) => (compareInstants(candidate.instant, latest) > 0 ? candidate.instant : latest),
      candidates[0].instant
    );
    const earlyFinish = durationMinutes === 0 ? earlyStart : addWorkingMinutes(calendar, earlyStart, durationMinutes);
    const drivingRelationshipIds = candidates
      .filter((candidate) => candidate.relationshipId && compareInstants(candidate.instant, earlyStart) === 0)
      .map((candidate) => candidate.relationshipId!);

    interim.set(activityId, {
      activity,
      earlyStart,
      earlyFinish,
      lateStart: earlyStart,
      lateFinish: earlyFinish,
      drivingRelationshipIds
    });
  }

  const explicitFinish = interim.get('FINISH');
  const naturalFinish = [...interim.values()].reduce(
    (latest, item) => (compareInstants(item.earlyFinish, latest) > 0 ? item.earlyFinish : latest),
    projectStart
  );
  const projectFinish = explicitFinish
    ? maxInstant(explicitFinish.earlyFinish, naturalFinish)
    : naturalFinish;

  if (!explicitFinish) {
    warnings.push({
      code: 'MISSING_FINISH',
      message: 'No explicit FINISH milestone exists; project finish is derived from terminal activities.',
      severity: 'warning'
    });
  }

  for (const activityId of [...order].reverse()) {
    const current = interim.get(activityId)!;
    const calendar = requireCalendar(calendarById, current.activity.calendarId);
    const durationMinutes = durationToMinutes(current.activity, calendar);
    const outgoing = relationshipsByPredecessor.get(activityId) ?? [];
    const finishCandidates: WorkInstant[] = [];

    if (outgoing.length === 0) finishCandidates.push(normalizeBackward(calendar, projectFinish));

    for (const relationship of outgoing) {
      const successor = interim.get(relationship.successorId)!;
      finishCandidates.push(backwardFinishBoundary(relationship, current.activity, successor, calendarById));
    }

    applyBackwardConstraint(current.activity, calendar, durationMinutes, finishCandidates, warnings);
    const lateFinish = finishCandidates.length > 0
      ? finishCandidates.reduce((earliest, item) => (compareInstants(item, earliest) < 0 ? item : earliest))
      : normalizeBackward(calendar, projectFinish);
    const lateStart = durationMinutes === 0 ? lateFinish : subtractWorkingMinutes(calendar, lateFinish, durationMinutes);
    current.lateStart = lateStart;
    current.lateFinish = lateFinish;
  }

  const calculated: CalculatedActivity[] = order.map((activityId) => {
    const current = interim.get(activityId)!;
    const calendar = requireCalendar(calendarById, current.activity.calendarId);
    const metric = metricByCalendarId.get(calendar.id)!;
    const totalFloatMinutes = metric.between(current.earlyStart, current.lateStart);
    const totalFloat = totalFloatMinutes / calendar.standardMinutesPerDay;
    const freeFloat = calculateFreeFloat(
      current,
      relationshipsByPredecessor.get(activityId) ?? [],
      interim,
      calendarById,
      metricByCalendarId
    );
    if (totalFloat < 0) {
      warnings.push({
        code: 'NEGATIVE_FLOAT',
        activityId,
        message: `${activityId} has ${round(totalFloat)} days of negative float.`,
        severity: 'error'
      });
    }
    if (current.activity.deadline) {
      const deadline = endOfDate(current.activity.deadline);
      if (compareInstants(current.earlyFinish, deadline) > 0) {
        warnings.push({
          code: 'DEADLINE_MISS',
          activityId,
          message: `${activityId} finishes after its ${current.activity.deadline} deadline.`,
          severity: 'warning'
        });
      }
    }
    const offsetMinutes = metricByCalendarId.get(defaultCalendar.id)!.between(projectStart, current.earlyStart);
    return {
      ...current.activity,
      earlyStart: current.earlyStart,
      earlyFinish: current.earlyFinish,
      lateStart: current.lateStart,
      lateFinish: current.lateFinish,
      earlyStartDate: formatInstant(current.earlyStart),
      earlyFinishDate: formatInstant(current.earlyFinish),
      lateStartDate: formatInstant(current.lateStart),
      lateFinishDate: formatInstant(current.lateFinish),
      earlyStartOffsetDays: round(offsetMinutes / defaultCalendar.standardMinutesPerDay),
      totalFloat: round(totalFloat),
      freeFloat: round(freeFloat),
      isCritical: totalFloat <= project.criticalFloatThresholdDays,
      isNearCritical:
        totalFloat > project.criticalFloatThresholdDays &&
        totalFloat <= project.nearCriticalFloatThresholdDays,
      drivingRelationshipIds: current.drivingRelationshipIds
    };
  });

  const durationMinutes = metricByCalendarId.get(defaultCalendar.id)!.between(projectStart, projectFinish);
  return {
    activities: calculated,
    projectStartDate: formatInstant(projectStart),
    projectFinishDate: formatInstant(projectFinish),
    projectDuration: round(durationMinutes / defaultCalendar.standardMinutesPerDay),
    criticalActivityIds: calculated.filter((item) => item.isCritical).map((item) => item.id),
    nearCriticalActivityIds: calculated.filter((item) => item.isNearCritical).map((item) => item.id),
    warnings: deduplicateWarnings(warnings),
    calculatedAt: new Date().toISOString(),
    engineVersion: ENGINE_VERSION
  };
}

function validateAndPrepare(project: ScheduleProject) {
  const issues: string[] = [];
  const activitiesById = new Map<string, Activity>();
  const calendarById = new Map<string, WorkCalendar>();

  for (const calendar of project.calendars) {
    if (calendarById.has(calendar.id)) issues.push(`Duplicate calendar ID: ${calendar.id}`);
    calendarById.set(calendar.id, calendar);
    for (const issue of validateCalendar(calendar)) issues.push(`${calendar.id}: ${issue.message}`);
  }
  if (!calendarById.has(project.defaultCalendarId)) issues.push('Default calendar does not exist.');

  for (const activity of project.activities) {
    if (activitiesById.has(activity.id)) issues.push(`Duplicate activity ID: ${activity.id}`);
    activitiesById.set(activity.id, activity);
    if (!activity.name.trim()) issues.push(`Activity ${activity.id} requires a name.`);
    if (!Number.isFinite(activity.duration) || activity.duration < 0) issues.push(`Activity ${activity.id} has invalid duration.`);
    if (activity.type === 'milestone' && activity.duration !== 0) issues.push(`Milestone ${activity.id} must have zero duration.`);
    if (!calendarById.has(activity.calendarId)) issues.push(`Activity ${activity.id} references missing calendar ${activity.calendarId}.`);
  }

  const relationshipsBySuccessor = new Map<string, Relationship[]>();
  const relationshipsByPredecessor = new Map<string, Relationship[]>();
  const duplicateKeys = new Set<string>();
  for (const relationship of project.relationships) {
    if (!activitiesById.has(relationship.predecessorId)) issues.push(`Relationship ${relationship.id} has missing predecessor.`);
    if (!activitiesById.has(relationship.successorId)) issues.push(`Relationship ${relationship.id} has missing successor.`);
    if (relationship.predecessorId === relationship.successorId) issues.push(`Relationship ${relationship.id} links an activity to itself.`);
    if (!Number.isFinite(relationship.lag)) issues.push(`Relationship ${relationship.id} has invalid lag.`);
    const key = `${relationship.predecessorId}|${relationship.successorId}|${relationship.type}|${relationship.lag}`;
    if (duplicateKeys.has(key)) issues.push(`Duplicate relationship: ${key}`);
    duplicateKeys.add(key);
    appendMap(relationshipsBySuccessor, relationship.successorId, relationship);
    appendMap(relationshipsByPredecessor, relationship.predecessorId, relationship);
  }

  if (issues.length > 0) throw new ScheduleValidationError(issues);
  const order = topologicalOrder(project.activities, project.relationships);
  return { order, activitiesById, relationshipsBySuccessor, relationshipsByPredecessor, calendarById };
}

function topologicalOrder(activities: Activity[], relationships: Relationship[]): string[] {
  const indegree = new Map(activities.map((activity) => [activity.id, 0]));
  const successors = new Map<string, string[]>();
  for (const relationship of relationships) {
    indegree.set(relationship.successorId, (indegree.get(relationship.successorId) ?? 0) + 1);
    const list = successors.get(relationship.predecessorId) ?? [];
    list.push(relationship.successorId);
    successors.set(relationship.predecessorId, list);
  }
  const queue = activities.filter((activity) => indegree.get(activity.id) === 0).map((activity) => activity.id).sort();
  const order: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    order.push(id);
    for (const successor of successors.get(id) ?? []) {
      const next = (indegree.get(successor) ?? 0) - 1;
      indegree.set(successor, next);
      if (next === 0) {
        queue.push(successor);
        queue.sort();
      }
    }
  }
  if (order.length !== activities.length) {
    const cycleNodes = activities.filter((activity) => !order.includes(activity.id)).map((activity) => activity.id);
    throw new ScheduleValidationError([`Circular logic detected involving: ${cycleNodes.join(', ')}`]);
  }
  return order;
}

function forwardRelationshipBoundary(
  relationship: Relationship,
  predecessor: InterimActivity,
  successor: Activity,
  successorCalendar: WorkCalendar
): WorkInstant {
  const durationMinutes = durationToMinutes(successor, successorCalendar);
  const lagMinutes = relationship.lag * successorCalendar.standardMinutesPerDay;
  switch (relationship.type) {
    case 'FS':
      return normalizeForward(successorCalendar, shiftWorkingMinutes(successorCalendar, predecessor.earlyFinish, lagMinutes));
    case 'SS':
      return normalizeForward(successorCalendar, shiftWorkingMinutes(successorCalendar, predecessor.earlyStart, lagMinutes));
    case 'FF': {
      const finish = shiftWorkingMinutes(successorCalendar, predecessor.earlyFinish, lagMinutes);
      return durationMinutes === 0 ? finish : subtractWorkingMinutes(successorCalendar, finish, durationMinutes);
    }
    case 'SF': {
      const finish = shiftWorkingMinutes(successorCalendar, predecessor.earlyStart, lagMinutes);
      return durationMinutes === 0 ? finish : subtractWorkingMinutes(successorCalendar, finish, durationMinutes);
    }
  }
}

function backwardFinishBoundary(
  relationship: Relationship,
  predecessor: Activity,
  successor: InterimActivity,
  calendarById: Map<string, WorkCalendar>
): WorkInstant {
  const predecessorCalendar = requireCalendar(calendarById, predecessor.calendarId);
  const successorCalendar = requireCalendar(calendarById, successor.activity.calendarId);
  const predecessorDuration = durationToMinutes(predecessor, predecessorCalendar);
  const lagMinutes = relationship.lag * successorCalendar.standardMinutesPerDay;
  switch (relationship.type) {
    case 'FS': {
      const boundary = shiftWorkingMinutes(successorCalendar, successor.lateStart, -lagMinutes);
      return normalizeBackward(predecessorCalendar, boundary);
    }
    case 'SS': {
      const latestStart = normalizeBackward(
        predecessorCalendar,
        shiftWorkingMinutes(successorCalendar, successor.lateStart, -lagMinutes)
      );
      return predecessorDuration === 0 ? latestStart : addWorkingMinutes(predecessorCalendar, latestStart, predecessorDuration);
    }
    case 'FF': {
      const boundary = shiftWorkingMinutes(successorCalendar, successor.lateFinish, -lagMinutes);
      return normalizeBackward(predecessorCalendar, boundary);
    }
    case 'SF': {
      const latestStart = normalizeBackward(
        predecessorCalendar,
        shiftWorkingMinutes(successorCalendar, successor.lateFinish, -lagMinutes)
      );
      return predecessorDuration === 0 ? latestStart : addWorkingMinutes(predecessorCalendar, latestStart, predecessorDuration);
    }
  }
}

function applyForwardConstraint(
  activity: Activity,
  calendar: WorkCalendar,
  durationMinutes: number,
  candidates: Array<{ instant: WorkInstant; relationshipId?: string }>,
  warnings: ScheduleWarning[]
): void {
  const constraint = activity.constraint;
  if (!constraint || constraint.type === 'ASAP' || !constraint.date) return;
  warnings.push({
    code: 'HARD_CONSTRAINT',
    activityId: activity.id,
    message: `${activity.id} uses ${constraint.type} on ${constraint.date}.`,
    severity: constraint.type.startsWith('MUST') ? 'warning' : 'info'
  });
  if (constraint.type === 'START_NO_EARLIER_THAN' || constraint.type === 'MUST_START_ON') {
    candidates.push({ instant: normalizeForward(calendar, startOfDate(constraint.date)) });
  }
  if (constraint.type === 'MUST_FINISH_ON') {
    const finish = normalizeBackward(calendar, endOfDate(constraint.date));
    candidates.push({ instant: durationMinutes === 0 ? finish : subtractWorkingMinutes(calendar, finish, durationMinutes) });
  }
}

function applyBackwardConstraint(
  activity: Activity,
  calendar: WorkCalendar,
  durationMinutes: number,
  candidates: WorkInstant[],
  warnings: ScheduleWarning[]
): void {
  const constraint = activity.constraint;
  if (!constraint?.date) return;
  if (constraint.type === 'FINISH_NO_LATER_THAN' || constraint.type === 'MUST_FINISH_ON') {
    candidates.push(normalizeBackward(calendar, endOfDate(constraint.date)));
  }
  if (constraint.type === 'MUST_START_ON') {
    const start = normalizeForward(calendar, startOfDate(constraint.date));
    candidates.push(durationMinutes === 0 ? start : addWorkingMinutes(calendar, start, durationMinutes));
  }
  if (constraint.type === 'FINISH_NO_LATER_THAN') {
    warnings.push({
      code: 'HARD_CONSTRAINT',
      activityId: activity.id,
      message: `${activity.id} has a finish-no-later-than constraint on ${constraint.date}.`,
      severity: 'info'
    });
  }
}

function calculateFreeFloat(
  current: InterimActivity,
  outgoing: Relationship[],
  interim: Map<string, InterimActivity>,
  calendarById: Map<string, WorkCalendar>,
  metricByCalendarId: Map<string, CalendarMetric>
): number {
  if (outgoing.length === 0) return 0;
  const slacks = outgoing.map((relationship) => {
    const successor = interim.get(relationship.successorId)!;
    const calendar = requireCalendar(calendarById, successor.activity.calendarId);
    const lagMinutes = relationship.lag * calendar.standardMinutesPerDay;
    const requiredBoundary = relationship.type === 'FS'
      ? normalizeForward(calendar, shiftWorkingMinutes(calendar, current.earlyFinish, lagMinutes))
      : relationship.type === 'SS'
        ? normalizeForward(calendar, shiftWorkingMinutes(calendar, current.earlyStart, lagMinutes))
        : relationship.type === 'FF'
          ? shiftWorkingMinutes(calendar, current.earlyFinish, lagMinutes)
          : shiftWorkingMinutes(calendar, current.earlyStart, lagMinutes);
    const actualBoundary = relationship.type === 'FF' || relationship.type === 'SF'
      ? successor.earlyFinish
      : successor.earlyStart;
    return metricByCalendarId.get(calendar.id)!.between(requiredBoundary, actualBoundary) / calendar.standardMinutesPerDay;
  });
  return Math.min(...slacks);
}

function buildStaticWarnings(
  project: ScheduleProject,
  incoming: Map<string, Relationship[]>,
  outgoing: Map<string, Relationship[]>
): ScheduleWarning[] {
  const warnings: ScheduleWarning[] = [];
  for (const activity of project.activities) {
    if ((incoming.get(activity.id) ?? []).length === 0 && activity.id !== 'START') {
      warnings.push({ code: 'OPEN_START', activityId: activity.id, message: `${activity.id} has no predecessor.`, severity: 'warning' });
    }
    if ((outgoing.get(activity.id) ?? []).length === 0 && activity.id !== 'FINISH') {
      warnings.push({ code: 'OPEN_FINISH', activityId: activity.id, message: `${activity.id} has no successor.`, severity: 'warning' });
    }
  }
  for (const relationship of project.relationships) {
    if (relationship.lag < 0) warnings.push({
      code: 'NEGATIVE_LAG',
      relationshipId: relationship.id,
      message: `${relationship.id} uses a ${relationship.lag}-day lead.`,
      severity: 'warning'
    });
  }
  return warnings;
}

function durationToMinutes(activity: Activity, calendar: WorkCalendar): number {
  if (activity.type === 'milestone') return 0;
  return Math.round(activity.duration * calendar.standardMinutesPerDay);
}

function requireCalendar(calendars: Map<string, WorkCalendar>, id: string): WorkCalendar {
  const calendar = calendars.get(id);
  if (!calendar) throw new ScheduleValidationError([`Calendar ${id} was not found.`]);
  return calendar;
}

function appendMap<T>(map: Map<string, T[]>, key: string, value: T): void {
  const list = map.get(key) ?? [];
  list.push(value);
  map.set(key, list);
}

function deduplicateWarnings(warnings: ScheduleWarning[]): ScheduleWarning[] {
  const seen = new Set<string>();
  return warnings.filter((warning) => {
    const key = `${warning.code}|${warning.activityId ?? ''}|${warning.relationshipId ?? ''}|${warning.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

class CalendarMetric {
  private readonly cumulative = new Map<number, number>();
  private minOrdinal: number;
  private maxOrdinal: number;

  public constructor(private readonly calendar: WorkCalendar, anchorDate: string) {
    const anchor = dateToOrdinal(anchorDate);
    this.minOrdinal = anchor;
    this.maxOrdinal = anchor;
    this.cumulative.set(anchor, 0);
  }

  public between(start: WorkInstant, finish: WorkInstant): number {
    return this.scalar(finish) - this.scalar(start);
  }

  private scalar(instant: WorkInstant): number {
    const ordinal = dateToOrdinal(instant.date);
    const dayStart = this.dayStart(ordinal);
    let withinDay = 0;
    for (const interval of getWorkIntervals(this.calendar, instant.date)) {
      if (instant.minute <= interval.startMinute) break;
      withinDay += Math.max(0, Math.min(instant.minute, interval.endMinute) - interval.startMinute);
      if (instant.minute < interval.endMinute) break;
    }
    return dayStart + withinDay;
  }

  private dayStart(ordinal: number): number {
    const existing = this.cumulative.get(ordinal);
    if (existing !== undefined) return existing;
    if (ordinal > this.maxOrdinal) {
      let total = this.cumulative.get(this.maxOrdinal)!;
      for (let day = this.maxOrdinal; day < ordinal; day += 1) {
        total += workingMinutesOnDate(this.calendar, ordinalToDate(day));
        this.cumulative.set(day + 1, total);
      }
      this.maxOrdinal = ordinal;
      return total;
    }
    let total = this.cumulative.get(this.minOrdinal)!;
    for (let day = this.minOrdinal - 1; day >= ordinal; day -= 1) {
      total -= workingMinutesOnDate(this.calendar, ordinalToDate(day));
      this.cumulative.set(day, total);
    }
    this.minOrdinal = ordinal;
    return total;
  }
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
