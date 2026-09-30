// Genera public/assets/tilesets/tile_oficina_placeholder.png: 4 tiles planos de 32×32.
// Nivel A del sistema de diseño: 3–4 colores, sin textura. Tiene que ser invisible.
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const TILES = [
  [0xd9, 0xd2, 0xc4], // 1 piso
  [0x5a, 0x50, 0x46], // 2 muro
  [0xc4, 0xbf, 0xa8], // 3 salida (piso distinto)
  [0x8c, 0x80, 0x72], // 4 prop genérico (mobiliario)
];
const T = 32, W = T * TILES.length, H = T;
const raw = Buffer.alloc((W * 3 + 1) * H);
for (let y = 0; y < H; y++) {
  raw[y * (W * 3 + 1)] = 0;
  for (let x = 0; x < W; x++) {
    const c = TILES[Math.floor(x / T)];
    const i = y * (W * 3 + 1) + 1 + x * 3;
    raw[i] = c[0]; raw[i + 1] = c[1]; raw[i + 2] = c[2];
  }
}
const tabla = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc = (b) => { let c = -1; for (const x of b) c = tabla[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ -1) >>> 0; };
const chunk = (tipo, data) => { const l = Buffer.alloc(4); l.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(tipo), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2;
const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
const salida = process.argv[2] ?? 'public/assets/tilesets/tile_oficina_placeholder.png';
writeFileSync(salida, png);
console.log('ok', salida, `${W}x${H}`);
