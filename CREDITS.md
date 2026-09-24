# Credits and licensing

## Original Java project

**Kaleidoscope Official Production Team / YSBB** — [Kaleidoscope Tavern](https://github.com/KaleidoscopeMods/KaleidoscopeTavern).

Reference checkout: `c4ec1880bd44cf3139d3ba744ab30bb379cf1416`. The port adapts gameplay rules, recipes, models, textures and animations for Bedrock APIs. Preserved source locks and asset inventories are under `art/` and `data/`.

- Original code and this port's code: BSD-3-Clause, see `LICENSE-CODE`.
- Original Tavern artwork and derivatives: CC BY-NC-SA 4.0, see `LICENSE-ASSETS` and [license text](https://creativecommons.org/licenses/by-nc-sa/4.0/).

## Bedrock companion

**Loyallay** — [Kaleidoscope Cookery (Unofficial)](https://www.curseforge.com/minecraft-bedrock/addons/kaleidoscope-cookery-unofficial), installed separately. Tavern uses its published Guidebook Extension API v1. This repository does not imply sponsorship or endorsement by that author and does not ship Cookery's BP/RP.

**casama233 and port contributors** — Bedrock adaptation, integration and release maintenance.

## Text rendering and other notices

The public beta board renderer uses **Tavern Board Font**, a format conversion of GNU Unifont 15.0.06, under the SIL Open Font License 1.1 (alternatively GPL with the font embedding exception). The font retains its own terms, separate from Tavern art. See `runtime/RP/font/NOTICE-Unifont.txt` and `art/fonts/README.md`. The original font source is included for reproducibility; `tools/build_board_font.py` builds the atlases without Minecraft bitmap-provider glyphs. Existing board geometry and placement transforms are preserved. The earlier font path also retains `NOTICE-Noto-Sans-CJK.txt`.

Minecraft client JARs/classes and server executables are not included in the release package.

This unofficial port is not endorsed by the original development team, the Cookery Bedrock author, Mojang or Microsoft.
