import Phaser from 'phaser';

/** Resolución interna. Escala ×3 exacto a 1080p. */
export const ANCHO = 640;
export const ALTO = 360;

/** Tamaño de tile y del personaje base. */
export const TILE = 32;
export const PERSONAJE = { ancho: 32, alto: 48 } as const;

/** Color de fondo: el marco que sobra al escalar por enteros. */
export const COLOR_FONDO = '#241E1A';

/**
 * Zoom entero: el mayor entero que entra en la ventana, nunca menor que 1.
 * Nunca se escala a 1,5×. El sobrante queda como marco.
 */
export function zoomEntero(anchoVentana: number, altoVentana: number): number {
  return Math.max(1, Math.floor(Math.min(anchoVentana / ANCHO, altoVentana / ALTO)));
}

export function crearConfig(escenas: Phaser.Types.Scenes.SceneType[]): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent: 'juego',
    width: ANCHO,
    height: ALTO,
    backgroundColor: COLOR_FONDO,
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.NONE,
      zoom: zoomEntero(window.innerWidth, window.innerHeight),
    },
    physics: {
      default: 'arcade',
      arcade: { debug: false },
    },
    scene: escenas,
  };
}
