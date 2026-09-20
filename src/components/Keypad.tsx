import { ALL_NUMBERS } from '../engine/types';
import type { InputMode } from '../state/types';
import { IconBackspace } from './icons';

interface KeypadProps {
  mode: InputMode;
  /** remaining[n] = how many more of digit n must still be placed (index 1..9). */
  remaining: number[];
  onDigit: (n: number) => void;
  onErase: () => void;
  onModeChange: (m: InputMode) => void;
}

const MODES: { id: InputMode; title: string; label?: string }[] = [
  { id: 'value', title: 'Value (V)', label: '1' },
  { id: 'corner', title: 'Corner marks (C)' },
  { id: 'center', title: 'Center marks (M)', label: '123' },
];

export function Keypad({ mode, remaining, onDigit, onErase, onModeChange }: KeypadProps) {
  return (
    <div className="keypad">
      <div className="mode-toggle" role="group" aria-label="Input mode">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={mode === m.id ? 'mode-btn active' : 'mode-btn'}
            data-testid={`mode-${m.id}`}
            onClick={() => onModeChange(m.id)}
            title={m.title}
            aria-pressed={mode === m.id}
          >
            {m.id === 'corner' ? (
              <span className="mini-grid" aria-hidden="true">
                {ALL_NUMBERS.map((n) => (
                  <i key={n}>{n}</i>
                ))}
              </span>
            ) : (
              m.label
            )}
          </button>
        ))}
      </div>

      <div className="keypad-grid">
        {ALL_NUMBERS.map((n) => (
          <button
            key={n}
            type="button"
            className={remaining[n] === 0 ? 'key key-num zero' : 'key key-num'}
            data-testid={`key-${n}`}
            onClick={() => onDigit(n)}
            aria-label={`${n} (${remaining[n]} left)`}
          >
            <span className="key-digit">{n}</span>
            <span className="key-rem" data-testid={`remaining-${n}`}>
              {remaining[n]}
            </span>
          </button>
        ))}
        <button
          type="button"
          className="key key-erase"
          data-testid="erase"
          onClick={onErase}
          title="Erase (0 / Backspace / Delete)"
          aria-label="Erase"
        >
          <IconBackspace />
        </button>
      </div>

      <p className="keyboard-hint">1–9 enter · 0/⌫ erase · arrows move · V/C/M mode</p>
    </div>
  );
}