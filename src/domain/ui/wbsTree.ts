import type { Activity, CalculatedActivity } from '../schedule/types';
import type { WbsNode } from '../project/types';

export interface WbsTreeRow extends WbsNode {
  depth: number;
  hasChildren: boolean;
  activityCount: number;
  directActivityCount: number;
  durationRollup: number;
  budgetRollup: number;
}

export interface WbsRollupInput {
  nodes: WbsNode[];
  activities: Activity[];
  calculatedActivities: CalculatedActivity[];
  budgetByActivityId?: Map<string, number>;
  collapsedIds?: Set<string>;
}

export function buildWbsTreeRows({ nodes, activities, calculatedActivities, budgetByActivityId = new Map(), collapsedIds = new Set() }: WbsRollupInput): WbsTreeRow[] {
  const children = groupChildren(nodes);
  const calculatedById = new Map(calculatedActivities.map((activity) => [activity.id, activity]));
  const directActivities = new Map<string, Activity[]>();
  for (const activity of activities) {
    const bucket = directActivities.get(activity.wbsId) ?? [];
    bucket.push(activity);
    directActivities.set(activity.wbsId, bucket);
  }
  const rows: WbsTreeRow[] = [];
  const visited = new Set<string>();
  const rollupCache = new Map<string, { activityCount: number; durationRollup: number; budgetRollup: number }>();

  function rollup(node: WbsNode): { activityCount: number; durationRollup: number; budgetRollup: number } {
    const cached = rollupCache.get(node.id);
    if (cached) return cached;
    const own = directActivities.get(node.id) ?? [];
    const result = (children.get(node.id) ?? []).reduce((accumulator, child) => {
      const childRollup = rollup(child);
      return {
        activityCount: accumulator.activityCount + childRollup.activityCount,
        durationRollup: accumulator.durationRollup + childRollup.durationRollup,
        budgetRollup: accumulator.budgetRollup + childRollup.budgetRollup
      };
    }, {
      activityCount: own.length,
      durationRollup: own.reduce((sum, activity) => sum + (calculatedById.get(activity.id)?.duration ?? activity.duration), 0),
      budgetRollup: own.reduce((sum, activity) => sum + (budgetByActivityId.get(activity.id) ?? 0), 0)
    });
    rollupCache.set(node.id, result);
    return result;
  }

  function walk(node: WbsNode, depth: number): void {
    if (visited.has(node.id)) return;
    visited.add(node.id);
    const own = directActivities.get(node.id) ?? [];
    const childNodes = children.get(node.id) ?? [];
    const aggregate = rollup(node);
    rows.push({ ...node, depth, hasChildren: childNodes.length > 0, activityCount: aggregate.activityCount, directActivityCount: own.length, durationRollup: round(aggregate.durationRollup), budgetRollup: round(aggregate.budgetRollup) });
    if (!collapsedIds.has(node.id)) for (const child of childNodes) walk(child, depth + 1);
  }

  const roots = nodes.filter((node) => !node.parentId || !nodes.some((candidate) => candidate.id === node.parentId)).sort(compareWbs);
  for (const root of roots) walk(root, 0);
  for (const node of [...nodes].sort(compareWbs)) if (!visited.has(node.id)) walk(node, 0);
  return rows;
}

export function moveWbsNode(nodes: WbsNode[], nodeId: string, direction: -1 | 1): WbsNode[] {
  const node = nodes.find((item) => item.id === nodeId);
  if (!node) return nodes;
  const siblings = nodes.filter((item) => item.parentId === node.parentId).sort(compareWbs);
  const target = siblings[siblings.findIndex((item) => item.id === nodeId) + direction];
  if (!target) return nodes;
  return nodes.map((item) => item.id === node.id ? { ...item, sortOrder: target.sortOrder } : item.id === target.id ? { ...item, sortOrder: node.sortOrder } : item);
}

export function indentWbsNode(nodes: WbsNode[], nodeId: string): WbsNode[] {
  const node = nodes.find((item) => item.id === nodeId);
  if (!node) return nodes;
  const siblings = nodes.filter((item) => item.parentId === node.parentId).sort(compareWbs);
  const previous = siblings[siblings.findIndex((item) => item.id === nodeId) - 1];
  if (!previous || isDescendant(nodes, previous.id, node.id)) return nodes;
  const childCount = nodes.filter((item) => item.parentId === previous.id).length;
  return nodes.map((item) => item.id === nodeId ? { ...item, parentId: previous.id, sortOrder: childCount } : item);
}

export function outdentWbsNode(nodes: WbsNode[], nodeId: string): WbsNode[] {
  const node = nodes.find((item) => item.id === nodeId);
  if (!node?.parentId) return nodes;
  const parent = nodes.find((item) => item.id === node.parentId);
  if (!parent) return nodes;
  return nodes.map((item) => item.id === nodeId ? { ...item, parentId: parent.parentId, sortOrder: parent.sortOrder + 0.5 } : item);
}

export function updateWbsNode(nodes: WbsNode[], nodeId: string, changes: Partial<Pick<WbsNode, 'code' | 'name'>>): WbsNode[] {
  return nodes.map((node) => node.id === nodeId ? { ...node, ...changes, id: node.id } : node);
}

export function normalizeWbsSortOrders(nodes: WbsNode[]): WbsNode[] {
  const parentKeys = new Set<string | undefined>([undefined, ...nodes.map((node) => node.parentId)]);
  const normalized = new Map<string, WbsNode>();
  for (const parentId of parentKeys) {
    const siblings = nodes.filter((node) => node.parentId === parentId).sort(compareWbs);
    siblings.forEach((node, index) => normalized.set(node.id, { ...node, sortOrder: index }));
  }
  return nodes.map((node) => normalized.get(node.id) ?? node);
}

function groupChildren(nodes: WbsNode[]): Map<string, WbsNode[]> {
  const grouped = new Map<string, WbsNode[]>();
  for (const node of nodes) {
    if (!node.parentId) continue;
    const bucket = grouped.get(node.parentId) ?? [];
    bucket.push(node);
    grouped.set(node.parentId, bucket);
  }
  for (const bucket of grouped.values()) bucket.sort(compareWbs);
  return grouped;
}

function compareWbs(left: WbsNode, right: WbsNode): number { return left.sortOrder - right.sortOrder || left.code.localeCompare(right.code, undefined, { numeric: true }); }
function round(value: number): number { return Math.round((value + Number.EPSILON) * 100) / 100; }
function isDescendant(nodes: WbsNode[], candidateId: string, ancestorId: string): boolean {
  let current = nodes.find((node) => node.id === candidateId);
  const visited = new Set<string>();
  while (current?.parentId && !visited.has(current.id)) {
    if (current.parentId === ancestorId) return true;
    visited.add(current.id);
    current = nodes.find((node) => node.id === current?.parentId);
  }
  return false;
}
