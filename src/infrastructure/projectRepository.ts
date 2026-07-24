import Dexie, { type EntityTable, type Transaction } from 'dexie';
import { createSampleProject } from '../data/sampleProject';
import { cloneProject, createBlankProjectRecord, validateProjectRecord } from '../domain/project/project';
import type {
  JournalEntry,
  ProjectRecord,
  ProjectSnapshot,
  ProjectStatus,
  QuarantinedProject
} from '../domain/project/types';
import { createStandardCalendar } from '../domain/calendar/calendar';

interface LegacyProjectRecord {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: 1;
  activities: Array<Record<string, unknown>>;
  relationships: Array<Record<string, unknown>>;
}

class CpmDatabase extends Dexie {
  public projects!: EntityTable<ProjectRecord, 'id'>;
  public snapshots!: EntityTable<ProjectSnapshot, 'id'>;
  public journal!: EntityTable<JournalEntry, 'id'>;
  public quarantine!: EntityTable<QuarantinedProject, 'id'>;

  public constructor() {
    super('cpm-enterprise-project-controls');
    this.version(1).stores({ projects: 'id, name, updatedAt' });
    this.version(2)
      .stores({
        projects: 'id, name, status, updatedAt',
        snapshots: 'id, projectId, createdAt, kind',
        journal: '++id, projectId, createdAt, commandType',
        quarantine: 'id, detectedAt'
      })
      .upgrade(async (transaction: Transaction) => {
        const table = transaction.table('projects');
        await table.toCollection().modify((raw: LegacyProjectRecord | ProjectRecord) => {
          if (raw.schemaVersion === 2) return;
          const legacy = raw as LegacyProjectRecord;
          const calendar = createStandardCalendar();
          const rootWbsId = crypto.randomUUID();
          Object.assign(raw, {
            name: legacy.name,
            metadata: {
              description: legacy.description ?? '',
              owner: '', contractor: '', consultant: '', location: '', contractNumber: '',
              startDate: legacy.createdAt.slice(0, 10), timezone: 'Asia/Manila', currency: 'PHP', unitSystem: 'metric'
            },
            settings: {
              defaultCalendarId: calendar.id,
              criticalFloatThresholdDays: 0,
              nearCriticalFloatThresholdDays: 5,
              firstDayOfWeek: 1
            },
            status: 'active',
            schemaVersion: 2,
            revision: 1,
            calendars: [calendar],
            wbs: [{ id: rootWbsId, code: '1.0', name: 'Project', sortOrder: 0 }],
            activities: legacy.activities.map((activity) => ({
              ...activity,
              wbsId: rootWbsId,
              calendarId: calendar.id,
              audit: { createdAt: legacy.createdAt, updatedAt: legacy.updatedAt, source: 'import' }
            })),
            savedViews: []
          });
          delete (raw as Partial<LegacyProjectRecord>).description;
        });
      });
    this.version(3).stores({
      projects: 'id, name, status, updatedAt',
      snapshots: 'id, projectId, createdAt, kind',
      journal: '++id, projectId, createdAt, commandType, commandId',
      quarantine: 'id, detectedAt'
    });
  }
}

export const database = new CpmDatabase();

export async function ensureSampleProject(): Promise<void> {
  const count = await database.projects.count();
  if (count === 0) await database.projects.add(createSampleProject());
}

export async function listProjects(statuses: ProjectStatus[] = ['active', 'archived']): Promise<ProjectRecord[]> {
  const records = await database.projects.toArray();
  const valid: ProjectRecord[] = [];
  for (const record of records) {
    const issues = validateProjectRecord(record);
    if (issues.length === 0) {
      if (statuses.includes(record.status)) valid.push(record);
      continue;
    }
    await database.transaction('rw', database.projects, database.quarantine, async () => {
      await database.quarantine.put({
        id: record.id || crypto.randomUUID(),
        detectedAt: new Date().toISOString(),
        reason: issues.join(' '),
        raw: structuredClone(record)
      });
      await database.projects.delete(record.id);
    });
  }
  return valid.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function listTrashedProjects(): Promise<ProjectRecord[]> {
  return listProjects(['trashed']);
}

export async function listQuarantinedProjects(): Promise<QuarantinedProject[]> {
  return database.quarantine.orderBy('detectedAt').reverse().toArray();
}

export async function getProject(projectId: string): Promise<ProjectRecord | undefined> {
  const record = await database.projects.get(projectId);
  if (!record) return undefined;
  const issues = validateProjectRecord(record);
  if (issues.length > 0) throw new Error(`Project is damaged: ${issues.join(' ')}`);
  return record;
}

export async function saveProject(
  project: ProjectRecord,
  commandType = 'PROJECT_SAVE',
  summary = 'Saved project changes',
  commandId: string = crypto.randomUUID()
): Promise<ProjectRecord> {
  const issues = validateProjectRecord(project);
  if (issues.length > 0) throw new Error(issues.join('\n'));
  const previous = await database.projects.get(project.id);
  const updated: ProjectRecord = {
    ...structuredClone(project),
    updatedAt: new Date().toISOString(),
    revision: Math.max(project.revision, (previous?.revision ?? 0) + 1)
  };
  await database.transaction('rw', database.projects, database.journal, async () => {
    await database.projects.put(updated);
    await database.journal.add({
      projectId: updated.id,
      commandId,
      commandType,
      createdAt: updated.updatedAt,
      revisionBefore: previous?.revision ?? 0,
      revisionAfter: updated.revision,
      summary
    });
  });
  return updated;
}

export async function createBlankProject(name: string): Promise<ProjectRecord> {
  const project = createBlankProjectRecord(name);
  await database.transaction('rw', database.projects, database.journal, async () => {
    await database.projects.add(project);
    await database.journal.add({
      projectId: project.id,
      commandId: crypto.randomUUID(),
      commandType: 'PROJECT_CREATE',
      createdAt: project.createdAt,
      revisionBefore: 0,
      revisionAfter: project.revision,
      summary: 'Created project'
    });
  });
  return project;
}

export async function duplicateProject(projectId: string): Promise<ProjectRecord> {
  const source = await requireProject(projectId);
  const project = cloneProject(source, `${source.name} Copy`);
  await database.projects.add(project);
  return project;
}

export async function duplicateSampleProject(): Promise<ProjectRecord> {
  const sample = createSampleProject();
  const project = cloneProject(sample, `${sample.name} Copy`);
  await database.projects.add(project);
  return project;
}

export async function renameProject(projectId: string, name: string): Promise<ProjectRecord> {
  const project = await requireProject(projectId);
  return saveProject({ ...project, name: name.trim() || project.name }, 'PROJECT_RENAME', `Renamed project to ${name}`);
}

export async function setProjectStatus(projectId: string, status: ProjectStatus): Promise<ProjectRecord> {
  const project = await requireProject(projectId);
  const now = new Date().toISOString();
  const next: ProjectRecord = {
    ...project,
    status,
    archivedAt: status === 'archived' ? now : undefined,
    trashedAt: status === 'trashed' ? now : undefined
  };
  return saveProject(next, `PROJECT_${status.toUpperCase()}`, `Changed project status to ${status}`);
}

export async function trashProject(projectId: string): Promise<ProjectRecord> {
  const project = await requireProject(projectId);
  await createProjectSnapshot(project, 'Before moving to trash', 'pre-delete');
  return setProjectStatus(projectId, 'trashed');
}

export async function restoreProject(projectId: string): Promise<ProjectRecord> {
  return setProjectStatus(projectId, 'active');
}

export async function permanentlyDeleteProject(projectId: string): Promise<void> {
  await database.transaction('rw', database.projects, database.snapshots, database.journal, async () => {
    await database.projects.delete(projectId);
    await database.snapshots.where('projectId').equals(projectId).delete();
    await database.journal.where('projectId').equals(projectId).delete();
  });
}

export async function createProjectSnapshot(
  project: ProjectRecord,
  name: string,
  kind: ProjectSnapshot['kind'] = 'named'
): Promise<ProjectSnapshot> {
  const snapshot: ProjectSnapshot = {
    id: crypto.randomUUID(),
    projectId: project.id,
    name: name.trim() || 'Snapshot',
    kind,
    createdAt: new Date().toISOString(),
    project: structuredClone(project)
  };
  await database.snapshots.add(snapshot);
  return snapshot;
}

export async function listProjectSnapshots(projectId: string): Promise<ProjectSnapshot[]> {
  const snapshots = await database.snapshots.where('projectId').equals(projectId).toArray();
  return snapshots.sort((left: ProjectSnapshot, right: ProjectSnapshot) => right.createdAt.localeCompare(left.createdAt));
}

export async function restoreProjectSnapshot(snapshotId: string): Promise<ProjectRecord> {
  const snapshot = await database.snapshots.get(snapshotId);
  if (!snapshot) throw new Error('Snapshot was not found.');
  const current = await database.projects.get(snapshot.projectId);
  if (current) await createProjectSnapshot(current, 'Automatic snapshot before restore', 'recovery');
  return saveProject(
    { ...structuredClone(snapshot.project), status: 'active', trashedAt: undefined, archivedAt: undefined },
    'SNAPSHOT_RESTORE',
    `Restored snapshot ${snapshot.name}`
  );
}

export async function listJournal(projectId: string): Promise<JournalEntry[]> {
  const entries = await database.journal.where('projectId').equals(projectId).toArray();
  return entries.sort((left: JournalEntry, right: JournalEntry) => right.createdAt.localeCompare(left.createdAt));
}

export async function getStorageHealth(): Promise<{ usage: number; quota: number; ratio: number; persistent: boolean }> {
  const estimate = await navigator.storage?.estimate?.();
  const usage = estimate?.usage ?? 0;
  const quota = estimate?.quota ?? 0;
  const persistent = (await navigator.storage?.persisted?.()) ?? false;
  return { usage, quota, ratio: quota > 0 ? usage / quota : 0, persistent };
}

export async function putImportedProject(project: ProjectRecord): Promise<ProjectRecord> {
  const issues = validateProjectRecord(project);
  if (issues.length > 0) throw new Error(issues.join('\n'));
  const copy = structuredClone(project);
  await database.transaction('rw', database.projects, database.journal, async () => {
    await database.projects.put(copy);
    await database.journal.add({
      projectId: copy.id,
      commandId: crypto.randomUUID(),
      commandType: 'PROJECT_IMPORT',
      createdAt: new Date().toISOString(),
      revisionBefore: 0,
      revisionAfter: copy.revision,
      summary: 'Imported project from portable file'
    });
  });
  return copy;
}

export async function resetDatabase(): Promise<void> {
  await database.delete();
  await database.open();
}

async function requireProject(projectId: string): Promise<ProjectRecord> {
  const project = await getProject(projectId);
  if (!project) throw new Error('Project was not found.');
  return project;
}
