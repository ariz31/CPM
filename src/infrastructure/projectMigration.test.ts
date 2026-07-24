import { describe, expect, it } from 'vitest';
import { createBlankProjectRecord, validateProjectRecord } from '../domain/project/project';
import { migrateProjectRecord, migrateProjectSnapshot } from './projectMigration';

function schema3Fixture() {
  const current = createBlankProjectRecord('Schema 3', '2026-01-01T00:00:00.000Z');
  const { controls: _controls, riskResources: _riskResources, enterprise: _enterprise, ...schema3 } = current;
  return { ...schema3, schemaVersion: 3 as const };
}

function schema2Fixture() {
  const { statusDate: _statusDate, progress: _progress, baselines: _baselines, activeBaselineId: _active, updateSnapshots: _updates, boq: _boq, ...schema2 } = schema3Fixture();
  return { ...schema2, schemaVersion: 2 as const };
}

function schema1Fixture() {
  const schema2 = schema2Fixture();
  return {
    id: schema2.id,
    name: schema2.name,
    description: schema2.metadata.description,
    createdAt: schema2.createdAt,
    updatedAt: schema2.updatedAt,
    schemaVersion: 1 as const,
    activities: schema2.activities.map(({ wbsId: _wbsId, calendarId: _calendarId, audit: _audit, ...activity }) => activity),
    relationships: schema2.relationships
  };
}

describe('project migration matrix', () => {
  it.each([
    ['schema 1', schema1Fixture()],
    ['schema 2', schema2Fixture()],
    ['schema 3', schema3Fixture()],
    ['schema 4', createBlankProjectRecord('Schema 4')]
  ])('migrates %s to the current valid project model', (_name, fixture) => {
    const migrated = migrateProjectRecord(fixture);
    expect(migrated.schemaVersion).toBe(4);
    expect(migrated.controls).toBeDefined();
    expect(migrated.riskResources).toBeDefined();
    expect(migrated.enterprise).toBeDefined();
    expect(validateProjectRecord(migrated)).toEqual([]);
  });

  it('is deterministic for legacy schema 1 input', () => {
    const fixture = schema1Fixture();
    expect(migrateProjectRecord(fixture)).toEqual(migrateProjectRecord(fixture));
  });

  it('migrates the embedded project inside recovery snapshots', () => {
    const fixture = schema2Fixture();
    const migrated = migrateProjectSnapshot({
      id: 'SNAP-1', projectId: fixture.id, name: 'Legacy recovery', kind: 'recovery', createdAt: fixture.createdAt, project: fixture
    });
    expect(migrated.project.schemaVersion).toBe(4);
    expect(validateProjectRecord(migrated.project)).toEqual([]);
  });

  it('rejects unknown future and malformed schemas', () => {
    expect(() => migrateProjectRecord({ schemaVersion: 99 })).toThrow(/unsupported/i);
    expect(() => migrateProjectRecord(null)).toThrow(/object/i);
  });
});
