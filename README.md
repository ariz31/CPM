# CPM — Enterprise Construction Planning and Project Controls

CPM is an offline-first construction planning and project-controls application. It combines project lifecycle management, calendars, WBS and activity planning, relationship logic, and Critical Path Method calculation in one local project model.

> **Current executable milestone:** Phases 0–3. The repository contains a working installable PWA with safe local projects, portable project files, calendar and activity editing, and a calendar-aware CPM engine. Later control, cost, risk, and reporting modules remain under development.

## Implemented application capabilities

### Offline project management

- Create, open, rename, duplicate, archive, trash, restore, and permanently delete projects.
- Transactional IndexedDB persistence with revisions and a command journal.
- Named, recovery, pre-import, and pre-delete snapshots.
- Corrupted-project quarantine so one damaged record cannot block the library.
- Storage health and quota visibility.
- Checksummed `.cpmproj` export and staged import.

### Calendars, WBS, and activities

- Multiple calendars with workweeks, split shifts, holidays, exceptions, standard hours, and timezone metadata.
- Minute-resolution working-time arithmetic.
- Hierarchical WBS records and activity codes.
- Task, milestone, and summary activity types.
- Inline activity editing, selection, filtering, sorting, bulk calendar assignment, CSV import preview, and undo/redo.

### CPM and schedule health

- FS, SS, FF, and SF relationships with leads and lags.
- Missing-reference, duplicate-link, self-link, cycle, and open-end checks.
- Calendar-aware forward and backward passes.
- Total float, free float, critical and near-critical classification.
- Constraints, deadlines, explicit project finish behavior, and driving relationship records.
- Web Worker calculation with request revisions, cancellation, timeouts, crash recovery, and stale-result rejection.
- Schedule health, relationship editing, and timeline preview.

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

The automated suite covers calendar arithmetic, lifecycle transactions, rollback injection, snapshots, quarantine, portable-file checksums and round trips, CSV atomicity, command undo/redo, all four relationship types, graph validation, constraints, float, determinism, stale worker responses, traceability, and a 10,000-activity performance guard.

See [Application implementation status](docs/20_IMPLEMENTATION_STATUS.md) and [Phases 1–3 release notes](docs/21_PHASES_1_3_RELEASE_NOTES.md).

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

Architecture decisions are recorded in [`adr/`](adr/).

## Explicit current boundaries

The application does not yet include professional network reporting, baselines and progress updating, BOQ and estimating, S-curves and EVM, PERT, productivity, resources, or enterprise reporting. These belong to subsequent roadmap phases and are not represented as complete.

## License

A license has not yet been selected. Add an explicit license and contribution policy before accepting external contributions or distributing production builds.
