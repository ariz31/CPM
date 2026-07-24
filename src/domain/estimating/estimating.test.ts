import { describe, expect, it } from 'vitest';
import {
  calculateEstimate,
  compareBoqRevisions,
  createBoqRevision,
  exportBoqCsv,
  validateBoq
} from './estimating';
import type { BoqModel } from './types';

function fixture(): BoqModel {
  return {
    sections: [{ id: 'S1', code: '1', name: 'Civil works', sortOrder: 0 }],
    items: [{
      id: 'I1', sectionId: 'S1', code: '1.1', description: 'Concrete', unit: 'm3', quantity: 10,
      resources: [
        { id: 'R1', category: 'material', description: 'Concrete supply', quantityPerUnit: 1, unit: 'm3', unitCost: 5000, wastePercent: 5 },
        { id: 'R2', category: 'labor', description: 'Placement crew', quantityPerUnit: 2, unit: 'hr', unitCost: 200, wastePercent: 0 }
      ],
      allocations: [{ activityId: 'A1', percent: 60 }, { activityId: 'A2', percent: 40 }]
    }],
    markups: [
      { id: 'M1', name: 'Overhead', ratePercent: 10, order: 1, basis: 'direct-cost' },
      { id: 'M2', name: 'Profit', ratePercent: 5, order: 2, basis: 'running-subtotal' }
    ],
    revisions: []
  };
}

// P6-AT-001 through P6-AT-006
describe('BOQ and estimating engine', () => {
  it('calculates resource unit rates, waste, item amounts, and ordered markup waterfall', () => {
    const summary = calculateEstimate(fixture());
    expect(summary.items[0].unitRate).toBe(5650);
    expect(summary.directCost).toBe(56500);
    expect(summary.markups.map((markup) => markup.amount)).toEqual([5650, 3107.5]);
    expect(summary.totalCost).toBe(65257.5);
  });

  it('reports under and over allocation without silently normalizing percentages', () => {
    const boq = fixture();
    boq.items[0].allocations = [{ activityId: 'A1', percent: 75 }];
    expect(calculateEstimate(boq).items[0]).toMatchObject({ allocationTotalPercent: 75, allocationStatus: 'under-allocated' });
    boq.items[0].allocations = [{ activityId: 'A1', percent: 120 }];
    expect(calculateEstimate(boq).items[0]).toMatchObject({ allocationTotalPercent: 120, allocationStatus: 'over-allocated' });
  });

  it('validates references and financial inputs before authoritative save', () => {
    const boq = fixture();
    boq.items[0].allocations = [{ activityId: 'MISSING', percent: 100 }];
    boq.items[0].quantity = -1;
    expect(validateBoq(boq, new Set(['A1', 'A2'])).join(' ')).toMatch(/invalid quantity.*missing activity/i);
  });

  it('creates immutable estimate revisions and reports quantity, rate, and total deltas', () => {
    const before = fixture();
    const previous = createBoqRevision(before, 'Tender', 3, '2026-01-01T00:00:00.000Z');
    const after = fixture();
    after.items[0].quantity = 12;
    const current = createBoqRevision(after, 'Approved', 4, '2026-01-02T00:00:00.000Z');
    const comparison = compareBoqRevisions(previous, current);
    expect(comparison.changed[0]).toMatchObject({ itemId: 'I1', quantityDelta: 2, amountDelta: 11300 });
    expect(previous.items[0].quantity).toBe(10);
  });

  it('protects CSV exports from spreadsheet formula injection', () => {
    const boq = fixture();
    boq.items[0].description = '=HYPERLINK("https://example.invalid")';
    expect(exportBoqCsv(calculateEstimate(boq))).toContain("'=HYPERLINK");
  });
});
