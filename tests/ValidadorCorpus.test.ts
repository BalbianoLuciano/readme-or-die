import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { Documento, TextosNivel } from '../src/tipos/corpus';
import { validarDocumento, validarMapa, validarNivel, validarTextos, type MapaResumen } from '../src/sistemas/ValidadorCorpus';

const cargar = () => ({
  doc: JSON.parse(readFileSync('public/data/documentos/nivel_01.json', 'utf8')) as Documento,
  textos: JSON.parse(readFileSync('public/data/textos/nivel_01.json', 'utf8')) as TextosNivel,
});
const mapaValido: MapaResumen = {
  spawns: 1,
  interactuables: [
    { id: 'ESCR', texto_id: 'ESCR', es_documento: false, mecanica: 'escritorio' },
    { id: 'CAL', texto_id: 'CAL', es_documento: false, nota_id: 'nota_calendario' },
    { id: 'TAR', texto_id: 'TAR', es_documento: false, nota_id: 'nota_tarjeta' },
    { id: 'CAJ', texto_id: 'CAJ', es_documento: false, nota_id: 'nota_reunion' },
    { id: 'CART', texto_id: 'CART', es_documento: false, nota_id: 'nota_recorte' },
    ...['DISP', 'FOT', 'PLA', 'EVAC', 'MOST', 'MOL'].map((id) => ({ id, texto_id: id, es_documento: false })),
  ],
};

describe('validarDocumento', () => {
  it('el nivel 1 no tiene errores', () => {
    expect(validarDocumento(cargar().doc).errores).toEqual([]);
  });

  it('rechaza dos letales', () => {
    const { doc } = cargar();
    doc.datos.find((d) => d.id === 'd8')!.clase = 'letal';
    expect(validarDocumento(doc).errores.join()).toMatch(/exactamente 1 dato letal/);
  });

  it('rechaza un marcador sin dato y un dato sin marcador', () => {
    const { doc } = cargar();
    doc.cuerpo = doc.cuerpo.replace('{{d3}}', '{{d9}}');
    const e = validarDocumento(doc).errores.join('\n');
    expect(e).toMatch(/\{\{d9\}\} y no existe/);
    expect(e).toMatch(/\{\{d3\}\} aparece 0 veces/);
  });

  it('rechaza un falso sin corrección', () => {
    const { doc } = cargar();
    delete doc.datos.find((d) => d.id === 'd1')!.correccion;
    expect(validarDocumento(doc).errores.join()).toMatch(/d1 es falso y no tiene corrección/);
  });

  it('avisa si el cuerpo está fuera de 250–400 palabras', () => {
    expect(validarDocumento(cargar().doc).avisos.join()).toMatch(/palabras/);
  });
});

describe('validarTextos', () => {
  it('el nivel 1 no tiene errores', () => {
    const { doc, textos } = cargar();
    expect(validarTextos(textos, doc).errores).toEqual([]);
  });

  it('exige una sola nota de alerta', () => {
    const { doc, textos } = cargar();
    textos.notas.find((n) => n.id === 'nota_recorte')!.clase = 'correccion';
    expect(validarTextos(textos, doc).errores.join()).toMatch(/1 nota de alerta/);
  });

  it('la nota requerida tiene que aportar exactamente la corrección', () => {
    const { doc, textos } = cargar();
    textos.notas.find((n) => n.id === 'nota_reunion')!.valores!.hora = 'ocho y media';
    expect(validarTextos(textos, doc).errores.join()).toMatch(/nota_reunion no aporta/);
  });

  it('la introducción no puede tener números', () => {
    const { doc, textos } = cargar();
    textos.introduccion.cuadros[0] = 'Qué lástima, Homero. Son las 9.';
    expect(validarTextos(textos, doc).errores.join()).toMatch(/contiene un número/);
  });
});

describe('validarMapa', () => {
  it('el resumen del nivel 1 es válido', () => {
    expect(validarMapa(mapaValido, cargar().textos).errores).toEqual([]);
  });

  it('toda nota tiene que estar en el escenario', () => {
    const mapa = { ...mapaValido, interactuables: mapaValido.interactuables.filter((i) => i.id !== 'CART') };
    expect(validarMapa(mapa, cargar().textos).errores.join()).toMatch(/nota_recorte no la entrega/);
  });

  it('un texto_id inexistente es error', () => {
    const mapa = { ...mapaValido, interactuables: [...mapaValido.interactuables, { id: 'X', texto_id: 'NADA', es_documento: false }] };
    expect(validarMapa(mapa, cargar().textos).errores.join()).toMatch(/NADA no existe/);
  });
});

describe('validarNivel', () => {
  it('detecta ids cruzados entre documento y textos', () => {
    const { doc, textos } = cargar();
    textos.id = 'nivel_02';
    expect(validarNivel(doc, textos).errores.join()).toMatch(/nivel_01.*nivel_02/);
  });
});
