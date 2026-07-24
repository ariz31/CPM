# Enterprise Implementation Roadmap

## 1. Roadmap objective

This roadmap turns the product specification into a sequence of independently verifiable releases. Each phase must produce working software, written tests, automated evidence, performance results, recovery behavior, and updated documentation.

The roadmap prioritizes the trustworthy offline core before adding collaboration or cloud dependency.

## 2. Cross-phase rules

Every phase must:

- Keep core workflows offline.
- Preserve backward-compatible project ownership through `.cpmproj` export.
- Add written acceptance tests before or with implementation.
- Add reference fixtures for formulas and migrations.
- Stay within performance and memory budgets for its declared profiles.
- Pass accessibility and malicious-input gates for affected workflows.
- Provide recovery for interrupted authoritative operations.
- Produce release notes and traceability evidence.

## 3. Phase 0 — Engineering foundation

### Scope

- Monorepo/package structure.
- Strict TypeScript and runtime schema validation.
- Formatting, linting, type checking, unit test, documentation, and traceability CI.
- Application shell and installable offline PWA.
- Design-token foundation and accessible component primitives.
- Domain value types: IDs, money, decimal quantity, units, dates, duration, timezone, calendar references, revisions, and errors.
- Command and transaction contracts.
- IndexedDB abstraction and migration framework.
- Worker protocol and cancellation framework.
- Benchmark fixture generator and performance harness.
- ADR process and pull-request template.

### Exit criteria

- Application installs and opens offline.
- CI blocks requirement/test mismatch and package-boundary violations.
- Transaction failure-injection test proves atomic sample commands.
- P0/P1 benchmark harness produces machine-readable results.
- Keyboard, screen-reader, theme, and error-state primitives pass baseline tests.

## 4. Phase 1 — Project library and safe local storage

### Scope

- Project creation, open, rename, duplicate, archive, trash, delete, and restore.
- Project metadata and settings.
- Autosave status and transaction journal.
- Named snapshots and automatic recovery snapshots.
- Storage health and quota warnings.
- Recovery center foundation.
- Complete `.cpmproj` export/import for project metadata and empty module structures.

### Exit criteria

- Interruption tests cover every project lifecycle write.
- One corrupted project cannot block the library.
- Export-delete-import round-trip restores the project exactly.
- B1/B2 startup and project-open budgets pass.
- Project library is keyboard and screen-reader operable.

## 5. Phase 2 — Calendars, WBS, and activity grid

### Scope

- Multiple calendars, shifts, holidays, exceptions, and timezone rules.
- WBS hierarchy and activity codes.
- Activity entities, milestones, summary rows, validation, custom fields, and audit metadata.
- Enterprise virtualized activity grid.
- Bulk edit, copy/paste, fill, filtering, sorting, saved views, and undo/redo.
- CSV import mapping and validation for WBS and activities.

### Exit criteria

- Calendar reference fixture suite passes leap year, timezone, split-shift, holiday, and exception cases.
- P2 grid editing meets interaction budgets.
- Invalid paste/import never partially mutates a project.
- All ACT, WBS, CAL, and applicable UI acceptance tests are automated.

## 6. Phase 3 — CPM engine and schedule health

### Scope

- FS, SS, FF, SF relationships with positive/negative lag.
- Graph validation, loop detection, open ends, duplicate links, and driving logic.
- Calendar-aware forward and backward passes.
- Total and free float.
- Constraints, deadlines, explicit project finish, critical and near-critical paths.
- Deterministic worker calculation, cancellation, stale-result protection, and calculation records.
- Schedule health panel.

### Exit criteria

- Independent reference networks match exactly.
- Property tests cover graph and relationship invariants.
- P3 full calculation meets budget on B2.
- Rapid-edit race tests prove stale results cannot overwrite current results.
- Every CPM and LOG acceptance test is automated.

## 7. Phase 4 — Gantt, network, and schedule reports

### Scope

- Synchronized activity grid and Gantt.
- Baseline-ready planned bars, milestones, float, constraints, deadlines, and status markers.
- Worker-based network layout, path isolation, WBS grouping, and manual positions.
- Critical path, float, logic, milestone, and look-ahead reports.
- PDF/print foundation with stable pagination and provenance.

### Exit criteria

- P2 Gantt scrolls and zooms within frame budgets.
- P3 network path-first view meets first-meaningful-layout budget.
- Keyboard and screen-reader alternatives cover essential schedule semantics.
- Report regression fixtures verify stable output structure and metadata.

## 8. Phase 5 — Baselines and progress control

### Scope

- Immutable original and revised baselines.
- Explicit status date.
- Actual starts/finishes, remaining duration, suspensions, and progress methods.
- Retained logic and progress override for out-of-sequence work.
- Baseline comparison and schedule variance.
- Weekly update workflow and update snapshots.

### Exit criteria

- Baseline records remain reproducible after later project changes.
- Every progress method matches reference scenarios.
- Out-of-sequence handling is explicit and tested.
- Weekly update end-to-end workflow passes offline, recovery, accessibility, and performance gates.

## 9. Phase 6 — BOQ and estimating

### Scope

- Hierarchical BOQ and revision comparison.
- Decimal quantities, units, rates, waste, and amounts.
- Material, labor, equipment, subcontract, and miscellaneous breakdown.
- Markup waterfall with explicit calculation order.
- Resource price and assembly libraries.
- BOQ-to-activity allocation.
- Detailed estimate and bid reports.

### Exit criteria

- Financial reconciliation fixtures pass at all supported precision and rounding modes.
- P2 BOQ grid meets interaction budgets.
- Allocation below/above 100% is explicit and never silently normalized.
- CSV/XLSX formula-injection and malicious workbook tests pass.

## 10. Phase 7 — Cost loading, S-curves, and earned value

### Scope

- Cost and quantity loading from BOQ to activities.
- Uniform, front-loaded, back-loaded, bell, custom, and milestone phasing.
- Daily, weekly, monthly, and fiscal periods.
- Planned early/late, actual, earned, and forecast curves.
- PV, EV, AC, SV, CV, SPI, CPI, BAC, EAC, ETC, VAC, and TCPI.
- Cash-flow rules for billing lag, advance, recovery, retention, release, and tax.

### Exit criteria

- Final cumulative curves reconcile to authoritative totals.
- Undefined metrics never appear as zero or infinity.
- Reference EVM and cash-flow fixtures pass.
- P3 curve regeneration meets budget.
- Executive and EVM reports disclose assumptions and completeness.

## 11. Phase 8 — PERT, risk, productivity, and resources

### Scope

- PERT three-point estimates, expected duration, variance, and path probability.
- Assumption warnings and sensitivity ranking.
- Risk register and links.
- Planned productivity, daily field records, actual productivity, utilization, and forecasts.
- Labor/equipment/material/cost resources and assignments.
- Resource histograms and over-allocation.

### Exit criteria

- PERT reference probabilities match independent calculation.
- Productivity unit-conversion and forecast fixtures pass.
- Resource histograms reconcile to assignments.
- Attachment resource limits and evidence workflows pass security and memory gates.

## 12. Phase 9 — Enterprise reporting and audit

### Scope

- Configurable dashboards.
- Report builder with immutable input snapshots.
- Executive, update, critical path, look-ahead, BOQ, cash flow, EVM, productivity, resource, risk, change, and audit reports.
- Calculation explanation and formula inspector.
- Complete audit views and manual override controls.
- Support bundle and diagnostics UI.

### Exit criteria

- Reports remain stable under concurrent editing because they use one revision.
- Audit completeness covers every authoritative command class.
- Support bundle redaction tests pass.
- Large reports meet generation and memory budgets.

## 13. Phase 10 — Version 1 enterprise-quality offline release

### Scope

- Complete migration matrix.
- Full browser/device compatibility.
- P0-P4 performance and soak tests.
- Security hardening, malicious corpus, dependency review, SBOM, and provenance.
- Accessibility audit and remediation.
- Offline install, update, rollback, and recovery drills.
- Sample projects, templates, formula handbook, user onboarding, administrator guidance, and support process.

### Exit criteria

- Zero unmapped mandatory requirements.
- Zero unresolved critical/high security findings.
- Zero known silent data-loss paths.
- All hard performance budgets pass or have approved time-bounded exceptions that do not affect critical workflows.
- Core workflows meet WCAG 2.2 AA.
- Every supported schema migrates successfully.
- Export/restore and recovery drills pass.
- Release evidence package is complete.

## 14. Phase 11 — Managed enterprise edition

### Scope

- Signed managed distribution or desktop packaging.
- Organization templates and policies.
- Optional local vault/application lock.
- Approved backup destinations.
- Central configuration and diagnostic collection with explicit privacy controls.
- Extended support lifecycle and controlled updates.

### Exit criteria

- Policies cannot make local data unrecoverable without explicit organization behavior.
- Managed controls are auditable and least privilege.
- Update rollback and configuration recovery pass.

## 15. Phase 12 — Collaborative enterprise service

### Scope

- OIDC/SAML identity adapters.
- Organization, workspace, project, and role model.
- Command API, durable local sync queue, conflicts, audit export, and attachments.
- Shared authoritative revisions and calculation-version control.
- Tenant isolation, retention, legal hold, and regional policy support.
- Service observability, backups, SLOs, incident response, and disaster recovery.

### Exit criteria

- Offline local editing and export remain functional according to project policy.
- Idempotency, conflict, authorization, tenant isolation, and rejection recovery tests pass.
- Service SLO and disaster-recovery evidence is approved.
- External security assessment has no unresolved critical/high findings.

## 16. Phase 13 — Advanced enterprise extensions

Potential work:

- Monte Carlo schedule and cost risk.
- Automated resource leveling and smoothing.
- Portfolio and multi-project planning.
- Open API and integration SDK.
- BIM 4D/5D links.
- Mobile field capture.
- Workflow approvals and notifications.
- Controlled AI assistance with explainable proposals and mandatory human review.

Each extension receives its own requirements, tests, threat model, performance budget, and data contract.

## 17. Priority order

The implementation priority is:

1. Data durability and recoverability.
2. Calculation correctness.
3. Core schedule usability.
4. Performance at professional scale.
5. BOQ, progress, and control integration.
6. Accessibility and explainability.
7. Reporting and operational maturity.
8. Enterprise management and collaboration.

Visual polish is continuous across phases, but it never outranks data safety, correctness, or responsiveness.

## 18. Milestone governance

At each phase review, maintainers must present:

- Completed requirement and test IDs.
- Demonstration on reference and benchmark projects.
- Performance comparison.
- Accessibility evidence.
- Security findings.
- Recovery and migration evidence.
- Known limitations.
- Updated risk register and next-phase dependencies.

A phase is not complete because its feature list appears in the UI. It is complete only when its evidence passes the documented gates.