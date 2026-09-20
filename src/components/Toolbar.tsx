import { DIFFICULTIES, DIFFICULTY_LABELS, type Difficulty } from '../engine/types';
import { IconAlert, IconCenter, IconCorners, IconPencil, IconRedo, IconRefresh, IconUndo } from './icons';

interface ToolbarProps {
  difficulty: Difficulty;
  onDifficultyChange: (d: Difficulty) => void;
  onNewGame: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onAutoFill: () => void;
  onClearInvalid: () => void;
  onClearCorners: () => void;
  onClearCenters: () => void;
}

interface ToolButtonProps {
  testId: string;
  label: string;
  title: string;
  disabled?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}

function ToolButton({ testId, label, title, disabled, onClick, icon }: ToolButtonProps) {
  return (
    <button
      type="button"
      className="icon-btn"
      data-testid={testId}
      title={title}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
    </button>
  );
}

export function Toolbar({
  difficulty,
  onDifficultyChange,
  onNewGame,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onAutoFill,
  onClearInvalid,
  onClearCorners,
  onClearCenters,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-row">
        <div className="segmented" role="group" aria-label="Difficulty" data-testid="difficulty">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              type="button"
              className={d === difficulty ? 'seg-btn active' : 'seg-btn'}
              data-testid={`difficulty-option-${d}`}
              aria-pressed={d === difficulty}
              onClick={() => onDifficultyChange(d)}
            >
              {DIFFICULTY_LABELS[d]}
            </button>
          ))}
        </div>

        <span className="toolbar-divider" aria-hidden="true" />

        <div className="toolbar-tools" role="group" aria-label="Game tools">
          <ToolButton
            testId="undo"
            label="Undo"
            title="Undo (Ctrl/⌘+Z)"
            disabled={!canUndo}
            onClick={onUndo}
            icon={<IconUndo />}
          />
          <ToolButton
            testId="redo"
            label="Redo"
            title="Redo (Ctrl/⌘+Shift+Z)"
            disabled={!canRedo}
            onClick={onRedo}
            icon={<IconRedo />}
          />
          <ToolButton
            testId="auto-fill"
            label="Auto-fill 1-9"
            title="Auto-fill 1-9 center marks"
            onClick={onAutoFill}
            icon={<IconPencil />}
          />
          <ToolButton
            testId="clear-invalid"
            label="Clear invalid marks"
            title="Clear invalid marks"
            onClick={onClearInvalid}
            icon={<IconAlert />}
          />
          <ToolButton
            testId="clear-corners"
            label="Clear corner marks"
            title="Clear corner marks"
            onClick={onClearCorners}
            icon={<IconCorners />}
          />
          <ToolButton
            testId="clear-centers"
            label="Clear center marks"
            title="Clear center marks"
            onClick={onClearCenters}
            icon={<IconCenter />}
          />
        </div>

        <span className="toolbar-spacer" aria-hidden="true" />

        <button type="button" className="btn btn-primary" data-testid="new-game" onClick={onNewGame}>
          <IconRefresh />
          <span>New game</span>
        </button>
      </div>
    </div>
  );
}