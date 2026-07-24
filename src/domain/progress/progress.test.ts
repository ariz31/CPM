import { describe, expect, it } from 'vitest';
import { createBlankProjectRecord } from '../project/project';
import type { CalculatedActivity, ScheduleResult } from '../schedule/types';
import {
  addBaseline,
  addProgressUpdateSnapshot,
  analyzeProgress,
  createBaseline,
  createProgressUpdateSnapshot,
  derivePercentComplete,
  updateActivityProgress
} from './progress';

function resultFor(project = createBlankProjectRecord('Progress', '2026-01-05T00:00:00.000Z')): ScheduleResult {
  const activities: CalculatedActivity[] = project.activities.map((activity, index) => ({
    ...activity,
    earlyStart: { date: `2026-01-0${5 + index}`, minute: 480 },
    earlyFinish: { date: `2026-01-0${5 + index}`, minute: 480 },
    lateStart: { date: `2026-01-0${5 + index}`, minute: 480 },
    lateFinish: { date: `2026-01-0${5 + index}`, minute: 480 },
    earlyStartDate: `2026-01-0${5 + index} 08:00`,
    earlyFinishDate: `2026-01-0${5 + index} 08:00`,
    lateStartDate: `2026-01-0${5 + index} 08:00`,
    lateFinishDate: `2026-01-0${5 + index} 08:00`,
    earlyStartOffsetDays: index,
    totalFloat: 0,
    freeFloat: 0,
    isCritical: true,
    isNearCritical: false,
    drivingRelationshipIds: []
  }));
  return {
    activities,
    projectStartDate: activities[0].earlyStartDate,
    projectFinishDate: activities.at(-1)!.earlyFinishDate,
    projectDuration: 1,
    criticalActivityIds: activities.map((activity) => activity.id),
    nearCriticalActivityIds: [],
    warnings: [],
    calculatedAt: '2026-01-05T00:00:00.000Z',
    engineVersion: 'test'
  };
}

// P5-AT-001 through P5-AT-008
describe('baseline and progress control', () => {
  it('creates an immutable baseline from one calculated project revision', () => {
    const project = createBlankProjectRecord('Baseline', '2026-01-05T00:00:00.000Z');
    const baseline = createBaseline(project, resultFor(project), 'Original', 'original', '2026-01-05T01:00:00.000Z');
    const next = addBaseline(project, baseline);
    next.activities[0].name = 'Changed later';
    expect(baseline.activities[0].name).toBe('Project start');
    expect(next.activeBaselineId).toBe(baseline.id);
  });

  it('calculates duration, physical, units, and milestone progress methods', () => {
    const project = createBlankProjectRecord('Methods', '2026-01-05T00:00:00.000Z');
    const task = { ...project.activities[0], type: 'task' as const, duration: 10 };
    expect(derivePercentComplete(task, { activityId: task.id, method: 'duration', remainingDuration: 4, percentComplete: 0, suspendedPeriods: [], outOfSequenceMode: 'retained-logic', updatedAt: '' })).toBe(60);
    expect(derivePercentComplete(task, { activityId: task.id, method: 'physical', remainingDuration: 10, percentComplete: 0, physicalPercent: 42.5, suspendedPeriods: [], outOfSequenceMode: 'retained-logic', updatedAt: '' })).toBe(42.5);
    expect(derivePercentComplete(task, { activityId: task.id, method: 'units', remainingDuration: 10, percentComplete: 0, unitsComplete: 25, totalUnits: 100, suspendedPeriods: [], outOfSequenceMode: 'retained-logic', updatedAt: '' })).toBe(25);
  });

  it('requires actual start before actual finish and preserves remaining duration rules', () => {
    const project = createBlankProjectRecord('Actuals', '2026-01-05T00:00:00.000Z');
    expect(() => updateActivityProgress(project, 'START', { actualFinish: '2026-01-05' })).toThrow(/actual start/i);
    const next = updateActivityProgress(project, 'START', { actualStart: '2026-01-05', actualFinish: '2026-01-05', remainingDuration: 0 });
    expect(next.progress.START.percentComplete).toBe(100);
  });

  it('detects out-of-sequence starts and distinguishes retained logic from progress override forecasts', () => {
    const project = createBlankProjectRecord('Out of sequence', '2026-01-05T00:00:00.000Z');
    project.statusDate = '2026-01-06';
    const next = updateActivityProgress(project, 'FINISH', { actualStart: '2026-01-06', outOfSequenceMode: 'retained-logic' });
    const summary = analyzeProgress(next, resultFor(project));
    expect(summary.outOfSequenceCount).toBe(1);
    expect(summary.activities.find((activity) => activity.activityId === 'FINISH')?.isOutOfSequence).toBe(true);
  });

  it('creates reproducible weekly update snapshots', () => {
    const project = createBlankProjectRecord('Weekly', '2026-01-05T00:00:00.000Z');
    const snapshot = createProgressUpdateSnapshot(project, 'Week 1', '2026-01-09T17:00:00.000Z');
    const next = addProgressUpdateSnapshot(project, snapshot);
    project.statusDate = '2026-01-12';
    expect(next.updateSnapshots[0].statusDate).toBe('2026-01-05');
    expect(next.updateSnapshots[0].name).toBe('Week 1');
  });
});
