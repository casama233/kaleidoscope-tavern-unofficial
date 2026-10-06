# Tools-only native interaction trace

The frozen 0.6.109 / 0.1.70 source reduced a controlled native Creative
sneak-use to one cup, but still displayed the generic cancellation warning.
The reason is not established: collect the exact exception and callback trace
before changing transaction, rollback, or fresh-retry behavior. The historical
0.6.107 / 0.1.68 run produced two cups and SPACE_NOT_CLEAR; that earlier reason
is not evidence of the remaining 109 failure. Do not call this a release fix.

Build from the committed source:

    python3 tools/diagnostics/build_interaction_trace.py --out-dir /absolute/new/probe-output --liquor-source /absolute/frozen-liquor70-source

The builder checks canonical BP fingerprints, copies the exact scripts/assets,
adds console-only opt-in tracing including the exact bounded transaction error, and assigns source-derived diagnostic UUIDs
and a separate 0.0.1 identity. It modifies only the named router scripts and shared transaction error capture, adds
the tracer, and remaps diagnostic BP manifests/dependencies. It never edits
canonical runtime or the published candidate archive. No RP files are bundled.

For the diagnostic test world only:

1. Keep the exact canonical Tavern109 and Liquor70 RPs enabled
2. Disable their original BPs; enable the two diagnostic BPs instead. Never
   run duplicate script owners. Preserve pack order and restart/cold-load
3. Enable tracing explicitly: /tag @s add kaleidoscope_tavern:trace_interactions
   Then clear only the transient diagnostic buffer:
   /scriptevent kaleidoscope_tavern:trace_reset
4. Use a verified virgin coordinate and record a before screenshot. Select a
   Creative stack of empty_glassware, then one Shift/right-click lasting100ms
5. Retain the native console lines prefixed [Tavern interaction trace] and the
   original [Tavern C2] warning, plus the after screenshot and block/item counts
   /scriptevent kaleidoscope_tavern:trace_dump reprints the bounded buffer to
   the console. Extract from the verified client log, for example:
   grep -E 'Tavern interaction trace|Tavern C2' VERIFIED_CLIENT_LOG > trace.jsonl
6. Remove the trace tag and restore the original BP pair after the probe

The trace records original callback source/isFirstEvent, tick, held item/count,
sneak state, clicked block/face, ray target, chosen plan target, duplicate/claim
decisions, native false-event continuation rejection, settlement, and bounded
error name/code/message/stack at the existing generic-warning catch. It preserves
the original warning and exception-return semantics. No error is suppressed. Native button/start/stop observations are passive.
Only the tagged player is logged, with a240-row session bound; no chat/lore or
full payload is collected. Respawning resets the bound. Instrumentation can
change timing, so the result is diagnostic evidence rather than a release pass.

Distinct diagnostic BP UUIDs also isolate Bedrock dynamic-property storage.
Use fresh plain items and virgin locations. Do not manipulate earlier stored
objects or assume their contents/effects/opt-ins transfer into the probe BPs.
Run the resource-only HUD probe on the canonical BP pair first, then cold-load
the tracing BP copies separately. Original pack-scoped world data is preserved.

## 109 residual-warning capture

The builder is pinned to canonical 109/70 and verifies the committed BP trees.
The four router/catch files plus the added logger are the only instrumented host
scripts; the peer changes only its manifest/dependency identity. Do not enable
this replacement BP pair together with either original canonical BP. Keep the
canonical RPs and retain Liquor-before-Tavern order. A fresh copied private world
and virgin coordinate avoid mixing diagnostic dynamic-property storage with
production records. Do not run camera/effect probes during this capture.

Capture `transaction.error` together with preceding `execute.begin`,
`execute.success`, and `claim.settle` rows. A visible cup alone does not prove
whether another transaction failed or a post-commit step threw. The trace is
bounded at 240 rows per explicitly tagged player and resets only on explicit
reset, respawn, or leave. Error strings are bounded (80/160/512/1800 characters);
no inventory payload, lore, chat, or remote transmission is added.

### Empty content-log fallback

The probe writes `console.warn`, including replay; an empty native content-log
file is inconclusive. Before reproducing, with the trace tag enabled run:

    /scriptevent kaleidoscope_tavern:trace_status

This explicit self-only command prints the row count and most recent
`transaction.error` index to both Warn console and the player's chat. If chat
shows status but the file is still empty, reproduce once, run status again, then
retrieve the exact error row (replace N with its zero-based index):

    /scriptevent kaleidoscope_tavern:trace_chat N

Retrieve nearby rows by their index when necessary. Each request returns only
one existing row, split into numbered 600-character chunks, at most 16 chunks.
Oversize rows are explicitly rejected rather than silently truncated. This
fallback never sends chat automatically, writes no Actionbar/title, and permits
only a tagged source player to retrieve their own session. Screenshot the chat
including every numbered chunk. `trace_reset` clears the buffer, so do not reset
until the evidence is retained. These commands are tools-only diagnostic UI.
