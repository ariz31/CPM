# Implementation Roadmap

## 1. Delivery strategy

Build the application as a sequence of usable vertical slices rather than implementing every database table before any workflow works. Each phase must leave the repository in a tested, installable state and preserve backward compatibility for project files created in earlier phases.

Priorities:

1. Correctness and data durability
2. Offline operation and project portability
3. Core CPM planning and updating
4. Integrated cost, S-curve, and progress controls
5. PERT, productivity, and advanced forecasting
6. Advanced optimization and collaboration

## 2. Phase 0 — Repository and engineering foundation

### Objectives

Create a production-capable development baseline before domain features.

### Deliverables

- Accepted architecture decision records
- TypeScript strict project and chosen UI framework
- PWA installation and offline application shell
- CI for type checking, linting, tests, build, and offline smoke test
- Domain/application/infrastructure module boundaries
- Decimal, IDs, dates, units, validation, and error primitives
- IndexedDB database wrapper and migration framework
- Command transaction model, project revision, audit event, undo/redo foundation
- Web Worker request/cancellation protocol
- Design system, responsive shell, accessibility baseline
- Sample fixture and test conventions
- Contribution guide, issue templates, codeowners, security policy, and license decision

### Exit criteria

- Application installs and opens offline.
- A local sample record survives reload and application update.
- CI blocks type, test, build, and lint failures.
- A transaction interruption test leaves data valid.

## 3. Phase 1 — Project library, calendars, WBS, and activity grid

### Deliverables

- Local project library
- Project create/open/duplicate/archive/delete
- Project settings and metadata
- Multiple calendars, weekly shifts, holidays, exceptions
- WBS editor
- Activity model and editable virtualized grid
- Activity IDs, durations, calendars, types, codes, notes
- Bulk paste/edit, filters, saved views, undo/redo
- CSV activity import/export with mapping and validation
- Project health foundation
- Initial `.cpmproj` export/import without all later modules

### Exit criteria

- User can create a 1,000-activity project offline.
- Project exports and imports with no lost authoritative data.
- Calendar arithmetic reference tests pass.

## 4. Phase 2 — CPM engine and schedule visualization

### Deliverables

- Relationship model and editor
- FS, SS, FF, SF with leads/lags
- Loop, duplicate link, open-end, and isolated-network detection
- Forward and backward pass
- Total/free float, negative float, critical/near-critical state
- Driving logic and path tracing
- Constraints and deadlines
- Worker-based deterministic calculation
- Activity calculation trace
- Gantt chart with relationships and float
- Network diagram with path isolation
- Schedule reports and export

### Exit criteria

- All reference CPM fixtures pass.
- A 5,000-activity benchmark does not freeze the UI.
- Gantt/table/network show consistent dates and selected activity.
- Invalid logic cannot produce an authoritative result without an error.

## 5. Phase 3 — Baselines and schedule updating

### Deliverables

- Baseline creation and immutable storage
- Multiple baselines and selected comparison baseline
- Explicit status date
- Actual start/finish and remaining duration
- Progress methods: duration, physical, units, weighted milestones, fixed rules
- Out-of-sequence progress detection and initial handling modes
- Baseline bars and variance fields
- Guided periodic update workflow
- Look-ahead, overdue, completed-during-period, and variance reports
- Update snapshots and recovery

### Exit criteria

- A user can baseline a plan, post an update, recalculate, and produce a reconciled variance report.
- Actual and baseline data remain distinct after repeated updates.
- Restore from snapshot creates a valid copy.

## 6. Phase 4 — BOQ, rates, and cost loading

### Deliverables

- Hierarchical BOQ workspace
- Quantity, units, rates, amount, waste, notes
- Resource price library
- Unit-price analysis for labor/material/equipment/subcontract/other
- Markup waterfall and estimate summary
- Cost codes and accounts
- BOQ revision comparison
- Allocation of BOQ items to activities
- Unallocated/over-allocated cost checks
- BOQ, abstract of cost, unit-price, and cost-by-WBS reports
- BOQ CSV/XLSX templates and import mapping

### Exit criteria

- Estimate totals reconcile through all markup layers.
- Activity allocations reconcile to BOQ authoritative totals.
- Unit and currency validation prevents mixed invalid rollups.

## 7. Phase 5 — S-curves, cash flow, and EVM

### Deliverables

- Time-phasing engine
- Uniform, front-loaded, back-loaded, bell, custom, and milestone distributions
- Daily/weekly/monthly/custom periods
- Early and late planned curves
- Planned, earned, actual, and forecast series
- Physical, financial, quantity, labor-hour, and equipment-hour curves
- Actual cost entries
- PV, EV, AC, SV, CV, SPI, CPI, BAC
- EAC alternatives, ETC, VAC, TCPI
- Cash-flow rules for billing, retention, advances, recovery, and payment lag
- Curve tables, charts, dashboards, and reports

### Exit criteria

- Every cumulative curve reconciles to its source total.
- Undefined EVM values show a reason, not zero.
- A baseline/update sample produces independently verified metrics.

## 8. Phase 6 — PERT and schedule risk

### Deliverables

- O/M/P duration fields and validation
- Expected duration, standard deviation, variance
- Optional use of expected duration in schedule calculation
- Path mean/variance and target-date probability
- PERT explanation and limitation warnings
- Risk register linked to activities and BOQ items
- Risk exposure views and reports
- Sensitivity ranking based on duration uncertainty and path participation

### Exit criteria

- Reference PERT examples match expected probability within defined tolerance.
- Reports disclose approximation and path assumptions.

## 9. Phase 7 — Productivity and resource planning

### Deliverables

- Resource master data and rates
- Crew composition
- Activity resource assignments
- Resource-demand histograms and availability
- Daily/shift productivity entry
- Installed quantity, labor/equipment hours, downtime, delays, weather, attachments
- Acceptance workflow for field quantities
- Actual rates, unit hours, utilization, cost per unit
- Planned/actual variance and rolling trends
- Remaining-duration forecast from selected rate method
- Productivity, delay, crew, and location reports

### Exit criteria

- Accepted quantity can update progress without duplicate entry.
- Productivity calculations handle unit direction correctly.
- Resource over-allocation is visible and traceable to assignments.

## 10. Phase 8 — Reporting, templates, interoperability, and polish

### Deliverables

- Report builder and saved report definitions
- PDF pagination, repeated headings, legends, metadata
- Complete XLSX workbook exchange and CSV fallback
- Project templates and sanitized template export
- Global calendar, BOQ assembly, and resource libraries
- Import/export compatibility matrix
- Microsoft Project XML adapter evaluation and implementation if feasible
- Keyboard shortcut and command-palette completion
- Mobile/tablet field-entry improvements
- Accessibility remediation and browser matrix
- Performance optimization and bundle review

### Exit criteria

- Release candidate passes full offline, recovery, accessibility, and supported-browser gates.
- Reports are consistent across repeated generation from the same snapshot.

## 11. Phase 9 — Advanced scheduling and risk

Potential post-version-1 work:

- Resource leveling and smoothing
- Multiple float paths and longest-path analytics
- Monte Carlo schedule/cost risk with seed and percentiles
- Correlation groups and risk events
- Time-location/linear scheduling view
- Repetitive-work production scheduling
- Multiple project comparison
- Advanced change control and claims analysis
- Weather calendars and probabilistic production loss
- 4D/5D BIM exchange adapters

These features require separate specifications and must not destabilize the core CPM engine.

## 12. Phase 10 — Optional cloud and collaboration

Only after the local product is stable:

- Encrypted cloud backup
- Account and device management
- Sync of local commands/entities
- Conflict detection and resolution
- Role-based access
- Comments and review workflow
- Shared read-only links
- Audit export and organization policy
- Optional server calculations for exceptionally large simulations

The offline app remains functional if the service is unavailable or discontinued.

## 13. Proposed epic backlog

### Foundation epics

- FND-01 Repository bootstrap and CI
- FND-02 Domain primitives and validation
- FND-03 Local database, migrations, and transactions
- FND-04 Command bus, audit, undo, and snapshots
- FND-05 PWA offline shell and updates
- FND-06 Design system and accessibility

### Schedule epics

- SCH-01 Calendars and working-time arithmetic
- SCH-02 WBS and activities
- SCH-03 Relationship editing and validation
- SCH-04 CPM forward/backward pass
- SCH-05 Float, critical paths, and constraints
- SCH-06 Gantt and network views
- SCH-07 Baselines and progress updates
- SCH-08 Schedule reports and health checks

### Cost and performance epics

- CST-01 BOQ and estimating
- CST-02 Resource prices and unit-price analysis
- CST-03 Activity cost allocation
- PRF-01 Time phasing and S-curves
- PRF-02 Actual cost and EVM
- PRF-03 Cash flow
- PRF-04 Productivity records and forecasting
- PRF-05 Resources and histograms

### Risk and interoperability epics

- RSK-01 PERT
- RSK-02 Risk register
- RSK-03 Monte Carlo
- IO-01 Portable project files
- IO-02 CSV/XLSX exchange
- IO-03 PDF and report builder
- IO-04 External schedule adapters

## 14. First 20 implementation issues

1. Select license and contribution model.
2. Create ADR template and architecture ADRs.
3. Bootstrap TypeScript PWA and CI.
4. Add strict lint/type/test configuration.
5. Implement invariant IDs, decimals, units, and validation result types.
6. Implement project-local date/time and duration primitives.
7. Implement calendar schema and working-time arithmetic.
8. Create IndexedDB schema v1 and migration test harness.
9. Implement transactional command service and project revisions.
10. Build local project library.
11. Build project creation wizard.
12. Build WBS editor.
13. Build virtualized activity grid.
14. Implement CSV activity import/export.
15. Implement relationship model and loop detection.
16. Implement reference CPM engine without UI dependencies.
17. Add calculation worker and cancellation.
18. Build schedule result columns and trace panel.
19. Build initial Gantt view.
20. Implement `.cpmproj` manifest, export, validation, and import round trip.

## 15. Release version proposal

- `0.1`: foundation, projects, calendars, WBS, activity grid
- `0.2`: CPM engine, Gantt, network, health checks
- `0.3`: baselines, progress updating, schedule reports
- `0.4`: BOQ, unit rates, activity cost allocation
- `0.5`: S-curves and core EVM
- `0.6`: PERT and risk register
- `0.7`: productivity and resource histograms
- `0.8`: report builder, templates, interoperability
- `0.9`: hardening, migration, accessibility, performance
- `1.0`: validated offline project-controls release

Version numbers may change, but each release must state file-schema compatibility and calculation-engine changes.

## 16. Governance and change control

Any pull request changing authoritative calculation behavior must include:

- Requirement/formula reference
- Before-and-after example
- Updated engine version
- Updated fixtures
- Migration or compatibility assessment
- Report impact
- Reviewer with schedule/project-controls knowledge

Any project-file schema change must include old-file import tests and updated manifest documentation.

## 17. Risk register for implementation

| Risk | Impact | Mitigation |
|---|---|---|
| Calendar/date semantics are chosen late | Widespread calculation rewrites | Decide and test in Phase 0 |
| Grid/Gantt library cannot handle large projects | Poor usability and expensive migration | Benchmark prototypes before commitment |
| UI contains duplicate business logic | Inconsistent reports and calculations | Enforce domain-only authority |
| IndexedDB migrations corrupt projects | Data loss | Fixtures, backups, atomic migrations, recovery copy |
| File format changes frequently | Incompatible user projects | Version from first export and preserve readers |
| BOQ and schedule remain disconnected | Duplicate encoding | Use allocation entities and shared IDs |
| Advanced features delay usable core | No releasable product | Vertical phases and explicit non-goals |
| Reports hide assumptions | Misleading decisions | Mandatory metadata and formula details |
| Large network visualization blocks UI | Poor performance | Worker layout, virtualization, level of detail |
| Future cloud design compromises offline use | Vendor dependency | Adapter boundary and local authority |

## 18. Documentation maintenance

At the end of each phase:

- Update feature status in the README.
- Add user guides and screenshots for completed workflows.
- Record accepted ADRs.
- Update file-schema and engine-version tables.
- Add release notes and migration notes.
- Promote tested sample projects into the fixture catalog.
- Mark deferred requirements with target phase rather than deleting them.
