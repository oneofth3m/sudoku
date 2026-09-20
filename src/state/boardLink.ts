import { isComplete, isValidGrid, solve, hasUniqueSolution } from '../engine/solver';
import type { Grid } from '../engine/types';

export interface BoardLinkData {
  puzzle: Grid;
  solution: Grid;
}

const toGrid = (arr: number[]): Grid => Array.from({ length: 9 }, (_, r) => arr.slice(r * 9, r * 9 + 9));

const isDigitArray = (v: unknown): v is number[] =>
  Array.isArray(v) && v.length === 81 && v.every((n) => Number.isInteger(n) && n >= 0 && n <= 9);

/**
 * Builds the `#puzzle=` hash fragment for a board (and optionally its
 * solution). Encoding only the puzzle is enough to identify a board uniquely,
 * since the app derives the solution on load.
 */
export function encodeBoardLink(puzzle: Grid, solution?: Grid): string {
  const payload: { p: number[]; s?: number[] } = { p: puzzle.flat() };
  if (solution) payload.s = solution.flat();
  return `#puzzle=${btoa(JSON.stringify(payload))}`;
}

/**
 * Parses a `#puzzle=` hash fragment back into {puzzle, solution}. The solution
 * may be omitted, in which case it is derived from the (uniquely solvable)
 * puzzle. Returns null for any malformed or invalid input.
 */
export function decodeBoardLink(hash: string): BoardLinkData | null {
  if (!hash.startsWith('#puzzle=')) return null;
  let data: { p?: unknown; s?: unknown };
  try {
    data = JSON.parse(atob(hash.slice('#puzzle='.length))) as { p?: unknown; s?: unknown };
  } catch {
    return null;
  }
  if (!isDigitArray(data.p)) return null;
  const puzzle = toGrid(data.p);
  if (!isValidGrid(puzzle)) return null;

  if (isDigitArray(data.s)) {
    const solution = toGrid(data.s);
    if (!isValidGrid(solution) || !isComplete(solution)) return null;
    // The puzzle's givens must agree with the embedded solution.
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (puzzle[r][c] !== 0 && puzzle[r][c] !== solution[r][c]) return null;
      }
    }
    return { puzzle, solution };
  }

  // Puzzle-only link: derive the unique solution.
  if (!hasUniqueSolution(puzzle)) return null;
  const derived = solve(puzzle);
  if (derived === null) return null;
  return { puzzle, solution: derived };
}