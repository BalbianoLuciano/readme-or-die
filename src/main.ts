import Phaser from 'phaser';
import { crearConfig, zoomEntero } from './config';
import { Mundo } from './escenas/Mundo';

const juego = new Phaser.Game(crearConfig([Mundo]));

window.addEventListener('resize', () => {
  juego.scale.setZoom(zoomEntero(window.innerWidth, window.innerHeight));
});
