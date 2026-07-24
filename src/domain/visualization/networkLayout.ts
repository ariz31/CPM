import type { WbsNode } from '../project/types';
import type { Activity, CalculatedActivity, Relationship } from '../schedule/types';

export interface NetworkNodeLayout {
  id: string;
  activity: Activity;
  calculated?: CalculatedActivity;
  layer: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NetworkEdgeLayout {
  id: string;
  predecessorId: string;
  successorId: string;
  type: Relationship['type'];
  lag: number;
  critical: boolean;
  path: string;
}

export interface NetworkGroupLayout {
  wbsId: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NetworkLayoutResult {
  nodes: NetworkNodeLayout[];
  edges: NetworkEdgeLayout[];
  groups: NetworkGroupLayout[];
  width: number;
  height: number;
}

export interface NetworkLayoutOptions {
  mode?: 'all' | 'critical' | 'focus';
  focusActivityId?: string;
  groupByWbs?: boolean;
}

const NODE_WIDTH = 190;
const NODE_HEIGHT = 70;
const LAYER_GAP = 70;
const ROW_GAP = 30;
const PADDING = 30;

export function layoutScheduleNetwork(
  activities: Activity[],
  relationships: Relationship[],
  calculatedActivities: CalculatedActivity[],
  wbs: WbsNode[],
  options: NetworkLayoutOptions = {}
): NetworkLayoutResult {
  const calculatedById = new Map(calculatedActivities.map((activity) => [activity.id, activity]));
  const visibleIds = selectVisibleIds(activities, relationships, calculatedById, options);
  const visibleActivities = activities.filter((activity) => visibleIds.has(activity.id));
  const visibleRelationships = relationships.filter((relationship) => visibleIds.has(relationship.predecessorId) && visibleIds.has(relationship.successorId));
  const layers = longestPathLayers(visibleActivities, visibleRelationships);
  const byLayer = new Map<number, Activity[]>();
  for (const activity of visibleActivities) {
    const layer = layers.get(activity.id) ?? 0;
    const list = byLayer.get(layer) ?? [];
    list.push(activity);
    byLayer.set(layer, list);
  }
  const wbsOrder = new Map(wbs.map((node, index) => [node.id, `${String(node.sortOrder).padStart(8, '0')}:${node.code}:${index}`]));
  const nodes: NetworkNodeLayout[] = [];
  for (const [layer, list] of [...byLayer.entries()].sort(([left], [right]) => left - right)) {
    list.sort((left, right) => (wbsOrder.get(left.wbsId) ?? '').localeCompare(wbsOrder.get(right.wbsId) ?? '') || left.id.localeCompare(right.id));
    list.forEach((activity, row) => nodes.push({
      id: activity.id,
      activity,
      calculated: calculatedById.get(activity.id),
      layer,
      x: PADDING + layer * (NODE_WIDTH + LAYER_GAP),
      y: PADDING + row * (NODE_HEIGHT + ROW_GAP),
      width: NODE_WIDTH,
      height: NODE_HEIGHT
    }));
  }
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const edges: NetworkEdgeLayout[] = visibleRelationships.map((relationship) => {
    const from = nodeById.get(relationship.predecessorId)!;
    const to = nodeById.get(relationship.successorId)!;
    const startX = from.x + from.width;
    const startY = from.y + from.height / 2;
    const endX = to.x;
    const endY = to.y + to.height / 2;
    const bend = startX + Math.max(24, (endX - startX) / 2);
    const successor = calculatedById.get(relationship.successorId);
    return {
      id: relationship.id,
      predecessorId: relationship.predecessorId,
      successorId: relationship.successorId,
      type: relationship.type,
      lag: relationship.lag,
      critical: Boolean(successor?.isCritical && successor.drivingRelationshipIds.includes(relationship.id)),
      path: `M ${startX} ${startY} H ${bend} V ${endY} H ${endX}`
    };
  });
  const groups = options.groupByWbs === false ? [] : createGroups(nodes, wbs);
  const width = Math.max(720, ...nodes.map((node) => node.x + node.width + PADDING));
  const height = Math.max(360, ...nodes.map((node) => node.y + node.height + PADDING));
  return { nodes, edges, groups, width, height };
}

function selectVisibleIds(
  activities: Activity[],
  relationships: Relationship[],
  calculatedById: Map<string, CalculatedActivity>,
  options: NetworkLayoutOptions
): Set<string> {
  if (options.mode === 'critical') return new Set(activities.filter((activity) => calculatedById.get(activity.id)?.isCritical).map((activity) => activity.id));
  if (options.mode !== 'focus' || !options.focusActivityId) return new Set(activities.map((activity) => activity.id));
  const incoming = new Map<string, string[]>();
  const outgoing = new Map<string, string[]>();
  for (const relationship of relationships) {
    incoming.set(relationship.successorId, [...(incoming.get(relationship.successorId) ?? []), relationship.predecessorId]);
    outgoing.set(relationship.predecessorId, [...(outgoing.get(relationship.predecessorId) ?? []), relationship.successorId]);
  }
  const visible = new Set<string>([options.focusActivityId]);
  walk(options.focusActivityId, incoming, visible);
  walk(options.focusActivityId, outgoing, visible);
  return visible;
}

function walk(start: string, adjacency: Map<string, string[]>, result: Set<string>): void {
  const queue = [start];
  while (queue.length > 0) {
    const id = queue.shift()!;
    for (const next of adjacency.get(id) ?? []) {
      if (result.has(next)) continue;
      result.add(next);
      queue.push(next);
    }
  }
}

function longestPathLayers(activities: Activity[], relationships: Relationship[]): Map<string, number> {
  const indegree = new Map(activities.map((activity) => [activity.id, 0]));
  const outgoing = new Map<string, Relationship[]>();
  for (const relationship of relationships) {
    indegree.set(relationship.successorId, (indegree.get(relationship.successorId) ?? 0) + 1);
    outgoing.set(relationship.predecessorId, [...(outgoing.get(relationship.predecessorId) ?? []), relationship]);
  }
  const queue = activities.filter((activity) => indegree.get(activity.id) === 0).map((activity) => activity.id).sort();
  const layers = new Map(activities.map((activity) => [activity.id, 0]));
  let visited = 0;
  while (queue.length > 0) {
    const id = queue.shift()!;
    visited += 1;
    for (const relationship of outgoing.get(id) ?? []) {
      layers.set(relationship.successorId, Math.max(layers.get(relationship.successorId) ?? 0, (layers.get(id) ?? 0) + 1));
      const next = (indegree.get(relationship.successorId) ?? 0) - 1;
      indegree.set(relationship.successorId, next);
      if (next === 0) {
        queue.push(relationship.successorId);
        queue.sort();
      }
    }
  }
  if (visited !== activities.length) throw new Error('Network layout requires an acyclic schedule.');
  return layers;
}

function createGroups(nodes: NetworkNodeLayout[], wbs: WbsNode[]): NetworkGroupLayout[] {
  const wbsById = new Map(wbs.map((node) => [node.id, node]));
  const grouped = new Map<string, NetworkNodeLayout[]>();
  for (const node of nodes) grouped.set(node.activity.wbsId, [...(grouped.get(node.activity.wbsId) ?? []), node]);
  return [...grouped.entries()].map(([wbsId, groupNodes]) => {
    const minX = Math.min(...groupNodes.map((node) => node.x)) - 12;
    const minY = Math.min(...groupNodes.map((node) => node.y)) - 22;
    const maxX = Math.max(...groupNodes.map((node) => node.x + node.width)) + 12;
    const maxY = Math.max(...groupNodes.map((node) => node.y + node.height)) + 12;
    return { wbsId, label: wbsById.get(wbsId)?.name ?? wbsId, x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }).sort((left, right) => left.label.localeCompare(right.label));
}
