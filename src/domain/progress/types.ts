export type ProgressMethod = 'duration' | 'physical' | 'units' | 'milestone';
export type OutOfSequenceMode = 'retained-logic' | 'progress-override';

export interface SuspensionPeriod {
  start: string;
  finish?: string;
  reason?: string;
}

export interface ActivityProgress {
  activityId: string;
  method: ProgressMethod;
  actualStart?: string;
  actualFinish?: string;
  remainingDuration: number;
  percentComplete: number;
  physicalPercent?: number;
  unitsComplete?: number;
  totalUnits?: number;
  suspendedPeriods: SuspensionPeriod[];
  outOfSequenceMode: OutOfSequenceMode;
  notes?: string;
  updatedAt: string;
}

export interface BaselineActivitySnapshot {
  activityId: string;
  name: string;
  wbsId: string;
  calendarId: string;
  duration: number;
  plannedStart: string;
  plannedFinish: string;
}

export interface ScheduleBaseline {
  id: string;
  name: string;
  kind: 'original' | 'revised';
  createdAt: string;
  statusDate: string;
  projectRevision: number;
  engineVersion: string;
  activities: BaselineActivitySnapshot[];
}

export interface ProgressUpdateSnapshot {
  id: string;
  name: string;
  createdAt: string;
  statusDate: string;
  projectRevision: number;
  progress: Record<string, ActivityProgress>;
}
