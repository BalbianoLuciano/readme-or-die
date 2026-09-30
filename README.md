# readme-or-die

Un juego donde tu vida depende de qué `.md` elegís.

Juego de supervivencia 2D para navegador, en pixel art y cámara tipo Pokémon. Sin combate, sin salto, sin temporizadores: caminar, leer, señalar, corregir, firmar.

**Estado: en construcción.** Todavía no hay nada jugable.

## Correr en local

```sh
npm install
npm run dev
```

Abre `http://localhost:5173/readme-or-die/`. Flechas o WASD para caminar.

| Comando | Qué hace |
|---|---|
| `npm run dev` | Dev server con recarga |
| `npm test` | Tests de lógica pura (Vitest) |
| `npm run typecheck` | Chequeo de tipos |
| `npm run build` | Build de producción en `dist/` |

## Stack

TypeScript · Phaser 3 · Vite · Tiled · Vitest. Todo libre. No se agrega una dependencia sin una razón escrita.

## Estructura

```
public/data/       # corpus externo: mapas (Tiled), documentos y textos, editable sin recompilar
public/assets/     # tilesets, sprites, fuentes, audio
src/escenas/       # cada pantalla u overlay es una escena de Phaser
src/sistemas/      # lógica pura: tipografía, corpus, enmiendas, estado, persistencia
tests/             # solo lógica pura. El renderizado se valida jugando
```

## Licencias

| | |
|---|---|
| Código | [MIT](LICENSE) |
| Contenido, arte y textos | [CC BY-SA 4.0](LICENSE-CONTENIDO.md) |
