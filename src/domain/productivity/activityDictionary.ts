export type ActivityExecutionMode = 'manual' | 'equipment' | 'mixed';

export interface ActivityMethodVariant {
  id: string;
  name: string;
  executionMode: ActivityExecutionMode;
  typicalRate: number;
  lowRate: number;
  highRate: number;
  crew: string;
  equipment: string;
  assumptions: string;
}

export interface ActivityDictionaryEntry {
  code: string;
  category: string;
  activity: string;
  unit: string;
  typicalRate: number;
  lowRate: number;
  highRate: number;
  crew: string;
  equipment: string;
  assumptions: string;
  methodVariants?: ActivityMethodVariant[];
}

export function getActivityMethodVariants(entry: ActivityDictionaryEntry): ActivityMethodVariant[] {
  if (entry.methodVariants?.length) return entry.methodVariants;

  const normalizedEquipment = entry.equipment.toLocaleLowerCase();
  const normalizedActivity = entry.activity.toLocaleLowerCase();
  const baselineMode: ActivityExecutionMode = /hand tool|manual|none/.test(normalizedEquipment)
    ? 'manual'
    : /excavator|backhoe|truck|mixer|crane|loader|roller|grader|breaker|pump|rig|equipment/.test(normalizedEquipment)
      ? 'equipment'
      : 'mixed';
  const baseline: ActivityMethodVariant = {
    id: `${entry.code}-${baselineMode}`,
    name: baselineMode === 'manual' ? 'Manual baseline' : baselineMode === 'mixed' ? 'Mixed crew baseline' : 'Equipment baseline',
    executionMode: baselineMode,
    typicalRate: entry.typicalRate,
    lowRate: entry.lowRate,
    highRate: entry.highRate,
    crew: entry.crew,
    equipment: entry.equipment,
    assumptions: entry.assumptions
  };

  const cubicMetre = entry.unit === 'm³' || entry.unit.toLocaleLowerCase() === 'm3';
  if (!normalizedActivity.includes('excavat') || !cubicMetre) return [baseline];

  const manual: ActivityMethodVariant = baselineMode === 'manual' ? baseline : {
    id: `${entry.code}-manual`,
    name: 'Manual excavation',
    executionMode: 'manual',
    typicalRate: roundRate(Math.max(4, Math.min(14, entry.typicalRate * 0.06))),
    lowRate: roundRate(Math.max(2, Math.min(8, entry.lowRate * 0.05))),
    highRate: roundRate(Math.max(8, Math.min(20, entry.highRate * 0.07))),
    crew: '4–8 laborers with working foreman',
    equipment: 'Hand tools, wheelbarrows, and small dewatering tools as required',
    assumptions: 'Shallow, safe, accessible excavation with short manual handling distance; shoring and disposal are planned separately.'
  };
  const equipment: ActivityMethodVariant = baselineMode === 'equipment' ? baseline : {
    id: `${entry.code}-equipment`,
    name: 'Mechanical excavation',
    executionMode: 'equipment',
    typicalRate: roundRate(Math.max(80, entry.typicalRate * 14)),
    lowRate: roundRate(Math.max(40, entry.lowRate * 10)),
    highRate: roundRate(Math.max(150, entry.highRate * 18)),
    crew: 'Excavator or backhoe operator, banksman, and hauling support',
    equipment: 'Excavator/backhoe with dump trucks where disposal is required',
    assumptions: 'Equipment access, working platform, turning space, and uninterrupted hauling are available.'
  };
  const mixed: ActivityMethodVariant = {
    id: `${entry.code}-mixed`,
    name: 'Mechanical excavation with manual trimming',
    executionMode: 'mixed',
    typicalRate: roundRate(Math.sqrt(manual.typicalRate * equipment.typicalRate)),
    lowRate: roundRate(Math.sqrt(manual.lowRate * equipment.lowRate)),
    highRate: roundRate(Math.sqrt(manual.highRate * equipment.highRate)),
    crew: 'Equipment operator, banksman, 3–5 laborers, and hauling support',
    equipment: 'Excavator/backhoe plus hand tools and dewatering support as required',
    assumptions: 'Machine performs bulk removal while labor completes corners, formation, utilities, and final trimming.'
  };

  return [manual, mixed, equipment];
}

function roundRate(value: number): number {
  return Math.round(value * 10) / 10;
}

export type DurationRounding = 'none' | 'half-day' | 'whole-day';

export interface ActivityDurationInput {
  quantity: number;
  productivityRate: number;
  crewCount: number;
  shiftHours: number;
  efficiencyFactor: number;
  contingencyPercent: number;
  rounding: DurationRounding;
}

export interface ActivityDurationResult {
  effectiveDailyOutput: number;
  rawDuration: number;
  adjustedDuration: number;
  duration: number;
}

function assertPositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${label} must be greater than zero.`);
}

function roundTo(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function calculateActivityDuration(input: ActivityDurationInput): ActivityDurationResult {
  assertPositive(input.quantity, 'Quantity');
  assertPositive(input.productivityRate, 'Productivity rate');
  assertPositive(input.crewCount, 'Crew count');
  assertPositive(input.shiftHours, 'Shift hours');
  assertPositive(input.efficiencyFactor, 'Efficiency factor');
  if (!Number.isFinite(input.contingencyPercent) || input.contingencyPercent < 0) {
    throw new Error('Contingency percent cannot be negative.');
  }

  const shiftFactor = input.shiftHours / 8;
  const effectiveDailyOutput = input.productivityRate * input.crewCount * shiftFactor * input.efficiencyFactor;
  const rawDuration = input.quantity / effectiveDailyOutput;
  const adjustedDuration = rawDuration * (1 + input.contingencyPercent / 100);

  let duration: number;
  if (input.rounding === 'whole-day') duration = Math.ceil(adjustedDuration);
  else if (input.rounding === 'half-day') duration = Math.ceil(adjustedDuration * 2) / 2;
  else duration = roundTo(adjustedDuration);

  return {
    effectiveDailyOutput: roundTo(effectiveDailyOutput),
    rawDuration: roundTo(rawDuration),
    adjustedDuration: roundTo(adjustedDuration),
    duration
  };
}

export function matchesActivityDictionaryEntry(entry: ActivityDictionaryEntry, query: string): boolean {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return true;
  return [
    entry.code,
    entry.category,
    entry.activity,
    entry.unit,
    entry.crew,
    entry.equipment,
    entry.assumptions
  ].some((value) => value.toLocaleLowerCase().includes(normalized));
}
