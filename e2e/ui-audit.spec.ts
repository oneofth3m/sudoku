import { expect, test } from '@playwright/test';

test('ui audit: toolbar, keypad and erase-bar geometry', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  await page.waitForSelector('.cell');

  // 1) Toolbar fits on a single row at desktop width.
  const toolbar = await page.locator('.toolbar').boundingBox();
  const row = await page.locator('.toolbar-row').boundingBox();
  expect(row!.height).toBeLessThanOrEqual(toolbar!.height + 1);
  // Difficulty segmented control + tools + new game all in that row.
  await expect(page.locator('[data-testid="difficulty"]')).toBeVisible();
  await expect(page.locator('[data-testid="difficulty-option-hard"]')).toBeVisible();
  for (const id of ['undo', 'redo', 'auto-fill', 'clear-invalid', 'clear-corners', 'clear-centers']) {
    await expect(page.locator(`[data-testid="${id}"]`)).toBeVisible();
  }
  await expect(page.locator('[data-testid="new-game"]')).toBeVisible();

  // 2) Icon buttons are icon-only (no text inside).
  const undoText = await page.locator('[data-testid="undo"]').innerText();
  expect(undoText.trim()).toBe('');

  // 3) Erase bar is as wide as the keypad grid and spans all three columns.
  const erase = await page.locator('[data-testid="erase"]').boundingBox();
  const digit1 = await page.locator('[data-testid="key-1"]').boundingBox();
  const digit9 = await page.locator('[data-testid="key-9"]').boundingBox();
  expect(erase!.x).toBeCloseTo(digit1!.x, 0);
  expect(erase!.x + erase!.width).toBeCloseTo(digit9!.x + digit9!.width, 0);
  expect(erase!.width).toBeGreaterThan(digit1!.width * 2.5);

  // 4) No horizontal overflow at desktop or mobile.
  for (const w of [1280, 390]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto('/?at=' + Date.now());
    await page.waitForSelector('.cell');
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(over).toBeLessThanOrEqual(0);
  }

  // 5) Media query: keypad plus modes col fits mobile width.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?at=' + Date.now());
  await page.waitForSelector('.cell');
  const controls = await page.locator('.controls').boundingBox();
  expect(controls!.width).toBeLessThanOrEqual(360);
});