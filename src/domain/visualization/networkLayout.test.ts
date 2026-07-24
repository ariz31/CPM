import { describe, expect, it } from 'vitest';
import { createSampleProject } from '../../data/sampleProject';
import { calculateSchedule } from '../schedule/cpm';
import { layoutScheduleNetwork } from './networkLayout';

// P4-AT-001 through P4-AT-003
describe('schedule network layout', () => {
  it('creates deterministic layered nodes, orthogonal edges, and WBS groups', () => {
    const project = createSampleProject('2026-01-05T00:00:00.000Z');
    const result = calculateSchedule({ projectStartDate: project.metadata.startDate, defaultCalendarId: project.settings.defaultCalendarId, criticalFloatThresholdDays: 0, nearCriticalFloatThresholdDays: 5, calendars: project.calendars, activities: project.activities, relationships: project.relationships });
    const first = layoutScheduleNetwork(project.activities, project.relationships, result.activities, project.wbs);
    const second = layoutScheduleNetwork(project.activities, project.relationships, result.activities, project.wbs);
    expect(first).toEqual(second);
    expect(first.edges.every((edge) => edge.path.startsWith('M '))).toBe(true);
    expect(first.groups.length).toBeGreaterThan(0);
  });

  it('isolates critical paths and focused ancestors/descendants', () => {
    const project = createSampleProject('2026-01-05T00:00:00.000Z');
    const result = calculateSchedule({ projectStartDate: project.metadata.startDate, defaultCalendarId: project.settings.defaultCalendarId, criticalFloatThresholdDays: 0, nearCriticalFloatThresholdDays: 5, calendars: project.calendars, activities: project.activities, relationships: project.relationships });
    const critical = layoutScheduleNetwork(project.activities, project.relationships, result.activities, project.wbs, { mode: 'critical' });
    expect(critical.nodes.every((node) => node.calculated?.isCritical)).toBe(true);
    const focus = layoutScheduleNetwork(project.activities, project.relationships, result.activities, project.wbs, { mode: 'focus', focusActivityId: 'A120' });
    expect(focus.nodes.some((node) => node.id === 'A120')).toBe(true);
    expect(focus.nodes.some((node) => node.id === 'START')).toBe(true);
    expect(focus.nodes.some((node) => node.id === 'FINISH')).toBe(true);
  });
});
