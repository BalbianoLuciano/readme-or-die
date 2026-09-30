# Credits and attribution

Every third-party asset is recorded here **in the same commit that adds it to the repo**. Never later.

## Fonts

| Asset | Author | Licence | Source | Use |
|---|---|---|---|---|
| Ark Pixel Font 12px monospaced (latin), v2026.09.25 | TakWolf | [SIL Open Font License 1.1](public/assets/fonts/source/OFL.txt) | https://github.com/TakWolf/ark-pixel-font | Document body. Atlas `public/assets/fonts/ark12.*` generated with `tools/generate_font.py` |
| Ark Pixel Font 10px monospaced (latin), v2026.09.25 | TakWolf | [SIL Open Font License 1.1](public/assets/fonts/source/OFL.txt) | https://github.com/TakWolf/ark-pixel-font | Interface, text boxes and labels. Atlas `public/assets/fonts/ark10.*` |

## The project's own art (generated, CC BY-SA 4.0)

Generated with [Retro Diffusion](https://retrodiffusion.ai/) (Game Asset style, the project's palette image) from the prompt briefs, then downsized, palette-snapped and validated by `tools/ingest_asset.py`. No hand edits.

| Asset | Use |
|---|---|
| `sprites/prop_ficus_32x64.png` | The ficus |
| `sprites/prop_card_holder_32x32.png` | The card holder on the desk |
| `sprites/prop_turnstile_32x48.png` | The exit turnstile |
| `sprites/prop_rail_32x32.png` | Rails (generated, currently unused: the turnstile alone blocks the corridor) |
| `ui/ui_paper_calendar_48x48.png`, `ui_paper_card_48x48.png`, `ui_paper_confirmation_48x48.png`, `ui_paper_clipping_48x48.png`, `ui_paper_document_48x48.png` | The papers in the box |
| `ui/ui_portrait_homero_64x64.png` | The portrait in the reader |
| `sprites/prop_drawer_open_32x32.png`, `prop_wall_calendar_32x32.png`, `prop_cork_board_32x32.png` | The three note-bearing objects, each showing its paper |
| `sprites/prop_plant_palm_32x64.png`, `prop_plant_snake_32x48.png`, `prop_plant_desk_32x32.png` | Office plants |

## Tiles and sprites

All borrowed art follows the Liberated Pixel Cup geometry (32×32 tiles, 64×64 character frames) and is rebuilt from the sources with `tools/extract_lpc_assets.py`. It is placeholder art until the game's own art exists (phase C of the roadmap).

| Asset | Author | Licence | Source | Use |
|---|---|---|---|---|
| [LPC] Floors, tiles 1178 (grey carpet) and 1602 (cream floor) | bluecarrot16 and the authors listed in [CREDITS-floors.txt](public/assets/tilesets/source/CREDITS-floors.txt) | CC-BY-SA 4.0 | https://opengameart.org/content/lpc-floors | `office_lpc.png` tiles 1 and 3 |
| [LPC] Walls, tiles 2861, 2925, 2989 (beige panel: trim, face, baseboard) | bluecarrot16 and the authors listed in [CREDITS-walls.txt](public/assets/tilesets/source/CREDITS-walls.txt) | CC-BY-SA 3.0 | https://opengameart.org/content/lpc-walls | `office_lpc.png` tiles 2, 4 and 5 |
| [LPC] Wooden Furniture (dark wood): chairs, wall clock | bluecarrot16, Baŝto, Lanea Zimmerman (Sharm), William Thompson, Tuomo Untinen (Reemax), Janna/Lilius/Jannax. See [CREDITS-wooden-furniture.txt](public/assets/sprites/source/CREDITS-wooden-furniture.txt) | CC-BY-SA 4.0 / CC-BY-SA 3.0 / GPL 3.0 | https://opengameart.org/content/lpc-wooden-furniture | `office_props.png` atlas |
| LPC Shelves Rework: bookshelf, drawer shelf (filing cabinet) | AntumDeluge, from work by Lanea Zimmerman (Sharm) and Tuomo Untinen (Reemax) | CC-BY-SA 3.0 / GPL 3.0 | https://opengameart.org/content/lpc-shelves-rework | `office_props.png` atlas |
| [LPC Revised] The Office: ornate desk, copy machine, water cooler, laptop, office portraits (frames), coffee maker, bins, card table, rotary phone, mailboxes, coffee cup | Eliza Wyatt. Elements of the ornate desk and the office portraits use assets by Lanea Zimmerman (Sharm). See [CREDITS-the-office.txt](public/assets/sprites/source/CREDITS-the-office.txt) | OGA-BY 3.0 | https://opengameart.org/content/lpc-revised-the-office · https://github.com/ElizaWy/LPC | `office_props.png` atlas |

### Character (`char_homero_walk.png`)

Homero Argento's sprites are the project's own art: generated with [PixelLab](https://www.pixellab.ai/) (v3 character, "Sad Walk" template) from the project's character brief, assembled by `tools/build_character_sheet.py` without hand edits. Licensed with the rest of the content under CC BY-SA 4.0.

Until 2026-09-30 the character was a placeholder composed from layers of the [Universal LPC Spritesheet Character Generator](https://github.com/sanderfrenken/Universal-LPC-Spritesheet-Character-Generator); those layers are no longer in the repo. Their credits are kept for the history of the project:

| Layer | Authors | Licence | Source |
|---|---|---|---|
| shadow | drjamgo@hotmail.com | CC0 | https://opengameart.org/content/shadow-for-lpc-sprite |
| body/bodies/male | bluecarrot16, Benjamin K. Smith (BenCreating), Evert, Eliza Wyatt (ElizaWy), TheraHedwig, MuffinElZangano, Durrani, Johannes Sjölund (wulax), Stephen Challener (Redshrike) | CC-BY-SA 3.0, GPL 3.0 | https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles · https://opengameart.org/content/lpc-character-bases |
| head/heads/human/male | bluecarrot16, Benjamin K. Smith (BenCreating), Stephen Challener (Redshrike) | OGA-BY 3.0, CC-BY-SA 3.0, GPL 3.0 | https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles · https://opengameart.org/content/lpc-character-bases |
| feet/shoes/male | bluecarrot16, Johannes Sjölund (wulax) | OGA-BY 3.0, CC-BY-SA 3.0, GPL 3.0 | https://opengameart.org/content/lpc-medieval-fantasy-character-sprites · http://opengameart.org/content/lpc-clothing-updates |
| legs/formal/male | bluecarrot16, Thane Brimhall (pennomi), laetissima, Stephen Challener (Redshrike) | CC-BY-SA 3.0, GPL 3.0 | https://opengameart.org/content/lpc-gentleman · https://opengameart.org/content/lpc-2-characters · https://opengameart.org/content/lpc-medieval-fantasy-character-sprites |
| torso/clothes/longsleeve/formal/male | bluecarrot16, Thane Brimhall (pennomi), laetissima, Johannes Sjölund (wulax) | CC-BY-SA 3.0, GPL 3.0 | https://opengameart.org/content/lpc-gentleman · https://opengameart.org/content/lpc-2-characters · https://opengameart.org/content/lpc-medieval-fantasy-character-sprites |
| neck/tie/necktie/male | JaidynReiman, bluecarrot16, Thane Brimhall (pennomi), laetissima, Makrohn | CC-BY-SA 3.0, GPL 3.0 | https://opengameart.org/content/lpc-gentleman · https://opengameart.org/content/lpc-2-characters |
| beards/beard/5oclock_shadow | JaidynReiman, Thane Brimhall (pennomi) | CC-BY-SA 3.0, GPL 3.0 | https://opengameart.org/content/lpc-base-character-expressions |
| hair/balding/adult | ElizaWy | OGA-BY 3.0 | https://opengameart.org/content/lpc-hair |

Still placeholder blocks (no borrowed asset fits): the card holder, the ficus, the turnstile and its rails.

## Audio

None yet.
