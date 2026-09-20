import { describe, expect, it } from 'vitest';
import {
  countDecisionNodes,
  countGivens,
  countSolutions,
  createEmptyGrid,
  gridsEqual,
  hasUniqueSolution,
  isComplete,
  isValidGrid,
  isValidPlacement,
  solve,
} from './solver';
import { generateCompletedGrid } from './generator';
import { mulberry32 } from './rng';

// Classic puzzle (Wikipedia) with a well-known unique solution.
const WIKI_PUZZLE = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9],
];

const WIKI_SOLUTION = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

describe('isValidPlacement', () => {
  it('rejects duplicates in the same row', () => {
    const grid = createEmptyGrid();
    grid[0][0] = 5;
    expect(isValidPlacement(grid, 0, 4, 5)).toBe(false);
  });

  it('rejects duplicates in the same column', () => {
    const grid = createEmptyGrid();
    grid[3][2] = 7;
    expect(isValidPlacement(grid, 6, 2, 7)).toBe(false);
  });

  it('rejects duplicates in the same box', () => {
    const grid = createEmptyGrid();
    grid[1][1] = 4;
    expect(isValidPlacement(grid, 2, 0, 4)).toBe(false);
  });

  it('accepts a fresh number', () => {
    const grid = createEmptyGrid();
    expect(isValidPlacement(grid, 4, 4, 9)).toBe(true);
  });
});

describe('solve', () => {
  it('solves the Wikipedia puzzle to its known solution', () => {
    const result = solve(WIKI_PUZZLE);
    expect(result).not.toBeNull();
    expect(gridsEqual(result!, WIKI_SOLUTION)).toBe(true);
  });

  it('returns null for an unsolvable board', () => {
    const bad = WIKI_PUZZLE.map((row) => [...row]);
    bad[0][0] = 5;
    bad[0][1] = 5; // duplicate 5 in row 0
    expect(solve(bad)).toBeNull();
  });

  it('does not mutate its input', () => {
    const input = WIKI_PUZZLE.map((row) => [...row]);
    const snapshot = input.map((row) => [...row]);
    solve(input);
    expect(input).toEqual(snapshot);
  });
});

describe('countSolutions / uniqueness', () => {
  it('counts one solution for a complete grid', () => {
    expect(countSolutions(WIKI_SOLUTION, 2)).toBe(1);
  });

  it('finds a single completion when one cell is empty', () => {
    const grid = WIKI_SOLUTION.map((row) => [...row]);
    grid[4][4] = 0;
    expect(countSolutions(grid, 2)).toBe(1);
  });

  it('stops counting at the limit for heavily under-specified grids', () => {
    expect(countSolutions(createEmptyGrid(), 2)).toBe(2);
  });

  it('hasUniqueSolution agrees with the solver for the wiki puzzle', () => {
    expect(hasUniqueSolution(WIKI_PUZZLE)).toBe(true);
  });

  it('reports a non-unique grid', () => {
    const grid = createEmptyGrid();
    grid[0][0] = 1;
    grid[0][1] = 2;
    grid[0][2] = 3;
    expect(hasUniqueSolution(grid)).toBe(false);
  });
});

describe('countDecisionNodes', () => {
  it('is deterministic and positive for a puzzlish grid', () => {
    const a = countDecisionNodes(WIKI_PUZZLE);
    const b = countDecisionNodes(WIKI_PUZZLE);
    expect(a).toBeGreaterThan(0);
    expect(a).toBe(b);
  });
});

describe('grid helpers', () => {
  it('isValidGrid accepts complete and partial valid grids', () => {
    expect(isValidGrid(WIKI_SOLUTION)).toBe(true);
    expect(isValidGrid(WIKI_PUZZLE)).toBe(true);
  });

  it('isValidGrid rejects conflicting grids', () => {
    const bad = WIKI_SOLUTION.map((row) => [...row]);
    bad[0][0] = bad[0][1]; // duplicate within row 0
    expect(isValidGrid(bad)).toBe(false);
  });

  it('isComplete reflects completion', () => {
    expect(isComplete(WIKI_SOLUTION)).toBe(true);
    const partial = WIKI_SOLUTION.map((row) => [...row]);
    partial[7][7] = 0;
    expect(isComplete(partial)).toBe(false);
  });

  it('countGivens ignores empty cells', () => {
    expect(countGivens(WIKI_PUZZLE)).toBe(30);
    expect(countGivens(WIKI_SOLUTION)).toBe(81);
  });

  it('generated grids are complete and valid', () => {
    for (const seed of [1, 2, 3]) {
      const grid = generateCompletedGrid(mulberry32(seed));
      expect(isValidGrid(grid)).toBe(true);
      expect(isComplete(grid)).toBe(true);
    }
  });
});