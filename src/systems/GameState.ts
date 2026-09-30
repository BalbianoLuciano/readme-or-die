import type { Belonging, FactType, Locale, Note } from '../types/corpus';
import type { Amendment } from './Amendments';

/**
 * Game state. It lives in no scene: scenes read it and mutate it.
 * That is what lets the Reader and the Box share the notes without passing data around.
 */

export interface Memory {
  levelId: string;
  factId: string;
  text: string;
  state: 'recovered' | 'destroyed';
}

export interface ArchiveEntry {
  levelId: string;
  file: string;
  type: FactType;
}

export interface Options {
  locale: Locale;
  nonPixelFont: boolean;
  textSize: 1 | 2 | 3;
  extraLeading: boolean;
  highContrast: boolean;
}

export interface PersistentState {
  currentLevel: string;
  closedLevels: string[];
  memories: Memory[];
  archive: ArchiveEntry[];
  options: Options;
}

export const DEFAULT_OPTIONS: Options = {
  locale: 'es',
  nonPixelFont: false,
  textSize: 1,
  extraLeading: false,
  highContrast: false,
};

export class GameState {
  // Persists across sessions.
  currentLevel = 'level_01';
  closedLevels: string[] = [];
  memories: Memory[] = [];
  archive: ArchiveEntry[] = [];
  options: Options = { ...DEFAULT_OPTIONS };

  // Belongs to the level: reset on entry.
  notes: Note[] = [];
  belongings: Belonging[] = [];
  documentCollected = false;
  amendments = new Map<string, Amendment>();
  deathsInLevel = 0;
  introSeen = false;

  enterLevel(levelId: string): void {
    if (levelId !== this.currentLevel) {
      this.currentLevel = levelId;
      this.deathsInLevel = 0;
      this.introSeen = false;
    }
    this.notes = [];
    this.belongings = [];
    this.documentCollected = false;
    this.amendments = new Map();
  }

  /** Retrying after death: the box stays as it was (notes, belongings, the document), the document is reread clean. */
  retry(): void {
    this.amendments = new Map();
  }

  collectNote(note: Note): boolean {
    if (this.notes.some((n) => n.id === note.id)) return false;
    this.notes.push(note);
    return true;
  }

  storeBelonging(b: Belonging): void {
    if (!this.belongings.some((x) => x.id === b.id)) this.belongings.push(b);
  }

  archiveDeath(levelId: string, file: string, type: FactType): void {
    this.deathsInLevel += 1;
    if (!this.archive.some((a) => a.levelId === levelId && a.type === type)) {
      this.archive.push({ levelId, file, type });
    }
  }

  addMemory(m: Memory): void {
    this.memories = this.memories.filter((x) => !(x.levelId === m.levelId && x.factId === m.factId));
    this.memories.push(m);
  }

  closeLevel(levelId: string): void {
    if (!this.closedLevels.includes(levelId)) this.closedLevels.push(levelId);
  }

  toPersistent(): PersistentState {
    return {
      currentLevel: this.currentLevel,
      closedLevels: [...this.closedLevels],
      memories: [...this.memories],
      archive: [...this.archive],
      options: { ...this.options },
    };
  }

  loadPersistent(p: PersistentState): void {
    this.currentLevel = p.currentLevel;
    this.closedLevels = [...p.closedLevels];
    this.memories = [...p.memories];
    this.archive = [...p.archive];
    this.options = { ...DEFAULT_OPTIONS, ...p.options };
  }
}

/** The only instance. Scenes import it. */
export const state = new GameState();
