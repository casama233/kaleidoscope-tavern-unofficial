# Tavern 0.6.112: bounded native visual-only Tipsy approximation

## Change and preserved behavior

The old yaw adapter changed player aim and has been removed. Slightly Tipsy now
requests only finite native `Camera.addShake` rotational events at intensity0.05.
Each event lasts at most0.25 seconds, shortened to remaining effect time. A
per-player lease requires both at least6 ticks and250ms, including shortened final pulses, before
another event can start; a backwards wall-clock reading fails closed. Catch-up
ticks alone cannot stack events. A new drink extends the status without adding
overlapping events. Failed/partially accepted calls retain a lease and back off.

Milk, effect expiry, the existing motion opt-out tag, death, disconnect or
invalid/dimension-changed handles stop future scheduling. Already-issued motion
expires naturally within its requested quarter-second duration. The lease
survives immediate clear/reapply so that sequence cannot stack another event.
There is deliberately no broad `stopShaking`, `camera.clear`, free-camera preset,
teleport, player-rotation write or fallback that changes aim. Another pack's
camera/shake state is not stopped or restored. Concurrent foreign shake may still
add visually; Tavern can only bound its own events.

The user's Camera Shake setting is left unchanged and the engine controls its
rendering. Camera Shake OFF is not bypassed. Missing API support fails closed;
sleep, spectator and locked-camera input skip scheduling. Read-only diagnostics
report the adapter mode, attempts, remaining lease and errors, not visual proof.
The previous HUD, effect durations, other custom effects, native first-person
models, and the native-accepted110 Sneak-transition placement repair are preserved.

## Approximation, not Java Z-roll

Java applies a signed three-wave render-time Z-roll. Native rotational shake
exposes duration, scalar intensity and shake type; it has no exposed Z-only axis,
signed angle, phase or frequency control. This implementation does not claim the
Java waveform, exact roll parity, or production visual/comfort acceptance.

## Stable API and minimum engine

The BP dependency rises from `@minecraft/server`2.7.0 to stable2.10.0. Mojang's
[26.50 changelog](https://www.minecraft.net/en-us/article/minecraft--bedrock-edition-26-50-changelog)
releases Camera.addShake, CameraShakeOptions and CameraShakeType in2.10.0.
The existing minimum engine1.26.50 therefore remains; no beta experiment is
introduced. Older API/runtime combinations are not supported. The original
server-ui2.0.0 dependency remains unchanged. The paired World Liquor is0.1.72.

The [official option contract](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/camerashakeoptions?view=minecraft-bedrock-stable)
says events expire naturally and same-type events add together. This motivates
finite non-overlapping owned events rather than per-tick stacking or global stop.
The [camera-shake command reference](https://learn.microsoft.com/en-us/minecraft/creator/commands/commands/camerashake?view=minecraft-bedrock-stable)
explicitly documents the existing Allow Camera Shake setting. Its OFF behavior
for this production API route remains an actual-client acceptance check.

## Native diagnostic evidence, separately scoped

The [source-backed diagnostic record](NATIVE-SHAKE-DIAGNOSTIC-EVIDENCE-0.6.112.json)
identifies isolated diagnostic source f6f15f032472026c9bd484d822e2b97a180ff6ce and
archive67cbd7c3a24ccbc5c59cc905331c7bade03a5e3f8157d89aff301f77e4c5bb86.
It issued one3-second0.05 rotational shake per run in normal first person on
client1.26.52.3 x86_64 Linux, Ari skin, FOV60, existing Camera Shake ON and
Hide Hand OFF. Empty-hand and held-milk runs each had100 samples
(20before/60during/20after), with zero yaw/pitch/view-direction/ray-target change.
Native arm/held-item/crosshair remained visible while the world visibly shook.
All200 samples were independently extracted; one end-log line was incomplete,
while both complete metric summaries were captured in native chat. The record
retains screenshot and telemetry hashes, verified again before this commit.

This proves only those bounded diagnostic runs. It does not accept112's shorter
pulse train, sustained comfort, actual drink/milk/expiry lifecycle, Camera Shake
OFF, moving-player aim, other skins/FOV/devices, all models/effects or exact roll.

## Verification and identity

Eight focused API-double tests exercise bounded events, dual expiry gates,
backwards clock, clear/reapply, expiry, opt-out, handle lifecycle, missing API,
locked input and bounded error retry. Pure pulse-window checks cover3600 status
lengths. The20 shared-interaction regressions remain passing. These source tests
are not native rendered acceptance. The frozen112 source, manifests, diagnostic
build and guide identities are synchronized;110/71 and all earlier archives
remain immutable. No release, merge, live deployment or saved-world migration
is performed by this Git-first checkpoint.


## Preserved rejected111 checkpoint

111 was frozen before final timing review and was never installed or accepted.
The review reproduced an overlap when a slow validation getter consumed100ms
between the tick-start clock read and actual API issuance, followed by catch-up
ticks.112 now samples wall time immediately before issuance and extends both
tick/wall leases through API completion, including partially accepted throwing
calls. The added regression covers slow validation, slow API completion and a
partial-acceptance exception.111's source/history/claim remain immutable rather
than reusing its identity. The eight focused source tests pass;112 native
short-pulse quality and real drink/milk/end acceptance remain pending.
