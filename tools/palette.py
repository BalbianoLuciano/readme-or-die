"""The game's palette (design document 02 §7, amended by 03 §12). Shared by the asset tools.
The document says 27 colours; the ramps sum 27 and the three reserved neutrals make 30."""

RAMPS: dict[str, list[str]] = {
    'wall': ['#F2EBDC', '#E3D9C6', '#C9BCA4', '#A3937B'],
    'floor': ['#D4C9B4', '#B8AB94', '#968A75', '#6E6455'],
    'wood': ['#C89F6B', '#A8804F', '#7E5C37', '#543B23'],
    'metal': ['#D8DCDF', '#B0B6BB', '#858C93', '#5A6167'],
    'green': ['#8FA576', '#6B7F55', '#4A5A3A'],
    'blue': ['#7D9CB5', '#57748C', '#3A5164'],
    'skin': ['#EDBCA0', '#D4977A', '#A66F57'],
    'lightblue': ['#C6DCEA', '#A3C3D6'],
    'reserved': ['#FFF8E0', '#3B322B', '#241E1A'],
}

FORBIDDEN = {'#000000', '#FFFFFF'}


def hex_to_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip('#')
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def rgb_to_hex(rgb: tuple[int, int, int]) -> str:
    return '#%02X%02X%02X' % rgb


PALETTE: list[tuple[int, int, int]] = [hex_to_rgb(c) for ramp in RAMPS.values() for c in ramp]
PALETTE_HEX = {rgb_to_hex(c) for c in PALETTE}
assert len(PALETTE) == 30, len(PALETTE)
