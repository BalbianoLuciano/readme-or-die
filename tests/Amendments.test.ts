import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { Document, LevelTexts, Note } from '../src/types/corpus';
import { applicableNotes, fragmentOf, resolve, type Amendment } from '../src/systems/Amendments';

const doc = JSON.parse(readFileSync('public/data/es/documents/level_01.json', 'utf8')) as Document;
const texts = JSON.parse(readFileSync('public/data/es/texts/level_01.json', 'utf8')) as LevelTexts;
const note = (id: string): Note => texts.notes.find((n) => n.id === id)!;
const using = (...list: Amendment[]) => new Map(list.map((a) => [a.factId, a]));
const correct = (factId: string, noteId: string, type: keyof NonNullable<Note['values']>): Amendment => ({
  factId, operation: 'note', noteId, value: note(noteId).values![type]!,
});

describe('resolve: level 1 as specified', () => {
  it('signing without touching anything: dies, and the archive says "time"', () => {
    const o = resolve(doc, using());
    expect(o.survives).toBe(false);
    expect(o.lethalType).toBe('time');
    expect(o.amendments).toBe(0);
  });

  it('correcting only the weekday and the floor: still dies', () => {
    const o = resolve(doc, using(correct('f1', 'note_calendar', 'date'), correct('f7', 'note_card', 'number')));
    expect(o.survives).toBe(false);
    expect(o.results.filter((r) => r.effect === 'recovered').map((r) => r.fact.id)).toEqual(['f1', 'f7']);
  });

  it('correcting the time with the meeting confirmation: survives and keeps the memory', () => {
    const o = resolve(doc, using(correct('f5', 'note_meeting', 'time')));
    expect(o.survives).toBe(true);
    expect(o.results.find((r) => r.fact.id === 'f5')).toMatchObject({ effect: 'recovered', finalText: 'ocho y veinte' });
  });

  it('striking the time: survives and loses the memory', () => {
    const o = resolve(doc, using({ factId: 'f5', operation: 'strike' }));
    expect(o.survives).toBe(true);
    expect(o.strikes).toBe(1);
    expect(o.results.find((r) => r.fact.id === 'f5')).toMatchObject({ effect: 'destroyed', struck: true, finalText: 'nueve y veinte' });
  });

  it('"correcting" half an hour, which is correct: survives if the time was fixed, but destroys that memory', () => {
    const o = resolve(doc, using(correct('f5', 'note_meeting', 'time'), { factId: 'f8', operation: 'note', noteId: 'note_meeting', value: 'ocho y veinte' }));
    expect(o.survives).toBe(true);
    expect(o.results.find((r) => r.fact.id === 'f8')?.effect).toBe('destroyed');
  });

  it('putting a wrong time into the arrival does not save: still wrong', () => {
    const o = resolve(doc, using({ factId: 'f5', operation: 'note', noteId: 'some_other_note', value: 'nueve y cuarenta' }));
    expect(o.survives).toBe(false);
    expect(o.results.find((r) => r.fact.id === 'f5')?.effect).toBe('no_effect');
  });

  it('the full solution: survives with three memories recovered and none destroyed', () => {
    const o = resolve(doc, using(
      correct('f5', 'note_meeting', 'time'),
      correct('f1', 'note_calendar', 'date'),
      correct('f7', 'note_card', 'number'),
    ));
    expect(o.survives).toBe(true);
    expect(o.results.filter((r) => r.effect === 'recovered')).toHaveLength(3);
    expect(o.results.filter((r) => r.effect === 'destroyed')).toHaveLength(0);
    expect(o.amendments).toBe(3);
  });
});

describe('applicableNotes', () => {
  it('for the arrival time offers only the meeting confirmation: the alert reveals, it does not correct', () => {
    const f5 = doc.facts.find((f) => f.id === 'f5')!;
    expect(applicableNotes(f5, texts.notes).map((n) => n.id)).toEqual(['note_meeting']);
  });

  it('for a name offers nothing: only striking remains', () => {
    const f3 = doc.facts.find((f) => f.id === 'f3')!;
    expect(applicableNotes(f3, texts.notes)).toEqual([]);
  });
});

describe('fragmentOf', () => {
  it('returns the sentence of the fact with final values', () => {
    expect(fragmentOf(doc, 'f5', { f5: 'ocho y veinte' })).toBe('Llegué a Avenida Córdoba 1900 a las ocho y veinte.');
    expect(fragmentOf(doc, 'f7', {})).toBe('Subí al piso 7.');
  });
});
