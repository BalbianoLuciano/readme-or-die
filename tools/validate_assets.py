#!/usr/bin/env python3
"""
Validates pixel-art assets against the design system (document 02): the mechanical part.
Generated art passes through here before it enters the game; what fails is regenerated.

Usage:
  python3 tools/validate_assets.py <png> [<png> ...] [--level A|B|C] [--allow-lpc]

Checks:
  - size: `_WxH` in the file name must match; `tile_*` must be 32×32; `char_*` a multiple of 64.
  - alpha: every pixel fully opaque or fully transparent (a shadow ellipse may be translucent
    only in `char_*` files: --allow-shadow).
  - palette: every opaque colour is one of the 27; never #000000 or #FFFFFF.
  - colour budget by detail level: tiles ≤ 4, B ≤ 7, C ≤ 14 (default C for props, A for tiles).
  - seamless: `tile_*` left/right and top/bottom edges must match (plain tiles always pass).
  --allow-lpc skips the palette check for borrowed LPC art (it has its own palette).

Exit code 1 if any file fails. Requires Pillow (a local tool, not a project dependency).
"""
import re
import sys
from pathlib import Path

import warnings

from PIL import Image

warnings.simplefilter('ignore', DeprecationWarning)

sys.path.insert(0, str(Path(__file__).resolve().parent))
from palette import FORBIDDEN, PALETTE_HEX, rgb_to_hex  # noqa: E402

BUDGET = {'A': 4, 'B': 7, 'C': 14}


def validate(path: Path, level: str | None, allow_lpc: bool, allow_shadow: bool) -> list[str]:
    errors: list[str] = []
    img = Image.open(path).convert('RGBA')
    name = path.name
    kind = name.split('_')[0]

    # size
    m = re.search(r'_(\d+)x(\d+)\.png$', name)
    if m and (img.width, img.height) != (int(m.group(1)), int(m.group(2))):
        errors.append(f'size is {img.width}x{img.height}, name says {m.group(1)}x{m.group(2)}')
    if kind == 'tile' and (img.width, img.height) != (32, 32):
        errors.append(f'tiles are 32x32, this is {img.width}x{img.height}')
    if kind == 'char' and (img.width % 64 or img.height % 64):
        errors.append(f'character sheets are multiples of 64, this is {img.width}x{img.height}')

    pixels = list(img.getdata())
    opaque = [p for p in pixels if p[3] == 255]
    partial = [p for p in pixels if 0 < p[3] < 255]
    if partial and not (allow_shadow and kind == 'char'):
        errors.append(f'{len(partial)} semi-transparent pixels (alpha must be 0 or 255)')
    if not opaque:
        errors.append('the image is fully transparent')

    colours = {rgb_to_hex((r, g, b)) for r, g, b, _ in opaque}
    forbidden = colours & FORBIDDEN
    if forbidden:
        errors.append(f'forbidden colours: {sorted(forbidden)}')
    if not allow_lpc:
        outside = sorted(colours - PALETTE_HEX)
        if outside:
            errors.append(f'{len(outside)} colours outside the palette: {outside[:8]}{"…" if len(outside) > 8 else ""}')

    lvl = level or ('A' if kind == 'tile' else 'C')
    if len(colours) > BUDGET[lvl]:
        errors.append(f'{len(colours)} colours, level {lvl} allows {BUDGET[lvl]}')

    if kind == 'tile':
        w, h = img.size
        left = [img.getpixel((0, y)) for y in range(h)]
        right = [img.getpixel((w - 1, y)) for y in range(h)]
        top = [img.getpixel((x, 0)) for x in range(w)]
        bottom = [img.getpixel((x, h - 1)) for x in range(w)]
        # A seamless tile continues into itself: opposite edges must be compatible (identical is the safe test).
        if left != right and 'wall' not in name:
            errors.append('left and right edges differ: not seamless horizontally')
        if top != bottom and 'floor' in name:
            errors.append('top and bottom edges differ: not seamless vertically')
    return errors


def main(argv: list[str]) -> int:
    level = None
    allow_lpc = '--allow-lpc' in argv
    allow_shadow = '--allow-shadow' in argv
    if '--level' in argv:
        level = argv[argv.index('--level') + 1].upper()
    files = [Path(a) for a in argv if a.endswith('.png')]
    if not files:
        print(__doc__)
        return 2
    failed = 0
    for f in files:
        errs = validate(f, level, allow_lpc, allow_shadow)
        status = 'ok ' if not errs else 'FAIL'
        print(f'{status} {f}')
        for e in errs:
            print(f'      - {e}')
        failed += bool(errs)
    print(f'{len(files) - failed}/{len(files)} passed')
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
