import type { Nota, Pertenencia, TipoDato } from '../tipos/corpus';
import type { Enmienda } from './Enmiendas';

/**
 * El estado del juego. No vive en ninguna escena: las escenas lo leen y lo mutan.
 * Es lo que permite que el Lector y la Caja compartan las notas sin pasarse datos.
 */

export interface Recuerdo {
  nivelId: string;
  datoId: string;
  texto: string;
  estado: 'recuperado' | 'destruido';
}

export interface EntradaArchivo {
  nivelId: string;
  archivo: string;
  tipo: TipoDato;
}

export interface Opciones {
  fuenteNoPixel: boolean;
  tamanoTexto: 1 | 2 | 3;
  interlineadoExtra: boolean;
  altoContraste: boolean;
}

export interface EstadoPersistente {
  nivelActual: string;
  nivelesCerrados: string[];
  recuerdos: Recuerdo[];
  archivo: EntradaArchivo[];
  opciones: Opciones;
}

export const OPCIONES_POR_DEFECTO: Opciones = {
  fuenteNoPixel: false,
  tamanoTexto: 1,
  interlineadoExtra: false,
  altoContraste: false,
};

export class EstadoJuego {
  // Persiste entre sesiones.
  nivelActual = 'nivel_01';
  nivelesCerrados: string[] = [];
  recuerdos: Recuerdo[] = [];
  archivo: EntradaArchivo[] = [];
  opciones: Opciones = { ...OPCIONES_POR_DEFECTO };

  // Es del nivel: se reinicia al entrar.
  notas: Nota[] = [];
  pertenencias: Pertenencia[] = [];
  documentoRecogido = false;
  enmiendas = new Map<string, Enmienda>();
  muertesEnNivel = 0;
  introVista = false;

  entrarAlNivel(nivelId: string): void {
    if (nivelId !== this.nivelActual) {
      this.nivelActual = nivelId;
      this.muertesEnNivel = 0;
      this.introVista = false;
    }
    this.notas = [];
    this.pertenencias = [];
    this.documentoRecogido = false;
    this.enmiendas = new Map();
  }

  /** Al reintentar tras morir: la caja queda como estaba, el documento se relee limpio. */
  reintentar(): void {
    this.enmiendas = new Map();
  }

  recogerNota(nota: Nota): boolean {
    if (this.notas.some((n) => n.id === nota.id)) return false;
    this.notas.push(nota);
    return true;
  }

  guardarPertenencia(p: Pertenencia): void {
    if (!this.pertenencias.some((x) => x.id === p.id)) this.pertenencias.push(p);
  }

  archivarMuerte(nivelId: string, archivo: string, tipo: TipoDato): void {
    this.muertesEnNivel += 1;
    if (!this.archivo.some((a) => a.nivelId === nivelId && a.tipo === tipo)) {
      this.archivo.push({ nivelId, archivo, tipo });
    }
  }

  agregarRecuerdo(r: Recuerdo): void {
    this.recuerdos = this.recuerdos.filter((x) => !(x.nivelId === r.nivelId && x.datoId === r.datoId));
    this.recuerdos.push(r);
  }

  cerrarNivel(nivelId: string): void {
    if (!this.nivelesCerrados.includes(nivelId)) this.nivelesCerrados.push(nivelId);
  }

  aPersistente(): EstadoPersistente {
    return {
      nivelActual: this.nivelActual,
      nivelesCerrados: [...this.nivelesCerrados],
      recuerdos: [...this.recuerdos],
      archivo: [...this.archivo],
      opciones: { ...this.opciones },
    };
  }

  cargarPersistente(p: EstadoPersistente): void {
    this.nivelActual = p.nivelActual;
    this.nivelesCerrados = [...p.nivelesCerrados];
    this.recuerdos = [...p.recuerdos];
    this.archivo = [...p.archivo];
    this.opciones = { ...OPCIONES_POR_DEFECTO, ...p.opciones };
  }
}

/** La única instancia. Las escenas la importan. */
export const estado = new EstadoJuego();
