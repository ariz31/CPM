# CPM — Enterprise Construction Planning and Project Controls

CPM is an offline-first construction planning and project-controls application. It combines safe project lifecycle management, calendars, WBS and activity planning, relationship logic, Critical Path Method calculation, professional schedule visualization, baselines and progress control, and BOQ estimating in one portable local project model.

> **Current executable milestone:** Phases 0–6. The installable PWA now covers safe local projects, portable files, calendar-aware CPM, professional Gantt/network/reporting, baselines and weekly progress updates, and integrated BOQ estimating.

## Implemented application capabilities

### Offline project management

- Create, open, rename, duplicate, archive, trash, restore, and permanently delete projects.
- Transactional IndexedDB persistence with revisions, command journal, snapshots, and corrupt-record quarantine.
- Storage health and quota visibility.
- Checksummed `.cpmproj` export and staged import.
- IndexedDB Version 4 and Project Schema Version 3 migrations.

### Calendars, WBS, activities, and CPM

- Multiple calendars with workweeks, split shifts, holidays, exceptions, standard hours, and timezone metadata.
- Hierarchical WBS, tasks, milestones, summary activities, notes, custom fields, constraints, and deadlines.
- Virtualized grid, filters, sorting, bulk edit, CSV import preview, and undo/redo.
- FS, SS, FF, and SF with leads/lags, calendar-aware forward/backward pass, total/free float, criticality, driving logic, and schedule-health findings.
- Web Worker calculation with revision binding, cancellation, timeout, crash recovery, and stale-result rejection.

### Professional Gantt, network, and reports

- Synchronized Gantt with planned and baseline bars, progress overlay, float, milestones, deadlines, zoom, and status-date marker.
- Accessible tabular Gantt alternative.
- Deterministic layered network with WBS groups, critical-only mode, and focused ancestor/descendant isolation.
- Critical path, float, logic, milestone, and configurable look-ahead reports.
- Formula-safe CSV output and stable browser Print/PDF foundation with revision provenance.

### Baselines and progress control

- Immutable original and revised baselines.
- Explicit status date and active baseline.
- Actual starts/finishes, remaining duration, suspensions, notes, and four progress methods.
- Retained-logic and progress-override out-of-sequence policies.
- Out-of-sequence detection, forecast finish, weighted progress, and baseline variance.
- Reproducible weekly update snapshots.

### BOQ and estimating

- Hierarchical BOQ sections and quantity items.
- Material, labor, equipment, subcontract, and miscellaneous resource components.
- Waste-aware unit-price analysis, manual unit rates, amounts, and ordered markup waterfall.
- BOQ-to-activity percentage allocations with explicit under/over allocation states.
- Immutable estimate revisions and comparison.
- Formula-safe BOQ CSV export.

## Enterprise engineering rules

- Every normative feature maps to written acceptance tests.
- Authoritative calculations remain outside React components.
- Core workflows work without an account or network connection.
- Authoritative writes use transactions and recovery records.
- Imported files are treated as untrusted and validated before commit.
- Accessibility, performance, data portability, and recovery are release gates.

## Development

Requirements: Node.js 22.12 or newer.

```bash
npm install
npm run dev
npm run test
npm run build
```

`npm run check` runs the test suite and production build.

## Current tests

The automated suite covers calendar arithmetic, lifecycle transactions, rollback injection, snapshots, quarantine, portable-file checksums, CSV atomicity and injection protection, command undo/redo, all four relationship types, graph validation, constraints, float, determinism, stale worker responses, network layout, report provenance, look-ahead filtering, baseline immutability, progress methods, actual-date validation, out-of-sequence logic, weekly updates, BOQ calculations, markup order, allocation findings, estimate revisions, traceability, and a 10,000-activity performance guard.

See [Application implementation status](docs/20_IMPLEMENTATION_STATUS.md), [Phases 1–3 release notes](docs/21_PHASES_1_3_RELEASE_NOTES.md), and [Phases 4–6 release notes](docs/22_PHASES_4_6_RELEASE_NOTES.md).

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

### Enterprise specification

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

Architecture decisions are recorded in [`adr/`](adr/).

## Explicit current boundaries

The application does not yet include cost-loaded S-curves and EVM, PERT and risk, field productivity, resource histograms/leveling, or the complete enterprise reporting/audit phase. Dedicated deterministic PDF rendering, arbitrary-precision financial storage, manual network positions, and fully actualized data-date CPM remain later hardening work.

## License

A license has not yet been selected. Add an explicit license and contribution policy before accepting external contributions or distributing production builds.
