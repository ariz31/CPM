# Phases 1–3 Release Notes

## Scope

This milestone advances CPM from the Phase 0 scheduling vertical slice through three integrated roadmap phases:

1. Safe project lifecycle and portable local data.
2. Calendars, WBS, and activity planning.
3. Calendar-aware CPM and schedule health.

The phases are delivered together because the Version 2 project schema, calendar engine, activity model, worker protocol, and persistence migration form one compatibility boundary.

## Phase 1 — Project library and safe local storage

Delivered project lifecycle commands, transactional journals, snapshots, trash and recovery, project quarantine, storage health, metadata/settings, and checksummed portable files. IndexedDB automatically upgrades legacy Version 1 records into the Version 2 project model.

Key safety properties:

- A project save and its journal entry commit in one transaction.
- Failure-injection tests prove interrupted writes roll back.
- Trash creates a pre-delete snapshot.
- Snapshot restore creates a recovery snapshot first.
- Damaged records move to quarantine rather than blocking all projects.
- Portable imports validate envelope version, checksum, schema, and size before writing.

## Phase 2 — Calendars, WBS, and activity planning

Delivered multiple calendars, split shifts, exceptions, holidays, timezone-stable dates, WBS records, richer activities, commands, undo/redo, a virtualized editing grid, relationship and calendar panels, and staged CSV activity imports.

Key behavior:

- Calendar calculations operate at minute precision.
- Commands validate cloned data before returning a mutation.
- Undo/redo restores complete authoritative project revisions.
- Invalid CSV rows prevent the whole import operation.
- Grid rendering limits DOM rows to the visible window plus overscan.

## Phase 3 — CPM engine and schedule health

Delivered a rewritten calendar-aware scheduling engine, worker revision protocol, schedule health findings, relationship editing, and timeline preview.

Key behavior:

- Supports FS, SS, FF, and SF with positive or negative lag.
- Rejects missing references, duplicate identical links, self-links, and cycles.
- Calculates early and late dates, total float, free float, criticality, near-criticality, and driving relationships.
- Applies supported constraints and reports hard constraints and deadline misses.
- Keeps previous UI results until a valid worker result for the current project revision arrives.
- Includes a 10,000-activity chain performance safety test.

## Data compatibility

- Database schema: Version 2.
- Project record schema: Version 2.
- Calculation engine: `0.3.0-calendar-cpm`.
- Portable file envelope: Version 1 containing a Version 2 project record.

Legacy local records are upgraded in place. Derived calculation output is not authoritative and may be regenerated.

## Validation evidence

The milestone defines written acceptance tests `P1-AT-001` through `P3-AT-008`. CI runs Vitest, strict TypeScript checking, traceability checks, the performance guard, and the Vite production/PWA build.

The implementation archive used for repository transfer was split into fixed-size segments. GitHub Actions verified the SHA-256 of the concatenated payload and decoded archive before extracting any source, and all temporary bootstrap files were removed from the implementation commit.

## Known limitations

- `.cpmproj` is currently a checksummed JSON envelope rather than a streamed ZIP bundle with attachments.
- Summary activities do not yet roll up child dates.
- Advanced grid fill, multi-range clipboard operations, saved layout details, and exhaustive browser automation remain future refinements.
- Cross-calendar relationship lag uses the successor calendar.
- Phase 4 professional Gantt, network, schedule reports, and PDF output are not included.
