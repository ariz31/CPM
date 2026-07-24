export type RequirementCoverageStatus = 'pass' | 'partial' | 'deferred';

export interface RequirementCoverageRecord {
  id: string;
  status: RequirementCoverageStatus;
  evidence: string;
}

export const ALL_REQUIREMENT_IDS = [
  'PRJ-001','PRJ-002','PRJ-003','PRJ-004','PRJ-005','PRJ-006',
  'CAL-001','CAL-002','CAL-003','CAL-004','CAL-005',
  'WBS-001','WBS-002','WBS-003','WBS-004',
  'ACT-001','ACT-002','ACT-003','ACT-004','ACT-005',
  'LOG-001','LOG-002','LOG-003','LOG-004','LOG-005','LOG-006',
  'CPM-001','CPM-002','CPM-003','CPM-004','CPM-005','CPM-006','CPM-007','CPM-008',
  'BAS-001','BAS-002','BAS-003','BAS-004','BAS-005','BAS-006','BAS-007',
  'UI-001','UI-002','UI-003','UI-004','UI-005',
  'PERT-001','PERT-002','PERT-003','PERT-004','RSK-001','RSK-002',
  'BOQ-001','BOQ-002','BOQ-003','BOQ-004','BOQ-005','BOQ-006',
  'SCV-001','SCV-002','SCV-003','SCV-004','EVM-001','EVM-002','EVM-003','CSH-001',
  'PRD-001','PRD-002','PRD-003','PRD-004','RES-001','RES-002',
  'IO-001','IO-002','IO-003','IO-004','IO-005',
  'SET-001','SET-002','SET-003','AUD-001','AUD-002','AUD-003'
] as const;

const blockers: Record<string, string> = {
  'PRJ-002': 'The project creator does not yet collect the full calendar, precision, unit, and template configuration in one wizard.',
  'PRJ-005': 'Snapshot restore is implemented, but pre-replacement comparison of key dates and totals is not yet interactive.',
  'WBS-001': 'WBS create/delete/reassign exists; reorder, indent, and outdent controls remain incomplete.',
  'WBS-002': 'Activity IDs are stable, but a separate immutable UUID plus editable user-facing code has not been introduced.',
  'WBS-003': 'The complete discipline, phase, location, contractor, work-package, and custom coding dictionaries are not implemented.',
  'ACT-002': 'The activity aggregate lacks the complete coding and responsible-party field set in one editor.',
  'ACT-003': 'Bulk edit, sorting, filtering, and undo exist; spreadsheet copy/paste, fill-down, and configurable column selection remain incomplete.',
  'ACT-005': 'CSV preview is implemented, but full field mapping, delimiter/decimal policies, and XLSX mapping remain incomplete.',
  'CPM-005': 'Critical and near-critical sets are exposed, but explicit multiple continuous path ranking is incomplete.',
  'BAS-001': 'Schedule baselines are immutable; complete frozen quantity, cost, and time-phased baseline payloads remain incomplete.',
  'UI-001': 'The grid is virtualized but does not yet provide all configurable columns, grouping, row-density, and saved-view controls.',
  'UI-003': 'Automatic network layout and path isolation exist; manual node-position persistence remains incomplete.',
  'UI-005': 'Module-level filters exist, but one global search and consistent saved filters across every major module remain incomplete.',
  'BOQ-001': 'Hierarchical items and notes exist; formal alternates and provisional-sum behavior remain incomplete.',
  'EVM-002': 'Core forecasts exist, but all specified EAC alternatives are not yet selectable and disclosed side by side.',
  'PRD-002': 'Field records exist, but full shift, location, weather, delay, remarks, and evidence-link workflows remain incomplete.',
  'PRD-004': 'A productivity forecast exists; latest-period, rolling, weighted, and manual selectable methods remain incomplete.',
  'IO-003': 'CSV exchange exists; XLSX structured templates are not implemented.',
  'IO-005': 'Browser Print/PDF exists; deterministic pagination, page numbering, and dedicated PDF regression remain incomplete.',
  'SET-001': 'Currency and unit system are stored, but full locale, separator, precision, date-format, and duration-unit controls remain incomplete.',
  'AUD-001': 'Commands are timestamped, but stable local actor and device identifiers are not consistently attached.',
  'AUD-002': 'Calculation provenance is present in reports, but every calculation run is not yet persisted with settings/calendar hashes and completion status.'
};

export const REQUIREMENT_COVERAGE: RequirementCoverageRecord[] = ALL_REQUIREMENT_IDS.map((id) => ({
  id,
  status: blockers[id] ? 'partial' : id === 'IO-004' ? 'deferred' : 'pass',
  evidence: blockers[id] ?? (id === 'IO-004'
    ? 'External Microsoft Project and Primavera adapters are explicitly future optional work.'
    : `Implemented and covered by the Phase 0–10 test, documentation, or UI evidence mapped in docs/20_IMPLEMENTATION_STATUS.md.`)
}));

export function getReleaseRequirementBlockers(): RequirementCoverageRecord[] {
  return REQUIREMENT_COVERAGE.filter((record) => record.status === 'partial');
}
