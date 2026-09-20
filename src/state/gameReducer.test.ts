import { describe, expect, it } from 'vitest';
import { createCells, cellsEqual, toGrid } from '../engine/cells';
import { generateCompletedGrid } from '../engine/generator';
import { mulberry32 } from '../engine/rng';
import { gridsEqual } from '../engine/solver';
import type { Grid } from '../engine/types';
import { gameReducer } from './gameReducer';
import { HISTORY_LIMIT, type GameState } from './types';

type Coord = [number, number];

const SEED = 42;

function makeState(holes: Coord[]): { state: GameState; solution: Grid } {
  const solution = generateCompletedGrid(mulberry32(SEED));
  const puzzle = solution.map((row) => [...row]);
  for (const [r, c] of holes) puzzle[r][c] = 0;

  const state: GameState = {
    gameId: 1,
    difficulty: 'easy',
    cells: createCells(puzzle),
    solution,
    status: 'playing',
    mode: 'value',
    selected: null,
    moves: 0,
    elapsed: 0,
    history: [],
    future: [],
  };
  return { state, solution };
}

// Holes used by most tests.
const HOLES: Coord[] = [
  [0, 0],
  [0, 1],
  [1, 1],
  [8, 8],
];

function select(state: GameState, row: number, col: number): GameState {
  return gameReducer(state, { type: 'SELECT', row, col });
}

function setValue(state: GameState, value: number): GameState {
  return gameReducer(state, { type: 'SET_VALUE', value });
}

function valueAt(state: GameState, row: number, col: number): number {
  return state.cells[row][col].value;
}

describe('setup', () => {
  it('fixture has the expected holes and givens', () => {
    const { state, solution } = makeState(HOLES);
    expect(state.cells[0][0].isGiven).toBe(false);
    expect(state.cells[0][2].isGiven).toBe(true);
    expect(state.cells[0][2].value).toBe(solution[0][2]);
    expect(state.status).toBe('playing');
    expect(state.moves).toBe(0);
    expect(state.history).toEqual([]);
  });
});

describe('SET_VALUE', () => {
  it('places a value, clears the cell marks and records history', () => {
    let state = makeState(HOLES).state;
    state = select(state, 0, 0);
    state.cells[0][0].centerMarks = new Set([1, 2, 3]);
    state = setValue(state, 5);
    expect(valueAt(state, 0, 0)).toBe(5);
    expect(state.cells[0][0].centerMarks.size).toBe(0);
    expect(state.cells[0][0].cornerMarks.size).toBe(0);
    expect(state.moves).toBe(1);
    expect(state.history.length).toBe(1);
  });

  it('performs auto-pencil: removes the placed number from peer marks', () => {
    // Holes along (0,0)'s row, column and box, plus an unrelated empty cell.
    const peerHoles: Coord[] = [
      [0, 0],
      [0, 1],
      [1, 1],
      [3, 0],
      [8, 8],
    ];
    const { state: base } = makeState(peerHoles);
    let state = base;
    for (const [r, c] of [[0, 1], [3, 0], [1, 1], [8, 8]] as const) {
      state = gameReducer(state, { type: 'SELECT', row: r, col: c });
      state = gameReducer(state, { type: 'SET_MODE', mode: 'center' });
      state = gameReducer(state, { type: 'TOGGLE_MARK', mark: 5 });
    }
    // (0,1) row peer, (3,0) col peer, (1,1) box peer all carry center mark 5.
    expect(state.cells[0][1].centerMarks.has(5)).toBe(true);
    expect(state.cells[3][0].centerMarks.has(5)).toBe(true);
    expect(state.cells[1][1].centerMarks.has(5)).toBe(true);
    expect(state.cells[8][8].centerMarks.has(5)).toBe(true);

    state = select(state, 0, 0);
    state = setValue(state, 5);
    expect(state.cells[0][1].centerMarks.has(5)).toBe(false);
    expect(state.cells[3][0].centerMarks.has(5)).toBe(false);
    expect(state.cells[1][1].centerMarks.has(5)).toBe(false);
    expect(state.cells[8][8].centerMarks.has(5)).toBe(true);
  });

  it('ignores attempts to change given cells', () => {
    const { state: base, solution } = makeState(HOLES);
    let state = select(base, 0, 2); // given cell
    state = setValue(state, 9);
    expect(valueAt(state, 0, 2)).toBe(solution[0][2]);
    expect(state.moves).toBe(0);
    expect(state.history.length).toBe(0);
  });

  it('ignores re-filling the same value and requires a selection', () => {
    const { state } = makeState(HOLES);
    // No selection -> no-op (same state reference).
    const noSelection = setValue(state, 5);
    expect(noSelection).toBe(state);
    // Setting the same value twice -> second call is a no-op.
    let s = select(state, 0, 0);
    s = setValue(s, 1);
    expect(valueAt(s, 0, 0)).toBe(1);
    const afterFirstSet = s;
    s = setValue(s, 1);
    expect(s).toBe(afterFirstSet);
    expect(s.moves).toBe(1);
  });

  it('allows mistakes (conflicting values) without declaring a win', () => {
    const { state: base, solution } = makeState(HOLES);
    const conflicting = solution[0][2]; // already a given in row 0
    let state = select(base, 0, 0);
    state = setValue(state, conflicting);
    expect(valueAt(state, 0, 0)).toBe(conflicting);
    expect(state.status).toBe('playing');
  });
});

describe('TOGGLE_MARK', () => {
  it('toggles corner marks in corner mode', () => {
    const { state: base } = makeState(HOLES);
    let state = gameReducer(base, { type: 'SET_MODE', mode: 'corner' });
    state = select(state, 0, 0);
    state = gameReducer(state, { type: 'TOGGLE_MARK', mark: 4 });
    expect(state.cells[0][0].cornerMarks.has(4)).toBe(true);
    state = gameReducer(state, { type: 'TOGGLE_MARK', mark: 4 });
    expect(state.cells[0][0].cornerMarks.has(4)).toBe(false);
    expect(state.moves).toBe(2);
  });

  it('toggles center marks in center mode', () => {
    const { state: base } = makeState(HOLES);
    let state = gameReducer(base, { type: 'SET_MODE', mode: 'center' });
    state = select(state, 8, 8);
    state = gameReducer(state, { type: 'TOGGLE_MARK', mark: 7 });
    expect(state.cells[8][8].centerMarks.has(7)).toBe(true);
    expect(state.cells[8][8].cornerMarks.has(7)).toBe(false);
  });

  it('ignores marks on given or filled cells', () => {
    const { state: base } = makeState(HOLES);
    let state = gameReducer(base, { type: 'SET_MODE', mode: 'corner' });
    state = select(state, 0, 2); // given
    state = gameReducer(state, { type: 'TOGGLE_MARK', mark: 3 });
    expect(state.cells[0][2].cornerMarks.size).toBe(0);
    expect(state.moves).toBe(0);
  });
});

describe('ERASE', () => {
  it('clears a value', () => {
    const { state: base } = makeState(HOLES);
    let state = select(base, 0, 0);
    state = setValue(state, 5);
    state = gameReducer(state, { type: 'ERASE' });
    expect(valueAt(state, 0, 0)).toBe(0);
    expect(state.moves).toBe(2);
  });

  it('clears marks when the cell has no value', () => {
    const { state: base } = makeState(HOLES);
    let state = gameReducer(base, { type: 'SET_MODE', mode: 'center' });
    state = select(state, 0, 0);
    state = gameReducer(state, { type: 'TOGGLE_MARK', mark: 5 });
    expect(state.cells[0][0].centerMarks.size).toBe(1);
    state = gameReducer(state, { type: 'ERASE' });
    expect(state.cells[0][0].centerMarks.size).toBe(0);
  });

  it('is a no-op on given cells', () => {
    const { state: base } = makeState(HOLES);
    const before = base.cells[0][2].value;
    const state = gameReducer(base, { type: 'ERASE' }); // no selection
    const selected = select(state, 0, 2);
    const after = gameReducer(selected, { type: 'ERASE' });
    expect(after.cells[0][2].value).toBe(before);
    expect(after.moves).toBe(0);
  });
});

describe('FILL_ALL_MARKS / CLEAR actions', () => {
  it('fills every empty cell with 1..9 center marks', () => {
    const { state: base } = makeState(HOLES);
    const state = gameReducer(base, { type: 'FILL_ALL_MARKS' });
    for (const [r, c] of HOLES) {
      expect(state.cells[r][c].centerMarks.size).toBe(9);
    }
    expect(state.cells[0][2].centerMarks.size).toBe(0);
    expect(state.moves).toBe(1);
  });

  it('clears invalid marks and keeps valid ones', () => {
    const { state: base } = makeState(HOLES);
    // Center mark equal to a value already resolved in (0,0)'s units.
    let state = gameReducer(base, { type: 'FILL_ALL_MARKS' });
    // Compute resolved numbers from the actual board (empty holes are 0).
    const gridBefore = toGrid(state.cells);
    const resolvedAt00 = new Set<number>();
    for (let i = 0; i < 9; i++) {
      if (gridBefore[0][i] !== 0) resolvedAt00.add(gridBefore[0][i]);
      if (gridBefore[i][0] !== 0) resolvedAt00.add(gridBefore[i][0]);
    }
    expect(resolvedAt00.size).toBeGreaterThan(0);
    const invalidMark = [...resolvedAt00][0];
    expect(state.cells[0][0].centerMarks.has(invalidMark)).toBe(true);

    state = gameReducer(state, { type: 'CLEAR_INVALID_MARKS' });
    expect(state.cells[0][0].centerMarks.has(invalidMark)).toBe(false);
    expect(state.cells[0][0].centerMarks.size).toBeLessThan(9);
    expect(state.moves).toBe(2);
  });

  it('CLEAR_INVALID_MARKS is a no-op when nothing is invalid', () => {
    const { state: base } = makeState(HOLES);
    const state = gameReducer(base, { type: 'CLEAR_INVALID_MARKS' });
    expect(state).toBe(base);
  });

  it('clears only the corner marks across the whole board', () => {
    const { state: base } = makeState(HOLES);
    // Add corner marks to every empty cell.
    let state = base;
    for (const [r, c] of HOLES) {
      state = gameReducer(state, { type: 'SELECT', row: r, col: c });
      state = gameReducer(state, { type: 'SET_MODE', mode: 'corner' });
      state = gameReducer(state, { type: 'TOGGLE_MARK', mark: ((r + c) % 9) + 1 });
    }
    expect(state.cells[HOLES[0][0]][HOLES[0][1]].cornerMarks.size).toBe(1);

    // Auto-fill adds center marks to the same cells.
    state = gameReducer(state, { type: 'FILL_ALL_MARKS' });
    expect(state.cells[HOLES[0][0]][HOLES[0][1]].centerMarks.size).toBe(9);

    const clear = gameReducer(state, { type: 'CLEAR_CORNER_MARKS' });
    for (const [r, c] of HOLES) {
      expect(clear.cells[r][c].cornerMarks.size).toBe(0);
      // Center marks are untouched.
      expect(clear.cells[r][c].centerMarks.size).toBe(9);
    }
    expect(clear.moves).toBe(state.moves + 1);
  });

  it('clears only the center marks across the whole board', () => {
    const { state: base } = makeState(HOLES);
    let state = gameReducer(base, { type: 'FILL_ALL_MARKS' });
    expect(state.cells[HOLES[0][0]][HOLES[0][1]].centerMarks.size).toBe(9);

    // One corner mark to verify it survives.
    state = gameReducer(state, { type: 'SELECT', row: HOLES[0][0], col: HOLES[0][1] });
    state = gameReducer(state, { type: 'SET_MODE', mode: 'corner' });
    state = gameReducer(state, { type: 'TOGGLE_MARK', mark: 7 });

    const clear = gameReducer(state, { type: 'CLEAR_CENTER_MARKS' });
    for (const [r, c] of HOLES) {
      expect(clear.cells[r][c].centerMarks.size).toBe(0);
    }
    expect(clear.cells[HOLES[0][0]][HOLES[0][1]].cornerMarks.has(7)).toBe(true);
    expect(clear.moves).toBe(state.moves + 1);

    // Both clears are undoable as a single step each.
    const undo = gameReducer(clear, { type: 'UNDO' });
    expect(undo.cells[HOLES[0][0]][HOLES[0][1]].centerMarks.size).toBe(9);
  });

  it('clear actions are no-ops when there is nothing to clear', () => {
    const { state: base } = makeState(HOLES);
    expect(gameReducer(base, { type: 'CLEAR_CORNER_MARKS' })).toBe(base);
    expect(gameReducer(base, { type: 'CLEAR_CENTER_MARKS' })).toBe(base);
  });

  it('clear actions are ignored after a win', () => {
    const { state: won } = makeState(HOLES);
    expect(gameReducer(won, { type: 'CLEAR_CORNER_MARKS' })).toBe(won);
    expect(gameReducer(won, { type: 'CLEAR_CENTER_MARKS' })).toBe(won);
  });
});

describe('UNDO / REDO', () => {
  it('undoes and redoes values', () => {
    const { state: base } = makeState(HOLES);
    let state = select(base, 0, 0);
    state = setValue(state, 1);
    state = select(state, 0, 1);
    state = setValue(state, 2);

    state = gameReducer(state, { type: 'UNDO' });
    expect(valueAt(state, 0, 1)).toBe(0);
    expect(valueAt(state, 0, 0)).toBe(1);

    state = gameReducer(state, { type: 'UNDO' });
    expect(valueAt(state, 0, 0)).toBe(0);

    state = gameReducer(state, { type: 'REDO' });
    expect(valueAt(state, 0, 0)).toBe(1);
    expect(valueAt(state, 0, 1)).toBe(0);
  });

  it('a new move clears the redo stack', () => {
    const { state: base } = makeState(HOLES);
    let state = select(base, 0, 0);
    state = setValue(state, 1);
    state = gameReducer(state, { type: 'UNDO' });
    expect(state.future.length).toBe(1);

    state = select(state, 8, 8);
    state = setValue(state, 3);
    expect(state.future.length).toBe(0);
    state = gameReducer(state, { type: 'REDO' });
    expect(valueAt(state, 0, 0)).toBe(0);
    expect(valueAt(state, 8, 8)).toBe(3);
  });

  it('undo preserves marks', () => {
    const { state: base } = makeState(HOLES);
    let state = gameReducer(base, { type: 'SET_MODE', mode: 'corner' });
    state = select(state, 1, 1);
    state = gameReducer(state, { type: 'TOGGLE_MARK', mark: 9 });
    expect(state.cells[1][1].cornerMarks.has(9)).toBe(true);
    state = gameReducer(state, { type: 'UNDO' });
    expect(state.cells[1][1].cornerMarks.has(9)).toBe(false);
    state = gameReducer(state, { type: 'REDO' });
    expect(state.cells[1][1].cornerMarks.has(9)).toBe(true);
  });

  it('caps history at HISTORY_LIMIT', () => {
    const { state: base } = makeState(HOLES);
    let state = select(base, 8, 8);
    for (let i = 0; i < HISTORY_LIMIT + 20; i++) {
      state = setValue(state, i % 2 === 0 ? 1 : 2);
    }
    expect(state.moves).toBe(HISTORY_LIMIT + 20);
    expect(state.history.length).toBe(HISTORY_LIMIT);
    expect(valueAt(state, 8, 8)).toBe(2);
    state = gameReducer(state, { type: 'UNDO' });
    expect(valueAt(state, 8, 8)).toBe(1);
    expect(state.history.length).toBe(HISTORY_LIMIT - 1);
  });
});

describe('winning', () => {
  it('wins when the board matches the solution and locks further edits', () => {
    const { state: base, solution } = makeState([
      [0, 0],
      [8, 8],
    ]);
    let state = select(base, 0, 0);
    state = setValue(state, solution[0][0]);
    expect(state.status).toBe('playing');

    state = select(state, 8, 8);
    state = setValue(state, solution[8][8]);
    expect(state.status).toBe('won');
    expect(state.moves).toBe(2);
    expect(state.history.length).toBe(2);

    // No further mutations once won.
    const snapshot = gameReducer(state, { type: 'TICK', elapsed: 99 });
    const afterEdit = setValue(snapshot, 4);
    expect(afterEdit).toBe(snapshot);
    const afterUndo = gameReducer(snapshot, { type: 'UNDO' });
    expect(afterUndo).toBe(snapshot);
  });

  it('wins comparison is exact: a wrong value keeps the game playing', () => {
    const { state: base, solution } = makeState([
      [0, 0],
      [8, 8],
    ]);
    let state = select(base, 0, 0);
    state = setValue(state, solution[0][0]);
    state = select(state, 8, 8);
    const wrong = solution[8][8] === 9 ? 1 : solution[8][8] + 1;
    state = setValue(state, wrong);
    expect(state.status).toBe('playing');
  });
});

describe('misc actions', () => {
  it('ignores actions after a win', () => {
    const { state: base, solution } = makeState([
      [0, 0],
      [8, 8],
    ]);
    let won = select(base, 0, 0);
    won = setValue(won, solution[0][0]);
    won = select(won, 8, 8);
    won = setValue(won, solution[8][8]);
    expect(won.status).toBe('won');

    expect(gameReducer(won, { type: 'TOGGLE_MARK', mark: 1 })).toBe(won);
    expect(gameReducer(won, { type: 'ERASE' })).toBe(won);
    expect(gameReducer(won, { type: 'FILL_ALL_MARKS' })).toBe(won);
    expect(gameReducer(won, { type: 'CLEAR_INVALID_MARKS' })).toBe(won);
    expect(gameReducer(won, { type: 'REDO' })).toBe(won);
  });

  it('TOGGLE_MARK requires a selection', () => {
    const { state: base } = makeState(HOLES);
    const cornerMode = gameReducer(base, { type: 'SET_MODE', mode: 'corner' });
    expect(gameReducer(cornerMode, { type: 'TOGGLE_MARK', mark: 1 })).toBe(cornerMode);
  });

  it('ERASE is a no-op on an empty cell without marks', () => {
    const { state: base } = makeState(HOLES);
    const selected = select(base, 0, 0);
    expect(gameReducer(selected, { type: 'ERASE' })).toBe(selected);
  });

  it('FILL_ALL_MARKS is a no-op when every empty cell is already fully marked', () => {
    const { state: base } = makeState(HOLES);
    const filled = gameReducer(base, { type: 'FILL_ALL_MARKS' });
    const again = gameReducer(filled, { type: 'FILL_ALL_MARKS' });
    expect(again).toBe(filled);
    expect(again.moves).toBe(1);
  });

  it('SELECT moves the selection', () => {
    const { state: base } = makeState(HOLES);
    const state = select(base, 4, 5);
    expect(state.selected).toEqual({ row: 4, col: 5 });
  });

  it('SET_MODE switches input mode', () => {
    const { state: base } = makeState(HOLES);
    const state = gameReducer(base, { type: 'SET_MODE', mode: 'center' });
    expect(state.mode).toBe('center');
  });

  it('TICK records elapsed time without touching history', () => {
    const { state: base } = makeState(HOLES);
    let state = select(base, 0, 0);
    state = setValue(state, 1);
    const history = state.history;
    state = gameReducer(state, { type: 'TICK', elapsed: 42 });
    expect(state.elapsed).toBe(42);
    expect(state.history).toEqual(history);
  });

  it('NEW_GAME resets the whole game', () => {
    const { state: base, solution } = makeState([
      [0, 0],
      [8, 8],
    ]);
    let state = select(base, 0, 0);
    state = setValue(state, solution[0][0]);

    const { state: freshState, solution: freshSolution } = makeState(HOLES);
    state = gameReducer(state, {
      type: 'NEW_GAME',
      gameId: 2,
      difficulty: 'hard',
      cells: freshState.cells,
      solution: freshSolution,
    });
    expect(state.gameId).toBe(2);
    expect(state.difficulty).toBe('hard');
    expect(state.moves).toBe(0);
    expect(state.elapsed).toBe(0);
    expect(state.history).toEqual([]);
    expect(state.future).toEqual([]);
    expect(state.status).toBe('playing');
    expect(cellsEqual(state.cells, freshState.cells)).toBe(true);
    expect(gridsEqual(state.solution, freshSolution)).toBe(true);
  });
});