# Functional Requirements

## 1. Requirement conventions

The terms **must**, **should**, and **may** indicate mandatory, recommended, and optional behavior. Each feature must be implemented with validation, offline behavior, export behavior, accessibility, and tests.

Requirement identifiers are stable references for issues, pull requests, test cases, and release notes.

## 2. Project library and lifecycle

### PRJ-001 — Local project library

The application must show all locally stored projects with title, last modified date, status date, planned finish, file/schema version, thumbnail or summary, and health warnings.

### PRJ-002 — Project creation

A project wizard must collect at least project title, start date, default calendar, hours per day, currency, precision, and default units. A user may start from blank data, a template, CSV, or a portable project file.

### PRJ-003 — Safe project operations

Rename, duplicate, archive, export, and delete actions must be available. Deletion must require confirmation and create a recoverable trash entry or snapshot before permanent removal.

### PRJ-004 — Autosave and recovery

Changes must be committed locally without an explicit Save button. The interface must indicate saving, saved, validation warning, and failure states. Interrupted writes must not leave a partially valid project.

### PRJ-005 — Snapshots

Users must be able to create named project snapshots, inspect snapshot metadata, restore a copy, and compare key totals and dates before replacement.

### PRJ-006 — Project health

A project health panel must identify missing predecessors/successors, open ends, loops, duplicate IDs, invalid calendars, impossible actual dates, negative costs or quantities, unassigned costs, stale status dates, and damaged references.

## 3. Calendars and time rules

### CAL-001 — Multiple calendars

Projects must support multiple calendars assigned to activities and resources. A default project calendar is required.

### CAL-002 — Work patterns

A calendar must define working weekdays, shifts, daily working intervals, standard hours per day, holidays, and date-specific exceptions.

### CAL-003 — Calendar arithmetic

All date calculations must use working-time arithmetic. Adding five days means five working days under the applicable calendar, not five elapsed dates.

### CAL-004 — Time granularity

The initial UI may display days, but the engine should represent time at minute resolution or another documented smallest unit to allow half-day and shift schedules without schema replacement.

### CAL-005 — Timezones

Project dates must be interpreted using the project timezone. Date-only values should not drift when a file is opened in another device timezone.

## 4. Work breakdown structure and coding

### WBS-001 — Hierarchical WBS

Users must be able to create, reorder, indent, outdent, rename, and delete WBS nodes. Deleting a WBS node containing activities must require reassignment or explicit cascade confirmation.

### WBS-002 — Activity IDs

Activity IDs must be unique within a project, editable, searchable, and validated. Internal immutable UUIDs must remain separate from user-facing IDs.

### WBS-003 — Coding dictionaries

The project should support activity codes for discipline, phase, location, contractor, responsible party, work package, and user-defined classifications.

### WBS-004 — Custom fields

Users may define text, number, date, boolean, select, and formula-display custom fields. Custom formulas must not override authoritative engine fields.

## 5. Activity management

### ACT-001 — Supported activity types

The initial schedule must support task-dependent activities, start milestones, finish milestones, and summary rows. Level-of-effort and hammock activities may be added after the base engine is stable.

### ACT-002 — Activity fields

Each activity must support user ID, name, WBS, type, original duration, remaining duration, calendar, progress method, notes, codes, responsible party, constraints, deadline, PERT estimates, resource assignments, cost assignments, and audit metadata.

### ACT-003 — Bulk editing

The activity table must support keyboard navigation, copy/paste, fill down, column selection, filtering, sorting, multi-row edits, and undo/redo.

### ACT-004 — Validation

Durations, dates, progress values, costs, and relationship lags must be validated before calculation. Invalid rows must be highlighted without silently discarding data.

### ACT-005 — Import mapping

CSV/XLSX import must show a field-mapping preview, duplicate-ID policy, date format, delimiter, decimal separator, and validation report before committing data.

## 6. Logic relationships

### LOG-001 — Relationship types

The engine must support Finish-to-Start, Start-to-Start, Finish-to-Finish, and Start-to-Finish relationships.

### LOG-002 — Leads and lags

Relationships must support positive lag and negative lag/lead. Negative lag should trigger a configurable warning because it can reduce transparency.

### LOG-003 — Multiple links

An activity may have multiple predecessors and successors, including multiple links between the same pair when relationship types differ. Duplicate identical links must be rejected.

### LOG-004 — Loop detection

The application must detect circular logic before calculation, identify at least one loop path, and prevent authoritative schedule output until resolved.

### LOG-005 — Open-end detection

Activities without predecessors or successors must be reported, excluding legitimate project start/finish milestones and user-approved exceptions.

### LOG-006 — Driving logic

The calculated model must identify which relationship or constraint drives each early and late date. Network and table views must expose driving links.

## 7. CPM scheduling

### CPM-001 — Forward pass

The engine must calculate early start and early finish using applicable calendars, relationship type, lag, constraints, actual dates, and status-date rules.

### CPM-002 — Backward pass

The engine must calculate late start and late finish from the selected project completion target or calculated finish.

### CPM-003 — Float

The engine must calculate total float and free float. Other float measures may be added if their definitions are documented.

### CPM-004 — Criticality

The default critical threshold is total float less than or equal to zero, but users must be able to configure a near-critical threshold. Negative float must be distinct from zero-float criticality.

### CPM-005 — Multiple paths

The application must trace and display multiple critical or near-critical paths, not merely color all zero-float activities without path continuity.

### CPM-006 — Constraints

Supported constraints should include as-soon-as-possible, as-late-as-possible, start-no-earlier-than, start-no-later-than, finish-no-earlier-than, finish-no-later-than, must-start-on, and must-finish-on. Hard constraints must produce visible warnings.

### CPM-007 — Project finish logic

The schedule should use an explicit project finish milestone. If missing, the engine may derive finish from terminal activities but must report the open-ended condition.

### CPM-008 — Recalculation

Calculation must be deterministic, cancellable for large projects, and run outside the main UI thread. Previous valid results must remain visible until new results are committed.

## 8. Baselines and progress updating

### BAS-001 — Baseline creation

Users must be able to freeze an approved schedule/cost baseline containing dates, durations, quantities, costs, and time-phased values.

### BAS-002 — Multiple baselines

The project should support an original baseline and additional approved revisions. One baseline is designated as the comparison baseline.

### BAS-003 — Status date

Every update must use an explicit status/data date. Reports must not mix progress records from one date with schedule calculations from another without warning.

### BAS-004 — Actuals

Activities must support actual start, actual finish, remaining duration, suspended intervals, and actual quantities/costs. Actual finish requires actual start.

### BAS-005 — Progress methods

Supported methods should include duration percent complete, physical percent complete, units/quantity complete, weighted milestones, and 0/100, 20/80, 50/50 rules.

### BAS-006 — Out-of-sequence progress

The engine must identify work performed before logical predecessors are complete. The selected handling rule must be documented; initial support should include retained logic and progress override modes.

### BAS-007 — Variance

The application must calculate start variance, finish variance, duration variance, float variance, quantity variance, and cost variance against the selected baseline.

## 9. Gantt, network, and schedule views

### UI-001 — Activity grid

The grid must support frozen identifying columns, configurable columns, grouping, saved filters, row density, zoom, and visible distinction between input, calculated, actual, baseline, and warning fields.

### UI-002 — Gantt chart

The Gantt must show planned, baseline, actual, remaining, milestones, progress, relationships, float, criticality, and status date. Users must be able to zoom from days to years.

### UI-003 — Network diagram

The network view must show activity nodes and relationship arrows with type/lag, critical and driving links, WBS grouping, path isolation, and automatic layout with manual position preservation.

### UI-004 — Look-ahead

Users must be able to generate configurable look-ahead periods such as 2, 3, 4, or 6 weeks including planned starts/finishes, overdue work, required predecessors, quantities, resources, and constraints.

### UI-005 — Search and filters

All major modules must support global search, field filters, date windows, WBS filters, saved views, and reset-to-default behavior.

## 10. PERT and risk

### PERT-001 — Three-point estimates

Activities may store optimistic, most likely, and pessimistic durations. Validation requires O ≤ M ≤ P unless the user explicitly corrects the inputs.

### PERT-002 — Expected duration

The application must calculate weighted expected duration and variance using the documented PERT formulas.

### PERT-003 — Path probability

Users must be able to enter a target completion date or duration and obtain the approximate probability of completion for a selected path or project.

### PERT-004 — Assumption warnings

Probability output must disclose normal-distribution approximation, independence assumptions, path-switching limitations, and whether deterministic CPM or PERT expected durations are currently driving the displayed schedule.

### RSK-001 — Risk register

Risks should include probability, impact, owner, response, status, trigger, linked activities, linked BOQ/cost accounts, and residual assessment.

### RSK-002 — Future Monte Carlo

The architecture must reserve inputs for distributions, correlation groups, iterations, random seed, and percentile outputs without requiring them in the initial release.

## 11. BOQ and estimating

### BOQ-001 — Hierarchical items

A BOQ must support sections, measurable items, optional alternates, provisional sums, and notes.

### BOQ-002 — Quantity and rate

Each measurable item must store quantity, unit, base unit rate, waste factor, adjusted unit rate, and amount with configurable precision.

### BOQ-003 — Resource breakdown

Unit-price analysis must support material, labor, equipment, subcontract, and miscellaneous components with consumption coefficients and prices.

### BOQ-004 — Markups

The estimate must support direct cost, site overhead, home-office overhead, profit, contingency, tax, bonds/insurance, escalation, and user-defined markup layers with an explicit calculation order.

### BOQ-005 — Linkage

BOQ items may be linked to one or more activities using allocation weights. Allocations must sum to 100% or report unallocated amounts.

### BOQ-006 — Revisions

The application must compare BOQ revisions by item ID and show added, removed, quantity-changed, rate-changed, and amount-changed items.

## 12. S-curves, cash flow, and EVM

### SCV-001 — Time phasing

Planned quantities, costs, labor-hours, and equipment-hours must be spread across activity working periods using selectable distributions: uniform, front-loaded, back-loaded, bell-shaped, custom weights, or milestone-based.

### SCV-002 — Periods

Curves must support daily, weekly, monthly, and custom fiscal periods. Weekly aggregation must state the first day of week.

### SCV-003 — Curve types

The application must generate incremental and cumulative planned, earned, actual, forecast, early, and late curves where data permits.

### SCV-004 — Reconciliation

The final cumulative value must reconcile to the authoritative total within documented rounding tolerance. Any variance must be reported.

### EVM-001 — Core metrics

The engine must calculate PV, EV, AC, SV, CV, SPI, CPI, BAC, percent planned, percent complete, and percent spent.

### EVM-002 — Forecasts

The engine should calculate EAC using at least BAC/CPI, AC + (BAC−EV), and AC + (BAC−EV)/(CPI×SPI), plus ETC, VAC, and TCPI.

### EVM-003 — Missing data

Undefined ratios, zero denominators, missing AC, or incomplete baseline data must produce `not available` with a reason rather than misleading zero values.

### CSH-001 — Cash flow

Cash flow should support owner billing, payment lag, mobilization advance, recovery, retention, release of retention, tax, and planned versus actual cash movements.

## 13. Productivity and resources

### PRD-001 — Planned productivity

Users must be able to define expected output per crew-hour, labor-hour, equipment-hour, or working day and derive activity duration from quantity and production rate.

### PRD-002 — Daily records

A productivity entry must record date/shift, activity, location, quantity completed, labor hours, equipment hours, downtime, delay reason, weather, remarks, and evidence attachments or links.

### PRD-003 — Actual productivity

The engine must calculate output per labor-hour, labor-hours per unit, output per equipment-hour, cost per unit, and utilization where inputs exist.

### PRD-004 — Forecasting

The application must forecast remaining duration and cost from recent productivity using user-selected methods such as latest period, rolling average, weighted average, or manual forecast.

### RES-001 — Resources

Resources must support category, unit, availability, rate, calendar, code, and notes. Assignments must support units per time, total units, cost, and planned curve.

### RES-002 — Histograms

The application must generate resource demand histograms and flag demand above availability.

## 14. Import, export, and interoperability

### IO-001 — Portable project file

Users must be able to export and import a complete `.cpmproj` bundle containing all authoritative project data, settings, baselines, snapshots selected for inclusion, and optional attachments.

### IO-002 — Validation before import

The importer must verify container integrity, manifest, schema version, IDs, required fields, checksums, and file-size limits before modifying local storage.

### IO-003 — Tabular exchange

CSV import/export is mandatory. XLSX import/export should be supported for structured templates while preserving a CSV fallback.

### IO-004 — External schedule formats

Future adapters may support Microsoft Project XML and Primavera-compatible exchange. Imported unsupported fields must be listed in a conversion report.

### IO-005 — Reports

PDF and print exports must be stable and repeatable. Large tables must support page headers, continued headings, page numbers, and landscape formats.

## 15. Settings and accessibility

### SET-001 — Units and locale

Users must be able to select date format, decimal separator, currency, number precision, duration unit, first day of week, and measurement system without changing stored numeric values.

### SET-002 — Appearance

Light, dark, and system themes should be available. Criticality and warning states must not rely on color alone.

### SET-003 — Accessibility

Core workflows must be keyboard operable, screen-reader labeled, high-contrast compatible, and usable at 200% zoom. Charts need tabular alternatives.

## 16. Audit and explainability

### AUD-001 — Change metadata

Created, modified, imported, calculated, baselined, and restored events must be timestamped with local actor/device identifiers where available.

### AUD-002 — Calculation record

Every authoritative calculation run must store engine version, project revision, status date, calendar revision, settings hash, warnings, and completion status.

### AUD-003 — Manual overrides

Any manual override of a calculated-looking field must be clearly labeled, include a reason, and remain distinguishable in reports.

## 17. Acceptance rule

A feature is not complete until its formulas, validation, offline behavior, file behavior, migration impact, undo/redo behavior, accessibility, error handling, tests, sample data, and user documentation are defined and verified.
