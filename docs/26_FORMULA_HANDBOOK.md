# Formula Handbook

## 1. Time conventions

Durations are expressed in activity-calendar working days. The calendar engine represents time at minute resolution. Date-only values use the project timezone and are not converted through the device timezone.

## 2. CPM relationships

For predecessor `P`, successor `S`, and lag `L`:

- **FS:** `ES(S) ≥ EF(P) + L`
- **SS:** `ES(S) ≥ ES(P) + L`
- **FF:** `EF(S) ≥ EF(P) + L`
- **SF:** `EF(S) ≥ ES(P) + L`

The forward pass selects the latest applicable relationship or constraint boundary. The backward pass selects the earliest allowable late boundary.

## 3. Float

- **Total Float:** `TF = LS − ES = LF − EF`
- **Free Float:** time an activity may slip without delaying the earliest successor boundary.

Negative float, zero-float criticality, and near-critical float are reported separately. The application uses the project-configured critical and near-critical thresholds.

## 4. PERT

For optimistic `O`, most likely `M`, and pessimistic `P` durations:

- **Expected duration:** `TE = (O + 4M + P) / 6`
- **Variance:** `σ² = ((P − O) / 6)²`
- **Standard deviation:** `σ = √σ²`
- **Path mean:** sum of expected durations on the selected path
- **Path variance:** sum of activity variances under the independence approximation
- **Target Z score:** `Z = (Target − Path Mean) / √Path Variance`
- **Approximate completion probability:** standard normal cumulative probability at `Z`

The result is an analytical approximation. It assumes independent activity durations and a stable path. It is not a Monte Carlo result.

## 5. BOQ and unit rates

For one resource component:

- **Adjusted consumption:** `Quantity per Unit × (1 + Waste % / 100)`
- **Component amount per BOQ unit:** `Adjusted Consumption × Unit Cost`
- **Calculated item unit rate:** sum of component amounts
- **Item direct amount:** `BOQ Quantity × Unit Rate`

When an item has no resource components, its manual unit rate is used. Markups execute in explicit order and use either direct cost or the running subtotal as their basis.

## 6. Cost loading and curves

An activity budget comes from BOQ allocations unless a documented manual budget override is present. Supported distributions are uniform, front-loaded, back-loaded, bell-shaped, custom weights, and milestone-based.

For each period:

- **Incremental planned value:** allocated budget portion in the period
- **Cumulative planned value:** sum of incremental planned values through the period
- **Earned value:** budgeted value of completed work
- **Actual cost:** cost ledger amount recorded through the period
- **Forecast:** actual cost plus forecast remaining cost

The last cumulative point must reconcile to the authoritative total within the documented rounding tolerance.

## 7. Earned value management

- **PV:** Planned Value
- **EV:** Earned Value
- **AC:** Actual Cost
- **BAC:** Budget at Completion
- **SV:** `EV − PV`
- **CV:** `EV − AC`
- **SPI:** `EV / PV`
- **CPI:** `EV / AC`
- **EAC by CPI:** `BAC / CPI`
- **EAC remaining at budget rate:** `AC + (BAC − EV)`
- **EAC using CPI and SPI:** `AC + (BAC − EV) / (CPI × SPI)`
- **ETC:** `EAC − AC`
- **VAC:** `BAC − EAC`
- **TCPI to BAC:** `(BAC − EV) / (BAC − AC)`

A ratio with a zero or missing denominator is unavailable. It must never be displayed as zero or infinity.

## 8. Cash flow

Owner billing and contractor cash movement may apply:

- billing lag;
- mobilization advance;
- advance recovery;
- retention withholding;
- release of retention;
- tax.

The calculation order and assumptions must appear with the report because contract-specific sequencing changes the result.

## 9. Productivity

- **Output per labor-hour:** `Completed Quantity / Labor Hours`
- **Labor-hours per unit:** `Labor Hours / Completed Quantity`
- **Output per equipment-hour:** `Completed Quantity / Equipment Hours`
- **Cost per unit:** `Recorded Cost / Completed Quantity`
- **Utilization:** `Demand / Availability × 100%`
- **Forecast duration:** `Remaining Quantity / Forecast Daily Output`

Units must be compatible before aggregation. The current release candidate uses average recorded daily output for the main forecast; selectable latest, rolling, weighted, and manual methods remain a release blocker.

## 10. Risk exposure

- **Expected cost exposure:** `Probability × Cost Impact`
- **Expected schedule exposure:** `Probability × Schedule Impact`

Risk totals are prioritization measures, not deterministic additions to the approved estimate or schedule unless an explicit contingency policy applies them.

## 11. Rounding and disclosure

BOQ and cost-control outputs use controlled JavaScript-number rounding. Financial reports must disclose currency, assumptions, missing inputs, and completeness. Arbitrary-precision decimal storage remains future hardening work.
