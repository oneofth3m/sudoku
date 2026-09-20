import { ALL_NUMBERS, DIFFICULTIES, DIFFICULTY_LABELS, type Difficulty } from '../engine/types';
import type { InputMode } from '../state/types';

interface ToolbarProps {
  difficulty: Difficulty;
  onDifficultyChange: (d: Difficulty) => void;
  onNewGame: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  mode: InputMode;
  onModeChange: (m: InputMode) => void;
  onAutoFill: () => void;
  onClearInvalid: () => void;
  onClearCorners: () => void;
  onClearCenters: () => void;
  boardLink: string;
  copied: boolean;
  onCopyBoardLink: () => void;
}

const MODES: { id: InputMode; title: string; label?: string }[] = [
  { id: 'value', title: 'Value (V)', label: '1' },
  { id: 'corner', title: 'Corner marks (C)' },
  { id: 'center', title: 'Center marks (M)', label: '123' },
];

export function Toolbar({
  difficulty,
  onDifficultyChange,
  onNewGame,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  mode,
  onModeChange,
  onAutoFill,
  onClearInvalid,
  onClearCorners,
  onClearCenters,
  boardLink,
  copied,
  onCopyBoardLink,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-row">
        <select
          data-testid="difficulty"
          className="select"
          value={difficulty}
          onChange={(e) => onDifficultyChange(e.target.value as Difficulty)}
        >
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {DIFFICULTY_LABELS[d]}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn-primary" data-testid="new-game" onClick={onNewGame}>
          New game
        </button>
      </div>

      <div className="toolbar-row">
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
          <span className="mode-label">
            {mode === 'value' ? 'Value (V)' : mode === 'corner' ? 'Corner marks (C)' : 'Center marks (M)'}
          </span>
        </div>
      </div>

      <div className="toolbar-row wrap">
        <button type="button" className="btn" data-testid="undo" onClick={onUndo} disabled={!canUndo}>
          Undo
        </button>
        <button type="button" className="btn" data-testid="redo" onClick={onRedo} disabled={!canRedo}>
          Redo
        </button>
        <button type="button" className="btn" data-testid="auto-fill" onClick={onAutoFill}>
          Auto-fill 1-9
        </button>
        <button type="button" className="btn" data-testid="clear-invalid" onClick={onClearInvalid}>
          Clear invalid marks
        </button>
        <button type="button" className="btn" data-testid="clear-corners" onClick={onClearCorners}>
          Clear corner marks
        </button>
        <button type="button" className="btn" data-testid="clear-centers" onClick={onClearCenters}>
          Clear center marks
        </button>
      </div>

      <details className="board-link">
        <summary>Board link (debug)</summary>
        <div className="board-link-row">
          <input
            className="board-link-input"
            type="text"
            readOnly
            value={boardLink}
            data-testid="board-link"
            aria-label="Board link"
          />
          <button type="button" className="btn" data-testid="copy-board-link" onClick={onCopyBoardLink}>
            Copy
          </button>
          {copied && (
            <span className="copied-hint" data-testid="copied-hint">
              Copied ✓
            </span>
          )}
        </div>
        <p className="board-link-note">
          This link uniquely identifies the current board. Opening it loads the same puzzle
          (used for sharing and debugging).
        </p>
      </details>
    </div>
  );
}