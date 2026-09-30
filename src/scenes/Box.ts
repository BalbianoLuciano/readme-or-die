import Phaser from 'phaser';
import { HEIGHT, WIDTH } from '../config';
import { state } from '../systems/GameState';
import { t } from '../systems/I18n';
import { wrap } from '../systems/Typography';
import type { FactType, Note } from '../types/corpus';
import { COLOR, METRIC } from '../ui/Style';
import { panel, text, widthOf } from '../ui/Text';

type Tab = 'notes' | 'memories' | 'archive' | 'belongings';
const TABS: Tab[] = ['notes', 'memories', 'archive', 'belongings'];

interface BoxData {
  mode: 'view' | 'choose';
  /** Scene to resume when the box closes. */
  from: 'World' | 'Reader';
  factType?: FactType;
  onClose?: (note: Note | null) => void;
}

interface Item {
  title: string;
  body: string;
  destroyed?: boolean;
  note?: Note;
}

const X = 40;
const Y = 24;
const W = WIDTH - 2 * X;
const H = HEIGHT - 2 * Y;
const COLUMNS = Math.floor((W - 32) / METRIC.ui.width);
const ITEM_H = 3 * METRIC.ui.leading + 6;
const VISIBLE = 5;

/**
 * The cardboard box: notes, memories, archive, belongings. Four tabs, keyboard only,
 * contents drawn as paper. In `choose` mode it shows only the notes that serve the fact.
 */
export class Box extends Phaser.Scene {
  private params!: BoxData;
  private tab: Tab = 'notes';
  private selected = 0;
  private items: Item[] = [];
  private drawn!: Phaser.GameObjects.Container;

  constructor() {
    super('Box');
  }

  init(data: BoxData): void {
    this.params = data;
    this.tab = 'notes';
    this.selected = 0;
  }

  create(): void {
    this.add.rectangle(0, 0, WIDTH, HEIGHT, COLOR.background, 0.35).setOrigin(0, 0);
    panel(this, X, Y, W, H);
    this.drawn = this.add.container(0, 0);
    this.rebuild();

    const keyboard = this.input.keyboard!;
    keyboard.addCapture(['UP', 'DOWN', 'LEFT', 'RIGHT', 'TAB']);
    keyboard.on('keydown', (ev: KeyboardEvent) => {
      const k = ev.key;
      if (k === 'Escape' || k === 'q' || k === 'Q') return this.close(null);
      if (this.params.mode === 'view' && (k === 'ArrowLeft' || k === 'ArrowRight')) return this.switchTab(k === 'ArrowLeft' ? -1 : 1);
      if (k === 'ArrowUp') return this.move(-1);
      if (k === 'ArrowDown') return this.move(1);
      if (k === 'Enter' && this.params.mode === 'choose') {
        const note = this.items[this.selected]?.note ?? null;
        if (note) this.close(note);
      }
    });
  }

  private close(note: Note | null): void {
    const cb = this.params.onClose;
    this.scene.stop();
    this.scene.resume(this.params.from);
    cb?.(note);
  }

  private switchTab(delta: number): void {
    const i = (TABS.indexOf(this.tab) + delta + TABS.length) % TABS.length;
    this.tab = TABS[i];
    this.selected = 0;
    this.rebuild();
  }

  private move(delta: number): void {
    if (this.items.length === 0) return;
    this.selected = Phaser.Math.Clamp(this.selected + delta, 0, this.items.length - 1);
    this.draw();
  }

  private rebuild(): void {
    this.items = this.collect();
    this.draw();
  }

  private collect(): Item[] {
    if (this.params.mode === 'choose') {
      const type = this.params.factType!;
      return state.notes.filter((n) => n.values?.[type] !== undefined).map((n) => ({ title: n.paper, body: n.text, note: n }));
    }
    switch (this.tab) {
      case 'notes':
        return state.notes.map((n) => ({ title: n.paper, body: n.text, note: n }));
      case 'memories':
        return state.memories.map((m) => ({ title: m.file, body: m.text, destroyed: m.state === 'destroyed' }));
      case 'archive':
        return state.archive.map((a) => ({ title: a.file, body: t(`fact_types.${a.type}`) }));
      case 'belongings':
        return state.belongings.map((b) => ({ title: b.name, body: '' }));
    }
  }

  private draw(): void {
    this.drawn.removeAll(true);
    const c = this.drawn;

    // Tabs. In choose mode only the notes tab exists.
    let tx = X + 12;
    const tabs = this.params.mode === 'choose' ? (['notes'] as Tab[]) : TABS;
    for (const tab of tabs) {
      const label = t(`box.tabs.${tab}`);
      const active = tab === this.tab;
      if (active) c.add(this.add.rectangle(tx - 3, Y + 8, widthOf(label) + 6, METRIC.ui.height + 4, COLOR.ink).setOrigin(0, 0));
      c.add(text(this, tx, Y + 10, label, 'ui', active ? COLOR.paper : COLOR.ink));
      tx += widthOf(label) + 18;
    }
    c.add(this.add.rectangle(X, Y + 28, W, 1, COLOR.ink).setOrigin(0, 0));

    if (this.items.length === 0) {
      c.add(text(this, X + 16, Y + 40, t('box.empty')));
    }

    const first = Phaser.Math.Clamp(this.selected - VISIBLE + 1, 0, Math.max(0, this.items.length - VISIBLE));
    this.items.slice(first, first + VISIBLE).forEach((item, i) => {
      const iy = Y + 36 + i * ITEM_H;
      const isSel = first + i === this.selected;
      // Each note is drawn as the paper it is.
      c.add(panel(this, X + 12, iy, W - 24, ITEM_H - 4, COLOR.paper, COLOR.ink));
      if (isSel) c.add(this.add.rectangle(X + 13, iy + 1, W - 26, METRIC.ui.height + 4, COLOR.ink).setOrigin(0, 0));
      c.add(text(this, X + 18, iy + 3, item.title, 'ui', isSel ? COLOR.paper : COLOR.ink));
      const lines = wrap(item.body, COLUMNS).slice(0, 2);
      lines.forEach((l, j) => {
        const ly = iy + 3 + (j + 1) * METRIC.ui.leading;
        c.add(text(this, X + 18, ly, l));
        // Destroyed memories stay visible, struck and blackened: an ink bar over the middle of the line.
        if (item.destroyed) c.add(this.add.rectangle(X + 18, ly + 2, widthOf(l), METRIC.ui.height - 3, COLOR.ink).setOrigin(0, 0));
      });
    });

    const footer = this.params.mode === 'choose' ? `${t('box.choose')}   ${t('box.close')}` : t('box.close');
    c.add(text(this, X + 12, Y + H - 18, footer));
  }
}
