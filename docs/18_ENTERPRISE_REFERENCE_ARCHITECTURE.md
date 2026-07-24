# Enterprise Reference Architecture

## 1. Architectural objective

CPM should begin as an offline-first modular application while preserving clean boundaries for future desktop packaging, managed deployment, synchronization, collaboration, APIs, and portfolio services. The initial architecture must not assume that future enterprise capability requires rewriting calculations or replacing the local project model.

## 2. Architectural style

Use a modular monolith in the initial application with strict package boundaries, ports and adapters, command-based mutation, event-driven derived work, worker isolation, and versioned contracts.

A distributed system is not justified for the offline release. Future services should be extracted only where independent scaling, security boundaries, collaboration, or operational ownership requires them.

## 3. Logical layers

### 3.1 Presentation layer

Responsibilities:

- Screens, views, components, design tokens, keyboard models, accessibility, routing, selection, viewport state, and user feedback.
- Converting user intent into domain commands or queries.
- Rendering authoritative and derived results without recalculating domain truth.

Prohibited:

- Direct database mutation.
- Authoritative date, cost, float, EVM, or productivity calculation.
- Parsing untrusted files on the main thread.
- Depending on browser locale for stored authority.

### 3.2 Application layer

Responsibilities:

- Use cases and command orchestration.
- Authorization hooks for future enterprise editions.
- Transactions, expected revision, idempotency, audit, undo metadata, and worker coordination.
- Query composition and read models.
- Long-running operation lifecycle.

### 3.3 Domain layer

Responsibilities:

- Entities, value objects, invariants, commands, domain services, and policies.
- Schedule, calendar, cost, progress, risk, productivity, resource, and project rules.
- No UI, browser, filesystem, or network dependencies.

### 3.4 Engine layer

Responsibilities:

- Deterministic high-performance calculations.
- Normalized versioned input and output contracts.
- Reference fixtures, property tests, and benchmark workloads.
- Pure computation where practical.

### 3.5 Infrastructure layer

Responsibilities:

- IndexedDB and future database adapters.
- File system, project bundle, compression, checksums, encryption, reports, import/export, network, telemetry, and identity adapters.
- Runtime validation and resource limits at every boundary.

## 4. Proposed modules

### Project

Project identity, metadata, settings, lifecycle, snapshots, health summary, and project revision.

### Calendar

Work patterns, shifts, holidays, exceptions, timezone, work arithmetic, and calendar revision.

### WBS and Coding

Hierarchy, activity codes, cost codes, locations, custom fields, and dictionaries.

### Schedule

Activities, relationships, constraints, actuals, status rules, baselines, critical paths, and schedule comparison.

### Cost and BOQ

BOQ hierarchy, quantities, units, resource breakdowns, markups, cost accounts, allocations, revisions, and cash-flow rules.

### Progress and EVM

Progress entries, percent methods, time phasing, PV/EV/AC, forecasts, curves, and update snapshots.

### Productivity and Resources

Crews, resources, assignments, field records, output rates, utilization, forecasts, and histograms.

### Risk and Change

Risk register, uncertainty metadata, change events, approvals, impact links, and future simulation inputs.

### Reporting

Report definitions, query snapshots, rendering, pagination, exports, templates, and provenance.

### Audit and Recovery

Command history, audit events, safety snapshots, recovery operations, support diagnostics, and retention.

### Interoperability

Portable files, CSV/XLSX, external schedule adapters, conversion reports, migrations, and future APIs/sync.

## 5. Package dependency direction

```text
UI -> Application -> Domain
UI -> Query contracts
Application -> Engine contracts
Application -> Persistence/File/Report ports
Infrastructure -> Domain/Application ports
Engines -> Domain value types or normalized engine contracts
Domain -> no outward framework dependency
```

Circular package dependencies are prohibited. Build tooling should enforce allowed import directions.

## 6. Command architecture

Example command envelope:

```ts
interface CommandEnvelope<TPayload> {
  commandId: string;
  commandType: string;
  schemaVersion: number;
  projectId: string;
  expectedProjectRevision: number;
  actorContext?: ActorContext;
  occurredAt: string;
  payload: TPayload;
}
```

Command processing stages:

1. Runtime schema validation.
2. Permission check where applicable.
3. Load required authoritative state.
4. Domain invariant validation.
5. Compute mutation plan.
6. Commit authoritative changes, revision, audit, and outbox/derived-work markers in one transaction.
7. Publish result to the UI.
8. Trigger calculation, indexing, preview, or future synchronization asynchronously.

## 7. Query architecture

- Queries are read-only and may use optimized read models.
- Query results include source revision and stale status.
- Large queries are paged or streamed.
- UI filters and viewport state do not mutate authority.
- Derived read models can be rebuilt from authoritative records.
- Exports and reports execute from an immutable query snapshot to avoid mixed revisions.

## 8. Worker architecture

Recommended worker groups:

- Schedule and calendar calculation.
- Cost, time phasing, EVM, and productivity calculation.
- Import parsing and validation.
- Project-file compression, checksums, encryption, and serialization.
- Network layout and chart aggregation.
- Report generation where the chosen runtime supports it.

Worker protocol requirements:

- Versioned message schema.
- Operation ID, project revision, and cancellation token.
- Progress events.
- Structured warnings and stable errors.
- Transferable data for large buffers.
- Stale-result rejection.
- Worker crash isolation and restart.

## 9. Persistence architecture

### 9.1 Authoritative stores

Store normalized records by project and immutable internal ID. Include indexes for common project, WBS, code, date, status, and relationship queries.

### 9.2 Derived stores

Separate stores for:

- Calculation results.
- Search indexes.
- Chart aggregates.
- Network layout.
- Thumbnails.
- Report cache.

Each derived record includes source revision and generator version.

### 9.3 Transaction boundaries

A command transaction includes all authoritative rows, project revision, audit event, and derived invalidation marker. Cross-transaction workflows must use operation records and compensating behavior rather than pretending to be atomic.

## 10. State management

Separate state into:

- Authoritative project records in persistence/domain queries.
- Committed derived results by revision.
- Application operation state.
- View state such as filters, selection, column layout, zoom, and panel sizes.
- Transient editor state before command commit.

Avoid one monolithic global store that causes every edit to notify every view. Use scoped subscriptions and selectors with stable identities.

## 11. Calculation pipeline

1. Read required authoritative records at revision R.
2. Normalize and validate engine input.
3. Hash relevant input and settings.
4. Execute worker calculation.
5. Produce versioned result and warnings.
6. Reject if current project revision no longer matches R unless the result is explicitly stored as historical.
7. Commit result cache and calculation record.
8. Update subscribed queries.

The UI continues showing the last committed valid result during steps 1–7 and marks it stale.

## 12. Report pipeline

1. User chooses report and parameters.
2. Application resolves project revision, baseline, status date, locale, currency, units, and engine result.
3. Create immutable report input snapshot.
4. Validate data completeness.
5. Generate structured report model.
6. Render preview and export formats.
7. Attach provenance and warnings.
8. Record report generation event without changing project authority.

## 13. File and import pipeline

1. Stream bytes into a bounded staging area.
2. Identify format and apply resource limits.
3. Parse in worker.
4. Validate schemas and integrity.
5. Normalize into a staged project model.
6. Produce conversion and health report.
7. Let user choose new, copy, replace, or supported merge mode.
8. Create safety point.
9. Commit in controlled transactions.
10. Recalculate and verify project health.

## 14. Future enterprise service decomposition

Potential services, introduced only when justified:

- Identity and organization service.
- Project synchronization and command service.
- Attachment/object storage service.
- Audit export service.
- Report rendering service.
- Portfolio analytics service.
- Managed template and policy service.
- Notification/job service.

The scheduling and cost engines should remain shared versioned libraries or services with the same fixtures as the offline client.

## 15. Future sync topology

```text
Offline Client
  -> durable local command queue
  -> authenticated sync adapter
  -> command API
  -> authorization and invariant validation
  -> authoritative project revision
  -> event/outbox
  -> read models, notifications, audit, portfolio
  <- acknowledgments, remote commands, policy, and conflicts
```

The client remains capable of local export and recovery when synchronization is unavailable.

## 16. Technology selection criteria

Technology choices must be evaluated by:

- Correctness and determinism.
- Browser and offline support.
- Worker compatibility.
- Large-data performance.
- Accessibility.
- Security history.
- Maintenance and ecosystem health.
- Bundle and memory cost.
- Testability.
- License.
- Migration and replacement cost.

The README recommendation of TypeScript, React, Vite, service worker, IndexedDB/Dexie, and Web Workers is a starting point, not an exemption from ADR review and benchmarks.

## 17. Architecture fitness tests

| Test ID | Architecture rule | Automated evidence |
|---|---|---|
| ARCH-AT-001 | Domain has no UI/framework imports | Dependency graph check |
| ARCH-AT-002 | UI cannot write storage directly | Import-boundary/static rule |
| ARCH-AT-003 | External payloads receive runtime validation | Boundary contract tests |
| ARCH-AT-004 | Long work runs outside main thread | Worker integration and long-task tests |
| ARCH-AT-005 | Stale calculation cannot commit | Revision-race integration test |
| ARCH-AT-006 | Derived stores are rebuildable | Delete-and-rebuild test |
| ARCH-AT-007 | Command transaction is atomic | Failure injection at transaction steps |
| ARCH-AT-008 | Report input is one immutable revision | Concurrent-edit report test |
| ARCH-AT-009 | Package graph has no cycles | CI dependency check |
| ARCH-AT-010 | Future adapter failure does not corrupt core | Port-contract failure tests |

## 18. Acceptance

The architecture is acceptable only when its boundaries are executable through package rules, schemas, tests, and benchmarks. Diagrams and intentions without enforcement are insufficient.