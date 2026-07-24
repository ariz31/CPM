# Application Implementation Status

## Current milestone

The executable application now covers the first four roadmap milestones:

- Phase 0 — engineering and offline application foundation.
- Phase 1 — project library and safe local storage.
- Phase 2 — calendars, WBS, and activity grid.
- Phase 3 — CPM engine and schedule health.

The product is not yet complete. Gantt/network reporting, baselines, progress, BOQ, S-curves, PERT, productivity, resources, and enterprise reporting remain later phases.

## Phase 1 delivered

- Create, open, rename, duplicate, archive, trash, restore, and permanently delete projects.
- Version 2 IndexedDB schema with transactional project, journal, snapshot, and quarantine stores.
- Named, recovery, pre-import, and pre-delete snapshots.
- Recovery center with snapshots and command journal.
- Storage usage, quota, persistence, and quarantine indicators.
- Corrupt-record isolation so one damaged project does not block the library.
- Versioned `.cpmproj` envelope with SHA-256 checksum, staged validation, duplicate-ID behavior, and export/import round trip.
- Project metadata and settings editor.

## Phase 2 delivered

- Multiple project calendars with timezone metadata, standard workday, weekly patterns, split shifts, holidays, and date exceptions.
- Timezone-stable date-only arithmetic and minute-resolution working instants.
- WBS hierarchy and activity coding fields.
- Task, milestone, and summary activity entities with audit metadata, notes, constraints, deadlines, and custom-field storage.
- Virtualized activity grid with filtering, sorting, row selection, inline editing, bulk calendar assignment, and keyboard-focusable controls.
- Command-based activity, WBS, calendar, and relationship mutation with project-level undo/redo snapshots.
- CSV activity preview, mapping by header, duplicate validation, error report, and atomic commit.

## Phase 3 delivered

- FS, SS, FF, and SF logic with positive and negative lag.
- Duplicate-link, missing-reference, self-link, and cycle validation.
- Calendar-aware forward and backward passes using split shifts, weekends, holidays, and exceptions.
- Total float, free float, critical and near-critical classification.
- Start/finish constraints, deadlines, explicit FINISH handling, driving-link recording, and open-end warnings.
- Deterministic Web Worker calculation with revision IDs, cancellation, timeout, crash recovery, and stale-result rejection.
- Schedule-health panel with calculation provenance and severity-coded findings.
- Relationship editor and calendar-aware timeline preview.
- 10,000-activity benchmark guard.

## Written acceptance tests

| Test ID | Requirement IDs | Acceptance statement | Automation |
|---|---|---|---|
| P1-AT-001 | PRJ-001, PRJ-002 | The library initializes once, creates projects, and lists active/archived/trashed records independently. | `projectRepository.test.ts` |
| P1-AT-002 | PRJ-003 | Rename, duplicate, archive, trash, restore, and permanent delete preserve lifecycle invariants. | `projectRepository.test.ts` |
| P1-AT-003 | PRJ-004, AUD-001 | A save atomically updates the project and command journal with monotonic revision metadata. | `projectRepository.test.ts` |
| P1-AT-004 | PRJ-005 | Named snapshots remain immutable and can restore a later project revision. | `projectRepository.test.ts` |
| P1-AT-005 | PRJ-006 | A malformed project is quarantined without blocking valid projects. | `projectRepository.test.ts` |
| P1-AT-006 | IO-001, IO-002 | Export-delete-import restores an exact project; checksum tampering is rejected before storage mutation. | `projectFile.test.ts` |
| P2-AT-001 | CAL-001, CAL-002 | Calendars support weekly patterns, split shifts, holidays, and exceptions. | `calendar.test.ts` |
| P2-AT-002 | CAL-003, CAL-004 | Working-minute addition/subtraction skips non-working intervals at minute resolution. | `calendar.test.ts` |
| P2-AT-003 | CAL-005 | Leap-year and date-only operations do not drift with device timezone. | `calendar.test.ts` |
| P2-AT-004 | WBS-001, WBS-002, ACT-001, ACT-002 | Commands add WBS and activities with stable IDs, types, calendars, metadata, and reversible history. | `projectCommands.test.ts` |
| P2-AT-005 | ACT-003, ACT-004 | Invalid and duplicate edits are rejected before the source project is mutated. | `projectCommands.test.ts` |
| P2-AT-006 | ACT-005, IO-003 | CSV rows are previewed and validated; any invalid row prevents the entire import commit. | `csvImport.test.ts` |
| P3-AT-001 | LOG-001, LOG-002 | FS, SS, FF, and SF relationships calculate documented boundaries with lags. | `cpm.test.ts` |
| P3-AT-002 | LOG-003, LOG-004 | Duplicate links and circular logic block authoritative results. | `cpm.test.ts` |
| P3-AT-003 | LOG-005, LOG-006 | Open ends and driving relationships are reported. | `cpm.test.ts` and schedule-health UI |
| P3-AT-004 | CPM-001, CPM-002 | Forward and backward passes produce exact calendar-aware early and late dates. | `cpm.test.ts` |
| P3-AT-005 | CPM-003, CPM-004, CPM-005 | Total/free float and critical/near-critical paths are classified from configured thresholds. | `cpm.test.ts` |
| P3-AT-006 | CPM-006, CPM-007 | Constraints, deadlines, and explicit project finish behavior are visible and tested. | `cpm.test.ts` |
| P3-AT-007 | CPM-008, AUD-002 | Repeated inputs are deterministic and worker responses are revision-bound. | `cpm.test.ts` and worker protocol |
| P3-AT-008 | PERF-P3 | A 10,000-activity chain completes within the five-second CI safety budget. | `cpm.performance.test.ts` |

## Explicit limitations

- The Phase 1 project file is a checksummed, versioned JSON envelope using the `.cpmproj` extension. Attachment streaming and ZIP entry separation remain later hardening work.
- The virtualized activity grid supports core editing, filtering, sorting, selection, bulk calendar changes, and undo/redo. Advanced spreadsheet fill, multi-range copy/paste, and persisted layout customization remain iterative work.
- Cross-calendar relationship lag uses the successor activity calendar, which is documented and deterministic. Relationship-specific calendars remain a future option.
- Summary activity rollups are stored but not yet calculated from child activities.
- Browser component automation, screen-reader regression, and full visual testing remain to be expanded even though semantic controls and reduced-motion behavior are implemented.

## Next roadmap phase

Phase 4 will add synchronized professional Gantt and network views, path isolation, WBS grouping, stable schedule reports, and PDF/print provenance.
