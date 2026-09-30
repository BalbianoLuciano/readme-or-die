import Phaser from 'phaser';
import { HEIGHT, WIDTH } from '../config';
import { applicableNotes, currentText, operationFor, type Amendment } from '../systems/Amendments';
import { state } from '../systems/GameState';
import { t } from '../systems/I18n';
import { wrapSegments, type Line, type Segment } from '../systems/Typography';
import type { Fact, Level, Note } from '../types/corpus';
import { COLOR, METRIC } from '../ui/Style';
import { panel, text, widthOf } from '../ui/Text';

const COLUMNS = 66;
const LINES_PER_PAGE = 14;
const TOP = 40;
const LEFT = (WIDTH - COLUMNS * METRIC.body.width) / 2; // 122
const LEADING = METRIC.body.leading;
const HEADER_Y = 14;

type Mode = 'read' | 'amend' | 'box';

interface Option {
  key: 'when' | 'where' | 'strike' | 'restore';
  label: string;
  detail: string;
  enabled: boolean;
}

/**
 * The `.md` reader. Full screen: only the document, centred. Notes and operations appear
 * as overlays when asked for. The cursor jumps from fact to fact; only facts are selectable.
 */
export class Reader extends Phaser.Scene {
  private level!: Level;
  private lines: Line[] = [];
  private factOrder: string[] = [];
  private cursor = 0;
  private page = 0;
  private mode: Mode = 'read';
  private body!: Phaser.GameObjects.Container;
  private pageLabel!: Phaser.GameObjects.BitmapText;
  private form: Phaser.GameObjects.Container | null = null;
  private options: Option[] = [];
  private selected = 0;
  private ignoreKeysUntil = 0;

  constructor() {
    super('Reader');
  }

  create(): void {
    this.level = this.registry.get('level') as Level;
    const { document } = this.level;

    this.cameras.main.setBackgroundColor(COLOR.paper);
    text(this, LEFT, HEADER_Y, document.file, 'ui');
    this.pageLabel = text(this, 0, HEADER_Y, '', 'ui');
    this.body = this.add.container(0, 0);

    this.factOrder = [...document.body.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]);
    this.cursor = 0;
    this.layout();
    this.followCursor();

    const keyboard = this.input.keyboard!;
    keyboard.addCapture(['TAB', 'SPACE', 'UP', 'DOWN', 'LEFT', 'RIGHT', 'PAGE_UP', 'PAGE_DOWN']);
    keyboard.on('keydown', this.onKey, this);
    this.events.on('resume', () => {
      this.ignoreKeysUntil = this.time.now + 150;
      keyboard.resetKeys();
    });
  }

  // ----- layout -----

  private fact(id: string): Fact {
    return this.level.document.facts.find((f) => f.id === id)!;
  }

  /** Builds the segment list from the body with the current text of every fact, and wraps it. */
  private layout(): void {
    const { document } = this.level;
    const segments: Segment[] = [];
    let last = 0;
    for (const m of document.body.matchAll(/\{\{(\w+)\}\}/g)) {
      if (m.index! > last) segments.push({ text: document.body.slice(last, m.index) });
      const fact = this.fact(m[1]);
      segments.push({ text: currentText(fact, state.amendments), fact: fact.id });
      last = m.index! + m[0].length;
    }
    if (last < document.body.length) segments.push({ text: document.body.slice(last) });
    this.lines = wrapSegments(segments, COLUMNS);
    this.paint();
  }

  private get pageCount(): number {
    return Math.max(1, Math.ceil(this.lines.length / LINES_PER_PAGE));
  }

  private lineOfFact(id: string): number {
    return Math.max(0, this.lines.findIndex((l) => l.some((s) => s.fact === id)));
  }

  private followCursor(): void {
    const id = this.factOrder[this.cursor];
    if (id) this.page = Math.floor(this.lineOfFact(id) / LINES_PER_PAGE);
    this.paint();
  }

  private paint(): void {
    this.body.removeAll(true);
    const label = t('reader.page', { n: this.page + 1, m: this.pageCount });
    this.pageLabel.setText(label).setX(WIDTH - LEFT - widthOf(label));

    const focused = this.mode === 'read' || this.mode === 'amend' ? this.factOrder[this.cursor] : undefined;
    const start = this.page * LINES_PER_PAGE;
    for (let i = 0; i < LINES_PER_PAGE; i++) {
      const line = this.lines[start + i];
      if (!line) break;
      const y = TOP + i * LEADING;
      let col = 0;
      for (const seg of line) {
        const x = LEFT + col * METRIC.body.width;
        const w = seg.text.length * METRIC.body.width;
        if (seg.fact) {
          const amendment = state.amendments.get(seg.fact);
          const isFocus = seg.fact === focused;
          if (isFocus) {
            // Focus is inversion: text in paper colour over an ink block. Never colour alone.
            this.body.add(this.add.rectangle(x - 1, y - 1, w + 2, METRIC.body.height + 2, COLOR.ink).setOrigin(0, 0));
          }
          this.body.add(text(this, x, y, seg.text, 'body', isFocus ? COLOR.paper : COLOR.ink));
          if (!isFocus) this.body.add(this.add.rectangle(x, y + METRIC.body.height + 1, w, 1, COLOR.ink).setOrigin(0, 0));
          if (amendment?.operation === 'strike') {
            this.body.add(this.add.rectangle(x, y + Math.floor(METRIC.body.height / 2), w, 1, isFocus ? COLOR.paper : COLOR.ink).setOrigin(0, 0));
          }
          if (amendment?.operation === 'note' && line[0] === seg) {
            // An amended fact carries a 1 px mark in the left margin.
            this.body.add(this.add.rectangle(LEFT - 6, y, 1, METRIC.body.height, COLOR.ink).setOrigin(0, 0));
          } else if (amendment?.operation === 'note') {
            this.body.add(this.add.rectangle(LEFT - 6, y, 1, METRIC.body.height, COLOR.ink).setOrigin(0, 0));
          }
        } else if (seg.text.length > 0) {
          this.body.add(text(this, x, y, seg.text, 'body'));
        }
        col += seg.text.length;
      }
    }
  }

  // ----- keys -----

  private onKey(ev: KeyboardEvent): void {
    if (this.time.now < this.ignoreKeysUntil) return;
    if (this.mode === 'box') return;
    const k = ev.key;

    if (this.mode === 'amend') {
      if (k === 'Escape') return this.closeForm();
      if (k === 'ArrowUp' || k === 'ArrowLeft') return this.moveSelection(-1);
      if (k === 'ArrowDown' || k === 'ArrowRight') return this.moveSelection(1);
      if (k === 'Enter') return this.applySelection();
      return;
    }

    if (k === 'Escape' || k === 'Tab') return this.close();
    if (k === 'ArrowLeft' || k === 'ArrowUp') return this.moveCursor(-1);
    if (k === 'ArrowRight' || k === 'ArrowDown') return this.moveCursor(1);
    if (k === 'PageUp') return this.turnPage(-1);
    if (k === 'PageDown') return this.turnPage(1);
    if (k === 'Enter') return this.openForm();
    if (k === 'q' || k === 'Q') return this.openBox('view');
    if (k === 'f' || k === 'F') return this.signOff();
  }

  private moveCursor(delta: number): void {
    const n = this.factOrder.length;
    this.cursor = (this.cursor + delta + n) % n;
    this.followCursor();
  }

  /** Free scroll for rereading. Does not move the cursor. */
  private turnPage(delta: number): void {
    this.page = Phaser.Math.Clamp(this.page + delta, 0, this.pageCount - 1);
    this.paint();
  }

  private close(): void {
    this.scene.stop();
    this.scene.resume('World');
  }

  // ----- amendment form -----

  private currentFact(): Fact {
    return this.fact(this.factOrder[this.cursor]);
  }

  private openForm(): void {
    const fact = this.currentFact();
    const op = operationFor(fact.type);
    const notes = applicableNotes(fact, state.notes);
    const count = (enabled: boolean) => {
      if (!enabled) return t('amend.not_applicable');
      return notes.length === 1 ? t('amend.available_one') : t('amend.available', { n: notes.length });
    };
    const whenOk = op === 'when' && notes.length > 0;
    const whereOk = op === 'where' && notes.length > 0;
    this.options = [
      { key: 'when', label: t('amend.when'), detail: count(whenOk), enabled: whenOk },
      { key: 'where', label: t('amend.where'), detail: count(whereOk), enabled: whereOk },
      { key: 'strike', label: t('amend.strike'), detail: '', enabled: true },
    ];
    if (state.amendments.has(fact.id)) this.options.push({ key: 'restore', label: t('amend.restore'), detail: '', enabled: true });
    this.selected = this.options.findIndex((o) => o.enabled);
    this.mode = 'amend';
    this.drawForm();
  }

  private drawForm(): void {
    this.form?.destroy(true);
    const fact = this.currentFact();
    const w = 420;
    const h = 40 + this.options.length * 16 + 60;
    const x = (WIDTH - w) / 2;
    const y = (HEIGHT - h) / 2;
    const c = this.add.container(0, 0).setDepth(10);
    c.add(panel(this, x, y, w, h));

    const typeLabel = `[${t(`fact_types.${fact.type}`)}]`;
    c.add(text(this, x + 12, y + 10, t('amend.title')));
    c.add(text(this, x + 12 + widthOf(t('amend.title')) + 20, y + 10, currentText(fact, state.amendments)));
    c.add(text(this, x + w - 12 - widthOf(typeLabel), y + 10, typeLabel));

    this.options.forEach((o, i) => {
      const oy = y + 36 + i * 16;
      const color = o.enabled ? COLOR.ink : COLOR.inkFaded;
      const marker = i === this.selected ? '(*)' : '( )';
      c.add(text(this, x + 16, oy, `${marker} ${o.label}`, 'ui', color));
      if (o.detail) c.add(text(this, x + w - 12 - widthOf(o.detail), oy, o.detail, 'ui', color));
    });

    const warnY = y + 36 + this.options.length * 16 + 8;
    // The strike warning is always written, not only the first time.
    const warning = t('amend.warning');
    c.add(text(this, x + 16, warnY, warning.slice(0, 76)));
    if (warning.length > 76) c.add(text(this, x + 16, warnY + 14, warning.slice(76).trim()));
    c.add(text(this, x + 16, y + h - 20, t('amend.apply')));
    c.add(text(this, x + w - 12 - widthOf(t('amend.back')), y + h - 20, t('amend.back')));
    this.form = c;
  }

  private moveSelection(delta: number): void {
    const n = this.options.length;
    let i = this.selected;
    for (let step = 0; step < n; step++) {
      i = (i + delta + n) % n;
      if (this.options[i].enabled) break;
    }
    this.selected = i;
    this.drawForm();
  }

  private applySelection(): void {
    const option = this.options[this.selected];
    const fact = this.currentFact();
    if (!option?.enabled) return;
    if (option.key === 'strike') {
      state.amendments.set(fact.id, { factId: fact.id, operation: 'strike' });
      return this.closeForm();
    }
    if (option.key === 'restore') {
      state.amendments.delete(fact.id);
      return this.closeForm();
    }
    // when / where: pick a note in the box, filtered by the fact's type.
    this.openBox('choose', fact, (note) => {
      if (note) {
        const value = note.values![fact.type]!;
        const amendment: Amendment = { factId: fact.id, operation: 'note', noteId: note.id, value };
        // Choosing a note whose value equals the current text changes nothing.
        if (value === fact.text) state.amendments.delete(fact.id);
        else state.amendments.set(fact.id, amendment);
      }
      this.closeForm();
    });
  }

  private closeForm(): void {
    this.form?.destroy(true);
    this.form = null;
    this.mode = 'read';
    this.layout();
    this.followCursor();
  }

  // ----- box and sign-off -----

  private openBox(mode: 'view' | 'choose', fact?: Fact, onChoose?: (note: Note | null) => void): void {
    const previous = this.mode;
    this.mode = 'box';
    this.scene.launch('Box', {
      mode,
      factType: fact?.type,
      onClose: (note: Note | null) => {
        this.mode = previous;
        this.ignoreKeysUntil = this.time.now + 150;
        this.input.keyboard!.resetKeys();
        onChoose?.(note);
        this.paint();
      },
    });
    this.scene.pause();
  }

  private signOff(): void {
    this.mode = 'box';
    this.scene.launch('SignOff', {
      onBack: () => {
        this.mode = 'read';
        this.ignoreKeysUntil = this.time.now + 150;
        this.input.keyboard!.resetKeys();
      },
    });
    this.scene.pause();
  }
}
