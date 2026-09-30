import type Phaser from 'phaser';
import type { Documento, Nivel, PropiedadesInteractuable, TextosNivel } from '../tipos/corpus';
import { validarNivel, type MapaResumen } from './ValidadorCorpus';

/**
 * Carga un nivel desde `public/data/` y lo valida. En dev, un nivel inválido
 * es un error en consola con el detalle, no un fallo silencioso.
 */

export function claveDocumento(nivelId: string): string {
  return `documento_${nivelId}`;
}
export function claveTextos(nivelId: string): string {
  return `textos_${nivelId}`;
}
export function claveMapa(nivelId: string): string {
  return `mapa_${nivelId}`;
}

export function encolarNivel(load: Phaser.Loader.LoaderPlugin, nivelId: string): void {
  load.json(claveDocumento(nivelId), `data/documentos/${nivelId}.json`);
  load.json(claveTextos(nivelId), `data/textos/${nivelId}.json`);
  load.tilemapTiledJSON(claveMapa(nivelId), `data/mapas/${nivelId}.json`);
}

export function obtenerNivel(cache: Phaser.Cache.CacheManager, nivelId: string, mapa?: Phaser.Tilemaps.Tilemap): Nivel {
  const documento = cache.json.get(claveDocumento(nivelId)) as Documento | undefined;
  const textos = cache.json.get(claveTextos(nivelId)) as TextosNivel | undefined;
  if (!documento || !textos) throw new Error(`CargadorCorpus: falta el documento o los textos de ${nivelId}`);

  const resumen = mapa ? resumirMapa(mapa) : undefined;
  const { errores, avisos } = validarNivel(documento, textos, resumen);
  for (const a of avisos) console.warn(`[corpus] ${nivelId}: ${a}`);
  if (errores.length > 0) {
    console.error(`[corpus] ${nivelId} es inválido:\n  - ${errores.join('\n  - ')}`);
    if (import.meta.env.DEV) throw new Error(`Corpus inválido: ${nivelId}. Ver consola.`);
  }
  return { id: nivelId, documento, textos };
}

export function propiedadesDe(objeto: Phaser.Types.Tilemaps.TiledObject): PropiedadesInteractuable {
  const props: Record<string, unknown> = {};
  for (const p of (objeto.properties ?? []) as { name: string; value: unknown }[]) props[p.name] = p.value;
  return {
    id: String(props.id ?? objeto.name ?? ''),
    texto_id: String(props.texto_id ?? ''),
    es_documento: props.es_documento === true,
    nota_id: typeof props.nota_id === 'string' ? props.nota_id : undefined,
    mecanica: props.mecanica === 'escritorio' ? 'escritorio' : undefined,
  };
}

export function resumirMapa(mapa: Phaser.Tilemaps.Tilemap): MapaResumen {
  const capa = mapa.getObjectLayer('interactuables');
  const spawn = mapa.getObjectLayer('spawn');
  return {
    interactuables: (capa?.objects ?? []).map(propiedadesDe),
    spawns: (spawn?.objects ?? []).filter((o) => o.name === 'spawn').length,
  };
}
