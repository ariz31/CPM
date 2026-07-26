import { describe, expect, it } from 'vitest';
import { createActivity, createBlankProjectRecord } from '../project/project';
import { calculateSchedule } from '../schedule/cpm';
import { buildProjectControlsSnapshot, resolvePerformanceStatus } from './projectControlsSnapshot';

function fixture() {
  const project = createBlankProjectRecord('Dashboard fixture', '2026-01-05T00:00:00.000Z');
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
  const schedule = calculateSchedule({
    projectStartDate: project.metadata.startDate,
    defaultCalendarId: project.settings.defaultCalendarId,
    criticalFloatThresholdDays: project.settings.criticalFloatThresholdDays,
    nearCriticalFloatThresholdDays: project.settings.nearCriticalFloatThresholdDays,
    calendars: project.calendars,
    activities: project.activities,
    relationships: project.relationships
  });
  return { project, schedule };
}

describe('project controls dashboard snapshot', () => {
  it('uses standardized performance thresholds', () => {
    expect(resolvePerformanceStatus(null)).toBe('unavailable');
    expect(resolvePerformanceStatus(1)).toBe('positive');
    expect(resolvePerformanceStatus(0.9)).toBe('warning');
    expect(resolvePerformanceStatus(0.8999)).toBe('critical');
  });

  it('represents missing cost data without undefined values and reconciles findings', () => {
    const { project, schedule } = fixture();
    const snapshot = buildProjectControlsSnapshot(project, schedule);
    const breakdown = snapshot.findings.schedule
      + snapshot.findings.budget
      + snapshot.findings.dates
      + snapshot.findings.risk
      + snapshot.findings.resources
      + snapshot.findings.validation;

    expect(snapshot.cost.bac).toBeNull();
    expect(snapshot.earnedValue.cpi).toBeNull();
    expect(snapshot.earnedValue.spi).toBeNull();
    expect(snapshot.earnedValue.cpiStatus).toBe('unavailable');
    expect(snapshot.findings.totalOpen).toBe(breakdown);
    expect(snapshot.findings.critical + snapshot.findings.warning).toBe(snapshot.findings.totalOpen);
    expect(JSON.stringify(snapshot)).not.toContain('undefined');
  });

  it('uses the same authoritative inputs for BAC, CPI, and SPI', () => {
    const { project, schedule } = fixture();
    project.controls.activityLoadings = [{ activityId: 'A', budgetCost: 1000, phasing: 'uniform' }];
    project.controls.actualCosts = [{ id: 'AC1', activityId: 'A', date: project.statusDate, amount: 400, description: 'Invoice', source: 'invoice' }];
    project.progress.A = {
      activityId: 'A', method: 'physical', remainingDuration: 2, percentComplete: 50, physicalPercent: 50,
      suspendedPeriods: [], outOfSequenceMode: 'retained-logic', updatedAt: project.updatedAt
    };

    const snapshot = buildProjectControlsSnapshot(project, schedule);
    expect(snapshot.cost.bac).toBe(1000);
    expect(snapshot.earnedValue.ev).toBe(500);
    expect(snapshot.earnedValue.ac).toBe(400);
    expect(snapshot.earnedValue.cpi).toBe(1.25);
    expect(snapshot.earnedValue.cpiStatus).toBe('positive');
    expect(snapshot.earnedValue.spi).not.toBeNull();
  });
});
