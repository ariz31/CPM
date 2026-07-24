# Glossary and Formula Reference

## 1. Scheduling terms

| Term | Definition |
|---|---|
| Activity | A scheduled unit of work with duration, logic, calendar, and optional cost/resources. |
| Activity-on-Node (AON) | Network method in which activities are represented by nodes and dependencies by arrows. |
| Actual Finish (AF) | Date and time an activity was completed. |
| Actual Start (AS) | Date and time work actually began. |
| As Late As Possible (ALAP) | Scheduling mode that places work as late as logic allows. |
| As Soon As Possible (ASAP) | Default scheduling mode that places work at the earliest logic-permitted date. |
| Backward Pass | Calculation from project finish toward project start to determine late dates. |
| Baseline | Approved immutable snapshot used to measure variance. |
| Calendar | Working days, shifts, holidays, and exceptions used for duration arithmetic. |
| Constraint | Date rule applied directly to an activity. |
| Critical Activity | Activity meeting the configured critical-float threshold. |
| Critical Path | Continuous driving sequence controlling project completion under the current model. |
| Data Date / Status Date | Cutoff separating actual progress from forecast work. |
| Deadline | Target date that creates variance/warning without directly moving activity dates. |
| Driving Relationship | Dependency that determines an activity's current early or late date. |
| Duration | Working time required by an activity under its calendar. |
| Early Finish (EF) | Earliest logic- and calendar-permitted finish. |
| Early Start (ES) | Earliest logic- and calendar-permitted start. |
| Finish-to-Finish (FF) | Successor finish is constrained by predecessor finish. |
| Finish-to-Start (FS) | Successor start is constrained by predecessor finish. |
| Float | Available scheduling flexibility measured in working time. |
| Forward Pass | Calculation from project start toward project finish to determine early dates. |
| Free Float | Delay available without delaying any immediate successor's early date. |
| Lag | Working-time offset applied to a relationship. Positive lag delays; negative lag is lead. |
| Late Finish (LF) | Latest finish that does not delay the controlling completion target. |
| Late Start (LS) | Latest start that does not delay the controlling completion target. |
| Lead | Negative lag allowing overlap between activities. |
| Logic Loop | Circular dependency that prevents a valid topological schedule. |
| Milestone | Zero-duration event representing a significant start or finish. |
| Near-Critical | Activity with small positive float within a configured threshold. |
| Negative Float | Amount by which the schedule violates a required date or restrictive constraint. |
| Open End | Activity with missing predecessor or successor logic outside approved exceptions. |
| Out-of-Sequence Progress | Actual work performed despite incomplete logical predecessors. |
| Relationship | Dependency between predecessor and successor activities. |
| Remaining Duration | Forecast working time required to complete an activity. |
| Start-to-Finish (SF) | Successor finish is constrained by predecessor start. |
| Start-to-Start (SS) | Successor start is constrained by predecessor start. |
| Total Float | Delay available without delaying the controlling completion target. |
| WBS | Hierarchical Work Breakdown Structure organizing project scope. |

## 2. PERT and risk terms

| Term | Definition |
|---|---|
| Optimistic duration (O) | Short plausible duration under favorable conditions. |
| Most likely duration (M) | Most probable duration under expected conditions. |
| Pessimistic duration (P) | Long plausible duration under unfavorable conditions. |
| Expected duration | Weighted PERT mean `(O + 4M + P) / 6`. |
| Variance | Measure of duration uncertainty `((P − O) / 6)^2`. |
| Standard deviation | Square root of variance; `(P − O) / 6` under classic PERT. |
| Z-score | Number of standard deviations a target lies from the expected mean. |
| Monte Carlo simulation | Repeated sampling of uncertain inputs to estimate an outcome distribution. |
| P50/P80/P90 | Dates or costs with approximately 50%, 80%, or 90% probability of not being exceeded under the simulation model. |
| Correlation | Statistical dependence between uncertain activity or cost outcomes. |
| Risk exposure | Combined measure of probability and impact. |

## 3. BOQ and cost terms

| Term | Definition |
|---|---|
| BOQ | Bill of Quantities listing work items, quantities, units, rates, and amounts. |
| Direct cost | Cost directly attributable to work, such as labor, material, equipment, and subcontract. |
| Indirect cost | Project cost not assigned directly to one measured item. |
| Unit rate | Cost or selling price per unit of work. |
| Unit-price analysis | Breakdown of a unit rate into resource consumption and prices. |
| Resource coefficient | Quantity of a resource required per unit of BOQ output. |
| Waste factor | Additional quantity or consumption allowed for waste. |
| Markup | Percentage or fixed amount added according to a specified basis and order. |
| Contingency | Allowance for uncertainty within the estimate basis. |
| Escalation | Allowance for time-related price changes. |
| Provisional sum | Allowance for work not sufficiently defined at estimate time. |
| Allocation | Distribution of BOQ value to activities, cost accounts, locations, or periods. |
| BAC | Budget at Completion; total approved performance-measurement baseline budget. |

## 4. S-curve and progress terms

| Term | Definition |
|---|---|
| S-curve | Cumulative value plotted over time, commonly forming an S-shaped profile. |
| Incremental value | Value assigned to one period. |
| Cumulative value | Sum of all incremental values through a period. |
| Early curve | Time-phased plan using early schedule dates. |
| Late curve | Time-phased plan using late schedule dates. |
| Physical progress | Progress based on installed quantity, weighted milestones, or other non-cost measure. |
| Financial progress | Progress expressed in cost, budget, billing, or expenditure terms. |
| Time phasing | Distribution of total quantity/cost/hours across schedule periods. |
| Retention | Amount withheld from billing until contractual release conditions are met. |
| Mobilization advance | Upfront payment later recovered from progress billings. |
| Payment lag | Delay between billing/cost recognition and actual cash movement. |

## 5. Earned value terms

| Term | Definition |
|---|---|
| Planned Value (PV) | Budgeted cost of work scheduled by the status date. |
| Earned Value (EV) | Budgeted cost of work actually performed by the status date. |
| Actual Cost (AC) | Actual cost incurred for work performed by the status date. |
| Schedule Variance (SV) | `EV − PV`. Positive is favorable in cost-value terms. |
| Cost Variance (CV) | `EV − AC`. Positive is favorable. |
| Schedule Performance Index (SPI) | `EV / PV`. |
| Cost Performance Index (CPI) | `EV / AC`. |
| Estimate at Completion (EAC) | Forecast final cost using a stated assumption/formula. |
| Estimate to Complete (ETC) | Forecast remaining cost, usually `EAC − AC`. |
| Variance at Completion (VAC) | Forecast budget variance `BAC − EAC`. |
| TCPI | Required future cost efficiency to meet BAC or a selected EAC. |
| Performance Measurement Baseline | Time-phased approved budget against which PV and EV are measured. |

## 6. Productivity and resource terms

| Term | Definition |
|---|---|
| Production rate | Quantity produced per unit of time. |
| Labor productivity | Output per labor-hour or labor-hours per unit. |
| Equipment productivity | Output per equipment-hour or equipment-hours per unit. |
| Crew | Defined combination of labor and equipment resources. |
| Utilization | Productive time divided by available time. |
| Downtime | Available time in which production did not occur. |
| Unit cost | Cost incurred per unit of accepted output. |
| Rolling average | Average over a selected number of recent periods. |
| Resource histogram | Time-phased demand for a resource. |
| Overallocation | Demand exceeding available resource capacity. |
| Resource leveling | Schedule adjustment to resolve resource over-allocation under defined priorities. |
| Resource smoothing | Adjustment within float to reduce demand peaks without changing project finish where possible. |

## 7. File and system terms

| Term | Definition |
|---|---|
| Offline-first | Core behavior is designed to work locally without network access. |
| PWA | Progressive Web Application installable through a supporting browser. |
| IndexedDB | Browser database used for transactional local project storage. |
| Project revision | Monotonic version of authoritative project data after each committed command. |
| Calculation run | Versioned derived-result set tied to project revision and engine settings. |
| Stale result | Calculation output whose inputs have changed since it was produced. |
| Snapshot | Recoverable project-state capture at a point in time. |
| `.cpmproj` | Proposed portable ZIP-compatible CPM project bundle. |
| Manifest | File describing bundle version, project metadata, included sections, and entry points. |
| Checksum | Hash used to detect file corruption. |
| Migration | Controlled conversion from an older schema to a newer schema. |
| Adapter | Boundary implementation for storage, file formats, sync, or external systems. |

## 8. Formula quick reference

### CPM

```text
EF = addWork(ES, Duration, Calendar)
LS = subtractWork(LF, Duration, Calendar)
Total Float = LS − ES  (working time)
```

Relationship concepts:

```text
FS: Successor Start ≥ Predecessor Finish + Lag
SS: Successor Start ≥ Predecessor Start + Lag
FF: Successor Finish ≥ Predecessor Finish + Lag
SF: Successor Finish ≥ Predecessor Start + Lag
```

### PERT

```text
Expected duration = (O + 4M + P) / 6
Standard deviation = (P − O) / 6
Variance = ((P − O) / 6)^2
Path mean = Σ expected durations
Path variance = Σ activity variances
Z = (Target − Path mean) / sqrt(Path variance)
Probability ≈ Φ(Z)
```

### BOQ

```text
Adjusted quantity = Quantity × (1 + Waste factor)
Component unit cost = Consumption × Resource rate
Direct unit cost = Σ component unit costs
Item amount = Quantity × Unit rate
Activity allocation = BOQ amount × Allocation weight
```

### S-curve

```text
Period value = Total value × Period weight
Σ Period weights = 1
Cumulative value at period n = Σ Period values through n
```

### EVM

```text
SV = EV − PV
CV = EV − AC
SPI = EV / PV
CPI = EV / AC
EAC = BAC / CPI
EAC = AC + (BAC − EV)
EAC = AC + (BAC − EV) / (CPI × SPI)
ETC = EAC − AC
VAC = BAC − EAC
TCPI(BAC) = (BAC − EV) / (BAC − AC)
TCPI(EAC) = (BAC − EV) / (EAC − AC)
```

### Productivity

```text
Output per labor-hour = Quantity / Labor hours
Labor-hours per unit = Labor hours / Quantity
Output per equipment-hour = Quantity / Equipment hours
Utilization = Productive hours / Available hours
Unit cost = Direct cost / Quantity
Forecast remaining duration = Remaining quantity / Forecast rate
```

## 9. Interpretation cautions

- A critical path is model-dependent; missing logic, constraints, calendars, and progress conventions can change it.
- Zero total float is not the only possible critical definition; the project must state its threshold.
- PERT probability is an approximation and does not automatically account for path switching or correlation.
- SPI is a cost-weighted schedule indicator, not a replacement for critical-path analysis.
- Physical and financial progress are different measures and can move differently.
- Productivity direction matters: higher output per hour is favorable, while lower hours per unit is favorable.
- Cost forecasts are scenarios based on assumptions, not guarantees.
- Rounding can alter displayed subtotals; authoritative totals must reconcile under documented rules.
