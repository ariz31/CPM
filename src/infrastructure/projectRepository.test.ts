import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { createBlankProjectRecord } from '../domain/project/project';
import {
  createBlankProject,
  createProjectSnapshot,
  database,
  ensureSampleProject,
  listProjects,
  listProjectSnapshots,
  listQuarantinedProjects,
  permanentlyDeleteProject,
  resetDatabase,
  restoreProject,
  restoreProjectSnapshot,
  saveProject,
  trashProject
} from './projectRepository';

// PRJ-AT-001 through PRJ-AT-006
beforeEach(async () => { await resetDatabase(); });

describe('safe project repository', () => {
  it('initializes one reference project idempotently', async () => {
    await ensureSampleProject();
    await ensureSampleProject();
    expect((await listProjects()).length).toBe(1);
  });

  it('creates, saves, journals, trashes, restores, and permanently deletes a project', async () => {
    const project = await createBlankProject('Lifecycle');
    const saved = await saveProject({ ...project, name: 'Lifecycle Updated' }, 'PROJECT_RENAME', 'Renamed project');
    expect(saved.revision).toBeGreaterThan(project.revision);
    expect((await trashProject(project.id)).status).toBe('trashed');
    expect((await restoreProject(project.id)).status).toBe('active');
    await permanentlyDeleteProject(project.id);
    expect((await listProjects(['active', 'archived', 'trashed'])).some((item) => item.id === project.id)).toBe(false);
  });


  it('rolls back every write in an interrupted transaction', async () => {
    const project = await createBlankProject('Atomic');
    await expect(database.transaction('rw', database.projects, database.journal, async () => {
      await database.projects.put({ ...project, name: 'Partially changed' });
      await database.journal.add({
        projectId: project.id, commandId: 'failure', commandType: 'FAILURE_INJECTION',
        createdAt: new Date().toISOString(), revisionBefore: project.revision,
        revisionAfter: project.revision + 1, summary: 'Must roll back'
      });
      throw new Error('Injected interruption');
    })).rejects.toThrow(/Injected interruption/);
    expect((await database.projects.get(project.id))?.name).toBe('Atomic');
    expect(await database.journal.where('commandId').equals('failure').count()).toBe(0);
  });

  it('creates and restores named snapshots without changing the snapshot contents', async () => {
    const project = await createBlankProject('Snapshot');
    const snapshot = await createProjectSnapshot(project, 'Before change');
    await saveProject({ ...project, name: 'Changed' });
    const restored = await restoreProjectSnapshot(snapshot.id);
    expect(restored.name).toBe('Snapshot');
    expect((await listProjectSnapshots(project.id)).some((item) => item.id === snapshot.id)).toBe(true);
  });

  it('quarantines one corrupted project without blocking valid projects', async () => {
    const valid = createBlankProjectRecord('Valid');
    await database.projects.put(valid);
    await database.projects.put({ ...valid, id: 'bad', name: '', schemaVersion: 2 } as typeof valid);
    const projects = await listProjects(['active']);
    expect(projects.map((item) => item.id)).toEqual([valid.id]);
    expect((await listQuarantinedProjects()).map((item) => item.id)).toContain('bad');
  });
});
