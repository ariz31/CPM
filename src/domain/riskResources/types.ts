export interface PertEstimate {
  activityId: string;
  optimistic: number;
  mostLikely: number;
  pessimistic: number;
}

export interface RiskRecord {
  id: string;
  title: string;
  probabilityPercent: number;
  impactDays: number;
  impactCost: number;
  owner: string;
  status: 'open' | 'mitigating' | 'closed' | 'accepted';
  linkedActivityIds: string[];
  response: string;
}

export interface ProductivityPlan {
  id: string;
  activityId: string;
  description: string;
  quantity: number;
  unit: string;
  plannedRatePerDay: number;
}

export interface FieldRecord {
  id: string;
  activityId: string;
  date: string;
  completedQuantity: number;
  unit: string;
  laborHours: number;
  equipmentHours: number;
  notes: string;
  evidenceBytes: number;
}

export type ResourceKind = 'labor' | 'equipment' | 'material' | 'cost';

export interface ResourceDefinition {
  id: string;
  name: string;
  kind: ResourceKind;
  unit: string;
  availabilityPerDay: number;
  costRate: number;
}

export interface ResourceAssignment {
  id: string;
  resourceId: string;
  activityId: string;
  unitsPerDay: number;
}

export interface RiskResourceModel {
  pertEstimates: PertEstimate[];
  targetCompletionDays?: number;
  risks: RiskRecord[];
  productivityPlans: ProductivityPlan[];
  fieldRecords: FieldRecord[];
  resources: ResourceDefinition[];
  assignments: ResourceAssignment[];
}

export interface PertActivityResult extends PertEstimate {
  expectedDuration: number;
  variance: number;
  standardDeviation: number;
}

export interface PertAnalysis {
  activities: PertActivityResult[];
  criticalPathExpectedDuration: number;
  criticalPathVariance: number;
  criticalPathStandardDeviation: number;
  targetCompletionDays?: number;
  completionProbability: number | null;
  sensitivity: Array<{ activityId: string; variance: number; sharePercent: number }>;
  warnings: string[];
}

export interface RiskExposure {
  riskId: string;
  title: string;
  expectedCostExposure: number;
  expectedScheduleExposureDays: number;
  score: number;
}

export interface ProductivityResult {
  planId: string;
  activityId: string;
  plannedRatePerDay: number;
  actualRatePerDay: number | null;
  completedQuantity: number;
  remainingQuantity: number;
  forecastDaysRemaining: number | null;
  laborProductivity: number | null;
  equipmentProductivity: number | null;
}

export interface ResourceHistogramRow {
  resourceId: string;
  date: string;
  assigned: number;
  availability: number;
  overAllocated: boolean;
  utilizationPercent: number | null;
}

export interface RiskResourceResult {
  pert: PertAnalysis;
  riskExposure: RiskExposure[];
  productivity: ProductivityResult[];
  histogram: ResourceHistogramRow[];
  validationIssues: string[];
}
