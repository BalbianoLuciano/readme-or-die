import type { ClaseNota, Documento, Nota, PropiedadesInteractuable, TextosNivel } from '../tipos/corpus';

/**
 * Convierte en código la parte mecánica de la lista de verificación del corpus.
 * Chequea estructura, no tono: el método oblicuo y los anti-objetivos necesitan ojo humano.
 *
 * Corre en CI sobre todo `public/data/` (tests/corpus.test.ts) y en dev al cargar un nivel.
 */

export interface ResultadoValidacion {
  errores: string[];
  avisos: string[];
}

export interface MapaResumen {
  interactuables: PropiedadesInteractuable[];
  spawns: number;
}

const MARCADOR = /\{\{(\w+)\}\}/g;

export function validarDocumento(doc: Documento): ResultadoValidacion {
  const errores: string[] = [];
  const avisos: string[] = [];
  const ids = doc.datos.map((d) => d.id);

  if (new Set(ids).size !== ids.length) errores.push('hay ids de dato repetidos');

  const letales = doc.datos.filter((d) => d.clase === 'letal');
  if (letales.length !== 1) errores.push(`tiene que haber exactamente 1 dato letal, hay ${letales.length}`);

  const inocuos = doc.datos.filter((d) => d.clase === 'inocuo_falso');
  if (inocuos.length < 2 || inocuos.length > 3) errores.push(`tiene que haber 2 o 3 inocuos falsos, hay ${inocuos.length}`);

  if (doc.datos.length < 6 || doc.datos.length > 9) errores.push(`tiene que haber entre 6 y 9 datos, hay ${doc.datos.length}`);

  for (const d of doc.datos) {
    const falso = d.clase !== 'correcto';
    if (falso && !d.correccion) errores.push(`${d.id} es falso y no tiene corrección`);
    if (falso && !d.nota_requerida) errores.push(`${d.id} es falso y no tiene nota_requerida`);
    if (!falso && (d.correccion || d.nota_requerida)) errores.push(`${d.id} es correcto y no debería tener corrección ni nota`);
    if (falso && d.correccion === d.texto) errores.push(`${d.id}: la corrección es igual al texto`);
  }

  // Marcadores del cuerpo ↔ datos, en las dos direcciones y exactamente una vez.
  const enCuerpo = [...doc.cuerpo.matchAll(MARCADOR)].map((m) => m[1]);
  for (const id of enCuerpo) if (!ids.includes(id)) errores.push(`el cuerpo usa {{${id}}} y no existe ese dato`);
  for (const id of ids) {
    const veces = enCuerpo.filter((x) => x === id).length;
    if (veces !== 1) errores.push(`{{${id}}} aparece ${veces} veces en el cuerpo, tiene que aparecer 1`);
  }

  const palabras = contarPalabras(sustituir(doc));
  if (palabras < 250 || palabras > 400) avisos.push(`el cuerpo tiene ${palabras} palabras; la regla es 250 a 400`);

  if (/—/.test(doc.cuerpo)) avisos.push('el cuerpo usa raya larga (—), que es de doble ancho en la fuente; usar guion (–)');

  return { errores, avisos };
}

export function validarTextos(textos: TextosNivel, doc: Documento): ResultadoValidacion {
  const errores: string[] = [];
  const avisos: string[] = [];

  const cuadros = textos.introduccion.cuadros;
  if (cuadros.length < 3 || cuadros.length > 5) errores.push(`la introducción tiene ${cuadros.length} cuadros, tienen que ser 3 a 5`);
  cuadros.forEach((c, i) => {
    if (/\d/.test(c)) errores.push(`el cuadro ${i + 1} de la introducción contiene un número: ningún dato en la introducción`);
  });

  const porClase = (clase: ClaseNota) => textos.notas.filter((n) => n.clase === clase);
  if (porClase('alerta').length !== 1) errores.push(`tiene que haber exactamente 1 nota de alerta, hay ${porClase('alerta').length}`);

  const notas = new Map(textos.notas.map((n) => [n.id, n]));
  for (const d of doc.datos) {
    if (d.clase === 'correcto') continue;
    const nota = d.nota_requerida ? notas.get(d.nota_requerida) : undefined;
    if (!nota) {
      errores.push(`${d.id} requiere la nota ${d.nota_requerida} y no existe`);
      continue;
    }
    if (nota.clase !== 'correccion') errores.push(`${d.id} requiere ${nota.id}, que no es de clase correccion`);
    if (nota.valores?.[d.tipo] !== d.correccion) {
      errores.push(`${nota.id} no aporta el valor ${JSON.stringify(d.correccion)} para el tipo ${d.tipo} que ${d.id} necesita`);
    }
  }
  for (const n of textos.notas) {
    if (n.clase === 'ambiente') avisos.push(`${n.id} es una nota de clase ambiente; las de ambiente son consultas, no notas`);
    if (n.clase !== 'ambiente' && (!n.valores || Object.keys(n.valores).length === 0)) avisos.push(`${n.id} no aporta ningún valor`);
  }

  const filosofico = contarPalabras(textos.texto_filosofico);
  if (filosofico < 30 || filosofico > 70) errores.push(`el texto filosófico tiene ${filosofico} palabras, tienen que ser 30 a 70`);

  return { errores, avisos };
}

export function validarMapa(mapa: MapaResumen, textos: TextosNivel): ResultadoValidacion {
  const errores: string[] = [];
  const avisos: string[] = [];

  if (mapa.spawns !== 1) errores.push(`el mapa tiene ${mapa.spawns} spawn, tiene que tener 1`);

  const ids = mapa.interactuables.map((i) => i.id);
  if (new Set(ids).size !== ids.length) errores.push('hay ids de interactuable repetidos');

  const notas = new Map(textos.notas.map((n) => [n.id, n]));
  const notasEntregadas = new Set<string>();
  for (const i of mapa.interactuables) {
    if (!(i.texto_id in textos.consultas)) errores.push(`${i.id}: texto_id ${i.texto_id} no existe en consultas`);
    if (i.nota_id) {
      if (!notas.has(i.nota_id)) errores.push(`${i.id}: nota_id ${i.nota_id} no existe`);
      notasEntregadas.add(i.nota_id);
    }
  }
  // Todas las notas están físicamente en el escenario.
  for (const n of textos.notas) {
    if (n.clase !== 'ambiente' && !notasEntregadas.has(n.id)) errores.push(`la nota ${n.id} no la entrega ningún interactuable del escenario`);
  }

  const consultables = mapa.interactuables.filter((i) => !i.mecanica);
  if (consultables.length < 8 || consultables.length > 10) avisos.push(`hay ${consultables.length} consultables; la cuenta de partida es 8 a 10`);
  const conNota = consultables.filter((i) => i.nota_id).length;
  if (conNota < 4 || conNota > 5) avisos.push(`${conNota} consultables dan nota; la cuenta de partida es 4 a 5`);

  return { errores, avisos };
}

export function validarNivel(doc: Documento, textos: TextosNivel, mapa?: MapaResumen): ResultadoValidacion {
  const partes = [validarDocumento(doc), validarTextos(textos, doc)];
  if (mapa) partes.push(validarMapa(mapa, textos));
  if (doc.id !== textos.id) partes.push({ errores: [`el documento es ${doc.id} y los textos son ${textos.id}`], avisos: [] });
  return {
    errores: partes.flatMap((p) => p.errores),
    avisos: partes.flatMap((p) => p.avisos),
  };
}

/** Reemplaza cada marcador por el texto actual del dato. */
export function sustituir(doc: Documento, valores: Record<string, string> = {}): string {
  const porId = new Map(doc.datos.map((d) => [d.id, d.texto]));
  return doc.cuerpo.replace(MARCADOR, (_, id: string) => valores[id] ?? porId.get(id) ?? `{{${id}}}`);
}

export function contarPalabras(texto: string): number {
  return texto.split(/\s+/).filter((p) => p.length > 0).length;
}

/** Notas que tiene el jugador y sirven para un tipo dado. */
export function notasPara(tipo: keyof NonNullable<Nota['valores']>, notas: Nota[]): Nota[] {
  return notas.filter((n) => n.valores?.[tipo] !== undefined);
}
