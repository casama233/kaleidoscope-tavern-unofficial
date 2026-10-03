# Slightly Tipsy limited native checkpoint — 2026-10-03

These are limited results reported by root from the licensed Android Bedrock
1.26.52.3 client, using the integrated source candidate and optional private
[observer](TIPSY-PRIVATE-OBSERVER.md). This source worker did not operate the
client or independently reproduce the observations. Private recordings, raw
observer logs, world files and player identifiers are not included here.

## Reported observations

| Native action | Reported result | Scope of evidence |
| --- | --- | --- |
| Complete actual `vodka_q4` consumption | Canonical Tipsy starts at 600 ticks. Two ticks later it remains active, with tracking enabled, `camera_api` transport and no reported error. | Real item completion and status/transport observations. |
| Complete actual Milk consumption while Tipsy is active | The completion observation has zero remaining Tipsy and tracking disabled. At +2 and +7 ticks it remains zero/untracked, with no reported error. | The +2 observation was read on its exact scheduled tick with zero scheduling lag. |
| Allow the second drink to expire naturally | The first zero-remaining observation still sees tracking enabled within that tick; the +2 and +7 observations see zero remaining and tracking disabled, with no reported error. | Both follow-ups were read on their exact scheduled ticks with zero scheduling lag. This establishes the observed status/tracker transition, not exact rendered-shake disappearance. |
| Die during the third drink and respawn | Real-player death clears the remaining status and tracker; the respawn observation remains clear, with no reported error. | Death/respawn lifecycle observations, without a claim about the last delivered camera frame. |

Root also reported visible small camera movement on this candidate compared
with the preceding adapter in a matched scene. That establishes client-visible
motion for the tested setup. It does not establish Java's signed roll, a
degrees-to-intensity calibration, comfort in all views, or full Java parity.
**Signed Java roll remains NOT_RESTORED.**

The API transport observations above do not validate the command fallback on
this native client. Source tests cover both transports separately using API
doubles; those tests are not native client evidence.

## Still pending or outside this checkpoint

Saved-world re-entry and relog acceptance were still in progress when root
reported this checkpoint. Dimension changes, all three perspectives, amplifier
and duration stacking, other drink effects and foreign camera/shake coexistence,
opt-out, sleeping/spectator/locked input, and Allow Camera Shake disabled are
not certified by these observations. The complete
[acceptance matrix](TIPSY-CLIENT-REPAIR-20261003.md#roots-native-client-acceptance)
remains open.

The adapter submits events lasting at most **0.25 seconds** and stops submitting
future pulses after cancellation. This remains a source/API duration bound;
it is **not an exact measurement of residual movement on the delivered screen**.
Milk and expiry observer timing must not be presented as such a measurement.

No release/hash gate, runtime acceptance flag, source reference or camera
implementation is changed by this documentation checkpoint. In particular,
`clientTested: false` in the source report remains a conservative full-acceptance
flag. These limited native observations do not authorize replacing it with a
general pass.
