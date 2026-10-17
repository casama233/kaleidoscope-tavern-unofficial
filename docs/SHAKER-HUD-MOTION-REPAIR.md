# Shaker progress motion and release expiry

## Change

The progress bar previously shared the ingredient slots' 0.5-second wait plus
0.1-second fade. Slots refresh every 10 ticks, while active progress refreshes
every tick. Sharing their expiry could leave progress visible for 0.6 seconds
after use stopped.

The progress bar and all 112 cursor instances now own a separate 0.05-second
wait and 0.05-second fade. They reach terminal alpha zero 0.10 seconds after the
latest packet's local animation starts, even if the parent factory retains its
control. Slots retain the existing 10-tick refresh coverage. The 0.6-second
parent destruction is still secondary cleanup.

Each cursor now uses a linear native UI offset animation for exactly one tick,
from `1.5 * tick` to `1.5 * min(tick + 1, 111)`. This supplies the missing movement
between received integer tick positions, corresponding to the logical
`(ticksUsingItem + partialTick) * 1.5` trajectory in Java. It does not extrapolate
through missing packets or continue looping after release; the last state is
clamped. Native GUI pixel rounding, packet delivery and frame pacing are client
acceptance items, not proven by the static trajectory check.

Only owned progress controls/animations change. No BP gameplay or HUD transport
code, title channel, Actionbar clear, `player.json`, ingredient sprite, root
insertion or native/custom effect control is changed. In particular, stopping a
shaker still does not send an empty or off packet to the shared Actionbar.

## Source basis

- [Java ShakerOverlay](https://github.com/KaleidoscopeMods/KaleidoscopeTavern/blob/c4ec1880bd44cf3139d3ba744ab30bb379cf1416/src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/client/gui/overlay/ShakerOverlay.java): progress is drawn only while using the shaker, with a rounded partial-tick offset.
- [Mojang toast UI](https://github.com/Mojang/bedrock-samples/blob/46ba6ea985fb5a92d79a9419198f10dda14c199d/resource_pack/ui/toast_screen.json): native `offset` animation with variable `from`/`to` values and linear easing.
- [Mojang animation UI sample](https://github.com/Mojang/bedrock-samples/blob/46ba6ea985fb5a92d79a9419198f10dda14c199d/resource_pack/ui/test_anims_screen.json): an image's `offset` references a named offset animation.
- [Mojang HUD](https://github.com/Mojang/bedrock-samples/blob/46ba6ea985fb5a92d79a9419198f10dda14c199d/resource_pack/ui/hud_screen.json): wait-to-alpha chains and independent sprite alpha; also the native Actionbar factory retained by this implementation.

These Mojang references are pinned to the project's existing Bedrock 1.26.50.4
reference commit. The bounded 0.05-second timings and packet-specific positions
are Tavern's implementation, not an assertion that the native sample implements
our minigame.

## Completed verification

- The focused expiry/motion regression initially failed on the old progress
  lifetime and missing offset route, then passed all five tests after the repair:
  `node --test tools/shaker-hud-expiry.test.mjs tools/shaker-hud-motion.test.mjs`.
- `node tools/check_hud_compat.mjs` passed: 4,913 slot packets, 112 progress states,
  256 idle samples and 53 literal image references; its output explicitly records
  `clientTested: false`.
- A structural before/after comparison confirmed exactly five owned progress
  definitions changed. Slot controls, root modifications and effect integrations
  remained equal to the repair base.

## Client acceptance still required

Check keyboard/mouse, controller and touch where available, normal and enlarged
GUI scales, first/third person, and both immediate/repeated starts. Release
before completion, in the timing window and at automatic timeout; also switch
slot, open inventory, lose focus, change dimension and interrupt use. Confirm the
bar disappears promptly, old cursor instances do not leave trails, and the
placed drink stays visible.

Check packet jitter and low frame rates. A gap of more than two nominal ticks
can intentionally let this short-lived progress graphic disappear until another
packet arrives. Confirm the per-packet offset animation restarts in the actual
HUD factory and does not create brightness flicker. Observe another pack's
Actionbar/title and native/custom effects before, during and after shaking.

No BDS or player client was launched for this module. This commit establishes
the resource route and finite-lifetime contract; it does not mark rendered
client parity as passed. Native animated inventory icons remain a separately
documented platform gap, with the existing frame-zero/native hand behavior
preserved.
