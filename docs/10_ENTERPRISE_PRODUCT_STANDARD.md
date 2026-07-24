# Enterprise Product Standard

## 1. Purpose

This document upgrades CPM from a capable offline project-controls application into an enterprise-grade product specification. It is normative for architecture, implementation, testing, release approval, and future cloud or collaboration work.

Where this document is stricter than the first-pass documents, this document governs.

## 2. Definition of enterprise grade

CPM is enterprise grade only when it is:

- **Correct:** calculations are deterministic, independently verifiable, versioned, and reproducible.
- **Reliable:** user work survives crashes, interrupted writes, storage pressure, failed imports, migrations, and application upgrades.
- **Performant:** large schedules remain responsive under published benchmark profiles and performance budgets.
- **Secure:** untrusted files, dependencies, exports, and future network adapters are treated as hostile boundaries.
- **Auditable:** authoritative changes, calculation runs, imports, baselines, overrides, and migrations are attributable and explainable.
- **Accessible:** core workflows meet WCAG 2.2 AA and remain usable through keyboard, assistive technology, zoom, reduced motion, and high contrast.
- **Operable:** failures produce diagnostics, recovery paths, support bundles, health indicators, and rollback plans.
- **Portable:** local data can be exported, validated, migrated, restored, and independently retained by the user.
- **Maintainable:** domain rules are isolated, modules have explicit contracts, technical decisions are recorded, and tests trace to requirements.
- **Extensible:** future identity, synchronization, collaboration, portfolio, and cloud services are adapters around the offline core.

## 3. Product tiers

### 3.1 Offline Individual

The initial product operates without an account or server. All authoritative project data is stored locally and can be exported as a portable file.

### 3.2 Managed Desktop and Organization

A later managed edition may add centrally distributed policies, signed releases, approved templates, encrypted backup destinations, organization-controlled configuration, and support diagnostics. Local project ownership remains explicit.

### 3.3 Collaborative Enterprise

A later enterprise service may add identity, role-based access control, project workspaces, synchronization, collaboration, retention, legal holds, organization audit exports, and portfolio reporting. These capabilities must not move calculation authority into UI code or make local recovery impossible.

## 4. Mandatory feature contract

A feature is not accepted merely because the interface exists. Every feature must have a **Feature Contract** containing:

1. Requirement ID and owner.
2. User outcome and prohibited outcomes.
3. Domain inputs, outputs, invariants, and formulas.
4. Validation rules and error messages.
5. Offline behavior and storage transactions.
6. Undo, redo, recovery, baseline, and audit effects.
7. Import, export, migration, and compatibility effects.
8. Keyboard, screen-reader, zoom, contrast, and reduced-motion behavior.
9. Performance budget and benchmark dataset.
10. Security and privacy considerations.
11. Written acceptance test IDs.
12. Automated unit, integration, end-to-end, accessibility, and performance coverage where applicable.
13. User documentation and release notes.
14. Telemetry or diagnostic behavior, with privacy defaults.

A pull request that adds or changes a feature must update the Feature Contract and its tests in the same change.

## 5. Requirement-to-test rule

- Every normative requirement must map to at least one written acceptance test.
- Every acceptance test must map back to one or more requirements.
- A requirement without a test is treated as incomplete.
- A test without a requirement must be classified as regression, exploratory, operational, or quality-attribute coverage.
- Traceability is verified automatically in CI by parsing requirement and test identifiers.
- Deleted requirements must not silently delete tests; the change must record the superseding requirement or removal rationale.

The initial matrix is defined in `11_REQUIREMENT_TEST_TRACEABILITY.md`.

## 6. Enterprise quality attributes

### 6.1 Correctness

- Schedule, PERT, BOQ, S-curve, EVM, productivity, resource, and forecast engines must be pure or isolated deterministic services.
- Decimal or scaled-integer arithmetic must be used where binary floating-point would create unacceptable financial reconciliation errors.
- Calendar arithmetic must be covered by reference cases across holidays, split shifts, daylight-saving changes, leap years, and timezone changes.
- Calculation results must include engine version, input revision, settings hash, warning set, start time, finish time, and completion status.
- No UI field may present a value as authoritative unless it comes from a committed engine result or a clearly labeled manual input.

### 6.2 Availability and recoverability

- The application must never depend on network availability for core workflows.
- Authoritative writes must be transactional and idempotent where retry is possible.
- The application must retain the last known valid project state during failed recalculation, import, migration, or report generation.
- Recovery snapshots must be created before destructive migration, restore, bulk import, or project replacement.
- A corrupted project must not prevent the project library or other projects from opening.

### 6.3 Performance

Performance is a release requirement, not a later optimization. Performance budgets and benchmark profiles are defined in `12_PERFORMANCE_ENGINEERING.md`.

### 6.4 Security and privacy

- All imported files and attachments are untrusted.
- Core offline use must require no telemetry.
- Diagnostic collection must be explicit, inspectable, redactable, and exportable by the user.
- Future authentication and synchronization must follow least privilege, tenant isolation, revocation, encrypted transport, and auditable authorization.
- Security requirements and verification are defined in `13_SECURITY_PRIVACY_AND_COMPLIANCE.md`.

### 6.5 Accessibility and usability

- WCAG 2.2 AA is the minimum target for core workflows.
- Keyboard and assistive-technology operation must cover the project library, activity grid, Gantt controls, network navigation, BOQ, progress update, reporting, settings, import, export, and recovery.
- Large datasets must remain understandable through tables and summaries; charts are never the sole representation.
- UX requirements are defined in `14_ENTERPRISE_UX_DESIGN_SYSTEM.md`.

### 6.6 Observability and supportability

- The product must expose project health, storage health, calculation health, migration status, and recovery status.
- Failures must have stable error codes, user-safe messages, technical context, and next actions.
- A user-controlled support bundle must include redacted diagnostics, app version, engine version, schema version, browser/runtime information, recent error codes, and optional project metadata without project content by default.
- Operational requirements are defined in `15_RELIABILITY_OBSERVABILITY_AND_OPERATIONS.md`.

## 7. Enterprise architecture principles

1. **Modular domain core:** schedule, cost, progress, risk, productivity, resources, reporting, and files are independently testable modules.
2. **Ports and adapters:** browser storage, filesystem access, cloud sync, identity, exports, and telemetry implement explicit interfaces.
3. **Command-based mutation:** authoritative changes are performed through validated commands with transaction, audit, and undo metadata.
4. **Immutable snapshots:** baselines, calculation inputs, report inputs, and migration backups use immutable revisions.
5. **Worker isolation:** heavy calculation, parsing, serialization, layout, and export work runs outside the UI thread.
6. **Versioned contracts:** schemas, engine outputs, file bundles, import mappings, and future APIs are versioned independently.
7. **No hidden global state:** modules receive project revision, settings, calendar, locale, and data date explicitly.
8. **Fail closed for authority:** invalid logic or damaged data may be displayed for repair but must not produce authoritative outputs.
9. **Progressive loading:** open the workspace shell and essential metadata before loading or rendering full datasets.
10. **Replaceable UI:** domain rules, persistence, and file formats do not depend on a specific component library.

## 8. Enterprise data rules

- Internal identifiers are immutable UUIDs; human-facing codes remain editable and unique within their scope.
- Money stores currency, scale, rounding mode, and source precision.
- Quantities store unit identity and conversion metadata.
- Dates distinguish date-only values, instants, local working times, timezone, and calendar references.
- Soft deletion is used where audit, undo, sync, or recovery requires identity preservation.
- Referential integrity is enforced in both schema and domain validation.
- Derived data is cacheable and disposable; authoritative source records are never reconstructed only from charts or reports.
- File and database migrations are forward-only, versioned, resumable where possible, and tested from every supported version.

## 9. Enterprise UX principles

- Default views emphasize the next decision: logic errors, critical work, overdue work, unallocated cost, missing actuals, and forecast risk.
- Power features remain discoverable but do not overwhelm first-time users.
- Dense professional tables support keyboard-first operation and bulk work without sacrificing touch usability.
- Long-running work shows progress, supports cancellation, and never blocks navigation unnecessarily.
- Destructive actions show impact summaries and recovery options.
- Every warning explains why it matters and how to resolve it.
- The interface distinguishes authoritative data, calculated data, baseline data, imported data, manual overrides, stale results, and invalid data.

## 10. Release evidence package

Every release candidate must include:

- Requirement-to-test traceability report with zero unmapped mandatory requirements.
- Unit, integration, end-to-end, accessibility, migration, security, and performance results.
- Benchmark comparison against the previous approved release.
- Dependency inventory and software bill of materials.
- Supported schema and `.cpmproj` versions.
- Migration and rollback evidence.
- Known limitations and accepted risks.
- Browser and device compatibility report.
- Offline installation and update validation.
- Data-loss and recovery drill results.
- Release notes and upgrade guidance.

## 11. Definition of done

A feature or release is done only when:

- Required behavior is implemented.
- Written acceptance tests exist and are reviewed.
- Required automated tests pass.
- Performance budgets are met on declared benchmark hardware.
- Accessibility checks pass without critical violations.
- Security review has no unresolved critical or high findings.
- Data migration, import, export, recovery, and failure paths are verified.
- Documentation and traceability are current.
- The result is observable, supportable, and reversible.

World-class appearance without correctness, speed, resilience, or evidence is not accepted as enterprise quality.