import { describe, expect, it } from 'vitest';
import { EstadoJuego } from '../src/sistemas/EstadoJuego';
import { CLAVE, cargar, deserializar, guardar, serializar } from '../src/sistemas/Persistencia';

const almacenFalso = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), m };
};

describe('Persistencia', () => {
  it('guarda y recupera lo que persiste, y solo eso', () => {
    const e = new EstadoJuego();
    e.entrarAlNivel('nivel_01');
    e.recogerNota({ id: 'n', clase: 'correccion', papel: 'p', texto: 't' });
    e.archivarMuerte('nivel_01', 'recuerdo_2024.md', 'hora');
    e.agregarRecuerdo({ nivelId: 'nivel_01', datoId: 'd1', texto: 'x', estado: 'recuperado' });
    e.cerrarNivel('nivel_01');

    const a = almacenFalso();
    guardar(e.aPersistente(), a);
    const leido = cargar(a)!;
    expect(leido.archivo).toEqual([{ nivelId: 'nivel_01', archivo: 'recuerdo_2024.md', tipo: 'hora' }]);
    expect(leido.recuerdos).toHaveLength(1);
    expect(leido.nivelesCerrados).toEqual(['nivel_01']);
    expect(JSON.stringify(leido)).not.toMatch(/"notas"/);
  });

  it('ignora una partida de otra versión o rota', () => {
    expect(deserializar(JSON.stringify({ version: 0, nivelActual: 'nivel_01' }))).toBeNull();
    expect(deserializar('{no es json')).toBeNull();
    expect(deserializar(null)).toBeNull();
  });

  it('completa opciones faltantes con los valores por defecto', () => {
    const p = deserializar(JSON.stringify({ version: 1, nivelActual: 'nivel_03', opciones: { altoContraste: true } }))!;
    expect(p.opciones).toMatchObject({ altoContraste: true, fuenteNoPixel: false, tamanoTexto: 1 });
    expect(p.nivelesCerrados).toEqual([]);
  });

  it('usa la clave con versión', () => {
    const a = almacenFalso();
    guardar(new EstadoJuego().aPersistente(), a);
    expect([...a.m.keys()]).toEqual([CLAVE]);
    expect(serializar(new EstadoJuego().aPersistente())).toMatch(/"version":1/);
  });

  it('sin almacenamiento no rompe', () => {
    expect(() => guardar(new EstadoJuego().aPersistente(), null)).not.toThrow();
    expect(cargar(null)).toBeNull();
  });
});
