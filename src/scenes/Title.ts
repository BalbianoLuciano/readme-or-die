import Phaser from 'phaser';
import { HEIGHT, WIDTH } from '../config';
import { getManifest, queueLevel, queueManifest, uiKey } from '../systems/CorpusLoader';
import { state } from '../systems/GameState';
import { browserLocale, setStrings, t } from '../systems/I18n';
import { load } from '../systems/Persistence';
import type { Locale, UiStrings } from '../types/corpus';
import { COLOR, FONT } from '../ui/Style';
import { text, widthOf } from '../ui/Text';

/** Title screen. Regular interface, not stationery. Loads fonts, the manifest and the current level. */
export class Title extends Phaser.Scene {
  private locale: Locale = 'es';

  constructor() {
    super('Title');
  }

  preload(): void {
    this.load.baseURL = import.meta.env.BASE_URL;
    this.load.bitmapFont(FONT.body, 'assets/fonts/ark12.png', 'assets/fonts/ark12.xml');
    this.load.bitmapFont(FONT.ui, 'assets/fonts/ark10.png', 'assets/fonts/ark10.xml');
    this.load.image('office_lpc', 'assets/tilesets/office_lpc.png');
    this.load.atlas('office_props', 'assets/sprites/office_props.png', 'assets/sprites/office_props.json');
    this.load.spritesheet('homero', 'assets/sprites/homero_lpc.png', { frameWidth: 64, frameHeight: 64 });

    const saved = load();
    if (saved) state.loadPersistent(saved);

    // The manifest decides which locale can serve the level; it has to be loaded before the level is queued.
    queueManifest(this.load);
    this.load.once('filecomplete-json-locales', () => {
      const manifest = getManifest(this.cache);
      if (!saved) state.options.locale = browserLocale(manifest, navigator.language);
      this.locale = queueLevel(this.load, manifest, state.options.locale, state.currentLevel);
    });
  }

  create(): void {
    setStrings(this.cache.json.get(uiKey(this.locale)) as UiStrings);
    this.registry.set('locale', this.locale);
    this.cameras.main.setBackgroundColor(COLOR.paper);

    const title = 'readme-or-die';
    text(this, (WIDTH - widthOf(title, 'body')) / 2, HEIGHT / 2 - 30, title, 'body');
    const resumes = state.closedLevels.length > 0 || state.archive.length > 0;
    const hint = t(resumes ? 'title.continue' : 'title.start');
    text(this, (WIDTH - widthOf(hint)) / 2, HEIGHT / 2 + 10, hint);

    this.input.keyboard!.once('keydown-ENTER', () => {
      this.scene.start('World', { levelId: state.currentLevel });
    });
  }
}
