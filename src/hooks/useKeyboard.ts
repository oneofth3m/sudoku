import { useEffect } from 'react';
import type { InputMode, Selection } from '../state/types';

export interface UseKeyboardOptions {
  selected: Selection | null;
  onDigit: (n: number) => void;
  onErase: () => void;
  onMode: (mode: InputMode) => void;
  onMove: (row: number, col: number) => void;
}

const DIRECTION_KEYS: Record<string, [number, number]> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

/** Keyboard shortcuts for the input mode: V = value, C = corner, M = center. */
const MODE_KEYS: Record<string, InputMode> = {
  v: 'value',
  c: 'corner',
  m: 'center',
};

/**
 * Global keyboard controls: 1-9 digits, erase, arrow-key navigation and
 * V / C / M input-mode switching.
 */
export function useKeyboard({ selected, onDigit, onErase, onMode, onMove }: UseKeyboardOptions): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return;

      if (/^[1-9]$/.test(e.key)) {
        onDigit(Number(e.key));
        e.preventDefault();
        return;
      }
      if (e.key === '0' || e.key === 'Backspace' || e.key === 'Delete') {
        onErase();
        e.preventDefault();
        return;
      }
      const mode = MODE_KEYS[e.key.toLowerCase()];
      if (mode) {
        onMode(mode);
        e.preventDefault();
        return;
      }
      const dir = DIRECTION_KEYS[e.key];
      if (!dir || !selected) return;
      const row = Math.min(8, Math.max(0, selected.row + dir[0]));
      const col = Math.min(8, Math.max(0, selected.col + dir[1]));
      onMove(row, col);
      e.preventDefault();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selected, onDigit, onErase, onMode, onMove]);
}