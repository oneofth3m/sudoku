import { expect, test } from '@playwright/test';
import type { Grid } from '../src/engine/types';
import { hasUniqueSolution, isComplete, isValidGrid, solve } from '../src/engine/solver';

/**
 * Reads the givens of the currently rendered board (fresh, browser-generated —
 * no hash injection) and asserts the user-visible validity guarantee:
 * no conflicting givens, a unique solution, and the puzzle is solvable.
 */

test.describe('generated-board validity', () => {
  for (const [difficulty, label] of [
    ['easy', 'easy'],
    ['medium', 'medium'],
    ['hard', 'hard'],
    ['expert', 'expert'],
  ] as const) {
    test(`${label}: a board generated in the browser is valid and uniquely solvable`, async ({ page }) => {
      await page.goto('/');
      if (difficulty !== 'easy') {
        await page.getByTestId(`difficulty-option-${difficulty}`).click();
      }

      const puzzle = await page.evaluate((): number[][] => {
        const grid = Array.from({ length: 9 }, () => Array<number>(9).fill(0));
        for (const el of document.querySelectorAll<HTMLElement>('.cell.given')) {
          const r = Number(el.dataset.r);
          const c = Number(el.dataset.c);
          grid[r][c] = Number(el.dataset.value);
        }
        return grid as number[][];
      });
      const asGrid: Grid = puzzle;

      // The visible givens never contradict each other (each row/col/box unique).
      expect(isValidGrid(asGrid)).toBe(true);
      // There is a completion, it is unique, and completing it is possible.
      expect(hasUniqueSolution(asGrid)).toBe(true);
      const solved = solve(asGrid);
      expect(solved).not.toBeNull();
      expect(isComplete(solved!)).toBe(true);
      // A sane difficulty: the board is not near-empty.
      expect(asGrid.flat().filter((v) => v !== 0).length).toBeGreaterThanOrEqual(20);
    });
  }
});