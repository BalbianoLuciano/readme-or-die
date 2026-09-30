import { describe, expect, it } from 'vitest';
import { envolver } from '../src/sistemas/Tipografia';

describe('envolver', () => {
  it('deja intacto un texto que entra en una línea', () => {
    expect(envolver('Llegué tarde.', 66)).toEqual(['Llegué tarde.']);
  });

  it('nunca produce una línea más larga que las columnas', () => {
    const texto = 'Llegué a la oficina a las nueve y veinte y nadie me estaba esperando en la recepción del edificio.';
    for (const columnas of [10, 20, 33, 66]) {
      for (const linea of envolver(texto, columnas)) {
        expect(linea.length).toBeLessThanOrEqual(columnas);
      }
    }
  });

  it('no parte palabras', () => {
    const lineas = envolver('uno dos tres cuatro cinco', 9);
    expect(lineas).toEqual(['uno dos', 'tres', 'cuatro', 'cinco']);
  });

  it('ninguna línea termina ni empieza con espacio', () => {
    const texto = 'Llegué a la oficina a las nueve y veinte y nadie me estaba esperando.';
    for (const columnas of [7, 12, 30]) {
      for (const linea of envolver(texto, columnas)) {
        expect(linea).toBe(linea.trim());
      }
    }
  });

  it('respeta los saltos de línea del texto y conserva las líneas vacías', () => {
    expect(envolver('primer párrafo\n\nsegundo', 66)).toEqual(['primer párrafo', '', 'segundo']);
  });

  it('parte una palabra más larga que las columnas', () => {
    expect(envolver('supercalifragilístico', 8)).toEqual(['supercal', 'ifragilí', 'stico']);
  });

  it('colapsa espacios repetidos y tabulaciones', () => {
    expect(envolver('uno   dos\ttres', 66)).toEqual(['uno dos tres']);
  });

  it('un texto vacío es una sola línea vacía', () => {
    expect(envolver('', 66)).toEqual(['']);
  });

  it('una línea que llena exactamente las columnas no gana una línea de más', () => {
    expect(envolver('abc def', 7)).toEqual(['abc def']);
    expect(envolver('abc def', 6)).toEqual(['abc', 'def']);
  });

  it('rechaza columnas inválidas', () => {
    expect(() => envolver('x', 0)).toThrow(RangeError);
    expect(() => envolver('x', 2.5)).toThrow(RangeError);
  });

  it('reconstruye el texto original al unir las líneas', () => {
    const texto = 'Me acuerdo del pasillo, del dispenser de agua y de la planta que nadie regaba.';
    expect(envolver(texto, 20).join(' ')).toBe(texto);
  });
});
