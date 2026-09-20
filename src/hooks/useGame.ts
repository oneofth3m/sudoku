import { useCallback, useEffect, useReducer, useRef } from 'react';
import { gameReducer, type GameAction } from '../state/gameReducer';
import { elapsedSeconds } from '../state/clock';
import type { GameState } from '../state/types';

export interface UseGameResult {
  state: GameState;
  dispatch: (action: GameAction) => void;
}

export interface UseGameOptions {
  initialState: () => GameState;
  /** Called once per completed game with the final elapsed time in seconds. */
  onWin: (elapsed: number) => void;
}

/**
 * Owns the game reducer state plus the timer. The timer starts on the first
 * move and repeatedly recomputes the elapsed whole seconds from the absolute
 * wall-clock start, freezing + reporting the value when the game is won.
 */
export function useGame({ initialState, onWin }: UseGameOptions): UseGameResult {
  const [state, dispatch] = useReducer(gameReducer, undefined, initialState);

  const startedAtRef = useRef<number | null>(null);
  const wonReportedRef = useRef<number | null>(null);
  const onWinRef = useRef(onWin);
  onWinRef.current = onWin;

  // Timer: begins on the first move, ticks ~4x/sec but only ever advances the
  // display by one whole second per real second (the reducer TICK just stores
  // the latest computed value; there is no accumulation on top of it).
  useEffect(() => {
    if (state.status !== 'playing' || state.moves === 0) {
      if (state.moves === 0) startedAtRef.current = null;
      return;
    }
    if (startedAtRef.current === null) startedAtRef.current = Date.now();
    const id = setInterval(() => {
      const startedAt = startedAtRef.current ?? Date.now();
      dispatch({ type: 'TICK', elapsed: elapsedSeconds(startedAt, Date.now()) });
    }, 250);
    return () => clearInterval(id);
  }, [state.status, state.moves]);

  // On win: finalize the elapsed time exactly once per game and report it.
  useEffect(() => {
    if (state.status !== 'won') return;
    if (wonReportedRef.current !== state.gameId) {
      wonReportedRef.current = state.gameId;
      const startedAt = startedAtRef.current;
      const final = startedAt !== null ? elapsedSeconds(startedAt, Date.now()) : state.elapsed;
      startedAtRef.current = null;
      dispatch({ type: 'TICK', elapsed: final });
      onWinRef.current(final);
      return;
    }
    startedAtRef.current = null;
  }, [state.status, state.gameId, state.elapsed]);

  const dispatchAction = useCallback((action: GameAction) => dispatch(action), []);

  return { state, dispatch: dispatchAction };
}