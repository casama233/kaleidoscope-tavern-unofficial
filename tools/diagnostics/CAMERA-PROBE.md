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

## Delivery control FIRST, then matched roll controls

Deactivate the old probe before activating this unique revision. Do not enable
experiments. Keep canonical109/70 unchanged. Run each command separately, close
chat, observe, then abort or wait for automatic cleanup before the next test.

    /scriptevent kt_camera_probe:run free_delivery clean_no_other_camera

This explicitly sets minecraft:free at captured head position, waits two ticks,
then animates three distinct points across X+2 blocks while camera yaw increases
by20 degrees. Progress goes from alpha0 at0s to alpha1 at2s, then holds through20s.
The grid should visibly change position/perspective during the first two seconds.
The player's entity yaw/pitch and position are never set. Compare the initial
and held view, not merely disappearance of the arm/crosshair: setCamera working
does not establish that playAnimation was delivered. If translation/yaw is not
visible, stop; the roll result remains inconclusive.

    /scriptevent kt_camera_probe:status
    /scriptevent kt_camera_probe:abort

Only after visible animation delivery, run the three matched controls:

    /scriptevent kt_camera_probe:run free_zero clean_no_other_camera
    /scriptevent kt_camera_probe:abort
    /scriptevent kt_camera_probe:run free_plus clean_no_other_camera
    /scriptevent kt_camera_probe:abort
    /scriptevent kt_camera_probe:run free_minus clean_no_other_camera
    /scriptevent kt_camera_probe:abort

All three use identical three-point geometry spanning X+0.02 blocks, identical
alpha0->1 progress by2s, captured constant pitch/yaw, and identical20s duration.
They differ only in requested Z endpoint:0,+8,-8 degrees, reached at0.25s. This is
near-stationary, not exactly stationary. Capture held endpoints after3s. Avoid
moving or changing the player's aim between the matched tests; if changed,
manually restore baseline and repeat. Record hand/HUD/dither changes separately.
The exaggerated roll is a diagnostic axis control, not Java-amplitude parity.

Each submitted animation prints source prefix, mode, point count, requested path,
yaw/Z, duration and API-return status to self-chat. Each end prints reason,
sample count, cleanup result and bounded error if present. The explicit status
command emits one line for the active/latest test, retained in memory only
(maximum eight players). inspect prints the bounded entity snapshot to self-chat.
There is no automatic per-tick chat, and no dependence on a working content log.
These are request/API/lifecycle evidence, never a rendered-camera getter.

The optional normal_plus/normal_minus commands remain available as negative
controls and never call setCamera. Official spline documentation targets only
minecraft:free; ordinary-camera non-motion does not establish absence of Z roll.

## Earlier native trial: inconclusive

Preserve source b46464e78552d00c153401ded1faf381782b07dd and original archive
SHA25655e284307a5c903f7c4a5ed67185d0a513ec7f121b41e9c83d9ec838d339c876.
On native1.26.52.3 alongside109/70, normal_plus, free_zero and free_plus returned
without visible grid tilt after more than eight seconds. Free mode hid the
hand/crosshair and showed a dither overlay; timeout restored normal view and the
77 scene blocks were cleared. Content logging was subsequently recovered after
world close:659 lines,307 parsed camera rows. The parsed samples were100 normal,
100 free_zero and97 free_plus, all with entity deltaYaw/deltaPitch0 and fixed lime
ray target within each session; parsed events showed no API error. Normal and
free_zero timeout cleanup succeeded. These entity snapshots do not read rendered
camera rotation. Captured native head height was used, not an assumed1.62 offset.
That trial used two points and constant alpha0, with no positive animation-delivery control;
it is not proof that rendered Z rotation is unsupported.

Official2.7.0 npm declarations match the option nesting and Vector3 rotation.
The Editor Camera Tool documents at least three Linear points; the script API
reference does not specify a minimum. This revision removes that uncertainty and
the constant-progress confounder without claiming either caused the old result.
The tutorial still mentions experiments, but26.10 release notes explicitly moved
camera splines out of experimental; no toggle change is part of this procedure.

The log samples player position, head, pitch/yaw, view direction and ray target
at most five times per second, with a maximum 110 samples per test. Server readback
alone is not rendered-camera proof. A roll endpoint should tilt grid lines around
the screen center while the player aim stays fixed; the matched0.02-block path
may create a small common target shift, and free mode may hide the crosshair. Yaw shifts the
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
- Editor's documented Linear minimum (three points; runtime API minimum unspecified):
  https://learn.microsoft.com/en-us/minecraft/creator/documents/bedrockeditor/editorcameratool?view=minecraft-bedrock-stable
- Official npm2.7.0 declarations, tarball SHA1 f3b92eb373b63e83a5018d40c76596cdb3abde70:
  https://registry.npmjs.org/@minecraft/server/-/server-2.7.0.tgz
- Version-specific removal of spline experimental requirement:
  https://feedback.minecraft.net/hc/en-us/articles/44418129038733-Minecraft-Bedrock-Edition-26-10-Tiny-Takeover
- Exact original Java roll handler:
  https://github.com/KaleidoscopeMods/KaleidoscopeTavern/blob/c4ec1880bd44cf3139d3ba744ab30bb379cf1416/src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/client/event/CameraAnglesEvent.java
