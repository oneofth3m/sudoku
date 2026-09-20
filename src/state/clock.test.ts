import { describe, expect, it } from 'vitest';
import { elapsedSeconds } from './clock';

describe('elapsedSeconds', () => {
  it('advances the display by exactly one whole second per real second', () => {
    // Under one second: still 0.
    expect(elapsedSeconds(0, 0)).toBe(0);
    expect(elapsedSeconds(0, 999)).toBe(0);
    // Exactly one second elapses 0 -> 1, then stays 1 until the second second.
    expect(elapsedSeconds(0, 1000)).toBe(1);
    expect(elapsedSeconds(0, 1001)).toBe(1);
    expect(elapsedSeconds(0, 1999)).toBe(1);
    expect(elapsedSeconds(0, 2000)).toBe(2);
    expect(elapsedSeconds(0, 2500)).toBe(2);
  });

  it('is monotonic and clamps negatives', () => {
    expect(elapsedSeconds(1000, 500)).toBe(0);
    expect(elapsedSeconds(5000, 5000)).toBe(0);
    // Hours later: large values still whole seconds.
    expect(elapsedSeconds(0, 3 * 3600 * 1000 + 61 * 1000 + 5)).toBe(10861);
  });
});