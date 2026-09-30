# readme-or-die

Juego de supervivencia 2D para navegador. Pixel art, cámara tipo Pokémon, sin combate.
Homero Argento, redactor técnico despedido, audita documentos escritos con su propia voz.

## Comandos

```sh
npm run dev        # http://localhost:5173/readme-or-die/
npm test           # Vitest, solo lógica pura
npm run typecheck  # tsc
npm run build      # dist/
```

Antes de dar algo por terminado: `npm run typecheck && npm test`.

## Stack fijo

TypeScript · Phaser **3** (no 4) · Vite · Tiled → JSON · Vitest.
**No se agrega ninguna dependencia sin una razón escrita en el commit.**

Ante cualquier duda sobre la API de Phaser, no adivinar: consultar `node_modules/phaser/types/phaser.d.ts` con grep. Es la 3.90; muchas respuestas de internet son de la 2 o de la 4.

## Convenciones

- Código, comentarios, nombres de archivo y commits en **español**. `snake_case` en assets, `PascalCase` en escenas y sistemas.
- Resolución interna 640×360. Escalado **solo por enteros**. Tile 32×32. Personaje 32×48 anclado por el centro inferior.
- Cada pantalla u overlay es una **escena de Phaser** propia. Los overlays se lanzan encima y pausan la de abajo.
- La lógica pura vive en `src/sistemas/` y **se testea**. Las escenas no se testean: se validan jugando.
- El ajuste de línea lo hacemos nosotros (`sistemas/Tipografia.envolver`). Phaser nunca corta líneas.
- El corpus es externo: `public/data/` se edita sin recompilar. Mapas de Tiled con capas `piso`, `muros`, `props`, `interactuables`, `spawn`.
- Controles: flechas/WASD caminar · E/Espacio consultar · Tab documento · Q caja · Esc menú. Todo se opera con teclado.

## Reglas de contenido que no se negocian

1. Ningún hecho histórico se muestra ni se nombra. Solo coordenadas: lugar, fecha, hora.
2. Ningún texto juzga a la IA.
3. Sin combate ni violencia del jugador.
4. Sin final feliz alternativo.
5. Homero nunca se queja.

## Agentes

- `revisor-de-diseno`: auditar el código nuevo contra los documentos de diseño. Correrlo al terminar cada paso, antes de commitear.

## Commits

Estilo `tipo: descripción en español` (`feat:`, `fix:`, `docs:`, `test:`). Un commit por propósito.
