/**
 * Corpus schema. Everything under `public/data/` conforms to these types.
 * The engine needs to know nothing else about a level.
 *
 * Maps are locale-independent. Documents, texts and UI labels live under `public/data/<locale>/`.
 * The structure of a document (ids, types, kinds, required notes) must be identical across locales;
 * only the prose changes. The validator enforces it.
 */

export type Locale = 'es' | 'en';

export type FactType = 'date' | 'time' | 'place' | 'name' | 'number';
export type FactKind = 'lethal' | 'harmless_false' | 'correct';
export type NoteKind = 'correction' | 'alert' | 'ambient';

export interface Fact {
  id: string;
  /** The text exactly as it appears in the document. */
  text: string;
  type: FactType;
  kind: FactKind;
  /** False facts only: the true value. */
  correction?: string;
  /** False facts only: the note that provides the correction. */
  required_note?: string;
}

export interface Document {
  id: string;
  /** Display name: `recuerdo_2024.md`. */
  file: string;
  year: number;
  /** Prose with `{{fN}}` markers where each fact goes. Paragraphs separated by a blank line. */
  body: string;
  facts: Fact[];
}

export interface Note {
  id: string;
  kind: NoteKind;
  /** What the paper is called in the box: "Hoja de calendario". */
  paper: string;
  /** What it says, readable directly in the box. */
  text: string;
  /** The value it provides for each fact type it can amend. A note without values amends nothing. */
  values?: Partial<Record<FactType, string>>;
}

export interface Belonging {
  id: string;
  name: string;
  /** What the text box says when it is stored. */
  text: string;
}

export interface Intro {
  /** Who speaks. Never shown: documentation for the team. */
  voice: string;
  lines: string[];
}

export interface LevelTexts {
  id: string;
  intro: Intro;
  /** Exact text of every interactable, by `text_id`. */
  interactions: Record<string, string>;
  /** The notes the scene can hand out. */
  notes: Note[];
  /** What is on the desk, in storing order. The document is separate and always last. */
  belongings: Belonging[];
  /** The philosophical text shown after signing correctly. */
  reflection: string;
}

/** Properties of an object in the Tiled `interactables` layer. */
export interface InteractableProps {
  id: string;
  text_id: string;
  is_document: boolean;
  /** If inspecting it hands a note to the box. */
  note_id?: string;
  /** Special behaviour. `desk`: the level 1 opening. */
  mechanic?: 'desk';
}

export interface Level {
  id: string;
  locale: Locale;
  document: Document;
  texts: LevelTexts;
}

export interface LocalesManifest {
  default: Locale;
  locales: Record<string, { name: string; levels: string[] }>;
}

/** UI labels. Nested string maps; `{n}` placeholders are filled by I18n.t. */
export type UiStrings = { [key: string]: string | UiStrings };
