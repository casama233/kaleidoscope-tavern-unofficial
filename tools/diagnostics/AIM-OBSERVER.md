# Private read-only aim observer for real drink/milk testing

This independent stable @minecraft/server2.10.0 BP observes production behavior;
it never invokes any camera API, applies/removes effects, rotates/teleports the
player, changes input/HUD/settings, or writes blocks/items/persistent state. It
has no startup action. Console logging and bounded self-chat are its only output.
It does not contain a production fix, camera shake driver, or Java-parity claim.

Use a copied single-player Creative native world with the exact production pair
being accepted, ordinary first-person, hand/held items/crosshair visible. The
user requires all of those native rendering elements and actual aim preserved.
Do not activate f6f15f03 shake sampler or any camera-roll diagnostic alongside
this observer. Existing native/custom drink effects ARE allowed; it can start
while tipsy is already active. No empty-effect condition or setting toggle exists.

    /scriptevent kt_aim_observer:start private_normal_firstperson

Close chat and perform the root-approved actual drink then milk scenario. Each
start captures the current pose as baseline; keep mouse and position stationary
for a no-aim-drift interpretation. The observer samples once per server tick for
300 ticks (about15s at20TPS), normally300 snapshots including tick0, with a hard
350-sample bound. Actual client frames/effect timing are not read back.

    /scriptevent kt_aim_observer:status
    /scriptevent kt_aim_observer:abort

Status emits one self-chat metrics line; finish logs and chats the summary. A
second start while active is rejected. Abort/timeout only stop observation, and
leave all production camera/effect state untouched. Multiplayer/non-Creative,
invalid-player/snapshot errors, leave and respawn stop the observer. Movement
and dimension changes are recorded rather than aborting. Native effects and milk
do not stop capture, so post-milk cancellation can be observed within the window.

Raw [TavernAimObserver] JSON rows record source commit, sessionStartTick, elapsed
server ticks, location/dimension, player rotation, view vector and20-block ray
block/face target. Completed consumption events include item type and relative
tick for drink/milk timeline alignment; no consumption is initiated by this pack.
Summary reports max yaw/pitch/view-vector/position deltas, changed ray targets and
samples outside the baseline dimension. Movement, mouse input, changed blocks or
other-dimension samples require interpretation; they are not automatically a
production failure. A null baseline ray has weak target evidence. Server metrics
alone cannot certify rendered arms/held item/crosshair, client targeting, waveform
quality or exact Java parity. Root records actual video/screens alongside rows.

Latest result is stored in memory per player (at most8), never in world properties.
Start another window explicitly if needed; no automatic restart or permanent
monitor is installed. The collector must filter this observer's exact commit and
marker, not reuse another probe's telemetry as evidence.

## Git-first reproducible build

    python3 tools/diagnostics/test_aim_observer.py
    python3 tools/diagnostics/build_aim_observer.py --out-dir /absolute/new/output

Commit the four diagnostic files before building. Builder verifies committed
bytes including tests/license, derives new BP/data/script UUIDs from source and
content, refuses archive replacement and repository-local output, and copies no
canonical runtime. There is no RP, UI override, or canonical BP UUID dependency.
Static tests/archive validation are separate from native production acceptance.

Prior independent f6f15f03 shake-only native evidence (root-reported2026-10-06):
empty-hand and held-milk trials each produced100 samples and preserved ordinary
first-person rendering. Those200 rows/10 captures establish that small one-shot
native shake scenario, not the actual production pulse/drink/milk lifecycle;
this observer is for that next verification and does not replay any shake.
