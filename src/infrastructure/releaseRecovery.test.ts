import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { createSampleProject } from '../data/sampleProject';
import { validateProjectRecord } from '../domain/project/project';
import { createProjectFile, importProjectFile } from './projectFile';
import {
  createProjectSnapshot,
  getProject,
  listProjectSnapshots,
  permanentlyDeleteProject,
  putImportedProject,
  resetDatabase,
  restoreProjectSnapshot,
  saveProject
} from './projectRepository';

beforeEach(async () => { await resetDatabase(); });

describe('offline release recovery drills', () => {
  it('exports, changes, rolls back, deletes, and restores the authoritative project without data loss', async () => {
    const original = createSampleProject('2026-01-05T00:00:00.000Z');
    await putImportedProject(original);
    const portable = await createProjectFile(original);
    const rollbackPoint = await createProjectSnapshot(original, 'Before release update', 'recovery');

    const changed = await saveProject({
      ...original,
      name: 'Changed during update drill',
      controls: { ...original.controls, actualCosts: [{ id: 'AC-DRILL', date: original.statusDate, amount: 12_345, description: 'Recovery drill' }] }
    }, 'RELEASE_UPDATE_DRILL', 'Simulated application update mutation');
    expect(changed.name).not.toBe(original.name);

    const rolledBack = await restoreProjectSnapshot(rollbackPoint.id);
    expect(rolledBack.name).toBe(original.name);
    expect(rolledBack.controls.actualCosts).toEqual(original.controls.actualCosts);
    expect(validateProjectRecord(rolledBack)).toEqual([]);
    expect((await listProjectSnapshots(original.id)).length).toBeGreaterThanOrEqual(2);

    await permanentlyDeleteProject(original.id);
    expect(await getProject(original.id)).toBeUndefined();
    const restoredFromFile = await importProjectFile(portable);
    expect(restoredFromFile).toEqual(original);
    expect(await getProject(original.id)).toEqual(original);
  });

  it('creates a pre-import recovery snapshot before replacing a live project', async () => {
    const original = createSampleProject('2026-01-05T00:00:00.000Z');
    await putImportedProject(original);
    const portable = await createProjectFile({ ...original, name: 'Replacement project' });
    const replaced = await importProjectFile(portable, true);
    expect(replaced.name).toBe('Replacement project');
    const snapshots = await listProjectSnapshots(original.id);
    expect(snapshots.some((snapshot) => snapshot.kind === 'pre-import' && snapshot.project.name === original.name)).toBe(true);
  });
});
