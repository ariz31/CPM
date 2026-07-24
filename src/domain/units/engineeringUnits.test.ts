import { describe, expect, it } from 'vitest';
import { containsAsciiEngineeringExponent, normalizeEngineeringText, normalizeEngineeringUnit } from './engineeringUnits';

describe('engineering unit normalization', () => {
  it('uses Unicode superscripts for area and volume units', () => {
    expect(normalizeEngineeringUnit('m2')).toBe('m²');
    expect(normalizeEngineeringUnit('m^3')).toBe('m³');
    expect(normalizeEngineeringUnit(' mm2 / day ')).toBe('mm² / day');
    expect(normalizeEngineeringText('Cable above 35 mm2')).toBe('Cable above 35 mm²');
    expect(normalizeEngineeringText('45 m3 concrete')).toBe('45 m³ concrete');
  });

  it('normalizes common square and cubic metre aliases', () => {
    expect(normalizeEngineeringUnit('sqm')).toBe('m²');
    expect(normalizeEngineeringUnit('sq. m')).toBe('m²');
    expect(normalizeEngineeringUnit('cubic metres')).toBe('m³');
  });

  it('does not rewrite unrelated numbers', () => {
    expect(normalizeEngineeringText('100 mm thick')).toBe('100 mm thick');
    expect(normalizeEngineeringText('Level 2')).toBe('Level 2');
  });

  it('detects legacy ASCII engineering exponents', () => {
    expect(containsAsciiEngineeringExponent('m2')).toBe(true);
    expect(containsAsciiEngineeringExponent('35 mm2 cable')).toBe(true);
    expect(containsAsciiEngineeringExponent('m²')).toBe(false);
  });
});
