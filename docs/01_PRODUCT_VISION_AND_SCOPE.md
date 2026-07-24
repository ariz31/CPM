# Product Vision and Scope

## 1. Purpose

CPM is an offline construction planning and project-controls application designed to connect schedule logic, quantities, cost, progress, productivity, and risk in one project model. The product should be useful to students, planners, estimators, site engineers, contractors, consultants, and owners without requiring enterprise scheduling software or continuous internet access.

The application must answer five practical questions:

1. What work must be performed, in what sequence, and by when?
2. Which activities control the completion date and how much float exists?
3. How much work and cost should have been completed by a given date?
4. What has actually been completed, spent, and produced?
5. What is the most credible forecast for time and cost at completion?

## 2. Target users

### Primary users

- Construction project schedulers and project-control engineers
- Site and project engineers responsible for weekly progress updates
- Quantity surveyors and estimators
- Small and medium contractors without enterprise planning systems
- Civil engineering instructors and students learning CPM, PERT, BOQ, S-curves, and EVM

### Secondary users

- Owners and consultants reviewing contractor submissions
- Supervisors recording field productivity
- Project managers requiring concise dashboards and look-ahead reports
- Researchers who need reproducible schedule and productivity datasets

## 3. Product positioning

CPM should sit between spreadsheet-only workflows and complex enterprise platforms. It should preserve the transparency and portability of spreadsheets while adding validated logic, reusable data, automated calculations, visualizations, and controlled project files.

It is not initially intended to replace every function of Primavera P6, Microsoft Project, enterprise ERP systems, or full BIM 4D/5D platforms. Instead, it should provide a trustworthy offline core that can later exchange data with those systems.

## 4. Guiding principles

### 4.1 Offline-first

- Core functions must work with airplane mode enabled.
- The application must install as a PWA and reopen previously used projects without contacting a server.
- Network access must never be required for schedule recalculation, reports, import, export, backup, or restore.
- Future synchronization must be optional and must not change local ownership of data.

### 4.2 Integrated data

Activities, BOQ items, resources, productivity records, progress entries, costs, risks, and reports must reference shared identifiers. Users should not repeatedly encode the same scope in disconnected worksheets.

### 4.3 Transparent calculations

Every calculated field must expose its basis: input values, calendar, status date, baseline, formula, precision, and warnings. Manual overrides must be visibly marked and auditable.

### 4.4 Safe editing

Autosave, undo/redo, named snapshots, baselines, project duplication, and recovery should make destructive mistakes difficult. Imported files must be validated before replacing any active project.

### 4.5 Progressive complexity

A new user should be able to build a basic network with activity ID, description, duration, and predecessor. Advanced fields should appear as optional columns or modules rather than blocking simple use.

### 4.6 Deterministic engine

The same project data and engine version must produce the same outputs across devices. Calculations should not depend on viewport state, locale formatting, or UI timing.

## 5. Scope by capability

### 5.1 Project administration

- Create, open, duplicate, rename, archive, and delete local projects
- Project metadata: title, owner, contractor, consultant, location, contract number, description, planned dates, currency, unit system, and timezone
- Multiple work calendars, holidays, exceptions, shifts, and hours per day
- WBS, activity codes, cost codes, locations, responsibility assignments, custom fields, and tags
- Templates for project calendars, WBS structures, activity libraries, BOQ assemblies, and reports
- Project health checks for missing logic, invalid dates, duplicate IDs, negative quantities, and inconsistent progress

### 5.2 Schedule planning and control

- Activity-on-node schedule model
- Activity, milestone, summary, level-of-effort, and hammock-like derived items where supported
- FS, SS, FF, and SF logic with positive or negative lag
- Multiple predecessors and successors
- Calendar-aware forward and backward passes
- Total float, free float, interfering float, driving relationships, and critical-path tracing
- Constraints and deadlines with warnings when they distort natural logic
- Baselines, status dates, actual dates, remaining duration, percent complete, and forecast dates
- Multiple schedule views: table, Gantt, network, calendar, milestone, critical path, and look-ahead
- Schedule comparison and variance reporting

### 5.3 PERT and schedule risk

- Optimistic, most likely, and pessimistic durations
- Expected duration and variance
- Probability of completing a path or project by a target date using normal approximation
- Activity uncertainty ranking and sensitivity
- Risk register links to activities and cost items
- Future Monte Carlo simulation with configurable distributions and correlations

### 5.4 BOQ and estimating

- Hierarchical bill of quantities
- Quantity, unit, unit rate, amount, waste, productivity basis, and remarks
- Material, labor, equipment, subcontract, and other cost components
- Resource price library and assemblies
- Direct, indirect, overhead, profit, contingency, tax, and escalation calculations
- Cost-code and WBS mapping
- Bid summary, abstract of cost, detailed unit-price analysis, and quantity takeoff imports
- Revision comparison and change-event tracking

### 5.5 Cost loading, cash flow, and S-curves

- Assign BOQ or cost accounts to activities
- Time-phase planned quantities and costs using selectable distribution curves
- Planned early and late curves
- Actual cost and earned progress curves
- Daily, weekly, monthly, or custom-period aggregation
- Physical, financial, labor-hour, equipment-hour, and quantity S-curves
- Cash-in and cash-out forecasting, retention, advances, and payment lag assumptions

### 5.6 Earned value management

- Planned Value, Earned Value, and Actual Cost
- Schedule and cost variances
- SPI, CPI, combined indices, percent complete, and percent spent
- Budget at Completion and multiple Estimate at Completion methods
- Estimate to Complete, Variance at Completion, and To-Complete Performance Index
- Baseline and data-date consistency checks
- Narrative interpretation and threshold-based alerts

### 5.7 Productivity and field data

- Planned crew composition and output rates
- Daily or shift-level production records
- Quantity installed, work hours, equipment hours, delay hours, weather, location, and notes
- Actual unit productivity and unit cost
- Planned-versus-actual productivity variance
- Crew and equipment utilization
- Forecast remaining duration from current production rate
- Learning-curve and moving-average views
- Import from standard field-log templates

### 5.8 Resource planning

- Labor, equipment, material, and cost resources
- Resource assignment to activities and BOQ components
- Histograms and time-phased demand
- Over-allocation detection
- Manual smoothing in early releases
- Future resource leveling with configurable priorities and float consumption rules

### 5.9 Reporting and communication

- Configurable dashboards and report templates
- PDF, print, CSV, XLSX, PNG/SVG chart export, and portable project bundle
- Executive summary, baseline report, update report, critical path, float, logic, milestone, two-week and four-week look-ahead, BOQ, cost, EVM, productivity, and risk reports
- Each report must show the project, data date, baseline, currency, units, calendar assumptions, and engine version

## 6. Explicit non-goals for the first release

- Mandatory user accounts or cloud storage
- Real-time multi-user editing
- Payroll, procurement payment processing, or full accounting ledgers
- Automated BIM quantity extraction
- Native DWG authoring
- Black-box artificial intelligence that changes schedule or cost data without review
- Enterprise portfolio management across hundreds of simultaneous users

These may be addressed through later modules or integrations, but must not complicate the initial offline core.

## 7. Release boundaries

### Minimum viable product

Project library, WBS, activities, calendars, CPM engine, relationship editor, Gantt, network view, baseline, progress updating, basic BOQ, cost loading, basic S-curves, CSV exchange, `.cpmproj` import/export, autosave, and reference reports.

### Version 1 complete product

Adds PERT, EVM forecasting, detailed BOQ analysis, productivity logs, resource histograms, change control, advanced reports, robust migrations, sample templates, and complete validation coverage.

### Later extensions

Monte Carlo risk, resource leveling, multi-project views, optional encrypted cloud backup, collaboration, open APIs, BIM links, mobile field capture, and plugin support.

## 8. Success measures

- A user can create and calculate a 1,000-activity schedule offline without data loss.
- Reference CPM and PERT examples match independently verified calculations.
- A project can be exported, deleted locally, and restored from one file with no missing data.
- Weekly progress updating requires no duplicate encoding between schedule, BOQ, and S-curve modules.
- Reports clearly explain data date, assumptions, warnings, and calculation version.
- The application remains usable on typical mid-range laptops and tablets.
