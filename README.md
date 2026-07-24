# CPM — Enterprise Construction Planning and Project Controls

CPM is an offline-first construction planning and project-controls application. It combines scheduling, quantities, estimating, progress, cost control, risk, productivity, resources, reporting, audit, and recovery in one portable local project model.

> **Current executable milestone:** Phases 0–9. The installable PWA now covers the professional offline project-controls workflow from project setup and CPM through BOQ, S-curves, EVM, PERT, field productivity, resource capacity, enterprise reports, and privacy-safe diagnostics.

## Implemented application capabilities

### Offline project management

- Create, open, rename, duplicate, archive, trash, restore, and permanently delete projects.
- Transactional IndexedDB persistence with revisions, command journal, snapshots, and corrupt-record quarantine.
- Storage health, checksummed `.cpmproj` export, staged import, and recovery workflows.
- IndexedDB Version 5 and Project Schema Version 4 migrations, including stored recovery snapshots.

### Calendars, WBS, activities, and CPM

- Multiple minute-resolution calendars with split shifts, holidays, exceptions, and timezone-stable dates.
- Hierarchical WBS, tasks, milestones, summary activities, constraints, deadlines, notes, and custom fields.
- Virtualized editing grid, filtering, sorting, bulk edit, CSV preview, and undo/redo.
- FS, SS, FF, and SF with leads/lags, forward/backward pass, float, criticality, driving logic, and health findings.
- Worker-based deterministic calculation with revision binding, cancellation, timeout, crash recovery, and stale-result rejection.

### Professional views, baselines, and progress

- Synchronized professional Gantt and deterministic WBS-grouped network views.
- Critical-path and focused ancestor/descendant isolation with accessible tabular alternatives.
- Immutable original/revised baselines, explicit status date, actual dates, remaining duration, and four progress methods.
- Retained-logic and progress-override handling, out-of-sequence detection, forecast finish, variance, and weekly update snapshots.
- Critical path, float, logic, milestone, and configurable look-ahead reports.

### BOQ and estimating

- Hierarchical BOQ with material, labor, equipment, subcontract, and miscellaneous unit-price components.
- Waste-aware resource analysis, manual rates, explicit markup waterfall, and BOQ-to-activity allocations.
- Visible balanced, under-allocated, and over-allocated states.
- Immutable estimate revisions, comparison, and formula-safe CSV export.

### Cost loading, S-curves, EVM, and cash flow

- BOQ-derived or manually overridden activity budgets.
- Uniform, front-loaded, back-loaded, bell, custom-weight, and milestone phasing.
- Daily, weekly, monthly, and fiscal planned-early, planned-late, actual, earned, and forecast curves.
- PV, EV, AC, SV, CV, SPI, CPI, BAC, EAC, ETC, VAC, and TCPI.
- Undefined ratios display as unavailable rather than zero or infinity.
- Billing lag, mobilization advance, recovery, retention, retention release, and tax cash-flow rules.
- Budget-allocation completeness and calculation-assumption disclosure.

### PERT, risk, productivity, and resources

- Three-point PERT estimates, expected duration, variance, standard deviation, target probability, warnings, and sensitivity ranking.
- Risk register with expected cost and schedule exposure.
- Productivity plans and field records with compatible-unit conversion, labor/equipment rates, and remaining-duration forecast.
- Labor, equipment, material, and cost resources with assignments, daily histograms, utilization, and over-allocation findings.
- Bounded field-evidence metadata with per-record and per-project safety limits.

### Enterprise reporting, audit, and diagnostics

- Configurable dashboards with explicit complete, partial, and unavailable states.
- Executive, update, schedule, BOQ, cash-flow, EVM, productivity, resource, risk, change, and audit report inputs.
- Immutable report snapshots bound to one revision, status date, calculation engine, and stable input hash.
- Formula inspector for core schedule-control formulas and undefined conditions.
- Authoritative command registry, unmapped-command findings, and reasoned manual overrides.
- Downloadable local support bundles with recursive privacy and credential redaction.

## Enterprise engineering rules

- Every normative feature maps to written acceptance tests.
- Authoritative calculations remain outside React components.
- Core workflows work without an account or network connection.
- Authoritative writes use transactions and recovery records.
- Imported files are untrusted and validated before commit.
- Undefined calculations are never silently represented as zero.
- Accessibility, performance, data portability, privacy, audit, and recovery are release gates.

## Development

Requirements: Node.js 22.12 or newer.

```bash
npm install
npm run dev
npm run test
npm run build
```

`npm run check` runs the full test suite and production build.

## Current tests

The automated suite covers lifecycle transactions and rollback, recovery, portable-file integrity, calendars, command undo/redo, CPM logic and performance, professional views, reports, baselines, progress, BOQ calculations, cost curves, EVM, cash flow, PERT probability, unit conversion, risk exposure, productivity, resource reconciliation, report immutability, audit mapping, support-bundle redaction, cross-module reference cleanup, requirement traceability, and large-project/report safety guards.

See [Application implementation status](docs/20_IMPLEMENTATION_STATUS.md), [Phases 1–3 release notes](docs/21_PHASES_1_3_RELEASE_NOTES.md), [Phases 4–6 release notes](docs/22_PHASES_4_6_RELEASE_NOTES.md), and [Phases 7–9 release notes](docs/23_PHASES_7_9_RELEASE_NOTES.md).

## Documentation

### Foundation specification

1. [Product vision and scope](docs/01_PRODUCT_VISION_AND_SCOPE.md)
2. [Functional requirements](docs/02_FUNCTIONAL_REQUIREMENTS.md)
3. [Calculation specification](docs/03_CALCULATION_SPECIFICATION.md)
4. [Architecture and offline storage](docs/04_ARCHITECTURE_AND_OFFLINE_STORAGE.md)
5. [Data model and project file format](docs/05_DATA_MODEL_AND_FILE_FORMAT.md)
6. [User experience, workflows, and reports](docs/06_UX_REPORTS_AND_WORKFLOWS.md)
7. [Quality, security, and testing](docs/07_QUALITY_SECURITY_AND_TESTING.md)
8. [Implementation roadmap](docs/08_IMPLEMENTATION_ROADMAP.md)
9. [Glossary and formula reference](docs/09_GLOSSARY_AND_FORMULAS.md)

### Enterprise specification and evidence

10. [Enterprise product standard](docs/10_ENTERPRISE_PRODUCT_STANDARD.md)
11. [Requirement-to-test traceability](docs/11_REQUIREMENT_TEST_TRACEABILITY.md)
12. [Performance engineering](docs/12_PERFORMANCE_ENGINEERING.md)
13. [Security, privacy, and compliance](docs/13_SECURITY_PRIVACY_AND_COMPLIANCE.md)
14. [Enterprise UX and design system](docs/14_ENTERPRISE_UX_DESIGN_SYSTEM.md)
15. [Reliability, observability, and operations](docs/15_RELIABILITY_OBSERVABILITY_AND_OPERATIONS.md)
16. [Enterprise data, interoperability, and synchronization](docs/16_ENTERPRISE_DATA_INTEROPERABILITY_AND_SYNC.md)
17. [Engineering governance and delivery](docs/17_ENGINEERING_GOVERNANCE_AND_DELIVERY.md)
18. [Enterprise reference architecture](docs/18_ENTERPRISE_REFERENCE_ARCHITECTURE.md)
19. [Enterprise implementation roadmap](docs/19_ENTERPRISE_IMPLEMENTATION_ROADMAP.md)
20. [Application implementation status](docs/20_IMPLEMENTATION_STATUS.md)
21. [Phases 1–3 release notes](docs/21_PHASES_1_3_RELEASE_NOTES.md)
22. [Phases 4–6 release notes](docs/22_PHASES_4_6_RELEASE_NOTES.md)
23. [Phases 7–9 release notes](docs/23_PHASES_7_9_RELEASE_NOTES.md)

Architecture decisions are recorded in [`adr/`](adr/).

## Explicit current boundaries

The next milestone is Phase 10 enterprise-quality offline release qualification. Dedicated deterministic PDF rendering, arbitrary-precision financial storage, selectable advanced productivity forecasting, Monte Carlo risk, automatic resource leveling, fully actualized data-date CPM, full malicious-file corpus, browser/device matrix, WCAG audit, soak tests, SBOM/provenance, and release evidence remain outstanding.

## License

A license has not yet been selected. Add an explicit license and contribution policy before accepting external contributions or distributing production builds.
