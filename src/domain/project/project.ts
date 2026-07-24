import { createStandardCalendar, validateCalendar } from '../calendar/calendar';
import type { ProjectRecord, WbsNode } from './types';
import type { Activity, Relationship } from '../schedule/types';

export function createBlankProjectRecord(name: string, now = new Date().toISOString()): ProjectRecord {
  const calendar = createStandardCalendar('CAL-DEFAULT', 'Standard 5-day calendar', 'Asia/Manila');
  const rootWbs: WbsNode = { id: crypto.randomUUID(), code: '1.0', name: 'Project', sortOrder: 0 };
  const startId = 'START';
  const finishId = 'FINISH';
  const activities: Activity[] = [
    createActivity({ id: startId, name: 'Project start', type: 'milestone', duration: 0, wbsId: rootWbs.id, calendarId: calendar.id, now }),
    createActivity({ id: finishId, name: 'Project finish', type: 'milestone', duration: 0, wbsId: rootWbs.id, calendarId: calendar.id, now })
  ];
  const relationships: Relationship[] = [
    { id: crypto.randomUUID(), predecessorId: startId, successorId: finishId, type: 'FS', lag: 0 }
  ];

  return {
    id: crypto.randomUUID(),
    name: name.trim() || 'Untitled project',
    metadata: {
      description: 'New offline project',
      owner: '',
      contractor: '',
      consultant: '',
      location: '',
      contractNumber: '',
      startDate: now.slice(0, 10),
      timezone: 'Asia/Manila',
      currency: 'PHP',
      unitSystem: 'metric'
    },
    settings: {
      defaultCalendarId: calendar.id,
      criticalFloatThresholdDays: 0,
      nearCriticalFloatThresholdDays: 5,
      firstDayOfWeek: 1
    },
    status: 'active',
    createdAt: now,
    updatedAt: now,
    schemaVersion: 2,
    revision: 1,
    calendars: [calendar],
    wbs: [rootWbs],
    activities,
    relationships,
    savedViews: []
  };
}

interface CreateActivityInput {
  id?: string;
  name?: string;
  duration?: number;
  type?: Activity['type'];
  wbsId: string;
  calendarId: string;
  now?: string;
}

export function createActivity(input: CreateActivityInput): Activity {
  const now = input.now ?? new Date().toISOString();
  return {
    id: input.id ?? `A-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    name: input.name ?? 'New activity',
    duration: input.type === 'milestone' ? 0 : input.duration ?? 1,
    type: input.type ?? 'task',
    wbsId: input.wbsId,
    calendarId: input.calendarId,
    audit: { createdAt: now, updatedAt: now, source: 'manual' }
  };
}

export function validateProjectRecord(value: unknown): string[] {
  const issues: string[] = [];
  if (!value || typeof value !== 'object') return ['Project record must be an object.'];
  const project = value as Partial<ProjectRecord>;

  if (typeof project.id !== 'string' || !project.id.trim()) issues.push('Project ID is required.');
  if (typeof project.name !== 'string' || !project.name.trim()) issues.push('Project name is required.');
  if (project.schemaVersion !== 2) issues.push('Unsupported project schema version.');
  if (!project.metadata || typeof project.metadata.startDate !== 'string') issues.push('Project metadata is invalid.');
  if (!project.settings || typeof project.settings.defaultCalendarId !== 'string') issues.push('Project settings are invalid.');
  if (!Array.isArray(project.calendars) || project.calendars.length === 0) issues.push('At least one calendar is required.');
  if (!Array.isArray(project.wbs) || project.wbs.length === 0) issues.push('At least one WBS node is required.');
  if (!Array.isArray(project.activities)) issues.push('Activities must be an array.');
  if (!Array.isArray(project.relationships)) issues.push('Relationships must be an array.');

  if (Array.isArray(project.calendars)) {
    for (const calendar of project.calendars) {
      issues.push(...validateCalendar(calendar).map((issue) => `${calendar.id}: ${issue.message}`));
    }
  }

  if (Array.isArray(project.activities)) {
    const activityIds = new Set<string>();
    for (const activity of project.activities) {
      if (!activity.id?.trim()) issues.push('Every activity requires an ID.');
      if (activityIds.has(activity.id)) issues.push(`Duplicate activity ID: ${activity.id}`);
      activityIds.add(activity.id);
      if (!Number.isFinite(activity.duration) || activity.duration < 0) issues.push(`Invalid duration for ${activity.id}.`);
      if (!project.calendars?.some((calendar) => calendar.id === activity.calendarId)) {
        issues.push(`Activity ${activity.id} references a missing calendar.`);
      }
      if (!project.wbs?.some((node) => node.id === activity.wbsId)) {
        issues.push(`Activity ${activity.id} references a missing WBS node.`);
      }
    }
  }

  return issues;
}

export function cloneProject(project: ProjectRecord, name: string): ProjectRecord {
  const now = new Date().toISOString();
  return structuredClone({
    ...project,
    id: crypto.randomUUID(),
    name,
    status: 'active',
    archivedAt: undefined,
    trashedAt: undefined,
    createdAt: now,
    updatedAt: now,
    revision: 1
  });
}
