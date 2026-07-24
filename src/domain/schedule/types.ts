import type { WorkCalendar, WorkInstant } from '../calendar/types';

export type ActivityType = 'task' | 'milestone' | 'summary';
export type RelationshipType = 'FS' | 'SS' | 'FF' | 'SF';
export type ConstraintType =
  | 'ASAP'
  | 'START_NO_EARLIER_THAN'
  | 'FINISH_NO_LATER_THAN'
  | 'MUST_START_ON'
  | 'MUST_FINISH_ON';

export interface ActivityConstraint {
  type: ConstraintType;
  date?: string;
}

export interface ActivityAuditMetadata {
  createdAt: string;
  updatedAt: string;
  source: 'manual' | 'csv' | 'template' | 'import';
}

export interface Activity {
  id: string;
  name: string;
  duration: number;
  type: ActivityType;
  wbsId: string;
  calendarId: string;
  code?: string;
  notes?: string;
  constraint?: ActivityConstraint;
  deadline?: string;
  customFields?: Record<string, string | number | boolean | null>;
  audit?: ActivityAuditMetadata;
}

export interface Relationship {
  id: string;
  predecessorId: string;
  successorId: string;
  type: RelationshipType;
  lag: number;
}

export interface ScheduleProject {
  projectStartDate: string;
  defaultCalendarId: string;
  criticalFloatThresholdDays: number;
  nearCriticalFloatThresholdDays: number;
  calendars: WorkCalendar[];
  activities: Activity[];
  relationships: Relationship[];
}

export interface CalculatedActivity extends Activity {
  earlyStart: WorkInstant;
  earlyFinish: WorkInstant;
  lateStart: WorkInstant;
  lateFinish: WorkInstant;
  earlyStartDate: string;
  earlyFinishDate: string;
  lateStartDate: string;
  lateFinishDate: string;
  earlyStartOffsetDays: number;
  totalFloat: number;
  freeFloat: number;
  isCritical: boolean;
  isNearCritical: boolean;
  drivingRelationshipIds: string[];
}

export type ScheduleWarningCode =
  | 'OPEN_START'
  | 'OPEN_FINISH'
  | 'NEGATIVE_FLOAT'
  | 'NEGATIVE_LAG'
  | 'DUPLICATE_LINK'
  | 'MISSING_FINISH'
  | 'HARD_CONSTRAINT'
  | 'DEADLINE_MISS'
  | 'INVALID_CALENDAR';

export interface ScheduleWarning {
  code: ScheduleWarningCode;
  activityId?: string;
  relationshipId?: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

export interface ScheduleResult {
  activities: CalculatedActivity[];
  projectStartDate: string;
  projectFinishDate: string;
  projectDuration: number;
  criticalActivityIds: string[];
  nearCriticalActivityIds: string[];
  warnings: ScheduleWarning[];
  calculatedAt: string;
  engineVersion: string;
}

export class ScheduleValidationError extends Error {
  public readonly issues: string[];

  public constructor(issues: string[]) {
    super(issues.join('\n'));
    this.name = 'ScheduleValidationError';
    this.issues = issues;
  }
}
