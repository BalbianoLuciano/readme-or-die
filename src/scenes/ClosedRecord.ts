import Phaser from 'phaser';
import { HEIGHT } from '../config';
import { state } from '../systems/GameState';
import { t } from '../systems/I18n';
import type { FactType, Level } from '../types/corpus';
import { COLOR } from '../ui/Style';
import { text } from '../ui/Text';

/**
 * The death screen. Death is reported the way a system reports a closed transaction:
 * neutral, administrative, and never naming what happened. `Estado: conforme` is the heart of it.
 */
export class ClosedRecord extends Phaser.Scene {
  private type!: FactType;

  constructor() {
    super('ClosedRecord');
  }

  init(data: { type: FactType }): void {
    this.type = data.type;
  }

  create(): void {
    const level = this.registry.get('level') as Level;
    this.cameras.main.setBackgroundColor(COLOR.paper);
    const x = 120;
    let y = 60;
    const line = (s: string, dy = 14) => {
      text(this, x, y, s);
      y += dy;
    };
    const row = (k: string, v: string) => {
      text(this, x, y, k);
      text(this, x + 90, y, v);
      y += 14;
    };

    line(t('closed.title'), 36);
    row(t('closed.document'), level.document.file);
    row(t('closed.signer'), t('verdict.signature'));
    row(t('closed.state'), t('closed.state_value'));
    row(t('closed.remarks'), t('closed.remarks_value'));
    y += 14;
    line(t('closed.observed'));
    line(t(`fact_types.${this.type}`), 36);
    line(t('closed.immutable'), 28);
    text(this, x, HEIGHT - 60, t('closed.retry'), 'ui', COLOR.inkFaded);

    this.input.keyboard!.once('keydown-ENTER', () => {
      state.retry();
      this.scene.stop('World');
      this.scene.start('World', { levelId: state.currentLevel });
    });
  }
}

