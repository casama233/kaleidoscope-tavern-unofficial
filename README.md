# Kaleidoscope Tavern (Unofficial)

An unofficial Minecraft Bedrock port of **Kaleidoscope Tavern**, and a companion add-on for [Kaleidoscope Cookery (Unofficial)](https://www.curseforge.com/minecraft-bedrock/addons/kaleidoscope-cookery-unofficial) by Loyallay.

[繁體中文](README.zh-TW.md) · [Installation](docs/INSTALLATION.md) · [Release notes](docs/RELEASE-NOTES-0.6.40.md) · [Credits](CREDITS.md)

**Current public beta: 0.6.40-beta.1.** PBR, signature cocktail icons, and Slightly Tipsy visual fixes are integrated into the complete core BP/RP; no separate visual overlay pack is required. Original Java gameplay and assets guide the port. This project is not an official release from the original authors, Cookery's Bedrock author, Mojang or Microsoft.

This release retains 0.6.39 placed-cup recovery, finite incense emitters, complete crafting unlock data and product-based World Liquor guide support. It removes random tipsy vibration, lowers the third-person shaker grip and restores Java FIXED-model scaling for barrel ingredients. Use World Liquor 0.1.4-preview.1 alongside this version.

## Features

- Grow grapes, press fruit, and brew and mature drinks in barrels.
- Fill, place and serve bottles; store them in racks and cabinets.
- Mix cocktails with a shaker, including ingredient-dependent signature colors.
- Furnish a tavern with counters, seats, lamps, signs, paintings and incense.
- Read recipes, usage instructions and drink effects in Cookery's existing Guidebook. Product information is consolidated into one entry.

## Requirements

- Minecraft Bedrock **26.50 or newer** (manifest `1.26.50`); load validation targets BDS **1.26.51.1**.
- **Kaleidoscope Cookery (Unofficial) 1.0.6**, installed separately from the linked project.
- Both Tavern's 0.6.40 behavior and resource packs, above Cookery in their respective pack stacks. Back up and leave the world before upgrading; do not enable duplicate older Tavern packs.
- Slightly Tipsy now uses a small continuous yaw adjustment, not camera shake. It changes aim slightly and is not an exact Java camera-only roll. Players with command permission can disable it using `/function kt_tipsy_motion_off`, and re-enable it using `/function kt_tipsy_motion_on`.

The public beta uses Cookery's original pack UUIDs. The older private server bundle used different UUIDs and Cookery 1.0.7; see the migration notes before replacing that bundle. No Cookery pack, world backup, credentials, server executable, or other server add-on is included.

## Build from this repository

Requires Python 3.12+, Node.js 22+, and Pillow 11.3.0 for image validation.

```sh
python3 -m pip install Pillow==11.3.0
python3 tools/check_release.py
python3 tools/build_release.py
```

The build packages the committed `runtime/BP` and `runtime/RP` directly and writes an `.mcaddon`, `SHA256SUMS`, and release notes to `dist/`. It does not require a private server folder, an old Git revision, or a chain of patches.

The checks parse resources, validate references and scripts, and inspect guide data. They do not simulate player interactions. Historical generators, tests and reports are archived under `history/pre-release-0.6.29/`; they are not the current build entry point.

Publication runs only for an explicit update to `.github/release-request.json` on `main`, or a manual workflow run. It validates the requested version and archive digest, stages all assets, downloads and verifies every uploaded asset, then publishes the release. Existing releases are never overwritten.

## Public beta status

This version is checked statically. BDS 1.26.51.1 load evidence belongs to 0.6.37, not this revision; neither BDS nor real-client validation is claimed for 0.6.40. English, Simplified Chinese and Traditional Chinese retain names and category coverage. Board editing follows the game language; guide names follow Cookery's selection. Operation text uses a complete Traditional Chinese + English fallback for Cookery 1.0.6's locale-field limitation. Legacy Japanese/Russian translations are partial and are not advertised as complete support.

[Download 0.6.40-beta.1](https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/download/v0.6.40-beta.1/Kaleidoscope_Tavern_Unofficial_0.6.40_beta1.mcaddon) · [GitHub Release and validation evidence](https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/tag/v0.6.40-beta.1).

Android rendering, Realms, and all device/pack combinations remain public-test targets. Slightly Tipsy preserves the signed Java waveform as a bounded yaw adapter; it does not reproduce Java camera-only roll. Real-client smoothness and network behavior still require validation. The existing gameplay adapters retain their documented cross-edition limitations. See [release readiness](docs/RELEASE-READINESS.md).

## Licensing

Original Tavern code: BSD-3-Clause (`LICENSE-CODE`). Original Tavern art: CC BY-NC-SA 4.0 (`LICENSE-ASSETS`). Font and other third-party notices retain their separate terms; see `CREDITS.md`. Do not treat the code license as permission to use the art commercially.
