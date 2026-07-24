# CPM — Enterprise Construction Planning and Project Controls

CPM is an offline-first construction planning and project-controls platform designed to combine scheduling, quantities, cost, progress, productivity, risk, resources, and reporting in one authoritative project model.

The product is intended to support both education and professional construction delivery while establishing an architecture that can later support managed deployment, organization policies, secure synchronization, collaboration, portfolio reporting, and enterprise integrations.

> **Current status:** product-definition and architecture phase. The repository contains the normative documentation that will govern implementation.

## Product mission

Build a construction project-controls application that is:

- Fully usable offline after installation.
- Correct and independently verifiable.
- Fast at professional and enterprise dataset sizes.
- Safe against crashes, interrupted writes, malformed files, and failed migrations.
- Accessible for keyboard, screen-reader, high-contrast, zoom, and reduced-motion users.
- Transparent about formulas, assumptions, source revisions, and warnings.
- Portable through user-owned project files.
- Ready for future enterprise identity, collaboration, synchronization, and governance without replacing the domain core.

## Capability groups

| Area | Main capabilities |
|---|---|
| Project administration | Project library, metadata, templates, snapshots, trash, recovery, health, audit |
| Scheduling | WBS, activities, FS/SS/FF/SF relationships, lags, calendars, constraints, CPM, float, multiple paths, baselines, updates |
| PERT and risk | Three-point estimates, expected duration, variance, completion probability, risk register, future Monte Carlo |
| Professional views | Virtualized activity grid, Gantt, network, milestone, look-ahead, path and warning isolation |
| BOQ and estimating | Quantities, units, rates, resource analysis, markups, assemblies, revisions, cost codes, bid summaries |
| Cost and control | Cost loading, S-curves, cash flow, PV/EV/AC, SPI/CPI, forecasts, baseline and variance analysis |
| Productivity | Planned and actual production, labor/equipment hours, unit cost, utilization, delay records, rolling forecasts |
| Resources | Labor, equipment, materials, cost resources, assignments, availability, histograms, over-allocation |
| Reporting | Executive, schedule, logic, float, look-ahead, BOQ, EVM, productivity, risk, change, audit, PDF/CSV/XLSX |
| Offline data | Indexed local storage, transactional autosave, migrations, recovery snapshots, portable `.cpmproj` bundles |
| Enterprise readiness | Requirement/test traceability, performance budgets, security, observability, managed deployment, future synchronization |

## Enterprise non-negotiables

1. **Every feature has written tests.** Every normative requirement maps to at least one named acceptance test; CI must reject unmapped requirements.
2. **Correctness is authoritative.** Calculations are deterministic, versioned, reference-tested, and isolated from UI code.
3. **Performance is a release gate.** Startup, project open, editing, recalculation, rendering, import/export, reports, and memory have measurable budgets.
4. **Offline is the default.** Core workflows do not require an account, server, or hidden network call.
5. **Writes are atomic.** Interrupted operations preserve the last complete project revision and provide recovery.
6. **Files are untrusted.** Imports are staged, resource-limited, validated, and committed only after review.
7. **Accessibility is built in.** Core workflows target WCAG 2.2 AA and remain keyboard and assistive-technology operable.
8. **No hidden authority.** Inputs, calculated values, baselines, actuals, overrides, stale results, and warnings remain distinguishable.
9. **Users own their data.** A complete project can be exported, verified, deleted locally, and restored from a portable file.
10. **Future enterprise services are adapters.** Identity, policy, backup, sync, collaboration, and portfolio services do not replace the offline domain model.

## Performance scale

The enterprise performance specification defines deterministic benchmark profiles from 100 to 100,000 activities. The primary professional targets include:

- Warm shell startup within 700 ms p75 on standard professional hardware.
- Large project open to a usable grid within 3 seconds for 10,000 activities and 6 seconds for 50,000 activities.
- Full CPM recalculation within 900 ms for 10,000 activities and 3.5 seconds for 50,000 activities under the documented benchmark topology.
- Low-latency keyboard editing and virtualized 60 fps grid/Gantt interaction for normal professional views.
- Bounded memory, streamed import/export, cancellable workers, and stale-result protection.

Exact hardware, percentile, memory, and regression rules are defined in the performance document.

## Documentation map

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

### Enterprise second-pass specification

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

The enterprise documents are normative overlays. Where an enterprise second-pass rule is stricter than the foundation document, the stricter rule governs.

## Proposed technical direction

The initial implementation should be an installable TypeScript progressive web application. The current recommended starting point is React, Vite, a service worker, IndexedDB through a reviewed abstraction such as Dexie, Web Workers for heavy work, and rendering technologies selected through representative benchmarks.

The application should use a modular architecture with:

- Framework-independent domain and calculation engines.
- Command-based authoritative mutation.
- Transactional local persistence.
- Immutable baselines, snapshots, and report inputs.
- Versioned schemas and worker messages.
- Ports and adapters for files, storage, reports, identity, telemetry, and future synchronization.
- Virtualized grids and level-of-detail visualizations.
- Derived data that is disposable and rebuildable.

Technology recommendations remain subject to Architecture Decision Records, security review, accessibility review, and performance benchmarks.

## Feature definition of done

A feature is complete only when it has:

- Stable requirement and written acceptance-test IDs.
- Defined domain inputs, outputs, invariants, validation, and formulas.
- Offline, transaction, recovery, undo/redo, audit, import/export, and migration behavior.
- Keyboard, screen-reader, zoom, contrast, and reduced-motion behavior.
- Performance and memory budget.
- Security and privacy analysis.
- Automated tests at the appropriate levels.
- Sample/reference data.
- User and technical documentation.
- Release and diagnostic behavior.

A visually polished interface without this evidence is not accepted as complete.

## Initial implementation sequence

1. Engineering foundation, offline shell, strict contracts, CI, design system, persistence, workers, and benchmarks.
2. Safe project library, portable files, snapshots, recovery, and storage health.
3. Calendars, WBS, activities, virtualized grid, and imports.
4. Deterministic CPM engine, schedule health, Gantt, and network.
5. Baselines, progress updates, look-ahead, and schedule reports.
6. BOQ, cost loading, S-curves, EVM, cash flow, productivity, resources, and risk.
7. Enterprise reporting, audit, migration matrix, security hardening, accessibility audit, and performance qualification.
8. Optional managed and collaborative enterprise editions after the offline core meets release gates.

## Repository conventions

- Product and technical decisions belong in `docs/`; significant architecture choices belong in `adr/` when implementation begins.
- Requirement and test identifiers are stable and automatically validated.
- Formula changes require reference fixtures and mathematical rationale.
- Schema and file-format changes require migrations, compatibility notes, and round-trip tests.
- UI changes require state inventory, accessibility behavior, performance evidence, and visual regression coverage.
- New dependencies require security, license, maintenance, bundle, memory, and performance review.
- Generated reports state project, project revision, status date, baseline, calendar, currency, units, and engine version.
- Production releases include traceability, migration, accessibility, security, benchmark, recovery, SBOM, provenance, and release-note evidence.

## License

A license has not yet been selected. Add an explicit license and contribution policy before accepting external contributions or distributing production builds.