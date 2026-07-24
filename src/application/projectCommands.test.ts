import { describe, expect, it } from 'vitest';
import { createBlankProjectRecord } from '../domain/project/project';
import { executeProjectCommand } from './projectCommands';

// ACT-AT-001, ACT-AT-003, WBS-AT-001, LOG-AT-001
describe('project commands', () => {
  it('adds and updates an activity with a reversible project snapshot', () => {
    const project = createBlankProjectRecord('Commands');
    const added = executeProjectCommand(project, {
      type: 'ADD_ACTIVITY',
      activity: { id: 'A100', name: 'Excavate', duration: 4 }
    });
    expect(added.project.activities.some((item) => item.id === 'A100')).toBe(true);
    const updated = executeProjectCommand(added.project, {
      type: 'UPDATE_ACTIVITY',
      activityId: 'A100',
      changes: { duration: 6 }
    });
    expect(updated.project.activities.find((item) => item.id === 'A100')?.duration).toBe(6);
    const undone = executeProjectCommand(updated.project, updated.inverse);
    expect(undone.project.activities.find((item) => item.id === 'A100')?.duration).toBe(4);
  });

  it('rejects duplicate IDs before mutating the project', () => {
    const project = createBlankProjectRecord('Duplicate IDs');
    const before = structuredClone(project);
    expect(() => executeProjectCommand(project, {
      type: 'ADD_ACTIVITY',
      activity: { id: 'START', name: 'Duplicate' }
    })).toThrow(/already exists/i);
    expect(project).toEqual(before);
  });

  it('adds WBS and relationship records atomically', () => {
    const project = createBlankProjectRecord('WBS');
    const wbs = { id: 'WBS-2', code: '1.1', name: 'Substructure', parentId: project.wbs[0].id, sortOrder: 1 };
    const withWbs = executeProjectCommand(project, { type: 'ADD_WBS', node: wbs }).project;
    const withActivity = executeProjectCommand(withWbs, {
      type: 'ADD_ACTIVITY',
      activity: { id: 'A100', name: 'Excavate', wbsId: wbs.id, duration: 2 }
    }).project;
    const withLogic = executeProjectCommand(withActivity, {
      type: 'ADD_RELATIONSHIP',
      relationship: { id: 'R100', predecessorId: 'START', successorId: 'A100', type: 'FS', lag: 0 }
    }).project;
    expect(withLogic.wbs).toContainEqual(wbs);
    expect(withLogic.relationships.some((item) => item.id === 'R100')).toBe(true);
  });
});
