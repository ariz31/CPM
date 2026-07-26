import { describe, expect, it } from 'vitest';
import { createSampleProject } from '../../data/sampleProject';
import { calculateSchedule } from '../schedule/cpm';
import { calculateCostControl } from '../controls/costControl';
import { analyzeRiskResources } from '../riskResources/riskResources';
import { applyMobileProgressUpdate, buildMobileWorkflowSummary, upsertMobileRisk } from './mobileWorkflow';

describe('mobile workflow domain', () => {
  it('builds a compact decision summary from authoritative engines', () => {
    const project = createSampleProject();
    const schedule = calculateSchedule({
      projectStartDate: project.metadata.startDate,
      defaultCalendarId: project.settings.defaultCalendarId,
      criticalFloatThresholdDays: project.settings.criticalFloatThresholdDays,
      nearCriticalFloatThresholdDays: project.settings.nearCriticalFloatThresholdDays,
      calendars: project.calendars,
      activities: project.activities,
      relationships: project.relationships
    });
    const controls = calculateCostControl(project, schedule);
    const risk = analyzeRiskResources(project, schedule);
    const summary = buildMobileWorkflowSummary(project, schedule, controls, risk);
    expect(summary.criticalCount).toBeGreaterThan(0);
    expect(summary.bac).toBeGreaterThan(0);
    expect(summary.nextMilestones.length).toBeGreaterThan(0);
  });

  it('records progress without mutating the source project', () => {
    const project = createSampleProject();
    const target = project.activities.find((activity) => activity.type === 'task')!;
    const updated = applyMobileProgressUpdate(project, target.id, {
      percentComplete: 45,
      remainingDuration: 3,
      actualStart: project.statusDate,
      notes: 'Mobile field update'
    });
    expect(updated).not.toBe(project);
    expect(project.progress[target.id]).toBeUndefined();
    expect(updated.progress[target.id].percentComplete).toBe(45);
    expect(updated.progress[target.id].notes).toBe('Mobile field update');
  });

  it('creates and updates a risk with bounded values', () => {
    const project = createSampleProject();
    const created = upsertMobileRisk(project, {
      id: 'mobile-risk',
      title: '  Access restriction  ',
      probabilityPercent: 140,
      impactDays: -4,
      impactCost: 12000,
      owner: 'Site manager',
      status: 'open',
      linkedActivityIds: [project.activities[0].id, 'missing'],
      response: 'Coordinate deliveries'
    });
    const risk = created.riskResources.risks.find((item) => item.id === 'mobile-risk')!;
    expect(risk.title).toBe('Access restriction');
    expect(risk.probabilityPercent).toBe(100);
    expect(risk.impactDays).toBe(0);
    expect(risk.linkedActivityIds).toEqual([project.activities[0].id]);
  });
});
