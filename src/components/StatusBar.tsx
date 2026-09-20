import { formatTime } from '../state/format';

interface StatusBarProps {
  elapsed: number;
  moves: number;
  best: number | null;
}

export function StatusBar({ elapsed, moves, best }: StatusBarProps) {
  return (
    <div className="status">
      <div className="stat">
        <span className="stat-label">Time</span>
        <span className="stat-value" data-testid="timer">
          {formatTime(elapsed)}
        </span>
      </div>
      <div className="stat">
        <span className="stat-label">Moves</span>
        <span className="stat-value" data-testid="moves">
          {moves}
        </span>
      </div>
      <div className="stat">
        <span className="stat-label">Best</span>
        <span className="stat-value" data-testid="best">
          {best === null ? '—' : formatTime(best)}
        </span>
      </div>
    </div>
  );
}