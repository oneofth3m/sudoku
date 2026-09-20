import { expect, test } from '@playwright/test';
import { generatePuzzle } from '../src/engine/generator';
import { mulberry32 } from '../src/engine/rng';
import { cell, emptyCells, gotoPuzzle, resolvedFor, sampleSolution } from './helpers';

test.describe('board rendering', () => {
  test('renders 81 cells with givens matching the injected puzzle', async ({ page }) => {
    const medium = generatePuzzle('medium', mulberry32(5));
    await gotoPuzzle(page, medium.puzzle, medium.solution);

    await expect(page.getByTestId('board')).toBeVisible();
    await expect(page.locator('.cell')).toHaveCount(81);

    // The right cells are givens.
    const givens = medium.puzzle.flat().filter((v) => v !== 0).length;
    await expect(page.locator('.cell.given')).toHaveCount(givens);

    // A given cell shows its value; an empty cell shows none.
    const firstGiven = medium.puzzle.flat().findIndex((v) => v !== 0);
    const gr = Math.floor(firstGiven / 9);
    const gc = firstGiven % 9;
    await expect(cell(page, gr, gc)).toHaveAttribute('data-value', String(medium.puzzle[gr][gc]));
    await expect(cell(page, gr, gc)).toHaveClass(/given/);

    const firstEmpty = medium.puzzle.flat().findIndex((v) => v === 0);
    const er = Math.floor(firstEmpty / 9);
    const ec = firstEmpty % 9;
    await expect(cell(page, er, ec)).toHaveAttribute('data-value', '0');
  });

  test('new game and difficulty selector produce playable puzzles', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.cell')).toHaveCount(81);

    // Easy default: ~43 givens.
    const easyGivens = await page.locator('.cell.given').count();
    expect(easyGivens).toBeGreaterThanOrEqual(40);
    expect(easyGivens).toBeLessThanOrEqual(47);

    // Switching difficulty starts a new game with a plausibly matching count.
    await page.getByTestId('difficulty-option-hard').click();
    await expect(page.locator('.cell')).toHaveCount(81);
    const hardGivens = await page.locator('.cell.given').count();
    expect(hardGivens).toBeGreaterThanOrEqual(25);
    expect(hardGivens).toBeLessThanOrEqual(32);

    await page.getByTestId('difficulty-option-expert').click();
    await expect(page.locator('.cell')).toHaveCount(81);
    const expertGivens = await page.locator('.cell.given').count();
    expect(expertGivens).toBeGreaterThanOrEqual(20);
    expect(expertGivens).toBeLessThanOrEqual(33);
  });
});

test.describe('input', () => {
  test('enters and erases values via keypad and keyboard; given cells are locked', async ({ page }) => {
    const puzzle = generatePuzzle('easy', mulberry32(11));
    await gotoPuzzle(page, puzzle.puzzle, puzzle.solution);

    const empties = emptyCells(puzzle.puzzle);
    const [r1, c1] = empties[0];
    const [r2, c2] = empties[1];

    // Keypad entry.
    await cell(page, r1, c1).click();
    await page.getByTestId('key-5').click();
    await expect(cell(page, r1, c1)).toHaveAttribute('data-value', '5');
    await expect(cell(page, r1, c1)).toHaveClass(/user/);

    // Keyboard entry.
    await cell(page, r2, c2).click();
    await page.keyboard.press('7');
    await expect(cell(page, r2, c2)).toHaveAttribute('data-value', '7');

    // Erase with Backspace.
    await page.keyboard.press('Backspace');
    await expect(cell(page, r2, c2)).toHaveAttribute('data-value', '0');

    // Erase with the keypad eraser.
    await cell(page, r1, c1).click();
    await page.getByTestId('erase').click();
    await expect(cell(page, r1, c1)).toHaveAttribute('data-value', '0');

    // Givens are locked: click + press a digit does nothing.
    const firstGiven = puzzle.puzzle.flat().findIndex((v) => v !== 0);
    const gr = Math.floor(firstGiven / 9);
    const gc = firstGiven % 9;
    await cell(page, gr, gc).click();
    await page.keyboard.press('9');
    await expect(cell(page, gr, gc)).toHaveAttribute('data-value', String(puzzle.puzzle[gr][gc]));
  });

  test('arrow keys move the selection', async ({ page }) => {
    const puzzle = generatePuzzle('easy', mulberry32(12));
    await gotoPuzzle(page, puzzle.puzzle, puzzle.solution);

    await cell(page, 4, 4).click();
    await page.keyboard.press('ArrowRight');
    await expect(cell(page, 4, 5)).toHaveClass(/selected/);
    await page.keyboard.press('ArrowDown');
    await expect(cell(page, 5, 5)).toHaveClass(/selected/);
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowLeft');
    await expect(cell(page, 4, 4)).toHaveClass(/selected/);
  });

  test('keyboard shortcuts switch value / corner / center modes', async ({ page }) => {
    const puzzle = generatePuzzle('easy', mulberry32(52));
    await gotoPuzzle(page, puzzle.puzzle, puzzle.solution);
    const [r, c] = emptyCells(puzzle.puzzle)[0];
    await cell(page, r, c).click();

    await page.keyboard.press('c');
    await page.keyboard.press('3');
    await expect(cell(page, r, c).locator('.corner-mark[data-mark="3"]')).toBeVisible();

    await page.keyboard.press('m');
    await page.keyboard.press('5');
    await expect(cell(page, r, c).locator('.center-mark[data-mark="5"]')).toBeVisible();

    await page.keyboard.press('v');
    await page.keyboard.press('6');
    await expect(cell(page, r, c)).toHaveAttribute('data-value', '6');
  });

  test('mistakes are highlighted as conflicts', async ({ page }) => {
    const puzzle = generatePuzzle('easy', mulberry32(13));
    await gotoPuzzle(page, puzzle.puzzle, puzzle.solution);

    // Pick an empty cell that has resolved numbers in its units.
    const target = emptyCells(puzzle.puzzle).find(
      ([r, c]) => resolvedFor(puzzle.puzzle, r, c).size > 0,
    );
    expect(target).toBeDefined();
    const [r, c] = target!;
    const wrongValue = [...resolvedFor(puzzle.puzzle, r, c)][0];

    await cell(page, r, c).click();
    await page.keyboard.press(String(wrongValue));

    await expect(cell(page, r, c)).toHaveAttribute('data-value', String(wrongValue));
    await expect(cell(page, r, c)).toHaveClass(/conflict/);
    // At least one given in the same unit shares the offending value.
    await expect(page.locator('.cell.conflict').first()).toBeVisible();
    expect(await page.locator('.cell.conflict').count()).toBeGreaterThanOrEqual(2);
  });

  test('a value that does not match the solution is flagged as wrong even without a conflict', async ({ page }) => {
    const puzzle = generatePuzzle('easy', mulberry32(14));
    await gotoPuzzle(page, puzzle.puzzle, puzzle.solution);

    // Pick an empty cell where a wrong-but-non-conflicting digit exists:
    // resolved < 8 leaves at least one digit that is neither resolved nor the answer.
    const target = emptyCells(puzzle.puzzle).find(([r, c]) => resolvedFor(puzzle.puzzle, r, c).size <= 7);
    expect(target).toBeDefined();
    const [r, c] = target!;
    const answer = puzzle.solution[r][c];
    const resolved = resolvedFor(puzzle.puzzle, r, c);
    const wrongDigit = [1, 2, 3, 4, 5, 6, 7, 8, 9].find((n) => !resolved.has(n) && n !== answer)!;
    expect(wrongDigit).toBeDefined();

    // Enter the wrong value: no immediate rule conflict, but flagged wrong.
    await cell(page, r, c).click();
    await page.keyboard.press(String(wrongDigit));
    await expect(cell(page, r, c)).toHaveAttribute('data-value', String(wrongDigit));
    await expect(cell(page, r, c)).toHaveClass(/wrong/);
    await expect(cell(page, r, c)).not.toHaveClass(/conflict/);
    await expect(cell(page, r, c)).toHaveAttribute('data-wrong', 'true');

    // Erasing a wrong value clears the flag.
    await page.getByTestId('erase').click();
    await expect(cell(page, r, c)).not.toHaveAttribute('data-wrong', 'true');

    // The correct value is never flagged.
    await page.keyboard.press(String(answer));
    await expect(cell(page, r, c)).not.toHaveClass(/wrong/);
    await expect(cell(page, r, c)).not.toHaveAttribute('data-wrong', 'true');
  });
});

test.describe('undo / redo', () => {
  test('undoes and redoes multiple moves', async ({ page }) => {
    const puzzle = generatePuzzle('easy', mulberry32(21));
    await gotoPuzzle(page, puzzle.puzzle, puzzle.solution);
    const empties = emptyCells(puzzle.puzzle);

    const [[r1, c1], [r2, c2]] = empties;

    await cell(page, r1, c1).click();
    await page.getByTestId('key-1').click();
    await cell(page, r2, c2).click();
    await page.getByTestId('key-2').click();

    await expect(cell(page, r1, c1)).toHaveAttribute('data-value', '1');
    await expect(cell(page, r2, c2)).toHaveAttribute('data-value', '2');

    await page.getByTestId('undo').click();
    await expect(cell(page, r2, c2)).toHaveAttribute('data-value', '0');

    await page.getByTestId('undo').click();
    await expect(cell(page, r1, c1)).toHaveAttribute('data-value', '0');

    await page.getByTestId('redo').click();
    await expect(cell(page, r1, c1)).toHaveAttribute('data-value', '1');

    await page.getByTestId('redo').click();
    await expect(cell(page, r2, c2)).toHaveAttribute('data-value', '2');

    // A new move after undo clears the redo stack.
    await page.getByTestId('undo').click();
    await cell(page, r1, c1).click();
    await page.getByTestId('key-3').click();
    await expect(page.getByTestId('redo')).toBeDisabled();
  });
});

test.describe('win flow', () => {
  test('completing the board wins, freezes input and shows stats', async ({ page }) => {
    const solution = sampleSolution(9);
    const puzzle = solution.map((row) => [...row]);
    puzzle[0][0] = 0;
    puzzle[8][8] = 0;
    puzzle[3][6] = 0;
    puzzle[6][3] = 0;
    await gotoPuzzle(page, puzzle, solution);

    for (const [r, c] of [
      [0, 0],
      [8, 8],
      [3, 6],
      [6, 3],
    ]) {
      await cell(page, r, c).click();
      await page.keyboard.press(String(solution[r][c]));
    }

    await expect(page.getByTestId('win-overlay')).toBeVisible();
    await expect(page.getByTestId('win-moves')).toHaveText('4');
    await expect(page.getByTestId('win-time')).toHaveText(/^\d{2}:\d{2}(:\d{2})?$/);

    // Play again starts a fresh game.
    await page.getByTestId('win-new-game').click();
    await expect(page.getByTestId('win-overlay')).toBeHidden();
    await expect(page.locator('.cell')).toHaveCount(81);
  });

  test('a wrong value cannot win', async ({ page }) => {
    const solution = sampleSolution(10);
    const puzzle = solution.map((row) => [...row]);
    puzzle[0][0] = 0;
    puzzle[8][8] = 0;
    await gotoPuzzle(page, puzzle, solution);

    await cell(page, 0, 0).click();
    await page.keyboard.press(String(solution[0][0]));
    await cell(page, 8, 8).click();
    const wrong = solution[8][8] === 9 ? 1 : solution[8][8] + 1;
    await page.keyboard.press(String(wrong));

    await expect(page.getByTestId('win-overlay')).toBeHidden();
  });

  test('completes a full generated puzzle through the UI', async ({ page }) => {
    const puzzle = generatePuzzle('easy', mulberry32(99));
    await gotoPuzzle(page, puzzle.puzzle, puzzle.solution);
    const empties = emptyCells(puzzle.puzzle);
    expect(empties.length).toBeGreaterThan(30);

    for (const [r, c] of empties) {
      await cell(page, r, c).click();
      await page.keyboard.press(String(puzzle.solution[r][c]));
    }

    await expect(page.getByTestId('win-overlay')).toBeVisible();
    await expect(page.getByTestId('win-moves')).toHaveText(String(empties.length));
  });

  test('shows a banner when the board is full but incorrect', async ({ page }) => {
    const solution = sampleSolution(12);
    const puzzle = solution.map((row) => [...row]);
    puzzle[0][0] = 0;
    puzzle[8][8] = 0;
    await gotoPuzzle(page, puzzle, solution);

    const wrong1 = solution[0][0] === 9 ? 1 : solution[0][0] + 1;
    const wrong2 = solution[8][8] === 9 ? 1 : solution[8][8] + 1;
    await cell(page, 0, 0).click();
    await page.keyboard.press(String(wrong1));
    await cell(page, 8, 8).click();
    await page.keyboard.press(String(wrong2));

    await expect(page.getByTestId('incomplete-banner')).toBeVisible();
    await expect(page.getByTestId('win-overlay')).toBeHidden();
  });
});

test.describe('timer & stats', () => {
  test('timer starts on the first move and ticks', async ({ page }) => {
    const puzzle = generatePuzzle('easy', mulberry32(31));
    await gotoPuzzle(page, puzzle.puzzle, puzzle.solution);

    await expect(page.getByTestId('timer')).toHaveText('00:00');

    const [r, c] = emptyCells(puzzle.puzzle)[0];
    await cell(page, r, c).click();
    await page.getByTestId('key-4').click();

    await expect(page.getByTestId('timer')).toHaveText(/00:0[1-9]/, { timeout: 5000 });
    await expect(page.getByTestId('moves')).toHaveText('1');
  });

  test('timer advances once per real second (no drift)', async ({ page }) => {
    const puzzle = generatePuzzle('easy', mulberry32(32));
    await gotoPuzzle(page, puzzle.puzzle, puzzle.solution);

    const [r, c] = emptyCells(puzzle.puzzle)[0];
    await cell(page, r, c).click();
    await page.getByTestId('key-4').click();
    // Make sure the clock is running before measuring.
    await expect(page.getByTestId('timer')).toHaveText(/00:0[1-9]/, { timeout: 5000 });

    const toTotalSeconds = (t: string | null): number => {
      const [mm, ss] = (t ?? '00:00').split(':').map(Number);
      return mm * 60 + ss;
    };

    const wallStart = Date.now();
    const start = toTotalSeconds(await page.getByTestId('timer').textContent());
    await page.waitForTimeout(3000);
    const end = toTotalSeconds(await page.getByTestId('timer').textContent());
    const wall = (Date.now() - wallStart) / 1000;

    // Displayed seconds should track wall-clock seconds (±1s timing slop), not
    // race ahead — the old accumulator grew ~2x faster than real time.
    expect(Math.abs(end - start - Math.floor(wall))).toBeLessThanOrEqual(1);
    expect(end - start).toBeLessThanOrEqual(4);
  });

  test('best time is recorded after winning', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());

    const solution = sampleSolution(11);
    const puzzle = solution.map((row) => [...row]);
    puzzle[0][0] = 0;
    puzzle[1][1] = 0;
    await gotoPuzzle(page, puzzle, solution);

    await expect(page.getByTestId('best')).toHaveText('—');

    for (const [r, c] of [
      [0, 0],
      [1, 1],
    ]) {
      await cell(page, r, c).click();
      await page.keyboard.press(String(solution[r][c]));
    }
    await expect(page.getByTestId('win-overlay')).toBeVisible();

    const winTime = await page.getByTestId('win-time').textContent();
    expect(winTime).not.toBeNull();
    await expect(page.getByTestId('best')).toHaveText(winTime!);
  });
});

test.describe('keypad remaining counts', () => {
  test('shows how many of each digit are still missing and updates on input', async ({ page }) => {
    const puzzle = generatePuzzle('easy', mulberry32(51));
    await gotoPuzzle(page, puzzle.puzzle, puzzle.solution);

    const givens = puzzle.puzzle.flat().filter((v) => v !== 0);
    const countOf = (n: number) => givens.filter((v) => v === n).length;

    // Initial badge = 9 minus how many givens of that digit are on the board.
    for (let n = 1; n <= 9; n++) {
      await expect(page.getByTestId(`remaining-${n}`)).toHaveText(String(9 - countOf(n)));
    }

    // Placing a 1 decrements its badge.
    const [r, c] = emptyCells(puzzle.puzzle)[0];
    await cell(page, r, c).click();
    await page.getByTestId('key-1').click();
    await expect(page.getByTestId('remaining-1')).toHaveText(String(9 - countOf(1) - 1));
  });

  test('a fully placed digit shows a green zero badge', async ({ page }) => {
    const solution = sampleSolution(7);
    // Grid with every 1 already placed (matching the solution) and nothing else.
    const puzzle = solution.map((row) => row.map((v) => (v === 1 ? 1 : 0)));
    await gotoPuzzle(page, puzzle, solution);

    // The 1 key is finished: zero badge turns solid green, not red.
    await expect(page.locator('[data-testid="key-1"]')).toHaveClass(/zero/);
    await expect(page.getByTestId('remaining-1')).toHaveText('0');
    await expect(page.getByTestId('remaining-1')).toHaveCSS('background-color', 'rgb(23, 138, 75)');

    // A digit still missing keeps the neutral badge.
    await expect(page.locator('[data-testid="key-2"]')).not.toHaveClass(/zero/);
    await expect(page.getByTestId('remaining-2')).toHaveText('9');
    await expect(page.getByTestId('remaining-2')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  });
});

test.describe('board link (debug)', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  test('copies a link that uniquely identifies the board and reloads the same puzzle', async ({ page }) => {
    const puzzle = generatePuzzle('easy', mulberry32(61));
    await gotoPuzzle(page, puzzle.puzzle, puzzle.solution);

    // The link is available in the debug block.
    await page.locator('.board-link summary').click();
    const link = await page.getByTestId('board-link').inputValue();
    expect(link).toContain('#puzzle=');

    // Copy button gives feedback.
    await page.getByTestId('copy-board-link').click();
    await expect(page.getByTestId('copied-hint')).toBeVisible();

    // Reopening the link loads the identical puzzle (identical givens).
    const hash = link.slice(link.indexOf('#'));
    await page.goto(`/?at=${Date.now()}${hash}`);

    const readGivens = (): Promise<Array<[number, number, number]>> =>
      page.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLElement>('.cell.given')).map(
          (el) => [Number(el.dataset.r), Number(el.dataset.c), Number(el.dataset.value)] as [number, number, number],
        ),
      );
    const expected: Array<[number, number, number]> = [];
    puzzle.puzzle.forEach((row, r) =>
      row.forEach((v, c) => {
        if (v !== 0) expected.push([r, c, v]);
      }),
    );
    expect((await readGivens()).sort()).toEqual(expected.sort());
  });
});

test.describe('keyboard help', () => {
  test('shortcuts panel is always expanded and documents V / C / M', async ({ page }) => {
    await page.goto('/');
    const help = page.locator('.keyboard-help');
    // Kept expanded by default — no click needed to see the shortcuts.
    await expect(help).toHaveAttribute('open', '');
    await expect(help.locator('ul')).toBeVisible();
    await expect(help).toContainText('V');
    await expect(help).toContainText('C');
    await expect(help).toContainText('M');
  });
});