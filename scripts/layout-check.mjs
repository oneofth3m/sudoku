import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const checks = [];

for (const viewport of [
  { width: 1280, height: 900 },
  { width: 390, height: 844 }, // mobile
]) {
  const page = await browser.newPage({ viewport });
  await page.goto('http://localhost:4173/');
  await page.waitForSelector('.cell');
  const info = await page.evaluate(() => {
    const board = document.querySelector('.board').getBoundingClientRect();
    const cells = document.querySelectorAll('.cell');
    const first = cells[0].getBoundingClientRect();
    const last = cells[cells.length - 1].getBoundingClientRect();
    const pageH = document.documentElement.scrollHeight;
    return {
      boardW: Math.round(board.width),
      boardH: Math.round(board.height),
      square: Math.abs(board.width - board.height) < 1,
      cellW: Math.round(first.width),
      cellH: Math.round(first.height),
      gridFits: last.right <= board.right + 1 && last.bottom <= board.bottom + 1,
      cells: cells.length,
      hScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      pageH,
    };
  });
  checks.push({ viewport, ...info });
  await page.close();
}
await browser.close();
console.log(JSON.stringify(checks, null, 2));