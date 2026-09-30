# readme-or-die

A game where your life depends on which `.md` you choose.

A 2D survival game for the browser, in pixel art with a Pokémon-style camera. No combat, no jumping, no timers: walk, read, point, correct, sign.

**Status: under construction.** Level 1 is playable end to end with placeholder art.

## Run locally

```sh
npm install
npm run dev
```

Open `http://localhost:5173/readme-or-die/`. Arrows or WASD to walk, E or Space to inspect, Tab to open the document, Q to open the box.

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with reload |
| `npm test` | Pure-logic tests and corpus validation (Vitest) |
| `npm run typecheck` | Type check |
| `npm run build` | Production build in `dist/` |

## Stack

TypeScript · Phaser 3 · Vite · Tiled · Vitest. All free. No dependency is added without a written reason.

## Structure

```
public/data/maps/        Tiled maps, locale-independent
public/data/<locale>/    documents, texts and UI labels per language (es is the source)
public/assets/           tilesets, sprites, fonts, audio
src/scenes/              every screen or overlay is a Phaser scene
src/systems/             pure logic: typography, corpus, amendments, state, persistence, i18n
tools/                   generators for fonts, tilesets and maps
tests/                   pure logic only; rendering is validated by playing
```

## Languages

The player's texts are written in Spanish (Argentina) and live under `public/data/es/`. Translations go under `public/data/<locale>/` and must keep the exact structure of the source; the corpus test enforces it.

## Licences

| | |
|---|---|
| Code | [MIT](LICENSE) |
| Content, art and texts | [CC BY-SA 4.0](LICENSE-CONTENT.md) |

Third-party assets are listed in [CREDITS.md](CREDITS.md).
