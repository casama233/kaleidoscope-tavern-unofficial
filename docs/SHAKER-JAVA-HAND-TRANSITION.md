# Java hand visibility and idle/use transition

This source candidate supersedes the state-only retreat in commit 89167ad.
Native review found idle fully visible but the cup abruptly smaller on use.
No user images or native recordings are included here.

## First-person arm evidence

Pinned Tavern Forge source is c4ec1880bd44cf3139d3ba744ab30bb379cf1416
(Minecraft 1.20.1, Forge 47.3.0); NeoForge source is
a1afba34981a00e89d57130d3dc8f1e64f1820a2 (Minecraft 1.21.1, NeoForge
21.1.152). All 255/256 Java files were checked against the complete official
repository tree's Git blob hashes. Neither source defines RenderHandEvent,
RenderSpecificHandEvent, a skin-arm draw call, a custom item renderer, or an
active mixin. Both mixin client/mixins arrays are empty. The source player-render
event handles grass stealth, not a shaker hand renderer.

The [Forge hook contract](https://github.com/MinecraftForge/MinecraftForge/blob/0ec923d7307eb15bef70d6916329642b733a21ed/src/main/java/net/minecraftforge/client/extensions/common/IClientItemExtensions.java)
and [renderer patch](https://github.com/MinecraftForge/MinecraftForge/blob/0ec923d7307eb15bef70d6916329642b733a21ed/patches/minecraft/net/minecraft/client/renderer/ItemInHandRenderer.java.patch)
show that applyForgeHandTransform returning true skips other transforms and
proceeds to item rendering. It does not cancel a hand-render event or toggle
skin-arm visibility. These are pinned official 1.20.1 branch references, not a
claim that the exact Forge 47.3.0 userdev archive was fetched.
The [NeoForge contract](https://github.com/neoforged/NeoForge/blob/1.21.1/src/main/java/net/neoforged/neoforge/client/extensions/common/IClientItemExtensions.java)
and [patch](https://github.com/neoforged/NeoForge/blob/1.21.1/patches/net/minecraft/client/renderer/ItemInHandRenderer.java.patch)
have the same transform-only hook behavior.

Official Mojang [1.20.1 metadata](https://piston-meta.mojang.com/v1/packages/c0a00f47b3dae01d83e21be9a646c9232379d9ab/1.20.1.json)
provides client SHA1 0c3ec587af28e5a785c0b4a7b8a30f9a8f78f838 and client
mapping SHA1 6c48521eed01fe2e8ecdadbd5ae348415f3c47da. Both downloads were
hash verified and inspected with javap, without starting Minecraft.
ItemInHandRenderer maps to fjt. In renderArmWithItem, bytecode 51 tests
ItemStack.isEmpty and branch 54 enters the non-empty path at 88. The sole
renderPlayerArm invocation is at 82, inside the empty-stack/main-hand/visible
path. Maps have separate one/two-hand paths. The ordinary item path starts at
631 and calls renderItem at 1489, with zero renderPlayerArm calls. Thus ordinary
non-empty shaker rendering supplies the cup without a separate skin arm.
Other first-person rendering mods are outside this source review.

The [Forge ShakerAnimation](https://github.com/KaleidoscopeMods/KaleidoscopeTavern/blob/c4ec1880bd44cf3139d3ba744ab30bb379cf1416/src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/client/animation/ShakerAnimation.java)
and [NeoForge ShakerAnimation](https://github.com/KaleidoscopeMods/KaleidoscopeTavern/blob/a1afba34981a00e89d57130d3dc8f1e64f1820a2/src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/client/animation/ShakerAnimation.java)
return false at zero remaining use ticks. Using applies only the Y wave and
Rx15 hand transform before returning true. getArmPose is the third-person
humanoid pose; it is not a first-person draw call. No skin arm is added here.

## Remove the unsupported transition retreat

Official 1.20.1 applyItemArmTransform translates by
`[sign*0.56, -0.52 - equip*0.6, -0.72]` blocks. With equip/swing complete,
idle and shaker use share base `[sign*8.96,-8.32,-11.52]` model pixels.
Using adds `[0,-2.4*wave,0]` and Rx15; there is no state-only base-Z retreat.
Java itself can switch rotation and current wave/equip pose immediately, so
this is not a claim that every projected pixel is continuous at use entry.

Both states now share the native-reviewed idle adapter `[-3,6.5,-6.5]`.
The earlier use adapter `[-1.5,6.5,-14.5]` added `[1.5,0,-8]`, unsupported by
Java; its relative-pose error was approximately 8.04647 model pixels at every
corner. The old Blockbench idle approximation is replaced by the exact vanilla
fully equipped translation. Java mesh, half scale, UVs, wave, fixed rotations
and existing third-person X/Z channels remain unchanged. The subsequent source
audit corrects only the unsupported third-person Y reset to additive zero;
Java's SHAKING hook does not write Y, so incoming body/arm yaw is preserved.

The new independent regression reads serialized local matrices. With authored
display D, every corner must satisfy
`U(w) = I * inverse(D) * T(0,-2.4*w,0) * Rx15 * D`.
An unknown shared camera/socket/skin left factor cancels. It rejects an added
8-pixel retreat and checks projected bounds in both FOV conventions without
claiming the hypothetical projection reproduces native pixels.

## Validation limits

The armor/head-centered reference-frustum fixture is uncalibrated: its predicted
absolute idle size disagrees with native review. The original .92 margin and
1.0 variation thresholds and all their corner/plane failures are retained in
`check_shaker_projection.py` diagnostics. Source tests check the mathematical
equivalence of plane inequalities and full projected bounds, not containment
under an unproved engine context. The native projection gate fails closed with
exit 2 until the Bedrock camera/FOV is calibrated; `check_release.py` invokes
this strict gate. No mesh scale or threshold is lowered for a viewport pass.

See [display-context audit](SHAKER-DISPLAY-CONTEXT.md) for the separately reset
Java hand FOV, source Classic/Slim pivots and the remaining engine unknowns.

Native full-wave visibility, actual FOV/eye/near plane, skin/socket, walking,
pitch, apparent size and equip/use transitions still require integrating-owner
acceptance. This unfrozen source revision is not a merge, release or deployment.
