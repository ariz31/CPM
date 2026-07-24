import { describe, expect, it } from 'vitest';
import type { WbsNode } from '../project/types';
import type { Activity } from '../schedule/types';
import { buildWbsTreeRows, indentWbsNode, moveWbsNode, normalizeWbsSortOrders, outdentWbsNode } from './wbsTree';

const nodes: WbsNode[] = [
  { id: 'root', code: '1', name: 'Project', sortOrder: 0 },
  { id: 'substructure', code: '1.1', name: 'Substructure', parentId: 'root', sortOrder: 0 },
  { id: 'superstructure', code: '1.2', name: 'Superstructure', parentId: 'root', sortOrder: 1 }
];
const activity = (id: string, wbsId: string, duration: number): Activity => ({ id, name: id, duration, type: 'task', wbsId, calendarId: 'calendar-1' });

describe('WBS tree model', () => {
  it('builds hierarchy rows with descendant activity, duration, and budget rollups', () => {
    const rows = buildWbsTreeRows({ nodes, activities: [activity('A-1', 'substructure', 4), activity('A-2', 'superstructure', 6)], calculatedActivities: [], budgetByActivityId: new Map([['A-1', 1000], ['A-2', 2500]]) });
    expect(rows.map((row) => [row.id, row.depth])).toEqual([['root', 0], ['substructure', 1], ['superstructure', 1]]);
    expect(rows[0]).toMatchObject({ activityCount: 2, durationRollup: 10, budgetRollup: 3500 });
  });
  it('moves siblings without changing their parents', () => {
    const moved = moveWbsNode(nodes, 'superstructure', -1);
    expect(moved.find((node) => node.id === 'superstructure')?.sortOrder).toBe(0);
    expect(moved.find((node) => node.id === 'substructure')?.sortOrder).toBe(1);
  });
  it('supports non-drag indent and outdent operations', () => {
    const indented = indentWbsNode(nodes, 'superstructure');
    expect(indented.find((node) => node.id === 'superstructure')?.parentId).toBe('substructure');
    expect(outdentWbsNode(indented, 'superstructure').find((node) => node.id === 'superstructure')?.parentId).toBe('root');
  });
  it('normalizes fractional and duplicate sibling sort orders', () => {
    const normalized = normalizeWbsSortOrders(nodes.map((node) => ({ ...node, sortOrder: 0.5 })));
    expect(normalized.filter((node) => node.parentId === 'root').map((node) => node.sortOrder)).toEqual([0, 1]);
  });
});
