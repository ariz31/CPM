export type ActivityType = 'task' | 'milestone';
export type RelationshipType = 'FS' | 'SS' | 'FF' | 'SF';

export interface Activity {
  id: string;
  name: string;
  duration: number;
  type: ActivityType;
  wbs: string;
}

export interface Relationship {
  id: string;
  predecessorId: string;
  successorId: string;
  type: RelationshipType;
  lag: number;
}

export interface ScheduleProject {
  activities: Activity[];
  relationships: Relationship[];
}

export interface CalculatedActivity extends Activity {
  earlyStart: number;
  earlyFinish: number;
  lateStart: number;
  lateFinish: number;
  totalFloat: number;
  isCritical: boolean;
}

export interface ScheduleWarning {
  code: 'OPEN_START' | 'OPEN_FINISH' | 'NEGATIVE_FLOAT' | 'NEGATIVE_LAG';
  activityId?: string;
  relationshipId?: string;
  message: string;
}

export interface ScheduleResult {
  activities: CalculatedActivity[];
  projectDuration: number;
  criticalActivityIds: string[];
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
