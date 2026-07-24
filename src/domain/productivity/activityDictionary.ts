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
