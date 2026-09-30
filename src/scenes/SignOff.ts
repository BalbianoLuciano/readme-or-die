import Phaser from 'phaser';
import { HEIGHT, WIDTH } from '../config';
import { resolve } from '../systems/Amendments';
import { state } from '../systems/GameState';
import { t } from '../systems/I18n';
import type { Level } from '../types/corpus';
import { COLOR } from '../ui/Style';
import { panel, text, widthOf } from '../ui/Text';

interface SignOffData {
  onBack: () => void;
}

/**
 * The signature confirmation, written as a form. Signing is irreversible: the summary of
 * amendments and strikes is the last chance to notice something struck by accident.
 */
export class SignOff extends Phaser.Scene {
  private params!: SignOffData;

  constructor() {
    super('SignOff');
  }

  init(data: SignOffData): void {
    this.params = data;
  }

  create(): void {
    const level = this.registry.get('level') as Level;
    const outcome = resolve(level.document, state.amendments);

    this.add.rectangle(0, 0, WIDTH, HEIGHT, COLOR.background, 0.35).setOrigin(0, 0);
    const w = 360;
    const h = 150;
    const x = (WIDTH - w) / 2;
    const y = (HEIGHT - h) / 2;
    panel(this, x, y, w, h);
    text(this, x + 12, y + 10, t('signoff.title'));

    const rows: [string, string][] = [
      [t('signoff.document'), level.document.file],
      [t('signoff.amendments'), String(outcome.amendments)],
      [t('signoff.strikes'), String(outcome.strikes)],
    ];
    rows.forEach(([k, v], i) => {
      text(this, x + 12, y + 36 + i * 14, k);
      text(this, x + 96, y + 36 + i * 14, v);
    });
    text(this, x + 12, y + 92, t('signoff.final'));
    text(this, x + 12, y + h - 20, t('signoff.sign'));
    text(this, x + w - 12 - widthOf(t('signoff.back')), y + h - 20, t('signoff.back'));

    this.input.keyboard!.on('keydown', (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        this.scene.stop();
        this.scene.resume('Reader');
        this.params.onBack();
      } else if (ev.key === 'f' || ev.key === 'F') {
        this.scene.stop('Reader');
        this.scene.start('Verdict');
      }
    });
  }
}
