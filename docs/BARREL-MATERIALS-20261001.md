# Barrel material rendering repair — 0.6.77

## Reproduced defect

The public 0.6.76 adapter accepts ordinary non-fluid ingredients, including Cookery rice panicles, but only creates ingredient visuals for 21 hard-coded item IDs. The user's live video shows an inserted rice panicle disappearing visually while wheat later renders. This is a rendering coverage defect; this observation alone does not prove item loss.

## Repair

- One reviewed catalogue now generates the script index, all four entity property ranges, four client texture maps and the shared render-controller array: 61 explicit IDs.
- Covers all ingredient alternatives in the 42 current Tavern/World Liquor port barrel recipes, all ten pinned Cookery crops, four Tavern grapes, and the native `minecraft:reeds` sugar-cane alias.
- Reuses the actual vanilla/Cookery/Tavern texture paths. No placeholder wheat, substituted item, copied third-party art, input whitelist or altered brewing outcome.
- Keeps the four-slot layout, Java floor(count / 2) + 1 count, maximum nine visible pieces per slot, bobbing and cube/card sizes unchanged.
- Generator freshness is required by release validation; paired recipe coverage is required in CI. All four slots and ingredient counts 1–16 exercise real adapter functions against strict property-range doubles.

## Sources

- [Java barrel renderer](https://github.com/KaleidoscopeMods/KaleidoscopeTavern): renderer blob e38ab5510e9cb59b0eb60399513b54ff7c04b24b, renderStatic with FIXED transforms for each nonempty stack; no item-ID filter.
- [Mojang Bedrock item atlas](https://github.com/Mojang/bedrock-samples/blob/main/resource_pack/textures/item_texture.json) and [terrain atlas](https://github.com/Mojang/bedrock-samples/blob/main/resource_pack/textures/terrain_texture.json). Verified complete texture trees: blocks 398e3f9adbf42f115f7ccd686062efc3b9fb692d; items 0a26f2ee1a445bef54a9c1eaf74fbc6075eec493. Lilac uses the existing TGA path; other new vanilla entries resolve to PNGs.
- Cookery 1.0.8 file 8983314, archive SHA256 9e5b617cc4c7a08ecd429fb9e42ec10e8d40a1ed5fc1f6f6687c3aff8a45a5d5. Crop icon paths and per-texture hashes are recorded in data/barrel-materials.json.
- Actual Mojang Java item models: the missing flowers and crimson roots use generated item cards, not world cross-plant geometry. Bamboo inherits generated FIXED transforms through handheld.

## Explicit limits

This does not implement Java's arbitrary registered-item renderer. Unregistered third-party or other unsupported materials can still be accepted without an ingredient visual. Card silhouette extrusion, animated ice-grape texture and native client appearance have not been certified as pixel-identical to Java.

The paired coverage check covers the port's current recipes, not the complete Java tag universe. Java 1.21.1 #minecraft:flowers additionally includes flowering_azalea_leaves, flowering_azalea, mangrove_propagule, cherry_leaves, pink_petals, chorus_flower and spore_blossom beyond the port's 19 listed flowers. Correcting that preexisting recipe expansion and the additional model types is separate work.

The HUD flicker draft is not included. Static script tests, BDS loading, client rendering and production saved-world migration are separate acceptance stages. This change is not evidence that live has been updated or every Java feature is complete.
