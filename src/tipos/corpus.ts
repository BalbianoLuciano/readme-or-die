/**
 * Esquema del corpus. Todo lo que vive en `public/data/` responde a estos tipos.
 * El motor no necesita saber nada más que esto de un nivel.
 */

export type TipoDato = 'fecha' | 'hora' | 'lugar' | 'nombre' | 'numero';
export type ClaseDato = 'letal' | 'inocuo_falso' | 'correcto';
export type ClaseNota = 'correccion' | 'alerta' | 'ambiente';

export interface Dato {
  id: string;
  /** El texto tal como aparece en el documento. */
  texto: string;
  tipo: TipoDato;
  clase: ClaseDato;
  /** Solo para datos falsos: el valor verdadero. */
  correccion?: string;
  /** Solo para datos falsos: la nota que aporta la corrección. */
  nota_requerida?: string;
}

export interface Documento {
  id: string;
  /** Nombre con el que se muestra: `recuerdo_2024.md`. */
  archivo: string;
  anio: number;
  /** Prosa con marcadores `{{dN}}` donde va cada dato. Párrafos separados por línea vacía. */
  cuerpo: string;
  datos: Dato[];
}

export interface Nota {
  id: string;
  clase: ClaseNota;
  /** Cómo se llama el papel en la caja: "Hoja de calendario". */
  papel: string;
  /** Lo que dice, legible directamente en la caja. */
  texto: string;
  /** Qué valor aporta para cada tipo de dato que puede corregir. Una nota sin valores no enmienda nada. */
  valores?: Partial<Record<TipoDato, string>>;
}

export interface Pertenencia {
  id: string;
  nombre: string;
  /** Lo que dice el cuadro de texto al guardarla. */
  texto: string;
}

export interface Introduccion {
  /** Quién habla. No se muestra nunca: es documentación para el equipo. */
  voz: string;
  cuadros: string[];
}

export interface TextosNivel {
  id: string;
  introduccion: Introduccion;
  /** Texto exacto de cada consultable, por `texto_id`. */
  consultas: Record<string, string>;
  /** Las notas que el escenario puede dar. */
  notas: Nota[];
  /** Lo que hay en el escritorio, en el orden en que se guarda. El documento va aparte y siempre al final. */
  pertenencias: Pertenencia[];
  texto_filosofico: string;
}

/** Propiedades de un objeto de la capa `interactuables` de Tiled. */
export interface PropiedadesInteractuable {
  id: string;
  texto_id: string;
  es_documento: boolean;
  /** Si al consultarlo entrega una nota a la caja. */
  nota_id?: string;
  /** Comportamiento especial. `escritorio`: la apertura del nivel 1. */
  mecanica?: 'escritorio';
}

export interface Nivel {
  id: string;
  documento: Documento;
  textos: TextosNivel;
}
