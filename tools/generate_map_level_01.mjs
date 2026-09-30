// Generates public/data/maps/level_01.json (Tiled 1.10 format) from the level 1 floor plan.
// Layer contract: floor, walls (tiles) · props, interactables, spawn (objects).
// Maps are locale-independent: interactables carry a text_id, texts live under public/data/<locale>/.
//
// Tileset office_lpc.png: 1 floor · 2 wall face · 3 exit floor · 4 wall top trim · 5 wall baseboard.
// Walls are drawn with apparent height upwards: the top border is two tiles (trim + baseboard),
// vertical walls are faces with a trim cap on top. The collision tile is the base.
//
// Plan (26×15, interior x 1–24, y 3–11). Three rooms in a line, doorways at y = 7:
//   his office x 1–8 · kitchen x 10–16 · reception x 18–24. Exit corridor x 21, y 8–11: the turnstile blocks it, the door is at the far end.
import { writeFileSync } from 'node:fs';

const W = 26, H = 15, T = 32;
const FLOOR = 1, WALL = 2, EXIT = 3, TRIM = 4, BASE = 5, WAINSCOT = 6, PIL_TOP = 7, PIL_FACE = 8, PIL_BASE = 9;
const WIN_TOP = [10, 11, 12], WIN_VIEW = [13, 14, 15], WIN_BASE = [16, 17, 18];
// The top wall is three tiles tall: moulding, face, wainscot. Interior rows 3–11. Doorways at y = 7.
const DOOR_Y = 7;
const EXIT_X = 21;
const PARTITIONS = [9, 17];
const WINDOWS = [3, 19]; // left tile of each 3-wide window on the top wall

const wall = Array.from({ length: H }, () => Array(W).fill(0));
const isVertical = (x, y) =>
  (PARTITIONS.includes(x) && y >= 3 && y <= 11 && y !== DOOR_Y) ||
  ((x === EXIT_X - 1 || x === EXIT_X + 1) && y >= 8 && y <= 11);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const pilaster = x === 0 || x === W - 1 || PARTITIONS.includes(x);
  if (y === 0) wall[y][x] = pilaster ? PIL_TOP : TRIM;
  else if (y === 1) wall[y][x] = pilaster ? PIL_FACE : WALL;
  else if (y === 2) wall[y][x] = pilaster ? PIL_BASE : WAINSCOT;
  else if (y === 12) wall[y][x] = TRIM;
  else if (y > 12) wall[y][x] = WALL;
  else if (x === 0 || x === W - 1) wall[y][x] = WALL;
  else if (isVertical(x, y)) wall[y][x] = isVertical(x, y - 1) ? WALL : TRIM;
}
for (const wx of WINDOWS) for (let i = 0; i < 3; i++) {
  wall[0][wx + i] = WIN_TOP[i]; wall[1][wx + i] = WIN_VIEW[i]; wall[2][wx + i] = WIN_BASE[i];
}

const floor = [], walls = [];
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  floor.push(x === EXIT_X && y === 11 ? EXIT : FLOOR);
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
const own = (sprite, extra = {}) => ({ sprite, atlas: 'own', ...extra });

// `sprite` names a frame of office_props, or with atlas:'own' a standalone image in public/assets/sprites/<sprite>.png;
// 'none' draws nothing (another object draws it); absent → placeholder block. Decorative props are furniture (level B):
// they fill the world and make it credible, and none of them talks.
const props = [
  // his office
  rect('chair_desk', 3, 3, 1, 1, { sprite: 'chair_front' }),
  rect('bookshelf', 5, 3, 2, 2, { sprite: 'bookshelf' }),
  rect('file_cabinet', 7, 3, 2, 2, { sprite: 'file_cabinet' }),
  rect('clock', 7, 2, 1, 1, { sprite: 'clock', offset_y: -32 }),
  rect('bin_office', 1, 6, 1, 1, { sprite: 'bin' }),
  // kitchen
  rect('table', 12, 5, 3, 2, { sprite: 'table' }),
  rect('coffee_cup', 13, 5, 1, 1, { sprite: 'coffee_cup', depth_offset: 40 }),
  rect('chair_kitchen_l', 11, 5, 1, 1, { sprite: 'chair_side' }),
  rect('chair_kitchen_r', 15, 5, 1, 1, { sprite: 'chair_side' }),
  rect('coffee_maker', 11, 3, 1, 1, { sprite: 'coffee_maker' }),
  rect('bin_kitchen', 10, 10, 1, 1, { sprite: 'bin' }),
  // reception
  rect('counter', 20, 5, 3, 2, { sprite: 'counter' }),
  rect('laptop', 21, 5, 1, 1, { sprite: 'laptop_open', depth_offset: 40 }),
  rect('phone', 20, 5, 1, 1, { sprite: 'phone', depth_offset: 40 }),
  rect('chair_wait_1', 18, 4, 1, 1, { sprite: 'chair_front' }),
  rect('chair_wait_2', 19, 4, 1, 1, { sprite: 'chair_front' }),
  rect('mailboxes', 23, 2, 2, 1, { sprite: 'mailboxes' }),
];
const interactables = [
  interactable('DRAWER', 3, 5, 1, 1, { note_id: 'note_meeting', sprite: 'none' }),
  interactable('DESK', 2, 4, 3, 2, { mechanic: 'desk', sprite: 'desk_drawers' }),
  interactable('CAL', 1, 2, 1, 1, { note_id: 'note_calendar', sprite: 'frame_wood', offset_y: -32 }),
  interactable('CARDS', 5, 5, 1, 1, { note_id: 'note_card', ...own('prop_card_holder_32x32') }),
  interactable('BOARD', 13, 2, 1, 1, { note_id: 'note_clipping', sprite: 'frame_plain', offset_y: -32 }),
  interactable('DISPENSER', 10, 3, 1, 1, { sprite: 'cooler' }),
  interactable('COPIER', 15, 3, 2, 1, { sprite: 'copier' }),
  interactable('PLANT', 16, 10, 1, 1, own('prop_ficus_32x64')),
  interactable('EVAC', 18, 2, 1, 1, { sprite: 'frame_plain', offset_y: -32 }),
  interactable('COUNTER', 21, 6, 1, 1, { sprite: 'none' }),
  interactable('TURNSTILE', EXIT_X, 8, 1, 1, own('prop_turnstile_32x48')),
];
const spawn = { id: nextId++, name: 'spawn', type: '', point: true, visible: true, rotation: 0, width: 0, height: 0, x: 3 * T + 16, y: 7 * T + 32 };

const layer = (id, name, extra) => ({ id, name, visible: true, opacity: 1, x: 0, y: 0, ...extra });
const map = {
  compressionlevel: -1, height: H, width: W, infinite: false,
  orientation: 'orthogonal', renderorder: 'right-down',
  tiledversion: '1.11.0', type: 'map', version: '1.10',
  tileheight: T, tilewidth: T, nextlayerid: 6, nextobjectid: nextId,
  tilesets: [{ columns: 18, firstgid: 1, image: '../../assets/tilesets/office_lpc.png',
    imageheight: T, imagewidth: T * 18, margin: 0, spacing: 0, name: 'office_lpc',
    tilecount: 18, tileheight: T, tilewidth: T }],
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
console.log('ok', out, `${W}x${H}`, interactables.length, 'interactables', props.length, 'props');
