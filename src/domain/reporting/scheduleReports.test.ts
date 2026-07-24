import { describe, expect, it } from 'vitest';
import { createSampleProject } from '../../data/sampleProject';
import { calculateSchedule } from '../schedule/cpm';
import { createScheduleReport, scheduleReportToCsv } from './scheduleReports';

// P4-AT-004 through P4-AT-008
describe('schedule reporting', () => {
  it('produces deterministic critical, float, logic, milestone, and look-ahead structures', () => {
    const project = createSampleProject('2026-01-05T00:00:00.000Z');
    const result = calculateSchedule({
      projectStartDate: project.metadata.startDate,
      defaultCalendarId: project.settings.defaultCalendarId,
      criticalFloatThresholdDays: project.settings.criticalFloatThresholdDays,
      nearCriticalFloatThresholdDays: project.settings.nearCriticalFloatThresholdDays,
      calendars: project.calendars,
      activities: project.activities,
      relationships: project.relationships
    });
    for (const kind of ['critical-path', 'float', 'logic', 'milestones', 'look-ahead'] as const) {
      const report = createScheduleReport(kind, project, result, { generatedAt: '2026-01-05T01:00:00.000Z', lookAheadDays: 30 });
      expect(report.provenance).toMatchObject({ projectId: project.id, projectRevision: project.revision, engineVersion: result.engineVersion });
      expect(report.columns.length).toBeGreaterThan(0);
    }
  });

  it('filters look-ahead rows against the status-date window', () => {
    const project = createSampleProject('2026-01-05T00:00:00.000Z');
    project.statusDate = '2026-01-05';
    const result = calculateSchedule({ projectStartDate: project.metadata.startDate, defaultCalendarId: project.settings.defaultCalendarId, criticalFloatThresholdDays: 0, nearCriticalFloatThresholdDays: 5, calendars: project.calendars, activities: project.activities, relationships: project.relationships });
    const short = createScheduleReport('look-ahead', project, result, { lookAheadDays: 2, generatedAt: 'fixed' });
    const long = createScheduleReport('look-ahead', project, result, { lookAheadDays: 60, generatedAt: 'fixed' });
    expect(long.rows.length).toBeGreaterThanOrEqual(short.rows.length);
  });

  it('protects CSV report exports from formula injection', () => {
    const project = createSampleProject('2026-01-05T00:00:00.000Z');
    project.activities[0].name = '=cmd';
    const result = calculateSchedule({ projectStartDate: project.metadata.startDate, defaultCalendarId: project.settings.defaultCalendarId, criticalFloatThresholdDays: 0, nearCriticalFloatThresholdDays: 5, calendars: project.calendars, activities: project.activities, relationships: project.relationships });
    expect(scheduleReportToCsv(createScheduleReport('critical-path', project, result, { generatedAt: 'fixed' }))).toContain("'=cmd");
  });
});
