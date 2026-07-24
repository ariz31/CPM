# Requirement-to-Test Traceability

## 1. Purpose

This document provides the minimum written acceptance test for every feature requirement in `02_FUNCTIONAL_REQUIREMENTS.md`. It is the initial traceability source for implementation issues, pull requests, automated tests, release evidence, and audit review.

Each row is a mandatory acceptance scenario. Implementation must expand the row into executable unit, integration, end-to-end, accessibility, migration, security, and performance tests as applicable.

## 2. Test identifier convention

The primary acceptance test for a requirement uses:

`AT-<requirement-id>`

Examples:

- `AT-CPM-001`
- `AT-BOQ-005`
- `AT-SET-003`

Additional tests use a numeric suffix, such as `AT-CPM-001-02`.

## 3. Dimensions required for each feature

Unless genuinely inapplicable and documented, every feature test set must cover:

1. Happy path.
2. Boundary values.
3. Invalid or conflicting input.
4. Offline operation.
5. Interrupted operation or storage failure.
6. Undo/redo or recovery behavior.
7. Import/export and migration behavior.
8. Keyboard and screen-reader behavior.
9. Performance under the applicable benchmark tier.
10. Audit and diagnostic evidence.

## 4. Project library and lifecycle

| Test ID | Requirement | Written acceptance scenario |
|---|---|---|
| AT-PRJ-001 | PRJ-001 | Given several valid, archived, stale, and damaged local projects, when the library opens offline, then each project shows the required metadata and health state without one damaged project blocking the rest. |
| AT-PRJ-002 | PRJ-002 | Given blank, template, CSV, and `.cpmproj` creation paths, when a user completes the wizard, then required project settings are validated, committed atomically, and the new project opens with the selected defaults. |
| AT-PRJ-003 | PRJ-003 | Given an existing project, when rename, duplicate, archive, export, delete, and restore are performed, then identity, snapshots, confirmation, recoverability, and audit records match the operation and no unrelated project changes. |
| AT-PRJ-004 | PRJ-004 | Given edits followed by a simulated crash during persistence, when the app restarts, then it opens the last complete transaction, reports recovery status, and contains neither partial rows nor silent data loss. |
| AT-PRJ-005 | PRJ-005 | Given named snapshots with different totals and dates, when a user compares and restores one as a copy, then the comparison is accurate, the current project remains recoverable, and snapshot metadata is preserved. |
| AT-PRJ-006 | PRJ-006 | Given a fixture containing every documented health defect, when health analysis runs, then each defect is identified with location, severity, explanation, and repair action while approved exceptions remain distinguishable. |

## 5. Calendars and time rules

| Test ID | Requirement | Written acceptance scenario |
|---|---|---|
| AT-CAL-001 | CAL-001 | Given project, activity, and resource calendars with different work patterns, when the schedule calculates, then each entity uses its assigned calendar and the default applies only where no override exists. |
| AT-CAL-002 | CAL-002 | Given weekdays, split shifts, holidays, and date exceptions, when work periods are displayed and used, then all intervals are validated, non-overlapping, and applied exactly once. |
| AT-CAL-003 | CAL-003 | Given a five-working-day activity crossing weekends and holidays, when dates are calculated, then duration consumes exactly five valid working days rather than five elapsed dates. |
| AT-CAL-004 | CAL-004 | Given half-day and multi-shift durations, when values are stored, recalculated, exported, and reopened, then minute-level precision is retained without day-rounding drift. |
| AT-CAL-005 | CAL-005 | Given a project opened on devices in different timezones, when date-only milestones and local shifts are viewed, then project dates do not drift and instant timestamps remain correctly converted. |

## 6. WBS and coding

| Test ID | Requirement | Written acceptance scenario |
|---|---|---|
| AT-WBS-001 | WBS-001 | Given a populated WBS, when nodes are reordered, indented, outdented, renamed, or deleted, then hierarchy invariants hold and deletion requires valid reassignment or explicit cascade impact confirmation. |
| AT-WBS-002 | WBS-002 | Given duplicate and edited activity codes, when validation runs, then duplicate human IDs are rejected while immutable internal UUID references remain unchanged. |
| AT-WBS-003 | WBS-003 | Given standard and user-defined code dictionaries, when codes are assigned, filtered, exported, and reopened, then dictionary identity, labels, allowed values, and assignments remain consistent. |
| AT-WBS-004 | WBS-004 | Given all supported custom field types, when values and display formulas are used, then type validation works and no custom formula can overwrite authoritative engine output. |

## 7. Activity management

| Test ID | Requirement | Written acceptance scenario |
|---|---|---|
| AT-ACT-001 | ACT-001 | Given task, start milestone, finish milestone, and summary rows, when the schedule calculates, then each type follows its duration and aggregation rules and unsupported types cannot masquerade as authoritative. |
| AT-ACT-002 | ACT-002 | Given an activity populated with every documented field, when saved, duplicated, exported, imported, and audited, then values retain type, precision, references, and provenance. |
| AT-ACT-003 | ACT-003 | Given a 10,000-row activity grid, when keyboard navigation, copy/paste, fill down, filtering, sorting, and multi-row edits are performed, then operations are correct, undoable, accessible, and remain within interaction budgets. |
| AT-ACT-004 | ACT-004 | Given invalid durations, dates, percentages, costs, and lags, when validation runs, then affected cells are identified, source text is preserved for correction, and authoritative calculation is blocked only where necessary. |
| AT-ACT-005 | ACT-005 | Given CSV/XLSX data with duplicate IDs, locale-specific numbers, and invalid dates, when mapping preview and import validation run, then the user sees deterministic conversion results before any project mutation. |

## 8. Logic relationships

| Test ID | Requirement | Written acceptance scenario |
|---|---|---|
| AT-LOG-001 | LOG-001 | Given equivalent networks using FS, SS, FF, and SF relationships, when calculated against reference dates, then each relationship produces the documented start/finish bound. |
| AT-LOG-002 | LOG-002 | Given positive and negative lags, when links are entered and calculated, then lag units use the correct calendar, dates match reference results, and negative lag warnings follow policy. |
| AT-LOG-003 | LOG-003 | Given multiple predecessor and successor links including different types between the same pair, when saved, then valid distinct links remain and exact duplicates are rejected without deleting existing logic. |
| AT-LOG-004 | LOG-004 | Given networks containing one and multiple cycles, when validation runs, then calculation is prevented, at least one complete loop path is shown, and unrelated valid data remains editable. |
| AT-LOG-005 | LOG-005 | Given terminal, initial, isolated, milestone, and approved-exception activities, when open-end analysis runs, then only unjustified missing predecessors or successors are reported. |
| AT-LOG-006 | LOG-006 | Given competing links and constraints, when dates calculate, then the engine records the controlling bound and the UI exposes the same driving relationship without inventing a path. |

## 9. CPM scheduling

| Test ID | Requirement | Written acceptance scenario |
|---|---|---|
| AT-CPM-001 | CPM-001 | Given a reference network with calendars, all relationship types, lags, constraints, actuals, and status-date rules, when the forward pass runs, then every early date matches the independently verified fixture. |
| AT-CPM-002 | CPM-002 | Given calculated finish and explicit completion target variants, when the backward pass runs, then late dates match reference results and the selected finish basis is recorded. |
| AT-CPM-003 | CPM-003 | Given branching and converging paths, when float calculates, then total and free float match reference values at activity and relationship boundaries. |
| AT-CPM-004 | CPM-004 | Given positive, zero, and negative float around configurable thresholds, when criticality is evaluated, then critical, near-critical, and negative-float states are distinct and reported consistently. |
| AT-CPM-005 | CPM-005 | Given multiple continuous critical and near-critical paths, when path tracing runs, then each displayed path is logically continuous and path ranking is deterministic. |
| AT-CPM-006 | CPM-006 | Given each supported constraint and conflicts with natural logic, when calculated, then the correct bound applies and hard or conflicting constraints produce visible, reportable warnings. |
| AT-CPM-007 | CPM-007 | Given schedules with and without an explicit finish milestone, when calculated, then the explicit milestone governs where present and derived terminal finish is accompanied by an open-end warning. |
| AT-CPM-008 | CPM-008 | Given a large project and rapid successive edits, when recalculation is started, cancelled, and restarted, then the UI remains responsive, stale jobs cannot overwrite newer results, and the last valid result remains visible. |

## 10. Baselines and progress

| Test ID | Requirement | Written acceptance scenario |
|---|---|---|
| AT-BAS-001 | BAS-001 | Given an approved plan, when a baseline is created, then dates, durations, quantities, costs, curves, settings, and source revision are immutable and reproducible. |
| AT-BAS-002 | BAS-002 | Given original and revised baselines, when the comparison baseline changes, then all variance views update consistently without modifying either baseline. |
| AT-BAS-003 | BAS-003 | Given progress records on different dates, when an update uses an explicit data date, then records beyond or inconsistent with that date are excluded or warned and every report states the date. |
| AT-BAS-004 | BAS-004 | Given actual starts, finishes, remaining durations, suspensions, quantities, and costs, when saved and recalculated, then invalid date order is rejected and valid actuals constrain forecast logic correctly. |
| AT-BAS-005 | BAS-005 | Given each supported progress method, when equivalent work states are entered, then percent complete and earned progress follow the selected rule and disclose its basis. |
| AT-BAS-006 | BAS-006 | Given out-of-sequence actual progress, when retained logic and progress override modes are applied, then each mode produces its documented forecast and a clear diagnostic. |
| AT-BAS-007 | BAS-007 | Given current and baseline records, when variance calculates, then start, finish, duration, float, quantity, and cost variances reconcile to source values with correct signs. |

## 11. Schedule views

| Test ID | Requirement | Written acceptance scenario |
|---|---|---|
| AT-UI-001 | UI-001 | Given configurable calculated and input columns, when users group, filter, resize, freeze, save, restore, and navigate the grid, then view state persists separately from project authority and remains accessible. |
| AT-UI-002 | UI-002 | Given baseline, actual, remaining, float, critical, and milestone data across a multi-year project, when the Gantt zooms and scrolls, then geometry remains aligned with the table and no semantic state relies on color alone. |
| AT-UI-003 | UI-003 | Given a large network with saved manual positions, when automatic layout, WBS grouping, and path isolation run, then valid positions are preserved where required and arrows retain correct type, lag, and direction. |
| AT-UI-004 | UI-004 | Given overdue, upcoming, constrained, and predecessor-dependent work, when a configurable look-ahead is generated, then the correct date window, quantities, resources, and blockers are included. |
| AT-UI-005 | UI-005 | Given saved filters and global searches across modules, when applied and reset, then results are complete, deterministic, keyboard operable, and do not mutate project data. |

## 12. PERT and risk

| Test ID | Requirement | Written acceptance scenario |
|---|---|---|
| AT-PERT-001 | PERT-001 | Given valid and invalid optimistic, most-likely, and pessimistic values, when validated, then O ≤ M ≤ P is enforced and original input remains available for correction. |
| AT-PERT-002 | PERT-002 | Given independently verified three-point estimates, when expected duration and variance calculate, then results match documented formulas and precision rules. |
| AT-PERT-003 | PERT-003 | Given a selected path, mean, variance, and target duration, when probability calculates, then z-score and probability match the reference case and inputs are visible. |
| AT-PERT-004 | PERT-004 | Given a probability result, when displayed or exported, then normal approximation, independence, path-switching limits, and active duration basis are disclosed. |
| AT-RSK-001 | RSK-001 | Given risks with owners, links, responses, triggers, and residual values, when created, filtered, exported, and reopened, then all references and audit history remain intact. |
| AT-RSK-002 | RSK-002 | Given future simulation metadata in a project file, when opened by the initial release, then reserved fields are preserved or reported without corrupting supported project data. |

## 13. BOQ and estimating

| Test ID | Requirement | Written acceptance scenario |
|---|---|---|
| AT-BOQ-001 | BOQ-001 | Given sections, measurable items, alternates, provisional sums, and notes, when reordered and totaled, then hierarchy and inclusion rules produce the expected estimate. |
| AT-BOQ-002 | BOQ-002 | Given quantity, unit rate, waste, precision, and rounding settings, when amount calculates, then adjusted rates and totals match reference decimal arithmetic. |
| AT-BOQ-003 | BOQ-003 | Given material, labor, equipment, subcontract, and miscellaneous components, when unit-price analysis runs, then consumption multiplied by price reconciles to the item rate. |
| AT-BOQ-004 | BOQ-004 | Given ordered markup layers, when direct cost, overhead, profit, contingency, tax, bonds, and escalation calculate, then each base and result is visible and the final total matches the approved order. |
| AT-BOQ-005 | BOQ-005 | Given BOQ-to-activity allocations below, equal to, and above 100%, when validated, then exact allocation is accepted and under/over-allocation is reported without silent normalization. |
| AT-BOQ-006 | BOQ-006 | Given two BOQ revisions, when compared by item ID, then added, removed, quantity, rate, and amount changes are classified and totals reconcile. |

## 14. S-curves, cash flow, and EVM

| Test ID | Requirement | Written acceptance scenario |
|---|---|---|
| AT-SCV-001 | SCV-001 | Given identical activity value under every supported distribution, when time-phased, then period weights follow the selected curve and cumulative value reconciles to the source total. |
| AT-SCV-002 | SCV-002 | Given daily, weekly, monthly, and fiscal periods, when curves aggregate, then boundary dates, first day of week, partial periods, and labels are correct. |
| AT-SCV-003 | SCV-003 | Given planned, earned, actual, forecast, early, and late data, when curves generate, then incremental values sum to cumulative values and unavailable series are explained. |
| AT-SCV-004 | SCV-004 | Given values that create rounding residuals, when phasing completes, then final cumulative totals reconcile within policy and any residual adjustment is explicit. |
| AT-EVM-001 | EVM-001 | Given a verified baseline and update, when EVM calculates, then PV, EV, AC, SV, CV, SPI, CPI, BAC, and percentages match independent calculations. |
| AT-EVM-002 | EVM-002 | Given valid and edge-case EVM inputs, when forecast methods run, then each EAC, ETC, VAC, and TCPI result matches its formula and is labeled by method. |
| AT-EVM-003 | EVM-003 | Given zero denominators and missing baseline or actual cost, when metrics are requested, then undefined values show `not available` with the specific reason rather than zero or infinity. |
| AT-CSH-001 | CSH-001 | Given billing, lag, advance, recovery, retention, release, and tax rules, when planned and actual cash flow generates, then movements occur in the correct periods and reconcile to contract totals. |

## 15. Productivity and resources

| Test ID | Requirement | Written acceptance scenario |
|---|---|---|
| AT-PRD-001 | PRD-001 | Given quantity, crew composition, and planned output basis, when duration derives, then unit conversion and working calendar produce the expected duration and reversible calculation basis. |
| AT-PRD-002 | PRD-002 | Given complete and incomplete daily production records with evidence, when saved, then required fields, attachment limits, references, and audit metadata are enforced. |
| AT-PRD-003 | PRD-003 | Given output, labor hours, equipment hours, cost, and availability, when metrics calculate, then all documented productivity and utilization ratios match reference results. |
| AT-PRD-004 | PRD-004 | Given productivity history, when latest, rolling, weighted, and manual forecasts run, then remaining duration and cost match the selected method and disclose the sample window. |
| AT-RES-001 | RES-001 | Given labor, equipment, material, and cost resources with assignments, when saved and time-phased, then units, rates, calendars, total units, and costs reconcile. |
| AT-RES-002 | RES-002 | Given varying availability and demand, when histograms generate, then each period shows correct demand and over-allocation is flagged without changing assignments. |

## 16. Import, export, and interoperability

| Test ID | Requirement | Written acceptance scenario |
|---|---|---|
| AT-IO-001 | IO-001 | Given a project containing all supported records and optional attachments, when exported, deleted, and imported on another supported runtime, then authoritative data, versions, checksums, and selected snapshots are identical. |
| AT-IO-002 | IO-002 | Given valid, corrupted, oversized, duplicate-ID, unsupported-version, and checksum-failing bundles, when imported, then validation completes before mutation and each failure has a stable actionable error. |
| AT-IO-003 | IO-003 | Given localized CSV and XLSX templates, when exported and re-imported, then structured values preserve types and a CSV fallback remains available. |
| AT-IO-004 | IO-004 | Given an external schedule containing supported and unsupported fields, when an adapter imports it, then supported data maps deterministically and every omitted or transformed field appears in a conversion report. |
| AT-IO-005 | IO-005 | Given large portrait and landscape reports, when exported to PDF and print, then repeated runs are stable, headers repeat, pages number correctly, tables do not silently truncate, and metadata is present. |

## 17. Settings and accessibility

| Test ID | Requirement | Written acceptance scenario |
|---|---|---|
| AT-SET-001 | SET-001 | Given stored numeric and date values, when locale, currency display, precision, units, and first day of week change, then presentation changes without mutating authoritative stored values. |
| AT-SET-002 | SET-002 | Given light, dark, system, high-contrast, and color-vision conditions, when status states display, then meaning remains perceivable without color alone and system preference changes apply safely. |
| AT-SET-003 | SET-003 | Given keyboard-only, screen-reader, 200% zoom, reduced-motion, and high-contrast operation, when core workflows are completed, then no essential action or information is inaccessible and charts have tabular alternatives. |

## 18. Audit and explainability

| Test ID | Requirement | Written acceptance scenario |
|---|---|---|
| AT-AUD-001 | AUD-001 | Given create, edit, import, calculate, baseline, restore, and migration actions, when audit history is inspected, then each event has correct timestamp, operation, entity, source, and available actor/device metadata. |
| AT-AUD-002 | AUD-002 | Given successful, cancelled, stale, and failed calculation runs, when records are inspected, then engine version, project revision, status date, calendar revision, settings hash, warnings, and status are complete. |
| AT-AUD-003 | AUD-003 | Given a permitted manual override, when entered, reported, exported, and later removed, then it is visually distinct, reasoned, audited, and never indistinguishable from engine output. |

## 19. Enterprise cross-cutting acceptance tests

The following tests apply to every release and do not replace feature-level tests.

| Test ID | Area | Written acceptance scenario |
|---|---|---|
| AT-ENT-001 | Traceability | Given the documentation and automated test inventory, when CI runs the traceability check, then every mandatory requirement maps to at least one active written test and no orphaned acceptance test exists. |
| AT-ENT-002 | Determinism | Given the same normalized project, engine version, and settings on two supported devices, when calculations run repeatedly, then authoritative outputs and warnings are byte-equivalent after canonical serialization. |
| AT-ENT-003 | Isolation | Given one corrupted project and several valid projects, when the application starts, then valid projects remain usable and corruption is isolated with recovery options. |
| AT-ENT-004 | Upgrade | Given every supported prior schema version, when upgraded to the release candidate, then migration is atomic, repeatable, and produces the approved canonical fixture. |
| AT-ENT-005 | Downgrade protection | Given a project written by a newer unsupported schema, when opened, then the application refuses destructive write access and offers safe export or read-only guidance. |
| AT-ENT-006 | Data-loss drill | Given forced termination during every authoritative write class, when restarted, then the last complete revision is recoverable and no operation produces silent partial authority. |
| AT-ENT-007 | Offline | Given airplane mode before launch, when every core workflow executes, then no network dependency blocks use and no hidden retry loop degrades performance. |
| AT-ENT-008 | Accessibility | Given the supported assistive-technology matrix, when critical workflows run, then there are no critical accessibility violations and completion is possible without a pointer. |
| AT-ENT-009 | Security | Given the malicious file and attachment corpus, when imports and previews run, then no payload executes, resource limits hold, and failure is isolated before project mutation. |
| AT-ENT-010 | Performance | Given each declared benchmark profile, when the approved scenario suite runs, then all hard budgets pass and no release-regression threshold is exceeded. |
| AT-ENT-011 | Recovery | Given damaged indexes with intact authoritative records, when repair runs, then derived state is rebuilt without changing authoritative content. |
| AT-ENT-012 | Supportability | Given a reproducible failure, when a support bundle is exported, then it contains versioned diagnostics and redacts project content and personal data by default. |

## 20. Gherkin template

Every acceptance test must be expanded using this structure:

```gherkin
Feature: <requirement title>
  Rule: <normative invariant>

  Scenario: <primary user outcome>
    Given <controlled project state>
    And <runtime, offline, locale, and calendar conditions>
    When <one user or system action occurs>
    Then <observable authoritative result>
    And <validation, audit, accessibility, and recovery evidence>
    And <performance remains within the declared budget>
```

## 21. CI enforcement

CI must fail when:

- A mandatory requirement ID has no acceptance test.
- A feature pull request changes a requirement but not its tests.
- An automated test references a removed or unknown requirement.
- A release candidate contains skipped mandatory acceptance tests without an approved risk record.
- Traceability files contain duplicate IDs.

The generated traceability report must be attached to every release candidate.