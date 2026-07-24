import { describe, expect, it } from 'vitest';
import { createReleaseGate, qualifyRelease, REQUIRED_RELEASE_GATES, validateEvidencePackage } from './releaseQualification';
import type { ReleaseEvidencePackage } from './types';

function completePackage(): ReleaseEvidencePackage {
  return {
    releaseVersion: '1.0.0',
    generatedAt: '2026-07-25T00:00:00.000Z',
    projectSchemaVersion: 4,
    indexedDbVersion: 6,
    portableEnvelopeVersion: 1,
    gates: REQUIRED_RELEASE_GATES.map(({ id }) => createReleaseGate(id, 'pass', `${id} passed`, [`${id}.json`], '2026-07-25T00:00:00.000Z')),
    findings: []
  };
}

describe('enterprise release qualification', () => {
  it('qualifies only a complete package with all mandatory gates passing', () => {
    const evidence = completePackage();
    expect(validateEvidencePackage(evidence)).toEqual([]);
    expect(qualifyRelease(evidence)).toMatchObject({ qualified: true, blockedGateIds: [], unresolvedCriticalOrHigh: [] });
  });

  it('blocks not-run and warning mandatory gates', () => {
    const evidence = completePackage();
    evidence.gates = evidence.gates.map((gate) => gate.id === 'accessibility' ? { ...gate, status: 'warning' as const } : gate);
    const result = qualifyRelease(evidence);
    expect(result.qualified).toBe(false);
    expect(result.blockedGateIds).toContain('accessibility');
  });

  it('blocks unresolved high or critical findings independently of gate status', () => {
    const evidence = completePackage();
    evidence.findings.push({ id: 'SEC-1', severity: 'high', title: 'Unsafe import', resolved: false });
    const result = qualifyRelease(evidence);
    expect(result.qualified).toBe(false);
    expect(result.unresolvedCriticalOrHigh).toHaveLength(1);
  });

  it('allows resolved high findings while preserving them in evidence', () => {
    const evidence = completePackage();
    evidence.findings.push({ id: 'SEC-1', severity: 'high', title: 'Unsafe import', resolved: true, evidence: 'Regression test added.' });
    expect(qualifyRelease(evidence).qualified).toBe(true);
  });

  it('reports missing gate and version metadata errors', () => {
    const evidence = completePackage();
    evidence.gates = evidence.gates.filter((gate) => gate.id !== 'migrations');
    evidence.indexedDbVersion = 5;
    expect(validateEvidencePackage(evidence)).toEqual(expect.arrayContaining([
      'Missing release gate: migrations',
      'Unexpected IndexedDB version.'
    ]));
  });
});
