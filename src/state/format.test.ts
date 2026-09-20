import { describe, expect, it } from 'vitest';
import { formatTime } from './format';

describe('formatTime', () => {
  it('formats seconds as MM:SS (HH:MM:SS only past one hour)', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(5)).toBe('00:05');
    expect(formatTime(65)).toBe('01:05');
    expect(formatTime(660)).toBe('11:00');
    expect(formatTime(3600)).toBe('01:00:00');
    expect(formatTime(3665)).toBe('01:01:05');
    expect(formatTime(45296)).toBe('12:34:56');
  });

  it('floors fractional seconds and clamps negatives', () => {
    expect(formatTime(4.9)).toBe('00:04');
    expect(formatTime(-3)).toBe('00:00');
  });
});