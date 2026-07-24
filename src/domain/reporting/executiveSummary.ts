import type { CostControlResult } from '../controls/types';
import { analyzeProgress } from '../progress/progress';
import type { ProjectRecord } from '../project/types';
import type { RiskResourceResult } from '../riskResources/types';
import type { ScheduleResult } from '../schedule/types';

export type ExecutiveMetricStatus = 'good' | 'watch' | 'critical' | 'unavailable';

export interface ExecutiveMetric {
  id: string;
  label: string;
  value: number | string | null;
  unit?: string;
  status: ExecutiveMetricStatus;
  definition: string;
  source: string;
  calculation: string;
  completeness: 'complete' | 'partial' | 'unavailable';
}

export interface ExecutiveException {
  id: string;
  category: 'schedule' | 'progress' | 'cost' | 'risk' | 'resource' | 'data';
  severity: 'critical' | 'warning' | 'information';
  title: string;
  detail: string;
  activityId?: string;
}

export interface ExecutiveMilestone {
  activityId: string;
  name: string;
  forecastDate: string;
  state: 'complete' | 'upcoming' | 'late';
  varianceDays?: number;
}

export interface ExecutiveSummary {
  statusDate: string;
  generatedAt: string;
  projectRevision: number;
  engineVersion: string;
  metrics: ExecutiveMetric[];
  exceptions: ExecutiveException[];
  milestones: ExecutiveMilestone[];
  curve: Array<{ period: string; planned: number; earned: number; actual: number }>;
  completenessScore: number;
}

export function buildExecutiveSummary(
  project: ProjectRecord,
  schedule: ScheduleResult,
  controls: CostControlResult,
  risk: RiskResourceResult
): ExecutiveSummary {
  const progress = analyzeProgress(project, schedule);
  const openRisks = project.riskResources.risks.filter((item) => item.status !== 'closed').length;
  const scheduleCompleteness = project.activities.length === 0 ? 0 : Math.round((project.activities.length - controls.completeness.activitiesWithoutDates.length) / project.activities.length * 100);
  const costCompleteness = controls.completeness.allocationPercent ?? 0;
  const progressCompleteness = project.activities.length === 0 ? 0 : Math.round(Object.keys(project.progress).length / project.activities.length * 100);
  const completenessScore = Math.max(0, Math.min(100, Math.round((scheduleCompleteness + Math.min(100, costCompleteness) + progressCompleteness) / 3)));

  const metrics: ExecutiveMetric[] = [
    {
      id: 'overall-progress',
      label: 'Overall completion',
      value: progress.overallPercentComplete,
      unit: '%',
      status: progress.overallPercentComplete >= 75 ? 'good' : progress.overallPercentComplete >= 25 ? 'watch' : 'critical',
      definition: 'Duration-weighted completion across all scheduled activities.',
      source: 'Activity progress records and current schedule durations',
      calculation: 'Sum(activity percent × activity duration weight) ÷ sum(activity duration weights)',
      completeness: progressCompleteness >= 95 ? 'complete' : progressCompleteness > 0 ? 'partial' : 'unavailable'
    },
    {
      id: 'forecast-finish',
      label: 'Forecast finish',
      value: schedule.projectFinishDate,
      status: schedule.warnings.some((warning) => warning.code === 'DEADLINE_MISS' || warning.code === 'NEGATIVE_FLOAT') ? 'critical' : schedule.nearCriticalActivityIds.length > 0 ? 'watch' : 'good',
      definition: 'Calculated project completion using the current network, calendars, and constraints.',
      source: `CPM engine ${schedule.engineVersion}`,
      calculation: 'Maximum early finish across the validated activity network',
      completeness: controls.completeness.activitiesWithoutDates.length === 0 ? 'complete' : 'partial'
    },
    {
      id: 'cpi',
      label: 'Cost performance',
      value: controls.metrics.cpi,
      unit: 'CPI',
      status: ratioStatus(controls.metrics.cpi),
      definition: 'Cost efficiency of earned work compared with actual cost.',
      source: 'Earned value and actual-cost records',
      calculation: 'EV ÷ AC',
      completeness: controls.metrics.cpi === null ? 'unavailable' : costCompleteness >= 95 ? 'complete' : 'partial'
    },
    {
      id: 'spi',
      label: 'Schedule performance',
      value: controls.metrics.spi,
      unit: 'SPI',
      status: ratioStatus(controls.metrics.spi),
      definition: 'Schedule efficiency of earned work compared with planned value.',
      source: 'Status-date earned value and time-phased baseline',
      calculation: 'EV ÷ PV',
      completeness: controls.metrics.spi === null ? 'unavailable' : costCompleteness >= 95 ? 'complete' : 'partial'
    },
    {
      id: 'risk-exposure',
      label: 'Open risk exposure',
      value: risk.riskExposure.reduce((sum, item) => sum + item.expectedCostExposure, 0),
      unit: project.metadata.currency,
      status: openRisks === 0 ? 'good' : risk.riskExposure.some((item) => item.score >= 5) ? 'critical' : 'watch',
      definition: 'Probability-weighted expected cost exposure from non-closed risks.',
      source: 'Risk register',
      calculation: 'Sum(probability × impact cost)',
      completeness: project.riskResources.risks.length > 0 ? 'complete' : 'unavailable'
    },
    {
      id: 'data-completeness',
      label: 'Data completeness',
      value: completenessScore,
      unit: '%',
      status: completenessScore >= 90 ? 'good' : completenessScore >= 60 ? 'watch' : 'critical',
      definition: 'Combined readiness of schedule dates, cost allocation, and activity progress.',
      source: 'Schedule, cost-control, and progress completeness checks',
      calculation: 'Average(schedule completeness, capped cost allocation, progress coverage)',
      completeness: 'complete'
    }
  ];

  const exceptions: ExecutiveException[] = [];
  for (const warning of schedule.warnings.slice(0, 12)) {
    exceptions.push({
      id: `schedule-${warning.code}-${warning.activityId ?? warning.relationshipId ?? warning.message}`,
      category: 'schedule',
      severity: warning.severity === 'error' ? 'critical' : warning.severity === 'warning' ? 'warning' : 'information',
      title: warning.code.replaceAll('_', ' '),
      detail: warning.message,
      activityId: warning.activityId
    });
  }
  for (const activity of progress.activities.filter((item) => item.isOutOfSequence).slice(0, 8)) {
    exceptions.push({ id: `progress-${activity.activityId}`, category: 'progress', severity: 'warning', title: 'Out-of-sequence progress', detail: `${activity.activityId} started before one or more predecessors finished.`, activityId: activity.activityId });
  }
  for (const activityId of controls.completeness.activitiesWithoutBudget.slice(0, 8)) {
    exceptions.push({ id: `budget-${activityId}`, category: 'cost', severity: 'warning', title: 'Activity has no budget loading', detail: `${activityId} is dated but has no allocated budget.`, activityId });
  }
  for (const exposure of risk.riskExposure.slice(0, 5)) {
    exceptions.push({ id: `risk-${exposure.riskId}`, category: 'risk', severity: exposure.score >= 5 ? 'critical' : 'warning', title: exposure.title, detail: `${round(exposure.expectedScheduleExposureDays)} expected days and ${roundMoney(exposure.expectedCostExposure)} expected cost exposure.` });
  }
  for (const row of risk.histogram.filter((item) => item.overAllocated).slice(0, 8)) {
    exceptions.push({ id: `resource-${row.resourceId}-${row.date}`, category: 'resource', severity: 'warning', title: 'Resource over-allocation', detail: `${row.resourceId} is assigned ${row.assigned} against ${row.availability} available on ${row.date}.` });
  }
  if (completenessScore < 90) exceptions.push({ id: 'data-completeness', category: 'data', severity: completenessScore < 60 ? 'critical' : 'warning', title: 'Incomplete control data', detail: `Overall control-data completeness is ${completenessScore}%. Metrics should be interpreted with the disclosed completeness states.` });

  const baseline = project.baselines.find((item) => item.id === project.activeBaselineId);
  const baselineById = new Map(baseline?.activities.map((activity) => [activity.activityId, activity]) ?? []);
  const progressById = new Map(progress.activities.map((item) => [item.activityId, item]));
  const milestones: ExecutiveMilestone[] = schedule.activities
    .filter((activity) => activity.type === 'milestone')
    .map((activity) => {
      const activityProgress = project.progress[activity.id];
      const forecastDate = progressById.get(activity.id)?.forecastFinish ?? activity.earlyFinishDate;
      const baselineFinish = baselineById.get(activity.id)?.plannedFinish;
      const varianceDays = baselineFinish ? calendarDayDelta(baselineFinish, forecastDate) : undefined;
      const state = activityProgress?.actualFinish ? 'complete' : forecastDate.slice(0, 10) < project.statusDate ? 'late' : 'upcoming';
      return { activityId: activity.id, name: activity.name, forecastDate, state, varianceDays };
    })
    .sort((left, right) => left.forecastDate.localeCompare(right.forecastDate))
    .slice(0, 10);

  return {
    statusDate: project.statusDate,
    generatedAt: new Date().toISOString(),
    projectRevision: project.revision,
    engineVersion: schedule.engineVersion,
    metrics,
    exceptions: exceptions.sort((left, right) => severityRank(left.severity) - severityRank(right.severity) || left.category.localeCompare(right.category)).slice(0, 30),
    milestones,
    curve: controls.curves.map((point) => ({ period: point.period, planned: point.plannedEarly, earned: point.earned, actual: point.actual })),
    completenessScore
  };
}

function ratioStatus(value: number | null): ExecutiveMetricStatus {
  if (value === null || !Number.isFinite(value)) return 'unavailable';
  if (value >= 1) return 'good';
  if (value >= 0.9) return 'watch';
  return 'critical';
}

function severityRank(severity: ExecutiveException['severity']): number { return severity === 'critical' ? 0 : severity === 'warning' ? 1 : 2; }
function calendarDayDelta(planned: string, forecast: string): number {
  const start = Date.parse(`${planned.slice(0, 10)}T00:00:00Z`);
  const finish = Date.parse(`${forecast.slice(0, 10)}T00:00:00Z`);
  return Math.round((finish - start) / 86_400_000);
}
function round(value: number): number { return Math.round((value + Number.EPSILON) * 100) / 100; }
function roundMoney(value: number): number { return Math.round((value + Number.EPSILON) * 100) / 100; }
