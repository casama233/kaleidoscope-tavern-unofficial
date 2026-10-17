# Tavern 0.6.81 — source-aligned shaker pouring

Remove the bespoke pouring-arm gesture. Pinned Java ShakerItem.pourResult changes the cup, clears payload, emits 20 effect particles and plays bottle.fill without that extra animation. The Bedrock cup transaction, particles, sound, shake timing and hold/first-person safeguards remain unchanged. The removed animation is explicitly recorded in the exact-hash historical review ledger; old preservation checks are retained.

The shaker checker now pins all three held variants to exact view selectors, animation aliases, the slot-bound grip pivot and existing animation bones. It continues to check 1,008 algebraic arm-pose cases. These checks do not prove client rendering.

Official Blockbench 5.2.1 desktop opened the actual runtime_shaker_held geometry and its 64x64 texture. Imported hold_first and hold_third poses were inspected in the built-in first-/third-person item reference, with centered first-person camera. No obvious missing model faces or detached reference-hand placement were observed. Minecraft blending/touch/FOV/skin and live-world acceptance remain untested.

Family source lock advances to Tavern 0.6.81 / Grilling 2.8.28 / World Liquor 0.1.45, with unchanged pinned upstream archives. No live deployment.
