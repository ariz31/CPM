import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { createBlankProjectRecord } from '../domain/project/project';
import { createProjectFile, importProjectFile } from './projectFile';
import { database, getProject, permanentlyDeleteProject, putImportedProject, resetDatabase } from './projectRepository';

// IO-AT-001 and IO-AT-002
describe('portable project file', () => {
  beforeEach(async () => { await resetDatabase(); });

  it('exports, deletes, and imports an exact project round trip', async () => {
    const project = createBlankProjectRecord('Round trip', '2026-01-01T00:00:00.000Z');
    await putImportedProject(project);
    const file = await createProjectFile(project);
    await permanentlyDeleteProject(project.id);
    const imported = await importProjectFile(file);
    expect(imported).toEqual(project);
    expect(await getProject(project.id)).toEqual(project);
  });

  it('rejects tampered content before modifying local storage', async () => {
    const project = createBlankProjectRecord('Tamper');
    const file = await createProjectFile(project);
    const envelope = JSON.parse(await file.text()) as Record<string, unknown>;
    (envelope.project as Record<string, unknown>).name = 'Tampered';
    await expect(importProjectFile(new Blob([JSON.stringify(envelope)]))).rejects.toThrow(/checksum/i);
    expect(await database.projects.count()).toBe(0);
  });
});
