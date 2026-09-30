import type { Document, InteractableProps, LevelTexts, NoteKind } from '../types/corpus';

/**
 * The mechanical part of the corpus checklist, as code. It checks structure, not tone:
 * the oblique method and the anti-goals need a human eye.
 *
 * Runs in CI over all of `public/data/` (tests/corpus.test.ts) and in dev when a level loads.
 */

export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

export interface MapSummary {
  interactables: InteractableProps[];
  spawns: number;
}

const MARKER = /\{\{(\w+)\}\}/g;

export function validateDocument(doc: Document): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const ids = doc.facts.map((f) => f.id);

  if (new Set(ids).size !== ids.length) errors.push('duplicate fact ids');

  const lethal = doc.facts.filter((f) => f.kind === 'lethal');
  if (lethal.length !== 1) errors.push(`there must be exactly 1 lethal fact, found ${lethal.length}`);

  const harmless = doc.facts.filter((f) => f.kind === 'harmless_false');
  if (harmless.length < 2 || harmless.length > 3) errors.push(`there must be 2 or 3 harmless false facts, found ${harmless.length}`);

  if (doc.facts.length < 6 || doc.facts.length > 9) errors.push(`there must be 6 to 9 facts, found ${doc.facts.length}`);

  for (const f of doc.facts) {
    const isFalse = f.kind !== 'correct';
    if (isFalse && !f.correction) errors.push(`${f.id} is false and has no correction`);
    if (isFalse && !f.required_note) errors.push(`${f.id} is false and has no required_note`);
    if (!isFalse && (f.correction || f.required_note)) errors.push(`${f.id} is correct and must not have a correction or a note`);
    if (isFalse && f.correction === f.text) errors.push(`${f.id}: correction equals the text`);
  }

  // Body markers ↔ facts, both ways, exactly once.
  const inBody = [...doc.body.matchAll(MARKER)].map((m) => m[1]);
  for (const id of inBody) if (!ids.includes(id)) errors.push(`the body uses {{${id}}} and no such fact exists`);
  for (const id of ids) {
    const times = inBody.filter((x) => x === id).length;
    if (times !== 1) errors.push(`{{${id}}} appears ${times} times in the body, must appear once`);
  }

  const words = countWords(substitute(doc));
  if (words < 250 || words > 400) warnings.push(`the body has ${words} words; the rule is 250 to 400`);

  if (/—/.test(doc.body)) warnings.push('the body uses an em dash (—), which is double width in the font; use an en dash (–)');

  return { errors, warnings };
}

export function validateTexts(texts: LevelTexts, doc: Document): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const lines = texts.intro.lines;
  if (lines.length < 3 || lines.length > 5) errors.push(`the intro has ${lines.length} lines, must be 3 to 5`);
  lines.forEach((l, i) => {
    if (/\d/.test(l)) errors.push(`intro line ${i + 1} contains a digit: no facts in the intro`);
  });

  const byKind = (kind: NoteKind) => texts.notes.filter((n) => n.kind === kind);
  if (byKind('alert').length !== 1) errors.push(`there must be exactly 1 alert note, found ${byKind('alert').length}`);

  const notes = new Map(texts.notes.map((n) => [n.id, n]));
  for (const f of doc.facts) {
    if (f.kind === 'correct') continue;
    const note = f.required_note ? notes.get(f.required_note) : undefined;
    if (!note) {
      errors.push(`${f.id} requires note ${f.required_note}, which does not exist`);
      continue;
    }
    if (note.kind !== 'correction') errors.push(`${f.id} requires ${note.id}, which is not a correction note`);
    if (note.values?.[f.type] !== f.correction) {
      errors.push(`${note.id} does not provide the value ${JSON.stringify(f.correction)} for type ${f.type} that ${f.id} needs`);
    }
  }
  for (const n of texts.notes) {
    if (n.kind === 'ambient') warnings.push(`${n.id} is an ambient note; ambient objects are interactions, not notes`);
    if (n.kind !== 'ambient' && (!n.values || Object.keys(n.values).length === 0)) warnings.push(`${n.id} provides no values`);
  }

  const reflection = countWords(texts.reflection);
  if (reflection < 30 || reflection > 70) errors.push(`the reflection has ${reflection} words, must be 30 to 70`);

  return { errors, warnings };
}

export function validateMap(map: MapSummary, texts: LevelTexts): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (map.spawns !== 1) errors.push(`the map has ${map.spawns} spawn objects, must have 1`);

  const ids = map.interactables.map((i) => i.id);
  if (new Set(ids).size !== ids.length) errors.push('duplicate interactable ids');

  const notes = new Map(texts.notes.map((n) => [n.id, n]));
  const handedOut = new Set<string>();
  for (const i of map.interactables) {
    if (!(i.text_id in texts.interactions)) errors.push(`${i.id}: text_id ${i.text_id} does not exist in interactions`);
    if (i.note_id) {
      if (!notes.has(i.note_id)) errors.push(`${i.id}: note_id ${i.note_id} does not exist`);
      handedOut.add(i.note_id);
    }
  }
  // Every note is physically in the scene.
  for (const n of texts.notes) {
    if (n.kind !== 'ambient' && !handedOut.has(n.id)) errors.push(`note ${n.id} is not handed out by any interactable in the scene`);
  }

  const inspectable = map.interactables.filter((i) => !i.mechanic);
  if (inspectable.length < 8 || inspectable.length > 10) warnings.push(`${inspectable.length} inspectable objects; the baseline is 8 to 10`);
  const withNote = inspectable.filter((i) => i.note_id).length;
  if (withNote < 4 || withNote > 5) warnings.push(`${withNote} objects hand out notes; the baseline is 4 to 5`);

  return { errors, warnings };
}

/** A translation must keep the structure of the source document: ids, types, kinds, required notes. */
export function validateTranslation(source: Document, translation: Document): ValidationResult {
  const errors: string[] = [];
  if (source.id !== translation.id) errors.push(`ids differ: ${source.id} vs ${translation.id}`);
  if (source.facts.length !== translation.facts.length) errors.push(`fact count differs: ${source.facts.length} vs ${translation.facts.length}`);
  const byId = new Map(translation.facts.map((f) => [f.id, f]));
  for (const f of source.facts) {
    const t = byId.get(f.id);
    if (!t) {
      errors.push(`fact ${f.id} is missing in the translation`);
      continue;
    }
    if (t.type !== f.type) errors.push(`${f.id}: type differs (${f.type} vs ${t.type})`);
    if (t.kind !== f.kind) errors.push(`${f.id}: kind differs (${f.kind} vs ${t.kind})`);
    if (t.required_note !== f.required_note) errors.push(`${f.id}: required_note differs`);
  }
  const order = (d: Document) => [...d.body.matchAll(MARKER)].map((m) => m[1]).join(',');
  if (order(source) !== order(translation)) errors.push('the facts appear in a different order in the body');
  return { errors, warnings: [] };
}

export function validateLevel(doc: Document, texts: LevelTexts, map?: MapSummary): ValidationResult {
  const parts = [validateDocument(doc), validateTexts(texts, doc)];
  if (map) parts.push(validateMap(map, texts));
  if (doc.id !== texts.id) parts.push({ errors: [`document is ${doc.id} but texts are ${texts.id}`], warnings: [] });
  return {
    errors: parts.flatMap((p) => p.errors),
    warnings: parts.flatMap((p) => p.warnings),
  };
}

/** Replaces every marker with the current text of its fact. */
export function substitute(doc: Document, values: Record<string, string> = {}): string {
  const byId = new Map(doc.facts.map((f) => [f.id, f.text]));
  return doc.body.replace(MARKER, (_, id: string) => values[id] ?? byId.get(id) ?? `{{${id}}}`);
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}
