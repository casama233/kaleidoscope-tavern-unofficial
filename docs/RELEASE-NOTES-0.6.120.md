# Tavern 0.6.120

Bottle, cocktail and signature completion follows the current NeoForge 1.2.0
source dispatch order: capture the actual use entry, roll and dispatch every
effect, then examine the current Creative state and fresh inventory to shrink
the original drink and return its container. An initially stale use entry
performs no RNG, effect, juice cure or container operation.

The last Survival drink returns its container to the current logical mainhand;
stacked Survival debits its original slot. Creative gives the container without
requiring the original slot to remain after the effects. A changed/missing
original Survival stack is explicitly unresolved; no same-ID item or nearby
drop is guessed, no pre-effect bag restored and no effects replayed.

Successful inventory insertion plays the original Java pickup sample, with two
24-bit float draws and source float pitch after effect dispatch. Overflow uses
the existing shared y+0.5, (0,0.2,0) drop and pickup guard, without an extra block
sound. The shared guard still differs from Java's loaded-item tick and merge
delay semantics. Shared native RNG state also remains unimplemented.

Native capability observations confirm queued instant damage/heal on the next
tick and rejection of zero-duration native timed effects. They identify direct
same-call health/damage APIs for later adaptation; they do not install or prove
complete instant, armor, undead, hook or player death parity. Per-entry engine
rejection is kept bounded and does not create a reusable partially effective
drink. See DRINK-COMPLETION-LIFECYCLE.md and NATIVE-DRINK-PHASE-20261007.md.

The exact complete family is assembled only after matching dependency releases
merge and pass static/native/fresh stopped-world admission. Human comparison
follows the standing-authorized live development update; client=false and
production_ready=false until actual acceptance. No UI spam is added.
