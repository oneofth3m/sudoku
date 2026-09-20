import { ALL_NUMBERS } from '../engine/types';
import type { InputMode } from '../state/types';

interface KeypadProps {
  mode: InputMode;
  /** remaining[n] = how many more of digit n must still be placed (index 1..9). */
  remaining: number[];
  onDigit: (n: number) => void;
  onErase: () => void;
}

export function Keypad({ mode, remaining, onDigit, onErase }: KeypadProps) {
  return (
    <div className="keypad">
      <div className="keypad-grid">
        {ALL_NUMBERS.map((n) => (
          <button
            key={n}
            type="button"
            className={remaining[n] === 0 ? 'key key-num-btn zero-remaining' : 'key key-num-btn'}
            data-testid={`key-${n}`}
            onClick={() => onDigit(n)}
          >
            <span className="key-num">{n}</span>
            <span className="key-remaining" data-testid={`remaining-${n}`}>
              {remaining[n]}
            </span>
          </button>
        ))}
        <button type="button" className="key key-erase" data-testid="erase" onClick={onErase}>
          ✕
        </button>
      </div>
      <p className="keypad-hint">
        {mode === 'value'
          ? 'Fills the selected cell (V)'
          : mode === 'corner'
            ? 'Toggles a corner mark (C)'
            : 'Toggles a center mark (M)'}
      </p>
    </div>
  );
}