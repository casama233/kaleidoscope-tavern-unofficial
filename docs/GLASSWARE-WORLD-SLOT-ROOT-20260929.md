# Hanging glassware world-slot root cause — 2026-09-29

## Canonical invariant

Java `GlasswareHolderBlock.getSlotFromHit` chooses slot 0–3 directly from **world**
local X/Z quadrants. Its block-entity renderer places slot `i` at that corresponding
X/Z position and does not rotate those cup positions with block FACING.

The Bedrock port now follows the same rule:

1. the resolved aim is a world-local point;
2. quadrant `q` always reads/writes `glass_slot_q`;
3. the RP maps that state to whichever model bone lands in world quadrant `q`
   after the client applies the holder facing transform.

State IDs are no longer used as a rendering workaround.

## Why the regression kept returning

The third 2026-09-29 live audit directly established that east/west holders rendered
stored cups diagonally. To avoid forcing a resource-pack refresh, that repair kept the
RP mismatch and added the inverse BP remap for facings 1/3. Two coordinate mistakes then
cancelled each other only while every caller preserved exactly the same assumptions.

Later aim-routing work correctly standardized interaction input to world coordinates.
That made the old render compensation visible again as an X-shaped relationship between
the cup the player targets and the cup/state that appears or disappears.

The test baseline also allowed this to survive:

- the old pure test defined the display oracle using the same diagonal formula under test;
- the old asset checker used a rotation-sign convention invalidated by the direct
  east/west client observation;
- PR #105's 210 production storage-route cases covered cabinets/racks but did not include
  the hanging glassware holder, which has its own furniture route.

## Repair

- `glasswareHolderStateSlot` now validates inputs but returns the world quadrant unchanged
  for all four facings;
- `glassware_holder.json` swaps the facing-1/facing-3 visibility relationships so each
  `glass_slot_N` renders in world quadrant N;
- `check_glassware_slots.py` reads the actual block JSON and geometry using the measured
  client transform convention and does not import the BP slot mapper;
- the actual furniture event route is exercised for Touch, KeyboardAndMouse and Gamepad,
  all four facings, all four quadrants, insert and take.

## Deployment / acceptance

This repair changes both BP and RP. Testing only a server script update is invalid.
Use a backup/world copy, replace the paired build, restart the server, and make sure the
phone/tablet refreshes the resource pack before evaluating it.

The automated checks are deterministic script/asset checks, not the Minecraft renderer.
Final acceptance remains a real touch client clicking all four X quadrants at every facing
and confirming that the visible cup in that same world quadrant is the one inserted/removed.
