# Tavern 0.6.119

Cocktail and signature-cocktail completion now use the current Java 1.2.0
24-bit `nextFloat` domain and float probability values. A draw at a JSON
decimal boundary no longer produces a different result solely because the
Bedrock script compared higher-precision doubles.

Bottle completion now draws and dispatches each selected effect before drawing
the next entry. Earlier effect callbacks can consume random draws without
being moved after all bottle probability decisions. The existing array API
remains available to potion builders. See COCKTAIL-EFFECT-ROLL-20261007.md for
source references and counterexamples executed through actual completion
adapters.

The last Survival drink now returns its empty bottle, cup or bucket directly
to the hand. Existing container stacks elsewhere no longer absorb this
container and leave the hand empty. Stacked/Creative returns and the broader
container/effect lifecycle remain separately reviewed boundaries.

Juice buckets now remove default vanilla Poison before returning their bucket,
following the current NeoForge HONEY cure. Unrelated, fatal-poison and custom
effects are preserved. Mutable instance cures, cancelled Java cure events and
arbitrary custom cure registries remain unimplemented platform adapters.

This repair applies to Tavern's shared host, including registered World Liquor
and other addon cocktails, and keeps standalone operation. It adds no HUD text
or interaction announcement. World Liquor 0.1.84, Grilling 2.8.85 and the
retained private integration remain the family pair for this candidate.

The native random generator's shared state, container/effect ordering, instant
external dispatch phases and real drinking/client presentation remain separate
open fidelity requirements. Source/API tests do not prove full Java parity.
Complete remote PR/check/merge and family static/native/fresh-saved-world gates
precede the authorized live development update; client=false and
production_ready=false until dot's actual client acceptance.

The native custom-component entry discards its SDK parameters object before
calling completion. The registered-entry regression confirms that this object
cannot replace the effect RNG. The rejected local 0.6.118 freeze was never
installed; its immutable history is retained separately.
