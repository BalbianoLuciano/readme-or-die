#!/usr/bin/env python3
"""
Makes a generator's flat background transparent. Flood-fills from the four corners every pixel
whose colour is within `tolerance` of the corner colour, so enclosed areas of a similar colour
inside the object are kept. Never touches the object's pixels.

Usage: python3 tools/remove_background.py <in.png> <out.png> [tolerance=24]
Requires Pillow (a local tool, not a project dependency).
"""
import sys
import warnings
from collections import deque
from pathlib import Path

from PIL import Image

warnings.simplefilter('ignore', DeprecationWarning)


def close(a, b, tol: int) -> bool:
    return all(abs(a[i] - b[i]) <= tol for i in range(3))


def main(src: str, dst: str, tolerance: int = 24) -> int:
    img = Image.open(src).convert('RGBA')
    w, h = img.size
    px = img.load()
    seen = set()
    queue = deque()
    for corner in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        queue.append((corner, px[corner][:3]))
    while queue:
        (x, y), ref = queue.popleft()
        if (x, y) in seen or not (0 <= x < w and 0 <= y < h):
            continue
        if px[x, y][3] == 0 or not close(px[x, y][:3], ref, tolerance):
            continue
        seen.add((x, y))
        px[x, y] = (0, 0, 0, 0)
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            queue.append(((nx, ny), ref))
    img.save(dst)
    print(f'{Path(dst).name}: {len(seen)} background pixels removed of {w * h}')
    return 0


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(2)
    sys.exit(main(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 24))
