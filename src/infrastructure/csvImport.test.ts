import { describe, expect, it } from 'vitest';
import { createBlankProjectRecord } from '../domain/project/project';
import { applyActivityCsv, previewActivityCsv } from './csvImport';

// ACT-AT-005 and ENT-AT-011
describe('activity CSV import', () => {
  it('previews valid rows before committing them', () => {
    const project = createBlankProjectRecord('CSV');
    const preview = previewActivityCsv(project, 'id,name,duration,wbs\nA100,Excavation,5,1.0');
    expect(preview.errors).toEqual([]);
    expect(project.activities.some((item) => item.id === 'A100')).toBe(false);
    const imported = applyActivityCsv(project, preview);
    expect(imported.activities.some((item) => item.id === 'A100')).toBe(true);
  });

  it('does not partially mutate when any row is invalid', () => {
    const project = createBlankProjectRecord('CSV invalid');
    const before = structuredClone(project);
    const preview = previewActivityCsv(project, 'id,name,duration\nA100,Valid,2\nA101,Bad,-1');
    expect(preview.errors.length).toBeGreaterThan(0);
    expect(() => applyActivityCsv(project, preview)).toThrow();
    expect(project).toEqual(before);
  });
});
