import type Phaser from 'phaser';
import type { Document, InteractableProps, Level, LevelTexts, Locale, LocalesManifest, UiStrings } from '../types/corpus';
import { validateLevel, type MapSummary } from './CorpusValidator';
import { resolveLocale, setStrings } from './I18n';

/**
 * Loads a level from `public/data/` and validates it. In dev, an invalid level
 * is a console error with the details, not a silent failure.
 */

export const MANIFEST_KEY = 'locales';
export const uiKey = (locale: Locale) => `ui_${locale}`;
export const documentKey = (locale: Locale, levelId: string) => `document_${locale}_${levelId}`;
export const textsKey = (locale: Locale, levelId: string) => `texts_${locale}_${levelId}`;
export const mapKey = (levelId: string) => `map_${levelId}`;

export function queueManifest(load: Phaser.Loader.LoaderPlugin): void {
  load.json(MANIFEST_KEY, 'data/locales.json');
}

export function getManifest(cache: Phaser.Cache.CacheManager): LocalesManifest {
  const m = cache.json.get(MANIFEST_KEY) as LocalesManifest | undefined;
  if (!m) throw new Error('CorpusLoader: data/locales.json is not loaded');
  return m;
}

/** Queues the UI strings, the level's document and texts in the resolved locale, and the map. */
export function queueLevel(load: Phaser.Loader.LoaderPlugin, manifest: LocalesManifest, requested: Locale, levelId: string): Locale {
  const locale = resolveLocale(manifest, requested, levelId);
  load.json(uiKey(locale), `data/${locale}/ui.json`);
  load.json(documentKey(locale, levelId), `data/${locale}/documents/${levelId}.json`);
  load.json(textsKey(locale, levelId), `data/${locale}/texts/${levelId}.json`);
  load.tilemapTiledJSON(mapKey(levelId), `data/maps/${levelId}.json`);
  return locale;
}

export function getLevel(cache: Phaser.Cache.CacheManager, locale: Locale, levelId: string, map?: Phaser.Tilemaps.Tilemap): Level {
  const document = cache.json.get(documentKey(locale, levelId)) as Document | undefined;
  const texts = cache.json.get(textsKey(locale, levelId)) as LevelTexts | undefined;
  const ui = cache.json.get(uiKey(locale)) as UiStrings | undefined;
  if (!document || !texts || !ui) throw new Error(`CorpusLoader: ${locale}/${levelId} is missing its document, texts or ui`);
  setStrings(ui);

  const summary = map ? summarizeMap(map) : undefined;
  const { errors, warnings } = validateLevel(document, texts, summary);
  for (const w of warnings) console.warn(`[corpus] ${locale}/${levelId}: ${w}`);
  if (errors.length > 0) {
    console.error(`[corpus] ${locale}/${levelId} is invalid:\n  - ${errors.join('\n  - ')}`);
    if (import.meta.env.DEV) throw new Error(`Invalid corpus: ${locale}/${levelId}. See console.`);
  }
  return { id: levelId, locale, document, texts };
}

export function propsOf(object: Phaser.Types.Tilemaps.TiledObject): InteractableProps {
  const props: Record<string, unknown> = {};
  for (const p of (object.properties ?? []) as { name: string; value: unknown }[]) props[p.name] = p.value;
  return {
    id: String(props.id ?? object.name ?? ''),
    text_id: String(props.text_id ?? ''),
    is_document: props.is_document === true,
    note_id: typeof props.note_id === 'string' ? props.note_id : undefined,
    mechanic: props.mechanic === 'desk' ? 'desk' : undefined,
    sprite: typeof props.sprite === 'string' ? props.sprite : undefined,
    atlas: props.atlas === 'own' ? 'own' : undefined,
    depth_offset: typeof props.depth_offset === 'number' ? props.depth_offset : undefined,
  };
}

export function summarizeMap(map: Phaser.Tilemaps.Tilemap): MapSummary {
  const layer = map.getObjectLayer('interactables');
  const spawn = map.getObjectLayer('spawn');
  return {
    interactables: (layer?.objects ?? []).map(propsOf),
    spawns: (spawn?.objects ?? []).filter((o) => o.name === 'spawn').length,
  };
}
