/**
 * Ajuste de línea propio. Phaser no corta las líneas: las cortamos nosotros.
 *
 * - La regla es en caracteres, no en píxeles: `columnas` es el ancho máximo de cada línea.
 * - Las palabras no se parten, salvo que una sola palabra sea más larga que `columnas`.
 * - Ninguna línea termina en espacio (esquiva el bug phaserjs/phaser#6860).
 * - Los saltos de línea del texto se respetan: cada párrafo se envuelve por separado
 *   y una línea vacía en el texto produce una línea vacía en la salida.
 */
export function envolver(texto: string, columnas: number): string[] {
  if (!Number.isInteger(columnas) || columnas < 1) {
    throw new RangeError(`envolver: columnas debe ser un entero ≥ 1, se recibió ${columnas}`);
  }

  const lineas: string[] = [];
  for (const parrafo of texto.split('\n')) {
    lineas.push(...envolverParrafo(parrafo, columnas));
  }
  return lineas;
}

function envolverParrafo(parrafo: string, columnas: number): string[] {
  const palabras = parrafo.split(/[ \t]+/).filter((p) => p.length > 0);
  if (palabras.length === 0) return [''];

  const lineas: string[] = [];
  let actual = '';

  for (const palabra of palabras) {
    for (const trozo of partir(palabra, columnas)) {
      if (actual.length === 0) {
        actual = trozo;
      } else if (actual.length + 1 + trozo.length <= columnas) {
        actual += ' ' + trozo;
      } else {
        lineas.push(actual);
        actual = trozo;
      }
    }
  }
  lineas.push(actual);
  return lineas;
}

/** Parte una palabra más larga que `columnas` en trozos de a lo sumo `columnas`. */
function partir(palabra: string, columnas: number): string[] {
  if (palabra.length <= columnas) return [palabra];
  const trozos: string[] = [];
  for (let i = 0; i < palabra.length; i += columnas) {
    trozos.push(palabra.slice(i, i + columnas));
  }
  return trozos;
}
