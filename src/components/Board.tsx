import { ALL_NUMBERS, type Cell as SudokuCell, type Grid } from '../engine/types';
import { PEERS } from '../engine/cells';
import { resolvedNumbers } from '../engine/marks';
import type { Selection } from '../state/types';
import type { CSSProperties } from 'react';

interface BoardProps {
  cells: SudokuCell[][];
  solution: Grid;
  selected: Selection | null;
  onSelect: (row: number, col: number) => void;
}

/** Grid position of a corner mark (1-9) inside the 3x3 mini-grid. */
function cornerPosition(mark: number): { gridRow: number; gridColumn: number } {
  return { gridRow: Math.ceil(mark / 3), gridColumn: ((mark - 1) % 3) + 1 };
}

/**
 * Positions a corner-mark digit inside its 3x3 slot. When the cell also shows
 * center marks (which occupy the middle region), the corner digits hug the
 * outer edges of their slot so they never collide with the center chip.
 */
function cornerMarkStyle(mark: number, hug: boolean): CSSProperties {
  const { gridRow, gridColumn } = cornerPosition(mark);
  const alignSelf = !hug ? 'center' : gridRow === 1 ? 'start' : gridRow === 3 ? 'end' : 'center';
  const justifySelf = !hug ? 'center' : gridColumn === 1 ? 'start' : gridColumn === 3 ? 'end' : 'center';
  return { gridRow, gridColumn, alignSelf, justifySelf };
}

export function Board({ cells, solution, selected, onSelect }: BoardProps) {
  const cellsOut: React.ReactNode[] = [];

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = cells[r][c];
      const isSelected = selected !== null && selected.row === r && selected.col === c;
      const inRegion =
        selected !== null &&
        !isSelected &&
        (selected.row === r ||
          selected.col === c ||
          (Math.floor(selected.row / 3) === Math.floor(r / 3) &&
            Math.floor(selected.col / 3) === Math.floor(c / 3)));

      const selectedValue = selected ? cells[selected.row][selected.col].value : 0;
      const sameValue = selected !== null && !isSelected && selectedValue !== 0 && cell.value === selectedValue;
      const isConflict =
        cell.value !== 0 &&
        PEERS[r * 9 + c].some(([pr, pc]) => cells[pr][pc].value === cell.value);
      // A user-entered value that does not match the unique solution is wrong,
      // even when it conflicts with nothing currently on the board.
      const isWrong = !cell.isGiven && cell.value !== 0 && cell.value !== solution[r][c];

      // Marks are only shown in empty cells; invalid marks (already resolved
      // in the cell's row/column/box) are highlighted.
      let resolved: Set<number> | null = null;
      if (cell.value === 0 && (cell.cornerMarks.size > 0 || cell.centerMarks.size > 0)) {
        resolved = resolvedNumbers(cells, r, c);
      }

      const classes = [
        'cell',
        cell.isGiven ? 'given' : '',
        !cell.isGiven && cell.value !== 0 ? 'user' : '',
        isSelected ? 'selected' : '',
        inRegion ? 'region' : '',
        sameValue ? 'same-value' : '',
        isConflict ? 'conflict' : '',
        isWrong ? 'wrong' : '',
      ]
        .filter(Boolean)
        .join(' ');

      cellsOut.push(
        <div
          key={`${r}-${c}`}
          className={classes}
          data-r={r}
          data-c={c}
          data-value={cell.value}
          data-given={cell.isGiven || undefined}
          data-wrong={isWrong || undefined}
          onClick={() => onSelect(r, c)}
        >
          {cell.value > 0 ? (
            <span className="value">{cell.value}</span>
          ) : (
            <>
              {cell.cornerMarks.size > 0 && (
                <span className="corner-marks">
                  {ALL_NUMBERS.map(
                    (n) =>
                      cell.cornerMarks.has(n) &&
                      // When center marks occupy the middle region, corner mark 5
                      // renders inside the center chip (slot 5) instead of the
                      // corner ring, so it stays visible and never overlaps.
                      !(cell.centerMarks.size > 0 && n === 5) && (
                        <span
                          key={n}
                          className={resolved !== null && resolved.has(n) ? 'corner-mark invalid' : 'corner-mark'}
                          data-mark={n}
                          style={cornerMarkStyle(n, cell.centerMarks.size > 0)}
                        >
                          {n}
                        </span>
                      ),
                  )}
                </span>
              )}
              {cell.centerMarks.size > 0 && (
                <span className="center-marks">
                  {ALL_NUMBERS.map((n) =>
                    // Corner mark 5 owns the chip's middle slot when present;
                    // the center mark 5 yields to it (5 is still shown once).
                    n === 5 && cell.cornerMarks.has(5) ? (
                      <span
                        key={n}
                        className={
                          resolved !== null && resolved.has(5)
                            ? 'corner-mark chip-corner invalid'
                            : 'corner-mark chip-corner'
                        }
                        data-mark={5}
                        style={cornerPosition(5)}
                      >
                        {5}
                      </span>
                    ) : (
                      cell.centerMarks.has(n) && (
                        <span
                          key={n}
                          className={resolved !== null && resolved.has(n) ? 'center-mark invalid' : 'center-mark'}
                          data-mark={n}
                          style={cornerPosition(n)}
                        >
                          {n}
                        </span>
                      )
                    ),
                  )}
                </span>
              )}
            </>
          )}
        </div>,
      );
    }
  }

  return (
    <div className="board" data-testid="board">
      {cellsOut}
    </div>
  );
}