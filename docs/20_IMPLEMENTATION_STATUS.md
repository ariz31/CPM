# Application Implementation Status

## Current milestone

The executable offline application now covers roadmap Phases 0–9:

- Phase 0 — engineering and offline application foundation.
- Phase 1 — project library and safe local storage.
- Phase 2 — calendars, WBS, and activity grid.
- Phase 3 — CPM engine and schedule health.
- Phase 4 — professional Gantt, network, and schedule reports.
- Phase 5 — baselines and progress control.
- Phase 6 — BOQ and estimating.
- Phase 7 — cost loading, S-curves, cash flow, and earned value.
- Phase 8 — PERT, risk, productivity, and resources.
- Phase 9 — enterprise dashboards, immutable reports, audit, overrides, and diagnostics.

Phase 10 enterprise-quality release qualification remains subsequent work. It includes the complete migration matrix, browser/device compatibility, security corpus, accessibility audit, performance/soak qualification, SBOM/provenance, and release evidence package.

## Phase 7 delivered

- BOQ-to-activity cost loading with explicit allocation completeness.
- Manual activity budget overrides and quantity-loading fields.
- Uniform, front-loaded, back-loaded, bell, custom-weight, and milestone phasing.
- Daily, weekly, monthly, and fiscal aggregation.
- Cumulative planned-early, planned-late, actual, earned, and forecast curves.
- PV, EV, AC, SV, CV, SPI, CPI, BAC, EAC, ETC, VAC, and TCPI.
- Undefined ratios represented as `null`/Unavailable rather than zero or infinity.
- Billing lag, advance, recovery, retention, retention release, and tax cash-flow rules.
- Curve, EVM, allocation, and assumption disclosures in the cost-control workspace.

## Phase 8 delivered

- Activity optimistic, most-likely, and pessimistic estimates.
- PERT expected duration, variance, standard deviation, target probability, warnings, and sensitivity ranking.
- Risk register with probability, cost/day impact, owner, status, response, and linked activities.
- Expected risk cost and schedule exposure ranking.
- Productivity plans, daily field records, unit conversion, actual rates, labor/equipment productivity, and duration forecasts.
- Labor, equipment, material, and cost resources with activity assignments.
- Daily resource histograms, utilization, and over-allocation findings.
- Five-megabyte per-evidence and 25-megabyte project evidence guards.

## Phase 9 delivered

- Configurable dashboard definitions with explicit metric completeness.
- Executive, update, critical path, look-ahead, BOQ, cash-flow, EVM, productivity, resource, risk, change, and audit report inputs.
- Immutable report snapshots tied to one project revision, status date, engine version, and stable input hash.
- Formula inspector for PV, EV, AC, SPI, CPI, EAC, and PERT.
- Authoritative command registry and unmapped-command detection.
- Manual override records with field path, prior/new values, reason, author, and timestamp.
- Diagnostics timeline and downloadable privacy-redacted support bundle.
- Recursive redaction of ownership/location fields, credentials, email addresses, and token-like strings.
- Schema Version 4 portable projects and IndexedDB Version 5 migration for live projects and stored recovery snapshots.

## Written acceptance tests

| Test ID | Requirement IDs | Acceptance statement | Automation |
|---|---|---|---|
| P1-AT-001 | PRJ-001, PRJ-002 | The library initializes once, creates projects, and lists lifecycle states independently. | `projectRepository.test.ts` |
| P1-AT-006 | IO-001, IO-002 | Portable export/import restores an exact project and rejects checksum tampering. | `projectFile.test.ts` |
| P2-AT-001 | CAL-001, CAL-002 | Calendars support split shifts, holidays, and exceptions. | `calendar.test.ts` |
| P2-AT-002 | WBS-001 | WBS nodes remain hierarchical, uniquely identified, command-managed, and portable. | `projectCommands.test.ts` |
| P2-AT-003 | ACT-001 | Activities are created and updated through validated commands with stable authoritative fields. | `projectCommands.test.ts` |
| P2-AT-006 | ACT-005, IO-003 | Invalid CSV rows prevent the whole activity import. | `csvImport.test.ts` |
| P3-AT-001 | LOG-001, LOG-002 | FS, SS, FF, and SF calculate documented boundaries with lag. | `cpm.test.ts` |
| P3-AT-002 | CPM-001 | Calendar-aware forward and backward passes produce deterministic early and late dates. | `cpm.test.ts` |
| P3-AT-008 | PERF-P3 | A 10,000-activity chain remains inside the CI safety budget. | `cpm.performance.test.ts` |
| P4-AT-001 | UI-002, UI-003 | Network and Gantt outputs use deterministic professional structures and accessible alternatives. | `networkLayout.test.ts`, `ProfessionalGantt.tsx` |
| P4-AT-008 | IO-005 | Print output uses stable provenance, headings, and page-safe rows. | `reportExport.ts` |
| P5-AT-001 | BAS-001, BAS-002 | Original and revised baselines copy one calculated revision and remain immutable. | `progress.test.ts` |
| P5-AT-008 | BAS-003, BAS-004 | Weekly update snapshots preserve status date, revision, and progress records. | `progress.test.ts` |
| P6-AT-001 | BOQ-001, BOQ-002, BOQ-003 | Resource quantities, costs, waste, unit rates, and item amounts reconcile. | `estimating.test.ts` |
| P6-AT-006 | IO-003 | BOQ CSV export neutralizes spreadsheet formula prefixes. | `estimating.test.ts` |
| P7-AT-001 | SCV-001 | Six phasing methods normalize to 100% and preserve their documented shapes. | `costControl.test.ts` |
| P7-AT-002 | SCV-002 | Daily, weekly, monthly, and fiscal buckets are generated from stable date-only values. | `costControl.ts` and curve UI |
| P7-AT-003 | SCV-003 | Planned early/late, actual, earned, and forecast cumulative curves use one budget basis. | `costControl.test.ts` |
| P7-AT-004 | SCV-004 | Final planned cumulative values reconcile exactly to BAC within cent rounding. | `costControl.test.ts` |
| P7-AT-005 | EVM-001 | PV, EV, AC, SV, CV, SPI, CPI, and BAC match the reference fixture. | `costControl.test.ts` |
| P7-AT-006 | EVM-002 | EAC, ETC, VAC, and TCPI are calculated when their denominators exist. | `costControl.test.ts` |
| P7-AT-007 | EVM-003 | Undefined ratios and forecasts are `null`, never zero or infinity. | `costControl.test.ts` |
| P7-AT-008 | CSH-001 | Billing lag, advance, recovery, retention, release, and tax produce finite cash-flow records. | `costControl.test.ts` |
| P8-AT-001 | PERT-001, PERT-002 | O ≤ M ≤ P validation, expected duration, variance, and standard deviation match reference values. | `riskResources.test.ts` |
| P8-AT-002 | PERT-003, PERT-004 | Target probability uses the documented normal approximation and exposes missing-estimate warnings. | `riskResources.test.ts` |
| P8-AT-003 | RSK-001 | Expected risk cost/day exposure is probability-weighted and ranked. | `riskResources.test.ts` |
| P8-AT-004 | PRD-001, PRD-002 | Productivity plans and field records retain quantities, hours, notes, dates, and bounded evidence metadata. | `riskResources.test.ts` |
| P8-AT-005 | PRD-003 | Compatible unit conversion and actual labor/equipment productivity match reference fixtures. | `riskResources.test.ts` |
| P8-AT-006 | PRD-004 | Remaining quantity and duration forecasts never invent rates when no production exists. | `riskResources.test.ts` |
| P8-AT-007 | RES-001 | Resource assignments retain availability, rate, unit, activity, and units per day. | `riskResources.test.ts` |
| P8-AT-008 | RES-002 | Resource histograms reconcile assignments and flag demand above availability. | `riskResources.test.ts` |
| P9-AT-001 | IO-005, AUD-002 | Frozen report snapshots retain one revision, status date, engine, rows, and stable input hash. | `enterprise.test.ts` |
| P9-AT-002 | SET-003 | Dashboard metrics expose units and complete/partial/unavailable states without color-only meaning. | `enterprise.test.ts`, `EnterprisePanel.tsx` |
| P9-AT-003 | AUD-001 | Every registered authoritative command class maps to a human audit description. | `enterprise.test.ts` |
| P9-AT-004 | AUD-003 | Manual overrides require field path and reason and remain distinct in change reports. | `enterprise.test.ts` |
| P9-AT-005 | AUD-002 | Formula inspector documents formulas, undefined conditions, and assumptions. | `enterprise.test.ts` |
| P9-AT-006 | SEC-DIAG | Support bundles redact private metadata, email addresses, and token-like values. | `enterprise.test.ts` |
| P9-AT-007 | PRJ-006, ACT-004 | Activity deletion cleans every live cost/risk/productivity/resource reference while preserving immutable historical records. | `projectCommands.test.ts` |
| P9-AT-008 | PERF-P9 | A 20,000-row immutable report snapshot is generated within the CI safety budget. | `enterprise.test.ts` |

## Explicit limitations

- Print/PDF still uses the browser print engine rather than a dedicated deterministic PDF worker.
- Cost forecasting currently uses actual cost through the status date plus remaining budget at planned rates; alternate EAC methods are displayed but not selectable as curve drivers.
- PERT path variance uses the independence and normal-approximation assumptions and does not perform Monte Carlo path switching.
- Productivity forecasts currently use average recorded daily output rather than selectable rolling/weighted methods.
- Resource histograms use daily assignment demand and do not yet perform automatic leveling or smoothing.
- Support bundles are downloaded locally and are not transmitted automatically.
- Full Phase 10 browser, accessibility, security, performance, migration-matrix, SBOM, and soak qualification remains outstanding.

## Next roadmap phase

Phase 10 will qualify the offline Version 1 release through security hardening, accessibility audit, migration and recovery drills, browser/device coverage, P0–P4 performance and soak tests, SBOM/provenance, and complete release evidence.
