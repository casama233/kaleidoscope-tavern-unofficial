# Storage hit basis audit — 2026-09-29

Report: cellar cabinets (tavern's own and the World Liquor addon's oak/birch/spruce/
dark_oak/cherry variants — all routed through the shared storage router) placed and
took bottles in the **left-right mirror** on east/west-facing cabinets only; north/south
facings were correct.

## Root cause

The engine reports script raycast hits (`getBlockFromViewDirection`) in the clicked
face's own basis. Numerical pick∘pose verification of all four multi-slot storage blocks
(bar cabinet, cellar cabinet, tilted rack, circular rack — each self-consistent with its
`visualPose` formulas, which `tools/check_surface_repairs.mjs` asserts):

- With a **world-true** ray hit, every block's slot selection inverts its display on
  **every** facing.
- With the ray's `z` **mirrored** on east/west faces, all four break on exactly the
  east/west facings — reproducing the report (placement into the mirrored shelf).

North/south faces must be world-true: the north/south-facing cabinets have always been
correct with the same ray-based selection. This matches the bottom-face measurement from
`GLASSWARE-HIT-AUDIT-20260928.md` (ray x-mirrored on Down) — the engine's ray basis is
per-face. The logged event/ray pairs on side faces (`event = z-mirror(ray)`) then imply
the native **event** basis on east/west faces is world-true, so the touch path needs no
correction.

The World Liquor addon needs no change of its own: its cabinets register data-only and
the tavern foundation owns their lifecycles (`foundation.js`: "Tavern owns cabinet and
timed-effect lifecycles"), so the shared-router fix covers both addons.

## Fix

`HIT_FACE_BASIS` gains `East`/`West` ray entries (`[1, -1]` — z-mirror), and the shared
`storageHit` converts the gaze hit through `worldFromHit` before any slot math. No slot
function or pose formula changes; `check_surface_repairs.mjs`'s pick∘pose assertions are
untouched and passing. The correction is logged (bounded) as `[Tavern storage basis]`
with face, raw and corrected coordinates.

## Verification

- `node --test tools/glassware/hit-basis.test.mjs` — 12/12 (east/west round-trip cases).
- Foundation suite 199/199, tap 19/19, `check_surface_repairs` pick∘pose pass,
  `check_release.py` full static pass, `check_launch` ledger pass.
- Not verified: a real client on east/west cabinets this round; the `[Tavern storage
  basis]` log rows carry face/raw/corrected for any further report.
