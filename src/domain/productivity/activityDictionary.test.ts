import { describe, expect, it } from 'vitest';
import { PHILIPPINE_ACTIVITY_CATEGORIES, PHILIPPINE_ACTIVITY_DICTIONARY } from '../../data/philippineActivityDictionary';
import { calculateActivityDuration, matchesActivityDictionaryEntry } from './activityDictionary';

describe('Philippine activity dictionary', () => {
  it('contains a broad, unique, and valid construction activity library', () => {
    expect(PHILIPPINE_ACTIVITY_DICTIONARY.length).toBeGreaterThanOrEqual(200);
    expect(new Set(PHILIPPINE_ACTIVITY_DICTIONARY.map((item) => item.code)).size).toBe(PHILIPPINE_ACTIVITY_DICTIONARY.length);
    expect(PHILIPPINE_ACTIVITY_CATEGORIES).toEqual(expect.arrayContaining([
      'Preconstruction & permits',
      'Survey & investigation',
      'Earthworks & site development',
      'Structural concrete',
      'Electrical',
      'Testing & commissioning',
      'Handover & closeout'
    ]));

    for (const item of PHILIPPINE_ACTIVITY_DICTIONARY) {
      expect(item.activity.trim()).not.toBe('');
      expect(item.unit.trim()).not.toBe('');
      expect(item.lowRate).toBeGreaterThan(0);
      expect(item.typicalRate).toBeGreaterThanOrEqual(item.lowRate);
      expect(item.highRate).toBeGreaterThanOrEqual(item.typicalRate);
    }
  });

  it('includes permit, geotechnical, building, road, bridge, and closeout work', () => {
    const names = PHILIPPINE_ACTIVITY_DICTIONARY.map((item) => item.activity.toLowerCase());
    expect(names.some((name) => name.includes('building permit'))).toBe(true);
    expect(names.some((name) => name.includes('geotechnical borehole'))).toBe(true);
    expect(names.some((name) => name.includes('beam and slab concrete'))).toBe(true);
    expect(names.some((name) => name.includes('asphalt concrete paving'))).toBe(true);
    expect(names.some((name) => name.includes('precast girder erection'))).toBe(true);
    expect(names.some((name) => name.includes('turnover documentation'))).toBe(true);
  });

  it('searches across code, work category, activity, crew, equipment, and assumptions', () => {
    const entry = PHILIPPINE_ACTIVITY_DICTIONARY.find((item) => item.code === 'SUR-006');
    expect(entry).toBeDefined();
    expect(matchesActivityDictionaryEntry(entry!, 'SUR-006')).toBe(true);
    expect(matchesActivityDictionaryEntry(entry!, 'rotary drilling')).toBe(true);
    expect(matchesActivityDictionaryEntry(entry!, 'geotechnical')).toBe(true);
    expect(matchesActivityDictionaryEntry(entry!, 'curtain wall')).toBe(false);
  });
});

describe('productivity-based duration calculation', () => {
  it('scales output for crews, shift hours, efficiency, and contingency', () => {
    const result = calculateActivityDuration({
      quantity: 1000,
      productivityRate: 100,
      crewCount: 2,
      shiftHours: 10,
      efficiencyFactor: 0.8,
      contingencyPercent: 10,
      rounding: 'none'
    });

    expect(result.effectiveDailyOutput).toBe(200);
    expect(result.rawDuration).toBe(5);
    expect(result.adjustedDuration).toBe(5.5);
    expect(result.duration).toBe(5.5);
  });

  it('rounds conservatively to half-day or whole-day schedule durations', () => {
    const base = {
      quantity: 101,
      productivityRate: 20,
      crewCount: 1,
      shiftHours: 8,
      efficiencyFactor: 1,
      contingencyPercent: 0
    };
    expect(calculateActivityDuration({ ...base, rounding: 'half-day' }).duration).toBe(5.5);
    expect(calculateActivityDuration({ ...base, rounding: 'whole-day' }).duration).toBe(6);
  });

  it('rejects unusable productivity inputs', () => {
    expect(() => calculateActivityDuration({
      quantity: 0,
      productivityRate: 10,
      crewCount: 1,
      shiftHours: 8,
      efficiencyFactor: 1,
      contingencyPercent: 0,
      rounding: 'none'
    })).toThrow(/Quantity/);
  });
});
