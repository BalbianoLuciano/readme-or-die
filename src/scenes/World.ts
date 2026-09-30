import Phaser from 'phaser';
import { TILE } from '../config';
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
  /** The 1 px outline shown when the object is in range. */
  outline: Phaser.GameObjects.Rectangle;
}

/** Character sheet: 5 columns per row (column 0 standing, 1–4 walking), rows back/left/front/right. */
const WALK_ROW: Record<Facing, number> = { back: 0, left: 1, front: 2, right: 3 };
const WALK_FRAMES = 5;
/** ~150 ms per frame: slow, tired. */
const WALK_FPS = 7;

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
  private character!: Phaser.Physics.Arcade.Sprite;
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

  init(data: { levelId?: string; retry?: boolean }): void {
    // Retrying after death keeps the box as it was; entering a level afresh empties it.
    if (data.retry) state.retry();
    else state.enterLevel(data.levelId ?? state.currentLevel);
  }

  create(): void {
    const map = this.make.tilemap({ key: mapKey(state.currentLevel) });
    const locale = (this.registry.get('locale') as Locale | undefined) ?? state.options.locale;
    this.level = getLevel(this.cache, locale, state.currentLevel, map);
    this.registry.set('level', this.level);

    const tileset = map.addTilesetImage('office_lpc', 'office_lpc');
    if (!tileset) throw new Error('World: the map tileset was not found');
    map.createLayer('floor', tileset, 0, 0);
    const walls = map.createLayer('walls', tileset, 0, 0);
    if (!walls) throw new Error('World: the map has no "walls" layer');
    walls.setCollisionByExclusion([-1]);

    const solids = this.physics.add.staticGroup();
    // Every object blocks by its rectangle. It is drawn as a prop sprite anchored at its bottom-left,
    // with apparent height upwards, or as a placeholder block when no sprite exists yet.
    const place = (o: Phaser.Types.Tilemaps.TiledObject, p: InteractableProps): void => {
      const bottom = o.y! + o.height!;
      solids.add(this.add.zone(o.x!, o.y!, o.width!, o.height!).setOrigin(0, 0));
      if (p.sprite === 'none') return;
      if (p.sprite) {
        this.add.image(o.x!, bottom, 'office_props', p.sprite).setOrigin(0, 1).setDepth(bottom + (p.depth_offset ?? 0));
      } else {
        this.add.rectangle(o.x!, o.y!, o.width!, o.height!, 0x8c8072).setOrigin(0, 0).setDepth(bottom);
      }
    };
    for (const o of map.getObjectLayer('props')?.objects ?? []) place(o, propsOf(o));
    for (const o of map.getObjectLayer('interactables')?.objects ?? []) {
      const p = propsOf(o);
      place(o, p);
      const outline = this.add.rectangle(o.x!, o.y!, o.width!, o.height!).setOrigin(0, 0).setStrokeStyle(1, COLOR.outline).setDepth(5000).setVisible(false);
      this.interactables.push({ props: p, rect: new Phaser.Geom.Rectangle(o.x!, o.y!, o.width!, o.height!), outline });
    }

    const spawn = map.findObject('spawn', (o) => o.name === 'spawn');
    if (!spawn || spawn.x === undefined || spawn.y === undefined) throw new Error('World: the map has no "spawn"');

    // The character: a 64×64 frame anchored at the bottom centre, so the position is the feet.
    // Feet sit at y = 60 of the cell (tools/build_character_sheet.py).
    this.createWalkAnimations();
    this.character = this.physics.add.sprite(spawn.x, spawn.y, 'homero', WALK_ROW.front * WALK_FRAMES).setOrigin(0.5, 1);
    this.body = this.character.body as Phaser.Physics.Arcade.Body;
    this.body.setSize(24, 16).setOffset((64 - 24) / 2, 61 - 16);
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

    if (import.meta.env.DEV) this.exposeDebugHooks();
  }

  /** Dev only: lets automated playthroughs place the character without walking. Never shipped. */
  private exposeDebugHooks(): void {
    const hooks = {
      state,
      game: this.game,
      teleport: (tx: number, ty: number, facing: Facing = 'front') => {
        this.character.setPosition(tx * TILE + TILE / 2, ty * TILE + TILE);
        this.body.reset(this.character.x, this.character.y);
        this.facing = facing;
        this.updateRange();
      },
    };
    (window as unknown as { __rod: typeof hooks }).__rod = hooks;
  }

  update(): void {
    if (this.mode !== 'free') {
      this.body.setVelocity(0, 0);
      this.animate(false);
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
    this.animate(dx !== 0 || dy !== 0);
    this.updateRange();
  }

  private createWalkAnimations(): void {
    for (const facing of Object.keys(WALK_ROW) as Facing[]) {
      const start = WALK_ROW[facing] * WALK_FRAMES;
      if (!this.anims.exists(`walk-${facing}`)) {
        this.anims.create({ key: `walk-${facing}`, frames: this.anims.generateFrameNumbers('homero', { start: start + 1, end: start + WALK_FRAMES - 1 }), frameRate: WALK_FPS, repeat: -1 });
      }
    }
  }

  private animate(moving: boolean): void {
    if (moving) {
      this.character.anims.play(`walk-${this.facing}`, true);
    } else {
      this.character.anims.stop();
      this.character.setFrame(WALK_ROW[this.facing] * WALK_FRAMES);
    }
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
    else if (k === 'q' || k === 'Q') this.openOverlay('Box', { mode: 'view', from: 'World' });
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
    this.inRange?.outline.setVisible(false);
    now?.outline.setVisible(true);
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
