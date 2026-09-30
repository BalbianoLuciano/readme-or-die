/**
 * Ajuste de línea propio. Phaser no corta las líneas: las cortamos nosotros.
 *
 * - La regla es en caracteres, no en píxeles: `columnas` es el ancho máximo de cada línea.
 *   Con la fuente monoespaciada del juego, una columna es un carácter.
 * - Las palabras no se parten, salvo que una sola palabra sea más larga que `columnas`.
 * - Ninguna línea termina en espacio (esquiva el bug phaserjs/phaser#6860).
 * - Los saltos de línea del texto se respetan: cada párrafo se envuelve por separado
 *   y una línea vacía en el texto produce una línea vacía en la salida.
 *
 * `envolverSegmentos` es la versión que usa el lector: el texto entra partido en
 * segmentos, cada uno con una etiqueta opcional (el id del dato al que pertenece),
 * y cada línea sale partida en segmentos que conservan esa etiqueta. Así el lector
 * sabe qué tramo de cada línea subrayar o invertir.
 */

export interface Segmento {
  texto: string;
  /** Id del dato al que pertenece el tramo, o ausente si es texto plano. */
  dato?: string;
}

export type Linea = Segmento[];

/** Una palabra es una secuencia de caracteres sin espacios; cada carácter sabe a qué dato pertenece. */
type Caracter = { ch: string; dato?: string };
type Palabra = Caracter[];

export function envolver(texto: string, columnas: number): string[] {
  return envolverSegmentos([{ texto }], columnas).map(textoDeLinea);
}

export function envolverSegmentos(segmentos: Segmento[], columnas: number): Linea[] {
  if (!Number.isInteger(columnas) || columnas < 1) {
    throw new RangeError(`envolver: columnas debe ser un entero ≥ 1, se recibió ${columnas}`);
  }

  const lineas: Linea[] = [];
  for (const parrafo of partirEnParrafos(segmentos)) {
    lineas.push(...envolverParrafo(parrafo, columnas));
  }
  return lineas;
}

export function textoDeLinea(linea: Linea): string {
  return linea.map((s) => s.texto).join('');
}

/** Corta la lista de segmentos en párrafos por cada `\n`, conservando las etiquetas. */
function partirEnParrafos(segmentos: Segmento[]): Segmento[][] {
  const parrafos: Segmento[][] = [[]];
  for (const seg of segmentos) {
    const trozos = seg.texto.split('\n');
    trozos.forEach((trozo, i) => {
      if (i > 0) parrafos.push([]);
      if (trozo.length > 0) parrafos[parrafos.length - 1].push(segmento(trozo, seg.dato));
    });
  }
  return parrafos;
}

function segmento(texto: string, dato?: string): Segmento {
  return dato === undefined ? { texto } : { texto, dato };
}

/** Parte el párrafo en palabras. Los espacios y tabulaciones separan; todo lo demás se pega, tenga o no dato. */
function palabrasDe(parrafo: Segmento[]): Palabra[] {
  const palabras: Palabra[] = [];
  let actual: Palabra = [];
  for (const seg of parrafo) {
    for (const ch of seg.texto) {
      if (ch === ' ' || ch === '\t') {
        if (actual.length > 0) palabras.push(actual);
        actual = [];
      } else {
        actual.push(seg.dato === undefined ? { ch } : { ch, dato: seg.dato });
      }
    }
  }
  if (actual.length > 0) palabras.push(actual);
  return palabras;
}

function envolverParrafo(parrafo: Segmento[], columnas: number): Linea[] {
  const palabras = palabrasDe(parrafo);
  if (palabras.length === 0) return [[]];

  const lineas: Linea[] = [];
  let actual: Caracter[] = [];

  for (const palabra of palabras) {
    for (const trozo of partirPalabra(palabra, columnas)) {
      if (actual.length === 0) {
        actual = [...trozo];
      } else if (actual.length + 1 + trozo.length <= columnas) {
        actual.push({ ch: ' ' }, ...trozo);
      } else {
        lineas.push(agrupar(actual));
        actual = [...trozo];
      }
    }
  }
  lineas.push(agrupar(actual));
  return lineas;
}

/** Parte una palabra más larga que `columnas` en trozos de a lo sumo `columnas`. */
function partirPalabra(palabra: Palabra, columnas: number): Palabra[] {
  if (palabra.length <= columnas) return [palabra];
  const trozos: Palabra[] = [];
  for (let i = 0; i < palabra.length; i += columnas) trozos.push(palabra.slice(i, i + columnas));
  return trozos;
}

/**
 * Convierte la línea de caracteres en segmentos, uniendo vecinos con la misma etiqueta.
 * Un espacio entre dos tramos del mismo dato pertenece al dato.
 */
function agrupar(caracteres: Caracter[]): Linea {
  const etiquetas = caracteres.map((c, i) => {
    if (c.ch !== ' ' || c.dato !== undefined) return c.dato;
    const antes = caracteres[i - 1]?.dato;
    const despues = caracteres[i + 1]?.dato;
    return antes !== undefined && antes === despues ? antes : undefined;
  });
  const linea: Linea = [];
  caracteres.forEach((c, i) => {
    const ultimo = linea[linea.length - 1];
    if (ultimo && ultimo.dato === etiquetas[i]) ultimo.texto += c.ch;
    else linea.push(segmento(c.ch, etiquetas[i]));
  });
  return linea;
}
