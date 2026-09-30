import Phaser from 'phaser';
import { HEIGHT, WIDTH } from '../config';
import { fragmentOf, resolve, type Outcome } from '../systems/Amendments';
import { state } from '../systems/GameState';
import { t } from '../systems/I18n';
import { save } from '../systems/Persistence';
import type { Level } from '../types/corpus';
import { COLOR, METRIC } from '../ui/Style';
import { text, widthOf } from '../ui/Text';

const SEAL_MS = 1200;
const SILENCE_MS = 2000;

/**
 * Sign → the document is sealed → 2 s of black silence → verdict.
 * The two seconds are skippable from the second death in the same level.
 */
export class Verdict extends Phaser.Scene {
  private level!: Level;
  private outcome!: Outcome;
  private skippable = false;
  private resolved = false;

  constructor() {
    super('Verdict');
  }

  create(): void {
    this.level = this.registry.get('level') as Level;
    this.outcome = resolve(this.level.document, state.amendments);
    this.skippable = state.deathsInLevel >= 1;
    this.resolved = false;

    // The seal: the document's name, the signature and a stamp. Nothing else.
    this.cameras.main.setBackgroundColor(COLOR.paper);
    const left = (WIDTH - 66 * METRIC.body.width) / 2;
    text(this, left, 14, this.level.document.file);
    const signature = t('verdict.signature');
    text(this, WIDTH - left - widthOf(signature, 'body'), HEIGHT - 80, signature, 'body');
    this.add.rectangle(WIDTH - left - widthOf(signature, 'body') - 8, HEIGHT - 84, widthOf(signature, 'body') + 16, 1, COLOR.ink).setOrigin(0, 0);
    const stamp = t('verdict.stamp');
    const sw = widthOf(stamp, 'body') + 24;
    this.add.rectangle(left, HEIGHT - 96, sw, 32, COLOR.paper).setOrigin(0, 0).setStrokeStyle(1, COLOR.ink);
    text(this, left + 12, HEIGHT - 86, stamp, 'body');

    this.time.delayedCall(SEAL_MS, () => this.silence());
  }

  private silence(): void {
    this.cameras.main.setBackgroundColor(COLOR.background);
    this.children.each((c) => (c as Phaser.GameObjects.Components.Visible & Phaser.GameObjects.GameObject).setVisible(false));
    const timer = this.time.delayedCall(SILENCE_MS, () => this.decide());
    if (this.skippable) {
      this.input.keyboard!.once('keydown', () => {
        timer.remove(false);
        this.decide();
      });
    }
  }

  private decide(): void {
    if (this.resolved) return;
    this.resolved = true;
    const { document } = this.level;

    if (!this.outcome.survives) {
      state.archiveDeath(state.currentLevel, document.file, this.outcome.lethalType);
      save(state.toPersistent());
      this.scene.start('ClosedRecord', { type: this.outcome.lethalType });
      return;
    }

    // Surviving settles the memories: what was reconstructed and what was destroyed.
    const finals: Record<string, string> = {};
    for (const r of this.outcome.results) finals[r.fact.id] = r.finalText;
    for (const r of this.outcome.results) {
      if (r.effect === 'recovered') {
        state.addMemory({ levelId: state.currentLevel, file: document.file, factId: r.fact.id, text: fragmentOf(document, r.fact.id, finals), state: 'recovered' });
      } else if (r.effect === 'destroyed') {
        state.addMemory({ levelId: state.currentLevel, file: document.file, factId: r.fact.id, text: fragmentOf(document, r.fact.id, {}), state: 'destroyed' });
      }
    }
    state.closeLevel(state.currentLevel);
    save(state.toPersistent());
    this.scene.start('Reflection');
  }
}
