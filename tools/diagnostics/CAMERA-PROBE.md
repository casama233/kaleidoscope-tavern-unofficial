# Private stable camera/aim diagnostic

This opt-in standalone BP uses only @minecraft/server 2.7.0. It neither copies
nor changes canonical Tavern 109 BP/RP, effects, player definitions or archives.
It does not run a camera at startup. It requires a copied single-player Creative
world, no active native/custom effects, and manual assurance that no other pack
owns the camera. No experiments, permission changes, security changes, input
locks, player rotation setters or player teleports are used.

The prior parity boundary remains: Java adds deterministic roll to the rendered
camera without changing entity yaw/pitch. Current Tavern uses entity yaw. A free
camera axis result must not be presented as normal-gameplay 1:1 parity.

## Git-first build

After the four diagnostic tools files are committed on the existing PR:

    python3 tools/diagnostics/test_camera_probe.py
    python3 tools/diagnostics/build_camera_probe.py --out-dir /absolute/new/output

The builder verifies committed bytes for itself, the script, this README and
LICENSE-CODE. It verifies the frozen109 runtime tree
72dbf54189a5e16eac7645a212b944ae1b4e19b9. Unique BP/data/script UUIDs include
source commit and every input hash. Different source gets a different probe
identity. Output is deterministic; an existing archive cannot be replaced.
Output inside the canonical repository (including runtime and symlinked
descendants) is rejected. Use a fresh shared output directory. All pack-entry
hashes and exact schema are emitted beside the archive.

This BP has no dependency on another BP UUID; its only dependency is stable
@minecraft/server 2.7.0. Activate it alongside one exact canonical 109/70 pair.
Never activate a copied/reidentified Tavern BP: that changes dynamic-property
ownership and creates duplicate effect/machine owners. Custom dynamic properties are BP-UUID scoped. The standalone probe cannot
read canonical Tavern's custom-effect status; verify the empty host guide
manually. It checks native effects only and writes no dynamic properties. There is no RP and no vanilla UI/player/animation override.

## Preparation and marked scene

Use a copied disposable world, first-person perspective, Creative, cheats, and
no other scripted camera owners. Camera has no documented active-preset getter,
so this ownership condition must be established manually. Starting a test
acknowledges that clear() will return the view to normal, not restore a foreign
camera. If another camera owner exists, do not run the probe.

Clear effects with milk, inspect the guide snapshot, then use:

    /scriptevent kt_camera_probe:inspect
    /scriptevent kt_camera_probe:scene build

Scene build preflights 77 loaded air blocks before placing an 11x7 grid about seven
blocks forward, starting at the head-height block level, above ground in the flat test scene. It rejects obstructions;
it never replaces existing non-air blocks. The center is lime, grid axes black,
and corners differently colored. Coordinates are printed to chat/content log.
Manually aim at the lime center. The probe never aims or teleports the player.
Record an ordinary-camera baseline screenshot including target, vertical lines,
horizontal line, crosshair, hand and HUD.

Only a player-issued command is accepted. Console/block/other source entities
cannot select a player. Native effects, multiplayer and non-Creative state are rejected. Custom
effect cleanliness is a required manual host-guide check, acknowledged by the
clean_no_other_camera token; it is not inferred from the probe's own UUID scope.

## Normal camera FIRST

    /scriptevent kt_camera_probe:run normal_plus clean_no_other_camera

This calls playAnimation on the current ordinary camera without first calling
setCamera. It asks for constant captured pitch/yaw and Z 0 to +8, then holds the
endpoint for 20 seconds. Close chat and capture a screenshot after one second.
Record the content-log API result even if it rejects or produces no visible
change. Explicitly abort before the next phase:

    /scriptevent kt_camera_probe:abort

If accepted, repeat normal_minus for the negative endpoint. This calibration is
exaggerated and synthetic, not the Java amplitude or a successful drink effect.
If normal-camera animation is unsupported, keep that negative evidence.

## Separate free-camera calibration

    /scriptevent kt_camera_probe:run free_zero clean_no_other_camera
    /scriptevent kt_camera_probe:abort
    /scriptevent kt_camera_probe:run free_plus clean_no_other_camera
    /scriptevent kt_camera_probe:abort
    /scriptevent kt_camera_probe:run free_minus clean_no_other_camera
    /scriptevent kt_camera_probe:abort

Run each individually, not as a pasted batch. Close chat and screenshot the
held endpoint before aborting. free_zero is the viewpoint/hand/HUD control;
free_plus and free_minus vary only Z. These phases explicitly set minecraft:free
at the captured head position, wait two ticks, then play the animation.

A LinearSpline has two points 0.01 block apart, while progress alpha stays 0 at both
ends to request a stationary camera. If that valid-range stationary construction
is rejected, record the API error; do not silently substitute a moving spline.

The log samples player position, head, pitch/yaw, view direction and ray target
at most five times per second, with a maximum 110 samples per test. Server readback
alone is not rendered-camera proof. A roll endpoint should tilt grid lines around
the crosshair while the central target and player aim stay fixed. Yaw shifts the
target sideways. Free-camera hand/body visibility, F5 and mouse-follow differences
must be recorded as tradeoffs, not hidden.

Only if the axis calibration succeeds, the optional free_wave phase samples the
exact .6/.3/.1 three-wave formula for 8 seconds. It uses server-currentTick as a
calibration phase, not Java client player age or render partialTick. Still endpoint
screenshots do not prove smooth interpolation, exact amplitude or phase fidelity.
Continuous waveform acceptance remains separate if recording is unavailable.

    /scriptevent kt_camera_probe:run free_wave clean_no_other_camera

## Cleanup and stopping conditions

Every test auto-clears after 20 seconds (8 seconds for wave), with a small two-tick
cleanup margin. Explicit abort cancels pending playback and clears only an owned
active diagnostic. An idle abort deliberately does not clear unrelated cameras.
A new player, Creative/native-effect guard change, movement over 0.25 block,
API/sampler errors, dimension change, death/respawn, milk
completion and leaving also stop the session. Camera-clear failures are logged;
if needed, the tester's recovery command is /camera @s clear.

After the camera session ends:

    /scriptevent kt_camera_probe:scene clear

Only tracked blocks still matching their probe types are returned to air; changed
or unloaded blocks are retained and counted. Scene tracking is in memory. Clear
before unloading/reloading this pack. If tracking is lost, discard/restore the
private world copy rather than issuing a broad deletion command. Save/quit and
deactivate/remove the probe before continuing ordinary109/70 acceptance.

If normal camera rejects but free camera rolls, conclude only that a free-camera
roll channel exists on the tested client. Ordinary camera additive composition,
movement/mouse follow, hand/F5 fidelity, third-person behavior, exact Java phase,
foreign-camera coexistence and lifecycle remain unverified. No production camera
repair or release is authorized by a diagnostic result alone.

## Primary references

- Stable release of camera splines/attachment, no experiments required:
  https://learn.microsoft.com/en-us/minecraft/creator/documents/update1.26.10?view=minecraft-bedrock-stable
- Camera API and clear semantics:
  https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/camera?view=minecraft-bedrock-stable
- Vector3 animation rotations:
  https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/rotationkeyframe?view=minecraft-bedrock-stable
- Progress alpha allowed range:
  https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/progresskeyframe?view=minecraft-bedrock-stable
- Official free-camera example with two-tick setup delay:
  https://learn.microsoft.com/en-us/minecraft/creator/documents/camerasystem/freecamerascriptapitutorial?view=minecraft-bedrock-stable
- Exact original Java roll handler:
  https://github.com/KaleidoscopeMods/KaleidoscopeTavern/blob/c4ec1880bd44cf3139d3ba744ab30bb379cf1416/src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/client/event/CameraAnglesEvent.java
