#!/usr/bin/env python3
"""
Snaps every opaque pixel of a PNG to the nearest colour of the game's palette (document 02 §7).
For generated art that is right in shape but drifts in colour. Never changes shape or alpha.

Usage:
  python3 tools/quantize_to_palette.py <in.png> <out.png> [--ramps wood,metal,...]

--ramps restricts the candidate colours to those ramps (plus the reserved neutrals), so a wooden
desk cannot pick up a skin tone. Requires Pillow (a local tool, not a project dependency).
"""
import sys
from pathlib import Path

import warnings

from PIL import Image

warnings.simplefilter('ignore', DeprecationWarning)

sys.path.insert(0, str(Path(__file__).resolve().parent))
from palette import RAMPS, hex_to_rgb  # noqa: E402


def nearest(rgb: tuple[int, int, int], candidates: list[tuple[int, int, int]]) -> tuple[int, int, int]:
    r, g, b = rgb
    return min(candidates, key=lambda c: (c[0] - r) ** 2 + (c[1] - g) ** 2 + (c[2] - b) ** 2)


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(__doc__)
        return 2
    src, dst = Path(argv[0]), Path(argv[1])
    ramps = list(RAMPS)
    if '--ramps' in argv:
        ramps = argv[argv.index('--ramps') + 1].split(',') + ['reserved']
    candidates = [hex_to_rgb(c) for name in ramps for c in RAMPS[name]]

    img = Image.open(src).convert('RGBA')
    cache: dict[tuple[int, int, int], tuple[int, int, int]] = {}
    out = []
    for r, g, b, a in img.getdata():
        if a == 0:
            out.append((0, 0, 0, 0))
            continue
        key = (r, g, b)
        if key not in cache:
            cache[key] = nearest(key, candidates)
        out.append((*cache[key], a))
    result = Image.new('RGBA', img.size)
    result.putdata(out)
    result.save(dst)
    print(f'{dst}: {len(cache)} source colours → {len(set(cache.values()))} palette colours')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
