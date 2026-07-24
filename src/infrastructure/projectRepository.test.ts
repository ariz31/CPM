import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  createBlankProject,
  database,
  ensureSampleProject,
  listProjects,
  resetDatabase,
  saveProject
} from './projectRepository';

describe('project repository', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('[PRJ-001][PRJ-004] seeds the sample project once', async () => {
    await ensureSampleProject();
    await ensureSampleProject();

    expect(await database.projects.count()).toBe(1);
  });

  it('[PRJ-002] creates and persists an offline project', async () => {
    const created = await createBlankProject('Hospital Expansion');
    const projects = await listProjects();

    expect(projects).toHaveLength(1);
    expect(projects[0]?.id).toBe(created.id);
    expect(projects[0]?.name).toBe('Hospital Expansion');
  });

  it('[PRJ-004] atomically replaces a project revision', async () => {
    const created = await createBlankProject('Initial name');
    const saved = await saveProject({ ...created, name: 'Approved name' });

    expect(saved.name).toBe('Approved name');
    expect(await database.projects.get(created.id)).toMatchObject({ name: 'Approved name' });
  });
});
