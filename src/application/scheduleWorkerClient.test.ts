import { describe, expect, it } from 'vitest';
import { isWorkerResponseCurrent } from './scheduleWorkerClient';

// CPM-AT-008 rapid-edit stale result guard
describe('schedule worker revision guard', () => {
  it('accepts only the response matching the current project revision', () => {
    expect(isWorkerResponseCurrent(12, 12)).toBe(true);
    expect(isWorkerResponseCurrent(12, 11)).toBe(false);
    expect(isWorkerResponseCurrent(12, 13)).toBe(false);
    expect(isWorkerResponseCurrent(12, undefined)).toBe(false);
  });
});
