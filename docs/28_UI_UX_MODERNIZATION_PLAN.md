# CPM UI/UX Modernization Plan

**Status:** Proposed implementation architecture  
**Target:** Post-Phase-10 UI modernization program  
**Primary goal:** Turn CPM into a world-class, responsive construction-planning workbench without generic AI-generated visual patterns.

---

## 1. Executive summary

CPM already has a broad and technically capable project-controls engine, but the interface has grown incrementally across multiple implementation phases. The next UI program must consolidate the product into one coherent design system and one adaptive application shell.

The recommended direction is a **Construction Control Workbench**: a restrained, data-dense professional environment for planners, cost engineers, project managers, site engineers, quantity surveyors, and executives.

The redesign must prioritize:

- Professional information density
- Clear hierarchy
- Fast navigation
- Consistent keyboard and touch interaction
- First-class desktop workflows
- Purpose-designed tablet and mobile workflows
- Accessible colors, controls, dialogs, tables, and charts
- A complete token-driven theme system
- Offline persistence of user appearance preferences
- Visual quality produced by precision and consistency rather than decorative effects

This program must not imitate a marketing page, a generic SaaS dashboard, or a default component-library demo.

---

## 2. Product design position

### 2.1 Design character

The interface should be:

- **Calm:** neutral surfaces, limited accent use, low visual noise.
- **Precise:** deliberate alignment, consistent spacing, stable typography, explicit statuses.
- **Technical:** suited to schedules, quantities, costs, dates, dependencies, reports, and audit evidence.
- **Efficient:** frequent tasks remain close at hand; secondary functions stay discoverable without crowding the screen.
- **Adaptive:** the interaction model changes according to available space and input method.
- **Trustworthy:** every result shows context, completeness, and provenance where relevant.
- **Distinctive:** recognizable as CPM through its navigation, chart language, typography, and construction-control patterns.

### 2.2 Visual anti-patterns to prohibit

The following must be explicitly rejected during implementation review:

- Giant application hero sections
- Decorative gradients on ordinary work surfaces
- Glassmorphism, glowing borders, or excessive transparency
- Rounded cards around every piece of content
- Generic bento dashboards
- Random icon usage with no information value
- Oversized display typography in workspaces
- Unnecessary floating panels
- Decorative animations that compete with data
- Default unmodified Material, Bootstrap, or shadcn styling
- Mobile layouts that merely shrink desktop screens
- Color as the only carrier of meaning
- Hover-only access to essential actions
- Hidden destructive actions with unclear consequences

---

## 3. Research and standards basis

The implementation should align with the following standards and primary references:

- W3C Design Tokens Community Group format: https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- WAI-ARIA Authoring Practices — Grid: https://www.w3.org/WAI/ARIA/apg/patterns/grid/
- WAI-ARIA Authoring Practices — Dialog: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
- CSS Container Queries: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries
- `prefers-color-scheme`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme
- `prefers-reduced-motion`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- `forced-colors`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors
- Radix accessible unstyled primitives: https://www.radix-ui.com/primitives/docs/overview/accessibility
- TanStack Table: https://tanstack.com/table/latest
- TanStack Virtual: https://tanstack.com/virtual/latest

These references provide behavior, accessibility, and architecture guidance. They do not define CPM's final visual identity.

---

## 4. Current-state findings

### 4.1 Fragmented styling architecture

The current source uses multiple large stylesheets created during different phases. Variables, hard-coded colors, component rules, and responsive behavior are distributed across:

- `src/styles.css`
- `src/phases456.css`
- `src/phases789.css`
- `src/phase10.css`

The stylesheets use inconsistent semantic names such as `--muted`, `--text-muted`, `--critical`, `--danger`, and `--accent`. Many Gantt, network, table, and status colors are hard-coded.

**Impact:** theme creation, dark mode, high contrast, visual regression, and future component refinement cannot be implemented reliably without first establishing one token contract.

### 4.2 Viewport responsiveness instead of component adaptability

The current CSS primarily uses global media queries. This allows basic stacking but does not account for:

- Resizable inspectors
- Collapsible sidebars
- Split panes
- Narrow embedded panels on wide screens
- Wide data views on tablets
- Different component states at the same viewport width

**Required direction:** use viewport breakpoints for application-shell transitions and container queries for reusable panels, cards, metric strips, forms, and data views.

### 4.3 Flat workspace navigation

The main workspace exposes twelve horizontally scrolling sections. This provides access, but it does not communicate product hierarchy and becomes harder to scan on small screens.

**Required direction:** group workspaces under Plan, Control, Reports, and Project, with a stable shell and contextual navigation.

### 4.4 Desktop tables used as the mobile strategy

Several grids have large minimum widths and rely on horizontal scrolling. Horizontal scrolling is valid for specialist data views, but mobile users also need purpose-built list, summary, and full-screen editor modes.

### 4.5 Browser-native prompts in product workflows

Renaming, snapshot naming, deletion, and other workflows still use browser prompts or confirmations.

**Required direction:** replace these with accessible CPM dialogs, validation, contextual descriptions, focus containment, Escape handling, and focus restoration.

### 4.6 Incomplete interactive-grid behavior

The activity table uses ARIA grid roles, but a professional spreadsheet experience requires managed focus and complete keyboard behavior.

**Required direction:** either implement a complete interactive grid model or use simpler semantic structures where spreadsheet behavior is not needed.

### 4.7 Theme state is not authoritative

The application source, CSS, and release blocker descriptions do not currently describe one consistent appearance model.

**Required direction:** create one preferences store and one root theme state used by CSS, components, tests, documentation, and release evidence.

---

## 5. Target information architecture

## 5.1 Desktop shell

For expanded workspaces, use four structural regions.

### Global navigation rail

Recommended width:

- Collapsed: 56–64 px
- Expanded: 176–208 px

Primary destinations:

- Home
- Plan
- Control
- Reports
- Project

The current destination must remain visually explicit without relying only on color.

### Context navigation panel

Recommended width: 220–272 px.

#### Plan

- Activities
- WBS
- Gantt
- Network
- Logic
- Calendars

#### Control

- Progress
- Baselines
- BOQ
- Cost and EVM
- Risks
- Resources
- Productivity

#### Reports

- Schedule reports
- Cost reports
- Executive dashboard
- Audit and diagnostics

#### Project

- Project information
- Preferences
- Recovery
- Import and export
- Release evidence

### Main content canvas

The main content area must receive the greatest available width. Dense data views must not be unnecessarily constrained by centered marketing containers.

### Context inspector

Recommended width: 300–380 px.

The inspector should support selected:

- Activity
- BOQ item
- Risk
- Resource
- Calendar
- Relationship
- Report configuration

The inspector must be:

- Collapsible
- Resizable
- Remembered locally
- Converted to a sheet on smaller devices

### Top command bar

The command bar should contain:

- Project switcher
- Current project name
- Status date
- Global search or command palette
- Undo and redo
- Save state
- Offline state
- Notifications
- Theme, density, and appearance entry point
- Help

The current permanent network banner should become a compact status within the shell. Full-width banners should be reserved for actionable events such as failed saving, storage risk, offline transition, or a pending application update.

---

## 5.2 Tablet shell

For medium widths:

- Keep the global rail collapsible.
- Move contextual navigation into a drawer.
- Open the inspector as a right-side sheet.
- Toggle between activity table and Gantt where a split view would be too narrow.
- Move secondary toolbar actions to an overflow menu.
- Use two-column metric layouts where practical.
- Allow near-full-screen dialogs for complex editing.

---

## 5.3 Compact and mobile shell

### Bottom navigation

Use four stable destinations:

- Home
- Plan
- Control
- Reports

A More destination should expose:

- Project
- Recovery
- Preferences
- Audit and diagnostics

### Mobile header

Include:

- Back action or project switcher
- Current screen title
- Save/offline indicator
- Contextual action menu

### Mobile behavior principles

- Do not reproduce the desktop workspace at a smaller scale.
- Use one primary task per screen.
- Open detailed editing in full-screen sheets.
- Use sticky bottom action areas for Save, Apply, Commit, or destructive confirmation.
- Preserve all core capabilities while changing how they are accessed.
- Prefer 44 px touch targets; never fall below WCAG 2.2 target-size requirements.
- Never rely on hover.
- Never make drag the only way to complete an action.

### Mobile activity mode

Replace the ten-column grid with a list that shows:

- Activity ID and name
- WBS
- Planned dates
- Duration
- Float
- Critical status
- Progress

Selecting an item opens a full-screen activity editor.

### Mobile Gantt mode

Provide:

- Full-width timeline
- Sticky activity labels
- Explicit zoom controls
- Jump to status date
- Critical-path filter
- Selected-activity detail sheet
- Accessible non-chart alternative

### Mobile network mode

Default to:

- Selected path
- Predecessor list
- Successor list
- Relationship details

Keep the full graph as an optional pan-and-zoom view.

---

## 6. Design-token architecture

Adopt a three-layer token model.

## 6.1 Primitive tokens

Primitive tokens store raw design values:

```text
color.blue.600
color.slate.950
space.1
space.2
radius.sm
font.size.100
shadow.level.1
duration.fast
```

Normal product components should not consume primitives directly.

## 6.2 Semantic tokens

Semantic tokens describe purpose:

```text
background.canvas
background.surface
background.elevated
background.inset
text.primary
text.secondary
text.tertiary
text.disabled
border.subtle
border.default
border.strong
action.primary.background
action.primary.foreground
action.primary.hover
status.critical
status.warning
status.success
status.information
focus.ring
```

Themes override semantic values.

## 6.3 Component tokens

Component tokens describe specialized UI behavior:

```text
navigation.background
navigation.item.active.background
navigation.item.active.foreground
grid.header.background
grid.row.hover
grid.row.selected
grid.cell.dirty
gantt.activity.normal
gantt.activity.critical
gantt.activity.nearCritical
gantt.baseline
gantt.progress
gantt.float
network.edge.default
network.edge.critical
chart.series.1
chart.series.2
dialog.backdrop
```

## 6.4 DTCG source format

Store design sources as DTCG-compatible JSON files and generate CSS variables and TypeScript metadata.

Suggested structure:

```text
src/design-system/tokens/source/
  core.tokens.json
  semantic.tokens.json
  daylight.tokens.json
  night-shift.tokens.json
  blueprint.tokens.json
  high-contrast.tokens.json
```

Generated output:

```text
src/design-system/tokens/generated/
  tokens.css
  tokens.ts
  theme-manifest.ts
```

A build script should validate:

- Token names
- Types
- Aliases
- Missing semantic values
- Theme completeness
- Duplicate definitions
- Contrast-critical token pairs

---

## 7. Theme and appearance system

## 7.1 First-party themes

| Theme | Purpose |
|---|---|
| System | Follows operating-system preference |
| Daylight | Neutral high-readability light interface |
| Night Shift | Low-glare dark interface for long work sessions |
| Blueprint | Deep navy technical theme with restrained cyan accents |
| High Contrast | Strong contrast and borders for accessibility and difficult field conditions |

The selector should show preview tiles rather than only text names.

## 7.2 Independent appearance controls

Appearance settings should include:

- Theme
- Accent
- Density
- Contrast
- Motion
- Font scale
- Chart palette
- Navigation expansion
- Inspector width

### Accent options

- Cobalt
- Teal
- Amber
- Violet

Accent colors must not replace semantic warning, critical, success, or informational colors.

### Density options

- Compact
- Comfortable
- Touch

Density should control:

- Row height
- Input height
- Button height
- Toolbar spacing
- Panel padding
- Table cell padding

### Motion options

- System
- Full
- Reduced

Reduced motion must disable nonessential animation and use simple state transitions.

### Chart palette options

- Standard
- Color-vision-safe
- Monochrome print

## 7.3 Preferences model

Store personal interface settings separately from project files.

```ts
interface UiPreferences {
  themeMode: 'system' | 'fixed';
  themeId: 'daylight' | 'night-shift' | 'blueprint' | 'high-contrast';
  accentId: 'cobalt' | 'teal' | 'amber' | 'violet';
  density: 'compact' | 'comfortable' | 'touch';
  contrast: 'standard' | 'enhanced';
  motion: 'system' | 'full' | 'reduced';
  chartPalette: 'standard' | 'color-safe' | 'monochrome';
  fontScale: 0.9 | 1 | 1.1 | 1.25;
  navigationCollapsed: boolean;
  inspectorWidth: number;
}
```

Persist this in a dedicated Dexie preferences table. Do not write appearance preferences into `.cpmproj` files.

## 7.4 Root theme state

Apply preferences to the document root:

```html
<html
  data-theme="night-shift"
  data-accent="cobalt"
  data-density="compact"
  data-contrast="standard"
  data-motion="system"
>
```

Add a small pre-React initialization script that loads the stored preference and sets root attributes before the first visual paint. This prevents light/dark theme flashing.

Declare compatible browser color schemes through CSS and document metadata.

---

## 8. Typography and iconography

## 8.1 Typography

Use a restrained system-first family unless a bundled open-source family is intentionally approved.

Recommended roles:

- Display: only for library title or empty onboarding states
- Page title: compact and stable
- Section title
- Body
- Supporting text
- Data label
- Data value
- Monospace identifier

Do not use uppercase for long labels. Reserve uppercase tracking for short metadata labels and status categories.

Numerical data should use tabular numerals where supported.

## 8.2 Icons

Adopt one icon family and define standard sizes:

- 16 px inline
- 20 px standard action
- 24 px navigation

Icons must:

- Support text labels in important navigation
- Never replace unclear domain terminology
- Use `aria-hidden` when decorative
- Receive accessible names when acting as the only label

---

## 9. Component-system strategy

Do not adopt a fully styled external design system.

Use headless accessible behavior and CPM-owned presentation.

Recommended foundations:

- Radix Primitives for dialogs, dropdowns, popovers, tooltips, tabs, sheets, selects, and toast behavior
- TanStack Table for data-grid state
- TanStack Virtual for row and column virtualization
- CPM-owned CSS variables and visual components

## 9.1 Foundation components

- Tokens
- Typography
- Iconography
- Focus styles
- Motion
- Elevation
- Responsive utilities
- Scroll behavior

## 9.2 Primitive components

- Button
- IconButton
- Input
- NumberInput
- Select
- Checkbox
- RadioGroup
- Switch
- Badge
- Tooltip
- Separator
- ScrollArea

## 9.3 Compound components

- Dialog
- ConfirmationDialog
- Drawer
- Sheet
- DropdownMenu
- CommandMenu
- Toast
- Tabs
- SegmentedControl
- DateField
- Field
- FormSection

## 9.4 Data components

- DataGrid
- DataTable
- TreeGrid
- ColumnManager
- FilterBuilder
- SavedViewSelector
- BulkActionBar
- Pagination
- EmptyState
- ErrorState
- LoadingSkeleton

## 9.5 Application patterns

- AppShell
- GlobalNavigation
- ContextSidebar
- CommandBar
- PageHeader
- WorkspaceToolbar
- Inspector
- ResponsiveSplitPane
- StatusBanner
- MetricStrip
- SettingsPanel

---

## 10. Module redesign requirements

## 10.1 Project library

Replace the large hero with:

- Compact application header
- Primary New Project action
- Recent projects
- Search and status filters
- Grid/list view toggle
- Template creation dialog
- Import action
- Storage and recovery status panel
- Designed project action menu

Project cards or rows should show only useful operational information:

- Project name
- Status
- Updated time
- Status date
- Schedule health
- Activity count
- Completion
- Cost status when available

Replace all browser prompts with designed dialogs.

## 10.2 Activity grid

Implement:

- Sticky header
- Sticky ID and name columns
- Column resizing
- Column pinning
- Column visibility manager
- Compact, comfortable, and touch density
- Column groups
- Keyboard cell navigation
- Single-cell, row, and multi-row selection
- Copy and paste
- Fill-down
- Bulk edit
- Inline validation
- Dirty-cell state
- Saved views
- Filter chips
- Global search
- Mobile list alternative

The activity grid is the most important professional workspace and should receive the greatest available width.

## 10.3 Gantt

Create a true split workspace:

- Activity outline on the left
- Timeline on the right
- Resizable divider
- Shared vertical scrolling
- Sticky date scale
- Day, week, month, and quarter zoom
- Baseline toggle
- Progress toggle
- Float toggle
- Relationship toggle
- Critical and near-critical filters
- Jump to status date
- Full-screen mode
- Mobile timeline mode

## 10.4 WBS

Use a tree-table with:

- Expand and collapse
- Indent and outdent
- Reordering
- Non-drag alternatives
- Activity count
- Duration and cost rollups
- Context actions
- Inspector editing
- Mobile hierarchical list

## 10.5 Logic and network

Link two representations:

- Relationship table for precise editing
- Network graph for visualization

Selecting a relationship in either view should highlight it in both.

## 10.6 Calendars

Redesign as:

- Calendar list
- Weekly pattern editor
- Holiday and exception timeline
- Split-shift editor
- Calendar comparison
- Working-day preview

On mobile, use separate step screens rather than one dense form.

## 10.7 Progress and baselines

Use:

- Status-date command area
- Update summary
- Exception queue
- Activity-progress grid
- Baseline variance view
- Out-of-sequence warning panel
- Snapshot history

## 10.8 BOQ and cost control

Use:

- Full-width BOQ table
- Right-side item inspector
- Cost summary drawer
- Markup waterfall
- Allocation warnings
- Revision comparison
- Mobile BOQ list and full-screen editor

## 10.9 Reports and executive dashboard

Avoid a decorative bento dashboard.

Prioritize:

- Compact KPI strip
- Schedule exceptions
- Cost exceptions
- Risk exposure
- Upcoming milestones
- Data completeness
- One or two purposeful charts
- Configurable report list

Every metric should expose:

- Definition
- Status date
- Source
- Calculation method
- Completeness state

---

## 11. CSS and source restructuring

Suggested structure:

```text
src/
  design-system/
    tokens/
      source/
      generated/
    theme/
      ThemeProvider.tsx
      ThemeScript.ts
      themeStorage.ts
    foundations/
      reset.css
      typography.css
      focus.css
      motion.css
    components/
      Button/
      Dialog/
      Field/
      Menu/
      Tabs/
      Sheet/
      DataGrid/
    patterns/
      AppShell/
      CommandBar/
      Inspector/
      PageHeader/
      ResponsiveSplitPane/
```

Use CSS cascade layers:

```css
@layer reset, tokens, base, components, patterns, utilities, overrides;
```

Gradually retire:

- `styles.css`
- `phases456.css`
- `phases789.css`
- `phase10.css`

Add a CI check that rejects new hard-coded colors outside approved token-source, print, and test-fixture files.

---

## 12. Responsive architecture

Use viewport breakpoints for shell changes and container breakpoints for components.

### Viewport ranges

```text
compact    < 600 px
medium     600–1023 px
expanded   1024–1439 px
wide       >= 1440 px
```

### Container ranges

```text
narrow     < 420 px
regular    420–719 px
wide       >= 720 px
```

Examples:

- A metric strip in a narrow inspector should collapse even on a wide desktop.
- A BOQ workspace in a full-width tablet landscape view may retain multiple columns.
- A project card should change actions according to its own width.

---

## 13. Accessibility requirements

The modernization must treat accessibility as a product-quality requirement.

### Required behavior

- Full keyboard navigation
- Visible focus
- Predictable tab order
- Dialog focus containment and restoration
- Escape handling
- Accessible names and descriptions
- Semantic landmarks and headings
- No color-only status communication
- Reduced-motion support
- Forced-colors support
- 200% zoom usability
- Reflow where applicable
- Minimum WCAG 2.2 target sizing
- 44 px preferred touch controls
- Accessible chart alternatives
- Screen-reader-compatible table and grid interactions

### Data-grid keyboard model

The final grid must support an explicit documented model including:

- Arrow-key movement
- Home and End
- Row or column movement modifiers where appropriate
- Enter or F2 for cell editing
- Escape to cancel editing
- Space for selection
- Shift-based range selection where supported
- Copy and paste commands
- Focus recovery after row virtualization

If a view does not need spreadsheet interaction, use a semantic table or list rather than ARIA grid roles.

---

## 14. Implementation phases

## Phase A — UI inventory and visual contract

- Capture every current screen at 360, 390, 768, 1024, 1440, and 1920 px.
- Catalogue all components, states, dialogs, colors, spacing, and responsive failures.
- Document primary user journeys for planner, site engineer, cost engineer, and executive roles.
- Approve grouped navigation architecture.
- Record the visual principles and anti-patterns in an ADR.

**Deliverable:** approved design architecture and inventory.

## Phase B — Token and theme foundation

- Add DTCG-compatible token sources.
- Generate CSS variables and TypeScript metadata.
- Add ThemeProvider and no-flash initialization.
- Add System, Daylight, Night Shift, Blueprint, and High Contrast.
- Add accent, density, contrast, motion, chart palette, and font-scale preferences.
- Create dedicated Dexie preferences persistence.
- Migrate current CSS variables.
- Add token and theme validation tests.

**Acceptance:** normal components no longer depend on raw hard-coded colors.

## Phase C — Component primitives

Build and document:

- Buttons
- Fields
- Selects
- Checkboxes
- Menus
- Dialogs
- Drawers
- Sheets
- Tabs
- Tooltips
- Toasts
- Status indicators
- Empty states
- Error states

Replace browser prompts and ad hoc menus.

## Phase D — Application shell and navigation

- Add global navigation rail.
- Add grouped contextual navigation.
- Add command bar.
- Integrate save, storage, network, update, and notification states.
- Add responsive drawer and bottom navigation.
- Persist navigation state.
- Add command palette entry point.
- Remove the twelve-item flat tab strip.

## Phase E — Project library redesign

- Compact header
- Creation dialog
- Recent projects
- Grid/list toggle
- Project health summaries
- Designed action menu
- Storage and recovery panel
- Responsive cards and rows

## Phase F — Activity grid and schedule workspace

- Introduce headless table state.
- Add row and column virtualization.
- Add sticky and pinned columns.
- Add column manager and saved views.
- Add keyboard spreadsheet interactions.
- Add mobile activity-list mode.
- Build split table/Gantt workspace.
- Add resizable inspector.

This is the highest-priority interaction phase.

## Phase G — Planning and control modules

Apply shared components to:

- WBS
- Logic
- Network
- Calendars
- Baselines
- Progress
- BOQ
- Cost control
- Risks
- Resources
- Productivity

## Phase H — Reports and enterprise

- Rebuild executive summary using compact information hierarchy.
- Standardize report configuration and export surfaces.
- Expose metric definitions and completeness.
- Apply accessible chart tokens.
- Improve audit, diagnostics, and recovery presentation.

## Phase I — Mobile specialization

Validate complete mobile workflows for:

- Create and open project
- Find and edit activity
- Record progress
- Review critical activities
- Review milestones
- Add or update risk
- Review cost and EVM
- Export project
- Restore snapshot

Each workflow must work without requesting desktop mode.

## Phase J — Qualification and final polish

- Cross-browser visual regression
- Keyboard testing
- Screen-reader testing
- 200% zoom testing
- Reflow checks
- Touch-target checks
- Forced-colors testing
- Dark-theme chart checks
- Reduced-motion checks
- Offline theme persistence
- Theme screenshots
- 10,000-activity UI performance validation

---

## 15. Pull-request sequence

Use small, reviewable PRs:

1. `ui/token-and-theme-foundation`
2. `ui/component-primitives`
3. `ui/application-shell-navigation`
4. `ui/project-library-redesign`
5. `ui/activity-grid-and-gantt`
6. `ui/planning-module-redesign`
7. `ui/control-module-redesign`
8. `ui/reports-enterprise-redesign`
9. `ui/mobile-adaptive-workflows`
10. `ui/accessibility-visual-qualification`

Each PR must include:

- Component or domain tests
- Keyboard tests where relevant
- Daylight and Night Shift screenshots
- Compact and desktop screenshots
- Axe validation
- Updated design-system documentation
- No unrelated visual changes

---

## 16. Testing and qualification matrix

### Viewports

- 320 x 568
- 360 x 800
- 390 x 844
- 768 x 1024
- 1024 x 768
- 1280 x 800
- 1440 x 900
- 1920 x 1080

### Browser engines

- Chromium
- Firefox
- WebKit
- Mobile Chromium profile

### Themes

- System light
- System dark
- Daylight
- Night Shift
- Blueprint
- High Contrast

### Density

- Compact
- Comfortable
- Touch

### Accessibility states

- Keyboard only
- Reduced motion
- Forced colors
- 200% zoom
- Screen-reader smoke
- Color-vision-safe chart palette

### Data volumes

- Empty project
- Small sample
- 1,000 activities
- 10,000 activities
- Large BOQ
- Large risk and resource registers
- Long project names and translated labels

---

## 17. Performance requirements

The redesign must not regress the calculation engine or create UI bottlenecks.

Targets:

- No full data-grid re-render for one-cell edits.
- Virtualized activity scrolling remains smooth at 10,000 activities.
- Theme switching completes without page reload.
- Theme switching does not recalculate schedules.
- Opening an inspector does not rerender the full workspace.
- Navigation transition does not reload project data.
- Mobile list mode avoids rendering hidden desktop columns.
- Chart redraws are scoped to changed datasets.
- Visual-regression support does not enter production bundles.

Add React performance profiling to the activity grid and Gantt acceptance evidence.

---

## 18. Migration and rollout strategy

The program should use progressive replacement rather than a full one-time rewrite.

1. Establish tokens and preferences without changing module behavior.
2. Introduce new primitives alongside existing components.
3. Replace shell and navigation.
4. Migrate the project library.
5. Migrate the activity grid and Gantt.
6. Migrate remaining modules using shared patterns.
7. Remove legacy CSS only after all consumers are migrated.
8. Run release qualification after every major phase.

Use feature flags for high-risk workspace replacements when necessary. Preserve project data formats unless a feature genuinely requires schema changes.

---

## 19. Key risks and mitigations

| Risk | Mitigation |
|---|---|
| Large visual rewrite introduces regressions | Progressive PRs, visual snapshots, feature flags |
| Theme tokens miss hard-coded legacy colors | CI scanner plus theme screenshot matrix |
| Data grid replacement affects editing behavior | Interaction contract tests before visual migration |
| Mobile redesign hides capabilities | Task-based mobile acceptance scenarios |
| External component library creates generic appearance | Headless primitives with CPM-owned styles |
| Accessibility regressions from custom grid behavior | WAI pattern tests and keyboard acceptance |
| Dark mode makes charts ambiguous | Component chart tokens and color-safe palettes |
| Preferences leak into project portability | Dedicated local preferences store |
| Shell consumes too much desktop width | Collapsible rail, resizable context panel, full-screen data mode |
| Too many appearance options create inconsistency | Controlled first-party themes and semantic tokens only |

---

## 20. Definition of done

The modernization is complete only when:

- There is no page-level horizontal overflow at 320 px.
- Specialist tables use deliberate internal scrolling or compact alternatives.
- Desktop, tablet, and mobile have purpose-designed navigation.
- Every primary mobile workflow is complete without desktop mode.
- Every major action is keyboard accessible.
- Interactive grids follow a documented keyboard model.
- All normal interactive targets meet WCAG 2.2 requirements.
- Touch-oriented controls target at least 44 px where practical.
- System, Daylight, Night Shift, Blueprint, and High Contrast work without flashing.
- Theme, density, motion, chart palette, and font scale persist offline.
- Charts remain understandable without color alone.
- Normal components contain no unapproved hard-coded theme colors.
- Every screen uses shared buttons, menus, dialogs, fields, data views, and empty states.
- Browser prompts and confirmations are removed.
- Focus remains visible and correctly restored.
- Reduced motion and forced colors are supported.
- The application remains usable at 200% zoom.
- Playwright covers the required viewport, browser, and theme matrix.
- Visual regressions cover all major workspaces.
- No important content is clipped, overlapped, or unreachable.
- 10,000-activity UI performance remains acceptable.
- Release evidence no longer lists theme selection or responsive UI quality as partial requirements.

---

## 21. Final design principle

CPM should look world-class because it is coherent, fast, legible, adaptive, and technically rigorous.

It should not depend on novelty. Its identity should come from disciplined information architecture, construction-specific workflows, excellent data interaction, intentional typography, stable semantic colors, and consistent behavior across desktop and smaller devices.
