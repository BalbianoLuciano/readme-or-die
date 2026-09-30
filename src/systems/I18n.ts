import type { Locale, LocalesManifest, UiStrings } from '../types/corpus';

/**
 * Locale resolution and UI labels. Spanish is the source language; a locale that lacks
 * a level falls back to the default one for that level.
 */

let strings: UiStrings = {};

export function setStrings(s: UiStrings): void {
  strings = s;
}

/** `t('closed.title')`, `t('reader.page', { n: 1, m: 3 })`. Missing keys return the key itself. */
export function t(key: string, params: Record<string, string | number> = {}): string {
  let node: UiStrings | string = strings;
  for (const part of key.split('.')) {
    if (typeof node === 'string' || node[part] === undefined) return key;
    node = node[part];
  }
  if (typeof node !== 'string') return key;
  return node.replace(/\{(\w+)\}/g, (_, p: string) => (params[p] !== undefined ? String(params[p]) : `{${p}}`));
}

export function isLocale(x: unknown): x is Locale {
  return x === 'es' || x === 'en';
}

/** The locale to use for a level: the requested one if it has that level, else the manifest's default. */
export function resolveLocale(manifest: LocalesManifest, requested: Locale, levelId: string): Locale {
  const has = (l: string) => manifest.locales[l]?.levels.includes(levelId) ?? false;
  if (has(requested)) return requested;
  return manifest.default;
}

/** Best initial locale from the browser, if we support it. */
export function browserLocale(manifest: LocalesManifest, language: string | undefined): Locale {
  const short = (language ?? '').slice(0, 2);
  return isLocale(short) && manifest.locales[short] ? short : manifest.default;
}
