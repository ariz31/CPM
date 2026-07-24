import { describe, expect, it } from 'vitest';
import { createActivity, createBlankProjectRecord } from '../project/project';
import { calculateSchedule } from '../schedule/cpm';
import { analyzeRiskResources, calculatePert, convertQuantity, validateRiskResources } from './riskResources';

function fixture() {
  const project = createBlankProjectRecord('Risk and resources', '2026-01-05T00:00:00.000Z');
  const root = project.wbs[0];
  const calendarId = project.settings.defaultCalendarId;
  project.activities = [
    createActivity({ id: 'START', name: 'Start', type: 'milestone', duration: 0, wbsId: root.id, calendarId, now: project.createdAt }),
    createActivity({ id: 'A', name: 'Excavation', duration: 4, wbsId: root.id, calendarId, now: project.createdAt }),
    createActivity({ id: 'FINISH', name: 'Finish', type: 'milestone', duration: 0, wbsId: root.id, calendarId, now: project.createdAt })
  ];
  project.relationships = [
    { id: 'R1', predecessorId: 'START', successorId: 'A', type: 'FS', lag: 0 },
    { id: 'R2', predecessorId: 'A', successorId: 'FINISH', type: 'FS', lag: 0 }
  ];
  const schedule = calculateSchedule({
    projectStartDate: project.metadata.startDate,
    defaultCalendarId: calendarId,
    criticalFloatThresholdDays: 0,
    nearCriticalFloatThresholdDays: 2,
    calendars: project.calendars,
    activities: project.activities,
    relationships: project.relationships
  });
  return { project, schedule };
}

describe('Phase 8 PERT, risk, productivity, and resources', () => {
  it('matches the PERT expected-duration, variance, and normal probability reference', () => {
    const { project, schedule } = fixture();
    project.riskResources.pertEstimates = [{ activityId: 'A', optimistic: 2, mostLikely: 4, pessimistic: 8 }];
    project.riskResources.targetCompletionDays = 5.3333;
    const result = calculatePert(project.riskResources, schedule);
    expect(result.activities[0].expectedDuration).toBeCloseTo(4.3333, 4);
    expect(result.activities[0].variance).toBe(1);
    expect(result.criticalPathStandardDeviation).toBe(1);
    expect(result.completionProbability).toBeCloseTo(0.8413, 3);
    expect(result.sensitivity[0].sharePercent).toBe(100);
  });

  it('converts compatible field units and forecasts productivity', () => {
    expect(convertQuantity(1, 'm3', 'L')).toBe(1000);
    expect(convertQuantity(1000, 'kg', 't')).toBe(1);
    expect(() => convertQuantity(1, 'm2', 'kg')).toThrow(/Cannot convert/);
    const { project, schedule } = fixture();
    project.riskResources.productivityPlans = [{ id: 'P1', activityId: 'A', description: 'Excavation', quantity: 100, unit: 'm3', plannedRatePerDay: 20 }];
    project.riskResources.fieldRecords = [
      { id: 'F1', activityId: 'A', date: '2026-01-05', completedQuantity: 25, unit: 'm3', laborHours: 10, equipmentHours: 5, notes: '', evidenceBytes: 0 },
      { id: 'F2', activityId: 'A', date: '2026-01-06', completedQuantity: 25000, unit: 'L', laborHours: 10, equipmentHours: 5, notes: '', evidenceBytes: 0 }
    ];
    const result = analyzeRiskResources(project, schedule).productivity[0];
    expect(result.completedQuantity).toBe(50);
    expect(result.actualRatePerDay).toBe(25);
    expect(result.forecastDaysRemaining).toBe(2);
    expect(result.laborProductivity).toBe(2.5);
  });

  it('reconciles resource histograms and flags over-allocation', () => {
    const { project, schedule } = fixture();
    project.riskResources.resources = [{ id: 'CREW', name: 'Excavation crew', kind: 'labor', unit: 'crew', availabilityPerDay: 4, costRate: 1000 }];
    project.riskResources.assignments = [{ id: 'AS1', resourceId: 'CREW', activityId: 'A', unitsPerDay: 6 }];
    const histogram = analyzeRiskResources(project, schedule).histogram;
    expect(histogram.length).toBeGreaterThan(0);
    expect(histogram.every((row) => row.assigned === 6 && row.availability === 4 && row.overAllocated)).toBe(true);
    expect(histogram.every((row) => row.utilizationPercent === 150)).toBe(true);
  });

  it('enforces field-evidence memory limits and ranks expected risk exposure', () => {
    const { project, schedule } = fixture();
    project.riskResources.risks = [{ id: 'RISK1', title: 'Groundwater', probabilityPercent: 50, impactDays: 10, impactCost: 100000, owner: '', status: 'open', linkedActivityIds: ['A'], response: 'Dewatering' }];
    project.riskResources.fieldRecords = [{ id: 'F1', activityId: 'A', date: '2026-01-05', completedQuantity: 1, unit: 'm3', laborHours: 1, equipmentHours: 1, notes: '', evidenceBytes: 6 * 1024 * 1024 }];
    const result = analyzeRiskResources(project, schedule);
    expect(result.riskExposure[0]).toMatchObject({ expectedCostExposure: 50000, expectedScheduleExposureDays: 5 });
    expect(validateRiskResources(project).some((issue) => issue.includes('5 MB'))).toBe(true);
  });
});
