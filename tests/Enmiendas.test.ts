import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { Documento, Nota, TextosNivel } from '../src/tipos/corpus';
import { fragmentoDe, notasAplicables, resolver, type Enmienda } from '../src/sistemas/Enmiendas';

const doc = JSON.parse(readFileSync('public/data/documentos/nivel_01.json', 'utf8')) as Documento;
const textos = JSON.parse(readFileSync('public/data/textos/nivel_01.json', 'utf8')) as TextosNivel;
const nota = (id: string): Nota => textos.notas.find((n) => n.id === id)!;
const con = (...lista: Enmienda[]) => new Map(lista.map((e) => [e.datoId, e]));
const corregir = (datoId: string, notaId: string, tipo: keyof NonNullable<Nota['valores']>): Enmienda => ({
  datoId, operacion: 'nota', notaId, valor: nota(notaId).valores![tipo]!,
});

describe('resolver: el nivel 1 según su spec', () => {
  it('firmar sin tocar nada: muere, y el archivo dice "hora"', () => {
    const v = resolver(doc, con());
    expect(v.sobrevive).toBe(false);
    expect(v.tipoLetal).toBe('hora');
    expect(v.enmiendas).toBe(0);
  });

  it('corregir solo el día y el piso: muere igual', () => {
    const v = resolver(doc, con(corregir('d1', 'nota_calendario', 'fecha'), corregir('d7', 'nota_tarjeta', 'numero')));
    expect(v.sobrevive).toBe(false);
    expect(v.resultados.filter((r) => r.efecto === 'recuperado').map((r) => r.dato.id)).toEqual(['d1', 'd7']);
  });

  it('corregir la hora con la confirmación: sobrevive y conserva el recuerdo', () => {
    const v = resolver(doc, con(corregir('d5', 'nota_reunion', 'hora')));
    expect(v.sobrevive).toBe(true);
    expect(v.resultados.find((r) => r.dato.id === 'd5')).toMatchObject({ efecto: 'recuperado', textoFinal: 'ocho y veinte' });
  });

  it('tachar la hora: sobrevive y pierde el recuerdo', () => {
    const v = resolver(doc, con({ datoId: 'd5', operacion: 'tachar' }));
    expect(v.sobrevive).toBe(true);
    expect(v.tachaduras).toBe(1);
    expect(v.resultados.find((r) => r.dato.id === 'd5')).toMatchObject({ efecto: 'destruido', tachado: true, textoFinal: 'nueve y veinte' });
  });

  it('"corregir" media hora, que es correcta: sobrevive si arregló la hora, pero destruye ese recuerdo', () => {
    const v = resolver(doc, con(corregir('d5', 'nota_reunion', 'hora'), corregir('d8', 'nota_recorte', 'hora')));
    expect(v.sobrevive).toBe(true);
    expect(v.resultados.find((r) => r.dato.id === 'd8')?.efecto).toBe('destruido');
  });

  it('poner la hora del recorte en la llegada no salva: sigue mal', () => {
    const v = resolver(doc, con(corregir('d5', 'nota_recorte', 'hora')));
    expect(v.sobrevive).toBe(false);
    expect(v.resultados.find((r) => r.dato.id === 'd5')?.efecto).toBe('sin_efecto');
  });

  it('la solución completa: sobrevive con tres recuerdos recuperados y ninguno destruido', () => {
    const v = resolver(doc, con(
      corregir('d5', 'nota_reunion', 'hora'),
      corregir('d1', 'nota_calendario', 'fecha'),
      corregir('d7', 'nota_tarjeta', 'numero'),
    ));
    expect(v.sobrevive).toBe(true);
    expect(v.resultados.filter((r) => r.efecto === 'recuperado')).toHaveLength(3);
    expect(v.resultados.filter((r) => r.efecto === 'destruido')).toHaveLength(0);
    expect(v.enmiendas).toBe(3);
  });
});

describe('notasAplicables', () => {
  it('para la hora de llegada ofrece las dos notas con hora, no la del calendario', () => {
    const d5 = doc.datos.find((d) => d.id === 'd5')!;
    expect(notasAplicables(d5, textos.notas).map((n) => n.id).sort()).toEqual(['nota_recorte', 'nota_reunion']);
  });

  it('para un nombre no ofrece nada: solo queda tachar', () => {
    const d3 = doc.datos.find((d) => d.id === 'd3')!;
    expect(notasAplicables(d3, textos.notas)).toEqual([]);
  });
});

describe('fragmentoDe', () => {
  it('devuelve la oración del dato con los valores finales', () => {
    expect(fragmentoDe(doc, 'd5', { d5: 'ocho y veinte' })).toBe('Llegué a Avenida Córdoba 1900 a las ocho y veinte.');
    expect(fragmentoDe(doc, 'd7', {})).toBe('Subí al piso 7.');
  });
});
