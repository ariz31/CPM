import { createStandardCalendar } from '../domain/calendar/calendar';
import { createEmptyCostControl } from '../domain/controls/costControl';
import { createEmptyEnterprise } from '../domain/enterprise/enterprise';
import { createEmptyBoq } from '../domain/estimating/estimating';
import { createEmptyRiskResources } from '../domain/riskResources/riskResources';
import type { ProjectRecord, ProjectSnapshot } from '../domain/project/types';

export const CURRENT_PROJECT_SCHEMA_VERSION = 4;

interface LegacyProjectV1 {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: 1;
  activities: Array<Record<string, unknown>>;
  relationships: Array<Record<string, unknown>>;
}

export function migrateProjectRecord(rawValue: unknown): ProjectRecord {
  if (!rawValue || typeof rawValue !== 'object') throw new Error('Project migration input must be an object.');
  const raw = structuredClone(rawValue) as Record<string, unknown>;
  const originalVersion = Number(raw.schemaVersion);
  if (![1, 2, 3, 4].includes(originalVersion)) throw new Error(`Unsupported project schema version: ${String(raw.schemaVersion)}`);

  if (raw.schemaVersion === 1) migrateV1ToV2(raw as unknown as LegacyProjectV1, raw);
  if (raw.schemaVersion === 2) migrateV2ToV3(raw);
  if (raw.schemaVersion === 3) migrateV3ToV4(raw);
  if (raw.schemaVersion !== CURRENT_PROJECT_SCHEMA_VERSION) throw new Error('Project migration did not reach the current schema.');
  return raw as unknown as ProjectRecord;
}

export function migrateProjectSnapshot(rawValue: unknown): ProjectSnapshot {
  if (!rawValue || typeof rawValue !== 'object') throw new Error('Snapshot migration input must be an object.');
  const snapshot = structuredClone(rawValue) as Record<string, unknown>;
  snapshot.project = migrateProjectRecord(snapshot.project);
  return snapshot as unknown as ProjectSnapshot;
}

function migrateV1ToV2(legacy: LegacyProjectV1, raw: Record<string, unknown>): void {
  const calendarId = `MIG-CAL-${legacy.id}`;
  const rootWbsId = `MIG-WBS-${legacy.id}`;
  const calendar = createStandardCalendar(calendarId, 'Migrated standard calendar', 'Asia/Manila');
  Object.assign(raw, {
    metadata: {
      description: legacy.description ?? '', owner: '', contractor: '', consultant: '', location: '', contractNumber: '',
      startDate: legacy.createdAt.slice(0, 10), timezone: 'Asia/Manila', currency: 'PHP', unitSystem: 'metric'
    },
    settings: { defaultCalendarId: calendar.id, criticalFloatThresholdDays: 0, nearCriticalFloatThresholdDays: 5, firstDayOfWeek: 1 },
    status: 'active', schemaVersion: 2, revision: 1, calendars: [calendar],
    wbs: [{ id: rootWbsId, code: '1.0', name: 'Project', sortOrder: 0 }],
    activities: legacy.activities.map((activity) => ({
      ...activity,
      wbsId: activity.wbsId ?? rootWbsId,
      calendarId: activity.calendarId ?? calendar.id,
      audit: activity.audit ?? { createdAt: legacy.createdAt, updatedAt: legacy.updatedAt, source: 'import' }
    })),
    savedViews: []
  });
  delete raw.description;
}

function migrateV2ToV3(raw: Record<string, unknown>): void {
  const metadata = raw.metadata as { startDate?: string } | undefined;
  Object.assign(raw, {
    schemaVersion: 3,
    statusDate: metadata?.startDate ?? new Date().toISOString().slice(0, 10),
    progress: {},
    baselines: [],
    updateSnapshots: [],
    boq: createEmptyBoq()
  });
}

function migrateV3ToV4(raw: Record<string, unknown>): void {
  Object.assign(raw, {
    schemaVersion: 4,
    controls: createEmptyCostControl(),
    riskResources: createEmptyRiskResources(),
    enterprise: createEmptyEnterprise()
  });
}
