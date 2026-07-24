# Application Implementation Status

## Current release slice

Branch `agent/phase-0-application-foundation` begins executable implementation of the enterprise documentation. It is intentionally a vertical slice rather than the full product.

Implemented in this slice:

- Installable React and TypeScript PWA shell.
- Offline application cache generated during production build.
- IndexedDB project repository through Dexie.
- Local project library with blank and sample project creation.
- Transactional project replacement for duration edits.
- Framework-independent CPM domain types.
- Forward and backward pass for FS, SS, FF, and SF relationships with lag.
- Total float, criticality, project duration, open-end warnings, negative-lag warnings, and cycle validation.
- Worker-isolated calculation with request IDs, timeout, crash recovery, and stale-result protection in the UI.
- Professional responsive project library and schedule workspace.
- Editable durations, calculated activity table, metrics, and early-date timeline preview.
- Automated engine and IndexedDB repository tests.
- GitHub Actions test and production-build gate.

## Written acceptance tests for this slice

| Test ID | Requirement | Acceptance statement | Automation |
|---|---|---|---|
| IMP-AT-001 | PRJ-001 | On first start, the local project library contains exactly one reference project and repeated initialization does not duplicate it. | `projectRepository.test.ts` |
| IMP-AT-002 | PRJ-002 | Creating a blank project stores a unique project with start and finish milestones and makes it available in the library. | `projectRepository.test.ts` |
| IMP-AT-003 | PRJ-004 | Saving a changed project atomically replaces the stored revision and returns the persisted revision. | `projectRepository.test.ts` |
| IMP-AT-004 | CPM-001, CPM-002, CPM-003 | A three-activity FS chain produces correct early dates, late dates, project duration, float, and criticality. | `cpm.test.ts` |
| IMP-AT-005 | LOG-001, LOG-002 | SS, FF, and SF relationships with lag produce their documented start boundaries. | `cpm.test.ts` |
| IMP-AT-006 | LOG-004 | Circular logic prevents authoritative output and returns a validation error. | `cpm.test.ts` |
| IMP-AT-007 | CPM-008, AUD-002 | Identical authoritative inputs produce identical calculated dates, duration, and critical IDs. | `cpm.test.ts` |
| IMP-AT-008 | UI-001 | The workspace presents identifying fields, editable duration, early dates, float, and critical status in a keyboard-focusable table. | Written; component automation scheduled next |
| IMP-AT-009 | UI-002 | The timeline preview positions each activity from calculated early dates and visibly distinguishes critical work and milestones. | Written; component automation scheduled next |
| IMP-AT-010 | SET-003 | All controls use native semantic elements, inputs have accessible labels, focus is visible, status is announced, color is not the only status indicator, and reduced motion is respected. | Written; automated accessibility suite scheduled next |
| IMP-AT-011 | CPM-008 | Calculation executes in a Web Worker, the main thread remains available, failed workers reject pending work, and a 30-second safety timeout prevents indefinite requests. | Written; worker integration automation scheduled next |
| IMP-AT-012 | PRJ-004 | Changing a task duration immediately updates the local model, persists it, and visibly reports saving, saved, or failed state. | Written; browser automation scheduled next |

## Validation performed before publication

- The framework-independent CPM engine compiled under strict TypeScript settings.
- Direct smoke execution verified the FS chain duration and critical path.
- Direct smoke execution verified SS, FF, and SF early-date boundaries.
- All TypeScript and TSX source files passed a syntax-only compiler pass.

The isolated execution environment could not download npm dependencies. GitHub Actions is therefore the authoritative full dependency, Vitest, TypeScript, and Vite production-build validation for this branch.

## Known boundaries

This release slice uses continuous day offsets and does not yet implement work calendars, actual dates, constraints, baselines, free float, BOQ, S-curves, PERT, resources, reports, or portable project files. These boundaries are explicit and must not be represented as complete functionality.

## Next implementation slice

1. Work calendar engine with holidays, shifts, and date arithmetic.
2. WBS and activity create/edit/delete commands with undo and validation.
3. Relationship editor and schedule-health panel.
4. Calendar-aware CPM reference fixtures.
5. Component, accessibility, and browser tests.
6. Portable project file export and staged import.
