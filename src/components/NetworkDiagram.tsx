import { useMemo, useState } from 'react';
import type { ProjectRecord } from '../domain/project/types';
import type { ScheduleResult } from '../domain/schedule/types';
import { layoutScheduleNetwork, type NetworkLayoutOptions } from '../domain/visualization/networkLayout';
import { relationshipReferenceLabel, relationshipRuleLabel } from '../utils/activityReferences';

interface NetworkDiagramProps {
  project: ProjectRecord;
  result?: ScheduleResult;
  focusActivityId?: string;
  onFocus: (activityId: string) => void;
}

export function NetworkDiagram({ project, result, focusActivityId, onFocus }: NetworkDiagramProps) {
  const [mode, setMode] = useState<NonNullable<NetworkLayoutOptions['mode']>>('all');
  const [groupByWbs, setGroupByWbs] = useState(true);
  const layout = useMemo(() => result ? layoutScheduleNetwork(project.activities, project.relationships, result.activities, project.wbs, { mode, focusActivityId, groupByWbs }) : undefined, [focusActivityId, groupByWbs, mode, project.activities, project.relationships, project.wbs, result]);
  return (
    <section className="surface phase-surface" aria-labelledby="network-title">
      <div className="surface-heading phase-toolbar"><div><p className="eyebrow">Path-first logic visualization</p><h2 id="network-title">Network diagram</h2></div><div className="toolbar-group wrap"><label>View<select value={mode} onChange={(event) => setMode(event.target.value as typeof mode)}><option value="all">All activities</option><option value="critical">Critical path</option><option value="focus" disabled={!focusActivityId}>Focused ancestors and descendants</option></select></label><label><input type="checkbox" checked={groupByWbs} onChange={(event) => setGroupByWbs(event.target.checked)} /> WBS groups</label></div></div>
      {!layout ? <div className="empty-state">A valid schedule calculation is required.</div> : <div className="network-scroll" tabIndex={0}><svg width={layout.width} height={layout.height} role="img" aria-label="Schedule network diagram">{layout.groups.map((group) => <g key={group.wbsId}><rect x={group.x} y={group.y} width={group.width} height={group.height} rx={12} className="network-group" /><text x={group.x + 8} y={group.y + 16} className="network-group-label">{group.label}</text></g>)}{layout.edges.map((edge) => {
        const relationship = project.relationships.find((candidate) => candidate.id === edge.id);
        return <g key={edge.id}><title>{relationship ? relationshipReferenceLabel(relationship, project.activities) : relationshipRuleLabel(edge.type, edge.lag)}</title><path d={edge.path} className={edge.critical ? 'network-edge critical' : 'network-edge'} /><text className="network-edge-label"><textPath href={`#edge-${edge.id}`}>{edge.type}{edge.lag ? `${edge.lag > 0 ? '+' : ''}${edge.lag}d` : ''}</textPath></text><path id={`edge-${edge.id}`} d={edge.path} className="network-edge-text-path" /></g>;
      })}{layout.nodes.map((node) => <g key={node.id} className="network-node" onClick={() => onFocus(node.id)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter') onFocus(node.id); }} aria-label={`Focus ${node.activity.name} (${node.id})`}><rect x={node.x} y={node.y} width={node.width} height={node.height} rx={8} className={node.calculated?.isCritical ? 'network-node-box critical' : node.calculated?.isNearCritical ? 'network-node-box near-critical' : 'network-node-box'} /><text x={node.x + 10} y={node.y + 20} className="network-node-id">{node.id}</text><text x={node.x + 10} y={node.y + 38} className="network-node-name">{truncate(node.activity.name, 24)}</text><text x={node.x + 10} y={node.y + 57} className="network-node-meta">{node.calculated?.earlyStart.date ?? '—'} · TF {node.calculated?.totalFloat ?? '—'}</text></g>)}</svg></div>}
      <details className="accessible-fallback"><summary>Accessible network relationships</summary><ul className="accessible-relationship-list">{project.relationships.map((relationship) => <li key={relationship.id}>{relationshipReferenceLabel(relationship, project.activities)}</li>)}</ul></details>
    </section>
  );
}

function truncate(value: string, length: number): string { return value.length <= length ? value : `${value.slice(0, length - 1)}…`; }
