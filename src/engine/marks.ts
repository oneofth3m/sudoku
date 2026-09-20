import type { Cell } from './types';
import { cloneCells, PEERS } from './cells';

const ALL = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);

/** Numbers that already appear as values in this cell's row, column or box. */
export function resolvedNumbers(cells: Cell[][], row: number, col: number): Set<number> {
  const resolved = new Set<number>();
  for (const [r, c] of PEERS[row * 9 + col]) {
    const v = cells[r][c].value;
    if (v !== 0) resolved.add(v);
  }
  return resolved;
}

/** A mark is invalid when its number is already resolved in the cell's row/column/box. */
export function isMarkInvalid(cells: Cell[][], row: number, col: number, mark: number): boolean {
  return resolvedNumbers(cells, row, col).has(mark);
}

/** Sets every empty cell's center marks to 1..9. Returns a new board. */
export function fillAllCenterMarks(cells: Cell[][]): Cell[][] {
  const next = cloneCells(cells);
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (next[r][c].value === 0) {
        next[r][c].centerMarks = new Set(ALL);
      }
    }
  }
  return next;
}

/** Removes every invalid mark from every cell. Returns the new board and a removed count. */
export function clearInvalidMarks(cells: Cell[][]): { cells: Cell[][]; removed: number } {
  const next = cloneCells(cells);
  let removed = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = next[r][c];
      if (cell.value !== 0) continue;
      const resolved = resolvedNumbers(cells, r, c);
      for (const m of [...cell.centerMarks]) {
        if (resolved.has(m)) {
          cell.centerMarks.delete(m);
          removed++;
        }
      }
      for (const m of [...cell.cornerMarks]) {
        if (resolved.has(m)) {
          cell.cornerMarks.delete(m);
          removed++;
        }
      }
    }
  }
  return { cells: next, removed };
}

function clearMarksOfKind(cells: Cell[][], key: 'cornerMarks' | 'centerMarks'): { cells: Cell[][]; removed: number } {
  const next = cloneCells(cells);
  let removed = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      removed += next[r][c][key].size;
      next[r][c][key].clear();
    }
  }
  return { cells: next, removed };
}

/** Removes every corner mark from every cell. Returns the new board and a removed count. */
export function clearCornerMarks(cells: Cell[][]): { cells: Cell[][]; removed: number } {
  return clearMarksOfKind(cells, 'cornerMarks');
}

/** Removes every center mark from every cell. Returns the new board and a removed count. */
export function clearCenterMarks(cells: Cell[][]): { cells: Cell[][]; removed: number } {
  return clearMarksOfKind(cells, 'centerMarks');
}

/** Removes `num` from the marks of every peer of (row, col). Mutates in place. */
export function removeMarkFromPeers(cells: Cell[][], row: number, col: number, num: number): void {
  for (const [r, c] of PEERS[row * 9 + col]) {
    cells[r][c].cornerMarks.delete(num);
    cells[r][c].centerMarks.delete(num);
  }
}