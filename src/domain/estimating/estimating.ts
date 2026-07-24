import type {
  ActivityCostAllocation,
  BoqItem,
  BoqModel,
  BoqRevision,
  MarkupRule,
  ResourceComponent
} from './types';

const MONEY_SCALE = 100;
const QUANTITY_SCALE = 1_000_000;

export interface CalculatedResourceComponent extends ResourceComponent {
  amountPerBoqUnit: number;
}

export interface CalculatedBoqItem extends BoqItem {
  calculatedResources: CalculatedResourceComponent[];
  unitRate: number;
  directAmount: number;
  allocationTotalPercent: number;
  allocationStatus: 'balanced' | 'under-allocated' | 'over-allocated';
}

export interface CalculatedMarkup extends MarkupRule {
  basisAmount: number;
  amount: number;
  runningSubtotal: number;
}

export interface EstimateSummary {
  items: CalculatedBoqItem[];
  directCost: number;
  markups: CalculatedMarkup[];
  totalCost: number;
}

export interface BoqRevisionComparison {
  addedItemIds: string[];
  removedItemIds: string[];
  changed: Array<{ itemId: string; quantityDelta: number; unitRateDelta: number; amountDelta: number }>;
  previousTotal: number;
  currentTotal: number;
  totalDelta: number;
}

export function createEmptyBoq(): BoqModel {
  return {
    sections: [{ id: 'BOQ-ROOT', code: '1', name: 'Bill of Quantities', sortOrder: 0 }],
    items: [],
    markups: [],
    revisions: []
  };
}

export function calculateResourceAmount(component: ResourceComponent): number {
  const base = roundQuantity(component.quantityPerUnit) * roundMoney(component.unitCost);
  return roundMoney(base * (1 + clampPercent(component.wastePercent) / 100));
}

export function calculateItemUnitRate(item: BoqItem): number {
  if (item.resources.length === 0) return roundMoney(item.manualUnitRate ?? 0);
  return roundMoney(item.resources.reduce((total, component) => total + calculateResourceAmount(component), 0));
}

export function calculateBoqItem(item: BoqItem): CalculatedBoqItem {
  const unitRate = calculateItemUnitRate(item);
  const directAmount = roundMoney(roundQuantity(item.quantity) * unitRate);
  const allocationTotalPercent = roundQuantity(item.allocations.reduce((total, allocation) => total + allocation.percent, 0));
  return {
    ...item,
    calculatedResources: item.resources.map((component) => ({
      ...component,
      amountPerBoqUnit: calculateResourceAmount(component)
    })),
    unitRate,
    directAmount,
    allocationTotalPercent,
    allocationStatus:
      Math.abs(allocationTotalPercent - 100) < 0.000001
        ? 'balanced'
        : allocationTotalPercent < 100
          ? 'under-allocated'
          : 'over-allocated'
  };
}

export function calculateEstimate(boq: BoqModel): EstimateSummary {
  const items = boq.items.map(calculateBoqItem);
  const directCost = roundMoney(items.reduce((total, item) => total + item.directAmount, 0));
  let runningSubtotal = directCost;
  const markups = [...boq.markups]
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id))
    .map((markup) => {
      const basisAmount = markup.basis === 'direct-cost' ? directCost : runningSubtotal;
      const amount = roundMoney(basisAmount * clampPercent(markup.ratePercent) / 100);
      runningSubtotal = roundMoney(runningSubtotal + amount);
      return { ...markup, basisAmount, amount, runningSubtotal };
    });
  return { items, directCost, markups, totalCost: runningSubtotal };
}

export function validateBoq(boq: BoqModel, activityIds: Set<string>): string[] {
  const issues: string[] = [];
  const sectionIds = new Set<string>();
  for (const section of boq.sections) {
    if (!section.id.trim() || !section.code.trim() || !section.name.trim()) issues.push('Every BOQ section requires an ID, code, and name.');
    if (sectionIds.has(section.id)) issues.push(`Duplicate BOQ section ID: ${section.id}`);
    sectionIds.add(section.id);
  }
  const itemIds = new Set<string>();
  for (const item of boq.items) {
    if (itemIds.has(item.id)) issues.push(`Duplicate BOQ item ID: ${item.id}`);
    itemIds.add(item.id);
    if (!sectionIds.has(item.sectionId)) issues.push(`BOQ item ${item.id} references a missing section.`);
    if (!item.code.trim() || !item.description.trim() || !item.unit.trim()) issues.push(`BOQ item ${item.id} requires code, description, and unit.`);
    if (!Number.isFinite(item.quantity) || item.quantity < 0) issues.push(`BOQ item ${item.id} has invalid quantity.`);
    if (item.manualUnitRate !== undefined && (!Number.isFinite(item.manualUnitRate) || item.manualUnitRate < 0)) issues.push(`BOQ item ${item.id} has invalid manual unit rate.`);
    for (const component of item.resources) {
      if (!Number.isFinite(component.quantityPerUnit) || component.quantityPerUnit < 0) issues.push(`Resource ${component.id} has invalid quantity per unit.`);
      if (!Number.isFinite(component.unitCost) || component.unitCost < 0) issues.push(`Resource ${component.id} has invalid unit cost.`);
      if (!Number.isFinite(component.wastePercent) || component.wastePercent < 0 || component.wastePercent > 1000) issues.push(`Resource ${component.id} has invalid waste percentage.`);
    }
    for (const allocation of item.allocations) {
      if (!activityIds.has(allocation.activityId)) issues.push(`BOQ item ${item.id} allocates cost to missing activity ${allocation.activityId}.`);
      if (!Number.isFinite(allocation.percent) || allocation.percent < 0) issues.push(`BOQ item ${item.id} has invalid allocation percentage.`);
    }
  }
  for (const markup of boq.markups) {
    if (!Number.isFinite(markup.ratePercent) || markup.ratePercent < -100 || markup.ratePercent > 1000) issues.push(`Markup ${markup.id} has an invalid rate.`);
  }
  return issues;
}

export function createBoqRevision(boq: BoqModel, name: string, projectRevision: number, createdAt = new Date().toISOString()): BoqRevision {
  return {
    id: crypto.randomUUID(),
    name: name.trim() || `Estimate revision ${boq.revisions.length + 1}`,
    createdAt,
    projectRevision,
    items: structuredClone(boq.items),
    markups: structuredClone(boq.markups)
  };
}

export function compareBoqRevisions(previous: BoqRevision, current: BoqRevision): BoqRevisionComparison {
  const previousById = new Map(previous.items.map((item) => [item.id, item]));
  const currentById = new Map(current.items.map((item) => [item.id, item]));
  const addedItemIds = current.items.filter((item) => !previousById.has(item.id)).map((item) => item.id);
  const removedItemIds = previous.items.filter((item) => !currentById.has(item.id)).map((item) => item.id);
  const changed: BoqRevisionComparison['changed'] = [];
  for (const item of current.items) {
    const before = previousById.get(item.id);
    if (!before) continue;
    const beforeRate = calculateItemUnitRate(before);
    const afterRate = calculateItemUnitRate(item);
    const quantityDelta = roundQuantity(item.quantity - before.quantity);
    const unitRateDelta = roundMoney(afterRate - beforeRate);
    const amountDelta = roundMoney(item.quantity * afterRate - before.quantity * beforeRate);
    if (quantityDelta !== 0 || unitRateDelta !== 0 || amountDelta !== 0) changed.push({ itemId: item.id, quantityDelta, unitRateDelta, amountDelta });
  }
  const previousTotal = calculateEstimate({ sections: [], items: previous.items, markups: previous.markups, revisions: [] }).totalCost;
  const currentTotal = calculateEstimate({ sections: [], items: current.items, markups: current.markups, revisions: [] }).totalCost;
  return { addedItemIds, removedItemIds, changed, previousTotal, currentTotal, totalDelta: roundMoney(currentTotal - previousTotal) };
}

export function allocateCost(item: CalculatedBoqItem, allocation: ActivityCostAllocation): number {
  return roundMoney(item.directAmount * allocation.percent / 100);
}

export function exportBoqCsv(summary: EstimateSummary): string {
  const rows = [['Code', 'Description', 'Unit', 'Quantity', 'Unit Rate', 'Amount', 'Allocation Status']];
  for (const item of summary.items) {
    rows.push([
      item.code,
      item.description,
      item.unit,
      String(item.quantity),
      item.unitRate.toFixed(2),
      item.directAmount.toFixed(2),
      item.allocationStatus
    ]);
  }
  return rows.map((row) => row.map(csvCell).join(',')).join('\n');
}

function csvCell(value: string): string {
  const protectedValue = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${protectedValue.replaceAll('"', '""')}"`;
}

function clampPercent(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * MONEY_SCALE) / MONEY_SCALE;
}

function roundQuantity(value: number): number {
  return Math.round((value + Number.EPSILON) * QUANTITY_SCALE) / QUANTITY_SCALE;
}
