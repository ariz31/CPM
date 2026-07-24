# Application Implementation Status

## Current milestone

The executable application now covers roadmap Phases 0–6:

- Phase 0 — engineering and offline application foundation.
- Phase 1 — project library and safe local storage.
- Phase 2 — calendars, WBS, and activity grid.
- Phase 3 — CPM engine and schedule health.
- Phase 4 — professional Gantt, network, and schedule reports.
- Phase 5 — baselines and progress control.
- Phase 6 — BOQ and estimating.

Cost loading, S-curves, earned value, PERT, risk, productivity, resources, and the complete enterprise-reporting/audit phase remain subsequent work.

## Phase 4 delivered

- Synchronized Gantt with planned bars, baseline bars, progress overlays, milestones, float, deadlines, status date, zoom, and accessible table fallback.
- Deterministic network layout with WBS grouping, orthogonal edges, critical-path mode, focused ancestor/descendant isolation, and accessible relationship fallback.
- Critical path, float, logic, milestone, and look-ahead report generators.
- Immutable project revision, status-date, calculation, and generation provenance.
- Formula-safe CSV and stable browser Print/PDF foundation.

## Phase 5 delivered

- Immutable original and revised baseline snapshots.
- Explicit status date, active baseline, actual starts/finishes, remaining duration, suspensions, and update notes.
- Duration, physical, units, and milestone progress methods.
- Retained logic and progress override for out-of-sequence work.
- Out-of-sequence detection, forecast finish, weighted completion, and baseline variance.
- Weekly update snapshots stored with the project revision and complete progress map.

## Phase 6 delivered

- Hierarchical BOQ sections, quantity items, units, rates, and amounts.
- Material, labor, equipment, subcontract, and miscellaneous resource breakdown.
- Waste-aware unit-price analysis and ordered markup waterfall.
- Activity cost allocations with explicit under/over allocation findings.
- Immutable estimate revisions and comparison.
- Formula-safe BOQ CSV export.

## Written acceptance tests

| Test ID | Requirement IDs | Acceptance statement | Automation |
|---|---|---|---|
| P1-AT-001 | PRJ-001, PRJ-002 | The library initializes once, creates projects, and lists lifecycle states independently. | `projectRepository.test.ts` |
| P1-AT-006 | IO-001, IO-002 | Portable export/import restores an exact project and rejects checksum tampering. | `projectFile.test.ts` |
| P2-AT-001 | CAL-001, CAL-002 | Calendars support split shifts, holidays, and exceptions. | `calendar.test.ts` |
| P2-AT-002 | WBS-001 | WBS nodes remain hierarchical, uniquely identified, command-managed, and portable. | `projectCommands.test.ts` and project-file tests |
| P2-AT-003 | ACT-001 | Activities are created and updated through validated commands with stable authoritative fields. | `projectCommands.test.ts` |
| P2-AT-006 | ACT-005, IO-003 | Invalid CSV rows prevent the whole activity import. | `csvImport.test.ts` |
| P3-AT-001 | LOG-001, LOG-002 | FS, SS, FF, and SF calculate documented boundaries with lag. | `cpm.test.ts` |
| P3-AT-002 | CPM-001 | Calendar-aware forward and backward passes produce deterministic early and late dates. | `cpm.test.ts` |
| P3-AT-008 | PERF-P3 | A 10,000-activity chain remains inside the CI safety budget. | `cpm.performance.test.ts` |
| P4-AT-001 | UI-002, RPT-001 | Network nodes use deterministic layered positions and orthogonal edges. | `networkLayout.test.ts` |
| P4-AT-002 | RPT-002 | Critical-only and focused path isolation retain the required connected activities. | `networkLayout.test.ts` |
| P4-AT-003 | UI-002 | WBS grouping and accessible network semantics are generated from authoritative project records. | `networkLayout.test.ts` and `NetworkDiagram.tsx` |
| P4-AT-004 | RPT-003 | Critical path, float, logic, milestone, and look-ahead reports have stable columns and row ordering. | `scheduleReports.test.ts` |
| P4-AT-005 | RPT-004, AUD-002 | Every report records project revision, status date, engine version, calculation time, and generation time. | `scheduleReports.test.ts` |
| P4-AT-006 | RPT-005 | Look-ahead reports include only activities intersecting the configured status-date window. | `scheduleReports.test.ts` |
| P4-AT-007 | RPT-006, SEC-IO | CSV exports neutralize spreadsheet formula prefixes. | `scheduleReports.test.ts` |
| P4-AT-008 | RPT-007 | Print output uses stable headers, repeated table headings, provenance, and page-safe rows. | `reportExport.ts` and written print acceptance |
| P5-AT-001 | BASE-001, BASE-002 | Original and revised baselines copy one calculated project revision and remain immutable. | `progress.test.ts` |
| P5-AT-002 | UPT-001 | Status date is authoritative and stored independently of calculation time. | `progress.test.ts` and progress UI |
| P5-AT-003 | UPT-002, UPT-003 | Duration, physical, units, and milestone methods return documented completion. | `progress.test.ts` |
| P5-AT-004 | UPT-004 | An actual finish cannot exist without an actual start; remaining duration is non-negative. | `progress.test.ts` |
| P5-AT-005 | UPT-005 | Out-of-sequence starts are detected from unfinished predecessors. | `progress.test.ts` |
| P5-AT-006 | UPT-006 | Retained logic and progress override remain explicit per activity. | `progress.test.ts` and progress UI |
| P5-AT-007 | BASE-003, UPT-007 | Forecast finish and baseline variance are calculated without modifying the baseline. | `progress.test.ts` |
| P5-AT-008 | UPT-008 | Weekly update snapshots preserve status date, revision, and progress records. | `progress.test.ts` |
| P6-AT-001 | BOQ-001, COST-001 | Resource quantities, costs, waste, unit rates, and item amounts reconcile. | `estimating.test.ts` |
| P6-AT-002 | COST-002 | Markups execute in explicit order against direct cost or running subtotal. | `estimating.test.ts` |
| P6-AT-003 | BOQ-002 | Under/over allocations are visible and never silently normalized. | `estimating.test.ts` |
| P6-AT-004 | BOQ-003, COST-003 | Missing references and invalid financial inputs block authoritative save. | `estimating.test.ts` |
| P6-AT-005 | BOQ-004 | Estimate revisions are immutable and compare quantity, rate, and total changes. | `estimating.test.ts` |
| P6-AT-006 | IO-004, SEC-IO | BOQ CSV export neutralizes spreadsheet formula prefixes. | `estimating.test.ts` |

## Explicit limitations

- Print/PDF currently uses browser print rather than a dedicated deterministic PDF renderer.
- Manual network positions and very-large-network level of detail remain future work.
- Progress forecasting does not yet replace the CPM engine's forward/backward pass with a fully actualized data-date algorithm.
- BOQ financial math applies controlled cent and quantity rounding over JavaScript numbers rather than arbitrary-precision decimals.
- Summary activity rollups remain uncalculated.

## Next roadmap phase

Phase 7 will add BOQ-to-activity cost loading, time-phased planned/actual/earned/forecast curves, cash flow, and earned-value metrics.
