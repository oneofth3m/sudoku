import type { Difficulty, Grid } from './types';
import type { RNG } from './rng';
import { mulberry32, shuffle } from './rng';
import { countDecisionNodes, createEmptyGrid, hasUniqueSolution, isValidPlacement } from './solver';

/** How many givens each difficulty keeps after digging. */
export const GIVEN_TARGETS: Record<Difficulty, number> = {
  easy: 43,
  medium: 34,
  hard: 28,
  expert: 24,
};

/** Accepted backtracker-hardness windows (decision nodes from `countDecisionNodes`). */
const STEP_WINDOWS: Record<Difficulty, [number, number]> = {
  easy: [0, 150],
  medium: [150, 1500],
  hard: [1500, 9000],
  expert: [9000, Infinity],
};

const MAX_ATTEMPTS = 25;

function fillGrid(grid: Grid, rng: RNG): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] !== 0) continue;
      for (const n of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng)) {
        if (isValidPlacement(grid, r, c, n)) {
          grid[r][c] = n;
          if (fillGrid(grid, rng)) return true;
          grid[r][c] = 0;
        }
      }
      return false;
    }
  }
  return true;
}

/** Generates a random, complete, valid grid. */
export function generateCompletedGrid(rng: RNG): Grid {
  const grid = createEmptyGrid();
  fillGrid(grid, rng);
  return grid;
}

/**
 * Removes cells from a completed grid while keeping a unique solution, until
 * exactly `targetGivens` cells remain. Returns null when the greedy dig packs
 * in early (cannot reach the target while keeping uniqueness).
 */
function digHoles(solution: Grid, targetGivens: number, rng: RNG): Grid | null {
  const puzzle = solution.map((row) => [...row]);
  const positions = shuffle(Array.from({ length: 81 }, (_, i) => i), rng);
  let givens = 81;
  for (const index of positions) {
    if (givens <= targetGivens) break;
    const r = Math.floor(index / 9);
    const c = index % 9;
    const saved = puzzle[r][c];
    puzzle[r][c] = 0;
    if (hasUniqueSolution(puzzle)) {
      givens--;
    } else {
      puzzle[r][c] = saved; // removing this cell would break uniqueness
    }
  }
  return givens === targetGivens ? puzzle : null;
}

export interface GeneratedPuzzle {
  puzzle: Grid;
  solution: Grid;
}

/**
 * Generates a puzzle with a unique solution that fits the requested
 * difficulty (given count + solver-hardness rating). Deterministic when a
 * seeded `rng` is supplied.
 */
export function generatePuzzle(difficulty: Difficulty, rng?: RNG): GeneratedPuzzle {
  const r = rng ?? mulberry32((Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0);
  const target = GIVEN_TARGETS[difficulty];
  const [min, max] = STEP_WINDOWS[difficulty];

  let best: GeneratedPuzzle | null = null; // best puzzle that reached the given target
  let lastDug: GeneratedPuzzle | null = null; // most recent dug puzzle (fallback)
  let bestScore = Infinity;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const solution = generateCompletedGrid(r);
    const puzzle = digHoles(solution, target, r);
    if (puzzle === null) continue; // dig packed in early; try a fresh solution
    lastDug = { puzzle, solution };
    const steps = countDecisionNodes(puzzle);
    if (steps >= min && steps <= max) {
      return { puzzle, solution };
    }
    const score = steps < min ? min - steps : steps - max;
    if (score < bestScore) {
      bestScore = score;
      best = { puzzle, solution };
    }
  }
  return best ?? lastDug!;
}