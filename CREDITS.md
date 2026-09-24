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

The board renderer includes converted glyph atlases. The CJK/Unihex input and its license are documented in `runtime/RP/font/NOTICE-Unifont.txt` (GNU Unifont, GPL font exception / SIL OFL). The earlier font path also retains `NOTICE-Noto-Sans-CJK.txt`; these terms are separate from Tavern's art license.

The current atlases additionally include Minecraft Java 1.20.1 bitmap-provider glyphs to preserve its layout. Those original glyphs remain third-party material; they are not relicensed as Tavern art. The public distribution review for that subset is recorded in `docs/RELEASE-READINESS.md`. Minecraft client JARs/classes and server executables are not included.

This unofficial port is not endorsed by the original development team, the Cookery Bedrock author, Mojang or Microsoft.
