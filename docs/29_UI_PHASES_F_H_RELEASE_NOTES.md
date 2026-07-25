# UI Modernization Phases F–H Release Notes

## Release

- Application: `1.0.0-rc.3`
- Project Schema: Version 4
- IndexedDB: Version 6
- Portable Envelope: Version 1
- CPM engine: `0.3.0-calendar-cpm`
- Project-file compatibility: unchanged
- New runtime dependencies: none

## Phase F — Activity grid and schedule workspace

The primary schedule workspace is now a professional activity spreadsheet synchronized with the Gantt and activity inspector.

Delivered:

- Virtualized activity rows with sticky select, ID, and activity columns.
- Column visibility management and locally persisted column widths.
- Arrow, Enter, Home, and End keyboard navigation with focus recovery across virtualized rows.
- Spreadsheet paste across editable cells.
- Fill-down from the first selected activity to the remaining selected activities.
- Dirty-cell indicators and existing validation through authoritative project commands.
- Natural sorting, broad activity search, and project saved views.
- Resizable activity-table/Gantt split and resizable activity inspector.
- Table-only, Gantt-only, split, and full-screen Gantt modes.
- Day, week, month, and quarter zoom.
- Baseline, progress, float, critical-focus, and status-date controls.
- Compact activity cards and a full-screen mobile editor.

## Phase G — Planning and control modules

Planning and control modules now use clearer information hierarchy and shared exception-driven workflows.

Delivered:

- Dedicated WBS workspace separated from Calendars.
- Expandable hierarchical WBS tree grid.
- WBS activity, duration, and budget rollups.
- Inspector editing and explicit parent selection.
- Move up, move down, indent, and outdent actions that do not require dragging.
- Integrated Control Center with status-date control and management metrics.
- Direct launch points for Progress/Baselines, BOQ/Estimate, Cost/EVM, and Risk/Resources.
- One prioritized queue combining schedule warnings, out-of-sequence progress, missing budgets, risk exposure, resource over-allocation, and data completeness.
- Existing domain engines and persistence behavior retained without a schema migration.

## Phase H — Reports and enterprise

Review and reporting now expose decision context rather than presenting unexplained values.

Delivered:

- Executive summary with completion, forecast, CPI, SPI, risk exposure, and data completeness.
- Definition, source, calculation method, status date, and completeness disclosure for every executive metric.
- Planned, earned, and actual value chart with an accessible data table.
- Top exception review linked to source modules.
- Milestone outlook with forecast state and active-baseline variance.
- Standardized report catalog for Critical Path, Float, Logic, Milestones, and Look-ahead.
- Report definitions, configurable look-ahead scope, provenance, completeness, CSV, and Print/PDF.
- Accessible Enterprise manual-override dialog replacing browser-native prompts.
- Immutable report snapshots, formula inspection, audit mapping, diagnostics, support bundle, and release evidence retained.

## Qualification contract

The release candidate must pass:

- Full Vitest suite, including new activity-workspace, WBS-tree, and executive-summary tests.
- Strict TypeScript production PWA build.
- Dependency audit with zero high or critical findings.
- CycloneDX SBOM generation.
- Chromium, Firefox, WebKit, and mobile Chromium.
- Automated axe WCAG 2.0, 2.1, and 2.2 A/AA checks.
- Professional activity workspace, WBS, Control Center, Executive Summary, Report Catalog, and Audit/Evidence navigation.
- Compact-screen page-overflow checks for every workspace destination.
- Theme persistence, keyboard navigation, project persistence, and Chromium offline-shell reload.
- Release evidence, provenance, and Vercel preview build.

## Remaining modernization phases

The next roadmap phases are:

- Phase I — mobile workflow specialization and task-by-task field validation.
- Phase J — visual regression, screen-reader, 200% zoom, reflow, touch-target, forced-color, theme screenshot, and 10,000-activity UI qualification.

Functional Version 1 promotion remains governed by the complete requirement map, not by UI completion alone.
