# Java parity worklist — 2026-10-03

This is an open worklist, not a percentage-complete or full-equivalence certificate. Current owned candidates are Tavern 0.6.90, World Liquor 0.1.56 and Grilling 2.8.53. Five additional family projects are pinned upstream dependencies, not silently modified here.

## Newly repaired and regression-tested

- Grilling: ordinary crouch eating; crouch threading; full-hunger plate gate; configured nested hot saturation; threading/insertion success audio. Nine new production-function/callback regressions, full canonical verifier (417 imports), independent review and exact-head CI pass.
- World Liquor: Respawn perimeter/height ordering and endpoint feedback, liquid support, facing/cross-dimension velocity options; Ground Crit climbing/blindness/riding boundaries; Crazy beacon pitch; Elbow feedback volume. Twelve new boundary tests, full paired checks, independent review and exact-head CI pass.
- Combined16-pack BDS1.26.52.3 development probe passes with test-only overlays and no logged errors. See BDS-FAMILY-90-56-53-20261003.json. Guide transport remains sent_unconfirmed; this is not UI delivery acceptance.

## Confirmed remaining source gaps

### Grilling

1. MultiBiteSkewerItem's one-tick release grace and logout settlement are not source-equivalent. Native lifecycle ordering must be verified before granting rewards.
2. Secret cooked ingredient snapshots happen at extraction, not the fourth flip. Compatibility recipe changes can alter result/display after cooking.
3. Failed skewers do not retain original-skewer model routing. Fix requires metadata and held/placed render routes, not an isolated property.
4. Random THREE/THREE_ALT duration versus fixed item use duration needs real client/lifecycle validation.
5. Existing single-tick hot deadlines differ from Java's100-tick bucket. Preserve the shipped behavior until an explicit migration decision; do not silently revert it.
6. Dynamic arbitrary-ingredient inventory images, Java native GUI/keybindings, complete optional mod integrations and client numbness/camera details remain incomplete or engine-specific.

### World Liquor and Tavern

1. Elbow Strike lacks Java's native ATTACK_KNOCKBACK attribute modifier; do not label a guessed impulse equivalent.
2. Respawn uses a conservative air/liquid collision predicate because stable Block API exposes no Java collision shape, and no fallDistance setter is available.
3. Cabinet classification is still bottle-only for additional Java cocktail/display tag routes.
4. Highball content remains absent; latest upstream artwork licensing must be resolved before importing new art.
5. Wall records lose arbitrary ItemStack metadata on retrieval.
6. Freezer full-stack metadata, sided automation and comparator behavior remain incomplete.
7. Tavern custom effects reject non-player targets; Tipsy yaw differs from camera roll; Vision's glowing path lacks a native equivalent.
8. Treasure Guide's nearby-drop inference is not an authoritative Java loot event.

Older claims that freezer/external-cellar redstone or corrected freezer recipe durations are absent are stale: source paths now exist and need behavior acceptance, not duplicate reimplementation.

## Actual client path now available

The cloud Linux computer now runs the real Android Bedrock1.26.52.3 binary through the maintained third-party Linux launcher. A new local creative world was entered and saved normally. This establishes client execution, not addon acceptance. The original audio device was unavailable; a real PCM capture backend is being tested separately.

Owned packs are being linked from canonical runtime into development_behavior_packs and development_resource_packs in the isolated client. Normal imported duplicates are archived outside the game. Third-party dependencies remain exact copies. Frozen release exports retain their own receipts; editing a development pack does not certify or replace release acceptance.

Official [development workflow](https://learn.microsoft.com/en-us/minecraft/creator/documents/addondevelopmentworkflow?view=minecraft-bedrock-stable) documents script reload and development-directory symlinks. Textures/models/sounds require world exit/reentry according to that workflow; actual reload behavior must still be checked on this client. Client visuals, interaction, sound, save/restart and multiplayer evidence must be recorded separately.

No merge, release or live deployment is claimed here.
