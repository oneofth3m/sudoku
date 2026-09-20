import type { Cell, Difficulty, Grid } from '../engine/types';

export type InputMode = 'value' | 'corner' | 'center';

export interface Selection {
  row: number;
  col: number;
}

export interface GameState {
  gameId: number;
  difficulty: Difficulty;
  cells: Cell[][];
  solution: Grid;
  status: 'playing' | 'won';
  mode: InputMode;
  selected: Selection | null;
  moves: number;
  elapsed: number;
  /** Undo stack: past boards (oldest first). */
  history: Cell[][][];
  /** Redo stack: boards undone away from (most recent undone first). */
  future: Cell[][][];
}

/** Maximum number of undo snapshots kept. */
export const HISTORY_LIMIT = 200;

/** Base64-safe path for e2e puzzle injection via location hash (`#puzzle=...`). */
export const PUZZLE_HASH_PREFIX = 'puzzle=';