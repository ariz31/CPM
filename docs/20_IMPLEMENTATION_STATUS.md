# Application Implementation Status

## Current milestone

The executable offline application covers roadmap Phases 0–10 and UI modernization Phases B–H.

The current application release candidate is `1.0.0-rc.3`. It does not claim qualified Version 1 status because every functional requirement remains mapped and several mandatory non-UI capabilities are still partial. The in-app evidence panel and CI artifact disclose those blockers explicitly.

## UI modernization Phases F–H delivered

### Phase F — Activity grid and schedule workspace

- Virtualized professional activity spreadsheet with sticky select, ID, and activity columns.
- Configurable column visibility, local column widths, natural sorting, global activity search, and project saved views.
- Keyboard cell navigation using Arrow keys, Enter, Home, and End with virtualized-row focus recovery.
- Spreadsheet clipboard paste, selected-row fill-down, bulk editing, inline validation constraints, and dirty-cell indication.
- Resizable activity-grid/Gantt split workspace with table-only, Gantt-only, and full-screen Gantt modes.
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
- Compact global command header with connectivity, project context, home navigation, and appearance controls.
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
- Complete mapping of every identifier in `02_FUNCTIONAL_REQUIREMENTS.md` with explicit partial blockers.

## Acceptance tests

| Test ID | Requirement / Gate | Acceptance statement | Automation |
|---|---|---|---|
| UIF-AT-001 | Activity grid | Column normalization, search/sort, spreadsheet paste, and fill-down are deterministic. | `activityWorkspace.test.ts` |
| UIF-AT-002 | Schedule workspace | Grid/Gantt modes, column manager, saved views, keyboard navigation, and compact activity editing are browser-qualified. | `tests/e2e/release-smoke.spec.ts` |
| UIG-AT-001 | WBS | Hierarchical rollups, sibling movement, indent/outdent, and sort normalization preserve scope data. | `wbsTree.test.ts` |
| UIG-AT-002 | Control center | Schedule, progress, cost, risk, resource, and completeness findings remain linked to specialist modules. | `executiveSummary.test.ts`, browser smoke |
| UIH-AT-001 | Executive review | KPI definitions, status, completeness, exceptions, milestone outlook, and control curves derive from authoritative domain results. | `executiveSummary.test.ts` |
| UIH-AT-002 | Reports | Report catalog, provenance, accessible preview, export actions, and Enterprise evidence surfaces pass WCAG browser checks. | `tests/e2e/release-smoke.spec.ts` |
| P10-AT-001 | Migration matrix | Schemas 1–4 and embedded snapshot projects migrate to valid Schema 4 records deterministically. | `projectMigration.test.ts` |
| P10-AT-002 | IO-001, IO-002 | Portable imports verify the original checksum, reject unsafe JSON, and then migrate supported schemas. | `projectFile.test.ts`, `untrustedJson.test.ts` |
| P10-AT-003 | Security | Prototype-pollution keys, excessive depth, malformed structure, and oversized files are rejected before authoritative writes. | `untrustedJson.test.ts`, project-file tests |
| P10-AT-004 | Recovery | Export, mutation, snapshot rollback, deletion, import restore, and pre-import recovery preserve authoritative project data. | `releaseRecovery.test.ts` |
| P10-AT-005 | Performance | Repeated schedule, cost, risk, report, serialization, and migration work remains deterministic inside the soak budget. | `releaseSoak.test.ts` |
| P10-AT-006 | SET-003 | Core library and professional workspaces receive cross-browser automated WCAG checks and keyboard smoke coverage. | `tests/e2e/release-smoke.spec.ts` |
| P10-AT-007 | Compatibility | Chromium, Firefox, WebKit, and mobile-Chromium execute the release smoke workflow. | `playwright.config.ts`, release workflow |
