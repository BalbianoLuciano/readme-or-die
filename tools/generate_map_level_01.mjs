// Generates public/data/maps/level_01.json (Tiled 1.10 format) from the level 1 floor plan.
// Layer contract: floor, walls (tiles) · props, interactables, spawn (objects).
// Maps are locale-independent: interactables carry a text_id, texts live under public/data/<locale>/.
import { writeFileSync } from 'node:fs';

const W = 34, H = 18, T = 32;
const FLOOR = 1, WALL = 2, EXIT = 3;

const floor = [], walls = [];
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const border = x === 0 || y === 0 || x === W - 1 || y === H - 1;
  const partition = (x === 12 || x === 23) && y !== 8;
  // Exit corridor: two walls boxing the turnstile up to the door.
  const boxed = (x === 27 || x === 29) && y >= 10 && y <= 13;
  floor.push(x === 28 && y === 13 ? EXIT : FLOOR);
  walls.push(border || partition || boxed ? WALL : 0);
}

let nextId = 1;
const rect = (name, x, y, w = 1, h = 1, props = {}) => ({
  id: nextId++, name, type: '', visible: true, rotation: 0,
  x: x * T, y: y * T, width: w * T, height: h * T,
  properties: Object.entries(props).map(([k, v]) => ({ name: k, type: typeof v === 'boolean' ? 'bool' : 'string', value: v })),
});
const interactable = (id, x, y, w, h, extra = {}) => rect(id, x, y, w, h, { id, text_id: id, is_document: false, ...extra });

const props = [
  rect('counter', 27, 6, 3, 2),
  rect('rails', 28, 11, 1, 2),
];
const interactables = [
  interactable('DESK', 3, 4, 3, 1, { mechanic: 'desk' }),
  interactable('CAL', 2, 1, 1, 1, { note_id: 'note_calendar' }),
  interactable('CARDS', 6, 4, 1, 1, { note_id: 'note_card' }),
  interactable('DRAWER', 4, 5, 1, 1, { note_id: 'note_meeting' }),
  interactable('BOARD', 18, 1, 1, 1, { note_id: 'note_clipping' }),
  interactable('DISPENSER', 14, 2, 1, 1),
  interactable('COPIER', 20, 3, 1, 1),
  interactable('PLANT', 21, 12, 1, 1),
  interactable('EVAC', 26, 1, 1, 1),
  interactable('COUNTER', 28, 7, 1, 1),
  interactable('TURNSTILE', 28, 10, 1, 1),
];
const spawn = { id: nextId++, name: 'spawn', type: '', point: true, visible: true, rotation: 0, width: 0, height: 0, x: 4 * T + 16, y: 7 * T + 32 };

const layer = (id, name, extra) => ({ id, name, visible: true, opacity: 1, x: 0, y: 0, ...extra });
const map = {
  compressionlevel: -1, height: H, width: W, infinite: false,
  orientation: 'orthogonal', renderorder: 'right-down',
  tiledversion: '1.11.0', type: 'map', version: '1.10',
  tileheight: T, tilewidth: T, nextlayerid: 6, nextobjectid: nextId,
  tilesets: [{ columns: 4, firstgid: 1, image: '../../assets/tilesets/office_placeholder.png',
    imageheight: T, imagewidth: T * 4, margin: 0, spacing: 0, name: 'office_placeholder',
    tilecount: 4, tileheight: T, tilewidth: T }],
  layers: [
    layer(1, 'floor', { type: 'tilelayer', width: W, height: H, data: floor }),
    layer(2, 'walls', { type: 'tilelayer', width: W, height: H, data: walls }),
    layer(3, 'props', { type: 'objectgroup', draworder: 'topdown', objects: props }),
    layer(4, 'interactables', { type: 'objectgroup', draworder: 'topdown', objects: interactables }),
    layer(5, 'spawn', { type: 'objectgroup', draworder: 'topdown', objects: [spawn] }),
  ],
};
const out = process.argv[2] ?? 'public/data/maps/level_01.json';
writeFileSync(out, JSON.stringify(map));
console.log('ok', out, `${W}x${H}`, interactables.length, 'interactables');
