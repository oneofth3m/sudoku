import type { Cell, Grid } from './types';

export type Coord = [number, number];

/**
 * Precomputed peers (same row + column + box, excluding the cell itself) for
 * every cell, indexed by `row * 9 + col`.
 */
export const PEERS: Coord[][] = (() => {
  const result: Coord[][] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const set = new Set<string>();
      for (let i = 0; i < 9; i++) {
        set.add(`${r},${i}`);
        set.add(`${i},${c}`);
      }
      const br = Math.floor(r / 3) * 3;
      const bc = Math.floor(c / 3) * 3;
      for (let i = br; i < br + 3; i++) {
        for (let j = bc; j < bc + 3; j++) {
          set.add(`${i},${j}`);
        }
      }
      set.delete(`${r},${c}`);
      result.push([...set].map((s) => s.split(',').map(Number) as Coord));
    }
  }
  return result;
})();

export function emptyCell(): Cell {
  return { value: 0, isGiven: false, cornerMarks: new Set<number>(), centerMarks: new Set<number>() };
}

/** Converts a numeric grid into cells; non-zero cells become givens. */
export function createCells(grid: Grid): Cell[][] {
  return grid.map((row) =>
    row.map((v) => ({
      value: v,
      isGiven: v !== 0,
      cornerMarks: new Set<number>(),
      centerMarks: new Set<number>(),
    })),
  );
}

export function toGrid(cells: Cell[][]): Grid {
  return cells.map((row) => row.map((c) => c.value));
}

export function cloneCells(cells: Cell[][]): Cell[][] {
  return cells.map((row) =>
    row.map((c) => ({
      value: c.value,
      isGiven: c.isGiven,
      cornerMarks: new Set(c.cornerMarks),
      centerMarks: new Set(c.centerMarks),
    })),
  );
}

export function cellsEqual(a: Cell[][], b: Cell[][]): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const x = a[r][c];
      const y = b[r][c];
      if (x.value !== y.value || x.isGiven !== y.isGiven) return false;
      if (x.cornerMarks.size !== y.cornerMarks.size) return false;
      if (x.centerMarks.size !== y.centerMarks.size) return false;
      for (const m of x.cornerMarks) {
        if (!y.cornerMarks.has(m)) return false;
      }
      for (const m of x.centerMarks) {
        if (!y.centerMarks.has(m)) return false;
      }
    }
  }
  return true;
}