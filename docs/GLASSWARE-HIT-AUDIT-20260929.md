# Hanging glassware (酒杯架) hit basis audit — 2026-09-29

Second round. After the 2026-09-28 fix (pick from the script raycast instead of the raw
event) the reported symptom changed from a diagonal swap to a left-right swap. Both
reports plus eight logged clicks pin the engine's actual behaviour.

## Measured facts

- All eight `[Tavern glassware hit]` log rows (mouse, facings 0 and 2) are hits on the
  selection-box **bottom face** (y = 0.6875). Every pair satisfies
  `event = (ray.x, 1 - ray.z)` within 0.04–0.06 — a z-mirror plus the player's aim lag
  between the native click and the script's re-projection of the server-side rotation.
- Report 1 (raw-event pick): the vanishing cup was always the **diagonal** opposite.
  Report 2 (raycast pick): always the **left-right** mirror. With the display proven
  world-fixed (below), this pins the bottom-face bases: the native **event** hit is the
  true point rotated 180° in the horizontal plane; the script **raycast** hit is the true
  point x-mirrored. Their measured z-mirror relation matches: 180° ∘ x-mirror = z-mirror.
- Side faces: no mirror measured (the storage blocks have picked slots from raycast side
  hits in production since 0.6.50).
- The display side is correct: `bone_visibility` composes with the block rotation to a
  world-fixed slot map under the same rotation convention as the production-proven
  `tiltedRackVisualPose`/`localXZ` formulas (`tools/check_glassware_slots.py`, 64 states
  × 4 facings). No client asset change, no version bump.

## Fix

`core/hit-basis.js` replaces the runtime 48-transform guessing with `HIT_FACE_BASIS`, the
measured per-face/per-source map (`Down`: event `[-1,-1]`, ray `[-1,1]`), and
`worldFromHit` undoes it. `resolveGlasswareHit` picks the source per input mode (script
raycast for mouse/gamepad, event for touch) and converts the hit back to world axes;
faces without a measurement keep the raw engine value. Corrections are logged (bounded)
as `[Tavern glassware hit]` with raw, corrected and slot.

Because the map is fixed, a player sweeping the crosshair quickly can still land on a
neighbouring cup (the native click is client-true but the raycast re-projection lags up
to a tick); steady aim is exact.

## Verification

- `node --test tools/glassware/hit-basis.test.mjs` (7 cases), `tools/check_release.py`.
- In-engine probe on the isolated dedicated server covers mouse (raycast + x-mirror
  undo), touch (event + 180° undo) and unmeasured faces (raw).
- Not verified: a real client. If a cup is still mis-slotted, the new log rows now carry
  `face`, `source`, `raw` and `corrected`, which identify the next basis directly.
