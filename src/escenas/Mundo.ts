import Phaser from 'phaser';
import { PERSONAJE, TILE } from '../config';

type Direccion = 'espalda' | 'izquierda' | 'frente' | 'derecha';

/** Velocidad en px/s. Camina, nunca corre: dos tiles por segundo. */
const VELOCIDAD = TILE * 2;

/**
 * El escenario: caminar y, más adelante, consultar.
 * Carga un mapa de Tiled con las capas del contrato de diseño:
 * `piso` (sin colisión), `muros` (colisión automática), `spawn` (objeto punto).
 */
export class Mundo extends Phaser.Scene {
  private personaje!: Phaser.GameObjects.Rectangle;
  private cuerpo!: Phaser.Physics.Arcade.Body;
  private teclas!: {
    arriba: Phaser.Input.Keyboard.Key[];
    abajo: Phaser.Input.Keyboard.Key[];
    izquierda: Phaser.Input.Keyboard.Key[];
    derecha: Phaser.Input.Keyboard.Key[];
  };
  private direccion: Direccion = 'frente';

  constructor() {
    super('Mundo');
  }

  preload(): void {
    this.load.baseURL = import.meta.env.BASE_URL;
    this.load.tilemapTiledJSON('mapa_prueba', 'data/mapas/prueba.json');
    this.load.image('tile_prueba', 'assets/tilesets/tile_prueba.png');
  }

  create(): void {
    const mapa = this.make.tilemap({ key: 'mapa_prueba' });
    const tileset = mapa.addTilesetImage('tile_prueba', 'tile_prueba');
    if (!tileset) throw new Error('Mundo: no se encontró el tileset "tile_prueba" en el mapa');

    mapa.createLayer('piso', tileset, 0, 0);
    const muros = mapa.createLayer('muros', tileset, 0, 0);
    if (!muros) throw new Error('Mundo: el mapa no tiene capa "muros"');
    muros.setCollisionByExclusion([-1]);

    const spawn = mapa.findObject('spawn', (o) => o.name === 'spawn');
    if (!spawn || spawn.x === undefined || spawn.y === undefined) {
      throw new Error('Mundo: el mapa no tiene un objeto "spawn"');
    }

    // Rectángulo de color como personaje. Anclado por el centro inferior: la posición son los pies.
    this.personaje = this.add
      .rectangle(spawn.x, spawn.y, PERSONAJE.ancho, PERSONAJE.alto, 0x7fa7c9)
      .setOrigin(0.5, 1)
      .setStrokeStyle(1, 0x241e1a);

    this.physics.add.existing(this.personaje);
    this.cuerpo = this.personaje.body as Phaser.Physics.Arcade.Body;
    // El tile de colisión es la base, no la cara visible: solo los pies chocan.
    this.cuerpo.setSize(24, 16).setOffset(4, PERSONAJE.alto - 16);
    this.physics.add.collider(this.personaje, muros);

    const camara = this.cameras.main;
    camara.setBounds(0, 0, mapa.widthInPixels, mapa.heightInPixels);
    camara.startFollow(this.personaje, true);
    camara.setRoundPixels(true);

    const teclado = this.input.keyboard;
    if (!teclado) throw new Error('Mundo: no hay teclado disponible');
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.teclas = {
      arriba: [teclado.addKey(K.UP), teclado.addKey(K.W)],
      abajo: [teclado.addKey(K.DOWN), teclado.addKey(K.S)],
      izquierda: [teclado.addKey(K.LEFT), teclado.addKey(K.A)],
      derecha: [teclado.addKey(K.RIGHT), teclado.addKey(K.D)],
    };
  }

  update(): void {
    const presionada = (grupo: Phaser.Input.Keyboard.Key[]) => grupo.some((k) => k.isDown);
    const dx = (presionada(this.teclas.derecha) ? 1 : 0) - (presionada(this.teclas.izquierda) ? 1 : 0);
    const dy = (presionada(this.teclas.abajo) ? 1 : 0) - (presionada(this.teclas.arriba) ? 1 : 0);

    // Cuatro direcciones, nunca diagonal. El eje horizontal manda si hay conflicto.
    if (dx !== 0) {
      this.cuerpo.setVelocity(dx * VELOCIDAD, 0);
      this.direccion = dx > 0 ? 'derecha' : 'izquierda';
    } else if (dy !== 0) {
      this.cuerpo.setVelocity(0, dy * VELOCIDAD);
      this.direccion = dy > 0 ? 'frente' : 'espalda';
    } else {
      this.cuerpo.setVelocity(0, 0);
    }
  }

  /** Hacia dónde mira. Lo va a usar «consultar» para saber qué tiene adelante. */
  get mirando(): Direccion {
    return this.direccion;
  }
}
