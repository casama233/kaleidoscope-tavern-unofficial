# Tavern0.6.167

The shaker cursor now follows the maintained Java overlay's integer rounding
inside each tick. Each received packet advances only the source-backed one-pixel
step; missing updates hold their final position. The packet protocol, graphics
lifetime, source sprites, gameplay clock and native/companion HUD routes remain.

Barrel and pressing-tub water/lava entities previously sampled only the first
row of a multi-frame strip. Their UV-enabled materials now select original
Minecraft1.21.1 frames from the shared level clock: water32 frames, lava20 frames
in its38-step ping-pong sequence, at2 ticks per step. The original PNG alpha is
applied once. Source image/metadata identities and unchanged geometry are checked.

This source repair pairs with Grilling2.8.143 and World Liquor0.1.145. Actual
device latency, shader appearance, input/network phase and complete Java parity
remain pending human use; source checks and saved-world loading do not establish
rendered-client acceptance. No simulated players or new screen probes are used.
