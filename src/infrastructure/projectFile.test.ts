import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { createBlankProjectRecord } from '../domain/project/project';
import { createProjectFile, importProjectFile } from './projectFile';
import { database, getProject, permanentlyDeleteProject, putImportedProject, resetDatabase } from './projectRepository';

// IO-AT-001, IO-AT-002, P7-AT-003, P8-AT-007, and P9-AT-001
describe('portable project file', () => {
  beforeEach(async () => { await resetDatabase(); });

  it('exports, deletes, and imports an exact schema 4 project round trip', async () => {
    const project = createBlankProjectRecord('Round trip', '2026-01-01T00:00:00.000Z');
    project.controls.activityLoadings = [{ activityId: 'START', budgetCost: 100, phasing: 'milestone' }];
    project.controls.actualCosts = [{ id: 'AC1', activityId: 'START', date: '2026-01-01', amount: 25, description: 'Actual', source: 'manual' }];
    project.riskResources.pertEstimates = [{ activityId: 'START', optimistic: 0, mostLikely: 0, pessimistic: 0 }];
    project.riskResources.risks = [{ id: 'R1', title: 'Risk', probabilityPercent: 10, impactDays: 1, impactCost: 100, owner: 'Owner', status: 'open', linkedActivityIds: ['START'], response: 'Respond' }];
    project.riskResources.resources = [{ id: 'RES1', name: 'Crew', kind: 'labor', unit: 'crew', availabilityPerDay: 1, costRate: 100 }];
    project.riskResources.assignments = [{ id: 'AS1', resourceId: 'RES1', activityId: 'START', unitsPerDay: 1 }];
    project.enterprise.reportSnapshots = [{ id: 'REP1', name: 'Executive', kind: 'executive', createdAt: project.createdAt, projectRevision: project.revision, statusDate: project.statusDate, inputHash: 'hash', engineVersion: 'engine', rows: [{ value: 1 }] }];
    await putImportedProject(project);
    const file = await createProjectFile(project);
    const envelope = JSON.parse(await file.text()) as { modules: Record<string, number> };
    expect(envelope.modules).toMatchObject({ costLoadingCount: 1, actualCostCount: 1, pertEstimateCount: 1, riskCount: 1, resourceCount: 1, reportSnapshotCount: 1 });
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
