import { describe, expect, it } from 'vitest';
import { calculateCostControl } from '../controls/costControl';
import { buildReportRows } from '../enterprise/enterprise';
import { validateProjectRecord } from '../project/project';
import { analyzeRiskResources } from '../riskResources/riskResources';
import { calculateSchedule } from '../schedule/cpm';
import { createSampleProject } from '../../data/sampleProject';
import { migrateProjectRecord } from '../../infrastructure/projectMigration';

describe('Phase 10 sustained workload guard', () => {
  it('repeats calculation, report generation, serialization, and migration without drift', () => {
    const project = createSampleProject('2026-01-05T00:00:00.000Z');
    const startedAt = performance.now();
    let reference: string | undefined;
    for (let iteration = 0; iteration < 150; iteration += 1) {
      const result = calculateSchedule({
        projectStartDate: project.metadata.startDate,
        defaultCalendarId: project.settings.defaultCalendarId,
        criticalFloatThresholdDays: project.settings.criticalFloatThresholdDays,
        nearCriticalFloatThresholdDays: project.settings.nearCriticalFloatThresholdDays,
        calendars: project.calendars,
        activities: project.activities,
        relationships: project.relationships
      });
      const controls = calculateCostControl(project, result);
      const risk = analyzeRiskResources(project, result);
      const rows = buildReportRows('executive', project, result, controls, risk, []);
      const migrated = migrateProjectRecord(JSON.parse(JSON.stringify(project)));
      expect(validateProjectRecord(migrated)).toEqual([]);
      const signature = JSON.stringify({
        duration: result.projectDuration,
        finish: result.projectFinishDate,
        bac: controls.metrics.bac,
        riskCost: risk.riskSummary.expectedCostExposure,
        rows
      });
      reference ??= signature;
      expect(signature).toBe(reference);
    }
    expect(performance.now() - startedAt).toBeLessThan(6_000);
  });
});
