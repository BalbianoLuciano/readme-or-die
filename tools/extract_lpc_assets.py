#!/usr/bin/env python3
"""
Builds the borrowed-art assets for level 1 from Liberated Pixel Cup packs.
Phase A of the roadmap: the game is playable with borrowed art before any own art exists.

Usage:
  python3 tools/extract_lpc_assets.py <sources_dir>

<sources_dir> must contain, unzipped:
  lpc-floors/lpc-floors/floors.png           https://opengameart.org/content/lpc-floors        (CC-BY-SA 4.0)
  lpc-walls/lpc-walls/walls.png              https://opengameart.org/content/lpc-walls         (CC-BY-SA 3.0)
  lpc_-_the_office/*.png                     https://opengameart.org/content/lpc-revised-the-office (OGA-BY 3.0)
  furniture/dark-wood.png                    https://opengameart.org/content/lpc-wooden-furniture   (CC-BY-SA 4.0/3.0, GPL 3.0)
  shelves/bookshelf-brown.png, drawer_shelf-brown.png   https://opengameart.org/content/lpc-shelves-rework (CC-BY-SA 3.0, GPL 3.0)

Outputs (committed, credited in CREDITS.md):
  public/assets/tilesets/office_lpc.png                 floor, wall face, exit floor, wall top trim, wall baseboard
  public/assets/sprites/office_props.png + .json         Phaser atlas (JSON hash) with the office props

Requires Pillow (a local tool, not a project dependency).
"""
import json
import sys
from pathlib import Path

from PIL import Image

T = 32


def tile(sheet: Image.Image, tile_id: int, columns: int) -> Image.Image:
    x = (tile_id % columns) * T
    y = (tile_id // columns) * T
    return sheet.crop((x, y, x + T, y + T))


def build_tileset(src: Path, out: Path) -> None:
    floors = Image.open(src / 'lpc-floors/lpc-floors/floors.png').convert('RGBA')  # 32 columns
    walls = Image.open(src / 'lpc-walls/lpc-walls/walls.png').convert('RGBA')  # 64 columns
    tiles = [
        tile(floors, 1178, 32),  # 1 floor: seamless grey office carpet
        tile(walls, 2925, 64),   # 2 wall face: plain beige panel
        tile(floors, 1602, 32),  # 3 exit floor: plain cream
        tile(walls, 2861, 64),   # 4 wall top trim (moulding)
        tile(walls, 2989, 64),   # 5 wall baseboard
    ]
    sheet = Image.new('RGBA', (T * len(tiles), T), (0, 0, 0, 0))
    for i, t in enumerate(tiles):
        sheet.paste(t, (i * T, 0))
    sheet.save(out)
    print(out, sheet.size)


def build_props(src: Path, out_png: Path, out_json: Path) -> None:
    office = src / 'lpc_-_the_office'
    sheets = {n: Image.open(office / f'{n}.png').convert('RGBA') for n in
              ['Desk, Ornate', 'Copy Machine', 'Water Cooler', 'Laptop', 'Office Portraits', 'Coffee Maker', 'Bins',
               'Card Table', 'Rotary Phones', 'Mailboxes', 'Coffee Cup']}
    sheets['wood'] = Image.open(src / 'furniture/dark-wood.png').convert('RGBA')
    sheets['bookshelf'] = Image.open(src / 'shelves/bookshelf-brown.png').convert('RGBA')
    sheets['drawer_shelf'] = Image.open(src / 'shelves/drawer_shelf-brown.png').convert('RGBA')
    # name: (sheet, x, y, w, h)
    frames = {
        'desk_drawers': ('Desk, Ornate', 0, 64, 96, 64),
        'counter': ('Desk, Ornate', 0, 0, 96, 64),
        'copier': ('Copy Machine', 0, 0, 64, 64),
        'cooler': ('Water Cooler', 32, 0, 32, 64),
        'laptop_open': ('Laptop', 64, 0, 32, 32),
        'frame_plain': ('Office Portraits', 0, 0, 32, 32),
        'frame_wood': ('Office Portraits', 32, 0, 32, 32),
        'coffee_maker': ('Coffee Maker', 0, 0, 32, 64),
        'bin': ('Bins', 64, 64, 32, 32),
        'bin_tall': ('Bins', 64, 0, 32, 64),
        'table': ('Card Table', 0, 64, 96, 64),
        'phone': ('Rotary Phones', 32, 0, 32, 32),
        'mailboxes': ('Mailboxes', 16, 64, 64, 64),
        'coffee_cup': ('Coffee Cup', 0, 0, 32, 32),
        'chair_front': ('wood', 448, 640, 32, 32),
        'chair_side': ('wood', 480, 640, 32, 32),
        'clock': ('wood', 128, 672, 32, 32),
        'bookshelf': ('bookshelf', 0, 0, 64, 96),
        'file_cabinet': ('drawer_shelf', 0, 0, 64, 96),
    }
    # Pack in a row with 1 px gutters.
    width = sum(f[3] + 1 for f in frames.values()) + 1
    height = max(f[4] for f in frames.values()) + 2
    atlas = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    data = {'frames': {}, 'meta': {'image': out_png.name, 'size': {'w': width, 'h': height}, 'scale': '1'}}
    x = 1
    for name, (sheet, sx, sy, w, h) in frames.items():
        atlas.paste(sheets[sheet].crop((sx, sy, sx + w, sy + h)), (x, 1))
        data['frames'][name] = {
            'frame': {'x': x, 'y': 1, 'w': w, 'h': h}, 'rotated': False, 'trimmed': False,
            'spriteSourceSize': {'x': 0, 'y': 0, 'w': w, 'h': h}, 'sourceSize': {'w': w, 'h': h},
        }
        x += w + 1
    atlas.save(out_png)
    out_json.write_text(json.dumps(data, indent=1), encoding='utf-8')
    print(out_png, atlas.size, list(frames))


def main(sources: str) -> None:
    src = Path(sources)
    root = Path(__file__).resolve().parent.parent
    build_tileset(src, root / 'public/assets/tilesets/office_lpc.png')
    build_props(src, root / 'public/assets/sprites/office_props.png', root / 'public/assets/sprites/office_props.json')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(2)
    main(sys.argv[1])
