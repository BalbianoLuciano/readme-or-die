import { describe, expect, it } from 'vitest';
import { envolver, envolverSegmentos, textoDeLinea } from '../src/sistemas/Tipografia';

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

describe('envolverSegmentos', () => {
  it('conserva la etiqueta del dato en cada tramo de línea', () => {
    const lineas = envolverSegmentos(
      [{ texto: 'Llegué a ' }, { texto: 'Avenida Córdoba 1900', dato: 'd4' }, { texto: ' a las ' }, { texto: 'nueve y veinte', dato: 'd5' }, { texto: '.' }],
      66,
    );
    expect(lineas).toEqual([
      [
        { texto: 'Llegué a ' },
        { texto: 'Avenida Córdoba 1900', dato: 'd4' },
        { texto: ' a las ' },
        { texto: 'nueve y veinte', dato: 'd5' },
        { texto: '.' },
      ],
    ]);
  });

  it('un dato que cae en el corte se reparte entre dos líneas con la misma etiqueta', () => {
    const lineas = envolverSegmentos([{ texto: 'Fue el ' }, { texto: '14 de marzo de 2024', dato: 'd2' }, { texto: '.' }], 14);
    expect(lineas.map(textoDeLinea)).toEqual(['Fue el 14 de', 'marzo de 2024.']);
    expect(lineas[0].at(-1)).toEqual({ texto: '14 de', dato: 'd2' });
    expect(lineas[1][0]).toEqual({ texto: 'marzo de 2024', dato: 'd2' });
    expect(lineas[1][1]).toEqual({ texto: '.' });
  });

  it('el texto plano de las líneas coincide con envolver', () => {
    const texto = 'Me habían citado a entregar la documentación del sistema nuevo. Martes 14 de marzo de 2024.';
    const segmentos = [{ texto: 'Me habían citado a entregar la documentación del sistema nuevo. ' }, { texto: 'Martes', dato: 'd1' }, { texto: ' ' }, { texto: '14 de marzo de 2024', dato: 'd2' }, { texto: '.' }];
    for (const columnas of [20, 33, 66]) {
      expect(envolverSegmentos(segmentos, columnas).map(textoDeLinea)).toEqual(envolver(texto, columnas));
    }
  });

  it('respeta párrafos aunque el salto esté dentro de un segmento', () => {
    const lineas = envolverSegmentos([{ texto: 'uno\n\ndos ' }, { texto: 'tres', dato: 'd1' }], 66);
    expect(lineas).toEqual([[{ texto: 'uno' }], [], [{ texto: 'dos ' }, { texto: 'tres', dato: 'd1' }]]);
  });

  it('un dato pegado a puntuación no la absorbe', () => {
    const lineas = envolverSegmentos([{ texto: '(' }, { texto: 'piso 7', dato: 'd7' }, { texto: '),' }], 66);
    expect(lineas[0]).toEqual([{ texto: '(' }, { texto: 'piso 7', dato: 'd7' }, { texto: '),' }]);
  });
});
