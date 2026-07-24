import { createActivity, validateProjectRecord } from '../domain/project/project';
import type { ProjectRecord, WbsNode } from '../domain/project/types';
import type { WorkCalendar } from '../domain/calendar/types';
import type { Activity, Relationship } from '../domain/schedule/types';

export type ProjectCommand =
  | { type: 'REPLACE_PROJECT'; project: ProjectRecord; commandId?: string }
  | { type: 'ADD_ACTIVITY'; activity?: Partial<Activity>; commandId?: string }
  | { type: 'UPDATE_ACTIVITY'; activityId: string; changes: Partial<Activity>; commandId?: string }
  | { type: 'DELETE_ACTIVITY'; activityId: string; commandId?: string }
  | { type: 'BULK_UPDATE_ACTIVITIES'; activityIds: string[]; changes: Partial<Activity>; commandId?: string }
  | { type: 'ADD_RELATIONSHIP'; relationship: Relationship; commandId?: string }
  | { type: 'DELETE_RELATIONSHIP'; relationshipId: string; commandId?: string }
  | { type: 'ADD_WBS'; node: WbsNode; commandId?: string }
  | { type: 'DELETE_WBS'; nodeId: string; reassignTo: string; commandId?: string }
  | { type: 'ADD_CALENDAR'; calendar: WorkCalendar; commandId?: string }
  | { type: 'UPDATE_CALENDAR'; calendarId: string; changes: Partial<WorkCalendar>; commandId?: string };

export interface CommandResult {
  project: ProjectRecord;
  inverse: ProjectCommand;
  summary: string;
  commandId: string;
}

export function executeProjectCommand(project: ProjectRecord, command: ProjectCommand): CommandResult {
  const commandId = command.commandId ?? crypto.randomUUID();
  const now = new Date().toISOString();
  let next: ProjectRecord;
  let inverse: ProjectCommand;
  let summary: string;

  switch (command.type) {
    case 'REPLACE_PROJECT': {
      next = structuredClone(command.project);
      inverse = { type: 'REPLACE_PROJECT', project: structuredClone(project), commandId };
      summary = 'Restored previous project revision';
      break;
    }
    case 'ADD_ACTIVITY': {
      const rootWbs = project.wbs[0];
      const activity = createActivity({
        id: command.activity?.id,
        name: command.activity?.name,
        duration: command.activity?.duration,
        type: command.activity?.type,
        wbsId: command.activity?.wbsId ?? rootWbs.id,
        calendarId: command.activity?.calendarId ?? project.settings.defaultCalendarId,
        now
      });
      const merged: Activity = { ...activity, ...command.activity, audit: activity.audit };
      if (project.activities.some((item) => item.id === merged.id)) throw new Error(`Activity ID ${merged.id} already exists.`);
      next = { ...project, activities: [...project.activities, merged] };
      inverse = { type: 'DELETE_ACTIVITY', activityId: merged.id, commandId };
      summary = `Added activity ${merged.id}`;
      break;
    }
    case 'UPDATE_ACTIVITY': {
      const existing = project.activities.find((item) => item.id === command.activityId);
      if (!existing) throw new Error(`Activity ${command.activityId} was not found.`);
      if (command.changes.id !== undefined && command.changes.id !== existing.id) {
        throw new Error('Activity IDs are stable and cannot be changed. Create a new activity instead.');
      }
      const updated: Activity = {
        ...existing,
        ...command.changes,
        id: existing.id,
        duration: command.changes.type === 'milestone' ? 0 : command.changes.duration ?? existing.duration,
        audit: {
          createdAt: existing.audit?.createdAt ?? now,
          updatedAt: now,
          source: existing.audit?.source ?? 'manual'
        }
      };
      next = {
        ...project,
        activities: project.activities.map((item) => (item.id === existing.id ? updated : item))
      };
      inverse = { type: 'UPDATE_ACTIVITY', activityId: updated.id, changes: existing, commandId };
      summary = `Updated activity ${updated.id}`;
      break;
    }
    case 'DELETE_ACTIVITY': {
      const existing = project.activities.find((item) => item.id === command.activityId);
      if (!existing) throw new Error(`Activity ${command.activityId} was not found.`);
      if (existing.id === 'START' || existing.id === 'FINISH') throw new Error('Project boundary milestones cannot be deleted.');
      const removedRelationships = project.relationships.filter(
        (item) => item.predecessorId === existing.id || item.successorId === existing.id
      );
      const progress = { ...project.progress };
      delete progress[existing.id];
      const boq = {
        ...project.boq,
        items: project.boq.items.map((item) => ({
          ...item,
          allocations: item.allocations.filter((allocation) => allocation.activityId !== existing.id)
        }))
      };
      next = {
        ...project,
        activities: project.activities.filter((item) => item.id !== existing.id),
        relationships: project.relationships.filter(
          (item) => item.predecessorId !== existing.id && item.successorId !== existing.id
        ),
        progress,
        boq
      };
      inverse = { type: 'ADD_ACTIVITY', activity: existing, commandId };
      summary = `Deleted activity ${existing.id}, ${removedRelationships.length} related links, its live progress, and current BOQ allocations`;
      break;
    }
    case 'BULK_UPDATE_ACTIVITIES': {
      if (command.changes.id !== undefined) throw new Error('Activity IDs cannot be changed through bulk edit.');
      const selected = new Set(command.activityIds);
      const before = project.activities.filter((item) => selected.has(item.id));
      if (before.length !== selected.size) throw new Error('One or more selected activities no longer exist.');
      next = {
        ...project,
        activities: project.activities.map((item) =>
          selected.has(item.id)
            ? {
                ...item,
                ...command.changes,
                id: item.id,
                duration: command.changes.type === 'milestone' ? 0 : command.changes.duration ?? item.duration,
                audit: {
                  createdAt: item.audit?.createdAt ?? now,
                  updatedAt: now,
                  source: item.audit?.source ?? 'manual'
                }
              }
            : item
        )
      };
      inverse = {
        type: 'BULK_UPDATE_ACTIVITIES',
        activityIds: before.map((item) => item.id),
        changes: {},
        commandId
      };
      summary = `Updated ${before.length} activities`;
      break;
    }
    case 'ADD_RELATIONSHIP': {
      if (project.relationships.some((item) => item.id === command.relationship.id)) throw new Error('Relationship ID already exists.');
      if (
        project.relationships.some(
          (item) =>
            item.predecessorId === command.relationship.predecessorId &&
            item.successorId === command.relationship.successorId &&
            item.type === command.relationship.type &&
            item.lag === command.relationship.lag
        )
      ) {
        throw new Error('An identical relationship already exists.');
      }
      next = { ...project, relationships: [...project.relationships, command.relationship] };
      inverse = { type: 'DELETE_RELATIONSHIP', relationshipId: command.relationship.id, commandId };
      summary = `Added ${command.relationship.type} relationship`;
      break;
    }
    case 'DELETE_RELATIONSHIP': {
      const relationship = project.relationships.find((item) => item.id === command.relationshipId);
      if (!relationship) throw new Error('Relationship was not found.');
      next = { ...project, relationships: project.relationships.filter((item) => item.id !== command.relationshipId) };
      inverse = { type: 'ADD_RELATIONSHIP', relationship, commandId };
      summary = `Deleted relationship ${relationship.id}`;
      break;
    }
    case 'ADD_WBS': {
      if (project.wbs.some((item) => item.id === command.node.id || item.code === command.node.code)) {
        throw new Error('WBS ID and code must be unique.');
      }
      next = { ...project, wbs: [...project.wbs, command.node] };
      inverse = { type: 'DELETE_WBS', nodeId: command.node.id, reassignTo: project.wbs[0].id, commandId };
      summary = `Added WBS ${command.node.code}`;
      break;
    }
    case 'DELETE_WBS': {
      const node = project.wbs.find((item) => item.id === command.nodeId);
      if (!node) throw new Error('WBS node was not found.');
      if (project.wbs.length === 1) throw new Error('The root WBS cannot be deleted.');
      if (!project.wbs.some((item) => item.id === command.reassignTo)) throw new Error('Reassignment WBS was not found.');
      next = {
        ...project,
        wbs: project.wbs.filter((item) => item.id !== command.nodeId),
        activities: project.activities.map((item) =>
          item.wbsId === command.nodeId ? { ...item, wbsId: command.reassignTo } : item
        )
      };
      inverse = { type: 'ADD_WBS', node, commandId };
      summary = `Deleted WBS ${node.code}`;
      break;
    }
    case 'ADD_CALENDAR': {
      if (project.calendars.some((item) => item.id === command.calendar.id)) throw new Error('Calendar ID must be unique.');
      next = { ...project, calendars: [...project.calendars, command.calendar] };
      inverse = { type: 'UPDATE_CALENDAR', calendarId: command.calendar.id, changes: {}, commandId };
      summary = `Added calendar ${command.calendar.name}`;
      break;
    }
    case 'UPDATE_CALENDAR': {
      const existing = project.calendars.find((item) => item.id === command.calendarId);
      if (!existing) throw new Error('Calendar was not found.');
      const updated = { ...existing, ...command.changes, id: existing.id };
      next = {
        ...project,
        calendars: project.calendars.map((item) => (item.id === existing.id ? updated : item))
      };
      inverse = { type: 'UPDATE_CALENDAR', calendarId: existing.id, changes: existing, commandId };
      summary = `Updated calendar ${existing.name}`;
      break;
    }
  }

  if (command.type !== 'REPLACE_PROJECT') {
    inverse = { type: 'REPLACE_PROJECT', project: structuredClone(project), commandId };
  }

  const candidate: ProjectRecord = {
    ...next,
    revision: project.revision + 1,
    updatedAt: now
  };
  const issues = validateProjectRecord(candidate);
  if (issues.length > 0) throw new Error(issues.join('\n'));

  return { project: candidate, inverse, summary, commandId };
}
