# Installation and migration

## Public dependency

Install [Kaleidoscope Cookery (Unofficial) 1.0.6](https://www.curseforge.com/minecraft-bedrock/addons/kaleidoscope-cookery-unofficial) separately. The candidate binds the original downloaded archive:

| Pack | UUID | Version |
| --- | --- | --- |
| Cookery BP | `10f37ae2-9ccf-435f-b34b-0eec8191cd94` | 1.0.6 |
| Cookery RP | `c89dc8df-c3fc-4bc8-8bd0-527abba76681` | 1.0.6 |
| Tavern BP | `f54f37f9-485a-55bf-8f89-6558aca988c5` | 0.6.29 |
| Tavern RP | `c2990d50-2cf7-59f7-886a-0f2d0240d156` | 0.6.29 |

Cookery source archive SHA-256: `c589efb60277bea295ac12ef760d8f2c7e8af3ea62e809b320862bd786033351`. Its code/assets are not bundled here. The existing Guidebook Extension API v1 handles Tavern's chapter through script events.

Import the `.mcaddon`, enable both packs and put Tavern above Cookery. Use Bedrock 26.50+; Script API dependencies are `@minecraft/server` 2.7.0 and `@minecraft/server-ui` 2.0.0. No experimental API is declared by Tavern.

## Existing private server installation

The earlier `Family` build depended on locally rebased Cookery UUIDs `403f7a4a-a837-42c8-b5d3-76d5079ef269` / `8f39983b-00a6-4818-b489-0a73daf3bc87`, version 1.0.7. It also composed HUDs from other installed add-ons. Those private integration patches are not part of this public candidate.

Keep the existing server on its installed build until its pack-stack migration is prepared. Do not enable two copies of Cookery or Tavern simultaneously. Back up a world before changing its dependency stack. Tavern's own UUIDs, item/block identifiers and persistent storage keys are preserved.

The public HUD patches only Tavern controls in `hud_screen.json`. A separate pack that replaces that file can still need an integration patch. The candidate does not replace `minecraft:player` resources; shaker arm clips are started by the existing Script API animation calls.
