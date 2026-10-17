# Tavern 0.6.153

An existing full, closed, unbatched barrel could select vinegar before an
installed World Liquor source registered its matching recipe. Tavern now checks
one known World Liquor item definition at startup and waits for that source's
successful recipe-cache rebuild before starting a new extension/fallback batch.
It preserves the same state, ingredients and native item projection while
waiting. Builtin matches keep their original priority and existing batches
continue from their saved output/time snapshot at the ordinary 97 loaded tick
cadence. Absent optional packs retain standalone behavior; a broken installed
source leaves new batches waiting and appears in existing diagnostics. See
[the exact readiness scope](BARREL-STARTUP-READINESS.md).

The two 65,536-entry board metric arrays are decoded from JSON strings during
module evaluation. Every glyph value, order, array prototype and mutability
remains unchanged. The canonical font generator emits the same representation;
this repair does not regenerate PNG atlases or change rendering/layout rules.
The existing layout check verifies independent T152 full metric digests and the
five horizontal/three vertical alignments.

A guide projection previously scanned each extension page's recipe references
once for names and again for entries. It now reuses the complete linked array
when recipe ID fields and plain page reference arrays are immutable. Recipe
order, names, full pages, recipes and all yield locations remain; dynamic or
opaque tooling views retain their original matching path and accessor reads.
For the same normalized W129 source input, recipe predicate callbacks drop from
10,360 to 5,672 while the full 223-entry guide, revision and 216 messages remain
equal. This measures pure source operations, not native API/engine time. A new
release identity naturally gives its own payload/revision.

Targeted source readiness cases, font/layout checks and immutable/dynamic guide
regressions passed. The full necessary suites belong to the combined source CI;
Bedrock startup, saved-world loading and human UI acceptance remain separate.
The publisher schedule, synchronous registry/transport/ACK, SDK and original
T152 integrity behavior remain unchanged. Remaining watchdog warnings are not
declared resolved and thresholds are not changed.

The paired pack, module, build and guide release identities advance to 0.6.153.
The frozen T152/LIVE source and its original receipts remain unchanged. Native
performance and human client acceptance for this new candidate remain pending.
