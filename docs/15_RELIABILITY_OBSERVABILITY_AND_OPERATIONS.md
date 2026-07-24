# Reliability, Observability, and Operations

## 1. Objective

CPM must preserve user work and remain diagnosable across crashes, browser shutdowns, storage pressure, failed calculations, corrupted files, interrupted imports, failed migrations, and future service outages. Offline operation reduces network dependence but does not remove operational risk.

## 2. Reliability model

### 2.1 Authoritative state

Authoritative project records are committed only through validated transactions. A transaction either completes fully or leaves the prior revision authoritative.

### 2.2 Derived state

Calculated dates, curves, indexes, chart geometry, search indexes, previews, and caches are derived. They may be deleted and rebuilt from authoritative records and versioned calculation inputs.

### 2.3 Immutable safety points

The system creates immutable safety points before:

- Schema migration.
- Destructive import or restore.
- Project replacement.
- Bulk delete or restructuring.
- Baseline replacement.
- History compaction.
- Encryption or key-format migration.

### 2.4 Failure isolation

- One project failure must not prevent application startup.
- One module failure must not corrupt unrelated modules.
- One worker failure must not commit partial output.
- One report failure must not change project authority.
- Future cloud or sync failure must not block local editing unless the project is explicitly policy-controlled as read-only.

## 3. Transaction and command rules

Every authoritative command contains:

- Command ID and idempotency token.
- Project ID and expected project revision.
- Actor/device context where available.
- Input payload and schema version.
- Validation result.
- Affected entity identifiers.
- Transaction result and new revision.
- Undo or compensating-command metadata where supported.
- Audit event metadata.

Optimistic updates may be shown only when rollback is exact and visible. Commands with mismatched expected revision must fail or enter an explicit conflict workflow.

## 4. Autosave

- Autosave is transaction-based, not timer-only document rewriting.
- The UI shows `editing`, `saving`, `saved`, `warning`, `failed`, and `recovery required` states.
- Repeated edits may be debounced for efficiency, but navigation or close protection must account for uncommitted edits.
- Failed autosave retains editable user input and provides retry, export, or recovery action.
- Autosave never clears undo history until the command is durably committed.

## 5. Crash and restart behavior

On startup, the application must:

1. Open the application shell independently of project databases.
2. Verify storage and migration status.
3. Detect incomplete operations through transaction journals or operation markers.
4. Roll back or resume only when the operation contract supports it.
5. Keep affected projects quarantined until verified.
6. Open unaffected projects normally.
7. Explain recovered, rolled-back, or unresolved operations.

## 6. Storage health

The product must expose:

- Estimated storage used and available where the platform permits.
- Project and attachment size.
- Snapshot and audit-history size.
- Pending compaction or repair.
- Schema and migration version.
- Last successful backup/export.
- Storage quota warnings before high-risk writes.

The application must not promise exact available quota where browser APIs are approximate.

## 7. Recovery center

A dedicated recovery center must support:

- Listing projects with failed open, failed migration, corrupted indexes, missing attachments, checksum mismatch, or unsupported version.
- Opening safe read-only metadata.
- Rebuilding derived indexes and caches.
- Restoring a recovery snapshot as a copy.
- Exporting a raw diagnostic bundle.
- Importing a known-good portable backup.
- Deleting a damaged local copy only after export or explicit acknowledgment.
- Recording all recovery operations in audit history.

## 8. Observability model

### 8.1 Local-first observability

Observability data remains local by default. It must be possible to diagnose common failures without transmitting project data.

### 8.2 Structured events

Operational events use stable schemas and codes for:

- Application startup and shutdown.
- Project open and close.
- Transaction success/failure.
- Calculation queued, started, cancelled, stale, completed, and failed.
- Import/export stages.
- Migration stages.
- Worker crashes and restarts.
- Storage quota and transaction errors.
- Report generation.
- Recovery and repair.
- Future authentication, authorization, sync, and service health.

### 8.3 Severity

- Debug: development-only detail.
- Info: normal operation milestone.
- Warning: degraded behavior or recoverable inconsistency.
- Error: operation failed but authority remains protected.
- Critical: potential data loss, security compromise, or inability to recover.

## 9. Error contract

Every user-visible failure must include:

- Stable error code.
- Plain-language title.
- What failed.
- What data remains safe.
- What the user can do next.
- Retry and cancellation status.
- Recovery or diagnostic action.
- Expandable technical detail.

Errors must not expose secrets, raw stack traces, filesystem paths, or unredacted project content in normal UI.

## 10. Support bundle

A support bundle is user-generated and inspectable before sharing.

Default contents:

- Application, build, engine, schema, and file-format versions.
- Runtime, browser, operating system, locale, timezone, and storage capability.
- Feature flags and relevant settings excluding secrets.
- Recent error codes and operation timeline.
- Worker and migration status.
- Performance summary and memory-pressure indicators where available.
- Project ID replaced by a random support alias.
- Project metadata and project content excluded by default.

Optional user-selected additions:

- Sanitized project health report.
- Specific conversion report.
- Specific calculation record.
- Redacted sample entities.
- Full encrypted project bundle only through an explicit separate action.

## 11. Backup strategy

### 11.1 User-controlled portable backup

- Complete `.cpmproj` export remains the universal backup mechanism.
- The project library shows the last successful export date if known.
- Backup reminders are local and user-configurable.
- Export verification reopens and validates the generated bundle before reporting success where feasible.

### 11.2 Automatic local recovery

- Automatic snapshots are bounded by count, age, and storage budget.
- Named snapshots and baselines are not removed by automatic retention without explicit policy.
- Snapshot pruning is transactional and auditable.

### 11.3 Future managed backup

A managed backup adapter may support organization-approved destinations, encryption, retention, legal hold, restore testing, and policy reporting. It must not become the only recovery path.

## 12. Migration operations

Each migration defines:

- Source and target schema versions.
- Preconditions and storage estimate.
- Backup/safety-point behavior.
- Forward transformation.
- Validation and canonical fixture.
- Resume or rollback strategy.
- Expected performance.
- Known irreversible effects.
- User-facing progress and failure messaging.

Migration tests run from every supported released schema to the current schema, not only from the immediately previous version.

## 13. Future service reliability

If cloud or collaboration is introduced:

- Local commands queue durably before transmission.
- Sync retries use bounded exponential backoff with jitter.
- Authentication failure, permission change, conflict, quota, and server rejection are distinct states.
- Local edits are never silently discarded after server rejection.
- Service status and last synchronized revision are visible.
- The server must be idempotent for retried commands.
- Regional and tenant isolation failures are treated as security incidents.
- Offline and degraded modes are tested regularly.

## 14. Service objectives

For the offline edition:

- Zero accepted silent data-loss defects.
- 100% of authoritative write classes covered by interruption tests.
- 100% of supported migrations covered by fixtures.
- Project library opens even when an individual project is damaged.
- Recovery action is available for every documented recoverable failure.

For future hosted services, explicit SLOs for availability, durability, latency, sync delay, recovery time, and recovery point must be approved before launch.

## 15. Operational test catalog

| Test ID | Scenario | Pass condition |
|---|---|---|
| OPS-AT-001 | Terminate during every write class | Last complete revision recovers; no partial authority |
| OPS-AT-002 | Terminate during migration | Prior version or validated resumed version is available |
| OPS-AT-003 | Corrupt one project index | Other projects open; affected index rebuilds |
| OPS-AT-004 | Corrupt authoritative record | Project quarantines with export and recovery options |
| OPS-AT-005 | Exhaust storage quota | Transaction fails atomically with actionable guidance |
| OPS-AT-006 | Crash calculation worker | Last valid results remain; worker restarts safely |
| OPS-AT-007 | Cancel import/export/report | No partial project mutation or misleading success file |
| OPS-AT-008 | Restore snapshot as copy | Source remains unchanged and restored copy validates |
| OPS-AT-009 | Prune automatic snapshots | Retention rules hold and named safety points remain |
| OPS-AT-010 | Generate support bundle | Required diagnostics included and sensitive data absent |
| OPS-AT-011 | Reopen exported backup | Bundle passes full integrity and schema validation |
| OPS-AT-012 | Upgrade all supported schemas | Canonical target fixtures match and operation is atomic |
| OPS-AT-013 | Unsupported newer schema | Read/write protection prevents destructive downgrade |
| OPS-AT-014 | Thirty-day simulated operation | No unbounded audit, cache, queue, or memory growth |
| OPS-AT-015 | Future service unavailable | Local core remains usable and queued work is visible |

## 16. Release operations

A release candidate requires:

- Recovery drill evidence.
- Migration matrix results.
- Storage quota and interruption results.
- Support-bundle redaction review.
- Known-error-code catalog.
- Performance and memory comparison.
- Dependency and security evidence.
- Rollback or hotfix plan.
- Supported browser/runtime matrix.
- Offline install and update test.

## 17. Incident readiness

Before broad production distribution, maintainers must define:

- Security and reliability contact paths.
- Severity classification.
- Triage ownership.
- Data-loss response procedure.
- Release rollback and emergency patch process.
- User communication templates.
- Evidence retention rules.
- Post-incident review and regression-test requirements.

A post-incident action is incomplete until the root cause is addressed or explicitly accepted and a regression test prevents recurrence.