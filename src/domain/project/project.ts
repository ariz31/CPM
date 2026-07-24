import { createStandardCalendar, validateCalendar } from '../calendar/calendar';
import { createEmptyCostControl } from '../controls/costControl';
import { createEmptyEnterprise } from '../enterprise/enterprise';
import { createEmptyBoq, validateBoq } from '../estimating/estimating';
import { createEmptyRiskResources, validateRiskResources } from '../riskResources/riskResources';
import type { ProjectRecord, WbsNode } from './types';
import type { Activity, Relationship } from '../schedule/types';

export function createBlankProjectRecord(name: string, now = new Date().toISOString()): ProjectRecord {
  const calendar = createStandardCalendar('CAL-DEFAULT', 'Standard 5-day calendar', 'Asia/Manila');
  const rootWbs: WbsNode = { id: crypto.randomUUID(), code: '1.0', name: 'Project', sortOrder: 0 };
  const activities: Activity[] = [
    createActivity({ id: 'START', name: 'Project start', type: 'milestone', duration: 0, wbsId: rootWbs.id, calendarId: calendar.id, now }),
    createActivity({ id: 'FINISH', name: 'Project finish', type: 'milestone', duration: 0, wbsId: rootWbs.id, calendarId: calendar.id, now })
  ];
  const relationships: Relationship[] = [
    { id: crypto.randomUUID(), predecessorId: 'START', successorId: 'FINISH', type: 'FS', lag: 0 }
  ];
  return {
    id: crypto.randomUUID(),
    name: name.trim() || 'Untitled project',
    metadata: {
      description: 'New offline project', owner: '', contractor: '', consultant: '', location: '', contractNumber: '',
      startDate: now.slice(0, 10), timezone: 'Asia/Manila', currency: 'PHP', unitSystem: 'metric'
    },
    settings: { defaultCalendarId: calendar.id, criticalFloatThresholdDays: 0, nearCriticalFloatThresholdDays: 5, firstDayOfWeek: 1 },
    status: 'active', createdAt: now, updatedAt: now, schemaVersion: 4, revision: 1,
    calendars: [calendar], wbs: [rootWbs], activities, relationships, savedViews: [],
    statusDate: now.slice(0, 10), progress: {}, baselines: [], updateSnapshots: [], boq: createEmptyBoq(),
    controls: createEmptyCostControl(), riskResources: createEmptyRiskResources(), enterprise: createEmptyEnterprise()
  };
}

interface CreateActivityInput {
  id?: string; name?: string; duration?: number; type?: Activity['type']; wbsId: string; calendarId: string; now?: string;
}

export function createActivity(input: CreateActivityInput): Activity {
  const now = input.now ?? new Date().toISOString();
  return {
    id: input.id ?? `A-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    name: input.name ?? 'New activity',
    duration: input.type === 'milestone' ? 0 : input.duration ?? 1,
    type: input.type ?? 'task', wbsId: input.wbsId, calendarId: input.calendarId,
    audit: { createdAt: now, updatedAt: now, source: 'manual' }
  };
}

export function validateProjectRecord(value: unknown): string[] {
  const issues: string[] = [];
  if (!value || typeof value !== 'object') return ['Project record must be an object.'];
  const project = value as Partial<ProjectRecord>;
  if (typeof project.id !== 'string' || !project.id.trim()) issues.push('Project ID is required.');
  if (typeof project.name !== 'string' || !project.name.trim()) issues.push('Project name is required.');
  if (project.schemaVersion !== 4) issues.push('Unsupported project schema version.');
  if (!project.metadata || typeof project.metadata.startDate !== 'string') issues.push('Project metadata is invalid.');
  if (!project.settings || typeof project.settings.defaultCalendarId !== 'string') issues.push('Project settings are invalid.');
  if (!Array.isArray(project.calendars) || project.calendars.length === 0) issues.push('At least one calendar is required.');
  if (!Array.isArray(project.wbs) || project.wbs.length === 0) issues.push('At least one WBS node is required.');
  if (!Array.isArray(project.activities)) issues.push('Activities must be an array.');
  if (!Array.isArray(project.relationships)) issues.push('Relationships must be an array.');
  if (typeof project.statusDate !== 'string') issues.push('Status date is required.');
  if (!project.progress || typeof project.progress !== 'object') issues.push('Progress records are invalid.');
  if (!Array.isArray(project.baselines)) issues.push('Baselines must be an array.');
  if (!Array.isArray(project.updateSnapshots)) issues.push('Update snapshots must be an array.');
  if (!project.boq || typeof project.boq !== 'object') issues.push('BOQ model is invalid.');
  if (!project.controls || typeof project.controls !== 'object') issues.push('Cost-control model is invalid.');
  if (!project.riskResources || typeof project.riskResources !== 'object') issues.push('Risk and resource model is invalid.');
  if (!project.enterprise || typeof project.enterprise !== 'object') issues.push('Enterprise reporting model is invalid.');

  if (Array.isArray(project.calendars)) {
    for (const calendar of project.calendars) issues.push(...validateCalendar(calendar).map((issue) => `${calendar.id}: ${issue.message}`));
  }
  const activityIds = new Set<string>();
  if (Array.isArray(project.activities)) {
    for (const activity of project.activities) {
      if (!activity.id?.trim()) issues.push('Every activity requires an ID.');
      if (activityIds.has(activity.id)) issues.push(`Duplicate activity ID: ${activity.id}`);
      activityIds.add(activity.id);
      if (!Number.isFinite(activity.duration) || activity.duration < 0) issues.push(`Invalid duration for ${activity.id}.`);
      if (!project.calendars?.some((calendar) => calendar.id === activity.calendarId)) issues.push(`Activity ${activity.id} references a missing calendar.`);
      if (!project.wbs?.some((node) => node.id === activity.wbsId)) issues.push(`Activity ${activity.id} references a missing WBS node.`);
    }
  }
  if (project.progress && typeof project.progress === 'object') {
    for (const [activityId, progress] of Object.entries(project.progress)) {
      if (!activityIds.has(activityId) || progress.activityId !== activityId) issues.push(`Progress record ${activityId} references a missing or mismatched activity.`);
      if (!Number.isFinite(progress.remainingDuration) || progress.remainingDuration < 0) issues.push(`Progress record ${activityId} has invalid remaining duration.`);
      if (!Number.isFinite(progress.percentComplete) || progress.percentComplete < 0 || progress.percentComplete > 100) issues.push(`Progress record ${activityId} has invalid percent complete.`);
    }
  }
  if (project.activeBaselineId && !project.baselines?.some((baseline) => baseline.id === project.activeBaselineId)) issues.push('Active baseline does not exist.');
  if (project.boq) issues.push(...validateBoq(project.boq, activityIds));
  if (project.controls) {
    if (!['daily', 'weekly', 'monthly', 'fiscal'].includes(project.controls.period)) issues.push('Cost-control period is invalid.');
    if (!Number.isInteger(project.controls.fiscalYearStartMonth) || project.controls.fiscalYearStartMonth < 1 || project.controls.fiscalYearStartMonth > 12) issues.push('Fiscal-year start month must be 1 through 12.');
    for (const loading of project.controls.activityLoadings ?? []) {
      if (!activityIds.has(loading.activityId)) issues.push(`Cost loading references missing activity ${loading.activityId}.`);
      if (loading.budgetCost !== undefined && (!Number.isFinite(loading.budgetCost) || loading.budgetCost < 0)) issues.push(`Cost loading ${loading.activityId} has invalid budget cost.`);
    }
    for (const actual of project.controls.actualCosts ?? []) {
      if (actual.activityId && !activityIds.has(actual.activityId)) issues.push(`Actual cost ${actual.id} references missing activity.`);
      if (!Number.isFinite(actual.amount) || actual.amount < 0) issues.push(`Actual cost ${actual.id} has invalid amount.`);
    }
  }
  if (project.riskResources && Array.isArray(project.activities) && Array.isArray(project.relationships)) {
    issues.push(...validateRiskResources(project as ProjectRecord));
  }
  if (project.enterprise) {
    if (!Array.isArray(project.enterprise.dashboards) || !Array.isArray(project.enterprise.reportSnapshots) || !Array.isArray(project.enterprise.overrides) || !Array.isArray(project.enterprise.diagnostics)) issues.push('Enterprise collections are invalid.');
    for (const snapshot of project.enterprise.reportSnapshots ?? []) if (snapshot.projectRevision > (project.revision ?? 0)) issues.push(`Report snapshot ${snapshot.id} references a future project revision.`);
    for (const override of project.enterprise.overrides ?? []) if (!override.path.trim() || !override.reason.trim()) issues.push(`Manual override ${override.id} requires path and reason.`);
  }
  return issues;
}

export function cloneProject(project: ProjectRecord, name: string): ProjectRecord {
  const now = new Date().toISOString();
  const baselineIdMap = new Map<string, string>();
  const baselines = project.baselines.map((baseline) => {
    const id = crypto.randomUUID();
    baselineIdMap.set(baseline.id, id);
    return { ...baseline, id };
  });
  const resourceIdMap = new Map<string, string>();
  const resources = project.riskResources.resources.map((resource) => {
    const id = crypto.randomUUID();
    resourceIdMap.set(resource.id, id);
    return { ...resource, id };
  });
  return structuredClone({
    ...project, id: crypto.randomUUID(), name, status: 'active', archivedAt: undefined, trashedAt: undefined,
    createdAt: now, updatedAt: now, revision: 1,
    baselines,
    activeBaselineId: project.activeBaselineId ? baselineIdMap.get(project.activeBaselineId) : undefined,
    updateSnapshots: project.updateSnapshots.map((snapshot) => ({ ...snapshot, id: crypto.randomUUID() })),
    boq: { ...project.boq, revisions: project.boq.revisions.map((revision) => ({ ...revision, id: crypto.randomUUID() })) },
    controls: { ...project.controls, actualCosts: project.controls.actualCosts.map((record) => ({ ...record, id: crypto.randomUUID() })) },
    riskResources: {
      ...project.riskResources,
      risks: project.riskResources.risks.map((risk) => ({ ...risk, id: crypto.randomUUID() })),
      productivityPlans: project.riskResources.productivityPlans.map((plan) => ({ ...plan, id: crypto.randomUUID() })),
      fieldRecords: project.riskResources.fieldRecords.map((record) => ({ ...record, id: crypto.randomUUID() })),
      resources,
      assignments: project.riskResources.assignments.map((assignment) => ({
        ...assignment,
        id: crypto.randomUUID(),
        resourceId: resourceIdMap.get(assignment.resourceId) ?? assignment.resourceId
      }))
    },
    enterprise: {
      dashboards: project.enterprise.dashboards.map((dashboard) => ({ ...dashboard, id: crypto.randomUUID(), widgets: dashboard.widgets.map((widget) => ({ ...widget, id: crypto.randomUUID() })) })),
      reportSnapshots: project.enterprise.reportSnapshots.map((snapshot) => ({ ...snapshot, id: crypto.randomUUID() })),
      overrides: project.enterprise.overrides.map((override) => ({ ...override, id: crypto.randomUUID() })),
      diagnostics: project.enterprise.diagnostics.map((event) => ({ ...event, id: crypto.randomUUID() }))
    }
  });
}
