export type DashboardMetric =
  | 'schedule-duration'
  | 'critical-activities'
  | 'near-critical-activities'
  | 'weighted-progress'
  | 'bac'
  | 'spi'
  | 'cpi'
  | 'risk-cost-exposure'
  | 'risk-count'
  | 'overallocated-resource-days'
  | 'boq-total'
  | 'control-findings'
  | 'allocation-completeness';

export type DashboardWidgetKind = 'metric' | 'findings' | 's-curve' | 'milestones' | 'quick-actions';

export interface DashboardWidget {
  id: string;
  title: string;
  metric?: DashboardMetric;
  kind?: DashboardWidgetKind;
  size: 'small' | 'medium' | 'large';
}

export interface DashboardDefinition {
  id: string;
  name: string;
  widgets: DashboardWidget[];
}

export type EnterpriseReportKind =
  | 'executive'
  | 'update'
  | 'critical-path'
  | 'look-ahead'
  | 'boq'
  | 'cash-flow'
  | 'evm'
  | 'productivity'
  | 'resource'
  | 'risk'
  | 'change'
  | 'audit';

export interface ReportSnapshot {
  id: string;
  name: string;
  kind: EnterpriseReportKind;
  createdAt: string;
  projectRevision: number;
  statusDate: string;
  inputHash: string;
  engineVersion: string;
  rows: Array<Record<string, string | number | boolean | null>>;
}

export interface ManualOverride {
  id: string;
  path: string;
  previousValue: string | number | boolean | null;
  newValue: string | number | boolean | null;
  reason: string;
  author: string;
  createdAt: string;
}

export interface DiagnosticEvent {
  id: string;
  code: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  occurredAt: string;
  context?: Record<string, string | number | boolean | null>;
}

export interface EnterpriseModel {
  dashboards: DashboardDefinition[];
  reportSnapshots: ReportSnapshot[];
  overrides: ManualOverride[];
  diagnostics: DiagnosticEvent[];
}

export interface DashboardValue {
  metric: DashboardMetric;
  value: number | null;
  unit: string;
  completeness: 'complete' | 'partial' | 'unavailable';
}

export interface AuditSummary {
  rows: Array<{ commandId: string; commandType: string; createdAt: string; summary: string; mapped: boolean }>;
  mappedCount: number;
  unmappedCommandTypes: string[];
  overrideCount: number;
}

export interface FormulaExplanation {
  metric: string;
  formula: string;
  description: string;
  undefinedWhen: string;
  assumptions: string[];
}

export interface SupportBundle {
  manifest: {
    generatedAt: string;
    applicationVersion: string;
    projectSchemaVersion: number;
    projectRevision: number;
    projectId: string;
  };
  projectSummary: Record<string, unknown>;
  audit: AuditSummary;
  diagnostics: DiagnosticEvent[];
  redactions: string[];
}
