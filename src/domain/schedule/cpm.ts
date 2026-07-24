import {
  type Activity,
  type CalculatedActivity,
  type Relationship,
  type ScheduleProject,
  type ScheduleResult,
  ScheduleValidationError,
  type ScheduleWarning
} from './types';

export const CPM_ENGINE_VERSION = '0.1.0';

interface MutableDates {
  earlyStart: number;
  earlyFinish: number;
  lateStart: number;
  lateFinish: number;
}

interface GraphIndex {
  activityById: Map<string, Activity>;
  incoming: Map<string, Relationship[]>;
  outgoing: Map<string, Relationship[]>;
  topologicalOrder: string[];
}

export function calculateSchedule(project: ScheduleProject): ScheduleResult {
  const graph = buildGraph(project);
  const dates = runForwardPass(graph);
  const projectDuration = Math.max(0, ...Array.from(dates.values(), (value) => value.earlyFinish));

  runBackwardPass(graph, dates, projectDuration);

  const activities = project.activities.map<CalculatedActivity>((activity) => {
    const activityDates = requireDates(dates, activity.id);
    const totalFloat = normalizeZero(activityDates.lateStart - activityDates.earlyStart);

    return {
      ...activity,
      ...activityDates,
      totalFloat,
      isCritical: totalFloat <= 0
    };
  });

  const warnings = collectWarnings(graph, activities);

  return {
    activities,
    projectDuration,
    criticalActivityIds: activities.filter((activity) => activity.isCritical).map((activity) => activity.id),
    warnings,
    calculatedAt: new Date().toISOString(),
    engineVersion: CPM_ENGINE_VERSION
  };
}

function buildGraph(project: ScheduleProject): GraphIndex {
  const issues: string[] = [];
  const activityById = new Map<string, Activity>();

  for (const activity of project.activities) {
    if (!activity.id.trim()) {
      issues.push('Activity IDs cannot be blank.');
      continue;
    }
    if (activityById.has(activity.id)) {
      issues.push(`Duplicate activity ID: ${activity.id}.`);
    }
    if (!Number.isFinite(activity.duration) || activity.duration < 0) {
      issues.push(`Activity ${activity.id} has an invalid duration.`);
    }
    if (activity.type === 'milestone' && activity.duration !== 0) {
      issues.push(`Milestone ${activity.id} must have zero duration.`);
    }
    activityById.set(activity.id, activity);
  }

  const incoming = new Map<string, Relationship[]>();
  const outgoing = new Map<string, Relationship[]>();
  const relationshipIds = new Set<string>();

  for (const activity of project.activities) {
    incoming.set(activity.id, []);
    outgoing.set(activity.id, []);
  }

  for (const relationship of project.relationships) {
    if (relationshipIds.has(relationship.id)) {
      issues.push(`Duplicate relationship ID: ${relationship.id}.`);
    }
    relationshipIds.add(relationship.id);

    if (!activityById.has(relationship.predecessorId)) {
      issues.push(`Relationship ${relationship.id} references missing predecessor ${relationship.predecessorId}.`);
    }
    if (!activityById.has(relationship.successorId)) {
      issues.push(`Relationship ${relationship.id} references missing successor ${relationship.successorId}.`);
    }
    if (relationship.predecessorId === relationship.successorId) {
      issues.push(`Relationship ${relationship.id} links an activity to itself.`);
    }
    if (!Number.isFinite(relationship.lag)) {
      issues.push(`Relationship ${relationship.id} has an invalid lag.`);
    }

    outgoing.get(relationship.predecessorId)?.push(relationship);
    incoming.get(relationship.successorId)?.push(relationship);
  }

  if (issues.length > 0) {
    throw new ScheduleValidationError(issues);
  }

  const indegree = new Map<string, number>();
  for (const activity of project.activities) {
    indegree.set(activity.id, incoming.get(activity.id)?.length ?? 0);
  }

  const queue = project.activities
    .filter((activity) => indegree.get(activity.id) === 0)
    .map((activity) => activity.id)
    .sort();
  const topologicalOrder: string[] = [];

  while (queue.length > 0) {
    const activityId = queue.shift();
    if (!activityId) {
      break;
    }
    topologicalOrder.push(activityId);

    const successors = outgoing.get(activityId) ?? [];
    for (const relationship of successors) {
      const nextIndegree = (indegree.get(relationship.successorId) ?? 0) - 1;
      indegree.set(relationship.successorId, nextIndegree);
      if (nextIndegree === 0) {
        queue.push(relationship.successorId);
        queue.sort();
      }
    }
  }

  if (topologicalOrder.length !== project.activities.length) {
    const cyclicIds = project.activities
      .map((activity) => activity.id)
      .filter((activityId) => !topologicalOrder.includes(activityId));
    throw new ScheduleValidationError([`Circular schedule logic detected: ${cyclicIds.join(', ')}.`]);
  }

  return { activityById, incoming, outgoing, topologicalOrder };
}

function runForwardPass(graph: GraphIndex): Map<string, MutableDates> {
  const dates = new Map<string, MutableDates>();

  for (const activityId of graph.topologicalOrder) {
    const activity = requireActivity(graph.activityById, activityId);
    const incoming = graph.incoming.get(activityId) ?? [];
    let earlyStart = 0;

    for (const relationship of incoming) {
      const predecessor = requireActivity(graph.activityById, relationship.predecessorId);
      const predecessorDates = requireDates(dates, predecessor.id);
      earlyStart = Math.max(
        earlyStart,
        forwardStartBoundary(relationship, predecessorDates, activity.duration)
      );
    }

    earlyStart = normalizeZero(Math.max(0, earlyStart));
    dates.set(activityId, {
      earlyStart,
      earlyFinish: earlyStart + activity.duration,
      lateStart: Number.POSITIVE_INFINITY,
      lateFinish: Number.POSITIVE_INFINITY
    });
  }

  return dates;
}

function forwardStartBoundary(
  relationship: Relationship,
  predecessorDates: MutableDates,
  successorDuration: number
): number {
  switch (relationship.type) {
    case 'FS':
      return predecessorDates.earlyFinish + relationship.lag;
    case 'SS':
      return predecessorDates.earlyStart + relationship.lag;
    case 'FF':
      return predecessorDates.earlyFinish + relationship.lag - successorDuration;
    case 'SF':
      return predecessorDates.earlyStart + relationship.lag - successorDuration;
  }
}

function runBackwardPass(
  graph: GraphIndex,
  dates: Map<string, MutableDates>,
  projectDuration: number
): void {
  for (const activityId of [...graph.topologicalOrder].reverse()) {
    const activity = requireActivity(graph.activityById, activityId);
    const outgoing = graph.outgoing.get(activityId) ?? [];
    let lateFinish = projectDuration;

    if (outgoing.length > 0) {
      lateFinish = Math.min(
        ...outgoing.map((relationship) => {
          const successor = requireActivity(graph.activityById, relationship.successorId);
          const successorDates = requireDates(dates, successor.id);
          return backwardFinishBoundary(relationship, activity.duration, successorDates);
        })
      );
    }

    const activityDates = requireDates(dates, activityId);
    activityDates.lateFinish = normalizeZero(lateFinish);
    activityDates.lateStart = normalizeZero(lateFinish - activity.duration);
  }
}

function backwardFinishBoundary(
  relationship: Relationship,
  predecessorDuration: number,
  successorDates: MutableDates
): number {
  switch (relationship.type) {
    case 'FS':
      return successorDates.lateStart - relationship.lag;
    case 'SS':
      return successorDates.lateStart - relationship.lag + predecessorDuration;
    case 'FF':
      return successorDates.lateFinish - relationship.lag;
    case 'SF':
      return successorDates.lateFinish - relationship.lag + predecessorDuration;
  }
}

function collectWarnings(
  graph: GraphIndex,
  activities: CalculatedActivity[]
): ScheduleWarning[] {
  const warnings: ScheduleWarning[] = [];

  for (const activity of activities) {
    if ((graph.incoming.get(activity.id)?.length ?? 0) === 0 && activity.type !== 'milestone') {
      warnings.push({
        code: 'OPEN_START',
        activityId: activity.id,
        message: `${activity.id} has no predecessor.`
      });
    }
    if ((graph.outgoing.get(activity.id)?.length ?? 0) === 0 && activity.type !== 'milestone') {
      warnings.push({
        code: 'OPEN_FINISH',
        activityId: activity.id,
        message: `${activity.id} has no successor.`
      });
    }
    if (activity.totalFloat < 0) {
      warnings.push({
        code: 'NEGATIVE_FLOAT',
        activityId: activity.id,
        message: `${activity.id} has ${activity.totalFloat} days of negative float.`
      });
    }
  }

  for (const relationships of graph.outgoing.values()) {
    for (const relationship of relationships) {
      if (relationship.lag < 0) {
        warnings.push({
          code: 'NEGATIVE_LAG',
          relationshipId: relationship.id,
          message: `${relationship.id} uses a ${relationship.lag}-day lead.`
        });
      }
    }
  }

  return warnings;
}

function requireActivity(activityById: Map<string, Activity>, activityId: string): Activity {
  const activity = activityById.get(activityId);
  if (!activity) {
    throw new ScheduleValidationError([`Unknown activity ${activityId}.`]);
  }
  return activity;
}

function requireDates(dates: Map<string, MutableDates>, activityId: string): MutableDates {
  const activityDates = dates.get(activityId);
  if (!activityDates) {
    throw new ScheduleValidationError([`No calculated dates exist for ${activityId}.`]);
  }
  return activityDates;
}

function normalizeZero(value: number): number {
  return Object.is(value, -0) ? 0 : value;
}
