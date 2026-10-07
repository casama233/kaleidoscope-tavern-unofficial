# Tavern 0.6.124: bounded shaker grip placement candidate

Base: 50e2ef8d246078fb292950674a8b3ccf3881bf10, Tavern 0.6.122.
Development-only native review candidate. No full Java parity, client acceptance,
release publication, family deployment, or saved-world migration is claimed.

## Native baseline and proposed adjustment

The root-controlled isolated Tavern-only Creative flat-world baseline used the
exact 0.6.122 canonical archive, SHA256
db2f9113e10befa5c396d59a64c2dc7ace8f610cde8396e08af4b9ba345bb35f.
The 1180x812 main-hand idle screenshot shows the upright shaker around
x684–828, y376–651, with the crosshair around (589,416). The cup is floating
center-right, with its top just above the crosshair. The main arm is not visible
in that baseline; this candidate does not add arm hiding or change arm binding.

The camera-frame adapter changes from [-3,+6.5,-6.5] to [-1,+4.5,-3] model pixels,
shared by idle and active use. Relative to the observed baseline this moves the
model outward two pixels, downward two pixels, and closer by 3.5 pixels. It
retains positive vertical compensation for Bedrock's observed hand-camera
displacement. It does not reuse the plate calibration or assume zero offsets
would remain visible.

Only grip position channels in runtime_shaker.animation.json change. Java .5
scale, idle/use rotations, the use Rx15 and 2.4-pixel Y wave, the complete mesh,
textures, third-person/player-arm channels, attachable selectors, item/effect
behavior and shipped allow_off_hand=false remain unchanged. Necessary release
identity updates are separate from the pose change.

## Bounded native comparison

1. Cold-install the exact committed candidate, retaining the baseline archive
2. Compare fully settled main-hand idle at the same camera/FOV and world position
3. Use a normally filled shaker while aiming into air; compare active view and
   return to idle, including whether apparent size changes across the state
4. Check third-person hand placement remains unchanged
5. Accept only the observed bounded result. Further pose changes require a new
   identity and another native comparison

Natural lower/right edge cropping is allowed. An all-corners-visible projection
gate is not a substitute for a hand-like placement and apparent-size judgment.
No offhand diagnostic override or hidden-hand workaround is included.

## Obtaining and using the shaker

Craft an iron ingot directly above an empty bucket at a crafting table, or use
the Creative equipment inventory. In the isolated test world the equivalent
normal item command is /give @s kaleidoscope_tavern:shaker 1.

Empty shaker use is canceled. For active use, place it on a block, pour three
plum_wine_q4 inputs by normal use-on interaction, then pick it up with an empty
main hand. Aim into air with no block hit within six meters and hold use.
Releasing early stops shaking without requiring drinking or serving.

## Source checks

The two focused shaker frame/state suites pass (4 and 6 source tests), along
with the shaker structure check and exact translation-only preservation check.
These checks are matrix/dispatch/mesh checks, not a renderer simulation. The
canonical version/hash freeze, clean-commit pack build and export comparison
must complete before handing the immutable candidate to the root.

