# Engineering Governance and Delivery

## 1. Purpose

This document defines how CPM is designed, implemented, reviewed, tested, released, and maintained. Enterprise quality requires repeatable engineering controls rather than reliance on individual judgment.

## 2. Repository structure

Recommended top-level structure:

```text
apps/
  web/
packages/
  domain/
  scheduling-engine/
  cost-engine/
  progress-engine/
  risk-engine/
  productivity-engine/
  reporting-engine/
  data-model/
  persistence/
  project-file/
  import-export/
  ui-system/
  test-fixtures/
  benchmark/
docs/
adr/
tests/
  integration/
  e2e/
  accessibility/
  migration/
  security/
  performance/
tools/
```

Package boundaries must be enforced by dependency rules. UI packages may depend on domain contracts; domain and engine packages must not depend on UI frameworks.

## 3. Architecture decisions

Significant decisions require an Architecture Decision Record covering:

- Context and problem.
- Decision drivers.
- Considered options.
- Chosen decision.
- Consequences and risks.
- Security, privacy, accessibility, data, offline, and performance impact.
- Migration and rollback implications.
- Review date where the decision may expire.

Required early ADRs include framework, state management, IndexedDB abstraction, command model, worker protocol, decimal arithmetic, graph representation, file container, charting/rendering, report generation, and testing stack.

## 4. Requirement workflow

1. Create or update a requirement with stable ID.
2. Add or update the Feature Contract.
3. Add written acceptance tests and traceability.
4. Define data, migration, security, accessibility, and performance impact.
5. Implement behind a feature boundary where risk is high.
6. Add automated tests.
7. Validate using reference fixtures and benchmark profiles.
8. Update user and technical documentation.
9. Include release notes when behavior changes.

No implementation-only feature is accepted without specification and tests.

## 5. Branch and pull-request policy

- Protect the default branch.
- Require pull requests for all non-emergency changes.
- Use short-lived branches and keep changes focused.
- Require at least one qualified review; calculation, security, migration, and architecture changes require a domain-qualified reviewer.
- Disallow unresolved review threads.
- Require current base branch and passing checks before merge.
- Prefer squash merge for focused changes with a clear final message.
- Emergency changes require retrospective tests and review immediately after stabilization.

## 6. Pull-request contract

Each pull request states:

- What changed and why.
- Requirement and test IDs.
- User-visible behavior.
- Architecture and data impact.
- Offline and recovery behavior.
- Security and privacy impact.
- Accessibility impact.
- Performance impact and evidence.
- Migration and compatibility impact.
- Tests run and results.
- Screenshots or recordings for UI changes, including relevant states.
- Known limitations and follow-up work.

## 7. Test strategy

### 7.1 Unit tests

Use for pure formulas, graph algorithms, calendar arithmetic, validation, decimal math, reducers, selectors, serializers, and conversion rules.

### 7.2 Property and invariant tests

Use for:

- Schedule graph invariants.
- Topological ordering.
- Calendar add/subtract reversibility where defined.
- Float and relationship bounds.
- Allocation and reconciliation totals.
- Serialization round-trip.
- Idempotent migration and command retry.
- Randomized import parser robustness.

### 7.3 Integration tests

Use real module boundaries for persistence transactions, worker messages, import staging, project-file round-trip, calculation commit, recovery, and report inputs.

### 7.4 End-to-end tests

Cover complete professional workflows, not isolated clicks:

- Create and baseline a schedule.
- Perform weekly update and forecast.
- Build BOQ and allocate cost.
- Generate S-curves and EVM.
- Record productivity and update forecasts.
- Import, validate, repair, export, delete, and restore.
- Recover from interrupted writes and damaged derived indexes.

### 7.5 Accessibility tests

Combine automated rules with manual keyboard, screen-reader, zoom, high-contrast, reduced-motion, and chart-alternative validation.

### 7.6 Performance tests

Run stable benchmark profiles, compare against budgets and previous releases, and retain traces for regression investigation.

### 7.7 Security tests

Include malicious files, fuzzing, resource exhaustion, XSS corpus, formula injection, dependency scanning, secrets scanning, and future authorization matrices.

### 7.8 Migration tests

Every supported source version migrates directly through the production path to the current version and matches a canonical fixture.

## 8. Coverage policy

Coverage percentage is a diagnostic, not proof. Minimum expectations:

- 100% written acceptance-test mapping for mandatory requirements.
- 100% branch coverage for critical formula and migration decision paths unless an approved exception documents unreachable defensive code.
- High mutation score for scheduling, cost, PERT, EVM, file integrity, and migration modules.
- End-to-end coverage of every release-critical workflow.
- No untested data-loss, authorization, or destructive-operation branch.

A high global percentage cannot compensate for missing critical-path tests.

## 9. Required CI checks

### Fast pull-request checks

- Formatting and linting.
- Type checking with strict settings.
- Unit and property tests.
- Requirement/test traceability.
- Dependency-boundary validation.
- Documentation links and identifier validation.
- Secret and dependency scanning.
- Build and service-worker validation.
- Targeted integration tests based on changed packages.

### Full pull-request or merge-queue checks

- Complete integration suite.
- Browser end-to-end suite.
- Accessibility suite.
- File/import malicious corpus.
- Migration matrix.
- Reference calculation fixtures.
- Standard performance smoke suite.
- Production build analysis and bundle budgets.

### Release-candidate checks

- Full browser/device compatibility matrix.
- P0-P4 benchmark suite.
- Soak and recovery tests.
- SBOM and provenance generation.
- Offline installation, update, and rollback.
- Report rendering comparison.
- Complete security scan and accepted-risk report.

## 10. Static quality rules

- Strict TypeScript; avoid untyped boundary data.
- Runtime validation at all external boundaries.
- Exhaustive handling of domain discriminated unions.
- No floating promises or swallowed errors.
- Stable error codes.
- No direct storage writes outside persistence adapters.
- No authoritative calculation in UI components.
- No unbounded lists, loops, recursion, queues, or caches on untrusted data.
- No hidden network call in core workflows.
- No date arithmetic through implicit local timezone conversion.
- No financial arithmetic without declared precision and rounding.

## 11. Dependency governance

New dependencies require:

- Clear need and alternatives considered.
- Maintenance and security assessment.
- License compatibility.
- Bundle and runtime cost.
- Browser support.
- Worker or main-thread implications.
- Data and network behavior.
- Removal strategy.

Large frameworks or charting libraries must be benchmarked against representative schedules before adoption.

## 12. Feature flags

- Flags are typed, documented, and default-safe.
- Flags do not bypass validation, authorization, migration, or security controls.
- Flag state is included in diagnostics and release evidence.
- Temporary flags have owners and removal dates.
- Data written under a flag remains readable when the flag is disabled or requires a documented migration.

## 13. Release management

Use semantic versioning for the application and independent versions for schemas and file formats.

Release categories:

- Patch: compatible defect and security fixes.
- Minor: backward-compatible functionality.
- Major: intentionally incompatible application behavior or support policy.

Schema/file-format compatibility is not inferred only from application semantic version.

## 14. Release gates

A release cannot ship with:

- Unmapped mandatory requirements.
- Failing reference calculations.
- Unresolved critical/high security findings.
- Known silent data-loss path.
- Unsupported migration from an advertised version.
- Accessibility blockers in core workflows.
- Hard performance-budget failure.
- Broken offline installation or reopening.
- Missing SBOM, provenance, release notes, or recovery evidence.

## 15. Quality exception process

An exception requires:

- Exact failed control or budget.
- User and enterprise impact.
- Root cause.
- Compensating control.
- Scope and affected versions.
- Owner and accountable approver.
- Expiration date or release.
- Tracking issue and verification plan.

Exceptions may not waive critical data-loss, cross-tenant access, remote code execution, or unrecoverable corruption risks.

## 16. Documentation governance

- Requirement IDs are never silently repurposed.
- Formula changes include mathematical rationale and updated reference examples.
- Architecture changes update ADRs and diagrams.
- Schema changes update the data dictionary, migration matrix, and file-format notes.
- UI changes update workflow and accessibility documentation.
- New errors update the error-code catalog.
- New benchmarks update workload generators and budgets.
- Documentation is reviewed as production code.

## 17. Ownership

Define maintainership for:

- Scheduling and calendar engine.
- Cost/BOQ/EVM engine.
- Productivity/resources.
- Persistence and migrations.
- File formats and interoperability.
- UI design system and accessibility.
- Security and privacy.
- Performance and benchmarking.
- Release and incident operations.

Critical modules require at least two capable maintainers before enterprise production use.

## 18. Engineering test catalog

| Test ID | Scenario | Pass condition |
|---|---|---|
| ENG-AT-001 | Add requirement without test | CI rejects change |
| ENG-AT-002 | Add UI storage write outside adapter | Boundary/static rule rejects change |
| ENG-AT-003 | Change formula without fixture update | Reference/traceability checks reject change |
| ENG-AT-004 | Add dependency violating policy | Review check reports license, security, or size issue |
| ENG-AT-005 | Add schema without migration | CI rejects unsupported schema change |
| ENG-AT-006 | Skip mandatory release test | Release evidence is incomplete and cannot approve |
| ENG-AT-007 | Performance regression | Budget comparison fails or requires approved exception |
| ENG-AT-008 | Accessibility regression | Automated/manual gate blocks release-critical workflow |
| ENG-AT-009 | Security-sensitive feature without threat update | PR checklist and review gate reject change |
| ENG-AT-010 | Stale feature flag | Expiration check reports owner and required removal |

## 19. Continuous improvement

After releases and incidents, update:

- Benchmark datasets.
- Regression corpus.
- Threat model.
- Error catalog.
- Support playbooks.
- Test coverage.
- Performance budgets where evidence justifies change.
- Architecture decisions.

The goal is not merely to pass gates once; it is to keep the product correct, fast, secure, and supportable as scope grows.