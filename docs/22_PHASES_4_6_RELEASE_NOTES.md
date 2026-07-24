# Phases 4–6 Release Notes

## Scope

This milestone extends the offline CPM application from core scheduling into professional visualization, schedule control, and integrated estimating:

1. Phase 4 — Gantt, network, and schedule reports.
2. Phase 5 — baselines and progress control.
3. Phase 6 — BOQ and estimating.

The three phases share Project Schema Version 3 so every baseline, progress record, report input, BOQ item, resource component, markup, allocation, and estimate revision remains inside the authoritative portable project model.

## Phase 4 — Gantt, network, and schedule reports

Delivered:

- Synchronized professional Gantt linked to activity selection.
- Planned bars, baseline bars, progress overlays, float lines, milestones, constraints/deadlines, and status-date marker.
- Zoom controls and horizontally scrollable large-schedule canvas.
- Accessible Gantt data-table alternative.
- Deterministic layered network layout.
- Critical-only and focused ancestor/descendant path isolation.
- WBS grouping, orthogonal relationship paths, logic labels, and accessible relationship list.
- Critical path, float, logic, milestone, and configurable look-ahead reports.
- Revision, status-date, calculation-engine, and generation provenance on every report.
- CSV export with formula-injection protection.
- Stable browser print layout suitable for Print to PDF.

## Phase 5 — Baselines and progress control

Delivered:

- Immutable original and revised baselines created from a calculated project revision.
- Active baseline selection without rewriting historical records.
- Explicit project status date.
- Actual starts, actual finishes, remaining duration, physical progress, unit progress, milestone progress, and suspension storage.
- Duration, physical, units, and milestone percent-complete methods.
- Retained-logic and progress-override out-of-sequence policies.
- Out-of-sequence detection from predecessor completion state.
- Forecast finish calculation and baseline start/finish variance.
- Weighted overall project progress.
- Reproducible weekly update snapshots containing status date, revision, and progress records.
- Gantt baseline and progress overlays linked to the same authoritative records.

## Phase 6 — BOQ and estimating

Delivered:

- Hierarchical BOQ sections and editable quantity items.
- Decimal quantity, unit, manual unit rate, and calculated amount fields.
- Material, labor, equipment, subcontract, and miscellaneous resource components.
- Quantity-per-unit, unit cost, and explicit waste calculations.
- Ordered markup waterfall with direct-cost or running-subtotal basis.
- BOQ-to-activity percentage allocations.
- Explicit balanced, under-allocated, and over-allocated states without silent normalization.
- Estimate totals and allocation findings.
- Immutable estimate revisions and revision comparison.
- CSV estimate export with spreadsheet-formula protection.
- Reference-project BOQ with excavation, concrete, and structural-frame items.

## Data compatibility

- IndexedDB schema: Version 4.
- Project record schema: Version 3.
- Application package: Version 0.6.0.
- CPM engine remains `0.3.0-calendar-cpm` because Phases 4–6 consume, rather than alter, authoritative CPM date calculations.
- Portable file envelope remains Version 1 and now reports contained baseline, progress, update, BOQ, revision, and report-definition counts.

Version 4 migrates Version 2 project records to Project Schema Version 3 by adding a status date, empty progress/baseline/update collections, and an empty BOQ model. Existing schedules, calendars, WBS, logic, snapshots, and journals remain intact.

## Validation evidence

The milestone adds acceptance tests `P4-AT-001` through `P6-AT-006`, covering deterministic network layout, path isolation, report structures and provenance, look-ahead filtering, CSV safety, baseline immutability, progress methods, actual-date validation, out-of-sequence handling, weekly snapshots, unit-rate calculations, markup order, allocation states, revision comparison, and BOQ CSV safety.

CI must pass the complete existing suite, the new Phase 4–6 tests, strict TypeScript validation, the 10,000-activity CPM guard, and the production PWA build.

## Known limitations

- Print/PDF uses the browser print engine; a dedicated PDF rendering worker and snapshot regression corpus remain future enterprise-reporting work.
- Network layout is deterministic and path-oriented but does not yet support manual node positions or very-large-network level-of-detail rendering.
- Progress forecasting records retained-logic and progress-override behavior but does not yet rewrite the authoritative CPM engine around actualized data dates.
- BOQ calculations use controlled decimal rounding over JavaScript numbers; arbitrary-precision decimal storage remains a later financial-hardening option.
- XLSX import/export, assemblies, reusable price libraries, and bid-comparison workflows remain later enhancements.
