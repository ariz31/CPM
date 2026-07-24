# CPM — Enterprise Construction Planning and Project Controls

CPM is an offline-first construction planning and project-controls application. It combines scheduling, quantities, estimating, progress, cost control, risk, productivity, resources, reporting, audit, and recovery in one portable local project model.

> **Current executable milestone:** Phase 10 release candidate `1.0.0-rc.1`. The application includes the Version 1 qualification system, but it is **not yet promoted to qualified `1.0.0`** because mapped mandatory functional blockers remain.

## Implemented application capabilities

### Offline project management and templates

- Create, open, rename, duplicate, archive, trash, restore, and permanently delete projects.
- Transactional IndexedDB persistence with revisions, command journal, snapshots, and corrupt-record quarantine.
- Storage health, checksummed `.cpmproj` export, staged import, and recovery workflows.
- Commercial building, linear road works, and interior fit-out starter templates.
- Project Schema Version 4 and IndexedDB Version 6.
- Deterministic migration support for Project Schemas 1, 2, 3, and 4, including stored recovery snapshots.

### Calendars, WBS, activities, and CPM

- Multiple minute-resolution calendars with split shifts, holidays, exceptions, and timezone-stable dates.
- Hierarchical WBS, tasks, milestones, summary activities, constraints, deadlines, notes, and custom fields.
- Virtualized editing grid, filtering, sorting, bulk edit, CSV preview, and undo/redo.
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

The Enterprise workspace shows the release evidence contract and current blockers. A technically green workflow is not enough to qualify Version 1 when mandatory functional requirements remain partial.

Current blockers include the complete project wizard, snapshot comparison, advanced WBS editing and coding, spreadsheet editing/import mapping, multiple path ranking, full cost baselines, configurable grids and global saved search, deterministic PDF/XLSX, selectable productivity/EAC methods, complete locale/theme settings, and stronger actor/device/calculation-run audit metadata.

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
- [Version 1 user onboarding](docs/24_USER_ONBOARDING.md)
- [Administrator and support guide](docs/25_ADMINISTRATOR_AND_SUPPORT_GUIDE.md)
- [Formula handbook](docs/26_FORMULA_HANDBOOK.md)
- [Phase 10 release-candidate notes](docs/27_PHASE_10_RELEASE_CANDIDATE.md)
- [UI/UX modernization implementation plan](docs/28_UI_UX_MODERNIZATION_PLAN.md)

The full product, calculation, architecture, security, performance, UX, reliability, data, governance, and roadmap specifications remain in `docs/01` through `docs/19`. Architecture decisions are recorded in [`adr/`](adr/).

## Explicit boundaries

- Automated axe and browser tests do not replace expert accessibility and real-device acceptance.
- Executable rollback requires redeploying the previous approved build; project-data rollback uses snapshots or exported files.
- Browser Print/PDF is not yet a dedicated deterministic PDF renderer.
- XLSX exchange, arbitrary-precision financial storage, selectable advanced productivity forecasting, Monte Carlo risk, automatic resource leveling, and full theme/locale control remain incomplete.

## License

A license has not yet been selected. Add an explicit license and contribution policy before accepting external contributions or distributing production builds.
