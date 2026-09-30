import { DEFAULT_OPTIONS, type PersistentState } from './GameState';

/**
 * Saving to localStorage. The key carries a version on purpose: when the format changes,
 * the old save is ignored instead of breaking.
 */
export const KEY = 'readme-or-die.v1';

interface Storage {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

export function serialize(state: PersistentState): string {
  return JSON.stringify({ version: 1, ...state });
}

/** Returns null if the text is not a valid save of this version. */
export function deserialize(text: string | null): PersistentState | null {
  if (!text) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isObject(raw) || raw.version !== 1) return null;
  if (typeof raw.currentLevel !== 'string') return null;
  return {
    currentLevel: raw.currentLevel,
    closedLevels: listOf(raw.closedLevels, (x): x is string => typeof x === 'string'),
    memories: listOf(raw.memories, isObject) as unknown as PersistentState['memories'],
    archive: listOf(raw.archive, isObject) as unknown as PersistentState['archive'],
    options: { ...DEFAULT_OPTIONS, ...(isObject(raw.options) ? raw.options : {}) },
  };
}

export function save(state: PersistentState, storage: Storage | null = browserStorage()): void {
  try {
    storage?.setItem(KEY, serialize(state));
  } catch {
    // No storage (private mode, quota): the game goes on, unsaved.
  }
}

export function load(storage: Storage | null = browserStorage()): PersistentState | null {
  try {
    return deserialize(storage?.getItem(KEY) ?? null);
  } catch {
    return null;
  }
}

export function clear(storage: Storage | null = browserStorage()): void {
  try {
    storage?.removeItem(KEY);
  } catch {
    // same
  }
}

function browserStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

function listOf<T>(x: unknown, is: (v: unknown) => v is T): T[] {
  return Array.isArray(x) ? x.filter(is) : [];
}
