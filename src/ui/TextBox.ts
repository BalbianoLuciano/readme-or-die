import Phaser from 'phaser';
import { HEIGHT, WIDTH } from '../config';
import { wrap } from '../systems/Typography';
import { COLOR, METRIC } from './Style';
import { panel, text } from './Text';

const LINES = 3;
const PADDING = 8;
const COLUMNS = Math.floor((WIDTH - 2 * PADDING - 2 * 6) / METRIC.ui.width);
const BOX_HEIGHT = LINES * METRIC.ui.leading + 2 * PADDING;

/**
 * The world's text box: bottom, full width, three lines, administrative register.
 * No portrait: it is not dialogue, it is signage. If the text does not fit, it pages with the same key.
 */
export class TextBox {
  private container: Phaser.GameObjects.Container;
  private lines: Phaser.GameObjects.BitmapText[] = [];
  private pages: string[][] = [];
  private page = 0;
  private onClose: (() => void) | null = null;

  constructor(scene: Phaser.Scene) {
    this.container = scene.add.container(0, HEIGHT - BOX_HEIGHT).setDepth(1000).setScrollFactor(0).setVisible(false);
    this.container.add(panel(scene, 0, 0, WIDTH, BOX_HEIGHT, COLOR.paper, COLOR.ink));
    for (let i = 0; i < LINES; i++) {
      const t = text(scene, PADDING + 6, PADDING + i * METRIC.ui.leading, '', 'ui');
      this.lines.push(t);
      this.container.add(t);
    }
  }

  get open(): boolean {
    return this.container.visible;
  }

  show(content: string, onClose?: () => void): void {
    const lines = wrap(content, COLUMNS);
    this.pages = [];
    for (let i = 0; i < lines.length; i += LINES) this.pages.push(lines.slice(i, i + LINES));
    if (this.pages.length === 0) this.pages.push(['']);
    this.page = 0;
    this.onClose = onClose ?? null;
    this.paint();
    this.container.setVisible(true);
  }

  /** Advances a page or closes. Returns true if it closed. */
  advance(): boolean {
    if (this.page < this.pages.length - 1) {
      this.page += 1;
      this.paint();
      return false;
    }
    this.container.setVisible(false);
    const cb = this.onClose;
    this.onClose = null;
    cb?.();
    return true;
  }

  private paint(): void {
    const current = this.pages[this.page];
    this.lines.forEach((t, i) => t.setText(current[i] ?? ''));
  }
}
