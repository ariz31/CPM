import type { ActivityDictionaryEntry } from '../domain/productivity/activityDictionary';
import { normalizeEngineeringText, normalizeEngineeringUnit } from '../domain/units/engineeringUnits';
import { ACTIVITY_DICTIONARY_ROWS_1 } from './activityDictionary/activityDictionaryRows1';
import { ACTIVITY_DICTIONARY_ROWS_2 } from './activityDictionary/activityDictionaryRows2';
import { ACTIVITY_DICTIONARY_ROWS_3 } from './activityDictionary/activityDictionaryRows3';
import { ACTIVITY_DICTIONARY_ROWS_4 } from './activityDictionary/activityDictionaryRows4';

/**
 * Baseline Philippine construction planning library.
 *
 * Each productivity rate is installed output per crew-day at an eight-hour shift.
 * The duration calculator keeps every value editable because location, access,
 * weather, specification, crew skill, safety constraints, equipment, and actual
 * field performance must govern contractual planning.
 */
const rows = [
  ACTIVITY_DICTIONARY_ROWS_1,
  ACTIVITY_DICTIONARY_ROWS_2,
  ACTIVITY_DICTIONARY_ROWS_3,
  ACTIVITY_DICTIONARY_ROWS_4
].join('\n');

export const PHILIPPINE_ACTIVITY_DICTIONARY: ActivityDictionaryEntry[] = rows
  .split('\n')
  .map((row) => row.trim())
  .filter((row) => row.length > 0)
  .map((row) => {
    const [code, category, activity, unit, typicalRate, lowRate, highRate, crew, equipment, assumptions] = row.split('|');
    return {
      code,
      category,
      activity: normalizeEngineeringText(activity),
      unit: normalizeEngineeringUnit(unit),
      typicalRate: Number(typicalRate),
      lowRate: Number(lowRate),
      highRate: Number(highRate),
      crew,
      equipment: normalizeEngineeringText(equipment),
      assumptions: normalizeEngineeringText(assumptions)
    };
  });

export const PHILIPPINE_ACTIVITY_CATEGORIES = [...new Set(PHILIPPINE_ACTIVITY_DICTIONARY.map((item) => item.category))].sort();
