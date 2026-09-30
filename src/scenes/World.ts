import Phaser from 'phaser';
import { CHARACTER, TILE } from '../config';
import { getLevel, mapKey, propsOf } from '../systems/CorpusLoader';
import { state } from '../systems/GameState';
import type { InteractableProps, Level, Locale } from '../types/corpus';
import { COLOR } from '../ui/Style';
import { TextBox } from '../ui/TextBox';

type Facing = 'back' | 'left' | 'front' | 'right';
type Mode = 'intro' | 'free' | 'textbox' | 'overlay';

/** Speed in px/s. Walks, never runs: two tiles per second. */
const SPEED = TILE * 2;

interface Interactable {
  props: InteractableProps;
  rect: Phaser.Geom.Rectangle;
  drawing: Phaser.GameObjects.Rectangle;
}

const DELTA: Record<Facing, [number, number]> = {
  back: [0, -1],
  front: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

/**
 * The scene: walking and inspecting. No HUD: nothing on screen while walking.
 * Overlays (Reader, Box) are scenes of their own, launched on top; this one pauses underneath.
 */
export class World extends Phaser.Scene {
  private level!: Level;
  private character!: Phaser.GameObjects.Rectangle;
  private body!: Phaser.Physics.Arcade.Body;
  private keys!: Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key[]>;
  private facing: Facing = 'front';
  private interactables: Interactable[] = [];
  private inRange: Interactable | null = null;
  private textBox!: TextBox;
  private mode: Mode = 'free';
  private ignoreKeysUntil = 0;

  constructor() {
    super('World');
  }

  init(data: { levelId?: string }): void {
    state.enterLevel(data.levelId ?? state.currentLevel);
  }

  create(): void {
    const map = this.make.tilemap({ key: mapKey(state.currentLevel) });
    const locale = (this.registry.get('locale') as Locale | undefined) ?? state.options.locale;
    this.level = getLevel(this.cache, locale, state.currentLevel, map);
    this.registry.set('level', this.level);

    const tileset = map.addTilesetImage('office_placeholder', 'office_placeholder');
    if (!tileset) throw new Error('World: the map tileset was not found');
    map.createLayer('floor', tileset, 0, 0);
    const walls = map.createLayer('walls', tileset, 0, 0);
    if (!walls) throw new Error('World: the map has no "walls" layer');
    walls.setCollisionByExclusion([-1]);

    const solids = this.physics.add.staticGroup();
    const block = (o: Phaser.Types.Tilemaps.TiledObject): Phaser.GameObjects.Rectangle => {
      const r = this.add.rectangle(o.x!, o.y!, o.width!, o.height!, 0x8c8072).setOrigin(0, 0);
      r.setDepth(o.y! + o.height!);
      solids.add(r);
      return r;
    };
    for (const o of map.getObjectLayer('props')?.objects ?? []) block(o);
    for (const o of map.getObjectLayer('interactables')?.objects ?? []) {
      this.interactables.push({
        props: propsOf(o),
        rect: new Phaser.Geom.Rectangle(o.x!, o.y!, o.width!, o.height!),
        drawing: block(o),
      });
    }

    const spawn = map.findObject('spawn', (o) => o.name === 'spawn');
    if (!spawn || spawn.x === undefined || spawn.y === undefined) throw new Error('World: the map has no "spawn"');

    // A coloured rectangle as the character, anchored at the bottom centre: the position is the feet.
    this.character = this.add
      .rectangle(spawn.x, spawn.y, CHARACTER.width, CHARACTER.height, 0x7fa7c9)
      .setOrigin(0.5, 1)
      .setStrokeStyle(1, 0x241e1a);
    this.physics.add.existing(this.character);
    this.body = this.character.body as Phaser.Physics.Arcade.Body;
    this.body.setSize(24, 16).setOffset(4, CHARACTER.height - 16);
    this.physics.add.collider(this.character, walls);
    this.physics.add.collider(this.character, solids);

    const camera = this.cameras.main;
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    camera.startFollow(this.character, true);
    camera.setRoundPixels(true);

    const keyboard = this.input.keyboard!;
    keyboard.addCapture(['TAB', 'SPACE', 'UP', 'DOWN', 'LEFT', 'RIGHT']);
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = {
      up: [keyboard.addKey(K.UP), keyboard.addKey(K.W)],
      down: [keyboard.addKey(K.DOWN), keyboard.addKey(K.S)],
      left: [keyboard.addKey(K.LEFT), keyboard.addKey(K.A)],
      right: [keyboard.addKey(K.RIGHT), keyboard.addKey(K.D)],
    };
    keyboard.on('keydown', this.onKey, this);

    this.textBox = new TextBox(this);
    this.events.on('resume', this.onResume, this);

    if (!state.introSeen) this.startIntro();
    else this.mode = 'free';
  }

  update(): void {
    if (this.mode !== 'free') {
      this.body.setVelocity(0, 0);
      return;
    }
    const down = (group: Phaser.Input.Keyboard.Key[]) => group.some((k) => k.isDown);
    const dx = (down(this.keys.right) ? 1 : 0) - (down(this.keys.left) ? 1 : 0);
    const dy = (down(this.keys.down) ? 1 : 0) - (down(this.keys.up) ? 1 : 0);

    // Four directions, never diagonal. The horizontal axis wins on conflict.
    if (dx !== 0) {
      this.body.setVelocity(dx * SPEED, 0);
      this.facing = dx > 0 ? 'right' : 'left';
    } else if (dy !== 0) {
      this.body.setVelocity(0, dy * SPEED);
      this.facing = dy > 0 ? 'front' : 'back';
    } else {
      this.body.setVelocity(0, 0);
    }
    this.character.setDepth(this.character.y);
    this.updateRange();
  }

  // ----- intro -----

  private startIntro(): void {
    this.mode = 'intro';
    const lines = [...this.level.texts.intro.lines];
    const next = () => {
      const line = lines.shift();
      if (line === undefined) {
        state.introSeen = true;
        this.mode = 'free';
        return;
      }
      this.textBox.show(line, next);
    };
    next();
  }

  // ----- keyboard -----

  private onKey(ev: KeyboardEvent): void {
    if (this.time.now < this.ignoreKeysUntil) return;
    const k = ev.key;

    if (this.mode === 'intro' || this.mode === 'textbox') {
      if (this.textBox.open) {
        this.textBox.advance();
        if (this.mode === 'textbox' && !this.textBox.open) this.mode = 'free';
      }
      return;
    }
    if (this.mode !== 'free') return;

    if (k === 'e' || k === 'E' || k === ' ') this.inspect();
    else if (k === 'Tab') this.openReader();
    else if (k === 'q' || k === 'Q') this.openOverlay('Box', { mode: 'view' });
  }

  private showText(content: string, onClose?: () => void): void {
    this.mode = 'textbox';
    this.body.setVelocity(0, 0);
    this.textBox.show(content, () => {
      this.mode = 'free';
      onClose?.();
    });
  }

  // ----- inspect -----

  private updateRange(): void {
    const [dx, dy] = DELTA[this.facing];
    const tx = Math.floor(this.body.center.x / TILE) + dx;
    const ty = Math.floor(this.body.center.y / TILE) + dy;
    const px = tx * TILE + TILE / 2;
    const py = ty * TILE + TILE / 2;
    const now = this.interactables.find((i) => i.rect.contains(px, py)) ?? null;
    if (now === this.inRange) return;
    // A 1 px outline, no animation: the only sign that there is something to inspect.
    this.inRange?.drawing.setStrokeStyle(0);
    now?.drawing.setStrokeStyle(1, COLOR.outline);
    this.inRange = now;
  }

  private inspect(): void {
    const i = this.inRange;
    if (!i) return;
    if (i.props.mechanic === 'desk') return this.inspectDesk(i);

    const content = this.level.texts.interactions[i.props.text_id] ?? '';
    const note = i.props.note_id ? this.level.texts.notes.find((n) => n.id === i.props.note_id) : undefined;
    if (note) state.collectNote(note);
    this.showText(content, i.props.is_document ? () => this.openReader() : undefined);
  }

  /** The opening: emptying the desk. Seven things, one at a time; the last is the document and opens the reader. */
  private inspectDesk(i: Interactable): void {
    const { belongings, interactions } = this.level.texts;
    const next = belongings[state.belongings.length];
    if (next) {
      state.storeBelonging(next);
      return this.showText(next.text);
    }
    if (!state.documentCollected) {
      state.documentCollected = true;
      return this.showText(interactions.DESK_DOCUMENT ?? '', () => this.openReader());
    }
    this.showText(interactions[i.props.text_id] ?? '');
  }

  // ----- overlays -----

  private openReader(): void {
    if (!state.documentCollected) return;
    this.openOverlay('Reader');
  }

  private openOverlay(key: string, data: object = {}): void {
    this.mode = 'overlay';
    this.body.setVelocity(0, 0);
    this.scene.launch(key, data);
    this.scene.pause();
  }

  private onResume(): void {
    this.mode = 'free';
    this.ignoreKeysUntil = this.time.now + 150;
    this.input.keyboard!.resetKeys();
  }
}
