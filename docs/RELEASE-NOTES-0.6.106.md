# 森羅物語：酒館 0.6.106 測試版

A focused first-person held-shaker visibility hotfix. Install with dependency-only World Liquor 0.1.67 for the matching addon pair. Tavern 0.6.105 / World Liquor 0.1.66 stay immutable.

## Repair

Restore only the final historical native-socket first-person idle/use poses. Preserve the existing third-person and player-arm channels, attachable selectors, geometry, UVs, textures, Java half-scale, 2.4-pixel shake waveform and gameplay. All four 0.6.105 rebuilt repairs remain: finite HUD expiry, authoritative ingredient categories, sixteen Java ingredient colors and the shaded 336-entry RGB atlas with a disclosed external-RGB fallback.

## Verification and limits

- Exact accepted Tavern source: all [13 CI jobs passed](https://github.com/casama233/kaleidoscope-tavern-unofficial/actions/runs/37392379579)
- Actual Minecraft 1.26.52.3 x86_64 native client: empty and filled first-person resting shaker visible; actual 3900 ms use/release retained a visible cup and progress in the immediate post-release snapshot; cup remained visible after progress expiry; third-person front-view held model visible
- After testing, all 802 BP and 3,153 RP files matched the frozen Tavern archive and exact world pack references
- Separate first-person skin arms are absent for an ordinary nonempty shaker in the checked Minecraft 1.20.1/Forge/original Tavern source. The observed absence is consistent with that Java source. This is source verification, not a Java rendered-client test
- Exact 0.6.106 / 0.1.67 native pair cold-load passed: filled first-person shaker remained visible, World Liquor ice_tea_q4 was given with Iced Black Tea name/icon/held bottle, and returning to the shaker slot retained visibility. Normal save/quit completed
- All four installed pack trees matched the frozen archives (Tavern BP/RP 802/3,153 files; World Liquor BP/RP 305/511 files), with exact world pack versions
- No new BDS test was run for 0.6.106 / 0.1.67. The prior 0.6.105 / 0.1.66 cold-load/restart evidence remains separate

## Known limits

- STALE_HAND was observed while placement succeeded; its cause is unproven. Earlier SPACE_NOT_CLEAR warnings are not claimed resolved
- External out-of-atlas RGB retains disclosed flat overlay shading
- No audio acceptance, full video-frame/all-waveform coverage, all-FOV/skin coverage or clean-client-log claim
- Full Java animation/pixel parity and exact camera-only Slightly Tipsy roll remain pending
- Existing saved-world migration and full-family admission are unverified

This is a bounded public test prerelease, not production readiness. No live deployment is performed.

## Exact package

- Accepted source: 898aee05f57d051627b8a00314250d35343e5309
- Archive: Kaleidoscope_Tavern_Unofficial_0.6.106_baseline1.mcaddon
- SHA256: 2129d6d9c3758aac728cd371db8a391528232590d17116e1a08c5546713a6a71
- 5,405,393 bytes; 3,955 canonical runtime files

[Detailed bounded validation](https://github.com/casama233/kaleidoscope-tavern-unofficial/blob/main/docs/PUBLIC-TEST-VALIDATION-0.6.106.json)
