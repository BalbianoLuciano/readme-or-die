/** Colours and measures of the interface. Everything that is paper uses this palette. */
export const COLOR = {
  paper: 0xf2ebdc,
  ink: 0x3b322b,
  paperHighContrast: 0xfff8e0,
  inkHighContrast: 0x241e1a,
  background: 0x241e1a,
  outline: 0xfff8e0,
} as const;

/** Fonts loaded as BitmapText. */
export const FONT = {
  body: 'ark12',
  ui: 'ark10',
} as const;

/** Metrics of the monospaced fonts: one column is one character. */
export const METRIC = {
  body: { width: 6, height: 12, leading: 20 }, // 12 × 165 % ≈ 20
  ui: { width: 5, height: 10, leading: 14 }, // 10 × 140 %
} as const;
