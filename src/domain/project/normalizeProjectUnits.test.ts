import { describe, expect, it } from 'vitest';
import { createSampleProject } from '../../data/sampleProject';
import { normalizeProjectEngineeringUnits } from './normalizeProjectUnits';

describe('project engineering units', () => {
  it('normalizes BOQ, productivity, field, resource, and activity custom-field units', () => {
    const project = createSampleProject('2026-01-01T00:00:00.000Z');
    project.boq.items[0].unit = 'm3';
    project.boq.items[0].resources[0].unit = 'm2';
    project.riskResources.productivityPlans[0].unit = 'm3';
    project.riskResources.fieldRecords[0].unit = 'm3';
    project.riskResources.resources[0].unit = 'm2/day';
    project.activities[1].customFields = { productivityUnit: 'mm2' };

    const normalized = normalizeProjectEngineeringUnits(project);

    expect(normalized.boq.items[0].unit).toBe('m³');
    expect(normalized.boq.items[0].resources[0].unit).toBe('m²');
    expect(normalized.riskResources.productivityPlans[0].unit).toBe('m³');
    expect(normalized.riskResources.fieldRecords[0].unit).toBe('m³');
    expect(normalized.riskResources.resources[0].unit).toBe('m²/day');
    expect(normalized.activities[1].customFields?.productivityUnit).toBe('mm²');
  });
});
