#!/usr/bin/env python3
"""
Builds public/assets/sprites/char_homero_walk.png from a PixelLab character export.

Input: the folder PixelLab exports (unzipped), with
  Idle/rotations/{north,west,south,east}.png            standing frames
  Idle/animations/<walk>/<direction>/frame_NNN.png   walk frames (any count ≥ 4)

Output sheet: 64×64 frames, 5 columns × 4 rows.
  column 0 = standing, columns 1–4 = walk cycle (4 frames picked evenly from the export)
  rows = back (north), left (west), front (south), right (east)   — the LPC row order
Every frame is aligned so the feet sit at y = 60 of the 64 px cell; pure black is remapped to the
character outline colour #241E1A. Nothing else is touched (design rule: no hand cleanup).

Usage: python3 tools/build_character_sheet.py <export_dir> [walk_name]
Requires Pillow (a local tool, not a project dependency).
"""
import sys
from pathlib import Path

from PIL import Image

CELL = 64
FEET_Y = 60
ROWS = ['north', 'west', 'south', 'east']
COLUMNS = 5
OUTLINE = (0x24, 0x1E, 0x1A, 255)


def normalize(img: Image.Image, dy: int) -> Image.Image:
    """Centres a 48 or 64 px frame in a 64 px cell, shifted by dy, and remaps pure black."""
    cell = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0))
    pad = (CELL - img.width) // 2
    cell.alpha_composite(img, (pad, pad + dy))
    px = cell.load()
    for y in range(CELL):
        for x in range(CELL):
            r, g, b, a = px[x, y]
            if a > 0 and r == 0 and g == 0 and b == 0:
                px[x, y] = OUTLINE
    return cell


def feet_offset(img: Image.Image) -> int:
    pad = (CELL - img.height) // 2
    bottom = img.getbbox()[3] + pad  # bbox bottom is exclusive
    return FEET_Y + 1 - bottom


def main(export: str, walk: str = 'Sad_Walk') -> None:
    src = Path(export)
    sheet = Image.new('RGBA', (CELL * COLUMNS, CELL * len(ROWS)), (0, 0, 0, 0))
    for row, direction in enumerate(ROWS):
        idle = Image.open(src / 'Idle/rotations' / f'{direction}.png').convert('RGBA')
        frames = sorted((src / 'Idle/animations' / walk / direction).glob('frame_*.png'))
        if len(frames) < 4:
            raise SystemExit(f'{direction}: need at least 4 walk frames, found {len(frames)}')
        picked = [frames[round(i * len(frames) / 4)] for i in range(4)]
        walk_imgs = [Image.open(f).convert('RGBA') for f in picked]
        # One offset per direction, from the lowest foot across the walk, so the cycle never jitters vertically.
        dy_walk = min(feet_offset(im) for im in walk_imgs)
        sheet.paste(normalize(idle, feet_offset(idle)), (0, row * CELL))
        for col, im in enumerate(walk_imgs, start=1):
            sheet.paste(normalize(im, dy_walk), (col * CELL, row * CELL))
    out = Path(__file__).resolve().parent.parent / 'public/assets/sprites/char_homero_walk.png'
    sheet.save(out)
    print(out, sheet.size)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    main(*sys.argv[1:3])
