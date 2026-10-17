# Tavern 0.6.174: held sprite shells and XP material culling

Source predecessor: e213fcef7241bd485c371053607778c464a79b07 (T173).

## Repairs
- Correct raw Bedrock X coordinates and up-face UV orientation for depth charge, mystery cocktail, nether special and ice grape. Preserve T160 east/west normal correction; a blanket rollback is incorrect.
- Keep source pixels, all 24 frames, timing, interpolation, front/back planes, thickness, display poses, native routes and gameplay unchanged.
- Use alpha_test_single_sided for both material slots on the hidden xp_bottle item_visual only. Its three original inward shells previously exposed opaque yellow backs. Preserve geometry, UVs, world/permutation materials and ordinary vanilla XP icon routing.

## Independent regression evidence
The new checker derives oriented face vertices from Blockbench parseCube and CubeFace.UVToLocal, independent of generator span helpers. It samples every emitted unit side cell at 25 positions and all 24 source frames. Corrected output has zero failures across 1,918 alpha boundaries, zero mismapped emitted cells and zero unsupported opaque side cells. Recreating the T160 defect restores exactly 1,709 boundary failures. Additional tests reject inward vertical normals, an extra misplaced face, and a missing later-frame boundary on an asymmetric synthetic texture. Six new and seven existing item tests pass. The separately pinned Mojang diamond-axe static texture also passes all 58 boundaries and 80 emitted side cells, without importing its pixels into this repository; see [static reference](evidence/t174-held-shells/vanilla-static-reference.json).

Official reference: https://github.com/JannisX11/blockbench/blob/7c92e27d237e365110030d73e92c5d1605f0d311/js/formats/bedrock/bedrock.js and js/outliner/types/cube.js. Material semantics: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/blockreference/examples/blockcomponents/minecraftblock_material_instances

## Deliberately preserved and remaining acceptance
Tilted rack's tiny first-person appearance matches the pinned original Java model in native editor calibration, with identical captures and world matrices. No arbitrary global offset is applied. An intentional item-specific first-person framing adaptation is a separate design choice requiring client comparison. Purple light loops also exist in the original and are not repaired by deleting source geometry.

Source/editor evidence does not establish Minecraft client appearance. Native Blockbench 5.2.2 re-import completed 30/30 fixtures: all 24 animation frames, four untouched raw-codec controls and XP double/front material controls. Side45 and first-person contact sheets were inspected; side defects close and XP glass/green detail returns. Existing first-person poses remain low-framed, unchanged from their Java-derived source. See [native evidence](evidence/t174-held-shells/native-review.json) and [XP comparison](evidence/t174-held-shells/xp-material-pair.png). Full-family BDS/saved-world gates and human first/third-person, use, graphics/FOV acceptance remain separate. client=false; production_ready=false; pending_client_acceptance. No LIVE deployment is performed.

## Coupled private-host tooling

Public consumers also admit exactly reviewed P50 millstone guard and held-geometry canonicalization declarations, with all source/output/declaration hashes checked before writes. Private implementation and author model bodies remain outside this repository. Exact P48 components and the unchanged P49 basin retain their own provenance under P50. Synthetic failure-path tests and replay on the pinned author bytes pass; these are not full-family admission or deployment.

The repaired Cookery RP retains its author UUID and 1.6.1 version. Before human
client acceptance, require a clean resource-pack installation or targeted
removal of the older Cookery RP followed by installing/downloading the exact
reviewed candidate. Server file replacement is not evidence of client cache
refresh. See [installation prerequisite](../family/COOKERY-RP-INSTALLATION.md).
