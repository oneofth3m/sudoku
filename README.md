# Sudoku

A local-first Sudoku game — React + TypeScript + Vite. Generates unique puzzles
on demand, supports values, corner marks and center marks, auto-fill, invalid-mark
highlighting, undo/redo, a timer, and per-difficulty best times stored locally.

## Quick start

```sh
npm install
npm run dev          # dev server (http://localhost:5173)
npm run build        # type-check + production build to dist/
npm run preview      # serve the production build
```

## Testing

```sh
npm run test         # unit tests (Vitest) + end-to-end tests (Playwright)
npm run test:unit    # engine + reducer unit tests
npm run test:e2e     # Playwright browser tests (builds + serves via vite preview)
npm run coverage     # unit tests with a coverage report
```

One-time browser setup for e2e tests: `npx playwright install chromium`.

- **Unit tests** (Vitest) cover the solver, puzzle generator, mark logic,
  reducer (undo/redo, win detection, history bounds) and time formatting.
  The generator is deterministic via an injectable seeded RNG.
- **E2E tests** (Playwright) drive the real UI in Chromium against the
  production build: board rendering, input via keypad and keyboard, marks,
  auto-fill + invalid highlighting + clear-invalid, undo/redo, conflict
  highlighting, the full win flow, and the timer/stats. Tests inject exact
  puzzles through the `#puzzle=` hash so they never depend on randomness.
- Coverage: ~97% statements, ~99% lines across the engine and state layer
  (see `npm run coverage`).

There is also `node scripts/layout-check.mjs` (run with the preview server up)
which asserts the board renders square and without horizontal overflow at
desktop and mobile sizes.

## How to play

- **Select** a cell (click or arrow keys), then enter **1–9** via the on-screen
  keypad or keyboard; **0 / Backspace / Delete** erases.
- **Input modes**: `1` (value), `123` (corner pencil marks), `123` (center
  marks). The corner button shows a tiny 3×3 digit grid; the center button
  shows `123`. Switch modes with **V**, **C**, **M** on the keyboard.
- The keypad shows a small counter on each digit key: how many more of that
  number are still missing from the board (9 − placed). It turns into a green
  badge at 0 once all nine are placed. The bottom bar (⌫) erases the selected
  cell.
- The toolbar is icon-based: **↶ / ↷** undo and redo, **✎** auto-fill 1–9,
  **⚠** clear invalid marks, **▦** clear corner marks, **◉** clear center marks —
  hover any icon for its tooltip. The segmented **Easy / Medium / Hard / Expert**
  control starts a new game at that difficulty, as does **New game**.
- **Auto-fill (✎)** fills every empty cell with all 1–9 center marks — marks that
  conflict with an already-resolved number in the cell's row/column/box are
  highlighted in red; **⚠ / ▦ / ◉** clear exactly that kind of mark
  board-wide (each is a single undoable step).
- **Undo / Redo** step through value *and* mark changes (history limit: 200).
- Placing a value auto-prunes that number from the marks of its peers.
- Marks never overflow the cell: corner marks stay in the outer ring and center
  marks live in a compact center chip, so even 9 corner + 9 center marks render
  without overlap. Corner mark **5** is always visible — when the center chip is
  present it moves to the chip's middle slot as a white badge (the center 5
  yields to it) instead of hiding. (Covered by desktop + mobile e2e geometry
  tests.)
- A value that does not match the unique solution is flagged immediately (red,
  struck through) even when it does not yet conflict with any given — put a
  different value down and the mark clears.
- The timer shows **MM:SS** (e.g. `07:23`), switches to **HH:MM:SS** past one
  hour, and advances exactly once per real second (verified by an e2e drift test).
- Mistakes are highlighted; the game is won only when the board matches the
  unique solution — the timer stops and your best time per difficulty is saved
  in `localStorage` (`sudoku.best`). If you fill the board but a number is
  wrong, a banner tells you the board isn't solved yet.
- **Board link**: the "Board link" section below the board shows a `#puzzle=`
  URL that uniquely identifies the current board; the Copy button puts it on the
  clipboard, and opening it reproduces the exact same puzzle.
- **Keyboard**: `1–9` enter/toggle digits · `0` / `Backspace` / `Delete` erase ·
  arrow keys move · **V** value mode · **C** corner marks · **M** center marks.

## How puzzle validity is guaranteed

1. `generateCompletedGrid` fills an empty grid with constraint-checked
   backtracking, producing a complete, valid solution.
2. `digHoles` removes one cell at a time only if the puzzle still has a
   **unique solution** (`hasUniqueSolution`, checked by the solver), so givens
   are always a subset of one valid solution — duplicates are impossible by
   construction.
3. The generator retries up to 25 times to hit the target given count and
   solver-cost window for the chosen difficulty; unit tests assert the exact
   given counts, uniqueness, and validity (rows/columns/boxes conflict-free)
   across 30 seeds × every difficulty (property-style coverage).
4. An e2e test goes one step further: it starts *fresh, browser-generated*
   games (no injected puzzle), reads the givens from the rendered board, and
   verifies they are conflict-free, uniquely solvable, and completable —
   so a board shipped by the app is provably valid.

## Architecture

```
src/
├── engine/        Pure logic, no React/DOM
│   ├── solver.ts      Backtracking solver, uniqueness, difficulty rating
│   ├── generator.ts   Random solutions + hole-digging with unique-solution checks
│   ├── marks.ts       Auto-fill, invalid-mark detection, peer pruning
│   ├── cells.ts       Cell model, peer table, conversions
│   └── rng.ts         Seeded PRNG for deterministic generation
├── state/         Reducer + timer-adjacent pure helpers
├── hooks/         useGame (state + timer), useKeyboard
└── components/    Board, Cell rendering, Keypad, Toolbar, StatusBar, WinOverlay
```

The reducer is pure and fully unit-tested; all uncertainty (puzzle creation,
timer tick source) lives in the app layer.

## AI usage

This project was developed with the assistance of an **AI coding agent** — an
OpenCode agent working interactively with the developer (the AI model used was
OpenCode's "Big Pickle"). The AI did the following under the developer's
direction:

- Implemented the application: the React + TypeScript + Vite app, the Sudoku
  engine (backtracking solver, seeded puzzle generator, mark logic), the
  game-state reducer, and all UI components.
- Wrote the automated test suites (Vitest unit tests and Playwright end-to-end
  tests), including the property-style validity tests and regression tests.
- Iterated on multiple rounds of the developer's review feedback (e.g. corner/center
  mark rendering, timer accuracy, board-validity proof, board-links, and
  mark-clearing controls).

Every change was **reviewed and approved by the human developer** (Naveen G),
who defined the requirements, tested the results, and owns the repository. This
disclosure is repeated in the commit message for this initial commit, so the
record of AI assistance survives in the git history itself.

## Notes

- E2E tests/evaluations load specific puzzles via
  `/?… #puzzle=<base64 JSON {p: number[81], s: number[81]}>` — shareable puzzle links.
- `npm run preview -- --port 4173 --strictPort` is used by Playwright.