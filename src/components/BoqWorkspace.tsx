import { useMemo, useState } from 'react';
import {
  calculateEstimate,
  compareBoqRevisions,
  createBoqRevision,
  exportBoqCsv
} from '../domain/estimating/estimating';
import type { BoqItem, MarkupRule, ResourceCategory } from '../domain/estimating/types';
import type { ProjectRecord } from '../domain/project/types';
import { normalizeEngineeringUnit } from '../domain/units/engineeringUnits';
import { downloadTextFile } from '../infrastructure/reportExport';
import { activityReferenceLabel } from '../utils/activityReferences';
import { NumericInput } from './NumericInput';

interface BoqWorkspaceProps {
  project: ProjectRecord;
  onReplace: (project: ProjectRecord) => void;
}

export function BoqWorkspace({ project, onReplace }: BoqWorkspaceProps) {
  const [selectedItemId, setSelectedItemId] = useState<string>();
  const summary = useMemo(() => calculateEstimate(project.boq), [project.boq]);
  const selectedItem = project.boq.items.find((item) => item.id === selectedItemId);
  const previousRevision = project.boq.revisions.at(-2);
  const latestRevision = project.boq.revisions.at(-1);
  const comparison = previousRevision && latestRevision ? compareBoqRevisions(previousRevision, latestRevision) : undefined;

  function replaceBoq(changes: Partial<ProjectRecord['boq']>): void {
    onReplace({ ...project, boq: { ...project.boq, ...changes } });
  }

  function addItem(): void {
    const section = project.boq.sections[0];
    const item: BoqItem = {
      id: crypto.randomUUID(),
      sectionId: section.id,
      code: `${section.code}.${project.boq.items.length + 1}`,
      description: 'New BOQ item',
      unit: 'item',
      quantity: 1,
      resources: [],
      allocations: []
    };
    replaceBoq({ items: [...project.boq.items, item] });
    setSelectedItemId(item.id);
  }

  function updateItem(itemId: string, changes: Partial<BoqItem>): void {
    replaceBoq({ items: project.boq.items.map((item) => item.id === itemId ? { ...item, ...changes } : item) });
  }

  function addMarkup(): void {
    const markup: MarkupRule = {
      id: crypto.randomUUID(),
      name: `Markup ${project.boq.markups.length + 1}`,
      ratePercent: 5,
      order: project.boq.markups.length + 1,
      basis: 'running-subtotal'
    };
    replaceBoq({ markups: [...project.boq.markups, markup] });
  }

  function captureRevision(): void {
    const name = window.prompt('Estimate revision name', `Estimate revision ${project.boq.revisions.length + 1}`);
    if (!name) return;
    replaceBoq({ revisions: [...project.boq.revisions, createBoqRevision(project.boq, name, project.revision)] });
  }

  return (
    <section className="surface phase-surface" aria-labelledby="boq-title">
      <div className="surface-heading phase-toolbar"><div><p className="eyebrow">Integrated quantities, resources, rates, and activity allocation</p><h2 id="boq-title">Bill of Quantities and estimating</h2></div><div className="toolbar-group wrap"><button className="button button-primary" type="button" onClick={addItem}>Add item</button><button className="button button-secondary" type="button" onClick={addMarkup}>Add markup</button><button className="button button-secondary" type="button" onClick={captureRevision}>Capture revision</button><button className="button button-small" type="button" onClick={() => downloadTextFile(exportBoqCsv(summary), `boq-r${project.revision}.csv`, 'text/csv;charset=utf-8')}>Export CSV</button></div></div>
      <div className="progress-metrics boq-metrics"><article><span>Direct cost</span><strong>{money(summary.directCost, project.metadata.currency)}</strong></article><article><span>Markups</span><strong>{money(summary.totalCost - summary.directCost, project.metadata.currency)}</strong></article><article><span>Estimate total</span><strong>{money(summary.totalCost, project.metadata.currency)}</strong></article><article className={summary.items.some((item) => item.allocationStatus !== 'balanced') ? 'warning-card' : ''}><span>Allocation findings</span><strong>{summary.items.filter((item) => item.allocationStatus !== 'balanced').length}</strong></article></div>
      <div className="boq-layout">
        <div className="report-table-scroll"><table className="report-table boq-table"><thead><tr><th>Code</th><th>Description</th><th>Unit</th><th>Quantity</th><th>Unit rate</th><th>Amount</th><th>Allocation</th><th /></tr></thead><tbody>{summary.items.map((calculated) => <tr key={calculated.id} className={selectedItemId === calculated.id ? 'selected-table-row' : ''}><td><input value={calculated.code} onChange={(event) => updateItem(calculated.id, { code: event.target.value })} /></td><td><input value={calculated.description} onChange={(event) => updateItem(calculated.id, { description: event.target.value })} /></td><td><input value={calculated.unit} onChange={(event) => updateItem(calculated.id, { unit: event.target.value })} onBlur={(event) => updateItem(calculated.id, { unit: normalizeEngineeringUnit(event.target.value) })} aria-label={`Unit for ${calculated.code}`} /></td><td><NumericInput value={calculated.quantity} min={0} step="any" calculatorLabel={`quantity for ${calculated.code}`} aria-label={`Quantity for ${calculated.code}`} onValueChange={(quantity) => { if (quantity !== undefined) updateItem(calculated.id, { quantity }); }} /></td><td>{calculated.resources.length === 0 ? <NumericInput value={calculated.manualUnitRate} min={0} step="any" calculatorLabel={`manual unit rate for ${calculated.code}`} aria-label={`Manual unit rate for ${calculated.code}`} onValueChange={(manualUnitRate) => updateItem(calculated.id, { manualUnitRate })} /> : money(calculated.unitRate, project.metadata.currency)}</td><td>{money(calculated.directAmount, project.metadata.currency)}</td><td><span className={`pill ${calculated.allocationStatus === 'balanced' ? '' : 'pill-warning'}`}>{calculated.allocationTotalPercent}% · {calculated.allocationStatus}</span></td><td><button className="button button-small" type="button" onClick={() => setSelectedItemId(calculated.id)}>Details</button></td></tr>)}</tbody></table></div>
        <aside className="boq-inspector" aria-label="BOQ item details">{selectedItem ? <BoqItemInspector project={project} item={selectedItem} onUpdate={(changes) => updateItem(selectedItem.id, changes)} /> : <div className="empty-state">Select a BOQ item to manage resources and schedule allocations.</div>}</aside>
      </div>
      <section className="markup-section"><div className="surface-heading"><div><p className="eyebrow">Explicit calculation order</p><h3>Markup waterfall</h3></div></div>{summary.markups.length === 0 ? <p className="muted">No markups configured.</p> : <div className="markup-grid">{summary.markups.map((markup) => <article key={markup.id}><input value={markup.name} onChange={(event) => replaceBoq({ markups: project.boq.markups.map((item) => item.id === markup.id ? { ...item, name: event.target.value } : item) })} /><label>Rate %<NumericInput value={markup.ratePercent} step="any" calculatorLabel={`${markup.name} percentage`} onValueChange={(ratePercent) => { if (ratePercent !== undefined) replaceBoq({ markups: project.boq.markups.map((item) => item.id === markup.id ? { ...item, ratePercent } : item) }); }} /></label><label>Basis<select value={markup.basis} onChange={(event) => replaceBoq({ markups: project.boq.markups.map((item) => item.id === markup.id ? { ...item, basis: event.target.value as MarkupRule['basis'] } : item) })}><option value="direct-cost">Direct cost</option><option value="running-subtotal">Running subtotal</option></select></label><strong>{money(markup.amount, project.metadata.currency)}</strong></article>)}</div>}</section>
      {comparison ? <div className="revision-comparison" role="status"><strong>Latest revision change: {money(comparison.totalDelta, project.metadata.currency)}</strong><span>{comparison.addedItemIds.length} added · {comparison.removedItemIds.length} removed · {comparison.changed.length} changed</span></div> : null}
    </section>
  );
}

interface BoqItemInspectorProps { project: ProjectRecord; item: BoqItem; onUpdate: (changes: Partial<BoqItem>) => void; }

function BoqItemInspector({ project, item, onUpdate }: BoqItemInspectorProps) {
  function addResource(): void {
    onUpdate({ resources: [...item.resources, { id: crypto.randomUUID(), category: 'material', description: 'New resource', quantityPerUnit: 1, unit: normalizeEngineeringUnit(item.unit), unitCost: 0, wastePercent: 0 }] });
  }
  function addAllocation(): void {
    const activity = project.activities.find((candidate) => !item.allocations.some((allocation) => allocation.activityId === candidate.id));
    if (!activity) return;
    onUpdate({ allocations: [...item.allocations, { activityId: activity.id, percent: 0 }] });
  }
  return <><div className="surface-heading"><div><p className="eyebrow">Unit-price analysis</p><h3>{item.code}</h3></div></div><div className="inspector-actions"><button className="button button-small" type="button" onClick={addResource}>Add resource</button><button className="button button-small" type="button" onClick={addAllocation}>Add allocation</button></div><h4>Resources</h4>{item.resources.map((resource) => <div className="resource-row" key={resource.id}><select value={resource.category} onChange={(event) => onUpdate({ resources: item.resources.map((candidate) => candidate.id === resource.id ? { ...candidate, category: event.target.value as ResourceCategory } : candidate) })}><option value="material">Material</option><option value="labor">Labor</option><option value="equipment">Equipment</option><option value="subcontract">Subcontract</option><option value="miscellaneous">Misc.</option></select><input value={resource.description} onChange={(event) => onUpdate({ resources: item.resources.map((candidate) => candidate.id === resource.id ? { ...candidate, description: event.target.value } : candidate) })} /><label>Qty/unit<NumericInput value={resource.quantityPerUnit} min={0} step="any" calculatorLabel={`${resource.description} quantity per unit`} onValueChange={(quantityPerUnit) => { if (quantityPerUnit !== undefined) onUpdate({ resources: item.resources.map((candidate) => candidate.id === resource.id ? { ...candidate, quantityPerUnit } : candidate) }); }} /></label><label>Unit cost<NumericInput value={resource.unitCost} min={0} step="any" calculatorLabel={`${resource.description} unit cost`} onValueChange={(unitCost) => { if (unitCost !== undefined) onUpdate({ resources: item.resources.map((candidate) => candidate.id === resource.id ? { ...candidate, unitCost } : candidate) }); }} /></label><label>Waste %<NumericInput value={resource.wastePercent} min={0} step="any" calculatorLabel={`${resource.description} waste percentage`} onValueChange={(wastePercent) => { if (wastePercent !== undefined) onUpdate({ resources: item.resources.map((candidate) => candidate.id === resource.id ? { ...candidate, wastePercent } : candidate) }); }} /></label></div>)}<h4>Activity allocations</h4>{item.allocations.map((allocation) => <div className="allocation-row" key={allocation.activityId}><select aria-label={`Activity allocation for ${item.code}`} value={allocation.activityId} onChange={(event) => onUpdate({ allocations: item.allocations.map((candidate) => candidate.activityId === allocation.activityId ? { ...candidate, activityId: event.target.value } : candidate) })}>{project.activities.map((activity) => <option key={activity.id} value={activity.id}>{activityReferenceLabel(activity)}</option>)}</select><NumericInput value={allocation.percent} min={0} max={100} step="any" calculatorLabel={`allocation percentage for ${allocation.activityId}`} aria-label={`Allocation percentage for ${allocation.activityId}`} onValueChange={(percent) => { if (percent !== undefined) onUpdate({ allocations: item.allocations.map((candidate) => candidate.activityId === allocation.activityId ? { ...candidate, percent } : candidate) }); }} /><span>%</span></div>)}</>;
}

function money(value: number, currency: string): string {
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value); }
  catch { return `${currency} ${value.toFixed(2)}`; }
}
