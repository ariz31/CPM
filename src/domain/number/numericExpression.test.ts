import { describe, expect, it } from 'vitest';
import { evaluateNumericExpression, formatNumericResult } from './numericExpression';

describe('numeric expression calculator', () => {
  it('evaluates construction quantity arithmetic without using eval', () => {
    expect(evaluateNumericExpression('12 × 3.5')).toBe(42);
    expect(evaluateNumericExpression('(10 + 5) / 3')).toBe(5);
    expect(evaluateNumericExpression('2^3 + 4')).toBe(12);
    expect(evaluateNumericExpression('250 * 8%')).toBe(20);
    expect(evaluateNumericExpression('1,250 + 750')).toBe(2000);
  });

  it('supports unary values and scientific notation', () => {
    expect(evaluateNumericExpression('-2.5 + 1')).toBe(-1.5);
    expect(evaluateNumericExpression('1e3 / 4')).toBe(250);
  });

  it('rejects blank, malformed, unsafe, and non-finite calculations', () => {
    expect(() => evaluateNumericExpression('')).toThrow(/Enter a number/);
    expect(() => evaluateNumericExpression('2 +')).toThrow();
    expect(() => evaluateNumericExpression('10 / 0')).toThrow(/Division by zero/);
    expect(() => evaluateNumericExpression('2 ** 4')).toThrow();
  });

  it('formats results without unnecessary trailing zeroes', () => {
    expect(formatNumericResult(42)).toBe('42');
    expect(formatNumericResult(1.25)).toBe('1.25');
    expect(formatNumericResult(-0)).toBe('0');
  });
});
