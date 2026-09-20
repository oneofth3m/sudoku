/** Uniform random number in [0, 1). */
export type RNG = () => number;

/**
 * Deterministic PRNG (mulberry32). The same seed always produces the same
 * sequence, which makes generation and tests reproducible.
 */
export function mulberry32(seed: number): RNG {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates shuffle using the given RNG. Returns a new array. */
export function shuffle<T>(items: readonly T[], rng: RNG): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}