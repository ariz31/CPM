import { describe, expect, it } from 'vitest';
import implementationStatus from '../docs/20_IMPLEMENTATION_STATUS.md?raw';
import { REQUIREMENT_COVERAGE } from './domain/release/requirementCoverage';

// ENT-AT-001 requirement-to-test traceability gate
describe('implementation traceability', () => {
  it('documents written acceptance tests for Phases 1 through 10', () => {
    for (const testId of [
      'P1-AT-001', 'P1-AT-006', 'P2-AT-001', 'P2-AT-006', 'P3-AT-001', 'P3-AT-008',
      'P4-AT-001', 'P4-AT-008', 'P5-AT-001', 'P5-AT-008', 'P6-AT-001', 'P6-AT-006',
      'P7-AT-001', 'P7-AT-008', 'P8-AT-001', 'P8-AT-008', 'P9-AT-001', 'P9-AT-008',
      'P10-AT-001', 'P10-AT-012'
    ]) expect(implementationStatus).toContain(testId);
  });

  it('maps representative functional requirements in the authoritative coverage registry', () => {
    const mapped = new Set(REQUIREMENT_COVERAGE.map((record) => record.id));
    for (const requirement of [
      'PRJ-001', 'IO-001', 'CAL-001', 'WBS-001', 'ACT-001', 'LOG-001', 'CPM-001',
      'UI-002', 'BAS-001', 'BOQ-001', 'SCV-001', 'EVM-001', 'CSH-001',
      'PERT-001', 'RSK-001', 'PRD-001', 'RES-001', 'AUD-001', 'AUD-003', 'SET-003'
    ]) expect(mapped.has(requirement)).toBe(true);
  });
});
