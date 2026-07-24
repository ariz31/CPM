import type {
  ReleaseEvidencePackage,
  ReleaseGateEvidence,
  ReleaseGateId,
  ReleaseQualificationResult
} from './types';

export const REQUIRED_RELEASE_GATES: ReadonlyArray<{ id: ReleaseGateId; title: string }> = [
  { id: 'requirements', title: 'Mandatory requirement traceability' },
  { id: 'migrations', title: 'Schema migration matrix' },
  { id: 'security', title: 'Security and malicious corpus' },
  { id: 'data-integrity', title: 'Silent data-loss prevention' },
  { id: 'performance', title: 'Performance and soak budgets' },
  { id: 'accessibility', title: 'WCAG 2.2 AA core workflows' },
  { id: 'compatibility', title: 'Browser and device compatibility' },
  { id: 'offline-recovery', title: 'Offline install, update, rollback, and recovery' },
  { id: 'documentation', title: 'User, administrator, and support guidance' },
  { id: 'provenance', title: 'SBOM and build provenance' }
];

export function qualifyRelease(evidencePackage: ReleaseEvidencePackage): ReleaseQualificationResult {
  const byId = new Map(evidencePackage.gates.map((gate) => [gate.id, gate]));
  const blockedGateIds = REQUIRED_RELEASE_GATES
    .filter(({ id }) => {
      const gate = byId.get(id);
      return !gate || gate.status === 'fail' || gate.status === 'not-run' || (gate.mandatory && gate.status !== 'pass');
    })
    .map(({ id }) => id);
  const unresolvedCriticalOrHigh = evidencePackage.findings.filter(
    (finding) => !finding.resolved && (finding.severity === 'critical' || finding.severity === 'high')
  );
  const warningGateIds = evidencePackage.gates.filter((gate) => gate.status === 'warning').map((gate) => gate.id);
  const qualified = blockedGateIds.length === 0 && unresolvedCriticalOrHigh.length === 0;
  return {
    qualified,
    blockedGateIds,
    unresolvedCriticalOrHigh,
    warningGateIds,
    summary: qualified
      ? `Release ${evidencePackage.releaseVersion} satisfies every mandatory enterprise offline gate.`
      : `Release ${evidencePackage.releaseVersion} is blocked by ${blockedGateIds.length} gate(s) and ${unresolvedCriticalOrHigh.length} unresolved critical/high finding(s).`
  };
}

export function createReleaseGate(
  id: ReleaseGateId,
  status: ReleaseGateEvidence['status'],
  summary: string,
  evidence: string[],
  measuredAt = new Date().toISOString()
): ReleaseGateEvidence {
  const definition = REQUIRED_RELEASE_GATES.find((gate) => gate.id === id);
  if (!definition) throw new Error(`Unknown release gate: ${id}`);
  return { id, title: definition.title, status, mandatory: true, summary, evidence, measuredAt };
}

export function validateEvidencePackage(value: ReleaseEvidencePackage): string[] {
  const issues: string[] = [];
  const ids = new Set(value.gates.map((gate) => gate.id));
  for (const gate of REQUIRED_RELEASE_GATES) if (!ids.has(gate.id)) issues.push(`Missing release gate: ${gate.id}`);
  if (!value.releaseVersion.trim()) issues.push('Release version is required.');
  if (value.projectSchemaVersion !== 4) issues.push('Unexpected project schema version.');
  if (value.indexedDbVersion !== 6) issues.push('Unexpected IndexedDB version.');
  if (value.portableEnvelopeVersion !== 1) issues.push('Unexpected portable envelope version.');
  return issues;
}
