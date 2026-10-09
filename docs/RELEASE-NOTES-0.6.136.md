# Tavern 0.6.136 / World Liquor 0.1.113

T136 retains the complete [T134 implementation](RELEASE-NOTES-0.6.134.md) and
[T135 corrections](RELEASE-NOTES-0.6.135.md). It addresses a runtime aura-clock
defect exposed by the complete native scene, rather than changing the observer's
expected outcome. W113 will pair with the exact T136 dependency; Grilling remains
G119. The frozen functional source is recorded below; final peer, new CI and publication references are pending.
T134/T135 release notes, failures, frozen identities, witnesses and history remain
unchanged.

## Real native failure and diagnosis

T135 [canonical CI run 37873046866](https://github.com/casama233/kaleidoscope-tavern-unofficial/actions/runs/37873046866)
failed the aura scene. A diagnostic of the complete scene recorded:

| System tick | Native speed remaining | Observation |
| --- | --- | --- |
| 145 | 600 | The host's own effectAdd ticket was consumed correctly in the same tick. |
| 146 | 600 | The entity's native effect countdown had not advanced. |
| 147 | 600 | The native duration was still 600; projecting from system ticks instead expected 598. |

The entity remained valid with health 8, and there was no external effectAdd
event. The difference therefore did not establish an external refresh. The old
system-tick countdown falsely revoked the **aura appearance ownership lease**;
this is not evidence that an external producer changed the effect or that the
native speed effect itself was removed.

The correction in `runtime/BP/scripts/bedrock/status-aura.js` tracks an owned
effect through its observed native remaining duration. A paused or decreasing
native countdown does not imply a handoff; missing effects, amplifier changes,
observed extensions and unmatched external events retain their ownership checks.
Existing lease durations are persisted from fresh native readback; a prospective
own write is still reserved before hiding its native particles. Immediate
own-write/event matching remains narrow. This is not a wider tolerance, delayed assertion, simulated
appearance lease, repeated effect application or a relocation that masks the
failure. Corrected full-scene and normal-restart evidence is still required.

The separate one-tick invisibility observer also measures the recipient's native
clock instead of treating two script ticks as proof of two effect ticks. It adds
a 20-tick speed sentinel once, observes its countdown start, applies one-tick
invisibility once, then requires at least two further native countdown ticks
before checking expiry. Neither effect is refreshed. The entire observation is
bounded by 60 script ticks and fails if the sentinel is missing, invalid, extended
or does not advance. Evidence records `nativeTicksObserved` and
`scriptTicksWaited`; the recorder validates their bounds and retains
`playerConcealmentVerified=false`. This is an observer-only timing correction,
not longer gameplay invisibility or a delayed aura-acquisition assertion. Its
new full native first/restart result remains pending.

## Reviewed source and local checks

- Frozen functional source: [`c169a2072373b1feda12b08fdd741ed4ecdbc1ec`](https://github.com/casama233/kaleidoscope-tavern-unofficial/commit/c169a2072373b1feda12b08fdd741ed4ecdbc1ec).
- Archive: `Kaleidoscope_Tavern_Unofficial_0.6.136_baseline1.mcaddon`, 5,864,677 bytes;
  SHA256 `f7ad780ec8c14cb438c725012ff06aceb68e8d5b85486ffbc3a6d6be043a46bd`. Built from the clean source tree with release identity enforced.
- T136's appended reconciliation layer covers the single functional runtime delta
  in `bedrock/status-aura.js`; previous layers, additions and visual allocation
  witnesses remain unchanged. BP/RP identity version projections are retained.
- The focused aura regression run passed 26/26 cases, including eight new
  paused-clock, foreign-change, fresh-save, failed-revocation and repeated-restore
  counterexamples. Independent code review found no blocker. The closed native
  recorder regression passed 7/7. These are script/tool tests, not BDS or client
  acceptance.

## Evidence that remains bounded

- The earlier T135 [run 37871245685](https://github.com/casama233/kaleidoscope-tavern-unofficial/actions/runs/37871245685)
  passed 12 jobs, including package, audit, foundation and visual source checks.
  Its separate native inventory save/restart succeeded. Those outcomes retain
  their original source and scope; they do not certify T136.
- In the corrected T135 complete native flow, the portable case with three
  accepted stackable ingredients completed native-equality and independent-clone
  checks. The first six paired-flow cases completed: addon readiness, two cross-ID
  remaps, the three-input portable transaction and two machine writes. The later aura failure
  prevented a complete paired first/restart result. No unfinished restart or
  unreachable case is inherited as passed.
- W112 [run 37871248554](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/actions/runs/37871248554)
  passed its four jobs, including the exact paired 1,343-model allocation gate.
  W113's new T136 dependency requires its own exact-source CI.
- T136/W113 canonical CI, complete paired native first/restart, canonical release archive
  verification and publication are pending. The local clean-commit archive was built
  successfully as recorded below. Actual client and private full-family
  saved-world/LIVE acceptance remain separately pending under existing standing
  deployment authorization.

## Isolated next steps, not completed parity

The [multiline diagnostic](../tools/client-parity/README.md) generates a separate
BP/RP with new UUIDs into an explicitly supplied, new directory outside the
repository. It does not modify production board UI or save real boards. It uses
the original native factory/template hook, exact owned title/field markers,
mutually exclusive input branches, limits 320/350/1500, the original dropdown
indices and unchanged guide flipbooks. Its scoped generator/JavaScript checks
passed; whether the native server-form controller safely handles hidden sibling
writers, raw newlines, focus and platform input remains **unverified by a human
client**. Native multiline editing remains incomplete.

The pinned stable camera API offers `playAnimation` and three-axis
`RotationKeyFrame.rotation`; the documented animation route uses
`minecraft:free`. This does not yet prove additive roll preserving the native
first-person viewpoint, live aim, held-item rendering and another pack's camera
ownership. Free camera does not by itself mean player input is locked. Pure roll
remains unimplemented and needs a discriminating client test, not a claim of
permanent platform impossibility. Primary references are the official
[camera-spline restriction](https://learn.microsoft.com/en-us/minecraft/creator/documents/update1.26.0?view=minecraft-bedrock-stable#camera-splines-experimental-creator-camera),
[stable API release](https://learn.microsoft.com/en-us/minecraft/creator/documents/update1.26.10?view=minecraft-bedrock-stable)
and [free-camera Script API tutorial](https://learn.microsoft.com/en-us/minecraft/creator/documents/camerasystem/freecamerascriptapitutorial?view=minecraft-bedrock-stable).

All other T134/T135 limitations remain: arbitrary decorated nonstackable shaker
inputs, true through-wall outlines, whole-player/equipment hiding and target
clearing, dropped-shaker display contexts, native reach/step-height/XP pickup and
remaining effect/event semantics including Luck. Source-shaded RGB, PBR, board
outlines, particles, animation synchronization, sound and actual input still need
client comparison. Successful static checks and scoped native cases do not mean
the whole port is visually or operationally one-to-one.
