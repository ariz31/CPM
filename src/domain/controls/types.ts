export type PhasingMethod = 'uniform' | 'front-loaded' | 'back-loaded' | 'bell' | 'custom' | 'milestone';
export type CurvePeriod = 'daily' | 'weekly' | 'monthly' | 'fiscal';

export interface ActivityCostLoading {
  activityId: string;
  budgetCost?: number;
  budgetQuantity?: number;
  phasing: PhasingMethod;
  customWeights?: number[];
}

export interface ActualCostRecord {
  id: string;
  activityId?: string;
  date: string;
  amount: number;
  description: string;
  source: 'manual' | 'import' | 'invoice' | 'field';
}

export interface CashFlowSettings {
  billingLagDays: number;
  advancePercent: number;
  advanceRecoveryPercent: number;
  retentionPercent: number;
  retentionReleaseLagDays: number;
  taxPercent: number;
}

export interface CostControlModel {
  period: CurvePeriod;
  fiscalYearStartMonth: number;
  activityLoadings: ActivityCostLoading[];
  actualCosts: ActualCostRecord[];
  cashFlow: CashFlowSettings;
}

export interface CurvePoint {
  period: string;
  plannedEarly: number;
  plannedLate: number;
  actual: number;
  earned: number;
  forecast: number;
}

export interface CashFlowPoint {
  period: string;
  grossBilling: number;
  advance: number;
  recovery: number;
  retention: number;
  retentionRelease: number;
  tax: number;
  netCashFlow: number;
  cumulativeNetCashFlow: number;
}

export interface EvmMetrics {
  pv: number;
  ev: number;
  ac: number;
  bac: number;
  sv: number;
  cv: number;
  spi: number | null;
  cpi: number | null;
  eac: number | null;
  etc: number | null;
  vac: number | null;
  tcpi: number | null;
}

export interface CostCompleteness {
  estimateTotal: number;
  allocatedBudget: number;
  allocationPercent: number | null;
  activitiesWithoutDates: string[];
  activitiesWithoutBudget: string[];
}

export interface CostControlResult {
  curves: CurvePoint[];
  cashFlow: CashFlowPoint[];
  metrics: EvmMetrics;
  completeness: CostCompleteness;
  assumptions: string[];
}
