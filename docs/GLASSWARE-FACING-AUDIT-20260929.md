# Hanging glassware (酒杯架) facing audit — 2026-09-29 (third round)

After the measured hit-basis fix, placement and take are correct on north/south-facing
holders but cross diagonally on east/west-facing ones. This pins the display side.

## Measured facts

- Facings 0/2 (north/south): correct. Facings 1/3 (east/west): the placed glass appears
  in the **diagonal** world quadrant (reported: "交叉關係的錯誤放置位置").
- The 2026-09-28 audit claimed the display was world-fixed by reasoning from
  `tiltedRackVisualPose`; that inference was invalid — the tilted/circular racks' own
  slot-numbering direction hides the rotation convention. The east/west report is direct
  evidence: the client rotates 90°/270° facings **opposite** to the rotation the
  glassware `bone_visibility` map assumes. Composing them: the display map P is identity
  on facings 0/2 and the diagonal swap on facings 1/3, which reproduces all three
  reported symptoms (diagonal with the raw event pick, left-right with the raycast pick
  on north/south racks, cross on east/west racks).

## Fix

`glasswareHolderStateSlot(facing, quadrant)` in `core/hit-basis.js` addresses glass
slots through the display map (identity on even facings, diagonal on odd facings);
`useGlasswareHolder` and the consume check in `installFurnitureEvents` both go through
it. Server script only — no client asset change, no version bump, works for cached
clients immediately. `take` and `insert` share the addressing, so both follow the same
map.

## Follow-up note

The clean long-term shape is world-fixed slots (Java semantics): swap the facing-1 and
facing-3 `bone_visibility` expressions in `blocks/glassware_holder.json` and remove this
compensation **in the same release**, or the two corrections cancel back into the old
bug. Until a version bump ships that pair together, the compensation stays.

## Verification

- `node --test tools/glassware/hit-basis.test.mjs` (11 cases, including "the addressed
  slot renders back under the aim on every facing"), `tools/check_release.py`.
- In-engine probe on the isolated dedicated server (module load + composed addressing).
- Not verified: a real client on east/west facings this round; the previous rounds'
  log machinery (`[Tavern glassware hit]`) remains in place for any further report.
