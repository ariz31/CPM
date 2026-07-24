# CPM — Offline Construction Planning and Project Controls

CPM is a planned offline-first application for construction scheduling, cost planning, progress measurement, productivity analysis, and project-control reporting. It is intended to combine Critical Path Method scheduling, PERT uncertainty analysis, S-curves, earned value, bill of quantities, resource and productivity data, and portable project files in one consistent workspace.

> Status: documentation and product-definition phase. The repository currently contains the specifications that will guide implementation.

## Product goals

- Work fully offline after installation, without requiring an account or internet connection.
- Use one integrated project model so schedule, quantities, cost, progress, resources, and reports remain consistent.
- Produce transparent, auditable calculations suitable for education and real project-control work.
- Save, open, duplicate, back up, and exchange projects as portable files.
- Keep the calculation engine independent from the user interface so it can later support desktop, web, mobile, collaboration, and cloud synchronization.
- Preserve user ownership of data and avoid mandatory telemetry or remote storage.

## Planned capability groups

| Area | Main capabilities |
|---|---|
| Project setup | Project metadata, work calendars, holidays, currencies, units, WBS, coding dictionaries, templates |
| CPM scheduling | Activity-on-node scheduling, FS/SS/FF/SF relationships, leads/lags, constraints, calendars, forward/backward pass, float, multiple critical paths, baselines, updates |
| PERT and risk | Optimistic/most-likely/pessimistic durations, expected duration, variance, completion probability, sensitivity, future Monte Carlo simulation |
| Gantt and networks | Editable activity table, Gantt chart, logic/network diagram, milestones, grouping, filters, critical-path highlighting |
| BOQ and estimating | Quantities, units, unit rates, material/labor/equipment breakdowns, indirect cost, contingency, tax, escalation, assemblies, bid summaries |
| S-curves and EVM | Planned value, earned value, actual cost, early/late curves, physical and cost progress, SPI/CPI, forecasts, cash-flow charts |
| Productivity | Crew composition, planned and actual output, labor-hours, equipment-hours, productivity rates, variance, forecasts, location and daily records |
| Progress control | Status dates, actual starts/finishes, remaining durations, percent complete methods, quantities installed, costs incurred, change events |
| Reporting | Schedule, float, variance, look-ahead, BOQ, cash flow, productivity, EVM, risk, executive dashboard, PDF/CSV/XLSX export |
| Offline data | Indexed local database, automatic recovery snapshots, portable `.cpmproj` project bundle, schema migration, import validation |

## Documentation map

1. [Product vision and scope](docs/01_PRODUCT_VISION_AND_SCOPE.md)
2. [Functional requirements](docs/02_FUNCTIONAL_REQUIREMENTS.md)
3. [Calculation specification](docs/03_CALCULATION_SPECIFICATION.md)
4. [Architecture and offline storage](docs/04_ARCHITECTURE_AND_OFFLINE_STORAGE.md)
5. [Data model and project file format](docs/05_DATA_MODEL_AND_FILE_FORMAT.md)
6. [User experience, workflows, and reports](docs/06_UX_REPORTS_AND_WORKFLOWS.md)
7. [Quality, security, and testing](docs/07_QUALITY_SECURITY_AND_TESTING.md)
8. [Implementation roadmap](docs/08_IMPLEMENTATION_ROADMAP.md)
9. [Glossary and formula reference](docs/09_GLOSSARY_AND_FORMULAS.md)

## Proposed technical direction

The initial implementation should be an installable progressive web application using TypeScript. A recommended baseline is React, Vite, a service worker, IndexedDB through Dexie, a Web Worker calculation engine, and a chart/diagram layer that can render large schedules without blocking the interface. These are recommendations rather than hard constraints until an architecture decision record is accepted.

The domain engine must be framework-independent and deterministic. Schedule calculation, cost aggregation, PERT, S-curve generation, and earned-value calculations should be pure modules with versioned inputs and outputs. The user interface should never contain authoritative calculation logic.

## Core operating principles

1. **Offline is the default.** Every core action must work without network access.
2. **One source of truth.** Schedule, BOQ, progress, and cost records reference shared IDs rather than duplicate descriptions.
3. **No hidden calculations.** Formula inputs, assumptions, rounding, calendars, and data dates must be inspectable.
4. **Non-destructive editing.** Baselines, snapshots, audit history, and undo/redo protect users from accidental loss.
5. **Portable ownership.** A project can be exported as a complete file and reopened on another device.
6. **Progressive complexity.** Beginners can create a simple CPM schedule while advanced users can enable cost loading, PERT, resource, and EVM features.
7. **Future-compatible boundaries.** Sync, collaboration, and cloud storage are adapters around the local domain model, not prerequisites for it.

## Initial release definition

The first production-worthy release should include:

- Local project creation and project library
- WBS and activity management
- CPM calculation with calendars, all four relationship types, and lags
- Gantt chart, network diagram, critical path, and float reporting
- Baseline creation and schedule updating
- Basic BOQ and cost loading
- Planned/actual S-curves and essential earned-value indicators
- CSV import/export and portable project-file import/export
- Local backups, autosave, undo/redo, and recovery
- Calculation unit tests and reference sample projects

PERT probability, detailed productivity tracking, advanced EVM forecasting, resource leveling, Monte Carlo risk analysis, and polished estimating libraries may follow in staged releases, but their data contracts are defined from the beginning.

## Repository conventions

- Product and technical decisions belong in `docs/`.
- Calculation formulas require reference examples and tests before implementation is accepted.
- Schema changes require a versioned migration and backward-compatibility notes.
- New features must define offline behavior, validation, error states, accessibility, and export behavior.
- Generated reports must state project, data date, baseline, calendar, currency, units, and calculation-engine version.

## License

A license has not yet been selected. Add one before accepting external contributions or distributing production builds.
