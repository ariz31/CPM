import { describe, expect, it } from 'vitest';
import { calculateVirtualWindow, findUndersizedTouchTargets, qualifiesTenThousandRowViewport } from './uiQualification';

describe('UI qualification helpers', () => {
  it('bounds a 10,000-row viewport at the start, middle, and end', () => {
    expect(qualifiesTenThousandRowViewport(0)).toBe(true);
    expect(qualifiesTenThousandRowViewport(230_000)).toBe(true);
    expect(qualifiesTenThousandRowViewport(459_000)).toBe(true);
  });

  it('preserves spacer height while keeping rendered rows bounded', () => {
    const result = calculateVirtualWindow({ totalRows: 10_000, scrollTop: 230_000, rowHeight: 46, viewportHeight: 540, overscan: 7 });
    expect(result.renderedRows).toBeLessThanOrEqual(27);
    expect(result.topSpacer + result.renderedRows * 46 + result.bottomSpacer).toBe(460_000);
  });

  it('reports controls that miss the 44-pixel preferred touch target', () => {
    expect(findUndersizedTouchTargets([
      { name: 'good', width: 44, height: 44 },
      { name: 'short', width: 60, height: 32 }
    ])).toEqual([{ name: 'short', width: 60, height: 32, requiredSize: 44 }]);
  });
});
