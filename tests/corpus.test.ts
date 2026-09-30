import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import type { Document, LevelTexts, LocalesManifest } from '../src/types/corpus';
import { validateLevel, validateTranslation, type MapSummary } from '../src/systems/CorpusValidator';

/**
 * Validates all of `public/data/`. A PR that breaks a level does not pass CI.
 * Reads the Tiled map straight from JSON, without Phaser. Every locale listed in the
 * manifest must have its files, and every translation must keep the source structure.
 */

interface TiledObject { name?: string; properties?: { name: string; value: unknown }[] }
interface TiledLayer { name: string; type: string; objects?: TiledObject[] }

const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, 'utf8')) as T;

function summarizeMap(path: string): MapSummary {
  const map = readJson<{ layers: TiledLayer[] }>(path);
  const layer = (n: string) => map.layers.find((l) => l.name === n)?.objects ?? [];
  return {
    spawns: layer('spawn').filter((o) => o.name === 'spawn').length,
    interactables: layer('interactables').map((o) => {
      const p: Record<string, unknown> = {};
      for (const x of o.properties ?? []) p[x.name] = x.value;
      return {
        id: String(p.id ?? o.name),
        text_id: String(p.text_id ?? ''),
        is_document: p.is_document === true,
        note_id: typeof p.note_id === 'string' ? p.note_id : undefined,
        mechanic: p.mechanic === 'desk' ? 'desk' : undefined,
      };
    }),
  };
}

const manifest = readJson<LocalesManifest>('public/data/locales.json');
const source = manifest.default;

describe('corpus in public/data', () => {
  it('the default locale has at least one level', () => {
    expect(manifest.locales[source].levels.length).toBeGreaterThan(0);
  });

  for (const [locale, info] of Object.entries(manifest.locales)) {
    it(`${locale}/ui.json exists`, () => {
      expect(existsSync(`public/data/${locale}/ui.json`)).toBe(true);
    });

    for (const id of info.levels) {
      it(`${locale}/${id} is valid`, () => {
        const doc = readJson<Document>(`public/data/${locale}/documents/${id}.json`);
        const texts = readJson<LevelTexts>(`public/data/${locale}/texts/${id}.json`);
        const map = summarizeMap(`public/data/maps/${id}.json`);
        const r = validateLevel(doc, texts, map);
        expect(r.errors).toEqual([]);
        for (const w of r.warnings) console.warn(`[corpus] ${locale}/${id}: ${w}`);
      });

      if (locale !== source) {
        it(`${locale}/${id} keeps the structure of ${source}/${id}`, () => {
          const src = readJson<Document>(`public/data/${source}/documents/${id}.json`);
          const tr = readJson<Document>(`public/data/${locale}/documents/${id}.json`);
          expect(validateTranslation(src, tr).errors).toEqual([]);
        });
      }
    }
  }
});
