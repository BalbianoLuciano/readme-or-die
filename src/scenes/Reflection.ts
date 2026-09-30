import Phaser from 'phaser';
import { HEIGHT, WIDTH } from '../config';
import { state } from '../systems/GameState';
import { t } from '../systems/I18n';
import { wrap } from '../systems/Typography';
import type { Level } from '../types/corpus';
import { COLOR, METRIC } from '../ui/Style';
import { text, widthOf } from '../ui/Text';

/**
 * The philosophical text: full screen, no interface, no illustration. Only the text and one
 * key to go on. It is the only reward in the game and deserves silence around it.
 */
export class Reflection extends Phaser.Scene {
  constructor() {
    super('Reflection');
  }

  create(): void {
    const level = this.registry.get('level') as Level;
    this.cameras.main.setBackgroundColor(COLOR.background);

    const lines = wrap(level.texts.reflection, 60);
    const total = lines.length * METRIC.body.leading;
    const top = Math.round((HEIGHT - total) / 2);
    lines.forEach((l, i) => text(this, (WIDTH - widthOf(l, 'body')) / 2, top + i * METRIC.body.leading, l, 'body', COLOR.paper));

    // The key hint appears only after the text can have been read twice.
    this.time.delayedCall(3000, () => {
      const hint = t('reflection.continue');
      text(this, (WIDTH - widthOf(hint)) / 2, HEIGHT - 30, hint, 'ui', COLOR.inkFaded);
      this.input.keyboard!.once('keydown-ENTER', () => {
        // Next scene would be the next level. There is none yet: back to the title.
        this.scene.stop('World');
        this.scene.start('Title', { levelId: state.currentLevel });
      });
    });
  }
}
