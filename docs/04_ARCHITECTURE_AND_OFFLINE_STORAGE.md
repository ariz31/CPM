# Architecture and Offline Storage

## 1. Architectural objective

The application must remain fully useful offline while preserving a clean path to desktop packaging, file exchange, optional cloud backup, collaboration, and integrations. The calculation domain must not depend on the browser, React, IndexedDB, or a future server API.

## 2. Recommended system shape

```text
┌──────────────────────────────────────────────────────────────┐
│ Presentation                                                  │
│ Project library · grids · Gantt · network · charts · reports │
└──────────────────────────────┬───────────────────────────────┘
                               │ commands / view models
┌──────────────────────────────▼───────────────────────────────┐
│ Application services                                          │
│ use cases · validation · transactions · undo · imports       │
└──────────────────────────────┬───────────────────────────────┘
                               │ domain objects
┌──────────────────────────────▼───────────────────────────────┐
│ Domain and calculation engine                                 │
│ CPM · PERT · BOQ · S-curve · EVM · productivity · calendars │
└──────────────────────────────┬───────────────────────────────┘
                               │ repository interfaces
┌──────────────────────────────▼───────────────────────────────┐
│ Local persistence                                             │
│ IndexedDB · snapshots · attachments · project-file adapter   │
└──────────────────────────────┬───────────────────────────────┘
                               │ optional adapters
┌──────────────────────────────▼───────────────────────────────┐
│ Future integrations                                           │
│ cloud backup · sync · collaboration · external formats       │
└──────────────────────────────────────────────────────────────┘
```

## 3. Proposed technology baseline

The following is a recommended starting point and should be confirmed through architecture decision records:

- TypeScript with strict mode
- React for presentation
- Vite for build and local development
- PWA service worker for application-shell caching and offline startup
- IndexedDB using Dexie or a similarly typed abstraction
- Web Workers for schedule, risk, time-phasing, and large import calculations
- Zod or equivalent runtime schemas for commands, imports, and project-file validation
- Decimal library for currency and reconciliation-sensitive values
- A virtualization-capable data grid
- A charting library that supports accessible export and large time series
- A graph/layout library for activity networks
- Vitest or equivalent for unit and integration tests
- Playwright for offline and end-to-end workflows

Desktop packaging with Tauri or another shell may be evaluated later, but the web application must remain a complete target.

## 4. Module boundaries

```text
src/
  app/                  application bootstrap and routing
  domain/
    common/             IDs, decimals, units, validation results
    calendar/           work calendars and date arithmetic
    schedule/           activities, relationships, constraints, CPM
    pert/               three-point estimates and probability
    boq/                quantities, rates, assemblies, markups
    cost/               accounts, allocations, actual cost
    progress/           status updates and percent-complete methods
    curves/             time phasing and S-curves
    evm/                earned-value metrics and forecasts
    productivity/       field records, rates, forecasts
    resources/          resources, assignments, histograms
    risk/               risk register and future simulation contracts
  application/
    commands/           explicit mutations
    queries/            read models
    services/           import, export, reporting, snapshots
  infrastructure/
    db/                 IndexedDB implementation and migrations
    files/              .cpmproj serialization and validation
    workers/            worker hosts and message contracts
    reports/            PDF/CSV/XLSX renderers
  features/             UI feature modules
  shared/               reusable UI and utilities
```

No module under `domain/` may import React, IndexedDB, browser storage, or UI libraries.

## 5. Command and transaction model

Every mutation should be represented as a command, for example:

- `CreateActivity`
- `UpdateActivityDuration`
- `AddRelationship`
- `SetStatusDate`
- `CreateBaseline`
- `PostProgressEntry`
- `AllocateBoqItem`
- `ImportProjectBundle`

A command must include command ID, project ID, expected project revision, timestamp, payload schema version, and optional user reason. Application services validate the command, execute it in one persistence transaction, increment the project revision, invalidate dependent calculations, and append an audit record.

Optimistic UI may be used, but failed persistence must roll back visible state.

## 6. Derived data strategy

Authoritative input data and derived calculation data must be separated.

### Authoritative examples

- Activity duration and calendar assignment
- Relationships and constraints
- Actual dates and quantities
- BOQ quantities and rates
- Baseline snapshot
- Productivity records

### Derived examples

- Early and late dates
- Float and critical paths
- Time-phased planned values
- EVM metrics
- Productivity forecasts
- Dashboard summaries

Derived results should be stored as versioned caches containing:

- Engine version
- Project revision
- Calculation settings hash
- Calendar revision
- Status date
- Started/completed timestamp
- Warning list
- Output checksum

If any dependency changes, the result is stale and must not be presented as current without a visible indication.

## 7. Worker architecture

Long-running tasks must execute in Web Workers:

- CPM recalculation
- Network path analysis
- S-curve generation
- Monte Carlo simulation when added
- Large CSV/XLSX import parsing
- Report dataset preparation

Worker messages must use versioned plain-data contracts. UI components should communicate through an application service rather than directly with workers.

Calculation requests need cancellation tokens. A superseded request should stop or have its result discarded by revision check.

## 8. Local database

### 8.1 Recommended stores/tables

- `projects`
- `projectSettings`
- `calendars`
- `calendarExceptions`
- `wbsNodes`
- `activities`
- `relationships`
- `constraints`
- `baselines`
- `baselineEntities`
- `boqSections`
- `boqItems`
- `resources`
- `resourceAssignments`
- `costAccounts`
- `costAllocations`
- `progressEntries`
- `actualCosts`
- `productivityEntries`
- `risks`
- `attachments`
- `calculationRuns`
- `calculationResults`
- `snapshots`
- `auditEvents`
- `savedViews`
- `appSettings`

Tables may be normalized differently for performance, but relationships and ownership boundaries must remain explicit.

### 8.2 Atomicity

Multi-entity operations must use one IndexedDB transaction where supported. Examples:

- Importing activities and relationships
- Deleting an activity and its assignments
- Creating a baseline and its entity snapshots
- Restoring a project snapshot
- Posting a progress update with quantity, actual cost, and productivity records

No operation may leave half-created cross-references after interruption.

### 8.3 Revisioning

Each project has a monotonically increasing `revision`. Entities also have `createdAt`, `updatedAt`, and optional `deletedAt`. Calculation results reference the project revision they were based on.

Soft deletion is recommended for undo and audit-sensitive entities. Compaction can permanently purge deleted data after exportable backups and retention rules are satisfied.

## 9. Autosave and durability

- Persist explicit edits immediately or after a short bounded debounce.
- Never hold important changes only in component state.
- Show clear `Saving`, `Saved locally`, and `Save failed` indicators.
- Keep a rolling recovery journal or frequent lightweight snapshots.
- On startup, detect interrupted transactions, stale locks, and incomplete imports.
- Recovery should open a safe copy rather than overwrite the last valid project automatically.

## 10. PWA offline behavior

The service worker should cache only versioned application assets and approved static templates. Project data remains in IndexedDB or exported files, not in the HTTP cache.

Required offline tests:

1. Install application.
2. Create and calculate a project.
3. Close all windows.
4. Disable network.
5. Reopen the application.
6. Edit, calculate, export, and print/report without network.
7. Upgrade the application with existing projects intact.

The update flow must avoid replacing an open application unexpectedly. Users should be notified that an update is ready and prompted to reload after data is safely persisted.

## 11. File access

Where the File System Access API is supported, the application may offer explicit Open, Save, and Save As behavior. A portable download/upload fallback is mandatory for other browsers.

The local database is the working copy. A linked file is an external persistence target, not a substitute for transactional local storage.

Recommended file states:

- `Local only`
- `Linked to file; saved`
- `Linked to file; local changes not exported`
- `External file changed`
- `Export failed`

Automatic writes to an external file require explicit permission and safe temp/replace behavior where the platform supports it.

## 12. Import pipeline

```text
Select file
  → read into isolated buffer
  → verify container and size
  → parse manifest
  → validate schema and checksums
  → migrate in memory
  → validate references and invariants
  → show import report
  → create new project or replace a copy transactionally
  → calculate and health-check
```

Imports must not mutate the active project before validation completes.

## 13. Future synchronization boundary

Optional sync should replicate commands or versioned entity changes, not expose the local database directly. Requirements:

- Local changes work without server confirmation.
- Stable IDs are generated locally.
- Conflicts are detected at entity or field level.
- Baselines and audit events are append-oriented.
- Calculation results are normally recomputed locally rather than synchronized as authority.
- Attachments use content hashes.
- Users can export all data without the service.

A sync adapter should implement the same repository contracts as local persistence plus conflict metadata.

## 14. Performance targets

Initial engineering targets:

- Open a 1,000-activity project in under 2 seconds on a typical mid-range laptop after data is local.
- Recalculate 5,000 activities and 15,000 relationships without freezing the UI.
- Scroll and edit large activity and BOQ grids using virtualization.
- Generate weekly S-curves for a 10-year project without period-by-period rescanning of all records.
- Import large files with progress reporting and cancellation.
- Keep the application interactive while charts and network layouts are prepared.

These are test targets, not guarantees, and should be refined with benchmark fixtures.

## 15. Error boundaries and observability

The application must log structured local diagnostics for recoverable failures without sending data remotely by default. Diagnostic export may include:

- Application and engine version
- Browser/runtime information
- Error code and stack trace
- Database schema version
- Project size counts
- Last successful command/calculation IDs

Project names, notes, rates, and attachments should be excluded unless the user explicitly includes them.

## 16. Architecture decision records

Before implementation begins, create ADRs for:

1. Front-end framework and build system
2. Domain time representation and calendar semantics
3. Decimal/money representation
4. IndexedDB abstraction and transaction strategy
5. State management and command bus
6. Worker messaging and cancellation
7. Grid, Gantt, network, and chart libraries
8. Project-file container and checksum algorithm
9. PDF/XLSX export strategy
10. Out-of-sequence progress convention
11. Relationship lag calendar rule
12. Desktop packaging decision

## 17. Dependency policy

- Prefer mature, maintained, permissively licensed dependencies.
- Pin major versions and review transitive licenses.
- Avoid libraries that require a network service for core operation.
- Keep authoritative formulas in first-party code.
- Large visualization libraries must be measured for bundle and runtime impact.
- Security advisories and migration cost are part of library selection.
