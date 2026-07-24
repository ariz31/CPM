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

export function buildWbsTreeRows({
  nodes,
  activities,
  calculatedActivities,
  budgetByActivityId = new Map(),
  collapsedIds = new Set()
}: WbsRollupInput): WbsTreeRow[] {
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

  function walk(node: WbsNode, depth: number): { activityCount: number; durationRollup: number; budgetRollup: number } {
    if (visited.has(node.id)) return { activityCount: 0, durationRollup: 0, budgetRollup: 0 };
    visited.add(node.id);
    const ownActivities = directActivities.get(node.id) ?? [];
    const childNodes = children.get(node.id) ?? [];
    let activityCount = ownActivities.length;
    let durationRollup = ownActivities.reduce((sum, activity) => sum + (calculatedById.get(activity.id)?.duration ?? activity.duration), 0);
    let budgetRollup = ownActivities.reduce((sum, activity) => sum + (budgetByActivityId.get(activity.id) ?? 0), 0);
    const childRollups = childNodes.map((child) => walkRollup(child));
    for (const child of childRollups) {
      activityCount += child.activityCount;
      durationRollup += child.durationRollup;
      budgetRollup += child.budgetRollup;
    }
    rows.push({
      ...node,
      depth,
      hasChildren: childNodes.length > 0,
      activityCount,
      directActivityCount: ownActivities.length,
      durationRollup: round(durationRollup),
      budgetRollup: roundMoney(budgetRollup)
    });
    if (!collapsedIds.has(node.id)) for (const child of childNodes) walk(child, depth + 1);
    return { activityCount, durationRollup, budgetRollup };
  }

  const rollupCache = new Map<string, { activityCount: number; durationRollup: number; budgetRollup: number }>();
  function walkRollup(node: WbsNode): { activityCount: number; durationRollup: number; budgetRollup: number } {
    const cached = rollupCache.get(node.id);
    if (cached) return cached;
    const ownActivities = directActivities.get(node.id) ?? [];
    const childNodes = children.get(node.id) ?? [];
    const result = childNodes.reduce((accumulator, child) => {
      const childRollup = walkRollup(child);
      return {
        activityCount: accumulator.activityCount + childRollup.activityCount,
        durationRollup: accumulator.durationRollup + childRollup.durationRollup,
        budgetRollup: accumulator.budgetRollup + childRollup.budgetRollup
      };
    }, {
      activityCount: ownActivities.length,
      durationRollup: ownActivities.reduce((sum, activity) => sum + (calculatedById.get(activity.id)?.duration ?? activity.duration), 0),
      budgetRollup: ownActivities.reduce((sum, activity) => sum + (budgetByActivityId.get(activity.id) ?? 0), 0)
    });
    rollupCache.set(node.id, result);
    return result;
  }

  const roots = nodes.filter((node) => !node.parentId || !nodes.some((candidate) => candidate.id === node.parentId)).sort(compareWbs);
  for (const root of roots) walk(root, 0);
  for (const node of nodes.sort(compareWbs)) if (!visited.has(node.id)) walk(node, 0);
  return rows;
}

export function moveWbsNode(nodes: WbsNode[], nodeId: string, direction: -1 | 1): WbsNode[] {
  const node = nodes.find((item) => item.id === nodeId);
  if (!node) return nodes;
  const siblings = nodes.filter((item) => item.parentId === node.parentId).sort(compareWbs);
  const index = siblings.findIndex((item) => item.id === nodeId);
  const target = siblings[index + direction];
  if (!target) return nodes;
  const nodeOrder = node.sortOrder;
  const targetOrder = target.sortOrder;
  return nodes.map((item) => item.id === node.id ? { ...item, sortOrder: targetOrder } : item.id === target.id ? { ...item, sortOrder: nodeOrder } : item);
}

export function indentWbsNode(nodes: WbsNode[], nodeId: string): WbsNode[] {
  const node = nodes.find((item) => item.id === nodeId);
  if (!node) return nodes;
  const siblings = nodes.filter((item) => item.parentId === node.parentId).sort(compareWbs);
  const index = siblings.findIndex((item) => item.id === nodeId);
  const previous = siblings[index - 1];
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
  const grouped = groupChildren(nodes);
  const normalized = new Map<string, WbsNode>();
  const parentKeys = new Set<string | undefined>([undefined, ...nodes.map((node) => node.parentId)]);
  for (const parentId of parentKeys) {
    const siblings = (parentId ? grouped.get(parentId) ?? [] : nodes.filter((node) => !node.parentId)).sort(compareWbs);
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

function compareWbs(left: WbsNode, right: WbsNode): number {
  return left.sortOrder - right.sortOrder || left.code.localeCompare(right.code, undefined, { numeric: true });
}

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

function round(value: number): number { return Math.round((value + Number.EPSILON) * 100) / 100; }
function roundMoney(value: number): number { return Math.round((value + Number.EPSILON) * 100) / 100; }
