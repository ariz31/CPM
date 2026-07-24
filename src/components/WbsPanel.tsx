import { useMemo, useState } from 'react';
import type { ProjectRecord, WbsNode } from '../domain/project/types';
import type { CalculatedActivity } from '../domain/schedule/types';
import {
  buildWbsTreeRows,
  indentWbsNode,
  moveWbsNode,
  normalizeWbsSortOrders,
  outdentWbsNode,
  updateWbsNode
} from '../domain/ui/wbsTree';

interface WbsPanelProps {
  project: ProjectRecord;
  calculatedActivities: CalculatedActivity[];
  onReplace: (project: ProjectRecord) => void;
}

export function WbsPanel({ project, calculatedActivities, onReplace }: WbsPanelProps) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState(project.wbs[0]?.id ?? '');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState(project.wbs[0]?.id ?? '');
  const selected = project.wbs.find((node) => node.id === selectedId);
  const budgetByActivityId = useMemo(() => new Map(project.controls.activityLoadings.map((loading) => [loading.activityId, loading.budgetCost ?? 0])), [project.controls.activityLoadings]);
  const rows = useMemo(() => buildWbsTreeRows({
    nodes: project.wbs,
    activities: project.activities,
    calculatedActivities,
    budgetByActivityId,
    collapsedIds
  }), [budgetByActivityId, calculatedActivities, collapsedIds, project.activities, project.wbs]);

  function replaceNodes(nodes: WbsNode[]): void {
    onReplace({ ...project, wbs: normalizeWbsSortOrders(nodes) });
  }

  function addNode(): void {
    if (!code.trim() || !name.trim()) return;
    const node: WbsNode = {
      id: crypto.randomUUID(),
      code: code.trim(),
      name: name.trim(),
      parentId: parentId || undefined,
      sortOrder: project.wbs.filter((item) => item.parentId === (parentId || undefined)).length
    };
    replaceNodes([...project.wbs, node]);
    setSelectedId(node.id);
    setCode('');
    setName('');
  }

  function deleteSelected(): void {
    if (!selected || project.wbs.length === 1) return;
    const replacementId = selected.parentId ?? project.wbs.find((node) => node.id !== selected.id)?.id;
    if (!replacementId) return;
    const childIds = new Set(project.wbs.filter((node) => node.parentId === selected.id).map((node) => node.id));
    onReplace({
      ...project,
      wbs: normalizeWbsSortOrders(project.wbs.filter((node) => node.id !== selected.id).map((node) => childIds.has(node.id) ? { ...node, parentId: replacementId } : node)),
      activities: project.activities.map((activity) => activity.wbsId === selected.id ? { ...activity, wbsId: replacementId } : activity)
    });
    setSelectedId(replacementId);
  }

  return (
    <section className="surface wbs-workspace" aria-labelledby="wbs-panel-title">
      <div className="surface-heading phase-toolbar">
        <div><p className="eyebrow">Phase G · hierarchical scope planning</p><h2 id="wbs-panel-title">Work breakdown structure</h2><p>Tree hierarchy with rollups, keyboard-safe non-drag reordering, and inspector editing.</p></div>
        <div className="toolbar-group wrap"><button className="button button-small" type="button" disabled={!selected} onClick={() => selected && replaceNodes(moveWbsNode(project.wbs, selected.id, -1))}>Move up</button><button className="button button-small" type="button" disabled={!selected} onClick={() => selected && replaceNodes(moveWbsNode(project.wbs, selected.id, 1))}>Move down</button><button className="button button-small" type="button" disabled={!selected} onClick={() => selected && replaceNodes(indentWbsNode(project.wbs, selected.id))}>Indent</button><button className="button button-small" type="button" disabled={!selected?.parentId} onClick={() => selected && replaceNodes(outdentWbsNode(project.wbs, selected.id))}>Outdent</button></div>
      </div>

      <div className="wbs-layout">
        <div className="wbs-tree-scroll">
          <div role="treegrid" aria-label="Work breakdown structure hierarchy">
            <div className="wbs-tree-grid wbs-tree-header" role="row">
              <span role="columnheader">Scope</span>
              <span role="columnheader">Activities</span>
              <span role="columnheader">Duration</span>
              <span role="columnheader">Budget</span>
              <span role="columnheader">Actions</span>
            </div>
            {rows.map((row) => <div className={`wbs-tree-grid wbs-tree-row ${selectedId === row.id ? 'selected' : ''}`} role="row" aria-level={row.depth + 1} aria-expanded={row.hasChildren ? !collapsedIds.has(row.id) : undefined} key={row.id}>
              <button className="wbs-tree-name" role="gridcell" type="button" onClick={() => setSelectedId(row.id)} style={{ '--wbs-depth': row.depth } as React.CSSProperties}>
                {row.hasChildren ? <span className="wbs-disclosure" onClick={(event) => { event.stopPropagation(); setCollapsedIds((current) => { const next = new Set(current); if (next.has(row.id)) next.delete(row.id); else next.add(row.id); return next; }); }} aria-hidden="true">{collapsedIds.has(row.id) ? '▸' : '▾'}</span> : <span className="wbs-disclosure" aria-hidden="true">·</span>}
                <span><strong>{row.code}</strong><small>{row.name}</small></span>
              </button>
              <span role="gridcell"><strong>{row.activityCount}</strong><small>{row.directActivityCount} direct</small></span>
              <span role="gridcell"><strong>{row.durationRollup.toLocaleString('en-US')}d</strong><small>rollup</small></span>
              <span role="gridcell"><strong>{formatCurrency(row.budgetRollup, project.metadata.currency)}</strong><small>loaded</small></span>
              <span role="gridcell"><button className="icon-button" type="button" onClick={() => setSelectedId(row.id)} aria-label={`Edit WBS ${row.code}`}>✎</button></span>
            </div>)}
          </div>
        </div>

        <aside className="wbs-inspector surface-inset" aria-label="WBS inspector">
          {selected ? <>
            <div><p className="eyebrow">Selected scope</p><h3>{selected.code}</h3></div>
            <label>Code<input value={selected.code} onChange={(event) => replaceNodes(updateWbsNode(project.wbs, selected.id, { code: event.target.value }))} /></label>
            <label>Name<input value={selected.name} onChange={(event) => replaceNodes(updateWbsNode(project.wbs, selected.id, { name: event.target.value }))} /></label>
            <label>Parent<select value={selected.parentId ?? ''} onChange={(event) => replaceNodes(project.wbs.map((node) => node.id === selected.id ? { ...node, parentId: event.target.value || undefined } : node))}><option value="">Root level</option>{project.wbs.filter((node) => node.id !== selected.id).map((node) => <option key={node.id} value={node.id}>{node.code} — {node.name}</option>)}</select></label>
            <button className="button button-danger" type="button" disabled={project.wbs.length === 1} onClick={deleteSelected}>Delete and reassign</button>
          </> : <div className="empty-state compact">Select a WBS node to edit.</div>}
        </aside>
      </div>

      <form className="wbs-add-form" onSubmit={(event) => { event.preventDefault(); addNode(); }}>
        <div><p className="eyebrow">Add scope item</p><strong>New WBS node</strong></div>
        <label>Code<input value={code} onChange={(event) => setCode(event.target.value)} placeholder="1.3" /></label>
        <label>Name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Finishes" /></label>
        <label>Parent<select value={parentId} onChange={(event) => setParentId(event.target.value)}><option value="">Root level</option>{project.wbs.map((node) => <option key={node.id} value={node.id}>{node.code} — {node.name}</option>)}</select></label>
        <button className="button button-primary" type="submit">Add WBS</button>
      </form>
    </section>
  );
}

function formatCurrency(value: number, currency: string): string {
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value); }
  catch { return `${currency} ${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`; }
}
