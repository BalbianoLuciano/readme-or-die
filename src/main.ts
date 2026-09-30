import Phaser from 'phaser';
import { createConfig, integerZoom } from './config';
import { Box } from './scenes/Box';
import { ClosedRecord } from './scenes/ClosedRecord';
import { Reader } from './scenes/Reader';
import { Reflection } from './scenes/Reflection';
import { SignOff } from './scenes/SignOff';
import { Title } from './scenes/Title';
import { Verdict } from './scenes/Verdict';
import { World } from './scenes/World';

const game = new Phaser.Game(createConfig([Title, World, Reader, Box, SignOff, Verdict, ClosedRecord, Reflection]));

window.addEventListener('resize', () => {
  game.scale.setZoom(integerZoom(window.innerWidth, window.innerHeight));
});
