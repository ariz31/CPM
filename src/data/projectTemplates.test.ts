import { describe, expect, it } from 'vitest';
import { validateProjectRecord } from '../domain/project/project';
import { calculateSchedule } from '../domain/schedule/cpm';
import { instantiateProjectTemplate, PROJECT_TEMPLATES } from './projectTemplates';

describe('offline project templates', () => {
  it.each(PROJECT_TEMPLATES)('creates a valid calculable $name project', (template) => {
    const project = instantiateProjectTemplate(template.id, '2026-01-05T00:00:00.000Z');
    expect(validateProjectRecord(project)).toEqual([]);
    const result = calculateSchedule({
      projectStartDate: project.metadata.startDate,
      defaultCalendarId: project.settings.defaultCalendarId,
      criticalFloatThresholdDays: project.settings.criticalFloatThresholdDays,
      nearCriticalFloatThresholdDays: project.settings.nearCriticalFloatThresholdDays,
      calendars: project.calendars,
      activities: project.activities,
      relationships: project.relationships
    });
    expect(result.projectDuration).toBeGreaterThan(0);
    expect(result.activities).toHaveLength(project.activities.length);
  });
});
