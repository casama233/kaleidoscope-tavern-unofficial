# Coherent Tavern 0.6.105 reconstruction

## Scope and provenance

New source WIP from public main efae0c4cfdcf67309744dce42dd2eb350d5eff05.
Historical lost T98/L63 artifacts are not used as input or represented as recovered.
The four prioritized repairs are rebuilt from independently published checkpoints.
All unrelated main runtime files, pack UUIDs and guide navigation remain intact.

The HUD is reconciled by control key: the finite sprite animations are combined
with the complete 51 literal color controls. The color generator changes only
the slot-control array, preserving expiry definitions and progress controls.
Native Mojang HUD root controls and foreign actionbars are preserved.

World Liquor 0.1.58 already declares 56 inputs and 14 addon recipes. A dependency-
only 0.1.66 companion is necessary because its existing BP/RP requires Tavern
0.6.95 explicitly. No additional Liquor gameplay or texture change is required.

## Acceptance boundaries

This aggregate checkpoint is committed and published before extensive aggregate
validation. Individual component checks are historical evidence; the aggregate
must run its own four-repair regressions and canonical CI after publication.
Native BDS load, actual rendered-client play and saved-world acceptance remain
separate. No simulated players are used. No merge, Release or live deployment
is authorized by this reconstruction task.

## Native evidence that changed the reconstruction

A real Minecraft 1.26.52.3 x86_64 client loaded exact public 0.6.102 source
6b966cd668ecd2f01742787bb91192f14366aefa, archive
2170ec307d759ddc768cd0ff5e2447266de3122cd2cc4c11bfd89cb6ada03f5d.
Six command-generated batches covered all sixteen Java HUD color codes and
showed the corresponding three rhombus sprites without transport text. A foreign
actionbar message remained ordinary text. This is bounded protocol rendering,
not actual ingredient or full gameplay acceptance. The pending expiry fix was
absent from that pack.

The same native client rejected the earlier RGB material claim: the successful
existing color_red event still showed white/gray liquid, while glass was
unchanged. This failure requires a fresh 0.6.104 source correction before the
coherent 0.6.105 candidate can be frozen or accepted. 0.6.102 bytes stay immutable.
Detailed sanitized observations are in NATIVE-T102-COLOR-RGB-20261005.json.
No private world or screenshot file is included. Observed HUD screenshots were
tool-only; content logging stayed empty, so no clean-client-log claim is made.

The fresh 0.6.104 native material candidate also failed its exact-pack retest:
archive e65c07048f38a980f70c0acfc2a1ffeafc811b185ab243744d16a448b8ddb41e,
source bc3694e9d4ecab22ab13087e3763165584ef6acf. The red event succeeded,
but liquid had pale-cyan sides and a white/gray top. Both 0.6.102 and 0.6.104
RGB remain unaccepted. The aggregate remains unfrozen while a separate
material/binding diagnostic identifies the next correction. See the sanitized
NATIVE-T104-RGB-FAILURE-20261005.json; neither private world is included.

## Bounded native correction selected for the final candidate

Public source-only PR190, commit
1d9969efc5507541b4f83aae36a7d3c7b6e6c3ea, publishes the reviewed correction
against immutable 0.6.104. Its source patch SHA256 is
39c0dadb5cd12f4fe8b2ee9d166ee3defd7d8c8e522a57b064afce9a20011821.
It is applied to canonical source during integration, never at build/install.
All four target files exactly match the public artifact copies.

The 336-entry shaded Java atlas, geometry, materials, source frames and UVs
are retained. Native-verified query overlay is restored only when palette < 0;
that external fallback is flat-shaded. All 69 core and 56 current addon
descriptors remain within the 250-color reachable subset of the Java atlas.
The source-grounded color_java_red event uses 0xff5555/index300, separating
normal Java color verification from the external pure-red fallback event.
Final aggregate native acceptance remains pending.
