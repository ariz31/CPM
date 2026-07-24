# Enterprise UX and Design System

## 1. Objective

CPM must combine world-class visual quality with professional density, accessibility, speed, and clarity. The interface is a decision-support system, not a decorative dashboard. It must help users build valid plans, identify risk, update progress, reconcile quantities and costs, and produce defensible reports with minimal friction.

## 2. Experience principles

1. **Clarity before decoration:** every screen must communicate hierarchy, authority, status, and next action.
2. **Fast professional work:** keyboard-first editing, bulk operations, saved views, and predictable shortcuts are first-class.
3. **Progressive complexity:** simple scheduling starts with few fields; advanced cost, risk, resource, and controls fields remain available without cluttering basic work.
4. **Visible authority:** inputs, calculations, actuals, baselines, forecasts, imports, stale values, overrides, and warnings are visually distinct.
5. **No silent behavior:** recalculation, validation, autosave, import conversion, filtering, and report assumptions are visible.
6. **Safe operations:** destructive or high-impact actions show scope, consequences, and recovery.
7. **Accessible by design:** accessibility is included in component contracts, not added after visual completion.
8. **Performance-aware design:** visual effects, charts, animation, and layout must respect interaction and memory budgets.
9. **Consistent mental model:** the same project, WBS, activity, cost, status date, filters, and warnings behave consistently across modules.
10. **Explainability:** every metric and warning can expose its formula, inputs, source revision, and recommended action.

## 3. Information architecture

### 3.1 Global application areas

- Project library
- Project workspace
- Import and restore center
- Templates and libraries
- Settings and accessibility
- Diagnostics and recovery
- Help and formula reference

### 3.2 Project workspace areas

- Overview and health
- WBS and activities
- Gantt and network
- Baselines and updates
- BOQ and estimating
- Cost loading and cash flow
- S-curves and earned value
- Productivity and field records
- Resources
- Risks and changes
- Reports
- Audit and snapshots
- Project settings

### 3.3 Navigation model

- Left navigation identifies module and supports keyboard access.
- A project header shows project name, status date, selected baseline, calculation state, save state, warnings, and current view.
- A contextual toolbar contains actions for the active module only.
- A right inspector shows details, formulas, validation, links, history, and help without forcing modal navigation.
- A command palette provides searchable actions and shortcuts.
- Breadcrumbs and WBS context show location inside large projects.

## 4. Design-token system

All visual values must come from versioned semantic tokens.

### 4.1 Token categories

- Color roles: canvas, surface, elevated surface, border, text, muted text, input, calculated, baseline, actual, forecast, warning, error, success, critical, near-critical, selected, focus.
- Typography: display, heading, body, dense table, label, numeric, code/formula.
- Spacing: compact professional density and comfortable touch density.
- Radius, border, elevation, shadow, opacity, and motion.
- Z-index layers for menus, editors, tooltips, inspectors, dialogs, and transient operations.
- Chart and schedule semantic tokens that remain distinguishable in light, dark, high-contrast, print, and common color-vision conditions.

### 4.2 Theme requirements

- Light, dark, system, and high-contrast-compatible behavior.
- Themes must not change data semantics.
- Criticality, variance, and warnings must combine color with icon, text, shape, pattern, or line style.
- Printed reports use a separate tested print token set.
- User custom themes may be considered later but cannot reduce required contrast.

## 5. Core component contracts

Every reusable component must document:

- Purpose and supported variants.
- Controlled state and events.
- Empty, loading, stale, warning, invalid, disabled, read-only, permission-denied, and failure states.
- Keyboard model and focus behavior.
- Screen-reader role, label, description, and live-region behavior.
- 200% and 400% zoom behavior where applicable.
- Touch target and pointer behavior.
- Virtualization or large-data behavior.
- Performance budget.
- Visual regression stories.
- Unit, interaction, accessibility, and end-to-end tests.

## 6. Enterprise data grid

The grid is a primary application surface and must support professional scheduling and estimating work.

### 6.1 Required behavior

- Row and column virtualization.
- Frozen identifiers and configurable frozen columns.
- Keyboard navigation using arrows, Tab, Shift+Tab, Enter, Escape, Home, End, Page Up/Down, and documented modifier shortcuts.
- Single-cell and range selection.
- Copy, paste, fill, clear, and multi-row operations.
- Inline editors with type-specific validation.
- Undo/redo at command boundaries.
- Column chooser, resize, reorder, grouping, sorting, filtering, summaries, and saved views.
- Visible field provenance and authority.
- Accessible row and column context even under virtualization.
- Deterministic paste preview for large or invalid operations.
- No accidental data mutation while sorting, filtering, or resizing.

### 6.2 Edit lifecycle

1. Enter edit mode intentionally.
2. Preserve original value until validation succeeds.
3. Validate syntax immediately where safe.
4. Validate cross-field invariants through the domain layer.
5. Commit one command and audit event.
6. Trigger cancellable recalculation where required.
7. Show saved, warning, invalid, or failed state.
8. Support undo with exact prior authority.

### 6.3 Dense and touch modes

- Compact density optimizes laptop use and may use smaller row heights while preserving keyboard and focus clarity.
- Comfortable density increases spacing and touch targets.
- The mode is user-selectable and responsive defaults may differ by device.
- No feature may exist only in hover behavior.

## 7. Gantt experience

### 7.1 Visual hierarchy

- Baseline appears behind or adjacent to current plan.
- Actual and remaining portions are visually distinct.
- Status date is prominent but not obstructive.
- Critical, near-critical, and negative-float states are distinguishable.
- Relationship type and lag are available on focus or selection.
- Constraints, deadlines, warnings, and out-of-sequence progress use explicit markers.

### 7.2 Interaction

- Horizontal time zoom is anchored to cursor, selection, or chosen reference date.
- Vertical scrolling remains synchronized with the grid.
- Drag editing is optional and must show a preview, constraints, and confirmation for high-impact changes.
- Selecting a bar selects its row and inspector details.
- Relationship creation requires clear source, target, type, lag, and validation.
- Users can isolate critical paths, selected WBS, date windows, responsible parties, or warning classes.

### 7.3 Accessibility

- Every visible bar has an accessible text equivalent including activity, dates, duration, progress, float, baseline variance, and status.
- Keyboard commands allow time navigation and selection.
- A synchronized table provides all essential information and actions.
- Relationship meaning is available in text; users are not required to interpret arrow geometry alone.

## 8. Network experience

- Default views prioritize meaningful subsets rather than rendering an unreadable full graph.
- Users may display selected path, predecessors, successors, driving logic, WBS branch, or bounded neighborhood.
- Automatic layout runs in a worker and is cancellable.
- Manual positions are preserved as a separate view state.
- Nodes expose key dates, duration, float, progress, and warnings using progressive detail.
- Edge focus reveals relationship type, lag, driving status, and calendar basis.
- A textual path and relationship list is always available.

## 9. BOQ and cost UX

- BOQ hierarchy, item identity, quantity, unit, rate, amount, revision state, and allocation state remain visible.
- Unit-price analysis opens as an inspector or focused workspace without losing BOQ position.
- Markup calculation order is presented as an auditable waterfall.
- Allocation views show unallocated and overallocated amounts before cost loading.
- Monetary values use aligned numeric formatting, currency labels, precision policy, and negative-value treatment.
- Revision comparison supports added, removed, quantity, rate, and total changes with filters and summaries.

## 10. Progress-update UX

The update workflow should be optimized for recurring weekly use:

1. Select or confirm status date.
2. Review overdue and due-for-update activities.
3. Enter actual starts/finishes, remaining duration, quantity, physical progress, actual cost, and notes.
4. Import field logs or productivity records where available.
5. Resolve validation and out-of-sequence warnings.
6. Recalculate and compare to baseline.
7. Review critical path, finish forecast, EVM, S-curves, and look-ahead.
8. Save a named update snapshot and generate reports.

Bulk update, filtered update queues, keyboard navigation, and source evidence are required.

## 11. Dashboard design

Dashboards must answer actionable questions rather than maximize metric count.

Recommended sections:

- Finish forecast and baseline variance.
- Current critical and near-critical paths.
- Overdue and upcoming milestones.
- Open logic, constraint, data-quality, and stale-update warnings.
- Planned, earned, actual, and forecast curves.
- CPI, SPI, EAC, VAC, and data completeness.
- Productivity exceptions.
- Resource peaks and overallocations.
- BOQ changes and unallocated cost.
- Risks requiring action.

Every metric links to its underlying records and formula explanation.

## 12. Empty, loading, and failure states

### Empty states

- Explain the module’s purpose.
- Offer one or two concrete next actions.
- Link to sample data or a template where useful.
- Avoid decorative emptiness that hides required setup.

### Loading and long-running states

- Show what is running, progress when measurable, elapsed status, and cancellation.
- Preserve prior valid results while replacements calculate.
- Avoid full-screen blocking when unaffected modules remain usable.

### Failure states

- Use stable error code, plain-language summary, affected scope, retained data state, retry guidance, recovery action, and diagnostic export.
- Never blame the user for malformed imported data.
- Never hide technical detail needed by support; place it behind an expandable section.

## 13. Responsive behavior

### Desktop

- Dense multi-pane workspace, resizable panels, keyboard-first editing, and large visualizations.

### Tablet

- Two-pane or focused workspaces, comfortable density, touch-resilient selection, and simplified relationship editing.

### Small screens

- The initial product may provide review and targeted field-entry workflows rather than the complete dense desktop authoring experience.
- Capability limits must be explicit.
- No destructive data conversion may occur because a feature is unavailable on the device.

## 14. Accessibility standard

Core workflows target WCAG 2.2 AA.

Required coverage:

- Logical headings, landmarks, names, roles, and states.
- Visible focus and predictable focus order.
- Keyboard completion without traps.
- Screen-reader announcements for save, validation, calculation, import, and long-running status.
- Reflow at 200% zoom and usable behavior at 400% for essential workflows.
- Minimum target sizes or equivalent spacing.
- Reduced-motion preference.
- High-contrast and forced-colors compatibility.
- Text alternatives and data tables for charts, Gantt, and networks.
- Errors linked to fields with corrective guidance.
- No time limit for core editing.

## 15. Motion and visual effects

- Motion communicates spatial or state change; it is not decorative noise.
- Respect reduced-motion preferences.
- Avoid continuous animation in project workspaces.
- Use short, interruptible transitions that do not delay interaction.
- Shadows, blur, gradients, and transparency must not harm text contrast or rendering performance.
- Canvas and chart effects must be profiled on minimum hardware.

## 16. UX test catalog

| Test ID | Scenario | Pass condition |
|---|---|---|
| UX-AT-001 | Complete basic schedule using keyboard only | All actions available with visible focus and no trap |
| UX-AT-002 | Complete weekly progress update | Minimal context switching; validation and recalculation are understandable |
| UX-AT-003 | Edit 10,000-row grid continuously | No lost input; interaction budgets pass |
| UX-AT-004 | Use Gantt at day-to-year zoom | Alignment, semantics, and navigation remain correct |
| UX-AT-005 | Trace a critical path in network and table | Same continuous path and details appear in both views |
| UX-AT-006 | Perform BOQ revision comparison | Changes classify correctly and totals remain understandable |
| UX-AT-007 | Import malformed spreadsheet | Preview explains issues and no data changes before approval |
| UX-AT-008 | Recover interrupted operation | User understands retained state and completes recovery |
| UX-AT-009 | Screen-reader core workflow | Required context, errors, and status are announced |
| UX-AT-010 | 200% zoom and high contrast | Essential workflows remain complete and legible |
| UX-AT-011 | Touch tablet workflow | Selection, editing, menus, and dialogs remain reliable |
| UX-AT-012 | Color-vision simulation | Criticality and warning meaning remains distinguishable |
| UX-AT-013 | Reduced-motion mode | No essential state depends on animation |
| UX-AT-014 | Long report generation | Progress, cancel, background behavior, and final result are clear |
| UX-AT-015 | Permission/read-only future mode | Restricted actions are explained without hiding accessible data |

## 17. Review gates

A UI feature cannot merge without:

- Design-system component use or documented exception.
- Complete state inventory.
- Keyboard and screen-reader behavior.
- Responsive and zoom behavior.
- Loading, empty, stale, invalid, read-only, and failure states.
- Visual-regression stories.
- Interaction and accessibility tests.
- Performance evidence for large data or animation.
- User documentation where workflow changes.

World-class UI means beautiful, fast, predictable, accessible, and trustworthy at the same time.