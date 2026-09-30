import Phaser from 'phaser';

/** Internal resolution. Scales ×3 exactly to 1080p. */
export const WIDTH = 640;
export const HEIGHT = 360;

/** Tile size and base character size. */
export const TILE = 32;
export const CHARACTER = { width: 32, height: 48 } as const;

/** Background colour: the frame left over by integer scaling. */
export const BACKGROUND_COLOR = '#241E1A';

/**
 * Integer zoom: the largest integer that fits the window, never below 1.
 * Never 1.5×. The remainder is left as a frame.
 */
export function integerZoom(windowWidth: number, windowHeight: number): number {
  return Math.max(1, Math.floor(Math.min(windowWidth / WIDTH, windowHeight / HEIGHT)));
}

export function createConfig(scenes: Phaser.Types.Scenes.SceneType[]): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent: 'game',
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: BACKGROUND_COLOR,
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.NONE,
      zoom: integerZoom(window.innerWidth, window.innerHeight),
    },
    physics: {
      default: 'arcade',
      arcade: { debug: false },
    },
    scene: scenes,
  };
}
