import Dexie, { type EntityTable } from 'dexie';
import type { Activity, Relationship } from '../domain/schedule/types';
import { createSampleProject } from '../data/sampleProject';

export interface ProjectRecord {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: 1;
  activities: Activity[];
  relationships: Relationship[];
}

class CpmDatabase extends Dexie {
  public projects!: EntityTable<ProjectRecord, 'id'>;

  public constructor() {
    super('cpm-enterprise-project-controls');
    this.version(1).stores({
      projects: 'id, name, updatedAt'
    });
  }
}

export const database = new CpmDatabase();

export async function ensureSampleProject(): Promise<void> {
  const count = await database.projects.count();
  if (count === 0) {
    await database.projects.add(createSampleProject());
  }
}

export async function listProjects(): Promise<ProjectRecord[]> {
  return database.projects.orderBy('updatedAt').reverse().toArray();
}

export async function getProject(projectId: string): Promise<ProjectRecord | undefined> {
  return database.projects.get(projectId);
}

export async function saveProject(project: ProjectRecord): Promise<ProjectRecord> {
  const updated = { ...project, updatedAt: new Date().toISOString() };
  await database.transaction('rw', database.projects, async () => {
    await database.projects.put(updated);
  });
  return updated;
}

export async function createBlankProject(name: string): Promise<ProjectRecord> {
  const now = new Date().toISOString();
  const project: ProjectRecord = {
    id: crypto.randomUUID(),
    name: name.trim() || 'Untitled project',
    description: 'New offline project',
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
    activities: [
      { id: 'START', name: 'Project start', duration: 0, type: 'milestone', wbs: '1.0' },
      { id: 'FINISH', name: 'Project finish', duration: 0, type: 'milestone', wbs: '1.0' }
    ],
    relationships: [
      { id: crypto.randomUUID(), predecessorId: 'START', successorId: 'FINISH', type: 'FS', lag: 0 }
    ]
  };
  await database.projects.add(project);
  return project;
}

export async function duplicateSampleProject(): Promise<ProjectRecord> {
  const now = new Date().toISOString();
  const sample = createSampleProject(now);
  const project = {
    ...sample,
    id: crypto.randomUUID(),
    name: `${sample.name} Copy`
  };
  await database.projects.add(project);
  return project;
}

export async function resetDatabase(): Promise<void> {
  await database.delete();
  await database.open();
}
