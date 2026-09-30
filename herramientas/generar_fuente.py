#!/usr/bin/env python3
"""
Rasteriza una fuente pixel TTF a un atlas bitmap (PNG + .fnt XML, formato BMFont)
para BitmapText de Phaser. Sin antialiasing: cada glifo queda a su tamaño nativo.

Uso:
  python3 herramientas/generar_fuente.py <ttf> <tamaño_px> <salida_sin_extension>

Ejemplo:
  python3 herramientas/generar_fuente.py public/assets/fuentes/origen/ark-pixel-12px-monospaced-latin.ttf 12 public/assets/fuentes/ark12

Requiere Pillow (herramienta local, no es dependencia del proyecto).
"""
import sys
from pathlib import Path
from xml.sax.saxutils import escape

from PIL import Image, ImageDraw, ImageFont

# Todo lo que el juego necesita escribir en español, más algunos signos de papelería.
CARACTERES = (
    "".join(chr(c) for c in range(0x20, 0x7F))
    + "áéíóúüñÁÉÍÓÚÜÑ¿¡«»—–…·°ºª€"
)


def main(ttf: str, tamano: int, salida: str) -> None:
    fuente = ImageFont.truetype(ttf, tamano)
    ascent, descent = fuente.getmetrics()
    alto_linea = ascent + descent

    glifos = []
    for ch in CARACTERES:
        # Caja del glifo en coordenadas de línea: (x0, y0, x1, y1) relativo al origen del texto.
        bbox = fuente.getbbox(ch, mode="1")
        avance = int(round(fuente.getlength(ch)))
        if bbox is None or bbox[2] <= bbox[0] or bbox[3] <= bbox[1]:
            glifos.append((ch, avance, 0, 0, 0, 0, None))
            continue
        x0, y0, x1, y1 = bbox
        w, h = x1 - x0, y1 - y0
        img = Image.new("1", (w, h), 0)
        d = ImageDraw.Draw(img)
        d.fontmode = "1"  # sin antialiasing
        d.text((-x0, -y0), ch, font=fuente, fill=1)
        glifos.append((ch, avance, x0, y0, w, h, img))

    # Empaquetado simple por filas, con 1 px de separación.
    ancho_atlas = 256
    x = y = 1
    alto_fila = 0
    posiciones = []
    for ch, avance, x0, y0, w, h, img in glifos:
        if w == 0:
            posiciones.append((0, 0))
            continue
        if x + w + 1 > ancho_atlas:
            x = 1
            y += alto_fila + 1
            alto_fila = 0
        posiciones.append((x, y))
        x += w + 1
        alto_fila = max(alto_fila, h)
    alto_atlas = y + alto_fila + 1
    # Potencia de dos, por prolijidad con las texturas.
    p = 1
    while p < alto_atlas:
        p *= 2
    alto_atlas = p

    atlas = Image.new("RGBA", (ancho_atlas, alto_atlas), (0, 0, 0, 0))
    for (ch, avance, x0, y0, w, h, img), (px, py) in zip(glifos, posiciones):
        if img is None:
            continue
        blanco = Image.new("RGBA", (w, h), (255, 255, 255, 255))
        atlas.paste(blanco, (px, py), img)

    salida_png = Path(salida + ".png")
    salida_fnt = Path(salida + ".xml")
    atlas.save(salida_png)

    nombre = Path(ttf).stem
    lineas = [
        '<?xml version="1.0"?>',
        "<font>",
        f'  <info face="{escape(nombre)}" size="{tamano}" bold="0" italic="0" charset="" unicode="1" '
        f'stretchH="100" smooth="0" aa="1" padding="0,0,0,0" spacing="1,1" outline="0"/>',
        f'  <common lineHeight="{alto_linea}" base="{ascent}" scaleW="{ancho_atlas}" scaleH="{alto_atlas}" '
        f'pages="1" packed="0" alphaChnl="0" redChnl="4" greenChnl="4" blueChnl="4"/>',
        "  <pages>",
        f'    <page id="0" file="{escape(salida_png.name)}"/>',
        "  </pages>",
        f'  <chars count="{len(glifos)}">',
    ]
    for (ch, avance, x0, y0, w, h, img), (px, py) in zip(glifos, posiciones):
        lineas.append(
            f'    <char id="{ord(ch)}" x="{px}" y="{py}" width="{w}" height="{h}" '
            f'xoffset="{x0}" yoffset="{y0}" xadvance="{avance}" page="0" chnl="15"/>'
        )
    lineas += ["  </chars>", "</font>", ""]
    salida_fnt.write_text("\n".join(lineas), encoding="utf-8")

    avances = sorted({g[1] for g in glifos})
    print(f"{salida_png.name}: {len(glifos)} glifos, atlas {ancho_atlas}x{alto_atlas}, "
          f"lineHeight={alto_linea} base={ascent} avances={avances}")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print(__doc__)
        sys.exit(2)
    main(sys.argv[1], int(sys.argv[2]), sys.argv[3])
