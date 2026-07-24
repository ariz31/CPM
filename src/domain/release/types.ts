export type ReleaseGateId =
  | 'requirements'
  | 'migrations'
  | 'security'
  | 'data-integrity'
  | 'performance'
  | 'accessibility'
  | 'compatibility'
  | 'offline-recovery'
  | 'documentation'
  | 'provenance';

export type EvidenceStatus = 'pass' | 'warning' | 'fail' | 'not-run';
export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'informational';

export interface ReleaseFinding {
  id: string;
  severity: FindingSeverity;
  title: string;
  resolved: boolean;
  evidence?: string;
}

export interface ReleaseGateEvidence {
  id: ReleaseGateId;
  title: string;
  status: EvidenceStatus;
  mandatory: boolean;
  summary: string;
  evidence: string[];
  measuredAt?: string;
}

export interface ReleaseEvidencePackage {
  releaseVersion: string;
  commitSha?: string;
  generatedAt: string;
  projectSchemaVersion: number;
  indexedDbVersion: number;
  portableEnvelopeVersion: number;
  gates: ReleaseGateEvidence[];
  findings: ReleaseFinding[];
  sbomDigest?: string;
  buildDigest?: string;
}

export interface ReleaseQualificationResult {
  qualified: boolean;
  blockedGateIds: ReleaseGateId[];
  unresolvedCriticalOrHigh: ReleaseFinding[];
  warningGateIds: ReleaseGateId[];
  summary: string;
}
