# CPM — Enterprise Construction Planning and Project Controls

CPM is an offline-first construction planning and project-controls application. It combines scheduling, quantities, estimating, progress, cost control, risk, productivity, resources, reporting, audit, and recovery in one portable local project model.

> **Current executable milestone:** Professional-workspace release candidate `1.0.0-rc.3`. The application includes the Version 1 qualification system, adaptive workbench shell, and UI modernization Phases F–H, but it is **not yet promoted to qualified `1.0.0`** because mapped mandatory functional blockers remain.

## Implemented application capabilities

### Responsive construction-control workbench

- Persistent System, Daylight, Night Shift, Blueprint, and High Contrast themes.
- Cobalt, teal, amber, and violet accents with stable semantic status colors.
- Compact, comfortable, and touch density; standard/enhanced contrast; system/full/reduced motion; and 90–125% interface scale.
- No-flash theme startup and offline device-local preference persistence.
- Compact application command header with connectivity, project context, home, and appearance controls.
- Operational project library with grid/list modes, storage health, responsive project cards, and designed rename/delete dialogs.
- Grouped Plan, Control, Review, and Project navigation with desktop sidebar, tablet selector, and mobile bottom navigation.
- Tokenized surfaces, forms, tables, Gantt, network, BOQ, EVM, risk, resource, report, and enterprise components.

### Professional activity grid and schedule workspace

- Virtualized professional activity spreadsheet with sticky select, ID, and activity columns.
- Configurable column visibility and resizable columns stored on the local device.
- Arrow, Enter, Home, and End cell navigation with focus recovery across virtualized rows.
- Multi-cell spreadsheet paste, selected-row fill-down, dirty-cell indicators, bulk edit, filtering, natural sorting, and project saved views.
- Resizable table/Gantt split workspace with table-only and Gantt-only modes.
- Resizable activity inspector with locally remembered width and visibility.
- Day, week, month, and quarter Gantt zoom, baseline/progress/float controls, critical focus, status-date jump, and full-screen mode.
- Purpose-built mobile activity list and full-screen activity editor rather than a reduced desktop grid.

### Planning and control workspaces

- Hierarchical WBS tree grid with expand/collapse, activity/duration/budget rollups, inspector editing, and non-drag move, indent, and outdent actions.
- Dedicated Calendar, WBS, Logic, Network, Dictionary, and Duration Calculator destinations.
- Integrated Control Center with status-date command area, project-control metrics, specialist module launchers, and one prioritized exception queue.
- Schedule, progress, missing-budget, risk-exposure, resource-conflict, and control-data findings link back to their source modules.
- Progress, baselines, BOQ, estimating, cost/EVM, risk, resources, productivity, and field records remain backed by the existing deterministic domain engines.

### Reports and enterprise review

- Evidence-backed executive summary with KPI definitions, status date, source, calculation method, and completeness state.
- Purposeful planned/earned/actual value chart with an accessible table alternative.
- Top management exceptions and milestone outlook with source-module navigation.
- Standardized schedule report catalog with report definitions, scope configuration, provenance, completeness, CSV export, and Print/PDF.
- Immutable Enterprise report snapshots, formula explanations, audit mapping, privacy-safe diagnostics, and redacted support bundles.
- Accessible manual-override dialog replacing the remaining browser-native Enterprise prompt workflow.

### Offline project management and templates

- Create, open, rename, duplicate, archive, trash, restore, and permanently delete projects.
- Transactional IndexedDB persistence with revisions, command journal, snapshots, and corrupt-record quarantine.
- Storage health, checksummed `.cpmproj` export, staged import, and recovery workflows.
- Commercial building, linear road works, and interior fit-out starter templates.
- Project Schema Version 4 and IndexedDB Version 6.
- Deterministic migration support for Project Schemas 1, 2, 3, and 4, including stored recovery snapshots.

### Calendars, activities, and CPM

- Multiple minute-resolution calendars with split shifts, holidays, exceptions, and timezone-stable dates.
- Tasks, milestones, summary activities, constraints, deadlines, notes, and custom fields.
- FS, SS, FF, and SF with leads/lags, forward/backward pass, float, criticality, driving logic, and health findings.
- Worker-based deterministic calculation with revision binding, cancellation, timeout, crash recovery, and stale-result rejection.

### Professional controls

- Synchronized Gantt and deterministic WBS-grouped network views with accessible alternatives.
- Immutable baselines, explicit status date, actual dates, progress methods, variance, and weekly updates.
- BOQ, resource unit rates, markups, activity allocation, estimate revisions, and safe CSV export.
- Cost loading, S-curves, EVM, contract cash flow, PERT, risk, productivity, and resource histograms.
- Configurable dashboards, immutable reports, formula explanations, audit mapping, overrides, and privacy-redacted support bundles.

### Phase 10 qualification and security

- Bounded untrusted JSON parser with nesting, node, key, string, and prototype-pollution guards.
- Original file checksum verification before migration or authoritative storage changes.
- Recovery-first PWA update flow that snapshots all active and archived projects before service-worker activation.
- Release gate engine that blocks qualification on missing evidence or unresolved critical/high findings.
- Complete requirement-ID mapping with explicit partial blockers.
- Chromium, Firefox, WebKit, and mobile-Chromium smoke configuration.
- Automated axe WCAG checks and keyboard-navigation smoke tests.
- Offline installed-shell reload and local persistence drills.
- Dependency audit, CycloneDX SBOM, build digest, provenance, and release-evidence artifacts.
- Sustained calculation, report, serialization, and migration workload guard.

## Release status

The Audit & Evidence workspace shows the release evidence contract and current blockers. A technically green workflow is not enough to qualify Version 1 when mandatory functional requirements remain partial.

UI modernization Phases F–H close the principal professional-grid, WBS interaction, integrated control-center, executive-summary, and report-catalog gaps. Remaining qualification blockers include the complete project wizard, snapshot comparison, expanded WBS coding governance, advanced import mapping, multiple path ranking, full cost baselines, deterministic PDF/XLSX generation, selectable productivity/EAC methods, complete locale controls, and stronger actor/device/calculation-run audit metadata.

## Development and qualification

Requirements: Node.js 22.12 or newer.

```bash
npm install
npm run dev
npm run test
npm run build
npm run test:e2e
npm run audit:dependencies
npm run sbom
```

`npm run check` runs unit tests and the production build. `npm run qualify` also runs the dependency audit, SBOM generation, and cross-browser Playwright suite after browser engines are installed.

The GitHub **Release Qualification** workflow produces retained audit, browser, SBOM, provenance, build-digest, and release-evidence artifacts.

## Documentation

- [Application implementation status](docs/20_IMPLEMENTATION_STATUS.md)
- [Phases 1–3 release notes](docs/21_PHASES_1_3_RELEASE_NOTES.md)
- [Phases 4–6 release notes](docs/22_PHASES_4_6_RELEASE_NOTES.md)
- [Phases 7–9 release notes](docs/23_PHASES_7_9_RELEASE_NOTES.md)
- [UI modernization Phases F–H release notes](docs/29_UI_PHASES_F_H_RELEASE_NOTES.md)
- [Version 1 user onboarding](docs/24_USER_ONBOARDING.md)
- [Administrator and support guide](docs/25_ADMINISTRATOR_AND_SUPPORT_GUIDE.md)
