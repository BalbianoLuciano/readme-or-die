import Phaser from 'phaser';
import { wrap } from '../systems/Typography';
import { COLOR, FONT, METRIC } from './Style';

export type Size = 'body' | 'ui';

/** A BitmapText already tinted and pixel-aligned. */
export function text(
  scene: Phaser.Scene,
  x: number,
  y: number,
  content: string,
  size: Size = 'ui',
  color: number = COLOR.ink,
): Phaser.GameObjects.BitmapText {
  const t = scene.add.bitmapText(Math.round(x), Math.round(y), FONT[size], content);
  t.setTint(color);
  return t;
}

/** Several lines, wrapped by us, one under the other. Returns the created objects. */
export function paragraph(
  scene: Phaser.Scene,
  x: number,
  y: number,
  content: string,
  columns: number,
  size: Size = 'ui',
  color: number = COLOR.ink,
): Phaser.GameObjects.BitmapText[] {
  const m = METRIC[size];
  return wrap(content, columns).map((line, i) => text(scene, x, y + i * m.leading, line, size, color));
}

export function widthOf(content: string, size: Size = 'ui'): number {
  return content.length * METRIC[size].width;
}

/** A paper panel with a 1 px border. */
export function panel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: number = COLOR.paper,
  border: number = COLOR.ink,
): Phaser.GameObjects.Rectangle {
  return scene.add.rectangle(x, y, width, height, fill).setOrigin(0, 0).setStrokeStyle(1, border);
}

/** A 1 px horizontal rule. */
export function rule(scene: Phaser.Scene, x: number, y: number, width: number, color: number = COLOR.ink): Phaser.GameObjects.Rectangle {
  return scene.add.rectangle(x, y, width, 1, color).setOrigin(0, 0);
}
