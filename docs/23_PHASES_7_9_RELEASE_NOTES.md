# Phases 7–9 Release Notes

## Scope

This milestone extends CPM from scheduling, progress, and estimating into integrated cost control, uncertainty analysis, resource planning, and enterprise reporting:

1. Phase 7 — cost loading, S-curves, earned value, and cash flow.
2. Phase 8 — PERT, risk, productivity, and resources.
3. Phase 9 — enterprise dashboards, immutable reports, audit, overrides, and diagnostics.

The three phases share Project Schema Version 4. All new authoritative records remain inside the offline project aggregate, local transactions, recovery snapshots, and checksummed portable project file.

## Phase 7 — Cost loading, S-curves, and earned value

Delivered:

- BOQ-derived activity budgets using entered allocation percentages.
- Optional activity-level budget and quantity overrides.
- Uniform, front-loaded, back-loaded, bell, custom, and milestone distributions.
- Daily, weekly, monthly, and configurable fiscal-period aggregation.
- Planned-early, planned-late, actual, earned, and forecast cumulative curves.
- PV, EV, AC, SV, CV, SPI, CPI, BAC, EAC, ETC, VAC, and TCPI.
- Explicit unavailable values for undefined ratios or forecasts.
- Allocation-completeness findings and calculation assumptions.
- Billing lag, mobilization advance, advance recovery, retention, retention release, and tax rules.
- Cost-control workspace with curve chart, phasing, actual-cost ledger, EVM metrics, and cash-flow table.

Key calculation rules:

- BOQ direct amounts use their entered activity allocations and are never silently normalized.
- Estimate markups are distributed proportionally over allocated direct cost.
- Earned value uses authoritative activity progress at the status date.
- Actual cost includes records dated on or before the status date.
- Forecast curve uses actual cost through the status date plus remaining budget at planned rates.
- Final planned cumulative values reconcile to BAC within cent rounding.

## Phase 8 — PERT, risk, productivity, and resources

Delivered:

- Optimistic, most-likely, and pessimistic activity estimates.
- PERT expected duration, variance, standard deviation, path target probability, and sensitivity ranking.
- Warnings for invalid estimate ordering, missing critical-path estimates, and zero uncertainty.
- Risk register with probability, cost/day impact, owner, status, response, and linked activities.
- Probability-weighted expected cost and schedule exposure.
- Productivity plans and daily field records.
- Compatible-unit conversion for supported length, area, volume, mass, and count units.
- Actual daily production, labor productivity, equipment productivity, remaining quantity, and duration forecast.
- Labor, equipment, material, and cost resources with activity assignments.
- Daily demand histograms, utilization, and over-allocation findings.
- Five-megabyte per-field-record and 25-megabyte per-project evidence metadata limits.

Probability disclosure:

- PERT uses `(O + 4M + P) / 6` for expected duration.
- Standard deviation uses `(P - O) / 6`.
- Critical-path variance assumes independent activity durations.
- Completion probability uses a normal approximation and does not model path switching.

## Phase 9 — Enterprise reporting and audit

Delivered:

- Configurable dashboard definitions and widget sizes.
- Explicit complete, partial, and unavailable metric states.
- Executive, update, critical path, look-ahead, BOQ, cash-flow, EVM, productivity, resource, risk, change, and audit report inputs.
- Immutable report snapshots tied to one project revision, status date, engine version, row set, and stable input hash.
- Formula inspector covering PV, EV, AC, SPI, CPI, EAC, and PERT.
- Authoritative command registry and unmapped-command-class findings.
- Manual override records requiring field path, reason, author, prior/new values, and timestamp.
- Diagnostics timeline with bounded support-bundle output.
- Local support bundle download with recursive metadata, email, token, credential, and authorization redaction.
- A 20,000-row immutable report generation performance guard.

## Cross-module integrity

Activity IDs remain stable after creation. Deleting an activity now removes every live reference from:

- schedule relationships;
- current progress;
- current BOQ allocations;
- activity cost loadings;
- PERT estimates;
- risk links;
- productivity plans and field records; and
- resource assignments.

Historical actual-cost amounts are retained but detached from the deleted activity. Immutable baselines, update snapshots, estimate revisions, report snapshots, audit entries, and support evidence are not rewritten.

Project duplication remaps resource IDs and their assignment references so copied projects remain valid.

## Data compatibility

- Application package: Version 0.9.0.
- IndexedDB schema: Version 5.
- Project record schema: Version 4.
- CPM engine remains `0.3.0-calendar-cpm` because Phases 7–9 consume rather than replace authoritative CPM dates.
- Portable `.cpmproj` envelope remains Version 1 and contains the complete Schema Version 4 project aggregate.

IndexedDB Version 5 upgrades both live projects and stored recovery snapshots from Schema Version 3 by adding empty cost-control, risk/resource, and enterprise-reporting models. Existing schedules, calendars, WBS, relationships, baselines, progress, BOQ data, snapshots, and journal entries remain intact.

## Validation evidence

Written acceptance tests `P7-AT-001` through `P9-AT-008` cover:

- distribution normalization and curve reconciliation;
- reference EVM and null-safe missing-data behavior;
- contract cash-flow terms;
- PERT expected duration, variance, and probability;
- compatible-unit productivity conversion;
- risk exposure and evidence limits;
- resource assignment reconciliation and over-allocation;
- immutable report snapshots and stable hashes;
- dashboard completeness;
- audit-class mapping and manual overrides;
- support-bundle redaction;
- cross-module deletion cleanup; and
- large-report generation performance.

The complete existing transaction, recovery, portable-file, CPM, worker, professional-view, baseline, progress, estimating, traceability, and 10,000-activity performance suites remain mandatory.

## Known limitations

- Cost forecasting uses actual cost plus remaining budget at planned rates; selectable EAC forecast curves remain future work.
- Actualized data-date CPM is not yet integrated into the scheduling forward/backward pass.
- PERT uses analytical approximation rather than Monte Carlo simulation.
- Productivity forecasting currently uses average recorded daily output rather than rolling or weighted selections.
- Resource demand is analyzed but not automatically leveled or smoothed.
- Financial storage uses controlled JavaScript-number rounding rather than arbitrary-precision decimal storage.
- Support bundles are generated and downloaded locally; they are never automatically transmitted.
- Dedicated deterministic PDF rendering remains future reporting hardening.

## Next milestone

Phase 10 will qualify the offline Version 1 release through migration-matrix testing, browser/device compatibility, accessibility audit and remediation, security corpus and dependency review, SBOM and provenance, P0–P4 performance and soak tests, offline install/update/rollback drills, and a complete release evidence package.
