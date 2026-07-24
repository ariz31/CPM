import { describe, expect, it } from 'vitest';
import requirements from '../../../docs/02_FUNCTIONAL_REQUIREMENTS.md?raw';
import { ALL_REQUIREMENT_IDS, getReleaseRequirementBlockers, REQUIREMENT_COVERAGE } from './requirementCoverage';

describe('Version 1 functional requirement mapping', () => {
  it('maps every functional requirement identifier exactly once', () => {
    const documented = [...requirements.matchAll(/^###\s+([A-Z]+-\d{3})\s+/gm)].map((match) => match[1]);
    const mapped = REQUIREMENT_COVERAGE.map((record) => record.id);
    expect(new Set(mapped).size).toBe(mapped.length);
    expect([...mapped].sort()).toEqual([...documented].sort());
    expect([...ALL_REQUIREMENT_IDS].sort()).toEqual([...documented].sort());
  });

  it('documents a concrete reason for every release blocker', () => {
    const blockers = getReleaseRequirementBlockers();
    expect(blockers.length).toBeGreaterThan(0);
    for (const blocker of blockers) {
      expect(blocker.evidence.length).toBeGreaterThan(30);
      expect(blocker.status).toBe('partial');
    }
  });
});
