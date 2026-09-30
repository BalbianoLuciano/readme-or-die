import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { Document, LevelTexts } from '../src/types/corpus';
import { validateDocument, validateLevel, validateMap, validateTexts, validateTranslation, type MapSummary } from '../src/systems/CorpusValidator';

const load = () => ({
  doc: JSON.parse(readFileSync('public/data/es/documents/level_01.json', 'utf8')) as Document,
  texts: JSON.parse(readFileSync('public/data/es/texts/level_01.json', 'utf8')) as LevelTexts,
});
const validMap: MapSummary = {
  spawns: 1,
  interactables: [
    { id: 'DESK', text_id: 'DESK', is_document: false, mechanic: 'desk' },
    { id: 'CAL', text_id: 'CAL', is_document: false, note_id: 'note_calendar' },
    { id: 'CARDS', text_id: 'CARDS', is_document: false, note_id: 'note_card' },
    { id: 'DRAWER', text_id: 'DRAWER', is_document: false, note_id: 'note_meeting' },
    { id: 'BOARD', text_id: 'BOARD', is_document: false, note_id: 'note_clipping' },
    ...['DISPENSER', 'COPIER', 'PLANT', 'EVAC', 'COUNTER', 'TURNSTILE'].map((id) => ({ id, text_id: id, is_document: false })),
  ],
};

describe('validateDocument', () => {
  it('level 1 has no errors', () => {
    expect(validateDocument(load().doc).errors).toEqual([]);
  });

  it('rejects two lethal facts', () => {
    const { doc } = load();
    doc.facts.find((f) => f.id === 'f8')!.kind = 'lethal';
    expect(validateDocument(doc).errors.join()).toMatch(/exactly 1 lethal fact/);
  });

  it('rejects a marker without a fact and a fact without a marker', () => {
    const { doc } = load();
    doc.body = doc.body.replace('{{f3}}', '{{f9}}');
    const e = validateDocument(doc).errors.join('\n');
    expect(e).toMatch(/\{\{f9\}\} and no such fact/);
    expect(e).toMatch(/\{\{f3\}\} appears 0 times/);
  });

  it('rejects a false fact without a correction', () => {
    const { doc } = load();
    delete doc.facts.find((f) => f.id === 'f1')!.correction;
    expect(validateDocument(doc).errors.join()).toMatch(/f1 is false and has no correction/);
  });

  it('warns when the body is outside 250–400 words', () => {
    expect(validateDocument(load().doc).warnings.join()).toMatch(/words/);
  });
});

describe('validateTexts', () => {
  it('level 1 has no errors', () => {
    const { doc, texts } = load();
    expect(validateTexts(texts, doc).errors).toEqual([]);
  });

  it('requires exactly one alert note', () => {
    const { doc, texts } = load();
    texts.notes.find((n) => n.id === 'note_clipping')!.kind = 'correction';
    expect(validateTexts(texts, doc).errors.join()).toMatch(/1 alert note/);
  });

  it('the required note must provide exactly the correction', () => {
    const { doc, texts } = load();
    texts.notes.find((n) => n.id === 'note_meeting')!.values!.time = 'ocho y media';
    expect(validateTexts(texts, doc).errors.join()).toMatch(/note_meeting does not provide/);
  });

  it('an alert note must not provide values', () => {
    const { doc, texts } = load();
    texts.notes.find((n) => n.id === 'note_clipping')!.values = { time: 'nueve y cuarenta' };
    expect(validateTexts(texts, doc).errors.join()).toMatch(/alert note and must not provide values/);
  });

  it('the intro cannot contain digits', () => {
    const { doc, texts } = load();
    texts.intro.lines[0] = 'Qué lástima, Homero. Son las 9.';
    expect(validateTexts(texts, doc).errors.join()).toMatch(/contains a digit/);
  });
});

describe('validateMap', () => {
  it('the level 1 summary is valid', () => {
    expect(validateMap(validMap, load().texts).errors).toEqual([]);
  });

  it('every note must be in the scene', () => {
    const map = { ...validMap, interactables: validMap.interactables.filter((i) => i.id !== 'BOARD') };
    expect(validateMap(map, load().texts).errors.join()).toMatch(/note_clipping is not handed out/);
  });

  it('an unknown text_id is an error', () => {
    const map = { ...validMap, interactables: [...validMap.interactables, { id: 'X', text_id: 'NONE', is_document: false }] };
    expect(validateMap(map, load().texts).errors.join()).toMatch(/NONE does not exist/);
  });
});

describe('validateTranslation', () => {
  it('a faithful translation passes', () => {
    const { doc } = load();
    const en = structuredClone(doc);
    en.facts.forEach((f) => (f.text = `en:${f.text}`));
    expect(validateTranslation(doc, en).errors).toEqual([]);
  });

  it('a translation that changes a kind or the fact order fails', () => {
    const { doc } = load();
    const en = structuredClone(doc);
    en.facts.find((f) => f.id === 'f2')!.kind = 'harmless_false';
    en.body = en.body.replace('{{f1}} {{f2}}', '{{f2}} {{f1}}');
    const e = validateTranslation(doc, en).errors.join('\n');
    expect(e).toMatch(/f2: kind differs/);
    expect(e).toMatch(/different order/);
  });
});

describe('validateLevel', () => {
  it('detects crossed ids between document and texts', () => {
    const { doc, texts } = load();
    texts.id = 'level_02';
    expect(validateLevel(doc, texts).errors.join()).toMatch(/level_01.*level_02/);
  });
});
