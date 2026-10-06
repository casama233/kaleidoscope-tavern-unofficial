# Tools-only native interaction trace

The frozen 0.6.107 source passed API-double regressions but the controlled real
0.6.107 / 0.1.68 client still placed two cups and reported SPACE_NOT_CLEAR from
a single short Creative click. Do not release or call the native issue fixed.

Build from the committed source:

    python3 tools/diagnostics/build_interaction_trace.py --out-dir /absolute/new/probe-output --liquor-source /absolute/frozen-liquor68-source

The builder checks canonical BP fingerprints, copies the exact scripts/assets,
adds console-only opt-in tracing, and assigns source-derived diagnostic UUIDs
and a separate 0.0.1 identity. It modifies only the named router scripts, adds
the tracer, and remaps diagnostic BP manifests/dependencies. It never edits
canonical runtime or the published candidate archive. No RP files are bundled.

For the diagnostic test world only:

1. Keep the exact canonical Tavern107 and Liquor68 RPs enabled
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
decisions and settlement. Native button/start/stop observations are passive.
Only the tagged player is logged, with a240-row session bound; no chat/lore or
full payload is collected. Respawning resets the bound. Instrumentation can
change timing, so the result is diagnostic evidence rather than a release pass.

Distinct diagnostic BP UUIDs also isolate Bedrock dynamic-property storage.
Use fresh plain items and virgin locations. Do not manipulate earlier stored
objects or assume their contents/effects/opt-ins transfer into the probe BPs.
Run the resource-only HUD probe on the canonical BP pair first, then cold-load
the tracing BP copies separately. Original pack-scoped world data is preserved.
