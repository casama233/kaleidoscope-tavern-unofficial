# Kaleidoscope Tavern (Unofficial)

An unofficial Minecraft Bedrock port of **Kaleidoscope Tavern**, and a companion add-on for [Kaleidoscope Cookery (Unofficial)](https://www.curseforge.com/minecraft-bedrock/addons/kaleidoscope-cookery-unofficial) by Loyallay.

[繁體中文](README.zh-TW.md) · [Installation](docs/INSTALLATION.md) · [Release notes](docs/RELEASE-NOTES-0.6.42.md) · [Credits](CREDITS.md)

**Current public beta: 0.6.42-beta.1.** PBR, signature cocktail icons, and Slightly Tipsy fixes are integrated into the complete core BP/RP; no separate visual overlay is required. Original Java gameplay and assets guide the port. This project is not an official release from the original authors, Cookery's Bedrock author, Mojang or Microsoft.

0.6.42 removes Tavern's title/subtitle transport and idle `ktmix:off` loop. The graphical HUD now uses a finite independent actionbar factory and literal texture paths. This addresses our own interference, not a verified fix for every A Magic Way missing image or the unidentified blank-block registry message.

Placed-cup recovery, finite incense emitters, the third-person shaker candidate and product-based World Liquor guide support are retained. Use the existing World Liquor 0.1.5-preview.1 companion. All 0.6.40 storage repairs, 0.6.41 motion/held/barrel scale repairs and 160 recipe unlocks are preserved.

## Features

- Grow grapes, press fruit, and brew and mature drinks in barrels.
- Fill, place and serve bottles; store them in racks and cabinets.
- Mix cocktails with a shaker, including ingredient-dependent signature colors.
- Furnish a tavern with counters, seats, lamps, signs, paintings and incense.
- Read recipes, usage instructions and drink effects in Cookery's existing Guidebook.

## Requirements

- Minecraft Bedrock **26.50 or newer** (manifest `1.26.50`); load-validation target BDS **1.26.51.1**.
- **Kaleidoscope Cookery (Unofficial) 1.0.6**, installed separately.
- Both Tavern's 0.6.42 behavior and resource packs, above Cookery in their respective pack stacks. Back up and leave the world before upgrading; do not enable duplicate older Tavern packs.
- Slightly Tipsy uses the Java three-wave rhythm as small yaw increments, not camera shake. It slightly affects aim and is not camera-only roll. Use `/function kt_tipsy_motion_off` to opt out.

The public beta uses Cookery's original UUIDs. The older private server bundle used different UUIDs and Cookery 1.0.7; see the migration notes before replacing it. No Cookery pack, world backup, credentials, server executable or other server add-on is included.

## Build from this repository

Requires Python 3.12+, Node.js 22+, and Pillow 11.3.0 for image validation.

```sh
python3 -m pip install Pillow==11.3.0
python3 tools/check_release.py
python3 tools/build_release.py
```

The build packages committed `runtime/BP` and `runtime/RP` directly into an `.mcaddon`, `SHA256SUMS` and release notes in `dist/`. No private server folder, old revision or patch chain is required.

Checks parse resources, validate references/scripts and inspect guide data. They do not simulate player interactions. Historical generators and reports are archived under `history/pre-release-0.6.29/` and are not the current build entry point.

Publication requires an explicit `.github/release-request.json` update on `main` or a manual workflow run. It validates the version and archive digest, stages all assets, then downloads and verifies every asset before publication. Existing releases are not overwritten.

## Public beta status

This version is checked statically; no BDS or real-client validation is claimed for 0.6.42. Historical BDS 1.26.51.1 evidence belongs to 0.6.37. English, Simplified Chinese and Traditional Chinese retain names/category coverage. Board editing follows the game language; guide names follow Cookery's selection. Operation text uses Traditional Chinese + English fallback for Cookery 1.0.6's locale-field limitation. Legacy Japanese/Russian translations are partial.

[Download 0.6.42-beta.1](https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/download/v0.6.42-beta.1/Kaleidoscope_Tavern_Unofficial_0.6.42_beta1.mcaddon) · [GitHub Release and evidence](https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/tag/v0.6.42-beta.1).

Android rendering, Realms, HUD factory updates/expiry and actual third-party pack combinations remain in-game test targets. Actionbar is still a shared channel; this is not a cross-pack UI scheduler. See [release readiness](docs/RELEASE-READINESS.md).

## Licensing

Original code: BSD-3-Clause (`LICENSE-CODE`). Original art: CC BY-NC-SA 4.0 (`LICENSE-ASSETS`). Font and other third-party notices retain separate terms; see `CREDITS.md`. The code license does not grant commercial art rights.

## Retained storage rendering repair (0.6.40)

Pinned Java default-block storage matrices, a storage-only Molotov bottom pivot and one pitch owner are retained, together with append-only watermelon-juice storage indices. See [source comparison and validation boundaries](docs/STORAGE-REPAIR-0.6.40.md).
