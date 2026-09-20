/** Whole seconds between two wall-clock timestamps (ms), clamped at >= 0. */
export function elapsedSeconds(startedAtMs: number, nowMs: number): number {
  return Math.max(0, Math.floor((nowMs - startedAtMs) / 1000));
}