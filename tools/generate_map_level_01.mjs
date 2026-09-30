// Generates public/data/maps/level_01.json (Tiled 1.10 format) from the level 1 floor plan.
// Layer contract: floor, walls (tiles) · props, interactables, spawn (objects).
// Maps are locale-independent: interactables carry a text_id, texts live under public/data/<locale>/.
//
// Tileset office_lpc.png (see tools/extract_lpc_assets.py):
//   1 floor · 2 wall face · 3 exit floor · 4 wall top trim · 5 wall baseboard
// Walls are drawn with apparent height upwards: the top border is two tiles (trim + baseboard),
// vertical walls are faces with a trim cap on top. The collision tile is the base.
import { writeFileSync } from 'node:fs';

const W = 34, H = 18, T = 32;
const FLOOR = 1, WALL = 2, EXIT = 3, TRIM = 4, BASE = 5;

const wall = Array.from({ length: H }, () => Array(W).fill(0));
const isVertical = (x, y) =>
  x === 0 || x === W - 1 ||
  ((x === 12 || x === 23) && y >= 2 && y <= 13 && y !== 8) ||
  ((x === 27 || x === 29) && y >= 10 && y <= 13);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  if (y === 0) wall[y][x] = TRIM;
  else if (y === 1) wall[y][x] = BASE;
  else if (y === 14) wall[y][x] = TRIM;
  else if (y > 14) wall[y][x] = WALL;
  else if (isVertical(x, y)) wall[y][x] = isVertical(x, y - 1) ? WALL : TRIM;
}
// Border columns keep their trim on row 0 only.
for (let y = 1; y < H; y++) { wall[y][0] = y === 1 ? BASE : WALL; wall[y][W - 1] = y === 1 ? BASE : WALL; }

const floor = [], walls = [];
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  floor.push(x === 28 && y === 13 ? EXIT : FLOOR);
  walls.push(wall[y][x]);
}

let nextId = 1;
const prop = (v) => ({ name: '', type: typeof v === 'boolean' ? 'bool' : typeof v === 'number' ? 'int' : 'string', value: v });
const rect = (name, x, y, w = 1, h = 1, props = {}) => ({
  id: nextId++, name, type: '', visible: true, rotation: 0,
  x: x * T, y: y * T, width: w * T, height: h * T,
  properties: Object.entries(props).map(([k, v]) => ({ ...prop(v), name: k })),
});
const interactable = (id, x, y, w, h, extra = {}) => rect(id, x, y, w, h, { id, text_id: id, is_document: false, ...extra });

// `sprite` names a frame of office_props; 'none' draws nothing (another object draws it); absent → placeholder block.
const props = [
  rect('counter', 27, 6, 3, 2, { sprite: 'counter' }),
  rect('laptop', 28, 6, 1, 1, { sprite: 'laptop_open', depth_offset: 40 }),
  rect('coffee_maker', 15, 2, 1, 1, { sprite: 'coffee_maker' }),
  rect('rails', 28, 11, 1, 2),
];
const interactables = [
  interactable('DRAWER', 4, 5, 1, 1, { note_id: 'note_meeting', sprite: 'none' }),
  interactable('DESK', 3, 4, 3, 2, { mechanic: 'desk', sprite: 'desk_drawers' }),
  interactable('CAL', 2, 1, 1, 1, { note_id: 'note_calendar', sprite: 'frame_wood' }),
  interactable('CARDS', 6, 4, 1, 1, { note_id: 'note_card' }),
  interactable('BOARD', 18, 1, 1, 1, { note_id: 'note_clipping', sprite: 'frame_plain' }),
  interactable('DISPENSER', 14, 2, 1, 1, { sprite: 'cooler' }),
  interactable('COPIER', 20, 3, 1, 1, { sprite: 'copier' }),
  interactable('PLANT', 21, 12, 1, 1),
  interactable('EVAC', 26, 1, 1, 1, { sprite: 'frame_plain' }),
  interactable('COUNTER', 28, 7, 1, 1, { sprite: 'none' }),
  interactable('TURNSTILE', 28, 10, 1, 1),
];
const spawn = { id: nextId++, name: 'spawn', type: '', point: true, visible: true, rotation: 0, width: 0, height: 0, x: 4 * T + 16, y: 7 * T + 32 };

const layer = (id, name, extra) => ({ id, name, visible: true, opacity: 1, x: 0, y: 0, ...extra });
const map = {
  compressionlevel: -1, height: H, width: W, infinite: false,
  orientation: 'orthogonal', renderorder: 'right-down',
  tiledversion: '1.11.0', type: 'map', version: '1.10',
  tileheight: T, tilewidth: T, nextlayerid: 6, nextobjectid: nextId,
  tilesets: [{ columns: 5, firstgid: 1, image: '../../assets/tilesets/office_lpc.png',
    imageheight: T, imagewidth: T * 5, margin: 0, spacing: 0, name: 'office_lpc',
    tilecount: 5, tileheight: T, tilewidth: T }],
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
