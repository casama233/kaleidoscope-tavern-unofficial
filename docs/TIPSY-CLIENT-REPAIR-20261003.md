# Slightly Tipsy source repair — client acceptance pending

Source-only branch based on PR167 head `89167ad39a7c73b1e8574464a751d3f852c80fc4`.
No release identity, freeze, history, guide, World Liquor, shaker animation or
camera-frame resource changes belong to this patch. Root owns integration,
release collision reconciliation and licensed Android 1.26.52.3 acceptance.

## Source checkpoint and cause

The existing CI pins readable Java source to
[`c4ec1880bd44cf3139d3ba744ab30bb379cf1416`](https://github.com/KaleidoscopeMods/KaleidoscopeTavern/tree/c4ec1880bd44cf3139d3ba744ab30bb379cf1416).
`data/tipsy-source-reference.json` records independently checked SHA256 and Git
blob IDs for five files. This is not a claim that this Forge source commit is
the complete source identity of the separately pinned NeoForge 1.2.0 JAR.
The local C5 JAR disassembly also registers Tipsy as an inert `BaseEffect`.

* [`DrinkBlockItem`](https://github.com/KaleidoscopeMods/KaleidoscopeTavern/blob/c4ec1880bd44cf3139d3ba744ab30bb379cf1416/src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/item/DrinkBlockItem.java): native use takes 32 ticks. On completion, each quality entry rolls independently, seconds become ticks, and a `MobEffectInstance` is added. Creative retains its drink.
* [`DrinkEffectDataProvider`](https://github.com/KaleidoscopeMods/KaleidoscopeTavern/blob/c4ec1880bd44cf3139d3ba744ab30bb379cf1416/src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/datagen/datamap/DrinkEffectDataProvider.java): standard wine Q1 uses nausea, Q2–Q6 use Tipsy for 45/30/30/20/10 seconds; mystery cocktail uses 180 seconds. Other effects remain separate rows.
* [`CameraAnglesEvent`](https://github.com/KaleidoscopeMods/KaleidoscopeTavern/blob/c4ec1880bd44cf3139d3ba744ab30bb379cf1416/src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/client/event/CameraAnglesEvent.java), blob `4dc098ab27a9c0c939037f122765fc034cb1658e`: each render frame adds `sin(t/19)*0.6 + cos(t/13)*0.3 + sin(t/9)*0.1` degrees to the existing roll, with `t = player.tickCount + partialTick`. Amplifier and duration do not scale this waveform. There is no Tipsy movement modifier, sound, FOV or nausea application in these handlers.

The previous adapter applied very small server `setRotation` yaw deltas. Its
successful setter/readback and the custom status/HUD proved only server state;
they did not establish local client camera motion. It also changed aiming,
unlike Java's additive camera roll. This patch removes both yaw reads and writes.

## Implemented approximation and engine limits

The adapter sends player-local **native rotational camera shake** every five
ticks, for at most 0.25 seconds and never beyond the current status lifetime.
The absolute Java waveform supplies a slowly varying intensity envelope capped
at **0.04**, with a 40-tick smooth onset/expiry. This cap is a conservative
candidate, not a measured conversion between Bedrock intensity and Java degrees.
It needs visual calibration by root before acceptance.

[`camerashake`](https://learn.microsoft.com/en-us/minecraft/creator/commands/commands/camerashake?view=minecraft-bedrock-stable)
is the stable 2.7 transport and targets only the executing player via `@s`.
The [official changelog](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/changelog?view=minecraft-bedrock-stable)
adds `Camera.addShake` and `CameraShakeType` in 2.10. This patch imports neither
missing export into 2.7; only an actually available `addShake` method uses the API.
[API shake events](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/camerashakeoptions?view=minecraft-bedrock-stable)
are additive and naturally expire. There is no camera preset/default-camera
change, full-duration queued shake, global stop/clear, teleport, input lock,
fake native buff, player.json override or extra sound.

Bedrock does not expose an additive signed roll setter on the ordinary gameplay
camera. Native rotational shake controls intensity/duration, not roll axis,
sign, frequency or Java's frame interpolation. Its engine motion therefore
differs from Java's gentle deterministic roll; the source waveform is only an
envelope. The phase starts when this adapter discovers the status instead of
using inaccessible local-player render age. The fade is also an adaptation.
**Exact Java roll remains NOT_RESTORED.** No result here says the candidate is
already close enough to Java on a real screen.

The player must enable **Allow Camera Shake**. Script cannot read that setting
or prove it rendered. The command can be rejected by the runtime's command
policy; failures are exposed with bounded retry, not hidden by a success label.
Locked camera input, sleeping, spectator and `kt_no_tipsy_motion` skip pulses.
A foreign camera preset is not cleared or replaced; an unlocked foreign camera
can still receive additive shake. That addon/player can use the existing opt-out.

Cancellation stops future pulses and forgets private tracking; the last sent
pulse expires naturally within **0.25 seconds** (delivery latency is outside
Script's guarantee). Stopping all shake to remove that residual would destroy
another addon's effects, so cancellation deliberately does not do that.

## State and lifecycle

The canonical status format and effect ID are unchanged. Same-level repeats
retain the maximum remaining duration; stronger short and weaker long entries
continue to age online, with strongest active first. One adapter track supplies
the same visual for any amplifier, matching Java's presence-only check.
Heartbeat, Milk, death, respawn and departure use the existing single status
owner. Dimension change allows five ticks for the destination camera to settle,
then continues the status and phase. Expiry leaves other custom/native effects
alone. Milk/death clear custom effects through their existing handlers.

The regression exposed an existing join bug: the first status read did not
anchor its tick until the next heartbeat, adding up to five online ticks on each
join. The three-line fix anchors that first read without rewriting saved data.
Online-only countdown, persisted remaining duration and new-handle restart are
tested; abrupt invalid-handle disconnect can still lose up to the existing
five-tick persistence interval. Offline time is not charged.

World Liquor's existing `kaleidoscope_tavern:slightly_tipsy` application uses the
same adapter after canonical application. No `.58` integration or addon effect
definitions are overwritten by this branch.

## Reproduce source verification

```sh
python tools/check_tipsy_source.py --java-source /path/to/java-at-c4ec188
node --loader ./tools/efficiency/mock-loader.mjs --test tools/tipsy-client.test.mjs tools/efficiency/efficiency.test.mjs tools/java-parity-adapter.test.mjs
python tools/check_visuals.py
git diff --check
```

The native APIs are dependency doubles driving the actual production modules.
They are not SimulatedPlayers or BDS/client evidence. The focused suite has 24
cases; the five Java fingerprints and 3,601 waveform samples also pass. Existing
efficiency/state and Java equipment adapter suites pass. Visual static checks
pass for the scripts, references, current resources and localization.

Release/immutable-hash gates remain enabled. The inherited base was already
unfrozen: its committed BP tree is
`430ecd5e44d94ed3349dc6a536702fea5cfa3971a5f908ae746315e99112f7ee`
and RP tree is
`c49fda15dbe3977a47ed94b651219e341b6ab865260be80b60189d42c5080f64`,
which differ from `baseline.json`'s `.93` identities. This patch requires root's
new non-conflicting release identity and exact immutable preimages after full
integration. No history or hash ledger is altered to admit these changes.
The full release check remains blocked by preservation hashes; packaging,
bridge, native BDS and client tests are not certified here.

## Root's native client acceptance

1. Integrate the four runtime changes into the candidate paired with current
   World Liquor `.58`; choose/freeze a non-conflicting identity through the normal
   gates. Do not reuse the `.93` lock. Use the isolated licensed Android client
   and staging world, not the user's current world. Keep native evidence private.
2. Enable Allow Camera Shake and run `/function kt_tipsy_motion_on`. Look at a
   stationary doorframe or horizon. Drink `kaleidoscope_tavern:wine_q2` to native
   completion. From about two seconds onward, distinguish visible screen motion
   from the HUD icon; run `/function kt_tipsy_diagnose` only to inspect transport,
   attempts, remaining ticks and errors. `clientConfirmed:false` is intentional.
3. Compare with the Java pin side by side. Evaluate gentleness, slow modulation
   versus unwanted rapid jitter, aim stability and touch responsiveness. Reject
   this candidate if the shake is imperceptible, excessive, or too unlike Java;
   source/API success cannot override that visual finding. Test first person,
   third person back and third person front while moving/turning, plus shaker use.
4. Check Q2–Q6 expiry durations 45/30/30/20/10 seconds; Q1's existing nausea stays
   a distinct effect. Test the actual `.58` named liquor that supplies canonical
   Tipsy. Repeat drinks midway: one visual, duration refresh, no intensity stack.
   Higher amplifier and weak-long/strong-short combinations require root's
   controlled staging harness calling canonical `applyCustomEffect`; the public
   addon `effect_apply` event intentionally does not grant arbitrary own effects.
5. Drink Milk during motion, die/respawn, expire normally, and use the opt-out
   function. Confirm future motion stops and the residual finishes within one
   short pulse. Relog with status remaining, then switch dimensions: status
   resumes correctly without old yaw restoration or persistent camera takeover.
6. Keep another drink effect and a foreign additive shake/camera preset active.
   Confirm Tipsy expiry does not remove their state, clear their preset or stop
   their shake. Also test locked look input, sleeping and spectator. Toggle Allow
   Camera Shake off: absence of motion is the expected client setting limitation,
   not a reason to add nausea or force a camera preset.

Record pass/fail/untested for each native case. Native client and sound acceptance
have not been performed by this worker.
