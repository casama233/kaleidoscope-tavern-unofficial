# Hanging glassware (酒杯架) slot audit — 2026-09-28

Reported again after 0.6.63: clicking the cup in one corner of the hanging rack takes the
cup in the diagonal corner (top-left click empties bottom-right, and so on).

## What the code does

- `glasswareHolderSlot` reads the **world X/Z quadrant** of a hit, matching Java
  `GlasswareHolderBlock.getSlotFromHit` (`localX > 0.5`, `localZ > 0.5`).
- 0.6.61 made the block's `bone_visibility` slot mapping world-fixed for every `facing`,
  so a glass stored in `glass_slot_k` renders in world quadrant `k`. That part is
  consistent with the port's rotation table (Bedrock `minecraft:transformation` negates
  the Java `y` rotation, which is what every block in this pack assumes) and needs no
  change.
- The pick path was the outlier: `installFurnitureEvents` read the **raw
  `playerInteractWithBlock` event hit**, while every other multi-slot block
  (`bar_cabinet`, `cellar_cabinet`, `tilted_rack`, `circular_rack`) resolves the hit
  through `storageHit` in `stateful-storage-router.js`.

## Evidence

Content-log diagnostics from live play (`[Tavern storage hit]`) show the event hit and the
gaze-ray hit for the *same* click differing by a mirror of the in-face axis, e.g. cellar
cabinet at `facing: 1`: `event {z: 0.31799}` vs `ray {z: 0.68212}` (= `1 - 0.31799`),
repeated across four clicks, and `z: 0.9375` vs `z: 0.0625` on another. The engine can
therefore report the click in the clicked face's own basis instead of the block's world
axes; on a 2×2 rack that reads as the opposite cup. The other blocks are immune because
they discard the event hit; the hanging rack was not, which also explains why the 0.6.61
model-side change did not fix the reported pick behaviour.

## Fix

- `core/hit-basis.js` (new): `hitQuadrant` (single source of truth for the Java quadrant
  order) and `worldHitFromEventBasis`, which converts an event hit back to world axes only
  when exactly one of the 48 signed axis permutations reproduces the gaze ray and clearly
  beats every other candidate. Unchanged hits, hits on the block's symmetry planes,
  drifted aim and out-of-block conversions all return `undefined`, so the engine value
  stands.
- `bedrock/furniture.js`: the rack resolves its hit through the gaze ray for mouse and
  gamepad (the same policy as storage blocks, and the same hit the crosshair targets),
  and keeps the event hit for touch unless it is provably the same hit in another basis.
  Slot choice and the consume decision both use the resolved hit. A bounded diagnostic
  (`[Tavern glassware hit]`) records event vs ray for the first corrections.
- `bedrock/stateful-storage-router.js`: the gaze-hit lookup is exported as
  `nativeBlockHit`; storage behaviour is unchanged.

## Verification

- `node --test tools/glassware/hit-basis.test.mjs` — 10 cases, including "no recovery ever
  moves a hit into another slot", the diagonal-click case from the report, identity,
  symmetry planes and drifted aim.
- `tools/check_release.py` static checks.
- Not verified: a real client's moving crosshair (headless server cannot render), and the
  touch path was exercised only at the script level. If a client still picks the wrong cup
  after this build, the remaining candidate is the `bone_visibility` facing map itself, and
  the `[Tavern glassware hit]` line will show whether the pick side saw a basis mismatch at
  all.
