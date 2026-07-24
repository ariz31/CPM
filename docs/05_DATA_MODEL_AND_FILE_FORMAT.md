# Data Model and Project File Format

## 1. Design goals

The data model must support integrated project controls without forcing users to duplicate data across schedule, BOQ, progress, and reporting modules. It must be stable enough for long-lived project files, migration, optional collaboration, and audit history.

Key rules:

- Internal IDs are immutable UUIDs or equivalent collision-resistant identifiers.
- User-facing codes such as activity IDs and BOQ item numbers are editable and separately validated.
- References use internal IDs, never descriptions or row numbers.
- Authoritative inputs and derived outputs are separate.
- Records include schema version and audit timestamps.
- Deletion behavior is explicit for every relationship.
- Portable files contain a manifest and checksums.

## 2. Common value objects

### Entity metadata

```ts
interface EntityMetadata {
  id: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  revision: number;
}
```

### Decimal value

```ts
interface DecimalValue {
  value: string;
  scale?: number;
}
```

Decimal numbers should serialize as strings to avoid precision loss between runtimes.

### Date and working time

```ts
interface LocalProjectDateTime {
  local: string;
  timezone: string;
}

interface DurationValue {
  workMinutes: number;
  displayUnit: "minute" | "hour" | "day" | "week";
}
```

Date-only project values may be stored separately from instants. The exact representation must be selected in an ADR.

### Unit reference

```ts
interface UnitRef {
  code: string;
  dimension: "length" | "area" | "volume" | "mass" | "time" | "count" | "currency" | "custom";
  label: string;
}
```

## 3. Project root

```ts
interface Project {
  id: string;
  code?: string;
  title: string;
  description?: string;
  organization?: string;
  owner?: string;
  contractor?: string;
  consultant?: string;
  location?: string;
  contractNumber?: string;
  timezone: string;
  currency: string;
  defaultCalendarId: string;
  plannedStart: string;
  requiredFinish?: string;
  statusDate?: string;
  activeBaselineId?: string;
  projectRevision: number;
  schemaVersion: number;
  calculationSettings: CalculationSettings;
  createdAt: string;
  updatedAt: string;
}
```

## 4. Calendars

```ts
interface WorkCalendar extends EntityMetadata {
  code: string;
  name: string;
  timezone: string;
  standardMinutesPerDay: number;
  week: Record<Weekday, WorkInterval[]>;
  exceptions: CalendarException[];
}

interface WorkInterval {
  startMinute: number;
  endMinute: number;
}

interface CalendarException {
  id: string;
  startDate: string;
  endDate: string;
  type: "nonworking" | "workingOverride";
  intervals?: WorkInterval[];
  name?: string;
}
```

Overlapping intervals and contradictory exceptions are invalid.

## 5. WBS and activity codes

```ts
interface WbsNode extends EntityMetadata {
  parentId?: string;
  code: string;
  name: string;
  sortOrder: string;
  notes?: string;
}

interface CodeDictionary extends EntityMetadata {
  name: string;
  values: CodeValue[];
}

interface CodeValue {
  id: string;
  code: string;
  label: string;
  parentId?: string;
}
```

Use fractional or lexicographic ordering values so reordering does not require rewriting every row.

## 6. Activities and relationships

```ts
interface Activity extends EntityMetadata {
  activityId: string;
  name: string;
  wbsId: string;
  type: "task" | "startMilestone" | "finishMilestone" | "summary" | "levelOfEffort";
  calendarId: string;
  originalDuration: DurationValue;
  remainingDuration: DurationValue;
  progressMethod: ProgressMethod;
  physicalPercentComplete?: string;
  actualStart?: string;
  actualFinish?: string;
  constraint?: ActivityConstraint;
  deadline?: string;
  pert?: PertEstimate;
  responsiblePartyId?: string;
  locationCodeId?: string;
  codeValueIds: string[];
  tags: string[];
  notes?: string;
}

interface Relationship extends EntityMetadata {
  predecessorActivityId: string;
  successorActivityId: string;
  type: "FS" | "SS" | "FF" | "SF";
  lagWorkMinutes: number;
  lagCalendarRule?: string;
  reason?: string;
}
```

`summary` activities are derived from descendants and should not participate in logic unless a later design explicitly supports it.

## 7. Constraints and progress

```ts
interface ActivityConstraint {
  type:
    | "ASAP"
    | "ALAP"
    | "SNET"
    | "SNLT"
    | "FNET"
    | "FNLT"
    | "MSO"
    | "MFO";
  date?: string;
  reason?: string;
}

interface ProgressEntry extends EntityMetadata {
  activityId: string;
  dataDate: string;
  actualStart?: string;
  actualFinish?: string;
  remainingDurationMinutes?: number;
  physicalPercentComplete?: string;
  quantityCompleted?: DecimalValue;
  acceptedQuantity?: DecimalValue;
  note?: string;
  source: "manual" | "import" | "productivity" | "integration";
}
```

Progress entries should be append-oriented. The activity's current progress fields are a projection of accepted entries, not the only historical record.

## 8. Baselines

```ts
interface Baseline extends EntityMetadata {
  name: string;
  description?: string;
  approvedAt?: string;
  approvedBy?: string;
  sourceProjectRevision: number;
  status: "draft" | "approved" | "superseded";
  totals: BaselineTotals;
}

interface BaselineActivitySnapshot {
  baselineId: string;
  activityId: string;
  activityCode: string;
  name: string;
  wbsId: string;
  originalDurationMinutes: number;
  earlyStart: string;
  earlyFinish: string;
  lateStart?: string;
  lateFinish?: string;
  totalFloatMinutes?: number;
  budget?: DecimalValue;
  plannedQuantity?: DecimalValue;
}
```

Baseline data must remain readable even if the live entity is later renamed or deleted.

## 9. BOQ and cost model

```ts
interface BoqSection extends EntityMetadata {
  parentId?: string;
  code: string;
  name: string;
  sortOrder: string;
}

interface BoqItem extends EntityMetadata {
  sectionId: string;
  itemCode: string;
  description: string;
  itemType: "measured" | "lumpSum" | "provisional" | "alternate" | "note";
  quantity?: DecimalValue;
  unit?: UnitRef;
  wasteFactor?: DecimalValue;
  directUnitCost?: DecimalValue;
  sellingUnitRate?: DecimalValue;
  amount?: DecimalValue;
  costCodeId?: string;
  locationCodeId?: string;
  notes?: string;
}

interface ResourceRate extends EntityMetadata {
  resourceId: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  rate: DecimalValue;
  currency: string;
  basisUnit: UnitRef;
}

interface BoqResourceComponent extends EntityMetadata {
  boqItemId: string;
  resourceId: string;
  category: "material" | "labor" | "equipment" | "subcontract" | "other";
  consumption: DecimalValue;
  consumptionUnit: UnitRef;
  wasteFactor?: DecimalValue;
  rateId?: string;
}

interface MarkupLayer extends EntityMetadata {
  name: string;
  sequence: number;
  type: "percentage" | "fixed";
  rateOrAmount: DecimalValue;
  basis: string;
  taxable?: boolean;
}
```

## 10. Activity-cost allocation

```ts
interface CostAllocation extends EntityMetadata {
  boqItemId: string;
  activityId: string;
  weight: DecimalValue;
  distribution: DistributionProfile;
  costAccountId?: string;
}

interface DistributionProfile {
  type: "uniform" | "frontLoaded" | "backLoaded" | "bell" | "custom" | "milestone";
  parameters?: Record<string, string | number | boolean>;
  customWeights?: Array<{ offset: number; weight: string }>;
  basis: "workingTime" | "elapsedTime";
  version: number;
}
```

Allocation validation must group by BOQ item and verify total weight.

## 11. Resources and assignments

```ts
interface Resource extends EntityMetadata {
  code: string;
  name: string;
  category: "labor" | "equipment" | "material" | "cost" | "crew";
  unit: UnitRef;
  calendarId?: string;
  availability?: DecimalValue;
  defaultRateId?: string;
  parentResourceId?: string;
  notes?: string;
}

interface ResourceAssignment extends EntityMetadata {
  activityId: string;
  resourceId: string;
  plannedUnits?: DecimalValue;
  unitsPerTime?: DecimalValue;
  plannedHours?: DecimalValue;
  plannedCost?: DecimalValue;
  distribution: DistributionProfile;
}
```

Crew resources may reference component resources through a separate composition table.

## 12. Productivity

```ts
interface ProductivityEntry extends EntityMetadata {
  activityId: string;
  date: string;
  shift?: string;
  locationCodeId?: string;
  quantity: DecimalValue;
  quantityUnit: UnitRef;
  laborHours?: DecimalValue;
  equipmentHours?: DecimalValue;
  productiveHours?: DecimalValue;
  availableHours?: DecimalValue;
  downtimeHours?: DecimalValue;
  laborCost?: DecimalValue;
  equipmentCost?: DecimalValue;
  delayReasonCodeId?: string;
  weather?: string;
  remarks?: string;
  attachmentIds: string[];
}
```

Entries need acceptance status if field quantities require review before affecting authoritative progress.

## 13. Actual cost and cash flow

```ts
interface ActualCostEntry extends EntityMetadata {
  date: string;
  amount: DecimalValue;
  currency: string;
  costAccountId?: string;
  activityId?: string;
  boqItemId?: string;
  category: "labor" | "material" | "equipment" | "subcontract" | "overhead" | "other";
  reference?: string;
  note?: string;
}

interface CashFlowRule extends EntityMetadata {
  type: "retention" | "advance" | "advanceRecovery" | "paymentLag" | "tax" | "deduction" | "custom";
  parameters: Record<string, string | number | boolean>;
  sequence: number;
}
```

## 14. PERT and risk

```ts
interface PertEstimate {
  optimisticMinutes: number;
  mostLikelyMinutes: number;
  pessimisticMinutes: number;
  useExpectedDurationForSchedule: boolean;
}

interface Risk extends EntityMetadata {
  riskId: string;
  title: string;
  description?: string;
  category?: string;
  probability: DecimalValue;
  scheduleImpactMinutes?: number;
  costImpact?: DecimalValue;
  owner?: string;
  status: "open" | "mitigating" | "accepted" | "closed";
  response?: string;
  trigger?: string;
  linkedActivityIds: string[];
  linkedBoqItemIds: string[];
  residualProbability?: DecimalValue;
  residualScheduleImpactMinutes?: number;
  residualCostImpact?: DecimalValue;
}
```

Future Monte Carlo inputs should be stored separately from deterministic PERT values.

## 15. Calculation results

```ts
interface CalculationRun extends EntityMetadata {
  engineVersion: string;
  projectRevision: number;
  settingsHash: string;
  statusDate?: string;
  startedAt: string;
  completedAt?: string;
  state: "queued" | "running" | "completed" | "cancelled" | "failed";
  warningCount: number;
  errorCode?: string;
}

interface ActivityScheduleResult {
  runId: string;
  activityId: string;
  earlyStart?: string;
  earlyFinish?: string;
  lateStart?: string;
  lateFinish?: string;
  totalFloatMinutes?: number;
  freeFloatMinutes?: number;
  isCritical: boolean;
  isNearCritical: boolean;
  isCompleted: boolean;
  drivingRelationshipIds: string[];
  warningCodes: string[];
}
```

S-curve and report datasets should use compact period arrays rather than storing one row per pixel or chart point when avoidable.

## 16. Audit events

```ts
interface AuditEvent {
  id: string;
  projectId: string;
  projectRevision: number;
  timestamp: string;
  commandType: string;
  commandId: string;
  actorId?: string;
  deviceId?: string;
  entityRefs: Array<{ type: string; id: string }>;
  summary: string;
  reason?: string;
  beforeHash?: string;
  afterHash?: string;
}
```

Sensitive full before/after payloads should not be duplicated indefinitely unless snapshot retention is deliberately enabled.

## 17. Attachment model

```ts
interface Attachment extends EntityMetadata {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  contentHash: string;
  storageKey: string;
  linkedEntityRefs: Array<{ type: string; id: string }>;
  description?: string;
}
```

Attachment limits, allowed MIME types, image dimension checks, and export inclusion must be configurable.

## 18. Portable `.cpmproj` format

### 18.1 Container

Use a ZIP-compatible container with the extension `.cpmproj`. The file should be readable by standard archive tools for recovery, but normal users interact with it as one project file.

Recommended layout:

```text
project.cpmproj
  manifest.json
  data/
    project.json
    calendars.json
    wbs.json
    activities.json
    relationships.json
    baselines.json
    boq.json
    resources.json
    assignments.json
    progress.json
    actual-costs.json
    productivity.json
    risks.json
    saved-views.json
    audit.json
  attachments/
    <content-hash>.<extension>
  snapshots/
    <optional snapshot files>
  checksums.json
  preview/
    summary.json
    thumbnail.png
```

Large datasets may use JSON Lines or a documented columnar representation in later versions. Human-readable JSON is preferred initially.

### 18.2 Manifest

```json
{
  "format": "CPM Project Bundle",
  "formatVersion": 1,
  "schemaVersion": 1,
  "projectId": "...",
  "projectTitle": "Sample Project",
  "createdAt": "...",
  "exportedAt": "...",
  "applicationVersion": "...",
  "engineVersion": "...",
  "timezone": "Asia/Manila",
  "currency": "PHP",
  "includes": {
    "attachments": true,
    "audit": true,
    "snapshots": false
  },
  "entrypoints": {
    "project": "data/project.json"
  }
}
```

### 18.3 Checksums

`checksums.json` maps each included path to a cryptographic hash. The manifest itself may be included through a root hash or signed manifest in future versions. Checksums detect corruption; they do not provide authenticity unless a signature is added.

### 18.4 Import compatibility

- Same schema version: import directly after validation.
- Older supported schema: migrate in memory, show migration summary, then import.
- Newer schema: refuse authoritative import unless a backward-compatible reader is available; allow safe metadata preview.
- Unknown required feature: stop and explain which capability is unsupported.

### 18.5 Export modes

- Full project with attachments and audit
- Lightweight project without attachments
- Template without actuals or confidential rates
- Snapshot archive
- Diagnostic export with redacted project content

## 19. Invariants

The validation engine must enforce at least:

- Unique user-facing activity IDs among active activities
- No relationship self-links
- No duplicate identical relationship
- No orphan WBS, calendar, BOQ, resource, or activity references
- Actual finish cannot exist without actual start
- Actual finish cannot precede actual start
- Completed activity has zero remaining duration
- Baseline is immutable after approval
- BOQ allocation weights reconcile within tolerance
- Weighted progress steps reconcile within tolerance
- Decimal values parse under invariant culture
- Calendar intervals do not overlap and have positive duration
- Project file checksums match
- Every entity belongs to the project declared in the manifest

## 20. Migration policy

Every schema release must include:

- Incremented schema version
- Forward migration function
- Fixture from the previous version
- Rollback or backup strategy
- Data-loss assessment
- Migration report wording
- Project-file compatibility test
- IndexedDB upgrade test under interruption

Migrations must be idempotent where practical and never silently drop unknown fields without a documented policy.
