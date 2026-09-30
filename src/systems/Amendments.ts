import type { Document, Fact, FactType, Note } from '../types/corpus';

/**
 * Resolves what happens to each fact when the document is signed. Pure logic, no Phaser.
 *
 * Per fact:
 * - lethal:         survives only if struck, or corrected with the required note.
 * - harmless false: corrected with the required note recovers the memory; struck destroys it;
 *                   another note or untouched, nothing.
 * - correct:        untouched keeps it; any change (note or strike) destroys it.
 */

export type Amendment =
  | { factId: string; operation: 'note'; noteId: string; value: string }
  | { factId: string; operation: 'strike' };

export type Effect = 'untouched' | 'recovered' | 'destroyed' | 'no_effect';

export interface FactResult {
  fact: Fact;
  effect: Effect;
  /** The text left in the signed document (the original if struck). */
  finalText: string;
  struck: boolean;
}

export interface Outcome {
  survives: boolean;
  /** Type of the lethal fact, for the Archive. Never why. */
  lethalType: FactType;
  results: FactResult[];
  amendments: number;
  strikes: number;
}

/** Form operations and which fact types each one covers. */
export const OPERATIONS = {
  when: ['date', 'time'] as FactType[],
  where: ['place', 'number'] as FactType[],
} as const;

export type Operation = keyof typeof OPERATIONS;

export function operationFor(type: FactType): Operation | null {
  if (OPERATIONS.when.includes(type)) return 'when';
  if (OPERATIONS.where.includes(type)) return 'where';
  return null;
}

/** Notes in the box that provide a value for the fact's type. A note that does not serve is never offered. */
export function applicableNotes(fact: Fact, notes: Note[]): Note[] {
  return notes.filter((n) => n.values?.[fact.type] !== undefined);
}

export function currentText(fact: Fact, amendments: Map<string, Amendment>): string {
  const a = amendments.get(fact.id);
  return a?.operation === 'note' ? a.value : fact.text;
}

export function resolve(doc: Document, amendments: Map<string, Amendment>): Outcome {
  const lethal = doc.facts.find((f) => f.kind === 'lethal');
  if (!lethal) throw new Error(`Amendments: ${doc.id} has no lethal fact`);

  const results = doc.facts.map((fact) => resolveFact(fact, amendments.get(fact.id)));
  const ofLethal = results.find((r) => r.fact.id === lethal.id)!;
  const list = [...amendments.values()];

  return {
    survives: ofLethal.struck || ofLethal.effect === 'recovered',
    lethalType: lethal.type,
    results,
    amendments: list.filter((a) => a.operation === 'note').length,
    strikes: list.filter((a) => a.operation === 'strike').length,
  };
}

function resolveFact(fact: Fact, amendment: Amendment | undefined): FactResult {
  if (!amendment) return { fact, effect: 'untouched', finalText: fact.text, struck: false };

  if (amendment.operation === 'strike') {
    return { fact, effect: 'destroyed', finalText: fact.text, struck: true };
  }

  const isFalse = fact.kind !== 'correct';
  if (!isFalse) return { fact, effect: 'destroyed', finalText: amendment.value, struck: false };

  const right = amendment.noteId === fact.required_note || amendment.value === fact.correction;
  return { fact, effect: right ? 'recovered' : 'no_effect', finalText: amendment.value, struck: false };
}

/**
 * The sentence of the document where the fact lives, with final values.
 * It is the "fragment" the box shows as recovered or destroyed.
 */
export function fragmentOf(doc: Document, factId: string, values: Record<string, string>): string {
  const marker = `{{${factId}}}`;
  const paragraph = doc.body.split('\n').find((p) => p.includes(marker));
  if (!paragraph) return '';
  const sentences = paragraph.match(/[^.]+\.?/g) ?? [paragraph];
  const sentence = sentences.find((s) => s.includes(marker)) ?? paragraph;
  const byId = new Map(doc.facts.map((f) => [f.id, f.text]));
  return sentence
    .replace(/\{\{(\w+)\}\}/g, (_, id: string) => values[id] ?? byId.get(id) ?? '')
    .trim();
}
