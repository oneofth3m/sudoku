import { describe, expect, it } from 'vitest';
import { decodeBoardLink, encodeBoardLink } from './boardLink';
import { generatePuzzle } from '../engine/generator';
import { mulberry32 } from '../engine/rng';
import { gridsEqual } from '../engine/solver';

describe('boardLink', () => {
  const { puzzle, solution } = generatePuzzle('medium', mulberry32(7));

  it('round-trips a puzzle + solution link', () => {
    const link = encodeBoardLink(puzzle, solution);
    expect(link.startsWith('#puzzle=')).toBe(true);
    const decoded = decodeBoardLink(link);
    expect(decoded).not.toBeNull();
    expect(gridsEqual(decoded!.puzzle, puzzle)).toBe(true);
    expect(gridsEqual(decoded!.solution, solution)).toBe(true);
  });

  it('works when the hash sits at the end of a full URL', () => {
    const full = `https://example.com/sudoku/${encodeBoardLink(puzzle, solution)}`;
    const decoded = decodeBoardLink(full.slice(full.indexOf('#')));
    expect(decoded).not.toBeNull();
    expect(gridsEqual(decoded!.solution, solution)).toBe(true);
  });

  it('derives the solution when only the puzzle is encoded', () => {
    const link = encodeBoardLink(puzzle);
    expect(link).not.toContain('"s":');
    const decoded = decodeBoardLink(link);
    expect(decoded).not.toBeNull();
    expect(gridsEqual(decoded!.puzzle, puzzle)).toBe(true);
    expect(gridsEqual(decoded!.solution, solution)).toBe(true);
  });

  it('rejects malformed and invalid links', () => {
    expect(decodeBoardLink('')).toBeNull();
    expect(decodeBoardLink('#other=abc')).toBeNull();
    expect(decodeBoardLink('#puzzle=not-base64!')).toBeNull();
    // Valid base64 but wrong shape (only 9 numbers).
    const short = Buffer.from(JSON.stringify({ p: [1, 2, 3] })).toString('base64');
    expect(decodeBoardLink(`#puzzle=${short}`)).toBeNull();
    // A puzzle with conflicting givens has no valid solution possible.
    const dup = Array(81).fill(0);
    dup[0] = 5;
    dup[1] = 5; // same row, duplicate 5s
    const dupLink = Buffer.from(JSON.stringify({ p: dup })).toString('base64');
    expect(decodeBoardLink(`#puzzle=${dupLink}`)).toBeNull();
    // An embedded solution that contradicts the givens is rejected.
    const badS = Array(81).fill(1);
    const evil = Buffer.from(JSON.stringify({ p: puzzle.flat(), s: badS })).toString('base64');
    expect(decodeBoardLink(`#puzzle=${evil}`)).toBeNull();
  });
});