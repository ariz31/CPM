# Application Implementation Status

## Current milestone

The executable offline application covers roadmap Phases 0–9 and now includes the **Phase 10 Version 1 release-qualification system**.

Phase 10 currently produces release candidate `1.0.0-rc.1`. It does not claim qualified Version 1 status because every functional requirement is mapped and several mandatory capabilities remain partial. The in-app evidence panel and CI artifact disclose those blockers explicitly.

## Phase 10 delivered

- Project Schema 1, 2, 3, and 4 migration matrix with deterministic pure migrations.
- IndexedDB Version 6 upgrade applying the matrix to live projects and stored recovery snapshots.
- Portable import checksum verification before migration.
- Bounded untrusted JSON parser with nesting, node, key, string, and prototype-pollution guards.
- Recovery-first PWA update prompt and automatic pre-update snapshots for active and archived projects.
- Chromium, Firefox, WebKit, and mobile-Chromium browser smoke configuration.
- Automated axe WCAG checks for the project library, workspace, and enterprise evidence view.
- Offline service-worker reload, local persistence, keyboard-navigation, export, rollback, and restore drills.
- Dependency audit, CycloneDX SBOM, build digest, provenance, and release-evidence artifact workflow.
- Sustained repeated calculation/report/migration workload test.
- Commercial building, linear road works, and interior fit-out starter templates.
- User onboarding, administrator/support operations, and formula handbook.
- Complete mapping of every identifier in `02_FUNCTIONAL_REQUIREMENTS.md` with explicit partial blockers.
- In-app release qualification evidence and downloadable local blocker report.

## Phase 10 acceptance tests

| Test ID | Requirement / Gate | Acceptance statement | Automation |
|---|---|---|---|
| P10-AT-001 | Migration matrix | Schemas 1–4 and embedded snapshot projects migrate to valid Schema 4 records deterministically. | `projectMigration.test.ts` |
| P10-AT-002 | IO-001, IO-002 | Portable imports verify the original checksum, reject unsafe JSON, and then migrate supported schemas. | `projectFile.test.ts`, `untrustedJson.test.ts` |
| P10-AT-003 | Security | Prototype-pollution keys, excessive depth, malformed structure, and oversized files are rejected before authoritative writes. | `untrustedJson.test.ts`, project-file tests |
| P10-AT-004 | Recovery | Export, mutation, snapshot rollback, deletion, import restore, and pre-import recovery preserve authoritative project data. | `releaseRecovery.test.ts` |
| P10-AT-005 | Performance | Repeated schedule, cost, risk, report, serialization, and migration work remains deterministic inside the soak budget. | `releaseSoak.test.ts` |
| P10-AT-006 | SET-003 | Core library, workspace, and enterprise workflows receive cross-browser automated WCAG checks and keyboard smoke coverage. | `tests/e2e/release-smoke.spec.ts` |
| P10-AT-007 | Compatibility | Chromium, Firefox, WebKit, and mobile-Chromium execute the release smoke workflow. | `playwright.config.ts`, release workflow |
| P10-AT-008 | Offline update | A pending service-worker update creates recovery snapshots before activation; the installed shell reloads offline in Chromium. | `pwaUpdate.ts`, browser smoke |
| P10-AT-009 | Provenance | CI generates an npm audit record, CycloneDX SBOM, build digest, provenance, and release-evidence package. | `release-qualification.yml`, `generate-release-evidence.mjs` |
| P10-AT-010 | Requirement coverage | Every functional requirement ID is mapped exactly once and every partial capability includes a concrete blocker reason. | `requirementCoverage.test.ts` |
| P10-AT-011 | Templates | Three offline templates create valid, calculable project records. | `projectTemplates.test.ts` |
| P10-AT-012 | Qualification | A release is qualified only when all mandatory gates pass and no unresolved critical/high finding exists. | `releaseQualification.test.ts` |

## Prior phase acceptance anchors

| Phase | Representative tests |
|---|---|
| Phase 1 | `P1-AT-001`, `P1-AT-006` — lifecycle, transaction, portable-file and recovery foundations |
| Phase 2 | `P2-AT-001`, `P2-AT-006` — calendars, WBS, activities, and CSV atomicity |
| Phase 3 | `P3-AT-001`, `P3-AT-008` — CPM logic and 10,000-activity performance guard |
| Phase 4 | `P4-AT-001`, `P4-AT-008` — professional Gantt/network/report structures and print foundation |
| Phase 5 | `P5-AT-001`, `P5-AT-008` — immutable baselines and progress updates |
| Phase 6 | `P6-AT-001`, `P6-AT-006` — BOQ reconciliation and safe export |
| Phase 7 | `P7-AT-001`, `P7-AT-008` — phasing, EVM, and cash flow |
| Phase 8 | `P8-AT-001`, `P8-AT-008` — PERT, risk, productivity, and resources |
| Phase 9 | `P9-AT-001`, `P9-AT-008` — immutable enterprise reports, audit, diagnostics, and large-report guard |

## Release qualification status

Every functional requirement identifier is mapped. The following classes remain partial and therefore block qualified Version 1 promotion:

- complete project-creation wizard and snapshot comparison;
- WBS reorder/indent/outdent and separate immutable UUID/user activity code;
- complete activity coding, spreadsheet editing, and import mapping;
- explicit multiple-path ranking and fully time-phased cost baseline;
- configurable grid, manual network positions, and global saved search;
- BOQ alternates/provisional sums and selectable EAC alternatives;
- complete field-record metadata and selectable productivity forecasts;
- XLSX exchange and deterministic PDF pagination;
- full locale/precision/date/theme settings;
- consistent actor/device identifiers and persisted calculation-run hashes.

The complete machine-readable blocker list is maintained in `src/domain/release/requirementCoverage.ts` and appears in the Enterprise release-evidence panel.

## Current compatibility versions

- Application: `1.0.0-rc.1`
- Project schema: Version 4
- IndexedDB: Version 6
- Portable file envelope: Version 1
- CPM engine: `0.3.0-calendar-cpm`

## Known operational boundaries

- Executable rollback requires redeploying the previous approved build; project-data rollback uses automatic pre-update snapshots or `.cpmproj` exports.
- Browser automation does not replace organization-specific real-device acceptance.
- Automated axe results do not replace expert manual accessibility review.
- Financial storage uses controlled JavaScript-number rounding rather than arbitrary-precision decimals.
- Dedicated deterministic PDF rendering, XLSX, full locale/theme control, and resource leveling remain incomplete.

## Next action

Use the Phase 10 evidence package to resolve the mapped blockers incrementally. Promote to `1.0.0` only after the requirements gate passes with no partial mandatory capabilities and all technical qualification gates remain green.
