import { test, expect } from '@playwright/test';

// Verify mark layout geometry on a small (mobile) viewport.
test.use({ viewport: { width: 390, height: 844 } });

test('marks fit without overlap on mobile', async ({ page }) => {
  await page.goto('/?v=1');
  const empty = page.locator('.cell:not(.given)[data-value="0"]').first();
  await empty.click();
  await page.getByTestId('mode-corner').click();
  for (let n = 1; n <= 9; n++) await page.getByTestId(`key-${n}`).click();
  await page.getByTestId('mode-center').click();
  for (let n = 1; n <= 9; n++) await page.getByTestId(`key-${n}`).click();

  const result = await page.locator('.cell.selected').evaluate((el) => {
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

  // All 9 corner marks (incl. 5, which takes the chip's middle slot) and the
  // 8 remaining center marks = 17 digits, none overlapping or overflowing.
  expect(await page.locator('.cell.selected .corner-mark').count()).toBe(9);
  await expect(page.locator('.cell.selected .corner-mark[data-mark="5"]')).toBeVisible();
  expect(await page.locator('.cell.selected .center-mark').count()).toBe(8);
  expect(result.total).toBe(17);
  expect(result.outside).toBe(0);
  expect(result.overlaps).toBe(0);
});