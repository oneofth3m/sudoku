import { describe, expect, it } from 'vitest';
import { createCells } from './cells';
import type { Grid } from './types';
import {
  clearCenterMarks,
  clearCornerMarks,
  clearInvalidMarks,
  fillAllCenterMarks,
  isMarkInvalid,
  removeMarkFromPeers,
  resolvedNumbers,
} from './marks';

/** A tiny grid with values at (0,0)=5, (0,1)=6, (1,0)=7, (2,2)=8, (4,4)=9. */
function fixtureGrid(): Grid {
  const grid = Array.from({ length: 9 }, () => Array<number>(9).fill(0));
  grid[0][0] = 5;
  grid[0][1] = 6;
  grid[1][0] = 7;
  grid[2][2] = 8;
  grid[4][4] = 9;
  return grid;
}

describe('resolvedNumbers', () => {
  it('collects values from a row, column and box', () => {
    const cells = createCells(fixtureGrid());
    // (0,2): row 0 has 5,6; box 0 has 5,6,7,8 => {5,6,7,8}
    expect([...resolvedNumbers(cells, 0, 2)].sort()).toEqual([5, 6, 7, 8]);
    // (4,4): it holds the 9 itself; peers contain nothing else.
    expect([...resolvedNumbers(cells, 4, 4)]).toEqual([]);
    // (7,7): no values anywhere in its units.
    expect([...resolvedNumbers(cells, 7, 7)]).toEqual([]);
  });
});

describe('isMarkInvalid', () => {
  it('flags marks already resolved in the unit', () => {
    const cells = createCells(fixtureGrid());
    expect(isMarkInvalid(cells, 0, 2, 5)).toBe(true);
    expect(isMarkInvalid(cells, 0, 2, 6)).toBe(true);
    expect(isMarkInvalid(cells, 0, 2, 3)).toBe(false);
    expect(isMarkInvalid(cells, 7, 7, 1)).toBe(false);
  });
});

describe('fillAllCenterMarks', () => {
  it('fills every empty cell with 1..9 center marks and leaves values alone', () => {
    const cells = createCells(fixtureGrid());
    const next = fillAllCenterMarks(cells);
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (fixtureGrid()[r][c] === 0) {
          expect(next[r][c].centerMarks.size).toBe(9);
          for (let n = 1; n <= 9; n++) expect(next[r][c].centerMarks.has(n)).toBe(true);
        } else {
          expect(next[r][c].centerMarks.size).toBe(0);
          expect(next[r][c].value).toBe(fixtureGrid()[r][c]);
        }
      }
    }
  });

  it('does not mutate the input board', () => {
    const cells = createCells(fixtureGrid());
    fillAllCenterMarks(cells);
    expect(cells[0][2].centerMarks.size).toBe(0);
  });
});

describe('clearInvalidMarks', () => {
  it('removes exactly the invalid marks and keeps valid ones', () => {
    const cells = createCells(fixtureGrid());
    // (0,2): resolved {5,6,7,8}; give it every mark (center + corner).
    for (let n = 1; n <= 9; n++) {
      cells[0][2].centerMarks.add(n);
      cells[0][2].cornerMarks.add(n);
    }
    // (4,4) holds the value 9 itself, so its marks would be ignored.
    // (7,7): nothing resolved; all marks valid.
    for (let n = 1; n <= 9; n++) cells[7][7].centerMarks.add(n);

    const { cells: next, removed } = clearInvalidMarks(cells);

    // (0,2): invalid {5,6,7,8} removed from both types -> 4 + 4 removals.
    expect([...next[0][2].centerMarks].sort()).toEqual([1, 2, 3, 4, 9]);
    expect([...next[0][2].cornerMarks].sort()).toEqual([1, 2, 3, 4, 9]);
    // (7,7): untouched.
    expect(next[7][7].centerMarks.size).toBe(9);
    expect(removed).toBe(8);
  });

  it('returns a zero removal count when there is nothing to clear', () => {
    const cells = createCells(fixtureGrid());
    cells[7][7].centerMarks.add(1);
    const { removed } = clearInvalidMarks(cells);
    expect(removed).toBe(0);
  });
});

describe('removeMarkFromPeers', () => {
  it('removes a number from row, column and box peers only', () => {
    const cells = createCells(fixtureGrid());
    for (const coord of [
      [0, 3],
      [3, 0],
      [1, 1],
      [6, 6],
    ] as const) {
      cells[coord[0]][coord[1]].centerMarks.add(5);
      cells[coord[0]][coord[1]].cornerMarks.add(5);
    }
    removeMarkFromPeers(cells, 0, 0, 5);
    expect(cells[0][3].centerMarks.has(5)).toBe(false); // row peer
    expect(cells[3][0].cornerMarks.has(5)).toBe(false); // column peer
    expect(cells[1][1].centerMarks.has(5)).toBe(false); // box peer
    expect(cells[6][6].centerMarks.has(5)).toBe(true); // unrelated cell keeps its mark
    expect(cells[6][6].cornerMarks.has(5)).toBe(true);
  });
});

describe('clearCornerMarks / clearCenterMarks', () => {
  it('clears every corner mark but leaves center marks and values alone', () => {
    const cells = createCells(fixtureGrid());
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (cells[r][c].value === 0) {
          cells[r][c].cornerMarks.add(((r + c) % 9) + 1);
          cells[r][c].centerMarks.add(((r * 7 + c) % 9) + 1);
        }
      }
    }
    // A given cell keeps its value.
    expect(cells[0][0].value).toBe(5);

    const { cells: cleared, removed } = clearCornerMarks(cells);
    expect(removed).toBeGreaterThan(0);
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        expect(cleared[r][c].cornerMarks.size).toBe(0);
        expect(cleared[r][c].centerMarks.size === cells[r][c].centerMarks.size).toBe(true);
        expect(cleared[r][c].value).toBe(cells[r][c].value);
      }
    }
    // Does not mutate the input board.
    expect(cells[0][0].cornerMarks.size).toBe(0); // given cell has no corner mark anyway
    expect(cells[0][3].cornerMarks.size).toBe(1);
  });

  it('clears every center mark but leaves corner marks alone', () => {
    const cells = createCells(fixtureGrid());
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (cells[r][c].value === 0) {
          cells[r][c].cornerMarks.add(((r + c) % 9) + 1);
          cells[r][c].centerMarks.add(((r * 7 + c) % 9) + 1);
        }
      }
    }
    const { cells: cleared, removed } = clearCenterMarks(cells);
    expect(removed).toBeGreaterThan(0);
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        expect(cleared[r][c].centerMarks.size).toBe(0);
        expect(cleared[r][c].cornerMarks.size).toBe(cells[r][c].cornerMarks.size);
      }
    }
  });

  it('reports zero removed when there is nothing to clear', () => {
    const cells = createCells(fixtureGrid());
    expect(clearCornerMarks(cells).removed).toBe(0);
    expect(clearCenterMarks(cells).removed).toBe(0);
  });
});