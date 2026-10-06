# Private native shake / aim sampler

Stable @minecraft/server2.10.0, minimum client1.26.50. This standalone BP never
copies/modifies canonical runtime, selects a camera preset, plays a spline,
rotates/teleports a player, changes settings, or starts an effect at load time.
It adds one native rotational shake: intensity0.05, duration3 seconds. Intensity
is not degrees. This is an approximate native effect, not Java's signed three-wave
roll; actual rendering, hand/crosshair and aiming remain root-owned native tests.

## Manual safety preflight

Use only a copied single-player Creative world, stationary and healthy, no native
or custom effects, no other camera/shake owners, and ordinary first-person view.
The user explicitly requires native first-person arms, held items and crosshair
to remain visible, and actual aim to remain unchanged. Any loss is a failure; no
free-camera fallback, HUD hiding or input changes are allowed.
Verify custom effects manually in the host guide (BP UUID-scoped state is not
readable here). Verify the player's existing Allow Camera Shake setting is ON;
if OFF, respect it and do not run or enable it. The script cannot read/verify that
setting and never changes it. This command acknowledges those manual conditions.

    /scriptevent kt_shake_probe:start clean_no_other_shake_setting_on

Close chat and leave mouse/movement untouched. After20 server ticks of baseline,
one addShake is submitted; capture motion and the hand/crosshair for3 seconds.
The sampler records every server tick for a further20-tick after window, at most
105 snapshots. These phase boundaries are server-tick estimates; they do not
read actual client effect timing or rendered frames. No repeat/pulse loop exists.

    /scriptevent kt_shake_probe:status
    /scriptevent kt_shake_probe:abort

Status emits one bounded self-chat metrics line. Start, API-return and end also
report to self-chat. Content-log records include raw location/head position, getRotation,
getViewDirection and getBlockFromViewDirection (20-block maximum) for before,
during and after. Metrics compare every phase to the original baseline: maximum
absolute yaw/pitch deltas, maximum view-vector distance, and target-block/face
changes. Nonzero baseline drift invalidates a clean stationary interpretation.
A null baseline ray target has weak target evidence; aim at a nearby known wall.
Do not infer unchanged client targeting or rendered movement solely from server
readback; review the observed target outline/hand/crosshair too. An imperceptible
0.05 effect is inconclusive, not proof of lack of camera shake.

## Cleanup ownership

Camera.stopShaking() has no per-event handle. It may clear other owners' shaking,
so this script NEVER calls it or the global command stop. Every owned effect is
allowed to expire naturally after its own3-second duration. Abort, movement over
0.25 block, dimension/health/Creative/native-effect/multiplayer change, respawn,
leave or milk stops sampling. If submitted already, the3s event can finish after
sampling abort; there is no immediate owned-only cancellation API. No new shake
is submitted after a failed guard. Requesting start while active is rejected. After an early abort, another start
is blocked until the prior event's3-second wall-clock expiry and80-server-tick
cooldown both pass, preventing this sampler from stacking its own events.

A clean test lasts about5 seconds at20TPS, then becomes idle. Results survive only
in this script lifetime (latest per player, at most8); no persistent data written.
Human recovery can use /camerashake stop @s only in this manually verified clean
single-owner test, with the understanding that it stops player shaking generally.

## Build and evidence

Commit all four diagnostic source files first, then run:

    python3 tools/diagnostics/test_shake_probe.py
    python3 tools/diagnostics/build_shake_probe.py --out-dir /absolute/new/output

The builder requires exact committed bytes, uses new commit/content-derived BP
and module UUIDs, rejects repository-local output, and refuses replacing an
existing archive. It contains no RP or player/UI override and no canonical BP
UUID dependency. Install only one version in the copied world. Static/API-double
checks are not native rendering/aim acceptance, and this is not a production fix.

## Primary references

- https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/camerashakeoptions?view=minecraft-bedrock-stable
- https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/camerashaketype?view=minecraft-bedrock-stable
- https://learn.microsoft.com/en-us/minecraft/creator/commands/commands/camerashake?view=minecraft-bedrock-stable
- https://feedback.minecraft.net/hc/en-us/articles/48826825649933-Minecraft-Bedrock-Edition-26-50-Changelog-Wilderness-Bound
- Exact official types: https://registry.npmjs.org/@minecraft/server/-/server-2.10.0.tgz (SHA1 609061ffb8e93394ff331f4481393c0b27c1930f)
