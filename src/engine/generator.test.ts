import { describe, expect, it } from 'vitest';
import { DIFFICULTIES, type Difficulty } from './types';
import { GIVEN_TARGETS, generatePuzzle } from './generator';
import {
  countDecisionNodes,
  countGivens,
  gridsEqual,
  hasUniqueSolution,
  isComplete,
  isValidGrid,
  solve,
} from './solver';
import { mulberry32 } from './rng';

// Property-style coverage: every seed in this range must yield a puzzle that
// satisfies the full validity contract (unique solvability, sane givens count,
// a stored solution that is complete and valid and equals the puzzle's solution).
const SEEDS = Array.from({ length: 30 }, (_, i) => i + 1);

describe('generatePuzzle', () => {
  for (const difficulty of DIFFICULTIES) {
    describe(difficulty, () => {
      it('produces a valid puzzle with the expected number of givens and unique solution', () => {
        for (const seed of SEEDS) {
          const { puzzle, solution } = generatePuzzle(difficulty, mulberry32(seed));
          // Givens never contradict each other (no duplicate in any row/col/box).
          expect(isValidGrid(puzzle), `seed ${seed}`).toBe(true);
          expect(countGivens(puzzle), `seed ${seed}`).toBe(GIVEN_TARGETS[difficulty]);
          // The puzzle must be solvable, uniquely, and its solution must be the
          // stored one — the guarantee behind "every guess has one correct place".
          expect(hasUniqueSolution(puzzle), `seed ${seed}`).toBe(true);
          const solved = solve(puzzle);
          expect(solved, `seed ${seed}`).not.toBeNull();
          expect(gridsEqual(solved!, solution), `seed ${seed}`).toBe(true);
          // The stored solution itself is a complete, valid grid, so givens can
          // never contradict it.
          expect(isValidGrid(solution), `seed ${seed}`).toBe(true);
          expect(isComplete(solution), `seed ${seed}`).toBe(true);
        }
      });

      it('is actually a puzzle (has holes) with sane decision-node cost', () => {
        const { puzzle } = generatePuzzle(difficulty, mulberry32(99));
        expect(countGivens(puzzle)).toBeLessThan(81);
        expect(countDecisionNodes(puzzle)).toBeGreaterThan(0);
      });
    });
  }

  it('is deterministic for the same seed', () => {
    const a = generatePuzzle('medium', mulberry32(7));
    const b = generatePuzzle('medium', mulberry32(7));
    expect(gridsEqual(a.puzzle, b.puzzle)).toBe(true);
    expect(gridsEqual(a.solution, b.solution)).toBe(true);
  });

  it('produces different puzzles for different seeds', () => {
    const a = generatePuzzle('medium', mulberry32(7));
    const b = generatePuzzle('medium', mulberry32(8));
    expect(gridsEqual(a.puzzle, b.puzzle)).toBe(false);
  });

  it('rates difficulties in the right order (easy < medium < hard < expert)', () => {
    const meanSteps: Record<Difficulty, number> = {
      easy: 0,
      medium: 0,
      hard: 0,
      expert: 0,
    };
    const samples = 12;
    for (const difficulty of DIFFICULTIES) {
      let total = 0;
      for (let i = 0; i < samples; i++) {
        const { puzzle } = generatePuzzle(difficulty, mulberry32(1000 + i));
        total += countDecisionNodes(puzzle);
      }
      meanSteps[difficulty] = total / samples;
    }
    expect(meanSteps.easy).toBeLessThan(meanSteps.medium);
    expect(meanSteps.medium).toBeLessThan(meanSteps.hard);
    expect(meanSteps.hard).toBeLessThan(meanSteps.expert);
  });
});