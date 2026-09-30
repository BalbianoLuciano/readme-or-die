// Genera public/data/mapas/nivel_01.json (formato Tiled 1.10) a partir de la planta del nivel 1.
// Capas del contrato: piso, muros (tiles) · props, interactuables, spawn (objetos).
import { writeFileSync } from 'node:fs';

const W = 34, H = 18, T = 32;
const PISO = 1, MURO = 2, SALIDA = 3;

const piso = [], muros = [];
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const borde = x === 0 || y === 0 || x === W - 1 || y === H - 1;
  const tabique = (x === 12 || x === 23) && y !== 8;
  // Pasillo de salida: dos paredes que encajonan el molinete hasta la puerta.
  const encajonado = (x === 27 || x === 29) && y >= 10 && y <= 13;
  piso.push(x === 28 && y === 13 ? SALIDA : PISO);
  muros.push(borde || tabique || encajonado ? MURO : 0);
}

let nextId = 1;
const rect = (name, x, y, w = 1, h = 1, props = {}) => ({
  id: nextId++, name, type: '', visible: true, rotation: 0,
  x: x * T, y: y * T, width: w * T, height: h * T,
  properties: Object.entries(props).map(([k, v]) => ({ name: k, type: typeof v === 'boolean' ? 'bool' : 'string', value: v })),
});
const inter = (id, x, y, w, h, extra = {}) => rect(id, x, y, w, h, { id, texto_id: id, es_documento: false, ...extra });

const props = [
  rect('mostrador', 27, 6, 3, 2),
  rect('rieles', 28, 11, 1, 2),
];
const interactuables = [
  inter('ESCR', 3, 4, 3, 1, { mecanica: 'escritorio' }),
  inter('CAL', 2, 1, 1, 1, { nota_id: 'nota_calendario' }),
  inter('TAR', 6, 4, 1, 1, { nota_id: 'nota_tarjeta' }),
  inter('CAJ', 4, 5, 1, 1, { nota_id: 'nota_reunion' }),
  inter('CART', 18, 1, 1, 1, { nota_id: 'nota_recorte' }),
  inter('DISP', 14, 2, 1, 1),
  inter('FOT', 20, 3, 1, 1),
  inter('PLA', 21, 12, 1, 1),
  inter('EVAC', 26, 1, 1, 1),
  inter('MOST', 28, 7, 1, 1),
  inter('MOL', 28, 10, 1, 1),
];
const spawn = { id: nextId++, name: 'spawn', type: '', point: true, visible: true, rotation: 0, width: 0, height: 0, x: 4 * T + 16, y: 7 * T + 32 };

const capa = (id, name, extra) => ({ id, name, visible: true, opacity: 1, x: 0, y: 0, ...extra });
const mapa = {
  compressionlevel: -1, height: H, width: W, infinite: false,
  orientation: 'orthogonal', renderorder: 'right-down',
  tiledversion: '1.11.0', type: 'map', version: '1.10',
  tileheight: T, tilewidth: T, nextlayerid: 6, nextobjectid: nextId,
  tilesets: [{ columns: 4, firstgid: 1, image: '../../assets/tilesets/tile_oficina_placeholder.png',
    imageheight: T, imagewidth: T * 4, margin: 0, spacing: 0, name: 'tile_oficina_placeholder',
    tilecount: 4, tileheight: T, tilewidth: T }],
  layers: [
    capa(1, 'piso', { type: 'tilelayer', width: W, height: H, data: piso }),
    capa(2, 'muros', { type: 'tilelayer', width: W, height: H, data: muros }),
    capa(3, 'props', { type: 'objectgroup', draworder: 'topdown', objects: props }),
    capa(4, 'interactuables', { type: 'objectgroup', draworder: 'topdown', objects: interactuables }),
    capa(5, 'spawn', { type: 'objectgroup', draworder: 'topdown', objects: [spawn] }),
  ],
};
const salida = process.argv[2] ?? 'public/data/mapas/nivel_01.json';
writeFileSync(salida, JSON.stringify(mapa));
console.log('ok', salida, `${W}x${H}`, interactuables.length, 'interactuables');
