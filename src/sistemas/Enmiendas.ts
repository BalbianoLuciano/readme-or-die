import type { Dato, Documento, Nota, TipoDato } from '../tipos/corpus';

/**
 * Resuelve qué pasa con cada dato al firmar. Lógica pura, sin Phaser.
 *
 * Por dato:
 * - letal:        sobrevive solo si está tachado o corregido con la nota requerida.
 * - inocuo falso: corregido con la nota requerida recupera el recuerdo; tachado lo destruye;
 *                 con otra nota o intacto, nada.
 * - correcto:     intacto conserva; cualquier cambio (nota o tachadura) lo destruye.
 */

export type Enmienda =
  | { datoId: string; operacion: 'nota'; notaId: string; valor: string }
  | { datoId: string; operacion: 'tachar' };

export type Efecto = 'intacto' | 'recuperado' | 'destruido' | 'sin_efecto';

export interface ResultadoDato {
  dato: Dato;
  efecto: Efecto;
  /** Texto que quedó en el documento firmado (el original si se tachó). */
  textoFinal: string;
  tachado: boolean;
}

export interface Veredicto {
  sobrevive: boolean;
  /** Tipo del dato letal, para el Archivo. Nunca por qué. */
  tipoLetal: TipoDato;
  resultados: ResultadoDato[];
  enmiendas: number;
  tachaduras: number;
}

/** Operaciones del formulario y qué tipos de dato cubre cada una. */
export const OPERACIONES = {
  cuando: ['fecha', 'hora'] as TipoDato[],
  donde: ['lugar', 'numero'] as TipoDato[],
} as const;

export type Operacion = keyof typeof OPERACIONES;

export function operacionPara(tipo: TipoDato): Operacion | null {
  if (OPERACIONES.cuando.includes(tipo)) return 'cuando';
  if (OPERACIONES.donde.includes(tipo)) return 'donde';
  return null;
}

/** Notas de la caja que aportan un valor para el tipo del dato. Nunca se ofrece una que no sirve. */
export function notasAplicables(dato: Dato, notas: Nota[]): Nota[] {
  return notas.filter((n) => n.valores?.[dato.tipo] !== undefined);
}

export function textoActual(dato: Dato, enmiendas: Map<string, Enmienda>): string {
  const e = enmiendas.get(dato.id);
  return e?.operacion === 'nota' ? e.valor : dato.texto;
}

export function resolver(doc: Documento, enmiendas: Map<string, Enmienda>): Veredicto {
  const letal = doc.datos.find((d) => d.clase === 'letal');
  if (!letal) throw new Error(`Enmiendas: ${doc.id} no tiene dato letal`);

  const resultados = doc.datos.map((dato) => resolverDato(dato, enmiendas.get(dato.id)));
  const delLetal = resultados.find((r) => r.dato.id === letal.id)!;
  const lista = [...enmiendas.values()];

  return {
    sobrevive: delLetal.tachado || delLetal.efecto === 'recuperado',
    tipoLetal: letal.tipo,
    resultados,
    enmiendas: lista.filter((e) => e.operacion === 'nota').length,
    tachaduras: lista.filter((e) => e.operacion === 'tachar').length,
  };
}

function resolverDato(dato: Dato, enmienda: Enmienda | undefined): ResultadoDato {
  if (!enmienda) return { dato, efecto: 'intacto', textoFinal: dato.texto, tachado: false };

  if (enmienda.operacion === 'tachar') {
    return { dato, efecto: 'destruido', textoFinal: dato.texto, tachado: true };
  }

  const falso = dato.clase !== 'correcto';
  if (!falso) return { dato, efecto: 'destruido', textoFinal: enmienda.valor, tachado: false };

  const bien = enmienda.notaId === dato.nota_requerida || enmienda.valor === dato.correccion;
  return { dato, efecto: bien ? 'recuperado' : 'sin_efecto', textoFinal: enmienda.valor, tachado: false };
}

/**
 * La oración del documento donde vive el dato, con los valores finales.
 * Es el "fragmento" que la caja muestra como recuperado o destruido.
 */
export function fragmentoDe(doc: Documento, datoId: string, valores: Record<string, string>): string {
  const marcador = `{{${datoId}}}`;
  const parrafo = doc.cuerpo.split('\n').find((p) => p.includes(marcador));
  if (!parrafo) return '';
  const oraciones = parrafo.match(/[^.]+\.?/g) ?? [parrafo];
  const oracion = oraciones.find((o) => o.includes(marcador)) ?? parrafo;
  const porId = new Map(doc.datos.map((d) => [d.id, d.texto]));
  return oracion
    .replace(/\{\{(\w+)\}\}/g, (_, id: string) => valores[id] ?? porId.get(id) ?? '')
    .trim();
}
