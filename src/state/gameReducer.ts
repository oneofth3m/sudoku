import type { Cell, Grid } from '../engine/types';
import { cellsEqual, cloneCells, toGrid } from '../engine/cells';
import {
  clearCenterMarks,
  clearCornerMarks,
  clearInvalidMarks,
  fillAllCenterMarks,
  removeMarkFromPeers,
} from '../engine/marks';
import { gridsEqual } from '../engine/solver';
import { HISTORY_LIMIT, type GameState, type InputMode } from './types';

export type GameAction =
  | { type: 'NEW_GAME'; gameId: number; difficulty: GameState['difficulty']; cells: Cell[][]; solution: Grid }
  | { type: 'SELECT'; row: number; col: number }
  | { type: 'SET_MODE'; mode: InputMode }
  | { type: 'SET_VALUE'; value: number }
  | { type: 'TOGGLE_MARK'; mark: number }
  | { type: 'ERASE' }
  | { type: 'FILL_ALL_MARKS' }
  | { type: 'CLEAR_INVALID_MARKS' }
  | { type: 'CLEAR_CORNER_MARKS' }
  | { type: 'CLEAR_CENTER_MARKS' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'TICK'; elapsed: number };

/** Pushes the current board onto the undo history and applies the new one. */
function withHistory(state: GameState, cells: Cell[][], won = false): GameState {
  const history = [...state.history, cloneCells(state.cells)];
  if (history.length > HISTORY_LIMIT) history.shift();
  return {
    ...state,
    cells,
    history,
    future: [],
    moves: state.moves + 1,
    status: won ? 'won' : state.status,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'NEW_GAME':
      return {
        ...state,
        gameId: action.gameId,
        difficulty: action.difficulty,
        cells: action.cells,
        solution: action.solution,
        status: 'playing',
        selected: null,
        moves: 0,
        elapsed: 0,
        history: [],
        future: [],
      };

    case 'SELECT':
      return { ...state, selected: { row: action.row, col: action.col } };

    case 'SET_MODE':
      return { ...state, mode: action.mode };

    case 'TICK':
      return { ...state, elapsed: action.elapsed };

    case 'SET_VALUE': {
      if (state.status === 'won') return state;
      const sel = state.selected;
      if (!sel) return state;
      const cur = state.cells[sel.row][sel.col];
      if (cur.isGiven || cur.value === action.value) return state;
      const cells = cloneCells(state.cells);
      const cell = cells[sel.row][sel.col];
      cell.value = action.value;
      cell.cornerMarks.clear();
      cell.centerMarks.clear();
      removeMarkFromPeers(cells, sel.row, sel.col, action.value);
      const won = gridsEqual(toGrid(cells), state.solution);
      return withHistory(state, cells, won);
    }

    case 'TOGGLE_MARK': {
      if (state.status === 'won') return state;
      const sel = state.selected;
      if (!sel) return state;
      const cur = state.cells[sel.row][sel.col];
      if (cur.isGiven || cur.value !== 0) return state;
      const cells = cloneCells(state.cells);
      const cell = cells[sel.row][sel.col];
      const set = state.mode === 'corner' ? cell.cornerMarks : cell.centerMarks;
      if (set.has(action.mark)) set.delete(action.mark);
      else set.add(action.mark);
      return withHistory(state, cells);
    }

    case 'ERASE': {
      if (state.status === 'won') return state;
      const sel = state.selected;
      if (!sel) return state;
      const cur = state.cells[sel.row][sel.col];
      if (cur.isGiven) return state;
      const cells = cloneCells(state.cells);
      const cell = cells[sel.row][sel.col];
      if (cell.value !== 0) {
        cell.value = 0;
      } else {
        if (cell.cornerMarks.size === 0 && cell.centerMarks.size === 0) return state;
        cell.cornerMarks.clear();
        cell.centerMarks.clear();
      }
      return withHistory(state, cells);
    }

    case 'FILL_ALL_MARKS': {
      if (state.status === 'won') return state;
      const cells = fillAllCenterMarks(state.cells);
      return cellsEqual(state.cells, cells) ? state : withHistory(state, cells);
    }

    case 'CLEAR_INVALID_MARKS': {
      if (state.status === 'won') return state;
      const { cells, removed } = clearInvalidMarks(state.cells);
      return removed === 0 ? state : withHistory(state, cells);
    }

    case 'CLEAR_CORNER_MARKS': {
      if (state.status === 'won') return state;
      const { cells, removed } = clearCornerMarks(state.cells);
      return removed === 0 ? state : withHistory(state, cells);
    }

    case 'CLEAR_CENTER_MARKS': {
      if (state.status === 'won') return state;
      const { cells, removed } = clearCenterMarks(state.cells);
      return removed === 0 ? state : withHistory(state, cells);
    }

    case 'UNDO': {
      if (state.status === 'won' || state.history.length === 0) return state;
      const cells = state.history[state.history.length - 1];
      return {
        ...state,
        cells,
        history: state.history.slice(0, -1),
        future: [cloneCells(state.cells), ...state.future],
      };
    }

    case 'REDO': {
      if (state.status === 'won' || state.future.length === 0) return state;
      const cells = state.future[0];
      return {
        ...state,
        cells,
        future: state.future.slice(1),
        history: [...state.history, cloneCells(state.cells)],
      };
    }
  }
}