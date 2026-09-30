#!/usr/bin/env python3
"""
Rasterize a pixel TTF into a bitmap font atlas (PNG + BMFont XML) for Phaser's BitmapText.
No antialiasing: every glyph is rendered at its native pixel size.

Usage:
  python3 tools/generate_font.py <ttf> <size_px> <output_without_extension>

Example:
  python3 tools/generate_font.py public/assets/fonts/source/ark-pixel-12px-monospaced-latin.ttf 12 public/assets/fonts/ark12

Requires Pillow (a local tool, not a project dependency).
"""
import sys
from pathlib import Path
from xml.sax.saxutils import escape

from PIL import Image, ImageDraw, ImageFont

# Everything the game needs to write in Spanish and English, plus a few stationery signs.
CHARACTERS = (
    "".join(chr(c) for c in range(0x20, 0x7F))
    + "áéíóúüñÁÉÍÓÚÜÑ¿¡«»—–…·°ºª€"
)


def main(ttf: str, size: int, output: str) -> None:
    font = ImageFont.truetype(ttf, size)
    ascent, descent = font.getmetrics()
    line_height = ascent + descent

    glyphs = []
    for ch in CHARACTERS:
        bbox = font.getbbox(ch, mode="1")
        advance = int(round(font.getlength(ch)))
        if bbox is None or bbox[2] <= bbox[0] or bbox[3] <= bbox[1]:
            glyphs.append((ch, advance, 0, 0, 0, 0, None))
            continue
        x0, y0, x1, y1 = bbox
        w, h = x1 - x0, y1 - y0
        img = Image.new("1", (w, h), 0)
        d = ImageDraw.Draw(img)
        d.fontmode = "1"  # no antialiasing
        d.text((-x0, -y0), ch, font=font, fill=1)
        glyphs.append((ch, advance, x0, y0, w, h, img))

    # Simple row packing with 1 px of spacing.
    atlas_w = 256
    x = y = 1
    row_h = 0
    positions = []
    for ch, advance, x0, y0, w, h, img in glyphs:
        if w == 0:
            positions.append((0, 0))
            continue
        if x + w + 1 > atlas_w:
            x = 1
            y += row_h + 1
            row_h = 0
        positions.append((x, y))
        x += w + 1
        row_h = max(row_h, h)
    atlas_h = y + row_h + 1
    p = 1
    while p < atlas_h:
        p *= 2
    atlas_h = p

    atlas = Image.new("RGBA", (atlas_w, atlas_h), (0, 0, 0, 0))
    for (ch, advance, x0, y0, w, h, img), (px, py) in zip(glyphs, positions):
        if img is None:
            continue
        white = Image.new("RGBA", (w, h), (255, 255, 255, 255))
        atlas.paste(white, (px, py), img)

    out_png = Path(output + ".png")
    out_fnt = Path(output + ".xml")
    atlas.save(out_png)

    name = Path(ttf).stem
    lines = [
        '<?xml version="1.0"?>',
        "<font>",
        f'  <info face="{escape(name)}" size="{size}" bold="0" italic="0" charset="" unicode="1" '
        f'stretchH="100" smooth="0" aa="1" padding="0,0,0,0" spacing="1,1" outline="0"/>',
        f'  <common lineHeight="{line_height}" base="{ascent}" scaleW="{atlas_w}" scaleH="{atlas_h}" '
        f'pages="1" packed="0" alphaChnl="0" redChnl="4" greenChnl="4" blueChnl="4"/>',
        "  <pages>",
        f'    <page id="0" file="{escape(out_png.name)}"/>',
        "  </pages>",
        f'  <chars count="{len(glyphs)}">',
    ]
    for (ch, advance, x0, y0, w, h, img), (px, py) in zip(glyphs, positions):
        lines.append(
            f'    <char id="{ord(ch)}" x="{px}" y="{py}" width="{w}" height="{h}" '
            f'xoffset="{x0}" yoffset="{y0}" xadvance="{advance}" page="0" chnl="15"/>'
        )
    lines += ["  </chars>", "</font>", ""]
    out_fnt.write_text("\n".join(lines), encoding="utf-8")

    advances = sorted({g[1] for g in glyphs})
    print(f"{out_png.name}: {len(glyphs)} glyphs, atlas {atlas_w}x{atlas_h}, "
          f"lineHeight={line_height} base={ascent} advances={advances}")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print(__doc__)
        sys.exit(2)
    main(sys.argv[1], int(sys.argv[2]), sys.argv[3])
