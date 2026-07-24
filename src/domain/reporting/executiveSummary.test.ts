import { describe, expect, it } from 'vitest';
import { createBlankProjectRecord } from '../project/project';
import type { CostControlResult } from '../controls/types';
import type { RiskResourceResult } from '../riskResources/types';
import type { ScheduleResult } from '../schedule/types';
import { buildExecutiveSummary } from './executiveSummary';

describe('executive reporting summary', () => {
  it('exposes defined metrics, sorted exceptions, milestones, and completeness', () => {
    const project = createBlankProjectRecord('Executive test', '2026-07-01T00:00:00.000Z');
    const root = project.wbs[0];
    const calendarId = project.settings.defaultCalendarId;
    project.statusDate = '2026-07-10';
    project.activities = [
      { id: 'A-1', name: 'Critical task', duration: 5, type: 'task', wbsId: root.id, calendarId },
      { id: 'M-1', name: 'Handover', duration: 0, type: 'milestone', wbsId: root.id, calendarId }
    ];
    project.progress = {
      'A-1': { activityId: 'A-1', method: 'duration', remainingDuration: 2.5, percentComplete: 50, suspendedPeriods: [], outOfSequenceMode: 'retained-logic', updatedAt: '2026-07-10T00:00:00.000Z' }
    };
    const schedule: ScheduleResult = {
      activities: [
        {
          ...project.activities[0], earlyStart: { date: '2026-07-01', minute: 480 }, earlyFinish: { date: '2026-07-07', minute: 1020 }, lateStart: { date: '2026-07-01', minute: 480 }, lateFinish: { date: '2026-07-07', minute: 1020 },
          earlyStartDate: '2026-07-01 08:00', earlyFinishDate: '2026-07-07 17:00', lateStartDate: '2026-07-01 08:00', lateFinishDate: '2026-07-07 17:00', earlyStartOffsetDays: 0, totalFloat: -1, freeFloat: 0, isCritical: true, isNearCritical: false, drivingRelationshipIds: []
        },
        {
          ...project.activities[1], earlyStart: { date: '2026-07-15', minute: 1020 }, earlyFinish: { date: '2026-07-15', minute: 1020 }, lateStart: { date: '2026-07-15', minute: 1020 }, lateFinish: { date: '2026-07-15', minute: 1020 },
          earlyStartDate: '2026-07-15 17:00', earlyFinishDate: '2026-07-15 17:00', lateStartDate: '2026-07-15 17:00', lateFinishDate: '2026-07-15 17:00', earlyStartOffsetDays: 14, totalFloat: 0, freeFloat: 0, isCritical: true, isNearCritical: false, drivingRelationshipIds: []
        }
      ],
      projectStartDate: '2026-07-01', projectFinishDate: '2026-07-15', projectDuration: 10, criticalActivityIds: ['A-1', 'M-1'], nearCriticalActivityIds: [],
      warnings: [{ code: 'NEGATIVE_FLOAT', activityId: 'A-1', message: 'A-1 has negative float.', severity: 'error' }],
      calculatedAt: '2026-07-10T00:00:00.000Z', engineVersion: 'test-engine'
    };
    const controls: CostControlResult = {
      curves: [{ period: '2026-W27', plannedEarly: 100, plannedLate: 90, actual: 120, earned: 80, forecast: 140 }],
      cashFlow: [],
      metrics: { pv: 100, ev: 80, ac: 120, bac: 200, sv: -20, cv: -40, spi: 0.8, cpi: 0.6667, eac: 300, etc: 180, vac: -100, tcpi: 1.5 },
      completeness: { estimateTotal: 200, allocatedBudget: 100, allocationPercent: 50, activitiesWithoutDates: [], activitiesWithoutBudget: ['M-1'] },
      assumptions: []
    };
    const risk: RiskResourceResult = {
      pert: { activities: [], criticalPathExpectedDuration: 0, criticalPathVariance: 0, criticalPathStandardDeviation: 0, completionProbability: null, sensitivity: [], warnings: [] },
      riskExposure: [{ riskId: 'R-1', title: 'Delivery delay', expectedCostExposure: 50000, expectedScheduleExposureDays: 3, score: 6 }],
      productivity: [],
      histogram: [{ resourceId: 'CREW', date: '2026-07-02', assigned: 2, availability: 1, overAllocated: true, utilizationPercent: 200 }],
      validationIssues: []
    };
    project.riskResources.risks = [{ id: 'R-1', title: 'Delivery delay', probabilityPercent: 50, impactDays: 6, impactCost: 100000, owner: 'PM', status: 'open', linkedActivityIds: ['A-1'], response: 'Expedite' }];

    const summary = buildExecutiveSummary(project, schedule, controls, risk);
    expect(summary.metrics.map((metric) => metric.id)).toContain('data-completeness');
    expect(summary.metrics.find((metric) => metric.id === 'cpi')?.status).toBe('critical');
    expect(summary.exceptions[0].severity).toBe('critical');
    expect(summary.exceptions.some((item) => item.category === 'resource')).toBe(true);
    expect(summary.milestones[0]).toMatchObject({ activityId: 'M-1', state: 'upcoming' });
    expect(summary.curve).toEqual([{ period: '2026-W27', planned: 100, earned: 80, actual: 120 }]);
    expect(summary.completenessScore).toBeGreaterThanOrEqual(0);
  });
});
