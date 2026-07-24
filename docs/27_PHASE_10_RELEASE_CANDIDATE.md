# Phase 10 — Version 1 Enterprise Offline Release Candidate

## Status

This milestone creates application version `1.0.0-rc.1`, Project Schema Version 4, IndexedDB Version 6, and Portable Envelope Version 1.

It is a **release candidate**, not a qualified `1.0.0` release. Technical qualification evidence is generated automatically, while the functional requirements gate remains blocked until every mapped mandatory partial capability is completed.

## Delivered qualification infrastructure

### Migration and recovery

- Pure deterministic migration matrix for Project Schemas 1–4.
- Snapshot-project migration using the same authoritative path.
- IndexedDB Version 6 atomic migration for projects and snapshots.
- Portable-file checksum verification before migration.
- Export, mutation, snapshot rollback, deletion, re-import, and pre-import recovery drills.

### Import and dependency security

- 25 MB portable-file limit.
- Maximum JSON depth, node count, key count, and cumulative string size.
- Prototype-pollution key rejection.
- Plain-object enforcement.
- Checksum, envelope, schema, ID, and reference validation before storage mutation.
- npm dependency audit with high/critical enforcement.
- CycloneDX SBOM artifact.

### Browser, accessibility, and offline behavior

- Chromium, Firefox, WebKit, and mobile-Chromium projects.
- Project-library and workspace startup smoke tests.
- IndexedDB project persistence after reload.
- Automated axe checks using WCAG 2.0, 2.1, and 2.2 A/AA tags.
- Keyboard focus smoke test.
- Chromium service-worker offline reload drill.
- Controlled PWA update prompt instead of forced activation.
- Automatic recovery snapshots before service-worker update activation.

### Performance and provenance

- Existing 10,000-activity CPM and 20,000-row report guards retained.
- Repeated 150-cycle schedule, cost, risk, report, serialization, and migration soak test.
- SHA-256 build and SBOM digests.
- Commit, workflow, runtime, and platform provenance.
- Retained release-evidence JSON artifact.

### Product and operations package

- Commercial building, linear road works, and interior fit-out templates.
- User onboarding guide.
- Administrator and support guide.
- Formula handbook.
- In-app qualification gate and blocker view.
- Downloadable local evidence JSON.

## Release gate behavior

The candidate is qualified only when:

1. every required release gate is present and passing;
2. no gate is `not-run`, `warning`, or `fail` when mandatory;
3. no critical or high security finding is unresolved;
4. the package versions match the supported compatibility contract;
5. the functional requirement blocker list is empty.

The CI workflow may complete successfully while the generated evidence correctly reports `qualified: false`. This distinction lets the qualification infrastructure merge safely without falsely certifying the product.

## Current functional blockers

The complete source of truth is `src/domain/release/requirementCoverage.ts`. Current blocker classes are:

- project wizard and snapshot comparison;
- advanced WBS editing and separate immutable/user-facing IDs;
- complete coding dictionaries and activity fields;
- copy/paste, fill-down, configurable columns, and full import mapping;
- multiple continuous path ranking and complete frozen cost baseline;
- manual network positions and global saved search;
- BOQ alternates/provisional sums;
- selectable EAC and productivity forecast methods;
- complete field-record metadata;
- XLSX and deterministic PDF output;
- locale, precision, date, duration, light, and system theme controls;
- stable actor/device identifiers and complete persisted calculation-run records.

## Promotion rule

Do not change the package version to `1.0.0` or label the release enterprise-qualified until:

- the requirement blocker list is empty;
- every technical gate remains passing;
- expert manual accessibility and organization-specific device acceptance are recorded;
- the release evidence package is reviewed and approved.
