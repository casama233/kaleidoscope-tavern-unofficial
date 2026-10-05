# 森羅物語：酒館 0.6.105 測試版

A new coherent reconstruction from public Tavern 0.6.95. Lost T98 bytes are not claimed to be recovered. Install with dependency-only World Liquor 0.1.66 for the paired addon.

## Rebuilt repairs

- Finite expiry for shaker ingredient sprites, progress bar and cursor, preserving native and foreign HUD controls
- Authoritative Java ingredient categories and existing addon ingredientTags, retaining 26 recipes, 56 addon inputs, exact-item slots and quality rules
- All sixteen Java ingredient HUD colors with existing protocol indices preserved
- Existing 336-entry shaded Java RGB atlas retained for every legitimate one-, two- and three-color mean. It covers all 250 currently reachable colors from 69 core and 56 addon descriptors. Verified query-overlay tint is used only for external RGB outside this domain, with flat shading explicitly disclosed

Unrelated main fixes, pack UUIDs, stored schemas and the fixed guide navigation are preserved. Earlier 0.6.102/0.6.104 arbitrary-RGB material candidates remain immutable.

## Verification and limits

- Exact source CI passed: Tavern [13 jobs](https://github.com/casama233/kaleidoscope-tavern-unofficial/actions/runs/37389187596), World Liquor [4 jobs](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/actions/runs/37389243802)
- Minecraft 1.26.52.3 native client: colored HUD/progress appeared and expired; three actual wine inputs produced a shaded magenta signature drink; actual ice_tea_q4 + red_queen_q4 + vodka_q4 shaking, serving and pickup produced a Bloody Mary with its hotbar name verified
- Native Java-red atlas liquid retained textured shading. External pure-red fallback rendered red with flat shading
- Exact paired BDS cold load and normal restart passed with exit code zero and no console/content errors. This was a new isolated test world, not existing saved-world migration or full-family admission
- After native testing, all four installed pack trees matched the frozen archive bytes (Tavern BP 802/RP 3,153 files; World Liquor BP 305/RP 511 files), with exact world pack versions
- No simulated players were used. This is bounded test coverage, not full Java parity or production readiness

## Known issues

- In the tested 0.6.105, the first-person shaker and arm were invisible at rest and while using. Relevant source is unchanged from main 0.6.95; a native 0.6.95 comparison was not run, so this is not proven to be a newly introduced regression
- SPACE_NOT_CLEAR and STALE_HAND warnings were observed during held-placement attempts, while placements also succeeded. Their cause is unproven
- External out-of-domain RGB uses flat overlay shading and is not Java pixel-equivalent
- Audio was unavailable because the test environment had no ALSA device
- Not all recipes or first-/third-person states have been tested; no clean-client-log or exact expiry-deadline claim is made
- Exact Java camera-only Slightly Tipsy roll remains unimplemented

Full client acceptance and full Java parity remain pending. This prerelease does not deploy to a live server.

## Exact package

- Accepted source: d0f6f480691a024994d76f60d286aef15439d4bc
- Archive: Kaleidoscope_Tavern_Unofficial_0.6.105_baseline1.mcaddon
- SHA256: 196c04453fd35a85ea0c6b05ec1981694d677ab59a898fc0356449e313369471
- 5,405,399 bytes; 3,955 canonical runtime files

[Detailed bounded validation](https://github.com/casama233/kaleidoscope-tavern-unofficial/blob/main/docs/PUBLIC-TEST-VALIDATION-0.6.105.json)
