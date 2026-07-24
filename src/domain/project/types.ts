import type { WorkCalendar } from '../calendar/types';
import type { CostControlModel } from '../controls/types';
import type { EnterpriseModel } from '../enterprise/types';
import type { BoqModel } from '../estimating/types';
import type { ActivityProgress, ProgressUpdateSnapshot, ScheduleBaseline } from '../progress/types';
import type { RiskResourceModel } from '../riskResources/types';
import type { Activity, Relationship } from '../schedule/types';

export type ProjectStatus = 'active' | 'archived' | 'trashed';

export interface ProjectMetadata {
  description: string;
  owner: string;
  contractor: string;
  consultant: string;
  location: string;
  contractNumber: string;
  startDate: string;
  timezone: string;
  currency: string;
  unitSystem: 'metric' | 'imperial';
}

export interface ProjectSettings {
  defaultCalendarId: string;
  criticalFloatThresholdDays: number;
  nearCriticalFloatThresholdDays: number;
  firstDayOfWeek: 0 | 1;
}

export interface WbsNode {
  id: string;
  code: string;
  name: string;
  parentId?: string;
  sortOrder: number;
}

export interface SavedView {
  id: string;
  name: string;
  query: string;
  sortBy: 'id' | 'name' | 'duration' | 'wbs';
  sortDirection: 'asc' | 'desc';
}

export interface ProjectRecord {
  id: string;
  name: string;
  metadata: ProjectMetadata;
  settings: ProjectSettings;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  trashedAt?: string;
  schemaVersion: 4;
  revision: number;
  calendars: WorkCalendar[];
  wbs: WbsNode[];
  activities: Activity[];
  relationships: Relationship[];
  savedViews: SavedView[];
  statusDate: string;
  progress: Record<string, ActivityProgress>;
  baselines: ScheduleBaseline[];
  activeBaselineId?: string;
  updateSnapshots: ProgressUpdateSnapshot[];
  boq: BoqModel;
  controls: CostControlModel;
  riskResources: RiskResourceModel;
  enterprise: EnterpriseModel;
}

export interface ProjectSnapshot {
  id: string;
  projectId: string;
  name: string;
  kind: 'named' | 'recovery' | 'pre-import' | 'pre-delete';
  createdAt: string;
  project: ProjectRecord;
}

export interface JournalEntry {
  id?: number;
  projectId: string;
  commandId: string;
  commandType: string;
  createdAt: string;
  revisionBefore: number;
  revisionAfter: number;
  summary: string;
}

export interface QuarantinedProject {
  id: string;
  detectedAt: string;
  reason: string;
  raw: unknown;
}
