export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

export const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  expert: 'Expert',
};

/** A single board cell. `value` 0 means empty. */
export interface Cell {
  value: number;
  isGiven: boolean;
  /** Small "corner" pencil marks. */
  cornerMarks: Set<number>;
  /** Large "center" marks. */
  centerMarks: Set<number>;
}

/** A 9x9 grid of numbers; 0 represents an empty cell. */
export type Grid = number[][];

export const ALL_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;