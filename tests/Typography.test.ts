import { describe, expect, it } from 'vitest';
import { lineText, wrap, wrapSegments } from '../src/systems/Typography';

describe('wrap', () => {
  it('leaves a text that fits on one line untouched', () => {
    expect(wrap('Llegué tarde.', 66)).toEqual(['Llegué tarde.']);
  });

  it('never produces a line longer than the columns', () => {
    const text = 'Llegué a la oficina a las nueve y veinte y nadie me estaba esperando en la recepción del edificio.';
    for (const columns of [10, 20, 33, 66]) {
      for (const line of wrap(text, columns)) expect(line.length).toBeLessThanOrEqual(columns);
    }
  });

  it('does not split words', () => {
    expect(wrap('uno dos tres cuatro cinco', 9)).toEqual(['uno dos', 'tres', 'cuatro', 'cinco']);
  });

  it('no line starts or ends with a space', () => {
    const text = 'Llegué a la oficina a las nueve y veinte y nadie me estaba esperando.';
    for (const columns of [7, 12, 30]) {
      for (const line of wrap(text, columns)) expect(line).toBe(line.trim());
    }
  });

  it('respects line breaks and keeps blank lines', () => {
    expect(wrap('primer párrafo\n\nsegundo', 66)).toEqual(['primer párrafo', '', 'segundo']);
  });

  it('splits a word longer than the columns', () => {
    expect(wrap('supercalifragilístico', 8)).toEqual(['supercal', 'ifragilí', 'stico']);
  });

  it('collapses repeated spaces and tabs', () => {
    expect(wrap('uno   dos\ttres', 66)).toEqual(['uno dos tres']);
  });

  it('an empty text is a single empty line', () => {
    expect(wrap('', 66)).toEqual(['']);
  });

  it('a line that exactly fills the columns does not gain an extra line', () => {
    expect(wrap('abc def', 7)).toEqual(['abc def']);
    expect(wrap('abc def', 6)).toEqual(['abc', 'def']);
  });

  it('rejects invalid columns', () => {
    expect(() => wrap('x', 0)).toThrow(RangeError);
    expect(() => wrap('x', 2.5)).toThrow(RangeError);
  });

  it('joining the lines rebuilds the original text', () => {
    const text = 'Me acuerdo del pasillo, del dispenser de agua y de la planta que nadie regaba.';
    expect(wrap(text, 20).join(' ')).toBe(text);
  });
});

describe('wrapSegments', () => {
  it('keeps the fact tag on every stretch of a line', () => {
    const lines = wrapSegments(
      [{ text: 'Llegué a ' }, { text: 'Avenida Córdoba 1900', fact: 'f4' }, { text: ' a las ' }, { text: 'nueve y veinte', fact: 'f5' }, { text: '.' }],
      66,
    );
    expect(lines).toEqual([
      [
        { text: 'Llegué a ' },
        { text: 'Avenida Córdoba 1900', fact: 'f4' },
        { text: ' a las ' },
        { text: 'nueve y veinte', fact: 'f5' },
        { text: '.' },
      ],
    ]);
  });

  it('a fact that falls on the break is split across two lines with the same tag', () => {
    const lines = wrapSegments([{ text: 'Fue el ' }, { text: '14 de marzo de 2024', fact: 'f2' }, { text: '.' }], 14);
    expect(lines.map(lineText)).toEqual(['Fue el 14 de', 'marzo de 2024.']);
    expect(lines[0].at(-1)).toEqual({ text: '14 de', fact: 'f2' });
    expect(lines[1][0]).toEqual({ text: 'marzo de 2024', fact: 'f2' });
    expect(lines[1][1]).toEqual({ text: '.' });
  });

  it('the plain text of the lines matches wrap', () => {
    const text = 'Me habían citado a entregar la documentación del sistema nuevo. Martes 14 de marzo de 2024.';
    const segments = [{ text: 'Me habían citado a entregar la documentación del sistema nuevo. ' }, { text: 'Martes', fact: 'f1' }, { text: ' ' }, { text: '14 de marzo de 2024', fact: 'f2' }, { text: '.' }];
    for (const columns of [20, 33, 66]) {
      expect(wrapSegments(segments, columns).map(lineText)).toEqual(wrap(text, columns));
    }
  });

  it('respects paragraphs even when the break is inside a segment', () => {
    const lines = wrapSegments([{ text: 'uno\n\ndos ' }, { text: 'tres', fact: 'f1' }], 66);
    expect(lines).toEqual([[{ text: 'uno' }], [], [{ text: 'dos ' }, { text: 'tres', fact: 'f1' }]]);
  });

  it('a fact glued to punctuation does not absorb it', () => {
    const lines = wrapSegments([{ text: '(' }, { text: 'piso 7', fact: 'f7' }, { text: '),' }], 66);
    expect(lines[0]).toEqual([{ text: '(' }, { text: 'piso 7', fact: 'f7' }, { text: '),' }]);
  });
});
