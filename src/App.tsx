import { useCallback, useMemo, useState } from 'react';
import { Board } from './components/Board';
import { Keypad } from './components/Keypad';
import { StatusBar } from './components/StatusBar';
import { Toolbar } from './components/Toolbar';
import { WinOverlay } from './components/WinOverlay';
import { createCells } from './engine/cells';
import { generatePuzzle } from './engine/generator';
import { DIFFICULTY_LABELS, type Difficulty, type Grid } from './engine/types';
import { decodeBoardLink, encodeBoardLink } from './state/boardLink';
import { useGame } from './hooks/useGame';
import { useKeyboard } from './hooks/useKeyboard';
import type { GameState } from './state/types';

const BEST_KEY = 'sudoku.best';

type BestTimes = Record<Difficulty, number | null>;

function emptyBest(): BestTimes {
  return { easy: null, medium: null, hard: null, expert: null };
}

function loadBest(): BestTimes {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    if (!raw) return emptyBest();
    const parsed = JSON.parse(raw) as Partial<BestTimes>;
    return { ...emptyBest(), ...parsed };
  } catch {
    return emptyBest();
  }
}

interface InjectedPuzzle {
  puzzle: Grid;
  solution: Grid;
}

/**
 * Optional deterministic puzzle via `#puzzle=<base64 JSON {p: number[81], s?: number[81]}>`.
 * Used by e2e tests and by the "Board link (debug)" feature — the solution may
 * be omitted and is then derived from the uniquely solvable puzzle.
 */
function parseHashPuzzle(): InjectedPuzzle | null {
  return decodeBoardLink(window.location.hash);
}

function makeGame(difficulty: Difficulty, gameId: number): GameState {
  const { puzzle, solution } = generatePuzzle(difficulty);
  return {
    gameId,
    difficulty,
    cells: createCells(puzzle),
    solution,
    status: 'playing',
    mode: 'value',
    selected: null,
    moves: 0,
    elapsed: 0,
    history: [],
    future: [],
  };
}

function createInitialState(): GameState {
  const injected = parseHashPuzzle();
  if (injected) {
    return {
      gameId: 1,
      difficulty: 'easy',
      cells: createCells(injected.puzzle),
      solution: injected.solution,
      status: 'playing',
      mode: 'value',
      selected: null,
      moves: 0,
      elapsed: 0,
      history: [],
      future: [],
    };
  }
  return makeGame('easy', 1);
}

export default function App() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [best, setBest] = useState<BestTimes>(loadBest);
  const [gameId, setGameId] = useState(1);
  const [copied, setCopied] = useState(false);

  const onWin = useCallback(
    (elapsed: number) => {
      setBest((prev) => {
        const current = prev[difficulty];
        const next = current === null || elapsed < current ? elapsed : current;
        const updated = { ...prev, [difficulty]: next };
        try {
          localStorage.setItem(BEST_KEY, JSON.stringify(updated));
        } catch {
          /* storage unavailable */
        }
        return updated;
      });
    },
    [difficulty],
  );

  const { state, dispatch } = useGame({ initialState: createInitialState, onWin });

  // remaining[n] = how many more of digit n must still be placed (index 1..9).
  const remaining = useMemo(() => {
    const counts = new Array<number>(10).fill(0);
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const v = state.cells[r][c].value;
        if (v !== 0) counts[v]++;
      }
    }
    const rem = new Array<number>(10).fill(9);
    for (let n = 1; n <= 9; n++) rem[n] = Math.max(0, 9 - counts[n]);
    return rem;
  }, [state.cells]);

  // Every cell filled, but the puzzle is not solved yet.
  const boardFull = useMemo(
    () => state.cells.every((row) => row.every((cell) => cell.value !== 0)),
    [state.cells],
  );

  // Debug: a stable #puzzle= link identifying the current board (givens only,
  // plus the solution so any recipient can play and win it). encodeBoardLink
  // already includes the leading '#'.
  const boardLink = useMemo(() => {
    const puzzle: Grid = state.cells.map((row) => row.map((c) => (c.isGiven ? c.value : 0)));
    return `${window.location.origin}${window.location.pathname}${encodeBoardLink(puzzle, state.solution)}`;
  }, [state.cells, state.solution]);

  const copyBoardLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(boardLink);
      setCopied(true);
    } catch {
      // Clipboard unavailable (e.g. permission): the link input stays visible.
      setCopied(false);
    }
    window.setTimeout(() => setCopied(false), 2000);
  }, [boardLink]);

  const startNewGame = useCallback(
    (d: Difficulty) => {
      const nextId = gameId + 1;
      setGameId(nextId);
      setDifficulty(d);
      const game = makeGame(d, nextId);
      dispatch({
        type: 'NEW_GAME',
        gameId: nextId,
        difficulty: d,
        cells: game.cells,
        solution: game.solution,
      });
    },
    [gameId, dispatch],
  );

  const handleDifficultyChange = useCallback(
    (d: Difficulty) => startNewGame(d),
    [startNewGame],
  );

  const pressDigit = useCallback(
    (n: number) => {
      dispatch(
        state.mode === 'value'
          ? { type: 'SET_VALUE', value: n }
          : { type: 'TOGGLE_MARK', mark: n },
      );
    },
    [dispatch, state.mode],
  );

  const erase = useCallback(() => dispatch({ type: 'ERASE' }), [dispatch]);
  const moveSelection = useCallback(
    (row: number, col: number) => dispatch({ type: 'SELECT', row, col }),
    [dispatch],
  );
  const onModeChange = useCallback(
    (mode: GameState['mode']) => dispatch({ type: 'SET_MODE', mode }),
    [dispatch],
  );

  useKeyboard({
    selected: state.selected,
    onDigit: pressDigit,
    onErase: erase,
    onMode: onModeChange,
    onMove: moveSelection,
  });

  const onSelect = useCallback(
    (row: number, col: number) => dispatch({ type: 'SELECT', row, col }),
    [dispatch],
  );

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Sudoku</h1>
        <span className="app-subtitle">{DIFFICULTY_LABELS[state.difficulty]}</span>
      </header>

      <Toolbar
        difficulty={difficulty}
        onDifficultyChange={handleDifficultyChange}
        onNewGame={() => startNewGame(difficulty)}
        onUndo={() => dispatch({ type: 'UNDO' })}
        onRedo={() => dispatch({ type: 'REDO' })}
        canUndo={state.history.length > 0 && state.status !== 'won'}
        canRedo={state.future.length > 0 && state.status !== 'won'}
        mode={state.mode}
        onModeChange={onModeChange}
        onAutoFill={() => dispatch({ type: 'FILL_ALL_MARKS' })}
        onClearInvalid={() => dispatch({ type: 'CLEAR_INVALID_MARKS' })}
        onClearCorners={() => dispatch({ type: 'CLEAR_CORNER_MARKS' })}
        onClearCenters={() => dispatch({ type: 'CLEAR_CENTER_MARKS' })}
        boardLink={boardLink}
        copied={copied}
        onCopyBoardLink={copyBoardLink}
      />

      <StatusBar elapsed={state.elapsed} moves={state.moves} best={best[state.difficulty]} />

      {state.status === 'playing' && boardFull && (
        <div className="incomplete-banner" data-testid="incomplete-banner">
          The board is full, but it isn&apos;t solved yet — some numbers don&apos;t match the solution.
          Check the cells highlighted in red.
        </div>
      )}

      <div className="layout">
        <div className="board-wrap">
          <Board cells={state.cells} solution={state.solution} selected={state.selected} onSelect={onSelect} />
        </div>
        <div className="controls">
          <Keypad mode={state.mode} remaining={remaining} onDigit={pressDigit} onErase={erase} />
          <p className="keyboard-hint">Keyboard: 1-9 enter · 0/Backspace erase · arrows move · V/C/M switch mode</p>
          <details className="keyboard-help">
            <summary>Keyboard shortcuts</summary>
            <ul>
              <li><b>1–9</b> — enter / toggle that digit in the current mode</li>
              <li><b>0</b>, <b>Backspace</b>, <b>Delete</b> — erase the selected cell</li>
              <li><b>Arrow keys</b> — move the selection</li>
              <li><b>V</b> — value mode · <b>C</b> — corner marks · <b>M</b> — center marks</li>
            </ul>
          </details>
        </div>
      </div>

      {state.status === 'won' && (
        <WinOverlay
          time={state.elapsed}
          moves={state.moves}
          best={best[state.difficulty]}
          onNewGame={() => startNewGame(difficulty)}
        />
      )}
    </div>
  );
}