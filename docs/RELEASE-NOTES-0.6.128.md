# 0.6.128: release boundaries and carried shaker preservation

Every installable archive and complete-family assembly now requires the frozen
runtime identity and append-only release history, including ordinary CI builds.
Development-only structural checks remain available without exporting a pack.
The ordered startup tables from PR284 retain the reviewed registration and event
installation sequence; existing validation executes that entrypoint body against
isolated imported interfaces instead of requiring old call-format strings.

Carried shaker transitions clone the current native ItemStack. Completing a shake
or serving a cup preserves its name, foreign dynamic properties and custom lore.
Only exact Tavern-generated ingredient lore is refreshed. Releasing before the
first valid mixing checkpoint leaves the carried item and raw state completely
untouched and publishes no inventory write. Current live-registry recipe/effect
resolution, recipe timing, one-time settlement and transaction rollback remain.
This is the remaining item-preservation portion of PR167; its arm-Y repair and
PR247 framing already belong to T127 and are retained.

Targeted source regressions cover duplicate use signals, metadata across
completion and serving, and write/serving rollback. Release-gate regressions use
real temporary Git repositories and reject clean but unfrozen installable output.
The canonical CI validates the final revision. These are source/API-fixture
checks, not new BDS persistence, rendered client or LIVE acceptance.

T128 uses fresh BP/RP/module/guide/build identities with unchanged UUIDs. World
Liquor must use its new exact T128 pairing before a complete-family update.
Native family loading, the fresh stopped-world rehearsal and family_guard still
precede the standing-authorized luosen deployment. This workspace has no BSM or
live-world connection; client=false and production_ready=false remain in effect.
