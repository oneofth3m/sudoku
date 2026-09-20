import { formatTime } from '../state/format';
import { IconClock, IconSteps, IconTrophy } from './icons';

interface StatusBarProps {
  elapsed: number;
  moves: number;
  best: number | null;
}

export function StatusBar({ elapsed, moves, best }: StatusBarProps) {
  return (
    <div className="status">
      <div className="stat">
        <span className="stat-icon">
          <IconClock />
        </span>
        <span>
          <span className="stat-label">Time</span>
          <span className="stat-value" data-testid="timer">
            {formatTime(elapsed)}
          </span>
        </span>
      </div>
      <div className="stat">
        <span className="stat-icon">
          <IconSteps />
        </span>
        <span>
          <span className="stat-label">Moves</span>
          <span className="stat-value" data-testid="moves">
            {moves}
          </span>
        </span>
      </div>
      <div className="stat">
        <span className="stat-icon">
          <IconTrophy />
        </span>
        <span>
          <span className="stat-label">Best</span>
          <span className="stat-value" data-testid="best">
            {best === null ? '—' : formatTime(best)}
          </span>
        </span>
      </div>
    </div>
  );
}