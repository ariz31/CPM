import { analyzeRiskResources } from '../riskResources/riskResources';
import type { RiskResourceResult } from '../riskResources/types';
import type { ProjectRecord } from '../project/types';
import type { ScheduleResult } from '../schedule/types';
import { calculateCostControl } from './costControl';
import type { CostControlResult } from './types';

export type ProjectControlsMetricStatus = 'positive' | 'warning' | 'critical' | 'unavailable';

export interface ProjectControlsSnapshot {
  projectId: string;
  projectName: string;
  projectRevision: number;
  statusDate: string;
  generatedAt: string;
  engineVersion: string;
  currency: string;
  schedule: {
    forecastDurationDays: number;
    forecastFinish: string;
    criticalActivityCount: number;
    nearCriticalActivityCount: number;
  };
  cost: {
    bac: number | null;
    estimateTotal: number | null;
    allocatedBudget: number | null;
    allocationPercent: number | null;
    allocationVariance: number | null;
  };
  earnedValue: {
    pv: number;
    ev: number;
    ac: number;
    cpi: number | null;
    spi: number | null;
    cpiStatus: ProjectControlsMetricStatus;
    spiStatus: ProjectControlsMetricStatus;
  };
  findings: {
    totalOpen: number;
    critical: number;
    warning: number;
    schedule: number;
    budget: number;
    dates: number;
    risk: number;
    resources: number;
    validation: number;
  };
}

export function resolvePerformanceStatus(value: number | null): ProjectControlsMetricStatus {
  if (value === null || !Number.isFinite(value)) return 'unavailable';
  if (value >= 1) return 'positive';
  if (value >= 0.9) return 'warning';
  return 'critical';
}

export function buildProjectControlsSnapshot(
  project: ProjectRecord,
  schedule: ScheduleResult,
  controls: CostControlResult = calculateCostControl(project, schedule),
  riskResources: RiskResourceResult = analyzeRiskResources(project, schedule)
): ProjectControlsSnapshot {
  const scheduleFindings = schedule.warnings.length;
  const budgetFindings = controls.completeness.activitiesWithoutBudget.length;
  const dateFindings = controls.completeness.activitiesWithoutDates.length;
  const riskFindings = riskResources.riskExposure.length;
  const resourceFindings = riskResources.histogram.filter((item) => item.overAllocated).length;
  const validationFindings = riskResources.validationIssues.length;
  const criticalScheduleFindings = schedule.warnings.filter((warning) => warning.severity === 'error').length;
  const criticalRiskFindings = riskResources.riskExposure.filter((risk) => risk.score >= 5).length;
  const totalOpen = scheduleFindings + budgetFindings + dateFindings + riskFindings + resourceFindings + validationFindings;
  const critical = criticalScheduleFindings + criticalRiskFindings;
  const estimateTotal = controls.completeness.estimateTotal > 0 ? controls.completeness.estimateTotal : null;
  const allocatedBudget = controls.completeness.allocatedBudget > 0 ? controls.completeness.allocatedBudget : null;
  const bac = controls.metrics.bac > 0 ? controls.metrics.bac : null;

  return {
    projectId: project.id,
    projectName: project.name,
    projectRevision: project.revision,
    statusDate: project.statusDate,
    generatedAt: schedule.calculatedAt,
    engineVersion: schedule.engineVersion,
    currency: project.metadata.currency,
    schedule: {
      forecastDurationDays: schedule.projectDuration,
      forecastFinish: schedule.projectFinishDate,
      criticalActivityCount: schedule.criticalActivityIds.length,
      nearCriticalActivityCount: schedule.nearCriticalActivityIds.length
    },
    cost: {
      bac,
      estimateTotal,
      allocatedBudget,
      allocationPercent: controls.completeness.allocationPercent,
      allocationVariance: estimateTotal === null || allocatedBudget === null ? null : roundMoney(estimateTotal - allocatedBudget)
    },
    earnedValue: {
      pv: controls.metrics.pv,
      ev: controls.metrics.ev,
      ac: controls.metrics.ac,
      cpi: controls.metrics.cpi,
      spi: controls.metrics.spi,
      cpiStatus: resolvePerformanceStatus(controls.metrics.cpi),
      spiStatus: resolvePerformanceStatus(controls.metrics.spi)
    },
    findings: {
      totalOpen,
      critical,
      warning: Math.max(0, totalOpen - critical),
      schedule: scheduleFindings,
      budget: budgetFindings,
      dates: dateFindings,
      risk: riskFindings,
      resources: resourceFindings,
      validation: validationFindings
    }
  };
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
