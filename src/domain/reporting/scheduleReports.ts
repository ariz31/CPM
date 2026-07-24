import { dateToOrdinal } from '../calendar/calendar';
import type { ProjectRecord } from '../project/types';
import type { ScheduleResult } from '../schedule/types';

export type ScheduleReportKind = 'critical-path' | 'float' | 'logic' | 'milestones' | 'look-ahead';
export type ScheduleReportCell = string | number | boolean | null;

export interface ScheduleReportColumn {
  key: string;
  label: string;
}

export interface ScheduleReport {
  id: string;
  kind: ScheduleReportKind;
  title: string;
  columns: ScheduleReportColumn[];
  rows: Array<Record<string, ScheduleReportCell>>;
  provenance: {
    projectId: string;
    projectName: string;
    projectRevision: number;
    statusDate: string;
    engineVersion: string;
    calculatedAt: string;
    generatedAt: string;
  };
}

export interface ScheduleReportOptions {
  lookAheadDays?: number;
  generatedAt?: string;
}

export function createScheduleReport(
  kind: ScheduleReportKind,
  project: ProjectRecord,
  result: ScheduleResult,
  options: ScheduleReportOptions = {}
): ScheduleReport {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const provenance = {
    projectId: project.id,
    projectName: project.name,
    projectRevision: project.revision,
    statusDate: project.statusDate,
    engineVersion: result.engineVersion,
    calculatedAt: result.calculatedAt,
    generatedAt
  };
  const common = { id: `${project.id}:${project.revision}:${kind}`, kind, provenance };
  switch (kind) {
    case 'critical-path':
      return {
        ...common,
        title: 'Critical Path Report',
        columns: columns(['sequence', 'activityId', 'activity', 'earlyStart', 'earlyFinish', 'totalFloat', 'drivingRelationships']),
        rows: result.activities
          .filter((activity) => activity.isCritical)
          .sort((left, right) => left.earlyStartOffsetDays - right.earlyStartOffsetDays || left.id.localeCompare(right.id))
          .map((activity, index) => ({
            sequence: index + 1,
            activityId: activity.id,
            activity: activity.name,
            earlyStart: activity.earlyStartDate,
            earlyFinish: activity.earlyFinishDate,
            totalFloat: activity.totalFloat,
            drivingRelationships: activity.drivingRelationshipIds.join(', ')
          }))
      };
    case 'float':
      return {
        ...common,
        title: 'Float Report',
        columns: columns(['activityId', 'activity', 'totalFloat', 'freeFloat', 'classification', 'lateFinish']),
        rows: [...result.activities]
          .sort((left, right) => left.totalFloat - right.totalFloat || left.id.localeCompare(right.id))
          .map((activity) => ({
            activityId: activity.id,
            activity: activity.name,
            totalFloat: activity.totalFloat,
            freeFloat: activity.freeFloat,
            classification: activity.isCritical ? 'Critical' : activity.isNearCritical ? 'Near critical' : 'Non-critical',
            lateFinish: activity.lateFinishDate
          }))
      };
    case 'logic': {
      const calculatedById = new Map(result.activities.map((activity) => [activity.id, activity]));
      return {
        ...common,
        title: 'Logic and Relationship Report',
        columns: columns(['relationshipId', 'predecessor', 'successor', 'type', 'lagDays', 'driving', 'finding']),
        rows: [...project.relationships]
          .sort((left, right) => left.predecessorId.localeCompare(right.predecessorId) || left.successorId.localeCompare(right.successorId))
          .map((relationship) => ({
            relationshipId: relationship.id,
            predecessor: relationship.predecessorId,
            successor: relationship.successorId,
            type: relationship.type,
            lagDays: relationship.lag,
            driving: calculatedById.get(relationship.successorId)?.drivingRelationshipIds.includes(relationship.id) ?? false,
            finding: relationship.lag < 0 ? 'Lead' : relationship.lag > 0 ? 'Lag' : 'Standard'
          }))
      };
    }
    case 'milestones':
      return {
        ...common,
        title: 'Milestone Report',
        columns: columns(['activityId', 'milestone', 'plannedDate', 'deadline', 'status', 'float']),
        rows: result.activities
          .filter((activity) => activity.type === 'milestone')
          .sort((left, right) => left.earlyStartDate.localeCompare(right.earlyStartDate) || left.id.localeCompare(right.id))
          .map((activity) => ({
            activityId: activity.id,
            milestone: activity.name,
            plannedDate: activity.earlyFinishDate,
            deadline: activity.deadline ?? '',
            status: project.progress[activity.id]?.actualFinish ? 'Complete' : 'Planned',
            float: activity.totalFloat
          }))
      };
    case 'look-ahead': {
      const lookAheadDays = Math.max(1, Math.round(options.lookAheadDays ?? 21));
      const statusOrdinal = dateToOrdinal(project.statusDate);
      const limit = statusOrdinal + lookAheadDays;
      return {
        ...common,
        title: `${lookAheadDays}-Day Look-Ahead`,
        columns: columns(['activityId', 'activity', 'start', 'finish', 'state', 'critical', 'responsibility']),
        rows: result.activities
          .filter((activity) => {
            const start = dateToOrdinal(activity.earlyStart.date);
            const finish = dateToOrdinal(activity.earlyFinish.date);
            return finish >= statusOrdinal && start <= limit;
          })
          .sort((left, right) => left.earlyStartDate.localeCompare(right.earlyStartDate) || left.id.localeCompare(right.id))
          .map((activity) => ({
            activityId: activity.id,
            activity: activity.name,
            start: activity.earlyStartDate,
            finish: activity.earlyFinishDate,
            state: project.progress[activity.id]?.actualFinish ? 'Complete' : project.progress[activity.id]?.actualStart ? 'In progress' : 'Not started',
            critical: activity.isCritical,
            responsibility: String(activity.customFields?.responsibility ?? '')
          }))
      };
    }
  }
}

export function scheduleReportToCsv(report: ScheduleReport): string {
  const header = report.columns.map((column) => csvCell(column.label)).join(',');
  const rows = report.rows.map((row) => report.columns.map((column) => csvCell(String(row[column.key] ?? ''))).join(','));
  return [header, ...rows].join('\n');
}

function columns(keys: string[]): ScheduleReportColumn[] {
  return keys.map((key) => ({ key, label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (character) => character.toUpperCase()) }));
}

function csvCell(value: string): string {
  const protectedValue = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${protectedValue.replaceAll('"', '""')}"`;
}
