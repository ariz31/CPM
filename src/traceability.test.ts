import { describe, expect, it } from 'vitest';
import implementationStatus from '../docs/20_IMPLEMENTATION_STATUS.md?raw';

// ENT-AT-001 requirement-to-test traceability gate
describe('implementation traceability', () => {
  it('documents written acceptance tests for Phases 1, 2, and 3', () => {
    for (const testId of ['P1-AT-001', 'P1-AT-006', 'P2-AT-001', 'P2-AT-006', 'P3-AT-001', 'P3-AT-008']) {
      expect(implementationStatus).toContain(testId);
    }
    for (const requirement of ['PRJ-001', 'IO-001', 'CAL-001', 'WBS-001', 'ACT-001', 'LOG-001', 'CPM-001']) {
      expect(implementationStatus).toContain(requirement);
    }
  });
});
