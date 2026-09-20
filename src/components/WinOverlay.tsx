import { formatTime } from '../state/format';

interface WinOverlayProps {
  time: number;
  moves: number;
  best: number | null;
  onNewGame: () => void;
}

export function WinOverlay({ time, moves, best, onNewGame }: WinOverlayProps) {
  return (
    <div className="overlay" data-testid="win-overlay">
      <div className="overlay-card">
        <h2 className="overlay-title">Solved! 🎉</h2>
        <dl className="overlay-stats">
          <div>
            <dt>Time</dt>
            <dd data-testid="win-time">{formatTime(time)}</dd>
          </div>
          <div>
            <dt>Moves</dt>
            <dd data-testid="win-moves">{moves}</dd>
          </div>
          <div>
            <dt>Best</dt>
            <dd data-testid="win-best">{best === null ? '—' : formatTime(best)}</dd>
          </div>
        </dl>
        <button type="button" className="btn btn-primary" data-testid="win-new-game" onClick={onNewGame}>
          Play again
        </button>
      </div>
    </div>
  );
}