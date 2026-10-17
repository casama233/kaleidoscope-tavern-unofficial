# 0.6.175 — Tilted-rack first-person usability

- User-approved usability adjustment: add 6 model units to tilted-rack first-person translation Y in both hands. Geometry, texture, source rotations/scales, world placement and every other display context remain unchanged.
- Native Blockbench 5.2.2 comparison tested Y lifts 0, 1, 2, 3, 4, 5, 6, 8 and 10. Six is the smallest tested whole-unit lift retaining the complete silhouette in both hands; five still clips a right-hand support. See [before/after](evidence/t175-rack-lift/before-after.png). This is editor evidence, not Minecraft client acceptance.
- Preserve T174 animated-sprite shell and hidden XP-bottle material repairs. T174 release-history entry is unchanged; T175 has a fresh paired BP/RP identity.
- Public build tools admit exact retained P50 host repairs in private P51, P52 and P53. Private P50 remains pinned to T174; final family synchronization requires separately frozen successor packages and their exact dependency pins. No LIVE deployment.
- Cookery BP and RP must both be installed for shared food/seasoning textures; see [installation guide](../family/COOKERY-RP-INSTALLATION.md).

## Java source and preview limits

Java uses the same three-dimensional rack model for inventory and held contexts, with different display transforms. The item has no separate flat held sprite or rack-specific item renderer. Its original first-person translations are zero, with right/left rotations `[0,45,0]` / `[0,-135,0]` and scale `0.4`. All five source elements, including three zero-thickness planes, are represented in the audited fixture; no inherited transform or rescale flag was omitted. See the [official source trace](evidence/t175-rack-lift/java-item-trace.json) for pinned links and fixture checks.

The unlifted model clips in the recorded editor setup. This does **not** establish that it is invisible or clipped in the actual Java client. The +6 lift remains an intentional usability adaptation, not an original-Java behavior correction; actual client acceptance is pending.
