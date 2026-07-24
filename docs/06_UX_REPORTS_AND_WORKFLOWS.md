# User Experience, Workflows, and Reports

## 1. UX objective

The application must make advanced project-control methods understandable without reducing them to opaque automation. The primary workspace should behave like a professional editable table connected to synchronized visual views. Users should always know:

- which project and baseline are active;
- the current status date;
- whether calculations are current;
- whether data is saved locally or exported to a file;
- what warnings require attention;
- which values are input, calculated, actual, baseline, or forecast.

## 2. Information architecture

Recommended main navigation:

1. **Projects** — local project library, templates, imports, backups
2. **Overview** — project summary, health, milestones, trends
3. **WBS & Activities** — scope hierarchy and activity table
4. **Schedule** — Gantt, network, calendars, paths, baselines
5. **BOQ & Cost** — quantities, rates, allocations, cost accounts
6. **Progress** — data date, actuals, quantities, field updates
7. **S-Curves & EVM** — curves, performance indices, forecasts
8. **Productivity** — daily records, crews, rates, trends
9. **Resources** — assignments, histograms, availability
10. **Risk & PERT** — uncertainty, target probability, risk register
11. **Reports** — report builder, saved report definitions, exports
12. **Project Settings** — calendars, units, currency, codes, file options

Simple projects may hide modules not yet enabled.

## 3. Global application shell

The top bar should include:

- Project name and project switcher
- Offline/online indicator without implying online is required
- Local save state
- Linked-file state if applicable
- Undo and redo
- Global search or command palette
- Calculation state and Recalculate action
- Status-date selector
- Active baseline selector
- Project health indicator
- Export/share menu

A side navigation should collapse for smaller screens. On mobile/tablet, the app should prioritize review and field entry; complex network editing may use a dedicated landscape workspace.

## 4. Visual language

### Field states

| State | Required visual treatment |
|---|---|
| User input | Standard editable field |
| Calculated | Read-only with formula/detail affordance |
| Baseline | Distinct pattern or label, not color alone |
| Actual | Clear actual marker and date/status context |
| Forecast | Labeled forecast styling |
| Manual override | Override badge and reason |
| Invalid | Inline message and error icon |
| Warning | Non-blocking warning with remediation |
| Stale result | Calculation-outdated indicator |

Critical paths should be prominent, but negative float, near-critical, completed, and delayed states need distinct labels and patterns.

## 5. Project creation workflow

### Step 1 — Start method

- Blank project
- Construction template
- Import activity/BOQ spreadsheet
- Open `.cpmproj`
- Duplicate existing project

### Step 2 — Project basics

Title, code, organization, location, contract number, timezone, currency, start date, required finish, and work hours.

### Step 3 — Calendar

Select or create default calendar; review weekdays, shifts, holidays, and hours per day.

### Step 4 — Modules

Choose simple schedule, schedule + cost, full project controls, or custom modules. This controls visible navigation, not the underlying file compatibility.

### Step 5 — Validation and create

Show a concise summary. The new project opens with a checklist: create WBS, add activities, define logic, calculate, review health, save baseline.

## 6. Activity planning workflow

### 6.1 Activity grid

Default columns:

- Activity ID
- Activity name
- WBS
- Original duration
- Remaining duration
- Predecessors
- Calendar
- Early start
- Early finish
- Total float
- Progress
- Responsible party
- Warning indicator

Optional column groups include constraints, actuals, baseline, PERT, cost, quantities, resources, codes, and audit fields.

Required grid behavior:

- Spreadsheet-like keyboard editing
- Paste multiple rows and columns
- Formula-free validation, not arbitrary spreadsheet formulas
- Column chooser and saved layouts
- Filter chips and grouping
- Row virtualization
- Indent/outdent WBS actions
- Context menu and command palette
- Undo/redo across bulk actions
- Side panel for details without leaving the table

### 6.2 Relationship editor

Users can type predecessor expressions such as `A120FS+2d`, use a structured dialog, or draw a link in the network/Gantt view. The application must parse, preview, and validate before saving.

A logic panel should list predecessors and successors with relationship type, lag, driving state, float/slack, and warnings.

### 6.3 Schedule health review

Before baseline creation, guide the user through:

- loops;
- missing predecessors/successors;
- high lag and negative lag;
- constraints;
- long durations;
- invalid calendars;
- duplicate IDs;
- activities outside the main project path;
- unrealistic float or negative float.

Warnings can be acknowledged with a reason but should remain reportable.

## 7. Gantt workflow

The Gantt is synchronized with the activity grid.

Required interactions:

- Zoom and fit project/selection
- Drag bar only when edit mode is enabled
- Create links by handles
- Show baseline, current, actual, progress, and float layers
- Collapse by WBS
- Filter to critical path, milestones, look-ahead, responsibility, or location
- Select a bar to open details
- Display status-date line and non-working periods
- Export current view with legend and report metadata

Dragging a bar must update an explicit input such as duration, relationship, or constraint; it must never directly overwrite calculated dates without explanation.

## 8. Network workflow

The network view should support:

- Activity-on-node cards with configurable fields
- Automatic left-to-right or top-to-bottom layout
- Critical and driving relationship highlighting
- Relationship type and lag labels
- WBS swimlanes or containers
- Focus on selected activity, predecessors, successors, or full path
- Trace longest path and near-critical paths
- Detect isolated sub-networks
- Save manual node positions separately from schedule logic
- Export SVG/PNG/PDF

For large networks, use level-of-detail rendering while keeping selected nodes, annotations, and the focused path visible.

## 9. Baseline and update workflow

### 9.1 Create baseline

1. Run schedule and project health checks.
2. Show unresolved warnings and cost/quantity reconciliation.
3. Enter baseline name, approval reference, approver, and date.
4. Preview schedule finish, BAC, key milestones, and curve totals.
5. Freeze an immutable baseline.

### 9.2 Update progress

1. Set the new status date.
2. Review activities expected to start, finish, or progress since the previous date.
3. Enter actual dates, remaining duration, physical progress, installed quantities, actual cost, and comments.
4. Review out-of-sequence and invalid actual warnings.
5. Recalculate.
6. Compare current forecast with baseline.
7. Save an update snapshot and generate the update report.

A guided weekly-update mode should reduce the grid to only relevant activities and data fields.

## 10. BOQ and estimating workflow

### BOQ workspace tabs

- BOQ hierarchy
- Unit-price analysis
- Resource price library
- Markups and summary
- Activity allocations
- Revision comparison

The BOQ grid should permit import, bulk rate updates, unit validation, and subtotal rows. Users should be able to inspect how an amount was derived from quantity, waste, resource coefficients, resource rates, and markup layers.

Allocation view should show BOQ items on one side and activities/time phases on the other, with unallocated and over-allocated totals always visible.

## 11. S-curve and EVM workflow

### Curve setup

Users select:

- Baseline/current forecast
- Value basis: cost, quantity, physical weight, labor-hours, equipment-hours
- Curve series: planned, late planned, earned, actual, forecast
- Aggregation period
- Distribution assumptions
- Filters by WBS, cost code, location, resource, or responsible party

### Curve view

Display cumulative and incremental charts, period table, status-date line, key totals, and data-quality warnings. Hover details should include period, incremental value, cumulative value, and percentage.

### EVM summary

Show PV, EV, AC, BAC, SV, CV, SPI, CPI, EAC alternatives, ETC, VAC, and TCPI. Each metric must have a formula detail and plain-language interpretation.

Do not label a project “ahead” solely because SPI > 1 when the schedule has negative float or a delayed critical milestone. The dashboard should present both time-network and EVM evidence.

## 12. Productivity workflow

### Daily/shift entry

A field-friendly form should support:

- Date and shift
- Activity and location
- Installed quantity and unit
- Crew members or total labor hours
- Equipment and hours
- Productive and delay time
- Delay reason
- Weather
- Remarks and attachments

Recent values and templates may be reused, but every submission must remain reviewable.

### Analysis

- Planned vs actual production rate
- Labor-hours per unit
- Equipment output and utilization
- Cost per unit
- Rolling averages and trend
- Delay Pareto
- Forecast remaining duration
- Comparison by crew, location, work type, or period

Accepted quantity should optionally post to activity progress to avoid duplicate entry.

## 13. Risk and PERT workflow

Users can enter three-point durations directly in the activity grid or risk panel. The application should show expected duration, standard deviation, and difference from deterministic duration.

The target-date analysis must state:

- selected path or project model;
- mean and standard deviation;
- target duration/date;
- Z-score and approximate probability;
- assumptions and limitations.

Risk register views should support matrix, table, linked schedule items, due responses, and residual risk.

## 14. Reports catalog

### Executive and control reports

- Executive project summary
- Project dashboard
- Baseline approval summary
- Periodic schedule update
- Exceptions and action report
- Change summary

### Schedule reports

- Full activity schedule
- Critical and near-critical paths
- Total and free float
- Milestones
- Logic and open ends
- Constraints and deadlines
- Baseline variance
- Delayed and overdue activities
- Two-week, three-week, four-week, and custom look-ahead
- Completed during period
- Activities by responsible party/location

### Cost and BOQ reports

- Detailed BOQ
- Abstract of cost
- Unit-price analysis
- Resource price list
- Markup summary
- Cost by WBS/cost code/location
- Activity cost loading
- Unallocated cost
- BOQ revision comparison

### Progress and performance reports

- Physical progress
- Planned versus actual S-curve
- Cash flow
- EVM performance
- Cost forecast
- Quantity progress
- Productivity summary
- Daily productivity records
- Resource histogram and over-allocation

### Risk reports

- PERT target-date analysis
- Risk register
- High-exposure risks
- Activities with greatest uncertainty
- Future Monte Carlo percentile summary

### Data-quality reports

- Project health
- Import validation
- Missing data
- Inconsistent actuals
- Baseline reconciliation
- File integrity and migration report

## 15. Report builder

Users should be able to configure:

- Title, logo, project metadata, and confidentiality footer
- Data date and baseline
- Filters and grouping
- Columns and sorting
- Page size/orientation/margins
- Chart/table inclusion
- Number, date, currency, and duration formats
- Sign-off fields
- Saved report template name

Saved report definitions belong to the project or global template library. Reports must be reproducible against a named snapshot when audit consistency is required.

## 16. Export behavior

### PDF/print

- Repeat table headings on each page
- Prevent clipped columns and bars
- Support landscape and large page sizes
- Include legends and calculation metadata
- Use vector charts where practical

### CSV/XLSX

- Export raw authoritative fields separately from formatted display values
- Include stable IDs and user-facing codes
- State timezone, units, and decimal conventions
- Use one sheet/table per entity type for complete exchange
- Warn that formulas in spreadsheets are informational, not authoritative on re-import unless explicitly mapped

### Images

Gantt, network, and chart exports need title, date, legend, scale, and high-resolution/vector options.

## 17. Empty, loading, error, and offline states

Every module must define:

- First-use empty state with the next useful action
- Loading/progress state for large calculations/imports
- Cancel behavior
- Recoverable validation state
- Fatal local database or file error state
- Offline state without degraded language for core features
- Stale-result state
- No-results filter state with reset action

## 18. Accessibility

- All editable grids need keyboard navigation and announced cell context.
- Relationship and Gantt operations need non-pointer alternatives.
- Network diagrams need a tabular dependency representation.
- Charts need data tables and summaries.
- Focus must remain predictable after recalculation, dialogs, and bulk edits.
- Criticality, warning, actual, and baseline states must use labels/icons/patterns in addition to color.
- Touch targets should be at least platform-recommended size.

## 19. User assistance

The application should provide:

- Contextual formula explanations
- Definitions for scheduling terms
- Inline validation examples
- Sample projects from simple to advanced
- Guided first project
- Keyboard shortcut reference
- Report interpretation notes
- Release-specific migration notes

Educational mode may show step-by-step forward/backward-pass calculations without changing the authoritative engine.
