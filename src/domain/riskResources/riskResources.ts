import { dateToOrdinal, ordinalToDate } from '../calendar/calendar';
import type { ProjectRecord } from '../project/types';
import type { ScheduleResult } from '../schedule/types';
import type {
  FieldRecord,
  PertActivityResult,
  PertAnalysis,
  ResourceHistogramRow,
  RiskExposure,
  RiskResourceModel,
  RiskResourceResult
} from './types';

const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_EVIDENCE_BYTES = 25 * 1024 * 1024;

export function createEmptyRiskResources(): RiskResourceModel {
  return {
    pertEstimates: [],
    risks: [],
    productivityPlans: [],
    fieldRecords: [],
    resources: [],
    assignments: []
  };
}

export function analyzeRiskResources(project: ProjectRecord, schedule: ScheduleResult): RiskResourceResult {
  return {
    pert: calculatePert(project.riskResources, schedule),
    riskExposure: calculateRiskExposure(project.riskResources),
    productivity: calculateProductivity(project.riskResources),
    histogram: calculateResourceHistogram(project.riskResources, schedule),
    validationIssues: validateRiskResources(project, schedule)
  };
}

export function calculatePert(model: RiskResourceModel, schedule: ScheduleResult): PertAnalysis {
  const warnings: string[] = [];
  const activities: PertActivityResult[] = [];
  for (const estimate of model.pertEstimates) {
    if (
      !Number.isFinite(estimate.optimistic) ||
      !Number.isFinite(estimate.mostLikely) ||
      !Number.isFinite(estimate.pessimistic) ||
      estimate.optimistic < 0 ||
      estimate.optimistic > estimate.mostLikely ||
      estimate.mostLikely > estimate.pessimistic
    ) {
      warnings.push(`${estimate.activityId} has an invalid optimistic/most-likely/pessimistic ordering.`);
      continue;
    }
    const expectedDuration = round((estimate.optimistic + 4 * estimate.mostLikely + estimate.pessimistic) / 6);
    const standardDeviation = round((estimate.pessimistic - estimate.optimistic) / 6);
    const variance = round(standardDeviation ** 2);
    activities.push({ ...estimate, expectedDuration, variance, standardDeviation });
  }

  const byActivity = new Map(activities.map((item) => [item.activityId, item]));
  const critical = schedule.criticalActivityIds
    .filter((id) => id !== 'START' && id !== 'FINISH')
    .map((id) => byActivity.get(id))
    .filter((item): item is PertActivityResult => Boolean(item));
  const missingCritical = schedule.criticalActivityIds.filter((id) => id !== 'START' && id !== 'FINISH' && !byActivity.has(id));
  if (missingCritical.length > 0) warnings.push(`Critical activities without PERT estimates: ${missingCritical.join(', ')}.`);
  if (critical.some((item) => item.optimistic === item.pessimistic)) warnings.push('One or more PERT estimates have zero uncertainty.');

  const criticalPathExpectedDuration = round(critical.reduce((sum, item) => sum + item.expectedDuration, 0));
  const criticalPathVariance = round(critical.reduce((sum, item) => sum + item.variance, 0));
  const criticalPathStandardDeviation = round(Math.sqrt(criticalPathVariance));
  let completionProbability: number | null = null;
  if (model.targetCompletionDays !== undefined && criticalPathStandardDeviation > 0) {
    completionProbability = round(normalCdf((model.targetCompletionDays - criticalPathExpectedDuration) / criticalPathStandardDeviation));
  }
  const totalVariance = activities.reduce((sum, item) => sum + item.variance, 0);
  const sensitivity = [...activities]
    .sort((left, right) => right.variance - left.variance || left.activityId.localeCompare(right.activityId))
    .map((item) => ({ activityId: item.activityId, variance: item.variance, sharePercent: totalVariance === 0 ? 0 : round(item.variance / totalVariance * 100) }));

  return {
    activities,
    criticalPathExpectedDuration,
    criticalPathVariance,
    criticalPathStandardDeviation,
    targetCompletionDays: model.targetCompletionDays,
    completionProbability,
    sensitivity,
    warnings
  };
}

export function calculateRiskExposure(model: RiskResourceModel): RiskExposure[] {
  return model.risks
    .filter((risk) => risk.status !== 'closed')
    .map((risk) => {
      const probability = clamp(risk.probabilityPercent, 0, 100) / 100;
      const expectedCostExposure = roundMoney(probability * Math.max(0, risk.impactCost));
      const expectedScheduleExposureDays = round(probability * Math.max(0, risk.impactDays));
      return {
        riskId: risk.id,
        title: risk.title,
        expectedCostExposure,
        expectedScheduleExposureDays,
        score: round(probability * (Math.max(0, risk.impactDays) + Math.log10(Math.max(1, risk.impactCost))))
      };
    })
    .sort((left, right) => right.score - left.score || left.riskId.localeCompare(right.riskId));
}

export function calculateProductivity(model: RiskResourceModel) {
  return model.productivityPlans.map((plan) => {
    const records = model.fieldRecords.filter((record) => record.activityId === plan.activityId);
    const completedQuantity = round(records.reduce((sum, record) => sum + convertQuantity(record.completedQuantity, record.unit, plan.unit), 0));
    const distinctDays = new Set(records.map((record) => record.date)).size;
    const actualRatePerDay = distinctDays === 0 ? null : round(completedQuantity / distinctDays);
    const remainingQuantity = round(Math.max(0, plan.quantity - completedQuantity));
    const forecastDaysRemaining = actualRatePerDay === null || actualRatePerDay <= 0 ? null : round(remainingQuantity / actualRatePerDay);
    const laborHours = records.reduce((sum, record) => sum + Math.max(0, record.laborHours), 0);
    const equipmentHours = records.reduce((sum, record) => sum + Math.max(0, record.equipmentHours), 0);
    return {
      planId: plan.id,
      activityId: plan.activityId,
      plannedRatePerDay: plan.plannedRatePerDay,
      actualRatePerDay,
      completedQuantity,
      remainingQuantity,
      forecastDaysRemaining,
      laborProductivity: laborHours === 0 ? null : round(completedQuantity / laborHours),
      equipmentProductivity: equipmentHours === 0 ? null : round(completedQuantity / equipmentHours)
    };
  });
}

export function calculateResourceHistogram(model: RiskResourceModel, schedule: ScheduleResult): ResourceHistogramRow[] {
  const resources = new Map(model.resources.map((item) => [item.id, item]));
  const activities = new Map(schedule.activities.map((item) => [item.id, item]));
  const assigned = new Map<string, number>();
  for (const assignment of model.assignments) {
    const activity = activities.get(assignment.activityId);
    if (!activity) continue;
    const start = dateToOrdinal(activity.earlyStartDate.slice(0, 10));
    const finish = Math.max(start, dateToOrdinal(activity.earlyFinishDate.slice(0, 10)));
    for (let day = start; day <= finish; day += 1) {
      const key = `${assignment.resourceId}|${ordinalToDate(day)}`;
      assigned.set(key, round((assigned.get(key) ?? 0) + assignment.unitsPerDay));
    }
  }
  return [...assigned.entries()]
    .map(([key, units]) => {
      const [resourceId, date] = key.split('|');
      const availability = resources.get(resourceId)?.availabilityPerDay ?? 0;
      return {
        resourceId,
        date,
        assigned: units,
        availability,
        overAllocated: units > availability,
        utilizationPercent: availability <= 0 ? null : round(units / availability * 100)
      };
    })
    .sort((left, right) => left.date.localeCompare(right.date) || left.resourceId.localeCompare(right.resourceId));
}

export function validateRiskResources(project: ProjectRecord, schedule?: ScheduleResult): string[] {
  const model = project.riskResources;
  const issues: string[] = [];
  const activityIds = new Set(project.activities.map((item) => item.id));
  const resourceIds = new Set(model.resources.map((item) => item.id));
  const scheduleIds = new Set(schedule?.activities.map((item) => item.id) ?? project.activities.map((item) => item.id));
  for (const estimate of model.pertEstimates) if (!activityIds.has(estimate.activityId)) issues.push(`PERT estimate references missing activity ${estimate.activityId}.`);
  for (const risk of model.risks) {
    if (!risk.id.trim() || !risk.title.trim()) issues.push('Every risk requires an ID and title.');
    if (!Number.isFinite(risk.probabilityPercent) || risk.probabilityPercent < 0 || risk.probabilityPercent > 100) issues.push(`Risk ${risk.id} has invalid probability.`);
    for (const id of risk.linkedActivityIds) if (!activityIds.has(id)) issues.push(`Risk ${risk.id} links missing activity ${id}.`);
  }
  for (const plan of model.productivityPlans) {
    if (!activityIds.has(plan.activityId)) issues.push(`Productivity plan ${plan.id} references missing activity.`);
    if (!Number.isFinite(plan.quantity) || plan.quantity < 0 || !Number.isFinite(plan.plannedRatePerDay) || plan.plannedRatePerDay < 0) issues.push(`Productivity plan ${plan.id} has invalid values.`);
  }
  const totalEvidence = model.fieldRecords.reduce((sum, record) => sum + Math.max(0, record.evidenceBytes), 0);
  for (const record of model.fieldRecords) {
    if (!activityIds.has(record.activityId)) issues.push(`Field record ${record.id} references missing activity.`);
    if (record.evidenceBytes > MAX_EVIDENCE_BYTES) issues.push(`Field record ${record.id} exceeds the 5 MB evidence limit.`);
  }
  if (totalEvidence > MAX_TOTAL_EVIDENCE_BYTES) issues.push('Field evidence exceeds the 25 MB project limit.');
  for (const resource of model.resources) {
    if (!resource.id.trim() || !resource.name.trim()) issues.push('Every resource requires an ID and name.');
    if (!Number.isFinite(resource.availabilityPerDay) || resource.availabilityPerDay < 0) issues.push(`Resource ${resource.id} has invalid availability.`);
  }
  for (const assignment of model.assignments) {
    if (!resourceIds.has(assignment.resourceId)) issues.push(`Assignment ${assignment.id} references missing resource.`);
    if (!scheduleIds.has(assignment.activityId)) issues.push(`Assignment ${assignment.id} references missing activity.`);
    if (!Number.isFinite(assignment.unitsPerDay) || assignment.unitsPerDay < 0) issues.push(`Assignment ${assignment.id} has invalid units per day.`);
  }
  return issues;
}

export function convertQuantity(value: number, fromUnit: string, toUnit: string): number {
  const from = normalizeUnit(fromUnit);
  const to = normalizeUnit(toUnit);
  if (from === to) return value;
  const factors: Record<string, { dimension: string; factor: number }> = {
    mm: { dimension: 'length', factor: 0.001 }, cm: { dimension: 'length', factor: 0.01 }, m: { dimension: 'length', factor: 1 }, km: { dimension: 'length', factor: 1000 },
    'cm2': { dimension: 'area', factor: 0.0001 }, 'm2': { dimension: 'area', factor: 1 },
    ml: { dimension: 'volume', factor: 0.001 }, l: { dimension: 'volume', factor: 1 }, 'm3': { dimension: 'volume', factor: 1000 },
    g: { dimension: 'mass', factor: 0.001 }, kg: { dimension: 'mass', factor: 1 }, t: { dimension: 'mass', factor: 1000 },
    each: { dimension: 'count', factor: 1 }, pc: { dimension: 'count', factor: 1 }
  };
  const source = factors[from];
  const target = factors[to];
  if (!source || !target || source.dimension !== target.dimension) throw new Error(`Cannot convert ${fromUnit} to ${toUnit}.`);
  return value * source.factor / target.factor;
}

function normalizeUnit(unit: string): string {
  return unit.trim().toLowerCase().replace('²', '2').replace('³', '3').replace('tonne', 't').replace('liter', 'l').replace('litre', 'l');
}

function normalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.sqrt(2)));
}

function erf(value: number): number {
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value);
  const a1 = 0.254829592; const a2 = -0.284496736; const a3 = 1.421413741; const a4 = -1.453152027; const a5 = 1.061405429; const p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

function clamp(value: number, minimum: number, maximum: number): number { return Math.max(minimum, Math.min(maximum, value)); }
function round(value: number): number { return Math.round((value + Number.EPSILON) * 10_000) / 10_000; }
function roundMoney(value: number): number { return Math.round((value + Number.EPSILON) * 100) / 100; }
