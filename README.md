# Kaleidoscope Tavern (Unofficial)

An unofficial Minecraft Bedrock port of **Kaleidoscope Tavern**, and a companion add-on for [Kaleidoscope Cookery (Unofficial)](https://www.curseforge.com/minecraft-bedrock/addons/kaleidoscope-cookery-unofficial) by Loyallay.

[繁體中文](README.zh-TW.md) · [Installation](docs/INSTALLATION.md) · [Release notes](docs/RELEASE-NOTES-0.6.36.md) · [Credits](CREDITS.md)

**Current public beta: 0.6.36-beta.1.** Original Java gameplay and assets guide the port. This project is not an official release from the original authors, Cookery's Bedrock author, Mojang or Microsoft.

## Features

- Grow grapes, press fruit, and brew and mature drinks in barrels.
- Fill, place and serve bottles; store them in racks and cabinets.
- Mix cocktails with a shaker, including ingredient-dependent signature colors.
- Furnish a tavern with counters, seats, lamps, signs, paintings and incense.
- Read recipes, usage instructions and drink effects in Cookery's existing Guidebook. Product information is consolidated into one entry.

## Requirements

- Minecraft Bedrock **26.50 or newer** (manifest `1.26.50`); load validation targets BDS **1.26.51.1**.
- **Kaleidoscope Cookery (Unofficial) 1.0.6**, installed separately from the linked project.
- Both Tavern's behavior and resource packs, above Cookery in their respective pack stacks.

The public beta uses Cookery's original pack UUIDs. The older private server bundle used different UUIDs and Cookery 1.0.7; see the migration notes before replacing that bundle. No Cookery pack, world backup, credentials, server executable, or other server add-on is included.

## Build from this repository

Python 3.12+ and Node.js 22+ are sufficient; no Python or npm packages are required.

```sh
python3 tools/check_release.py
python3 tools/build_release.py
```

The build packages the committed `runtime/BP` and `runtime/RP` directly and writes an `.mcaddon`, `SHA256SUMS`, and release notes to `dist/`. It does not require a private server folder, an old Git revision, or a chain of patches.

The checks parse resources, validate references and scripts, and inspect guide data. They do not simulate player interactions. Historical generators, tests and reports are archived under `history/pre-release-0.6.29/`; they are not the current build entry point.

## Public beta status

The public beta has static resource/script/language checks and a successful BDS 1.26.51.1 load with Cookery 1.0.6. English, Simplified Chinese and Traditional Chinese have complete language-key coverage and guide pages. Board editing follows the game language; guide language follows Cookery's language selection. Legacy Japanese/Russian translations are partial and are not advertised as complete support.

[Download the public beta](https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/tag/v0.6.36-beta.1). Android rendering, Realms, and all device/pack combinations remain public-test targets. Known differences include the unavailable custom effects Slightly Tipsy, Grass Stealth and Long Reach. See [release readiness](docs/RELEASE-READINESS.md).

## Licensing

Original Tavern code: BSD-3-Clause (`LICENSE-CODE`). Original Tavern art: CC BY-NC-SA 4.0 (`LICENSE-ASSETS`). Font and other third-party notices retain their separate terms; see `CREDITS.md`. Do not treat the code license as permission to use the art commercially.
