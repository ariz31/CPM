import type { CostControlResult } from '../controls/types';
import type { ProjectRecord } from '../project/types';
import type { ActivityProgress } from '../progress/types';
import type { RiskRecord, RiskResourceResult } from '../riskResources/types';
import type { ScheduleResult } from '../schedule/types';

export interface MobileMilestoneSummary {
  id: string;
  name: string;
  date: string;
  status: 'complete' | 'upcoming' | 'late' | 'unscheduled';
}

export interface MobileWorkflowSummary {
  criticalCount: number;
  nearCriticalCount: number;
  nextMilestones: MobileMilestoneSummary[];
  weightedProgress: number;
  openRiskCount: number;
  riskCostExposure: number;
  bac: number;
  spi: number | null;
  cpi: number | null;
  completenessPercent: number | null;
}

export interface MobileProgressInput {
  percentComplete: number;
  remainingDuration: number;
  actualStart?: string;
  actualFinish?: string;
  notes?: string;
}

export function buildMobileWorkflowSummary(
  project: ProjectRecord,
  schedule?: ScheduleResult,
  controls?: CostControlResult,
  risk?: RiskResourceResult
): MobileWorkflowSummary {
  const tasks = project.activities.filter((activity) => activity.type === 'task');
  const totalDuration = tasks.reduce((sum, activity) => sum + Math.max(0, activity.duration), 0);
  const weightedProgress = tasks.length === 0
    ? 0
    : totalDuration > 0
      ? tasks.reduce((sum, activity) => sum + (project.progress[activity.id]?.percentComplete ?? 0) * Math.max(0, activity.duration), 0) / totalDuration
      : tasks.reduce((sum, activity) => sum + (project.progress[activity.id]?.percentComplete ?? 0), 0) / tasks.length;
  const today = project.statusDate;
  const calculated = new Map(schedule?.activities.map((activity) => [activity.id, activity]) ?? []);
  const nextMilestones = project.activities
    .filter((activity) => activity.type === 'milestone' && activity.id !== 'START')
    .map((activity): MobileMilestoneSummary => {
      const progress = project.progress[activity.id];
      const date = calculated.get(activity.id)?.earlyFinishDate ?? activity.deadline ?? '';
      const complete = Boolean(progress?.actualFinish || (progress?.percentComplete ?? 0) >= 100);
      return {
        id: activity.id,
        name: activity.name,
        date,
        status: complete ? 'complete' : !date ? 'unscheduled' : date < today ? 'late' : 'upcoming'
      };
    })
    .sort((left, right) => (left.date || '9999-12-31').localeCompare(right.date || '9999-12-31'))
    .slice(0, 8);

  const openRiskCount = project.riskResources.risks.filter((item) => item.status !== 'closed').length;
  const riskCostExposure = risk?.riskExposure.reduce((sum, item) => sum + item.expectedCostExposure, 0)
    ?? project.riskResources.risks.reduce((sum, item) => sum + item.impactCost * item.probabilityPercent / 100, 0);

  return {
    criticalCount: schedule?.criticalActivityIds.length ?? 0,
    nearCriticalCount: schedule?.nearCriticalActivityIds.length ?? 0,
    nextMilestones,
    weightedProgress,
    openRiskCount,
    riskCostExposure,
    bac: controls?.metrics.bac ?? 0,
    spi: controls?.metrics.spi ?? null,
    cpi: controls?.metrics.cpi ?? null,
    completenessPercent: controls?.completeness.allocationPercent ?? null
  };
}

export function applyMobileProgressUpdate(project: ProjectRecord, activityId: string, input: MobileProgressInput): ProjectRecord {
  const activity = project.activities.find((item) => item.id === activityId);
  if (!activity) throw new Error(`Activity ${activityId} was not found.`);
  const now = new Date().toISOString();
  const previous = project.progress[activityId];
  const percentComplete = clamp(input.percentComplete, 0, 100);
  const remainingDuration = Math.max(0, input.remainingDuration);
  const next: ActivityProgress = {
    activityId,
    method: previous?.method ?? (activity.type === 'milestone' ? 'milestone' : 'duration'),
    actualStart: input.actualStart || previous?.actualStart,
    actualFinish: percentComplete >= 100 ? (input.actualFinish || previous?.actualFinish || project.statusDate) : input.actualFinish || undefined,
    remainingDuration: percentComplete >= 100 ? 0 : remainingDuration,
    percentComplete,
    physicalPercent: previous?.physicalPercent,
    unitsComplete: previous?.unitsComplete,
    totalUnits: previous?.totalUnits,
    suspendedPeriods: previous?.suspendedPeriods ?? [],
    outOfSequenceMode: previous?.outOfSequenceMode ?? 'retained-logic',
    notes: input.notes,
    updatedAt: now
  };
  return {
    ...project,
    statusDate: project.statusDate,
    progress: { ...project.progress, [activityId]: next },
    revision: project.revision + 1,
    updatedAt: now
  };
}

export function upsertMobileRisk(project: ProjectRecord, risk: RiskRecord): ProjectRecord {
  const now = new Date().toISOString();
  const normalized: RiskRecord = {
    ...risk,
    id: risk.id || crypto.randomUUID(),
    title: risk.title.trim() || 'Untitled risk',
    probabilityPercent: clamp(risk.probabilityPercent, 0, 100),
    impactDays: Math.max(0, risk.impactDays),
    impactCost: Math.max(0, risk.impactCost),
    linkedActivityIds: risk.linkedActivityIds.filter((id, index, all) => project.activities.some((activity) => activity.id === id) && all.indexOf(id) === index)
  };
  const exists = project.riskResources.risks.some((item) => item.id === normalized.id);
  return {
    ...project,
    riskResources: {
      ...project.riskResources,
      risks: exists
        ? project.riskResources.risks.map((item) => item.id === normalized.id ? normalized : item)
        : [...project.riskResources.risks, normalized]
    },
    revision: project.revision + 1,
    updatedAt: now
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.max(minimum, Math.min(maximum, value));
}
