# Tap/shaker effect baseline and regression diagnosis

The public 0.6.74 runtime contains source-backed effect feedback. A server's
numerically newer private version is not evidence that it includes these fixes.
Do not overwrite a saved world or replace private pack UUIDs merely to make the
version label match. Resolve provenance and migration separately.

## Required public source chain

- `runtime/BP/scripts/core/effect-feedback.js`: effect definitions, counts/timing
- `runtime/BP/scripts/bedrock/effect-feedback.js`: emitter adapter and Molang vars
- `runtime/BP/scripts/bedrock/machines.js`: tap extraction/drip lifecycle
- `runtime/BP/scripts/bedrock/tap-sources.js`: successful source-tap completion
- `runtime/BP/scripts/bedrock/immersion.js`: shaker insertion and cocktail effects
- `runtime/BP/scripts/bedrock/mixology.js`: pour completion calls
- `runtime/BP/scripts/bedrock/feedback-diagnostics.js`: failed API request visibility
- `runtime/RP/particles/{water,lava}_tap_drip{,_child}.json`, `fx_bubble_pop.json`,
  `fx_spell.json`, `fx_wax_off.json` and their private feedback texture atlas

Public source: tap completion emits 10 wax-off particles; inserting into the
shaker emits 8 bubble-pop particles; cocktail pour emits 20 spell particles.
Extraction has 30 ticks and drip timing/kinematics are source-backed. A diagnostic
with zero API failures does **not** prove the client drew particles.

The drip implementation history includes `3ced3c4` (Java-backed dynamics/atlas)
and `2f9c674` (valid Molang assignments and generator guards). These particle files
were not changed by the later bridge normalization or Grilling held-pose repair.

## Verify before assigning a cause

1. Identify actual world pack UUIDs, versions, order and loaded BDS version.
2. Resolve one immutable GitHub Release and its source commit. Compare every
   installed file with its exact artifact, not just manifests or a version string.
3. Use `tools/family_bundle.py audit --world WORLD --receipt RECEIPT` to detect
   changed/missing/extra files and mismatched world pack references. A receipt for
   another candidate is not a deployment acceptance record.
4. If files differ, identify the process/session that wrote them. Do not run two
   updaters concurrently or assume a missing helper means the alternate runtime
   has no equivalent implementation.
5. Preserve a current backup and validate saved-world migration before replacing
   private implementations. Never restore an old world over new player progress.
6. Recheck installed hashes after restart. Then exercise tap/shaker in an actual
   client with the matching resource pack; distinguish server request success,
   client content-log errors, cache state and rendered pixels.

A read-only deployment comparison on 2026-10-01 found a divergent implementation
and a mixed BP/RP release pair in the family. That establishes content divergence,
not the exact commit responsible for a perceived visual regression. No private
source or machine-specific log is included here, and this note does not claim the
live effects are repaired.
