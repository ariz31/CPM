# UI Modernization Phases I–J Release Notes

## Release candidate

- Application: `1.0.0-rc.4`
- Project Schema: Version 4
- IndexedDB: Version 6
- Portable Envelope: Version 1
- CPM engine: `0.3.0-calendar-cpm`
- Schema migration: none
- New runtime dependency: none

## Phase I — Mobile specialization

Phase I closes the remaining compact-device workflow gap with one mobile operations sheet that stays available above the project bottom navigation.

Delivered mobile workflows:

- Review critical and near-critical activity counts.
- Review upcoming, late, complete, and unscheduled milestones.
- Review duration-weighted progress, BAC, CPI, SPI, allocation completeness, open risks, and expected risk exposure.
- Find activities by ID, code, or name and edit activity name, duration, and notes.
- Record percent complete, remaining duration, actual dates, and field notes.
- Create a new risk or update an existing risk, including probability, cost and schedule impact, owner, response, status, and linked activity.
- Create named offline snapshots.
- Restore a snapshot after an automatic recovery snapshot is created.
- Export a checksummed `.cpmproj` portable backup.
- Complete the workflows without requesting desktop mode.

The mobile operations layer writes through the existing authoritative command, validation, IndexedDB, journal, snapshot, project-file, schedule, cost, and risk engines. It does not maintain a parallel mobile data model.

## Phase J — Qualification and final polish

Phase J expands the release evidence contract beyond basic smoke coverage.

Delivered qualification controls:

- Cross-browser Chromium, Firefox, WebKit, and mobile-Chromium execution.
- Automated WCAG 2.0, 2.1, and 2.2 A/AA blocking-violation checks.
- Keyboard focus, focused-view Escape restoration, and focus return.
- 200% text-resize reflow evidence.
- Compact viewport horizontal-overflow checks for every mobile workflow.
- Preferred 44-pixel touch-target measurements for primary compact controls.
- Forced-colors operability evidence.
- Reduced-motion behavior evidence.
- Daylight and Night Shift screenshot artifacts.
- Offline installed-shell and active-project reload in Chromium.
- Deterministic 10,000-row virtual-window qualification at the start, middle, and end of the activity dataset.
- Zero high/critical dependency audit, CycloneDX SBOM, build digest, provenance, and retained release-evidence package through the existing Release Qualification workflow.

## Acceptance tests

| Test ID | Gate | Acceptance statement | Automation |
|---|---|---|---|
| UII-AT-001 | Mobile overview | Compact users can review criticality, milestones, progress, EVM, and risk exposure. | `mobileWorkflow.test.ts`, `mobile-phase-i.spec.ts` |
| UII-AT-002 | Mobile activity | Activity search and editing persist through the authoritative project journal. | `mobile-phase-i.spec.ts` |
| UII-AT-003 | Mobile progress | Field progress updates preserve existing progress metadata and remain immutable before persistence. | `mobileWorkflow.test.ts`, `mobile-phase-i.spec.ts` |
| UII-AT-004 | Mobile risk | Risks are bounded, linked only to valid activities, and can be created or updated. | `mobileWorkflow.test.ts`, `mobile-phase-i.spec.ts` |
| UII-AT-005 | Mobile recovery | Named snapshot, recovery restore, and portable export work without desktop mode. | `mobile-phase-i.spec.ts` |
| UIJ-AT-001 | Accessibility | Representative library, workspace, and mobile workflow surfaces have no serious/critical automated axe findings. | `release-smoke.spec.ts`, `mobile-phase-i.spec.ts` |
| UIJ-AT-002 | Reflow | 200% text resize and compact workflows do not create page-level horizontal overflow. | `qualification-phase-j.spec.ts`, `mobile-phase-i.spec.ts` |
| UIJ-AT-003 | Input access | Keyboard focus restoration and 44-pixel preferred touch targets are verified. | `qualification-phase-j.spec.ts` |
| UIJ-AT-004 | User preferences | Reduced motion, forced colors, Daylight, and Night Shift remain operable and produce evidence. | `qualification-phase-j.spec.ts` |
| UIJ-AT-005 | Large UI | A 10,000-row schedule renders a bounded virtual window with correct spacer geometry. | `uiQualification.test.ts` |
| UIJ-AT-006 | Offline | The installed shell and active project reload offline in Chromium. | `release-smoke.spec.ts` |

## Release boundary

Completing the UI modernization roadmap does not automatically promote the application to qualified Version 1. The existing requirement-coverage gate still blocks `1.0.0` while mapped mandatory functional requirements remain partial. Phase I and Phase J remove the mobile-specialization and UI-qualification roadmap gaps; they do not waive functional release blockers.
