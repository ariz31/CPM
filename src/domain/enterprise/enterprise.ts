import { calculateEstimate } from '../estimating/estimating';
import { analyzeProgress } from '../progress/progress';
import type { JournalEntry, ProjectRecord } from '../project/types';
import type { ScheduleResult } from '../schedule/types';
import type { CostControlResult } from '../controls/types';
import type { RiskResourceResult } from '../riskResources/types';
import type {
  AuditSummary,
  DashboardDefinition,
  DashboardValue,
  EnterpriseModel,
  EnterpriseReportKind,
  FormulaExplanation,
  ManualOverride,
  ReportSnapshot,
  SupportBundle
} from './types';

export const AUDIT_COMMAND_REGISTRY: Record<string, string> = {
  PROJECT_CREATE: 'Created project',
  PROJECT_SAVE: 'Saved project',
  PROJECT_RENAME: 'Renamed project',
  PROJECT_ACTIVE: 'Activated project',
  PROJECT_ARCHIVED: 'Archived project',
  PROJECT_TRASHED: 'Moved project to trash',
  PROJECT_IMPORT: 'Imported project',
  SNAPSHOT_RESTORE: 'Restored project snapshot',
  REPLACE_PROJECT: 'Replaced authoritative project revision',
  ADD_ACTIVITY: 'Added activity',
  UPDATE_ACTIVITY: 'Updated activity',
  DELETE_ACTIVITY: 'Deleted activity',
  BULK_UPDATE_ACTIVITIES: 'Bulk-updated activities',
  ADD_RELATIONSHIP: 'Added relationship',
  DELETE_RELATIONSHIP: 'Deleted relationship',
  ADD_WBS: 'Added WBS node',
  DELETE_WBS: 'Deleted WBS node',
  ADD_CALENDAR: 'Added calendar',
  UPDATE_CALENDAR: 'Updated calendar'
};

export function createEmptyEnterprise(): EnterpriseModel {
  return {
    dashboards: [createDefaultDashboard()],
    reportSnapshots: [],
    overrides: [],
    diagnostics: []
  };
}

export function createDefaultDashboard(): DashboardDefinition {
  return {
    id: 'DASH-EXECUTIVE',
    name: 'Executive project controls',
    widgets: [
      { id: 'W-PROGRESS', title: 'Overall progress', metric: 'weighted-progress', size: 'small' },
      { id: 'W-DURATION', title: 'Schedule duration', metric: 'schedule-duration', size: 'small' },
      { id: 'W-SPI', title: 'Schedule performance', metric: 'spi', size: 'small' },
      { id: 'W-CPI', title: 'Cost performance', metric: 'cpi', size: 'small' },
      { id: 'W-BAC', title: 'Budget at completion', metric: 'bac', size: 'medium' },
      { id: 'W-RISK', title: 'Risk cost exposure', metric: 'risk-cost-exposure', size: 'medium' },
      { id: 'W-RESOURCE', title: 'Overallocated resource days', metric: 'overallocated-resource-days', size: 'medium' }
    ]
  };
}

export function buildDashboardValues(
  project: ProjectRecord,
  schedule: ScheduleResult,
  controls: CostControlResult,
  riskResources: RiskResourceResult
): DashboardValue[] {
  const progress = analyzeProgress(project, schedule);
  const estimate = calculateEstimate(project.boq);
  const riskCost = riskResources.riskExposure.reduce((sum, item) => sum + item.expectedCostExposure, 0);
  const overallocated = riskResources.histogram.filter((item) => item.overAllocated).length;
  return [
    { metric: 'schedule-duration', value: schedule.projectDuration, unit: 'days', completeness: 'complete' },
    { metric: 'critical-activities', value: schedule.criticalActivityIds.length, unit: 'activities', completeness: 'complete' },
    { metric: 'weighted-progress', value: progress.overallPercentComplete, unit: '%', completeness: Object.keys(project.progress).length === 0 ? 'partial' : 'complete' },
    { metric: 'bac', value: controls.metrics.bac, unit: project.metadata.currency, completeness: controls.completeness.allocationPercent === 100 ? 'complete' : 'partial' },
    { metric: 'spi', value: controls.metrics.spi, unit: 'ratio', completeness: controls.metrics.spi === null ? 'unavailable' : 'complete' },
    { metric: 'cpi', value: controls.metrics.cpi, unit: 'ratio', completeness: controls.metrics.cpi === null ? 'unavailable' : 'complete' },
    { metric: 'risk-cost-exposure', value: roundMoney(riskCost), unit: project.metadata.currency, completeness: project.riskResources.risks.length === 0 ? 'unavailable' : 'complete' },
    { metric: 'overallocated-resource-days', value: overallocated, unit: 'resource-days', completeness: project.riskResources.resources.length === 0 ? 'unavailable' : 'complete' },
    { metric: 'boq-total', value: estimate.totalCost, unit: project.metadata.currency, completeness: project.boq.items.length === 0 ? 'unavailable' : 'complete' }
  ];
}

export function buildReportRows(
  kind: EnterpriseReportKind,
  project: ProjectRecord,
  schedule: ScheduleResult,
  controls: CostControlResult,
  riskResources: RiskResourceResult,
  journal: JournalEntry[] = []
): Array<Record<string, string | number | boolean | null>> {
  if (kind === 'executive') {
    return buildDashboardValues(project, schedule, controls, riskResources).map((item) => ({ metric: item.metric, value: item.value, unit: item.unit, completeness: item.completeness }));
  }
  if (kind === 'evm') return [{ ...controls.metrics, statusDate: project.statusDate, allocationPercent: controls.completeness.allocationPercent }];
  if (kind === 'cash-flow') return controls.cashFlow.map((item) => ({ ...item }));
  if (kind === 'productivity') return riskResources.productivity.map((item) => ({ ...item }));
  if (kind === 'resource') return riskResources.histogram.map((item) => ({ ...item }));
  if (kind === 'risk') return riskResources.riskExposure.map((item) => ({ ...item }));
  if (kind === 'audit') return summarizeAudit(journal, project.enterprise.overrides).rows.map((item) => ({ ...item }));
  if (kind === 'boq') return calculateEstimate(project.boq).items.map((item) => ({ code: item.code, description: item.description, unit: item.unit, quantity: item.quantity, unitRate: item.unitRate, amount: item.directAmount, allocationStatus: item.allocationStatus }));
  if (kind === 'critical-path') return schedule.activities.filter((item) => item.isCritical).map((item) => ({ activityId: item.id, name: item.name, earlyStart: item.earlyStartDate, earlyFinish: item.earlyFinishDate, totalFloat: item.totalFloat }));
  if (kind === 'look-ahead') return schedule.activities.filter((item) => item.earlyStartDate.slice(0, 10) >= project.statusDate).map((item) => ({ activityId: item.id, name: item.name, start: item.earlyStartDate, finish: item.earlyFinishDate, critical: item.isCritical }));
  if (kind === 'update') {
    const progress = analyzeProgress(project, schedule);
    return progress.activities.map((item) => ({ ...item }));
  }
  if (kind === 'change') return project.enterprise.overrides.map((item) => ({ path: item.path, previousValue: item.previousValue, newValue: item.newValue, reason: item.reason, author: item.author, createdAt: item.createdAt }));
  return [];
}

export function createReportSnapshot(
  project: ProjectRecord,
  kind: EnterpriseReportKind,
  rows: Array<Record<string, string | number | boolean | null>>,
  engineVersion: string,
  name = `${kind} report`,
  createdAt = new Date().toISOString()
): ReportSnapshot {
  const input = { projectId: project.id, projectRevision: project.revision, statusDate: project.statusDate, kind, engineVersion, rows };
  return {
    id: crypto.randomUUID(),
    name: name.trim() || `${kind} report`,
    kind,
    createdAt,
    projectRevision: project.revision,
    statusDate: project.statusDate,
    inputHash: stableHash(input),
    engineVersion,
    rows: structuredClone(rows)
  };
}

export function addReportSnapshot(project: ProjectRecord, snapshot: ReportSnapshot): ProjectRecord {
  if (project.enterprise.reportSnapshots.some((item) => item.id === snapshot.id)) throw new Error('Report snapshot ID already exists.');
  return { ...project, enterprise: { ...project.enterprise, reportSnapshots: [...project.enterprise.reportSnapshots, structuredClone(snapshot)] } };
}

export function createManualOverride(
  path: string,
  previousValue: ManualOverride['previousValue'],
  newValue: ManualOverride['newValue'],
  reason: string,
  author: string,
  createdAt = new Date().toISOString()
): ManualOverride {
  if (!path.trim() || !reason.trim()) throw new Error('Manual overrides require a field path and reason.');
  return { id: crypto.randomUUID(), path, previousValue, newValue, reason, author: author.trim() || 'Local user', createdAt };
}

export function summarizeAudit(entries: JournalEntry[], overrides: ManualOverride[]): AuditSummary {
  const rows = entries.map((entry) => ({
    commandId: entry.commandId,
    commandType: entry.commandType,
    createdAt: entry.createdAt,
    summary: entry.summary,
    mapped: Boolean(AUDIT_COMMAND_REGISTRY[entry.commandType])
  }));
  return {
    rows,
    mappedCount: rows.filter((item) => item.mapped).length,
    unmappedCommandTypes: [...new Set(rows.filter((item) => !item.mapped).map((item) => item.commandType))].sort(),
    overrideCount: overrides.length
  };
}

export function explainFormula(metric: string): FormulaExplanation {
  const formulas: Record<string, FormulaExplanation> = {
    PV: { metric: 'PV', formula: 'Σ time-phased budget scheduled through the status date', description: 'Planned value measures authorized work scheduled.', undefinedWhen: 'Never when a valid budget exists; otherwise reported as zero with partial completeness.', assumptions: ['Uses the selected early planned curve.', 'BOQ allocation percentages are not silently normalized.'] },
    EV: { metric: 'EV', formula: 'Σ activity budget × activity percent complete', description: 'Earned value measures budgeted value of completed work.', undefinedWhen: 'Never when a valid budget exists; missing progress contributes zero and marks completeness partial.', assumptions: ['Latest authoritative progress is used.', 'Each activity has one budget loading.'] },
    AC: { metric: 'AC', formula: 'Σ actual cost records dated on or before the status date', description: 'Actual cost measures recorded expenditure.', undefinedWhen: 'Never; absence of records is disclosed as incomplete actual-cost data.', assumptions: ['Actual costs are entered in project currency.', 'No hidden accruals are invented.'] },
    SPI: { metric: 'SPI', formula: 'EV ÷ PV', description: 'Schedule performance efficiency in earned-value terms.', undefinedWhen: 'PV is zero.', assumptions: ['EV and PV use the same budget basis.'] },
    CPI: { metric: 'CPI', formula: 'EV ÷ AC', description: 'Cost performance efficiency.', undefinedWhen: 'AC is zero.', assumptions: ['EV and AC use the same currency and status date.'] },
    EAC: { metric: 'EAC', formula: 'BAC ÷ CPI', description: 'Forecast cost at completion if current cost efficiency continues.', undefinedWhen: 'CPI is zero or undefined.', assumptions: ['Current CPI persists for remaining work.'] },
    PERT: { metric: 'PERT expected duration', formula: '(O + 4M + P) ÷ 6', description: 'Beta-distribution approximation of expected activity duration.', undefinedWhen: 'Optimistic, most-likely, and pessimistic values are invalid.', assumptions: ['Path durations are independent for variance aggregation.', 'Normal approximation is used for completion probability.'] }
  };
  return formulas[metric.toUpperCase()] ?? { metric, formula: 'No registered formula', description: 'This metric does not yet have a registered explanation.', undefinedWhen: 'Not applicable.', assumptions: [] };
}

export function buildSupportBundle(project: ProjectRecord, entries: JournalEntry[], applicationVersion: string): SupportBundle {
  const audit = summarizeAudit(entries, project.enterprise.overrides);
  const source = {
    name: project.name,
    metadata: project.metadata,
    status: project.status,
    statusDate: project.statusDate,
    counts: {
      activities: project.activities.length,
      relationships: project.relationships.length,
      boqItems: project.boq.items.length,
      baselines: project.baselines.length,
      risks: project.riskResources.risks.length,
      resources: project.riskResources.resources.length,
      reportSnapshots: project.enterprise.reportSnapshots.length
    }
  };
  const redactions: string[] = [];
  const projectSummary = redact(source, redactions, 'project') as Record<string, unknown>;
  const diagnostics = project.enterprise.diagnostics.slice(-500).map((event) => redact(event, redactions, `diagnostic.${event.id}`) as typeof event);
  return {
    manifest: {
      generatedAt: new Date().toISOString(),
      applicationVersion,
      projectSchemaVersion: project.schemaVersion,
      projectRevision: project.revision,
      projectId: project.id
    },
    projectSummary,
    audit,
    diagnostics,
    redactions: [...new Set(redactions)].sort()
  };
}

function redact(value: unknown, redactions: string[], path: string): unknown {
  if (Array.isArray(value)) return value.map((item, index) => redact(item, redactions, `${path}[${index}]`));
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      const nextPath = `${path}.${key}`;
      if (/owner|contractor|consultant|location|email|phone|token|secret|password|authorization/i.test(key)) {
        result[key] = '[REDACTED]';
        redactions.push(nextPath);
      } else result[key] = redact(item, redactions, nextPath);
    }
    return result;
  }
  if (typeof value === 'string') {
    const cleaned = value
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]')
      .replace(/\b(?:bearer\s+)?[A-Za-z0-9_-]{24,}\b/gi, '[REDACTED_TOKEN]');
    if (cleaned !== value) redactions.push(path);
    return cleaned;
  }
  return value;
}

function stableHash(value: unknown): string {
  const text = stableStringify(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}

function roundMoney(value: number): number { return Math.round((value + Number.EPSILON) * 100) / 100; }
