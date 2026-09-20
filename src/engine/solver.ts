import type { Grid } from './types';

export function createEmptyGrid(): Grid {
  return Array.from({ length: 9 }, () => Array<number>(9).fill(0));
}

export function boxStart(row: number, col: number): [number, number] {
  return [Math.floor(row / 3) * 3, Math.floor(col / 3) * 3];
}

/** Whether `num` may legally be placed at (row, col) given the current grid. */
export function isValidPlacement(grid: Grid, row: number, col: number, num: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (grid[row][i] === num) return false;
    if (grid[i][col] === num) return false;
  }
  const [br, bc] = boxStart(row, col);
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if (grid[r][c] === num) return false;
    }
  }
  return true;
}

function findEmpty(grid: Grid): [number, number] | null {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) return [r, c];
    }
  }
  return null;
}

function solveInPlace(grid: Grid): boolean {
  const empty = findEmpty(grid);
  if (!empty) return true;
  const [r, c] = empty;
  for (let n = 1; n <= 9; n++) {
    if (isValidPlacement(grid, r, c, n)) {
      grid[r][c] = n;
      if (solveInPlace(grid)) return true;
      grid[r][c] = 0;
    }
  }
  return false;
}

/** Returns a completed grid, or null when the puzzle has no solution. Never mutates input. */
export function solve(grid: Grid): Grid | null {
  const copy = grid.map((row) => [...row]);
  return solveInPlace(copy) ? copy : null;
}

/** Counts solutions, stopping early once `limit` is reached. */
export function countSolutions(grid: Grid, limit = 2): number {
  const copy = grid.map((row) => [...row]);
  let found = 0;

  const search = (g: Grid): boolean => {
    const empty = findEmpty(g);
    if (!empty) {
      found++;
      return found >= limit;
    }
    const [r, c] = empty;
    for (let n = 1; n <= 9; n++) {
      if (isValidPlacement(g, r, c, n)) {
        g[r][c] = n;
        if (search(g)) return true;
        g[r][c] = 0;
      }
    }
    return false;
  };

  search(copy);
  return found;
}

export function hasUniqueSolution(grid: Grid): boolean {
  return countSolutions(grid, 2) === 1;
}

/**
 * Difficulty rating: the number of placement attempts a deterministic
 * backtracking solver makes before finding the solution. Higher means harder.
 */
export function countDecisionNodes(grid: Grid): number {
  const copy = grid.map((row) => [...row]);
  let nodes = 0;

  const search = (g: Grid): boolean => {
    const empty = findEmpty(g);
    if (!empty) return true;
    const [r, c] = empty;
    for (let n = 1; n <= 9; n++) {
      nodes++;
      if (isValidPlacement(g, r, c, n)) {
        g[r][c] = n;
        if (search(g)) return true;
        g[r][c] = 0;
      }
    }
    return false;
  };

  search(copy);
  return nodes;
}

export function isComplete(grid: Grid): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) return false;
    }
  }
  return true;
}

/** True when no row, column or box contains a repeated value. */
export function isValidGrid(grid: Grid): boolean {
  for (let i = 0; i < 9; i++) {
    const row = grid[i].filter((v) => v !== 0);
    if (new Set(row).size !== row.length) return false;

    const col: number[] = [];
    for (let j = 0; j < 9; j++) {
      const v = grid[j][i];
      if (v !== 0) col.push(v);
    }
    if (new Set(col).size !== col.length) return false;

    const br = Math.floor(i / 3) * 3;
    const bc = (i % 3) * 3;
    const box: number[] = [];
    for (let r = br; r < br + 3; r++) {
      for (let c = bc; c < bc + 3; c++) {
        const v = grid[r][c];
        if (v !== 0) box.push(v);
      }
    }
    if (new Set(box).size !== box.length) return false;
  }
  return true;
}

export function gridsEqual(a: Grid, b: Grid): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}

export function countGivens(grid: Grid): number {
  let n = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] !== 0) n++;
    }
  }
  return n;
}