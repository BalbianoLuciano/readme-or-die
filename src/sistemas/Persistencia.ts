import { OPCIONES_POR_DEFECTO, type EstadoPersistente } from './EstadoJuego';

/**
 * Guardado en localStorage. La clave lleva versión a propósito: cuando el formato cambie,
 * la partida vieja se ignora en vez de romper.
 */
export const CLAVE = 'readme-or-die.v1';

interface Almacen {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

export function serializar(estado: EstadoPersistente): string {
  return JSON.stringify({ version: 1, ...estado });
}

/** Devuelve null si el texto no es una partida válida de esta versión. */
export function deserializar(texto: string | null): EstadoPersistente | null {
  if (!texto) return null;
  let crudo: unknown;
  try {
    crudo = JSON.parse(texto);
  } catch {
    return null;
  }
  if (!esObjeto(crudo) || crudo.version !== 1) return null;
  if (typeof crudo.nivelActual !== 'string') return null;
  return {
    nivelActual: crudo.nivelActual,
    nivelesCerrados: listaDe(crudo.nivelesCerrados, (x): x is string => typeof x === 'string'),
    recuerdos: listaDe(crudo.recuerdos, esObjeto) as unknown as EstadoPersistente['recuerdos'],
    archivo: listaDe(crudo.archivo, esObjeto) as unknown as EstadoPersistente['archivo'],
    opciones: { ...OPCIONES_POR_DEFECTO, ...(esObjeto(crudo.opciones) ? crudo.opciones : {}) },
  };
}

export function guardar(estado: EstadoPersistente, almacen: Almacen | null = almacenDelNavegador()): void {
  try {
    almacen?.setItem(CLAVE, serializar(estado));
  } catch {
    // Sin almacenamiento (modo privado, cuota): el juego sigue, sin guardar.
  }
}

export function cargar(almacen: Almacen | null = almacenDelNavegador()): EstadoPersistente | null {
  try {
    return deserializar(almacen?.getItem(CLAVE) ?? null);
  } catch {
    return null;
  }
}

export function borrar(almacen: Almacen | null = almacenDelNavegador()): void {
  try {
    almacen?.removeItem(CLAVE);
  } catch {
    // ídem
  }
}

function almacenDelNavegador(): Almacen | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function esObjeto(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

function listaDe<T>(x: unknown, es: (v: unknown) => v is T): T[] {
  return Array.isArray(x) ? x.filter(es) : [];
}
