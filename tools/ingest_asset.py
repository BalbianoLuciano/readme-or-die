#!/usr/bin/env python3
"""
Takes a raw generator output from inbox/ and produces the game asset:
  1. removes a flat background if any pixel is still opaque at the corners,
  2. downsizes by an integer factor (nearest neighbour) to the size in the target name,
  3. snaps colours to the palette (optionally restricted to ramps),
  4. validates; on success writes public/assets/<kind>/<target>.png.

Usage: python3 tools/ingest_asset.py <inbox_png> <target_name> [--ramps a,b,c] [--level A|B|C]
  target_name like prop_ficus_32x64 (size parsed from the suffix). Kind from the prefix:
  prop_ → sprites/, ui_ → ui/, tile_ → tilesets/.
Requires Pillow (a local tool, not a project dependency).
"""
import re
import subprocess
import sys
import warnings
from pathlib import Path

from PIL import Image

warnings.simplefilter('ignore', DeprecationWarning)
ROOT = Path(__file__).resolve().parent.parent
TOOLS = ROOT / 'tools'
KIND_DIR = {'prop': 'sprites', 'ui': 'ui', 'tile': 'tilesets', 'char': 'sprites'}


def run(*args: str) -> None:
    subprocess.run([sys.executable, *args], check=True)


def main(argv: list[str]) -> int:
    src, target = Path(argv[0]), argv[1]
    m = re.search(r'_(\d+)x(\d+)$', target)
    if not m:
        raise SystemExit('target name must end in _WxH')
    tw, th = int(m.group(1)), int(m.group(2))
    ramps = argv[argv.index('--ramps') + 1] if '--ramps' in argv else None
    level = argv[argv.index('--level') + 1] if '--level' in argv else None

    work = ROOT / 'inbox' / '.work'
    work.mkdir(exist_ok=True)
    step1 = work / f'{target}.nobg.png'
    img = Image.open(src).convert('RGBA')
    corners = [img.getpixel(p)[3] for p in [(0, 0), (img.width - 1, 0), (0, img.height - 1), (img.width - 1, img.height - 1)]]
    if any(a > 0 for a in corners):
        run(str(TOOLS / 'remove_background.py'), str(src), str(step1))
    else:
        img.save(step1)

    img = Image.open(step1).convert('RGBA')
    # Generators sometimes return an odd canvas (e.g. 64×88 for a 32×48 target). Pad with transparency
    # to the next multiple, bottom-aligned and centred, so the drawing itself is never resampled unevenly.
    factor = max(1, round(img.width / tw))
    cw, ch = tw * factor, th * factor
    if img.size != (cw, ch):
        canvas = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
        canvas.alpha_composite(img.crop((0, 0, min(img.width, cw), min(img.height, ch))), ((cw - min(img.width, cw)) // 2, ch - min(img.height, ch)))
        img = canvas
        print(f'padded {Image.open(step1).size} → {img.size}')
    step2 = work / f'{target}.small.png'
    img.resize((tw, th), Image.NEAREST).save(step2)
    # Binary alpha after resizing.
    small = Image.open(step2).convert('RGBA')
    px = small.load()
    for y in range(th):
        for x in range(tw):
            r, g, b, a = px[x, y]
            px[x, y] = (r, g, b, 255 if a >= 128 else 0)
    small.save(step2)

    step3 = work / f'{target}.pal.png'
    run(str(TOOLS / 'quantize_to_palette.py'), str(step2), str(step3), *(['--ramps', ramps] if ramps else []))

    final = ROOT / 'public/assets' / KIND_DIR[target.split('_')[0]] / f'{target}.png'
    final.parent.mkdir(parents=True, exist_ok=True)
    Image.open(step3).save(final)
    print(f'downsized ×{factor} → {final}')
    result = subprocess.run([sys.executable, str(TOOLS / 'validate_assets.py'), str(final), *(['--level', level] if level else [])])
    return result.returncode


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(2)
    sys.exit(main(sys.argv[1:]))
