# readme-or-die

A 2D survival game for the browser. Pixel art, Pokémon-style camera, no combat.
Homero Argento, a laid-off technical writer, audits documents written in his own voice.

## Commands

```sh
npm run dev        # http://localhost:5173/readme-or-die/
npm test           # Vitest, pure logic only
npm run typecheck  # tsc
npm run build      # dist/
```

Before calling anything done: `npm run typecheck && npm test`.

## Fixed stack

TypeScript · Phaser **3** (not 4) · Vite · Tiled → JSON · Vitest.
**No dependency is added without a written reason in the commit.**

When in doubt about the Phaser API, do not guess: grep `node_modules/phaser/types/phaser.d.ts`. It is 3.90; many answers online are for 2 or 4.

## Languages

- **Code, files, folders, identifiers, JSON keys, comments, commits and repo docs: English.**
- **Everything the player reads: Spanish is the source language.** It lives under `public/data/es/`. Other locales are translations under `public/data/<locale>/` and must keep the source structure (the corpus test enforces it).
- Maps are locale-independent (`public/data/maps/`); they reference texts by `text_id`.

## Conventions

- `snake_case` for assets and JSON keys, `PascalCase` for scenes and systems.
- Internal resolution 640×360. **Integer scaling only.** Tile 32×32. Character 32×48 anchored at the bottom centre.
- Every screen or overlay is its own **Phaser scene**. Overlays launch on top and pause the scene below.
- Pure logic lives in `src/systems/` and **is tested**. Scenes are not tested: they are validated by playing.
- We wrap lines ourselves (`systems/Typography`). Phaser never breaks lines.
- The corpus is external: `public/data/` is edited without recompiling. Tiled layers: `floor`, `walls`, `props`, `interactables`, `spawn`.
- Controls: arrows/WASD walk · E/Space inspect · Tab document · Q box · Esc menu. Everything works with the keyboard.

## Content rules that are not negotiable

1. No historical event is shown or named. Only coordinates: place, date, time.
2. No text judges the AI.
3. No combat or player violence.
4. No alternative happy ending.
5. Homero never complains.

## Agents

- `design-reviewer`: audits new code against the design documents. Run it at the end of each step, before committing.

## Commits

`type: description` in English (`feat:`, `fix:`, `docs:`, `test:`). One commit per purpose.
