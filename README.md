## Current maintained baseline: 0.6.95

Automatic effect and barrel text is now opt-in; normal play preserves the Java shaker graphics and one-shot rejection messages. See [immersive feedback](docs/IMMERSIVE-FEEDBACK-20261002.md).

Tavern **0.6.95** is an **unfrozen development integration candidate**. Canonical runtime and dependencies: [baseline.json](baseline.json). Cookery **1.0.8** integration is optional. Grilling/World Liquor matching identities and fresh family evidence are pending; the previous T.93/G.61/Lmain.56 combination is not a verified usable family, and World Liquor 0.1.59 targets Tavern 0.6.94. Native shaker projection is uncalibrated, so release validation and packaging remain blocked. See the [source matrix and acceptance boundaries](docs/BASELINE-INTEGRATION-20261004.md).

# Kaleidoscope Tavern (Unofficial)

An unofficial Minecraft Bedrock port of **Kaleidoscope Tavern**, with optional integration for [Kaleidoscope Cookery (Unofficial)](https://www.curseforge.com/minecraft-bedrock/addons/kaleidoscope-cookery-unofficial) by Loyallay.

[繁體中文](README.zh-TW.md) · [Installation](docs/INSTALLATION.md) · [Release notes](docs/RELEASE-NOTES-0.6.53.md) · [Credits](CREDITS.md)

**Historical 0.6.53-beta.1 release snapshot**, paired with World Liquor **0.1.16-preview.1**. This patch restores native item rendering for the plain sandwich board and pairs with the corrected Java freezer placement in World Liquor. Bar-counter direction matches Java and remains unchanged. Actual client rendering and placement acceptance remains pending.

That historical snapshot passed static checks and a BDS 1.26.51.1 load with Cookery 1.0.6; it does not certify this development candidate. Slightly Tipsy now uses bounded player-local native camera shake. Exact Java camera-only roll remains **not implemented or verified**. See the [tipsy source repair](docs/TIPSY-CLIENT-REPAIR-20261003.md).

## Features

- Grow grapes, press fruit, and brew and mature drinks in barrels.
- Fill, place and serve bottles; store them in racks and cabinets.
- Mix cocktails with a shaker, including ingredient-dependent signature colors.
- Furnish a tavern with counters, seats, lamps, signs, paintings and incense.
- Craft a Tavern Guide from a book and a Tavern grape, or find it in the brewing creative group. It contains recipes, usage instructions and drink effects independently; Cookery integration uses the same content when installed.

## Requirements for the maintained source

- Minecraft Bedrock **26.50 or newer** (manifest `1.26.50`); load-validation target BDS **1.26.51.1**.
- Cookery is optional. Integration is tested against **Kaleidoscope Cookery (Unofficial) 1.0.8**.
- Both Tavern's 0.6.95 behavior and resource packs. If Cookery is installed, keep Tavern above it in each pack stack. Back up and leave the world before upgrading; do not enable duplicate older Tavern packs.
- Slightly Tipsy follows the Java three-wave rhythm through bounded native rotational camera shake. It does not change player yaw or camera mode; exact Java camera-only roll and this candidate's native client behaviour remain unverified. Use `/function kt_tipsy_motion_off` to opt out.

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

Static checks and an isolated paired BDS 1.26.51.1 load are recorded for this version. Real-client visual acceptance is pending; no player interactions were simulated. English, Simplified Chinese and Traditional Chinese remain supported.

[Download 0.6.53-beta.1](https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/download/v0.6.53-beta.1/Kaleidoscope_Tavern_Unofficial_0.6.53_beta1.mcaddon) · [GitHub Release and evidence](https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/tag/v0.6.53-beta.1).

Android rendering, Realms, HUD factory updates/expiry and actual third-party pack combinations remain in-game test targets. Actionbar is still a shared channel; this is not a cross-pack UI scheduler. See [release readiness](docs/RELEASE-READINESS.md).

## Licensing

Original code: BSD-3-Clause (`LICENSE-CODE`). Original art: CC BY-NC-SA 4.0 (`LICENSE-ASSETS`). Font and other third-party notices retain separate terms; see `CREDITS.md`. The code license does not grant commercial art rights.

## Retained storage rendering repair (0.6.40)

Pinned Java default-block storage matrices, a storage-only Molotov bottom pivot and one pitch owner are retained, together with append-only watermelon-juice storage indices. See [source comparison and validation boundaries](docs/STORAGE-REPAIR-0.6.40.md).

## bridge. canonical authoring

Open the repository-root `config.json`, which points to the current locked BP and RP. See [the bridge. workflow](docs/BRIDGE-WORKFLOW.md) for editor settings, portable `.brproject` export, schema limitations and exact runtime comparison.
