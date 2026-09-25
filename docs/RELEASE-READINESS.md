# Public beta readiness — 0.6.41-beta.1

This version builds on main's 0.6.40 runtime at `4076925dc04f1ea32882c03393d0328754513f11`. It ships the complete Tavern BP/RP, retaining cup recovery, finite incense emitters, guide data, all 160 crafting unlock definitions, PBR and cocktail icons. A public GitHub prerelease is not a claim of client acceptance.

## Evidence for this version

Static validation covers 1,935 JSON resources, 930 geometries, 141 guide entries in 11 categories, JavaScript syntax/imports and resource references. English, Simplified Chinese and Traditional Chinese each retain 1,685 language keys, with no duplicate/missing keys or placeholder mismatches in the recorded checks.

Visual validation covers 433 surface texture sets, 258 intentional exclusions and 24 external references; it checks dyed icon alpha roles and MER dimensions/emission bounds. Motion math checks use 3,601 waveform samples, bounded incremental yaw, current-aim preservation and wraparound. This is math/structure validation, not a mock player or game-engine simulation.

The complete item, block, recipe, particle and texture groups are byte-preserved against the stated 0.6.40 baseline. Source-derived barrel cubes are 4 pixels after renderer scale 0.5 and FIXED scale 0.5; cards remain 8 pixels. The original barrel bob and distribution are unchanged. First-person/shake animations and hand geometry are preserved; only the third-person grip's local Y is lower by 1.25 pixels.

Reports accompanying the release: `VALIDATION-0.6.41-VISUAL.json`, `VISUAL-MATERIAL-AUDIT-0.6.41.json`, `REPAIR-STATIC-0.6.41.json` `MOTION-STATIC-0.6.41.json` and `STORAGE-VALIDATION-0.6.41.json`. Publication checks the committed runtime without rewriting it, verifies all archive files, then downloads and compares every uploaded asset before making the release public.

## Not yet verified / explicit differences

The user's real-device video rejected the old camerashake implementation. It has been removed, not merely reduced in intensity. The replacement keeps Java's signed waveform but uses small incremental yaw on the player, not camera-only roll. It therefore changes aim slightly, and must not be advertised as exact Java parity. Per-player opt-out is available with `kt_no_tipsy_motion` or the supplied functions; the Allow Camera Shake setting is no longer required.

No Minecraft client or BDS was run for this revision. Networked 20-Hz rotation, mobile smoothness, third-person grip fit for different skins, input locks and multiplayer coexistence still require in-game feedback. Historical BDS records do not validate this revision. No simulated-player interaction tests were run.

## Distribution and provenance

Both manifests retain the existing Tavern UUIDs, Script API 2.7.0 and public Cookery 1.0.6 dependency. Item/block identifiers, recipe contents and saved-state formats are unchanged. Private FAMILY server UUID/Cookery 1.0.7 rewiring remains separate; see `INSTALLATION.md`.

Code, art and third-party notices retain their separate licenses; see `CREDITS.md`. This release does not include the Cookery pack, Java client JAR, world backups, credentials or server executables. Temporary source-capture tooling is not part of the normal build or release tree.

## Concurrent storage integration

All 0.6.40 storage/Molotov/watermelon runtime fixes and evidence are retained. The combined release also runs the pinned Java-source storage comparison (21 files, 10,400 vertex cases). The approved shaker-only Y offset is recorded with old/new hashes in `data/storage-render-source.json`; all other prior preservation checks remain active.
