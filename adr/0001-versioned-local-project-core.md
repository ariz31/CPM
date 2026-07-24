# ADR 0001 — Versioned Local Project Core

- Status: Accepted
- Date: 2026-07-24

## Context

The application must remain fully functional offline while preserving a future path to portable files, managed backup, and synchronization. Scheduling calculations depend on calendars, WBS, activities, relationships, and project settings that must change atomically and migrate across versions.

## Decision

Use a Version 2 authoritative project aggregate stored locally in IndexedDB through Dexie. Authoritative project mutations are command-oriented and persist with a journal entry inside one transaction. Snapshots and quarantine are separate stores. Calculated schedule results are derived and disposable.

The project aggregate contains stable internal IDs, metadata, settings, calendars, WBS records, activities, relationships, saved views, revision metadata, and status. Portable `.cpmproj` files contain a versioned envelope, a complete project record, and a SHA-256 checksum. Import is staged and validated before local storage mutation.

Heavy CPM calculation runs in a Web Worker with a versioned request carrying the project revision. A response is accepted only when its revision still matches the current project.

## Consequences

Benefits:

- Offline operation does not depend on a service.
- Project writes and audit metadata are atomic.
- Schema migrations have one authoritative boundary.
- Derived results can be rebuilt after engine upgrades.
- Future synchronization can transmit commands or complete revisions without moving domain authority into the UI.

Costs:

- The project aggregate can become large and requires careful cloning and transaction performance.
- Multi-user conflict handling is deferred to a future adapter.
- Attachment streaming and chunked portable bundles require a later file-format revision.

## Rejected alternatives

- Storing authoritative data in React state only: insufficient durability and migration control.
- Storing each module in unrelated browser keys: weak referential integrity and transaction behavior.
- Requiring a remote database from the first release: violates offline ownership and adds unnecessary failure modes.
- Persisting calculated schedule dates as authoritative inputs: risks stale and engine-version-dependent data.
