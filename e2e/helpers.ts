import { type Locator, type Page } from '@playwright/test';
import { generateCompletedGrid } from '../src/engine/generator';
import { mulberry32 } from '../src/engine/rng';
import type { Grid } from '../src/engine/types';

/** Serializes a puzzle + solution pair for the `#puzzle=` hash. */
export function encodePuzzle(puzzle: Grid, solution: Grid): string {
  const flat = (g: Grid): number[] => g.flat();
  return Buffer.from(
    JSON.stringify({ p: flat(puzzle), s: flat(solution) }),
  ).toString('base64');
}

/**
 * Navigates to e2e page with an injected, deterministic puzzle.
 * A cache-busting query param forces a full page load even when the current
 * URL already is the app root (so the hash is always read on mount).
 */
export async function gotoPuzzle(page: Page, puzzle: Grid, solution: Grid): Promise<void> {
  await page.goto(`/?at=${Date.now()}#puzzle=${encodePuzzle(puzzle, solution)}`);
}

/** A complete random grid used to craft deterministic test puzzles. */
export function sampleSolution(seed: number): Grid {
  return generateCompletedGrid(mulberry32(seed));
}

/** Board locator for one cell. */
export function cell(page: Page, row: number, col: number): Locator {
  return page.locator(`[data-r="${row}"][data-c="${col}"]`);
}

/** Coordinates of every empty cell in a grid (row-major). */
export function emptyCells(grid: Grid): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) out.push([r, c]);
    }
  }
  return out;
}

/** Numbers that already appear in a cell's row, column or box of `grid`. */
export function resolvedFor(grid: Grid, row: number, col: number): Set<number> {
  const resolved = new Set<number>();
  for (let i = 0; i < 9; i++) {
    if (grid[row][i] !== 0) resolved.add(grid[row][i]);
    if (grid[i][col] !== 0) resolved.add(grid[i][col]);
  }
  for (let dr = 0; dr < 3; dr++) {
    for (let dc = 0; dc < 3; dc++) {
      const v = grid[Math.floor(row / 3) * 3 + dr][Math.floor(col / 3) * 3 + dc];
      if (v !== 0) resolved.add(v);
    }
  }
  resolved.delete(grid[row][col]);
  return resolved;
}