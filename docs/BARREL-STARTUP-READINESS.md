# Preserve loaded barrels until installed recipes register

An existing full, closed, unbatched barrel can tick before World Liquor finishes
registering. With water, four wheat and four wheat seeds, the old transition
selects sixteen vinegar bottles; once the same source registers, those inputs
correctly produce four Absolut Vodka bottles. This is a reproduced source
counterexample, not evidence that a player's live barrel was damaged.

At native startup, Tavern checks one World Liquor item definition. If present,
new fermentation without a matching Tavern builtin waits for that source's
successful recipe-cache rebuild, preserving the
same state object, ingredient projection and native inventory. No timeout turns
valid inputs into vinegar. Existing batches continue with their saved recipe,
output and 97 loaded tick cadence. Once registration succeeds, the next ordinary
check starts fermentation. Removing the source restores the wait for new batches.
If the optional pack is absent, standalone Tavern retains its existing behavior.

This preserves the Java assumption that recipe matching sees the installed
recipe set before committing ingredients. It adds no world scan, transport
protocol change, hard dependency or offline fermentation. A broken installed
World Liquor registration intentionally leaves these new barrels waiting;
`pendingBarrelRecipeSources` in the existing diagnostics identifies the source.
Tavern builtin matches keep working because they always precede extensions.
The guard covers this known installed source; it is not
a claim to detect every arbitrary third-party source.

`tools/barrel-recipe-readiness.test.mjs` covers the actual recipe fields,
registration rejection, unrelated sources, removal/re-registration, saved batch
continuation, absent optional pack and genuine vinegar fallback. Native saved
world loading and real client interaction remain separate acceptance evidence.
