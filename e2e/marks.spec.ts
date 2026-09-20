import { expect, test } from '@playwright/test';
import { generatePuzzle } from '../src/engine/generator';
import { mulberry32 } from '../src/engine/rng';
import { cell, emptyCells, gotoPuzzle, resolvedFor } from './helpers';

test.describe('marks', () => {
  test('toggles corner and center marks per cell', async ({ page }) => {
    const puzzle = generatePuzzle('easy', mulberry32(41));
    await gotoPuzzle(page, puzzle.puzzle, puzzle.solution);
    const [r, c] = emptyCells(puzzle.puzzle)[0];

    // Corner mark.
    await cell(page, r, c).click();
    await page.getByTestId('mode-corner').click();
    await page.getByTestId('key-4').click();
    await expect(cell(page, r, c).locator('.corner-mark[data-mark="4"]')).toBeVisible();
    await page.getByTestId('key-4').click();
    await expect(cell(page, r, c).locator('.corner-mark')).toHaveCount(0);

    // Center mark.
    await page.getByTestId('mode-center').click();
    await page.getByTestId('key-7').click();
    await expect(cell(page, r, c).locator('.center-mark[data-mark="7"]')).toBeVisible();
    await page.getByTestId('key-7').click();
    await expect(cell(page, r, c).locator('.center-mark')).toHaveCount(0);

    // Corner and center marks are tracked independently.
    await page.getByTestId('mode-corner').click();
    await page.getByTestId('key-2').click();
    await page.getByTestId('mode-center').click();
    await page.getByTestId('key-5').click();
    await expect(cell(page, r, c).locator('.corner-mark[data-mark="2"]')).toBeVisible();
    await expect(cell(page, r, c).locator('.center-mark[data-mark="5"]')).toBeVisible();
  });

  test('marks cannot be placed on given cells', async ({ page }) => {
    const puzzle = generatePuzzle('easy', mulberry32(42));
    await gotoPuzzle(page, puzzle.puzzle, puzzle.solution);

    const firstGiven = puzzle.puzzle.flat().findIndex((v) => v !== 0);
    const gr = Math.floor(firstGiven / 9);
    const gc = firstGiven % 9;

    await cell(page, gr, gc).click();
    await page.getByTestId('mode-corner').click();
    await page.getByTestId('key-3').click();
    await expect(cell(page, gr, gc).locator('.corner-mark')).toHaveCount(0);

    await page.getByTestId('mode-center').click();
    await page.getByTestId('key-3').click();
    await expect(cell(page, gr, gc).locator('.center-mark')).toHaveCount(0);
  });

  test('auto-fill puts 1-9 center marks in every empty cell', async ({ page }) => {
    const puzzle = generatePuzzle('easy', mulberry32(43));
    await gotoPuzzle(page, puzzle.puzzle, puzzle.solution);

    await page.getByTestId('auto-fill').click();

    for (const [r, c] of emptyCells(puzzle.puzzle)) {
      await expect(cell(page, r, c).locator('.center-mark')).toHaveCount(9);
    }
    // Filled cells never show marks.
    const firstGiven = puzzle.puzzle.flat().findIndex((v) => v !== 0);
    const gr = Math.floor(firstGiven / 9);
    const gc = firstGiven % 9;
    await expect(cell(page, gr, gc).locator('.corner-mark, .center-mark')).toHaveCount(0);
  });

  test('invalid marks are highlighted and the clear-invalid button removes them', async ({ page }) => {
    const puzzle = generatePuzzle('easy', mulberry32(44));
    await gotoPuzzle(page, puzzle.puzzle, puzzle.solution);

    // Pick an empty cell with a moderate number of resolved numbers in its units.
    const target = emptyCells(puzzle.puzzle).find(([r, c]) => {
      const n = resolvedFor(puzzle.puzzle, r, c).size;
      return n >= 1 && n <= 7;
    });
    expect(target).toBeDefined();
    const [r, c] = target!;
    const resolved = resolvedFor(puzzle.puzzle, r, c);
    const invalidMark = [...resolved][0];
    const validMark = [1, 2, 3, 4, 5, 6, 7, 8, 9].find((n) => !resolved.has(n))!;

    await page.getByTestId('auto-fill').click();

    // The resolved number is highlighted as invalid; a fresh number is not.
    await expect(cell(page, r, c).locator(`.center-mark[data-mark="${invalidMark}"]`)).toHaveClass(/invalid/);
    await expect(cell(page, r, c).locator(`.center-mark[data-mark="${validMark}"]`)).not.toHaveClass(/invalid/);

    await page.getByTestId('clear-invalid').click();

    // No invalid marks remain anywhere; the specific one is gone; valid marks stay.
    await expect(page.locator('.center-mark.invalid, .corner-mark.invalid')).toHaveCount(0);
    await expect(cell(page, r, c).locator(`.center-mark[data-mark="${invalidMark}"]`)).toHaveCount(0);
    await expect(cell(page, r, c).locator('.center-mark')).toHaveCount(9 - resolved.size);
    await expect(cell(page, r, c).locator(`.center-mark[data-mark="${validMark}"]`)).toBeVisible();
  });

  test('auto-pencil removes a placed number from peer marks', async ({ page }) => {
    const puzzle = generatePuzzle('easy', mulberry32(45));
    await gotoPuzzle(page, puzzle.puzzle, puzzle.solution);

    const empties = emptyCells(puzzle.puzzle);
    const [[r, c]] = empties; // the cell we will fill
    const target = empties.find(([er, ec]) => er === r || ec === c || (Math.floor(er / 3) === Math.floor(r / 3) && Math.floor(ec / 3) === Math.floor(c / 3)));
    expect(target).toBeDefined();
    const [pr, pc] = target!;

    // Place center marks 1-9 on both cells, then clear the invalid ones.
    await page.getByTestId('auto-fill').click();
    await page.getByTestId('clear-invalid').click();
    await expect(cell(page, pr, pc).locator('.center-mark')).not.toHaveCount(0);

    // Auto-pencil: mark m on the peer cell disappears once (r,c) is filled with m.
    const value = puzzle.solution[r][c];
    await cell(page, r, c).click();
    await page.getByTestId('mode-value').click();
    await page.getByTestId(`key-${value}`).click();

    // The number placed at (r,c) cannot linger as a mark on its peers.
    await expect(cell(page, pr, pc).locator(`.center-mark[data-mark="${value}"]`)).toHaveCount(0);
  });

  test('clear corner / center buttons remove only their own mark type', async ({ page }) => {
    const puzzle = generatePuzzle('easy', mulberry32(55));
    await gotoPuzzle(page, puzzle.puzzle, puzzle.solution);
    const [[r1, c1], [r2, c2]] = emptyCells(puzzle.puzzle);

    // A corner mark on cell A plus auto-filled center marks on every empty cell.
    await cell(page, r1, c1).click();
    await page.getByTestId('mode-corner').click();
    await page.getByTestId('key-3').click();
    await page.getByTestId('auto-fill').click();

    await expect(cell(page, r1, c1).locator('.corner-mark[data-mark="3"]')).toBeVisible();
    await expect(cell(page, r1, c1).locator('.center-mark')).toHaveCount(9);
    await expect(cell(page, r2, c2).locator('.center-mark')).toHaveCount(9);

    // Clear corners: only the corner marks go away, center marks survive.
    await page.getByTestId('clear-corners').click();
    await expect(cell(page, r1, c1).locator('.corner-mark')).toHaveCount(0);
    await expect(cell(page, r1, c1).locator('.center-mark')).toHaveCount(9);

    // Clear centers: only the center marks go away (nothing else is left here).
    await page.getByTestId('clear-centers').click();
    await expect(page.locator('.corner-mark, .center-mark')).toHaveCount(0);

    // Both clears are single undoable steps that restore the marks.
    await page.getByTestId('undo').click();
    await page.getByTestId('undo').click();
    await expect(cell(page, r1, c1).locator('.corner-mark[data-mark="3"]')).toBeVisible();
    await expect(cell(page, r1, c1).locator('.center-mark')).toHaveCount(9);
  });

  test('all corner and center marks fit inside the cell without overlap', async ({ page }) => {
    const puzzle = generatePuzzle('easy', mulberry32(53));
    await gotoPuzzle(page, puzzle.puzzle, puzzle.solution);
    const [r, c] = emptyCells(puzzle.puzzle)[0];
    await cell(page, r, c).click();

    // Place all 9 corner marks, then all 9 center marks on the same cell.
    await page.getByTestId('mode-corner').click();
    for (let n = 1; n <= 9; n++) await page.getByTestId(`key-${n}`).click();
    await page.getByTestId('mode-center').click();
    for (let n = 1; n <= 9; n++) await page.getByTestId(`key-${n}`).click();

    const result = await cell(page, r, c).evaluate((el) => {
      const cellRect = el.getBoundingClientRect();
      const boxes = Array.from(el.querySelectorAll('.corner-mark, .center-mark')).map((m) => m.getBoundingClientRect());
      const outside = boxes.filter(
        (b) => b.left < cellRect.left || b.right > cellRect.right || b.top < cellRect.top || b.bottom > cellRect.bottom,
      ).length;
      let overlaps = 0;
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i];
          const b = boxes[j];
          if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) overlaps++;
        }
      }
      return { total: boxes.length, outside, overlaps };
    });

    // Corner marks keep all 9 digits (the corner 5 takes the chip's middle
    // slot, so the center 5 yields): 9 corners + 8 center marks = 17 digits,
    // every one of them inside the cell with zero overlap.
    expect(await cell(page, r, c).locator('.corner-mark').count()).toBe(9);
    await expect(cell(page, r, c).locator('.corner-mark[data-mark="5"]')).toBeVisible();
    expect(await cell(page, r, c).locator('.center-mark').count()).toBe(8);
    expect(result.total).toBe(17);
    expect(result.outside).toBe(0);
    expect(result.overlaps).toBe(0);
  });

  test('corner marks stay visible when auto-fill adds center marks', async ({ page }) => {
    const puzzle = generatePuzzle('easy', mulberry32(54));
    await gotoPuzzle(page, puzzle.puzzle, puzzle.solution);
    const [r, c] = emptyCells(puzzle.puzzle)[0];
    await cell(page, r, c).click();

    // Place all 9 corner marks, then auto-fill all 9 center marks on the same cell.
    await page.getByTestId('mode-corner').click();
    for (let n = 1; n <= 9; n++) await page.getByTestId(`key-${n}`).click();
    await page.getByTestId('auto-fill').click();

    // Every corner mark is still on screen — including 5, which is never
    // hidden behind the center-mark chip.
    await expect(cell(page, r, c).locator('.corner-mark')).toHaveCount(9);
    await expect(cell(page, r, c).locator('.corner-mark[data-mark="5"]')).toBeVisible();
    // The center marks render the remaining 8 digits (5 yields to corner 5).
    await expect(cell(page, r, c).locator('.center-mark')).toHaveCount(8);
  });
});