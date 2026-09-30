import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import type { Documento, TextosNivel } from '../src/tipos/corpus';
import { validarNivel, type MapaResumen } from '../src/sistemas/ValidadorCorpus';

/**
 * Valida todo `public/data/`. Un PR que rompe un nivel no pasa CI.
 * Lee el mapa de Tiled directamente del JSON, sin Phaser.
 */

interface ObjetoTiled { name?: string; properties?: { name: string; value: unknown }[] }
interface CapaTiled { name: string; type: string; objects?: ObjetoTiled[] }

function resumirMapa(ruta: string): MapaResumen {
  const mapa = JSON.parse(readFileSync(ruta, 'utf8')) as { layers: CapaTiled[] };
  const capa = (n: string) => mapa.layers.find((l) => l.name === n)?.objects ?? [];
  return {
    spawns: capa('spawn').filter((o) => o.name === 'spawn').length,
    interactuables: capa('interactuables').map((o) => {
      const p: Record<string, unknown> = {};
      for (const x of o.properties ?? []) p[x.name] = x.value;
      return {
        id: String(p.id ?? o.name),
        texto_id: String(p.texto_id ?? ''),
        es_documento: p.es_documento === true,
        nota_id: typeof p.nota_id === 'string' ? p.nota_id : undefined,
        mecanica: p.mecanica === 'escritorio' ? 'escritorio' : undefined,
      };
    }),
  };
}

const niveles = readdirSync('public/data/documentos').filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''));

describe('corpus en public/data', () => {
  it('hay al menos un nivel', () => expect(niveles.length).toBeGreaterThan(0));

  for (const id of niveles) {
    it(`${id} es válido`, () => {
      const doc = JSON.parse(readFileSync(`public/data/documentos/${id}.json`, 'utf8')) as Documento;
      const textos = JSON.parse(readFileSync(`public/data/textos/${id}.json`, 'utf8')) as TextosNivel;
      const mapa = resumirMapa(`public/data/mapas/${id}.json`);
      const r = validarNivel(doc, textos, mapa);
      expect(r.errores).toEqual([]);
      for (const a of r.avisos) console.warn(`[corpus] ${id}: ${a}`);
    });
  }
});
