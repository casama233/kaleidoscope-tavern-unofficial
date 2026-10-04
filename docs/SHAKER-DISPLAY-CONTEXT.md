# Shaker source geometry and display context

This unfrozen PR167 revision preserves b413's first-person idle/use adapter,
five-box mesh, UVs, Java half scale and third-person item placement. Its only
runtime edit replaces third-person arm Y `-this` with additive `0`. Java's
SHAKING hook writes X/Z only. With incoming Y=37 degrees, the previous port
produced Y=0; the corrected channel retains Y=37. The first-person arm remains
unchanged by this animation. Native rendering of this revision is pending.

Official Java `LivingEntityRenderer` applies scale(-1,-1,+1), and `ModelPart`
uses ZYX rotation. Conjugating that Java arm transform by this scale and using
the existing port reflection convention preserves X/Z signs. Java
247.5-45*wave is the same rotation as -112.5-45*wave, with Z=-9. Independent
all-corner tests cover incoming nonzero Y and these source-basis transforms;
this does not establish the complete native Bedrock renderer basis.

## Why the two frustum checks could not establish native visibility

The previous checks assumed a camera at the player head pivot [0,24,0], a
shared body/view pitch transform and a hand projection equal to world FOV60.
Neither pinned Bedrock geometry nor attachable binding establishes those
renderer parameters. Requiring both horizontal and vertical FOV60 containment
also conflated two alternative projection hypotheses.

The official [geometry schema](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/schemasreference/schemas/minecraftschema_geometry_1.21.0?view=minecraft-bedrock-stable)
defines pivots in model space and binding through the parent's skeletal
hierarchy. The [attachable tutorial](https://learn.microsoft.com/en-us/minecraft/creator/documents/attachables?view=minecraft-bedrock-stable)
defines view-dependent animation selectors, while the [animation overview](https://learn.microsoft.com/en-us/minecraft/creator/documents/animations/animationsoverview?view=minecraft-bedrock-stable)
defines additive XYZ channels. These contracts do not specify a held camera.

The official Mojang [1.20.1 client metadata](https://piston-meta.mojang.com/v1/packages/c0a00f47b3dae01d83e21be9a646c9232379d9ab/1.20.1.json)
supplies the hash-verified client and mappings. Java `GameRenderer.renderItemInHand`
calls `getFov(camera,partialTick,false)` then resets the projection. `getFov`
starts with 70 degrees; only the true branch reads Options.fov and the dynamic
FOV multiplier. This proves ordinary Java hand projection differs from world
FOV60. Death/fluid/panorama paths have additional behavior. Java's 70 is not
evidence for Bedrock's held FOV and is not substituted into the runtime.

`tools/check_shaker_projection.py` reports all 40 corners across both source
skins, three viewports (including 16:9), three assumed pitches, two projection
conventions and five FOV samples: 360 sensitivity rows. These sample values
are not a verified Bedrock slider range. Wave endpoint bounds are analytic
for the affine position and fixed rotation/scale, with strictly positive
depth. The prior FOV60 .92 margin and 1.0 variation failures retain their
complete cube/corner/wave/edge/excess records. Their thresholds are unchanged.

The math helper also checks all seven homogeneous clip-volume conditions
(positive eye W, four XY edges, near and far), with explicit [-W,W] or [0,W]
depth conventions. A future measured model/view/projection matrix can be
checked directly without guessing a FOV convention. RGB landmark fitting
alone cannot prove native clip Z or the near plane.

Source tests independently prove each of the four plane inequalities agrees
with the full projected extrema and continuous variation support bounds the
source motion. They no longer assert that a hypothetical camera is native.
`--require-native-context` returns 2 with status `unknown_native_display_context`;
`check_release.py` uses this gate, so green source tests cannot manufacture a
release or native-visibility pass. The current implementation deliberately
offers no switch or unreviewed JSON flag to declare calibration complete.

## Skin and socket evidence

Both profiles come from pinned Mojang sample commit
`46ba6ea985fb5a92d79a9419198f10dda14c199d`. Original Git blob hashes and SHA256
are stored in `art/interfaces/shaker-display-context.json`.

| Source profile | rightArm pivot | rightItem pivot | derived local item offset |
| --- | --- | --- | --- |
| [Classic](https://github.com/Mojang/bedrock-samples/blob/46ba6ea985fb5a92d79a9419198f10dda14c199d/resource_pack/models/entity/humanoid.custom.geo.json) | [-5,22,0] | [-6,15,1] | [1,-7,0] |
| [Slim](https://github.com/Mojang/bedrock-samples/blob/46ba6ea985fb5a92d79a9419198f10dda14c199d/resource_pack/models/mobs.json) | [-5,21.5,0] | [-6,14.5,1] | [1,-7,0] |

The official first-person empty-hand animation dynamically cancels item Y/Z
pivots. Source Slim lowers the arm origin by .5 Y, not .5 X. The former local
X +/- .5 budget remains a labelled sensitivity assumption. Engine-provided
short_arm_offset compensation, actual skin substitution, player scripts.scale
.9375 inheritance, camera eye/near plane and native pitch composition remain
unknown. No speculative skin offset or model resizing is applied.

Java `PlayerModel.translateToHand` has a genuine additional Slim hand X offset
(right +.5, left -.5) around the model-part transform. The classic port helper
is not a proof of Java/Bedrock Slim third-person parity. Its precise runtime
adapter needs the actual skin context and native comparison.

## Supported hand and remaining acceptance

| Path | Source/runtime check | Native acceptance |
| --- | --- | --- |
| Main right hand, FP idle/use | full-mesh Java relative pose; common adapter; original .5 scale | Owner reported limited b413 Alex FOV60, 1180x663 visibility; new revision not replayed |
| Classic/Slim source FP | exact pivots, socket cancellation, 40-corner relative pose | full skin matrix, walk/equip/attack and FOV/pitch sweep pending |
| TP held/use | authored placement and X/Z retained; incoming Y preserved | Classic/Slim side views and Java Slim hand offset pending |
| Offhand | intentionally disabled on all three current item variants | Java supports both interaction hands; port parity remains unimplemented |
| Left main hand | helper can calculate mirrors but runtime emits right-hand poses | official Bedrock setting support not verified; no native acceptance claim |

Attachable `q.item_slot_to_bone_name(c.item_slot)` matches the official shield
binding; it selects a bone and does not automatically mirror local poses.
Enabling offhand alone would require changes to held-item reads/writes, sessions,
slot queries/units, left-hand poses and player-arm animation. Those are separate
mechanics beyond this first-person clipping repair.

Reproduce source checks with `python -m unittest discover -s tools -p
test_shaker_*.py` and `python tools/check_shaker_first_person.py`. Save diagnostics
with `python tools/check_shaker_projection.py --report <output.json>`. Requiring
native calibration adds `--require-native-context` and must currently fail.

This draft has no version freeze, merge, deployment or client-control action.
PR167 was reported `mergeable=false` by the integrating owner; main .94/HUD
conflicts and the final family release identity remain with that owner.
