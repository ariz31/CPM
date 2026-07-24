import {
  addWorkingMinutes,
  compareInstants,
  dateToOrdinal,
  formatInstant,
  normalizeForward,
  startOfDate
} from '../calendar/calendar';
import type { WorkInstant } from '../calendar/types';
import type { ProjectRecord } from '../project/types';
import type { Activity, ScheduleResult } from '../schedule/types';
import type {
  ActivityProgress,
  ProgressUpdateSnapshot,
  ScheduleBaseline
} from './types';

export interface ProgressActivityAnalysis {
  activityId: string;
  percentComplete: number;
  state: 'not-started' | 'in-progress' | 'complete';
  isOutOfSequence: boolean;
  forecastFinish: string;
  baselineStartVarianceDays?: number;
  baselineFinishVarianceDays?: number;
}

export interface ProgressSummary {
  statusDate: string;
  overallPercentComplete: number;
  completeCount: number;
  inProgressCount: number;
  notStartedCount: number;
  outOfSequenceCount: number;
  activities: ProgressActivityAnalysis[];
}

export function createDefaultProgress(activity: Activity, now = new Date().toISOString()): ActivityProgress {
  return {
    activityId: activity.id,
    method: activity.type === 'milestone' ? 'milestone' : 'duration',
    remainingDuration: activity.duration,
    percentComplete: 0,
    suspendedPeriods: [],
    outOfSequenceMode: 'retained-logic',
    updatedAt: now
  };
}

export function derivePercentComplete(activity: Activity, progress: ActivityProgress): number {
  if (progress.actualFinish) return 100;
  switch (progress.method) {
    case 'duration':
      if (activity.duration <= 0) return 0;
      return roundPercent((activity.duration - progress.remainingDuration) / activity.duration * 100);
    case 'physical':
      return roundPercent(progress.physicalPercent ?? progress.percentComplete);
    case 'units':
      return progress.totalUnits && progress.totalUnits > 0
        ? roundPercent((progress.unitsComplete ?? 0) / progress.totalUnits * 100)
        : 0;
    case 'milestone':
      return progress.actualFinish ? 100 : 0;
  }
}

export function updateActivityProgress(
  project: ProjectRecord,
  activityId: string,
  changes: Partial<ActivityProgress>,
  now = new Date().toISOString()
): ProjectRecord {
  const activity = project.activities.find((item) => item.id === activityId);
  if (!activity) throw new Error(`Activity ${activityId} was not found.`);
  const current = project.progress[activityId] ?? createDefaultProgress(activity, now);
  const next: ActivityProgress = {
    ...current,
    ...changes,
    activityId,
    remainingDuration: changes.actualFinish ? 0 : Math.max(0, changes.remainingDuration ?? current.remainingDuration),
    suspendedPeriods: changes.suspendedPeriods ?? current.suspendedPeriods,
    updatedAt: now
  };
  next.percentComplete = derivePercentComplete(activity, next);
  validateProgressRecord(activity, next);
  return { ...project, progress: { ...project.progress, [activityId]: next } };
}

export function createBaseline(
  project: ProjectRecord,
  result: ScheduleResult,
  name: string,
  kind: ScheduleBaseline['kind'],
  createdAt = new Date().toISOString()
): ScheduleBaseline {
  return {
    id: crypto.randomUUID(),
    name: name.trim() || `${kind === 'original' ? 'Original' : 'Revised'} baseline`,
    kind,
    createdAt,
    statusDate: project.statusDate,
    projectRevision: project.revision,
    engineVersion: result.engineVersion,
    activities: result.activities.map((activity) => ({
      activityId: activity.id,
      name: activity.name,
      wbsId: activity.wbsId,
      calendarId: activity.calendarId,
      duration: activity.duration,
      plannedStart: activity.earlyStartDate,
      plannedFinish: activity.earlyFinishDate
    }))
  };
}

export function addBaseline(project: ProjectRecord, baseline: ScheduleBaseline): ProjectRecord {
  if (project.baselines.some((item) => item.id === baseline.id)) throw new Error('Baseline ID already exists.');
  return {
    ...project,
    baselines: [...project.baselines, structuredClone(baseline)],
    activeBaselineId: project.activeBaselineId ?? baseline.id
  };
}

export function createProgressUpdateSnapshot(
  project: ProjectRecord,
  name: string,
  createdAt = new Date().toISOString()
): ProgressUpdateSnapshot {
  return {
    id: crypto.randomUUID(),
    name: name.trim() || `Update ${project.statusDate}`,
    createdAt,
    statusDate: project.statusDate,
    projectRevision: project.revision,
    progress: structuredClone(project.progress)
  };
}

export function addProgressUpdateSnapshot(project: ProjectRecord, snapshot: ProgressUpdateSnapshot): ProjectRecord {
  return { ...project, updateSnapshots: [...project.updateSnapshots, structuredClone(snapshot)] };
}

export function analyzeProgress(project: ProjectRecord, result: ScheduleResult): ProgressSummary {
  const calculatedById = new Map(result.activities.map((item) => [item.id, item]));
  const incoming = new Map<string, string[]>();
  for (const relationship of project.relationships) {
    const list = incoming.get(relationship.successorId) ?? [];
    list.push(relationship.predecessorId);
    incoming.set(relationship.successorId, list);
  }
  const activeBaseline = project.baselines.find((item) => item.id === project.activeBaselineId);
  const baselineById = new Map(activeBaseline?.activities.map((item) => [item.activityId, item]) ?? []);
  let weightedTotal = 0;
  let totalWeight = 0;
  let completeCount = 0;
  let inProgressCount = 0;
  let notStartedCount = 0;
  let outOfSequenceCount = 0;

  const activities = project.activities.map((activity): ProgressActivityAnalysis => {
    const progress = project.progress[activity.id] ?? createDefaultProgress(activity, project.updatedAt);
    const percentComplete = derivePercentComplete(activity, progress);
    const state = progress.actualFinish ? 'complete' : progress.actualStart || percentComplete > 0 ? 'in-progress' : 'not-started';
    if (state === 'complete') completeCount += 1;
    else if (state === 'in-progress') inProgressCount += 1;
    else notStartedCount += 1;
    const predecessors = incoming.get(activity.id) ?? [];
    const isOutOfSequence = Boolean(progress.actualStart && predecessors.some((id) => {
      const predecessor = project.activities.find((item) => item.id === id);
      if (!predecessor) return false;
      const predecessorProgress = project.progress[id] ?? createDefaultProgress(predecessor, project.updatedAt);
      return !predecessorProgress.actualFinish;
    }));
    if (isOutOfSequence) outOfSequenceCount += 1;
    const forecastFinish = forecastActivityFinish(project, activity, progress, result, predecessors);
    const baseline = baselineById.get(activity.id);
    const calculated = calculatedById.get(activity.id);
    const weight = activity.type === 'milestone' ? 1 : Math.max(activity.duration, 0.25);
    weightedTotal += percentComplete * weight;
    totalWeight += weight;
    return {
      activityId: activity.id,
      percentComplete,
      state,
      isOutOfSequence,
      forecastFinish,
      baselineStartVarianceDays: baseline && calculated ? calendarDayDelta(baseline.plannedStart, calculated.earlyStartDate) : undefined,
      baselineFinishVarianceDays: baseline ? calendarDayDelta(baseline.plannedFinish, forecastFinish) : undefined
    };
  });

  return {
    statusDate: project.statusDate,
    overallPercentComplete: totalWeight > 0 ? roundPercent(weightedTotal / totalWeight) : 0,
    completeCount,
    inProgressCount,
    notStartedCount,
    outOfSequenceCount,
    activities
  };
}

function forecastActivityFinish(
  project: ProjectRecord,
  activity: Activity,
  progress: ActivityProgress,
  result: ScheduleResult,
  predecessors: string[]
): string {
  if (progress.actualFinish) return `${progress.actualFinish} 17:00`;
  const calculated = result.activities.find((item) => item.id === activity.id);
  if (!progress.actualStart) return calculated?.earlyFinishDate ?? `${project.statusDate} 17:00`;
  const calendar = project.calendars.find((item) => item.id === activity.calendarId);
  if (!calendar) return calculated?.earlyFinishDate ?? `${project.statusDate} 17:00`;
  let remainingStart = normalizeForward(calendar, startOfDate(project.statusDate));
  if (progress.outOfSequenceMode === 'retained-logic') {
    for (const predecessorId of predecessors) {
      const predecessor = result.activities.find((item) => item.id === predecessorId);
      if (!predecessor) continue;
      const instant = parseInstant(predecessor.earlyFinishDate);
      if (compareInstants(instant, remainingStart) > 0) remainingStart = normalizeForward(calendar, instant);
    }
  }
  const remainingMinutes = Math.round(progress.remainingDuration * calendar.standardMinutesPerDay);
  return formatInstant(remainingMinutes > 0 ? addWorkingMinutes(calendar, remainingStart, remainingMinutes) : remainingStart);
}

function parseInstant(value: string): WorkInstant {
  const [date, time = '00:00'] = value.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  return { date, minute: hours * 60 + minutes };
}

function calendarDayDelta(planned: string, current: string): number {
  return dateToOrdinal(current.slice(0, 10)) - dateToOrdinal(planned.slice(0, 10));
}

function validateProgressRecord(activity: Activity, progress: ActivityProgress): void {
  if (!Number.isFinite(progress.remainingDuration) || progress.remainingDuration < 0) throw new Error('Remaining duration must be zero or greater.');
  if (progress.actualFinish && !progress.actualStart) throw new Error('An actual finish requires an actual start.');
  if (progress.actualStart && progress.actualFinish && progress.actualFinish < progress.actualStart) throw new Error('Actual finish cannot precede actual start.');
  if (activity.type === 'milestone' && progress.remainingDuration !== 0) throw new Error('Milestone remaining duration must be zero.');
  const percent = derivePercentComplete(activity, progress);
  if (percent < 0 || percent > 100) throw new Error('Percent complete must be between 0 and 100.');
}

function roundPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round((value + Number.EPSILON) * 100) / 100));
}
