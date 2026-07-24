import { addCalendarDays, dateToOrdinal, ordinalToDate } from '../calendar/calendar';
import { allocateCost, calculateEstimate } from '../estimating/estimating';
import type { ProjectRecord } from '../project/types';
import type { ScheduleResult } from '../schedule/types';
import type {
  ActivityCostLoading,
  CashFlowPoint,
  CostControlModel,
  CostControlResult,
  CurvePeriod,
  CurvePoint,
  EvmMetrics,
  PhasingMethod
} from './types';

const MONEY = 100;

export function createEmptyCostControl(): CostControlModel {
  return {
    period: 'weekly',
    fiscalYearStartMonth: 1,
    activityLoadings: [],
    actualCosts: [],
    cashFlow: {
      billingLagDays: 0,
      advancePercent: 0,
      advanceRecoveryPercent: 0,
      retentionPercent: 0,
      retentionReleaseLagDays: 0,
      taxPercent: 0
    }
  };
}

export function calculateCostControl(project: ProjectRecord, schedule: ScheduleResult): CostControlResult {
  const estimate = calculateEstimate(project.boq);
  const budgets = deriveActivityBudgets(project, estimate.totalCost, estimate.directCost, estimate.items);
  const plannedEarly = new Map<string, number>();
  const plannedLate = new Map<string, number>();
  const activitiesWithoutDates: string[] = [];

  for (const [activityId, loading] of budgets) {
    const activity = schedule.activities.find((item) => item.id === activityId);
    if (!activity) {
      activitiesWithoutDates.push(activityId);
      continue;
    }
    distribute(plannedEarly, activity.earlyStartDate.slice(0, 10), activity.earlyFinishDate.slice(0, 10), loading.amount, loading.phasing, loading.customWeights);
    distribute(plannedLate, activity.lateStartDate.slice(0, 10), activity.lateFinishDate.slice(0, 10), loading.amount, loading.phasing, loading.customWeights);
  }

  const statusDate = project.statusDate;
  const pv = sumThrough(plannedEarly, statusDate);
  const ev = calculateEarnedValue(budgets, project.progress);
  const ac = roundMoney(project.controls.actualCosts.filter((item) => item.date <= statusDate).reduce((sum, item) => sum + item.amount, 0));
  const bac = roundMoney([...budgets.values()].reduce((sum, item) => sum + item.amount, 0));
  const metrics = calculateEvmMetrics(pv, ev, ac, bac);

  const actual = new Map<string, number>();
  for (const record of project.controls.actualCosts) add(actual, record.date, record.amount);
  const earnedEvents = buildEarnedEvents(project, budgets);
  const forecast = new Map<string, number>();
  for (const record of project.controls.actualCosts.filter((item) => item.date <= statusDate)) add(forecast, record.date, record.amount);
  const remaining = Math.max(0, bac - ev);
  if (remaining > 0) distribute(forecast, statusDate, schedule.projectFinishDate.slice(0, 10), remaining, 'uniform');

  const curves = buildCurves(
    project.controls.period,
    project.controls.fiscalYearStartMonth,
    plannedEarly,
    plannedLate,
    actual,
    earnedEvents,
    forecast
  );
  const cashFlow = calculateCashFlow(project, plannedEarly, schedule.projectFinishDate.slice(0, 10));
  const allocatedBudget = bac;
  const allocationPercent = estimate.totalCost === 0 ? null : roundRatio(allocatedBudget / estimate.totalCost * 100);
  const activitiesWithoutBudget = project.activities
    .filter((activity) => activity.type !== 'milestone' && !budgets.has(activity.id))
    .map((activity) => activity.id);

  return {
    curves,
    cashFlow,
    metrics,
    completeness: { estimateTotal: estimate.totalCost, allocatedBudget, allocationPercent, activitiesWithoutDates, activitiesWithoutBudget },
    assumptions: [
      'BOQ direct amounts are allocated using entered percentages; under- and over-allocation are not normalized.',
      'Estimate markups are distributed proportionally over allocated direct cost.',
      'Earned value uses the latest stored activity percent complete at the project status date.',
      'Forecast cost equals actual cost through the status date plus remaining budget at planned rates.',
      'Cash-flow tax is applied after advance recovery and retention deductions.'
    ]
  };
}

interface BudgetLoading {
  amount: number;
  phasing: PhasingMethod;
  customWeights?: number[];
}

function deriveActivityBudgets(
  project: ProjectRecord,
  estimateTotal: number,
  directCost: number,
  items: ReturnType<typeof calculateEstimate>['items']
): Map<string, BudgetLoading> {
  const derived = new Map<string, number>();
  const markupFactor = directCost > 0 ? estimateTotal / directCost : 1;
  for (const item of items) {
    for (const allocation of item.allocations) {
      add(derived, allocation.activityId, allocateCost(item, allocation) * markupFactor);
    }
  }
  const configured = new Map(project.controls.activityLoadings.map((item) => [item.activityId, item]));
  const ids = new Set([...derived.keys(), ...configured.keys()]);
  const result = new Map<string, BudgetLoading>();
  for (const id of ids) {
    const loading = configured.get(id);
    const amount = loading?.budgetCost ?? derived.get(id) ?? 0;
    if (amount <= 0) continue;
    result.set(id, { amount: roundMoney(amount), phasing: loading?.phasing ?? 'uniform', customWeights: loading?.customWeights });
  }
  return result;
}

export function calculateEvmMetrics(pv: number, ev: number, ac: number, bac: number): EvmMetrics {
  const sv = roundMoney(ev - pv);
  const cv = roundMoney(ev - ac);
  const spi = safeDivide(ev, pv);
  const cpi = safeDivide(ev, ac);
  const eac = cpi === null || cpi === 0 ? null : roundMoney(bac / cpi);
  const etc = eac === null ? null : roundMoney(eac - ac);
  const vac = eac === null ? null : roundMoney(bac - eac);
  const tcpi = safeDivide(bac - ev, bac - ac);
  return { pv: roundMoney(pv), ev: roundMoney(ev), ac: roundMoney(ac), bac: roundMoney(bac), sv, cv, spi, cpi, eac, etc, vac, tcpi };
}

export function phasingWeights(method: PhasingMethod, count: number, customWeights?: number[]): number[] {
  if (count <= 0) return [];
  if (method === 'milestone') return Array.from({ length: count }, (_, index) => index === count - 1 ? 1 : 0);
  if (method === 'custom' && customWeights?.length === count && customWeights.every((value) => Number.isFinite(value) && value >= 0)) {
    return normalize(customWeights);
  }
  const raw = Array.from({ length: count }, (_, index) => {
    if (method === 'front-loaded') return count - index;
    if (method === 'back-loaded') return index + 1;
    if (method === 'bell') return Math.min(index + 1, count - index);
    return 1;
  });
  return normalize(raw);
}

function distribute(target: Map<string, number>, start: string, finish: string, amount: number, method: PhasingMethod, customWeights?: number[]): void {
  const first = dateToOrdinal(start);
  const last = Math.max(first, dateToOrdinal(finish));
  const weights = phasingWeights(method, last - first + 1, customWeights);
  weights.forEach((weight, index) => add(target, ordinalToDate(first + index), amount * weight));
}

function buildEarnedEvents(project: ProjectRecord, budgets: Map<string, BudgetLoading>): Map<string, number> {
  const events = new Map<string, number>();
  for (const snapshot of project.updateSnapshots) events.set(snapshot.statusDate, calculateEarnedValue(budgets, snapshot.progress));
  events.set(project.statusDate, calculateEarnedValue(budgets, project.progress));
  return events;
}

function calculateEarnedValue(budgets: Map<string, BudgetLoading>, progress: ProjectRecord['progress']): number {
  let total = 0;
  for (const [activityId, budget] of budgets) total += budget.amount * Math.max(0, Math.min(100, progress[activityId]?.percentComplete ?? 0)) / 100;
  return roundMoney(total);
}

function buildCurves(
  period: CurvePeriod,
  fiscalStartMonth: number,
  plannedEarly: Map<string, number>,
  plannedLate: Map<string, number>,
  actual: Map<string, number>,
  earnedEvents: Map<string, number>,
  forecast: Map<string, number>
): CurvePoint[] {
  const dates = [...plannedEarly.keys(), ...plannedLate.keys(), ...actual.keys(), ...earnedEvents.keys(), ...forecast.keys()];
  if (dates.length === 0) return [];
  const buckets = new Set(dates.map((date) => bucketDate(date, period, fiscalStartMonth)));
  const orderedBuckets = [...buckets].sort();
  let early = 0; let late = 0; let actualTotal = 0; let forecastTotal = 0; let earned = 0;
  const earnedOrdered = [...earnedEvents.entries()].sort(([left], [right]) => left.localeCompare(right));
  return orderedBuckets.map((bucket) => {
    early += sumBucket(plannedEarly, bucket, period, fiscalStartMonth);
    late += sumBucket(plannedLate, bucket, period, fiscalStartMonth);
    actualTotal += sumBucket(actual, bucket, period, fiscalStartMonth);
    forecastTotal += sumBucket(forecast, bucket, period, fiscalStartMonth);
    const eligible = earnedOrdered.filter(([date]) => bucketDate(date, period, fiscalStartMonth) <= bucket);
    if (eligible.length > 0) earned = eligible.at(-1)![1];
    return { period: bucket, plannedEarly: roundMoney(early), plannedLate: roundMoney(late), actual: roundMoney(actualTotal), earned: roundMoney(earned), forecast: roundMoney(forecastTotal) };
  });
}

function calculateCashFlow(project: ProjectRecord, plannedDaily: Map<string, number>, projectFinish: string): CashFlowPoint[] {
  const settings = project.controls.cashFlow;
  const events = new Map<string, Omit<CashFlowPoint, 'period' | 'cumulativeNetCashFlow'>>();
  const ensure = (date: string) => {
    const existing = events.get(date);
    if (existing) return existing;
    const created = { grossBilling: 0, advance: 0, recovery: 0, retention: 0, retentionRelease: 0, tax: 0, netCashFlow: 0 };
    events.set(date, created);
    return created;
  };
  const bac = [...plannedDaily.values()].reduce((sum, value) => sum + value, 0);
  const advanceTotal = roundMoney(bac * settings.advancePercent / 100);
  let remainingAdvance = advanceTotal;
  if (advanceTotal > 0 && plannedDaily.size > 0) ensure([...plannedDaily.keys()].sort()[0]).advance = advanceTotal;
  let retained = 0;
  for (const [date, amount] of [...plannedDaily.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    const billingDate = addCalendarDays(date, settings.billingLagDays);
    const row = ensure(billingDate);
    const gross = roundMoney(amount);
    const recovery = roundMoney(Math.min(remainingAdvance, gross * settings.advanceRecoveryPercent / 100));
    remainingAdvance = roundMoney(remainingAdvance - recovery);
    const retention = roundMoney(gross * settings.retentionPercent / 100);
    retained = roundMoney(retained + retention);
    const taxable = Math.max(0, gross - recovery - retention);
    const tax = roundMoney(taxable * settings.taxPercent / 100);
    row.grossBilling = roundMoney(row.grossBilling + gross);
    row.recovery = roundMoney(row.recovery + recovery);
    row.retention = roundMoney(row.retention + retention);
    row.tax = roundMoney(row.tax + tax);
  }
  if (retained > 0) ensure(addCalendarDays(projectFinish, settings.retentionReleaseLagDays)).retentionRelease = retained;
  let cumulative = 0;
  return [...events.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([date, row]) => {
    row.netCashFlow = roundMoney(row.grossBilling + row.advance - row.recovery - row.retention - row.tax + row.retentionRelease);
    cumulative = roundMoney(cumulative + row.netCashFlow);
    return { period: bucketDate(date, project.controls.period, project.controls.fiscalYearStartMonth), ...row, cumulativeNetCashFlow: cumulative };
  });
}

function bucketDate(date: string, period: CurvePeriod, fiscalStartMonth: number): string {
  if (period === 'daily') return date;
  const ordinal = dateToOrdinal(date);
  if (period === 'weekly') {
    const weekday = new Date(ordinal * 86_400_000).getUTCDay();
    return ordinalToDate(ordinal - ((weekday + 6) % 7));
  }
  const [year, month] = date.split('-').map(Number);
  if (period === 'monthly') return `${year}-${String(month).padStart(2, '0')}`;
  const start = Math.max(1, Math.min(12, fiscalStartMonth));
  const fiscalYear = month >= start ? year + 1 : year;
  const fiscalPeriod = ((month - start + 12) % 12) + 1;
  return `FY${fiscalYear}-P${String(fiscalPeriod).padStart(2, '0')}`;
}

function sumBucket(values: Map<string, number>, bucket: string, period: CurvePeriod, fiscalStartMonth: number): number {
  let total = 0;
  for (const [date, value] of values) if (bucketDate(date, period, fiscalStartMonth) === bucket) total += value;
  return total;
}

function sumThrough(values: Map<string, number>, date: string): number {
  let total = 0;
  for (const [itemDate, value] of values) if (itemDate <= date) total += value;
  return roundMoney(total);
}

function normalize(values: number[]): number[] {
  const total = values.reduce((sum, value) => sum + value, 0);
  return total <= 0 ? values.map(() => 1 / values.length) : values.map((value) => value / total);
}

function add(map: Map<string, number>, key: string, value: number): void {
  map.set(key, roundMoney((map.get(key) ?? 0) + value));
}

function safeDivide(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null;
  return roundRatio(numerator / denominator);
}

function roundMoney(value: number): number { return Math.round((value + Number.EPSILON) * MONEY) / MONEY; }
function roundRatio(value: number): number { return Math.round((value + Number.EPSILON) * 10_000) / 10_000; }
