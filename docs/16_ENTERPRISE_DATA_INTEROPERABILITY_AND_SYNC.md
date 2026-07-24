# Enterprise Data, Interoperability, and Synchronization

## 1. Purpose

This document defines how CPM preserves data integrity across local storage, portable project files, imports, exports, migrations, future APIs, and eventual collaboration. The initial product remains offline-first; synchronization is a later adapter and must not weaken the local domain model.

## 2. Authoritative data boundaries

Authoritative data includes:

- Project metadata and settings.
- Calendars and working-time rules.
- WBS, activities, relationships, constraints, codes, and assignments.
- Baselines and approved revisions.
- BOQ, unit-price analysis, markups, cost accounts, and allocations.
- Progress, actuals, costs, productivity, resources, risks, changes, and approvals.
- Audit records, manual override reasons, snapshots, and migration metadata.

Derived data includes:

- Calculated dates, float, path traces, PERT values, curves, EVM metrics, forecasts, histograms, layout coordinates generated automatically, search indexes, thumbnails, and report caches.

Derived data may be persisted for speed only when it is keyed by authoritative revision, engine version, and settings hash.

## 3. Canonical representation

- Internal IDs are immutable UUIDs.
- User IDs and codes are normalized according to documented case and whitespace policy.
- Canonical JSON uses deterministic key ordering for hashing and test fixtures.
- Decimal quantities and money use explicit scale and rounding metadata.
- Units use stable unit identifiers rather than display abbreviations alone.
- Date-only, local date-time, instant, timezone, and work-calendar references remain distinct.
- Enumerations preserve unknown future values during round-trip where safe.
- Text is normalized to a documented Unicode form without silently changing user-visible meaning.

## 4. Schema versioning

Separate versions are maintained for:

- Local database schema.
- Domain command schema.
- Calculation engine input/output schema.
- `.cpmproj` container and manifest.
- Individual entity payloads where independent evolution is needed.
- External import/export adapters.
- Future network API and synchronization protocol.

Version numbers must not be reused. Compatibility and migration support are declared explicitly.

## 5. Portable `.cpmproj` bundle

The portable file remains the universal ownership and recovery format.

### 5.1 Required characteristics

- Open, documented container structure.
- Manifest with format version, project identity, timestamps, application and engine versions, content inventory, and checksum algorithm.
- Canonical authoritative data payloads.
- Optional derived cache payloads that can be discarded.
- Optional attachments with metadata and checksums.
- Optional snapshots and audit history according to export policy.
- Per-entry and whole-bundle integrity verification.
- No executable code.
- Safe path and size rules.

### 5.2 Export modes

- Complete project backup.
- Lightweight project without attachments.
- Template with sensitive and actual data removed.
- Review package with read-only report data.
- Diagnostic package with selected redacted records.
- Future encrypted and organization-policy-controlled bundles.

### 5.3 Import modes

- Open as a new project.
- Restore as a copy.
- Replace an existing project after comparison and safety snapshot.
- Merge through a controlled mapping workflow only where entity identity and conflict policy are explicit.
- Open read-only when the schema is newer but safely inspectable.

## 6. Interoperability contracts

Every adapter must publish:

- Supported source versions.
- Supported entities and fields.
- Unit, calendar, date, duration, currency, code, and precision mapping.
- Relationship and constraint mapping.
- Baseline and progress mapping.
- Unsupported-field behavior.
- Duplicate and identity policy.
- Conversion warnings and loss report.
- Round-trip expectations.
- Security and resource limits.
- Reference fixtures and acceptance tests.

## 7. CSV and XLSX

### CSV

- Schema-specific templates with stable column identifiers.
- UTF-8 by default with explicit delimiter, quote, newline, decimal, date, timezone, and encoding detection/selection.
- Formula-injection-safe export.
- Deterministic duplicate and blank-row handling.
- Error report includes row, column, raw value, expected type, and correction guidance.

### XLSX

- Workbook structure is versioned.
- Named sheets and columns have stable machine identifiers in hidden or metadata fields where practical.
- Formulas are not trusted or executed by CPM.
- Large workbooks are parsed in workers with row, cell, shared-string, image, and archive limits.
- Styles are not authoritative data.
- A CSV fallback exists for every supported tabular entity.

## 8. External schedule formats

Potential adapters include Microsoft Project XML and Primavera-compatible exchange. Each adapter must address:

- Different calendar and duration semantics.
- Relationship and lag units.
- Constraint mapping.
- Summary tasks and WBS identity.
- Actuals and out-of-sequence behavior.
- Baselines.
- Resource and cost loading.
- Activity codes and user-defined fields.
- Unsupported enterprise fields.

An import is not considered successful merely because rows appear. It must produce a conversion report and a schedule-health result.

## 9. Future API architecture

Future APIs must be resource- and command-oriented with explicit versioning.

- Query APIs return immutable revisions or revision tokens.
- Mutation APIs use commands with idempotency keys and expected revision.
- Bulk APIs have bounded item and payload limits.
- Long-running imports, exports, calculations, and reports use job resources with status and cancellation.
- APIs never expose storage internals as the contract.
- Authorization is enforced server-side per project and action.
- Errors use stable machine codes and safe human descriptions.
- Pagination uses stable cursors.
- Rate and resource limits are documented.

## 10. Synchronization model

### 10.1 Non-negotiable properties

- Local commands are durable before being marked pending sync.
- Sync is idempotent.
- Server acknowledgment references accepted command and resulting revision.
- Rejected commands remain visible and recoverable.
- Conflict resolution never silently drops a user change.
- Derived calculations may be recomputed; authoritative commands and approved baselines are preserved.
- A project can be exported even while offline or conflicted.

### 10.2 Proposed command-log approach

Each local mutation generates a command containing:

- Globally unique command ID.
- Project and entity identifiers.
- Base project/entity revision.
- Operation type.
- Normalized payload.
- Actor/device and local timestamp.
- Client schema version.
- Dependency command IDs where needed.

The server validates authorization, schema, invariants, and expected revision before accepting. Accepted commands receive server sequence and authoritative revision.

### 10.3 Conflict classes

- Independent-field edits that can merge automatically.
- Same-field concurrent edits requiring user choice or policy.
- Delete-versus-edit.
- Reparent/reorder conflicts.
- Relationship graph conflicts.
- Baseline or approval conflicts.
- Code uniqueness conflicts.
- Schema or policy conflicts.
- Attachment replacement conflicts.

Conflict UI must show base, local, remote, affected calculations, and the resulting choice. Resolution itself is a new auditable command.

## 11. Collaborative calculation authority

A future enterprise service may calculate authoritative shared results, but:

- Engine version and input revision remain explicit.
- Local preview calculations may run immediately and are labeled pending server confirmation where policy requires.
- Server and local engines use the same reference fixtures and compatibility contract.
- A version mismatch cannot silently change results.
- Approved baseline calculations are immutable and reproducible.

## 12. Tenant and workspace data boundaries

Future enterprise storage must enforce:

- Organization and project ownership on every record and index.
- Tenant-scoped encryption/storage boundaries where architecture permits.
- No cross-tenant cache keys, search indexes, exports, or background jobs.
- Explicit transfer of project ownership.
- Data residency and retention policy metadata.
- Audit of administrative access.

## 13. Retention and history

- Active project authority is never compacted in a way that breaks referential integrity or required audit history.
- Command history may be checkpointed after a verified immutable snapshot according to policy.
- Baselines, approvals, named snapshots, legal holds, and security events are protected from automatic pruning.
- Attachment retention is independent from derived thumbnail retention.
- Export records state which history and attachments were included.

## 14. Data quality controls

The application must continuously detect:

- Broken references.
- Duplicate user IDs or codes.
- Unit incompatibility.
- Currency mismatch.
- Invalid date/timezone/calendar combinations.
- Allocation totals outside tolerance.
- Baseline and data-date inconsistency.
- Stale derived results.
- Unsupported or unknown enum values.
- Orphaned attachments and audit records.

Repair commands must be explicit, previewable, reversible where possible, and audited.

## 15. Test catalog

| Test ID | Scenario | Pass condition |
|---|---|---|
| DATA-AT-001 | Canonical serialize same project repeatedly | Byte-identical canonical authoritative payload |
| DATA-AT-002 | Export/import every supported entity | Identity, precision, references, and provenance preserved |
| DATA-AT-003 | Open newer unsupported file | No destructive write; safe read-only or clear refusal |
| DATA-AT-004 | Migrate every supported schema | Canonical target fixtures match |
| DATA-AT-005 | Corrupt each bundle entry | Integrity failure identifies entry before mutation |
| DATA-AT-006 | Extreme CSV locale corpus | Deterministic conversion and row-level diagnostics |
| DATA-AT-007 | XLSX archive and shared-string bombs | Limits stop processing safely |
| DATA-AT-008 | External schedule reference fixtures | Dates, logic, constraints, and losses match mapping spec |
| DATA-AT-009 | Round-trip supported external fields | No undocumented loss or semantic drift |
| DATA-AT-010 | Retry identical future command | One authoritative effect and stable acknowledgment |
| DATA-AT-011 | Concurrent independent edits | Automatic merge preserves both with audit evidence |
| DATA-AT-012 | Same-field conflict | User sees base/local/remote and no change is silently lost |
| DATA-AT-013 | Delete-versus-edit conflict | Policy or explicit resolution is required |
| DATA-AT-014 | Offline queue restart | Pending commands survive restart in original order/dependencies |
| DATA-AT-015 | Server rejection | Local work remains exportable and rejection is actionable |
| DATA-AT-016 | Cross-tenant access attempt | Request, cache, job, and export access denied and audited |
| DATA-AT-017 | History compaction | Checkpoint preserves required audit, baseline, and restore behavior |
| DATA-AT-018 | Derived-cache deletion | Project reopens and recomputes identical authority-derived outputs |
| DATA-AT-019 | Unit/currency mismatch | Invalid aggregation is prevented with specific diagnostics |
| DATA-AT-020 | Repair broken reference | Preview, explicit command, audit, and post-repair health pass |

## 16. Acceptance

No adapter, migration, sync feature, or file change is complete without versioned contracts, resource limits, conversion evidence, loss reporting, and reference tests. Convenience must never override user ownership or data integrity.