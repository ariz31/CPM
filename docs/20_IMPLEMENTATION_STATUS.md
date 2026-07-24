# Application Implementation Status

## Current milestone

The executable offline application covers roadmap Phases 0–10 and UI modernization Phases B–H.

The current application release candidate is `1.0.0-rc.3`. It does not claim qualified Version 1 status because every functional requirement remains mapped and several mandatory capabilities are still partial. The in-app evidence panel and CI artifact disclose those blockers explicitly.

## UI modernization Phases F–H delivered

### Phase F — Activity grid and schedule workspace

- Virtualized professional activity spreadsheet with sticky select, ID, and activity columns.
- Configurable column visibility, local column widths, natural sorting, global activity search, and project saved views.
- Keyboard cell navigation using Arrow keys, Enter, Home, and End with virtualized-row focus recovery.
- Spreadsheet clipboard paste, selected-row fill-down, bulk editing, validation through authoritative commands, and dirty-cell indication.
- Resizable activity-grid/Gantt split workspace with split, table-only, Gantt-only, and full-screen modes.
- Resizable locally remembered activity inspector.
- Day, week, month, and quarter Gantt zoom, baseline/progress/float controls, critical focus, and status-date navigation.
- Purpose-built compact activity cards and full-screen mobile activity editing.

### Phase G — Planning and control modules

- Dedicated hierarchical WBS tree grid with expand/collapse, activity/duration/budget rollups, and inspector editing.
- Non-drag WBS move, indent, and outdent alternatives.
- Dedicated WBS and Calendar destinations instead of one combined dense workspace.
- Integrated Control Center with status-date command area, project-control metrics, and specialist-module launchers.
- Prioritized schedule, progress, cost, risk, resource, and data-quality exception queue.
- Existing Progress, Baseline, BOQ, Cost/EVM, Risk, Resource, Productivity, Logic, Network, Calendar, Dictionary, and Duration Calculator engines preserved and linked through the shared shell.

### Phase H — Reports and enterprise

- Evidence-backed executive summary with metric definition, source, calculation method, status date, and completeness state.
- Planned, earned, and actual value chart with accessible tabular alternative.
- Management exception review and milestone outlook linked to source modules.
- Standardized report catalog with report definitions, configurable scope, provenance, completeness, CSV, and Print/PDF actions.
- Accessible manual-override dialog replacing the remaining Enterprise browser prompt.
- Existing immutable snapshots, audit mapping, formula inspection, diagnostics, support bundle, qualification evidence, and recovery views retained.

## Responsive UI modernization foundation

- Persistent device-local appearance preferences with no-flash startup initialization.
- System, Daylight, Night Shift, Blueprint, and High Contrast themes.
- Cobalt, teal, amber, and violet accent choices without changing semantic status colors.
- Compact, comfortable, and touch density modes.
- Standard/enhanced contrast, system/full/reduced motion, and 90–125% interface scale controls.
- Compact global command header with connectivity, project context, home navigation, appearance controls, and project-level full screen.
- Redesigned operational project library with compact creation controls, grid/list modes, storage health, deliberate project cards, and accessible rename/delete dialogs.
- Grouped Plan, Control, Review, and Project workbench navigation with desktop sidebar, tablet section selection, and mobile bottom navigation.
- Semantic token aliases across scheduling, BOQ, EVM, risk, resource, report, and enterprise components.

## Phase 10 delivered

- Project Schema 1, 2, 3, and 4 migration matrix with deterministic pure migrations.
- IndexedDB Version 6 upgrade applying the matrix to live projects and stored recovery snapshots.
- Portable import checksum verification before migration.
- Bounded untrusted JSON parser with nesting, node, key, string, and prototype-pollution guards.
- Recovery-first PWA update prompt and automatic pre-update snapshots for active and archived projects.
- Chromium, Firefox, WebKit, and mobile-Chromium browser smoke configuration.
- Automated axe WCAG checks for the project library and professional workspaces.
- Offline service-worker reload, local persistence, keyboard-navigation, export, rollback, and restore drills.
- Dependency audit, CycloneDX SBOM, build digest, provenance, and release-evidence artifact workflow.
- Sustained repeated calculation/report/migration workload test.
- Commercial building, linear road works, and interior fit-out starter templates.
- User onboarding, administrator/support operations, and formula handbook.
- Complete mapping of every identifier in `02_FUNCTIONAL_REQUIREMENTS.md` with explicit partial blockers.
- In-app release qualification evidence and downloadable local blocker report.

## Acceptance tests

| Test ID | Requirement / Gate | Acceptance statement | Automation |
|---|---|---|---|
| P10-AT-001 | Migration matrix | Schemas 1–4 and embedded snapshot projects migrate to valid Schema 4 records deterministically. | `projectMigration.test.ts` |
| P10-AT-002 | IO-001, IO-002 | Portable imports verify the original checksum, reject unsafe JSON, and then migrate supported schemas. | `projectFile.test.ts`, `untrustedJson.test.ts` |
| P10-AT-003 | Security | Prototype-pollution keys, excessive depth, malformed structure, and oversized files are rejected before authoritative writes. | `untrustedJson.test.ts`, project-file tests |
| P10-AT-004 | Recovery | Export, mutation, snapshot rollback, deletion, import restore, and pre-import recovery preserve authoritative project data. | `releaseRecovery.test.ts` |
| P10-AT-005 | Performance | Repeated schedule, cost, risk, report, serialization, and migration work remains deterministic inside the soak budget. | `releaseSoak.test.ts` |
| P10-AT-006 | SET-003 | Core library and professional workspaces receive cross-browser automated WCAG checks and keyboard smoke coverage. | `tests/e2e/release-smoke.spec.ts` |
| P10-AT-007 | Compatibility | Chromium, Firefox, WebKit, and mobile-Chromium execute the release smoke workflow. | `playwright.config.ts`, release workflow |
| P10-AT-008 | Offline update | A pending service-worker update creates recovery snapshots before activation; the installed shell reloads offline in Chromium. | `pwaUpdate.ts`, browser smoke |
| P10-AT-009 | Provenance | CI generates an npm audit record, CycloneDX SBOM, build digest, provenance, and release-evidence package. | `release-qualification.yml`, `generate-release-evidence.mjs` |
| P10-AT-010 | Requirement coverage | Every functional requirement ID is mapped exactly once and every partial capability includes a concrete blocker reason. | `requirementCoverage.test.ts` |
| P10-AT-011 | Templates | Three offline templates create valid, calculable project records. | `projectTemplates.test.ts` |
| P10-AT-012 | Qualification | A release is qualified only when all mandatory gates pass and no unresolved critical/high finding exists. | `releaseQualification.test.ts` |
| UIX-AT-001 | SET-002 | Theme selection persists locally and applies before React startup without a flash. | `tests/e2e/release-smoke.spec.ts` |
| UIX-AT-002 | UI-002, SET-003 | Project library and grouped workbench remain axe-clean across desktop and mobile browser projects. | `tests/e2e/release-smoke.spec.ts` |
| UIX-AT-003 | Responsive shell | Desktop sidebar, tablet selector, mobile bottom navigation, and project full screen expose the workbench consistently. | `WorkspaceNavigation.tsx`, `WorkspaceFullscreenToggle.tsx`, Playwright matrix |
| UIF-AT-001 | Activity grid | Column normalization, search/sort, spreadsheet paste, and fill-down are deterministic. | `activityWorkspace.test.ts` |
| UIF-AT-002 | Schedule workspace | Grid/Gantt modes, column manager, saved views, keyboard navigation, and compact activity editing are browser-qualified. | `tests/e2e/release-smoke.spec.ts` |
| UIG-AT-001 | WBS | Hierarchical rollups, sibling movement, indent/outdent, and sort normalization preserve scope data. | `wbsTree.test.ts` |
| UIG-AT-002 | Control center | Schedule, progress, cost, risk, resource, and completeness findings remain linked to specialist modules. | `executiveSummary.test.ts`, browser smoke |
| UIH-AT-001 | Executive review | KPI definitions, status, completeness, exceptions, milestone outlook, and control curves derive from authoritative domain results. | `executiveSummary.test.ts` |
| UIH-AT-002 | Reports | Report catalog, provenance, accessible preview, export actions, and Enterprise evidence surfaces pass WCAG browser checks. | `tests/e2e/release-smoke.spec.ts` |

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
- expanded WBS coding governance and separate immutable UUID/user activity code;
- advanced import mapping and additional spreadsheet transformation workflows;
- explicit multiple-path ranking and fully time-phased cost baseline;
- manual network positions and global cross-project search;
- BOQ alternates/provisional sums and selectable EAC alternatives;
- complete field-record metadata and selectable productivity forecasts;
- XLSX exchange and deterministic PDF pagination;
- full locale, separator, precision, date, and duration-unit settings;
- consistent actor/device identifiers and persisted calculation-run hashes.

Theme selection, configurable activity columns, spreadsheet paste/fill-down, saved activity views, WBS move/indent/outdent, and executive/report workspaces are no longer modernization blockers. The complete machine-readable blocker list remains in `src/domain/release/requirementCoverage.ts` and appears in the Enterprise release-evidence panel.

## Current compatibility versions

- Application: `1.0.0-rc.3`
- Project schema: Version 4
- IndexedDB: Version 6
- Portable file envelope: Version 1
- CPM engine: `0.3.0-calendar-cpm`

## Known operational boundaries

- Executable rollback requires redeploying the previous approved build; project-data rollback uses automatic pre-update snapshots or `.cpmproj` exports.
- Browser automation does not replace organization-specific real-device acceptance.
- Automated axe results do not replace expert manual accessibility review.
- Financial storage uses controlled JavaScript-number rounding rather than arbitrary-precision decimals.
- Dedicated deterministic PDF rendering, XLSX, full locale control, and resource leveling remain incomplete.

## Next action

Continue with modernization Phase I mobile workflow specialization and Phase J qualification depth. Promote to `1.0.0` only after the requirements gate passes with no partial mandatory capabilities and all technical qualification gates remain green.
