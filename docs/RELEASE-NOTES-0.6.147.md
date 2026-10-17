# T147 draft: bounded 200 ms shaker HUD visibility

Base: T146 main `6a0a022f657b2d74a80d880028878549386df36d`.
The reviewed three-file source repair is `2dfb28cad68367cbe93b5ffd388c2969a1cdce08`.
This is a draft paired with World Liquor W124, not a merged release or LIVE update.
T146/W123 and every earlier release identity remain immutable.

## Exact scope

The only non-identity runtime change is
`runtime/RP/ui/hud_screen.json` → `kt_mixology_progress_wait.duration`:
**0.1 to 0.2 seconds**. It is one raw byte at zero-based offset 203413.
Cursor interpolation remains a bounded **0.05 seconds / one tick**, without
extrapolation after that tick. Slots remain 0.5 seconds, parent cleanup remains
0.6 seconds, and terminal fades remain zero. Gameplay clocks, recipes, sender
cadence, root/factory/protocol, effect controls and shared Actionbar ownership
are unchanged. No stop/clear packet, title writer, private builder patch or
new UI state channel is introduced.

Original HUD SHA256:
`6cfd5370ae0bcaeee72eb9c7fae8c74789fe8c279625de4b3da4664c3174e553`.
Candidate HUD SHA256:
`37d46fff93134f37cff6144774cab234dbd3294784011006f55bf9232b05eded`.

Normal baseline freeze allocates T147; W124 changes only its identity and exact
T147 dependencies. Existing UUIDs and storage schemas stay unchanged. G125 and
the five author packs keep their reviewed bytes. `.github/release-request.json`
is untouched; no publication workflow or deployment is requested.

## Preserve both failures and bounded observations

The 1.26.52.3 public 16-pack diagnostic used T146/W123/G125 and five author packs.
These observations are associated with their original diagnostic input, not
with completed acceptance of the newly versioned T147/W124 pair:

- **HUD100 natural failure:** f90–91 show the whole progress HUD absent inside
  the active span; f92 restores it. The adjacent capture intervals are about
  33 ms. This is not explained by missing capture samples.
- **HUD100 rapid failure:** f38 is blank, f39–43 return to the old progress,
  and f44 finally resets at the left. Keep this source result as a failure.
- **HUD200 natural:** 601 actual frames; f28–146 are 119 consecutive visible
  frames without sampled blank or double cursor. The final five visible
  frames hold the same x for approximately 166.7 ms; f147 onward is clear.
- **HUD200 rapid:** 901 actual frames; f17–39 and f42–162 each have no internal
  blank or double cursor. f40–41 are fully clear for 66.618 ms, followed by a
  direct left reset, with no observed old-progress return. The first run's
  last position persists for **233.325 ms**; the restarted run's longest final
  same-x interval is **133.376 ms**. Final frames stay clear. Both completed
  diagnostic runs produced a visible Signature Cocktail.

Same-x interval is a sampled visual observation, not measured time from physical
release or from the last received packet. The recordings have nonuniform PTS;
physical input edges, engine ticks and packet-arrival timestamps are unknown.
The two configurations were separate attempts, not identical-tick replay.
Therefore these samples support bounded continuity improvement but do not prove
the dropout's cause, exact release latency, constantly smooth motion, universal
flicker elimination, multiplayer, held-use slot switching, other devices/scales,
audio or full-family acceptance. A larger timeout is not a demonstrated root fix.

Video SHA256 identities:

- HUD100 natural: `f33ca9e0234d3de55bd812a3195d0cdb3b199ffeb9b318559b647547377922ae`
- HUD100 rapid: `a623cfd2db1880fabbec18ed1d34c51a6d29b3f677deab46191a814c480c59a2`
- HUD200 natural: `45356a407d4a5ca79d22aed8516049e416209bcdd3db1b9ef9058b17dd6c5259`
- HUD200 rapid: `489968c40284f26952a8f052b64e98f6e545e342006e1e2828b8c6055e6c05d5`

The original natural review's `visual.last_pts` mistakenly used f600's
19.999785. The immutable correction records f146 = **4.866648** and f147 =
**4.900027**; correction SHA256
`9bba5d7b62e8f2766be0d12100f1b2f76bd7a84a555c23409ba6702eefa2cade`.
The original recording/review remains unchanged. The diagnostic was cold
rolled back to both original formal HUD files after recording.

## Source checks and remaining gates

The two existing expiry/motion regression files cover all owned sprite routes,
200 ms opaque/terminal-alpha boundaries, unchanged slot/parent lifetime and
50 ms bounded cursor movement. The exact source-only preparation passed all
six tests; reverting just the runtime to 100 ms produced three expected
failures. Structural tests do not measure client arrival or animation latency.
Final canonical CI and strict identity/archive checks must bind their actual
source SHA; no T146 CI, prior BDS or diagnostic result is relabelled for T147.

Author context was read from the current `family/java-upstream.json`,
`family/BASELINE-STATUS.md` and prior paired author reviews. The current private
BSM `addon_quality/senluo-java-upstream-status.json` was unavailable in this
workspace; no fresh BSM/source-currentness check or complete latest-author
adaptation is claimed. This draft changes no Java gameplay authority. Fresh
author checks, full-family native/saved-world gates and formal-pair client
acceptance remain separate before any later release/deployment decision.

This task stops at draft PRs and their actual CI status. It does not merge,
publish a release, start BDS, change current QA, or update LIVE.
