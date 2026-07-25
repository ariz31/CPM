import { describe, expect, it } from 'vitest';
import { createBlankProjectRecord } from '../domain/project/project';
import { executeProjectCommand } from './projectCommands';

// ACT-AT-001, ACT-AT-003, WBS-AT-001, LOG-AT-001, P6-AT-007, P9-AT-007
describe('project commands', () => {
  it('adds and updates an activity with a reversible project snapshot', () => {
    const project = createBlankProjectRecord('Commands');
    const added = executeProjectCommand(project, { type: 'ADD_ACTIVITY', activity: { id: 'A100', name: 'Excavate', duration: 4 } });
    expect(added.project.activities.some((item) => item.id === 'A100')).toBe(true);
    const updated = executeProjectCommand(added.project, { type: 'UPDATE_ACTIVITY', activityId: 'A100', changes: { duration: 6 } });
    expect(updated.project.activities.find((item) => item.id === 'A100')?.duration).toBe(6);
    const undone = executeProjectCommand(updated.project, updated.inverse);
    expect(undone.project.activities.find((item) => item.id === 'A100')?.duration).toBe(4);
  });


  it('adds multiple dictionary activities as one atomic revision', () => {
    const project = createBlankProjectRecord('Bulk activities');
    const result = executeProjectCommand(project, {
      type: 'ADD_ACTIVITIES',
      activities: [
        { id: 'A100', name: 'Manual excavation', duration: 8, customFields: { productivityExecutionMode: 'manual' } },
        { id: 'A110', name: 'Mechanical excavation', duration: 2, customFields: { productivityExecutionMode: 'equipment' } }
      ]
    });

    expect(result.project.revision).toBe(project.revision + 1);
    expect(result.project.activities.filter((item) => item.id === 'A100' || item.id === 'A110')).toHaveLength(2);
    expect(result.summary).toMatch(/Added 2 activities/i);

    const undone = executeProjectCommand(result.project, result.inverse);
    expect(undone.project.activities.some((item) => item.id === 'A100' || item.id === 'A110')).toBe(false);
  });

  it('rejects duplicate IDs before mutating the project', () => {
    const project = createBlankProjectRecord('Duplicate IDs');
    const before = structuredClone(project);
    expect(() => executeProjectCommand(project, { type: 'ADD_ACTIVITY', activity: { id: 'START', name: 'Duplicate' } })).toThrow(/already exists/i);
    expect(project).toEqual(before);
  });

  it('keeps activity IDs stable after creation', () => {
    const project = executeProjectCommand(createBlankProjectRecord('Stable IDs'), { type: 'ADD_ACTIVITY', activity: { id: 'A100', name: 'Excavate' } }).project;
    expect(() => executeProjectCommand(project, { type: 'UPDATE_ACTIVITY', activityId: 'A100', changes: { id: 'A200' } })).toThrow(/stable.*cannot be changed/i);
    expect(project.activities.some((item) => item.id === 'A100')).toBe(true);
  });

  it('removes every live cross-module reference when an activity is deleted while retaining cost history', () => {
    let project = executeProjectCommand(createBlankProjectRecord('Cross-module cleanup'), { type: 'ADD_ACTIVITY', activity: { id: 'A100', name: 'Excavate' } }).project;
    project = {
      ...project,
      progress: {
        A100: { activityId: 'A100', method: 'duration', remainingDuration: 1, percentComplete: 0, suspendedPeriods: [], outOfSequenceMode: 'retained-logic', updatedAt: project.updatedAt }
      },
      boq: {
        ...project.boq,
        items: [{ id: 'I1', sectionId: project.boq.sections[0].id, code: '1.1', description: 'Excavation', unit: 'm3', quantity: 10, resources: [], allocations: [{ activityId: 'A100', percent: 100 }] }]
      },
      controls: {
        ...project.controls,
        activityLoadings: [{ activityId: 'A100', budgetCost: 1000, phasing: 'uniform' }],
        actualCosts: [{ id: 'AC1', activityId: 'A100', date: project.statusDate, amount: 100, description: 'Cost', source: 'manual' }]
      },
      riskResources: {
        ...project.riskResources,
        pertEstimates: [{ activityId: 'A100', optimistic: 1, mostLikely: 2, pessimistic: 3 }],
        risks: [{ id: 'R1', title: 'Risk', probabilityPercent: 10, impactDays: 1, impactCost: 1, owner: '', status: 'open', linkedActivityIds: ['A100'], response: '' }],
        productivityPlans: [{ id: 'P1', activityId: 'A100', description: 'Plan', quantity: 10, unit: 'm3', plannedRatePerDay: 2 }],
        fieldRecords: [{ id: 'F1', activityId: 'A100', date: project.statusDate, completedQuantity: 1, unit: 'm3', laborHours: 1, equipmentHours: 1, notes: '', evidenceBytes: 0 }],
        resources: [{ id: 'RES1', name: 'Crew', kind: 'labor', unit: 'crew', availabilityPerDay: 1, costRate: 1 }],
        assignments: [{ id: 'AS1', resourceId: 'RES1', activityId: 'A100', unitsPerDay: 1 }]
      }
    };
    const deleted = executeProjectCommand(project, { type: 'DELETE_ACTIVITY', activityId: 'A100' }).project;
    expect(deleted.progress.A100).toBeUndefined();
    expect(deleted.boq.items[0].allocations).toEqual([]);
    expect(deleted.controls.activityLoadings).toEqual([]);
    expect(deleted.controls.actualCosts[0].activityId).toBeUndefined();
    expect(deleted.controls.actualCosts[0].amount).toBe(100);
    expect(deleted.riskResources.pertEstimates).toEqual([]);
    expect(deleted.riskResources.risks[0].linkedActivityIds).toEqual([]);
    expect(deleted.riskResources.productivityPlans).toEqual([]);
    expect(deleted.riskResources.fieldRecords).toEqual([]);
    expect(deleted.riskResources.assignments).toEqual([]);
  });

  it('adds WBS and relationship records atomically', () => {
    const project = createBlankProjectRecord('WBS');
    const wbs = { id: 'WBS-2', code: '1.1', name: 'Substructure', parentId: project.wbs[0].id, sortOrder: 1 };
    const withWbs = executeProjectCommand(project, { type: 'ADD_WBS', node: wbs }).project;
    const withActivity = executeProjectCommand(withWbs, { type: 'ADD_ACTIVITY', activity: { id: 'A100', name: 'Excavate', wbsId: wbs.id, duration: 2 } }).project;
    const withLogic = executeProjectCommand(withActivity, { type: 'ADD_RELATIONSHIP', relationship: { id: 'R100', predecessorId: 'START', successorId: 'A100', type: 'FS', lag: 0 } }).project;
    expect(withLogic.wbs).toContainEqual(wbs);
    expect(withLogic.relationships.some((item) => item.id === 'R100')).toBe(true);
  });
});
