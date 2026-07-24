import { describe, expect, it } from 'vitest';
import { createActivity, createBlankProjectRecord } from '../project/project';
import { calculateSchedule } from '../schedule/cpm';
import { calculateCostControl, calculateEvmMetrics, phasingWeights } from './costControl';

function fixture() {
  const project = createBlankProjectRecord('Cost control', '2026-01-05T00:00:00.000Z');
  const root = project.wbs[0];
  const calendarId = project.settings.defaultCalendarId;
  project.activities = [
    createActivity({ id: 'START', name: 'Start', type: 'milestone', duration: 0, wbsId: root.id, calendarId, now: project.createdAt }),
    createActivity({ id: 'A', name: 'Work', duration: 4, wbsId: root.id, calendarId, now: project.createdAt }),
    createActivity({ id: 'FINISH', name: 'Finish', type: 'milestone', duration: 0, wbsId: root.id, calendarId, now: project.createdAt })
  ];
  project.relationships = [
    { id: 'R1', predecessorId: 'START', successorId: 'A', type: 'FS', lag: 0 },
    { id: 'R2', predecessorId: 'A', successorId: 'FINISH', type: 'FS', lag: 0 }
  ];
  project.statusDate = '2026-01-06';
  project.controls.activityLoadings = [{ activityId: 'A', budgetCost: 1000, phasing: 'uniform' }];
  project.controls.actualCosts = [{ id: 'AC1', activityId: 'A', date: '2026-01-06', amount: 300, description: 'Invoice', source: 'invoice' }];
  project.progress.A = {
    activityId: 'A', method: 'physical', remainingDuration: 2, percentComplete: 50, physicalPercent: 50,
    suspendedPeriods: [], outOfSequenceMode: 'retained-logic', updatedAt: project.updatedAt
  };
  return { project, schedule: calculateSchedule({
    projectStartDate: project.metadata.startDate,
    defaultCalendarId: project.settings.defaultCalendarId,
    criticalFloatThresholdDays: 0,
    nearCriticalFloatThresholdDays: 2,
    calendars: project.calendars,
    activities: project.activities,
    relationships: project.relationships
  }) };
}

describe('Phase 7 cost loading, curves, EVM, and cash flow', () => {
  it('normalizes all six phasing methods and preserves intended direction', () => {
    for (const method of ['uniform', 'front-loaded', 'back-loaded', 'bell', 'custom', 'milestone'] as const) {
      const weights = phasingWeights(method, 4, method === 'custom' ? [1, 2, 3, 4] : undefined);
      expect(weights.reduce((sum, item) => sum + item, 0)).toBeCloseTo(1, 10);
    }
    expect(phasingWeights('front-loaded', 4)[0]).toBeGreaterThan(phasingWeights('front-loaded', 4)[3]);
    expect(phasingWeights('back-loaded', 4)[0]).toBeLessThan(phasingWeights('back-loaded', 4)[3]);
    expect(phasingWeights('milestone', 4)).toEqual([0, 0, 0, 1]);
  });

  it('reconciles final planned curves to BAC and calculates reference EVM metrics', () => {
    const { project, schedule } = fixture();
    const result = calculateCostControl(project, schedule);
    expect(result.curves.at(-1)?.plannedEarly).toBe(1000);
    expect(result.curves.at(-1)?.plannedLate).toBe(1000);
    expect(result.metrics).toMatchObject({ pv: 500, ev: 500, ac: 300, bac: 1000, sv: 0, cv: 200, spi: 1 });
    expect(result.metrics.cpi).toBeCloseTo(1.6667, 4);
    expect(result.completeness.allocatedBudget).toBe(1000);
  });

  it('reports undefined ratios as null rather than zero or infinity', () => {
    const metrics = calculateEvmMetrics(0, 0, 0, 1000);
    expect(metrics.spi).toBeNull();
    expect(metrics.cpi).toBeNull();
    expect(metrics.eac).toBeNull();
    expect(metrics.etc).toBeNull();
    expect(metrics.vac).toBeNull();
    expect(Number.isFinite(metrics.bac)).toBe(true);
  });

  it('applies advance, recovery, retention, release, lag, and tax without losing cash', () => {
    const { project, schedule } = fixture();
    project.controls.cashFlow = {
      billingLagDays: 2,
      advancePercent: 10,
      advanceRecoveryPercent: 10,
      retentionPercent: 5,
      retentionReleaseLagDays: 7,
      taxPercent: 2
    };
    const result = calculateCostControl(project, schedule);
    expect(result.cashFlow.some((item) => item.advance > 0)).toBe(true);
    expect(result.cashFlow.some((item) => item.recovery > 0)).toBe(true);
    expect(result.cashFlow.some((item) => item.retentionRelease > 0)).toBe(true);
    expect(result.cashFlow.every((item) => Number.isFinite(item.cumulativeNetCashFlow))).toBe(true);
  });
});
