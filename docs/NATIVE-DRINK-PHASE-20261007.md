# Native drink-effect API phases — 2026-10-07

Two disposable worlds with the exact existing family and BDS 1.26.51.1 used
real native cows and Script API 2.7.0. Both four-case observations exited
normally, initialized the family, had zero native errors and zero players.
There were no simulated players, production edits, or rendered-client checks.
The preceding first attempt retained one valid lethal observation but stopped
when the next cow health setup exceeded its native maximum of 10; it is not a
successful four-case report.

The sanitized measurements and the two test-only scripts are in
`data/native-drink-phase-capabilities-20261007.json`; world paths, player data,
absolute game ticks and private package logs are omitted.

`addEffect(instant_damage, 1)` left cow health unchanged inside the call and
applied six damage on the next tick (2→0 or 10→4). The hurt/death callback was
also then delivered. `addEffect(instant_health, 1)` similarly healed 2→6 only
on the next tick. Poison of duration 1 did not damage during these two ticks.

Speed and poison of duration 0 each threw ArgumentOutOfBoundsError, bounds
1..20000000. The official Entity documentation currently states a lower bound
of 1 in its parameter bounds but 0 in the prose; these actual native results
resolve that ambiguity for this engine/API pair. No duration 0→1 clamp is
installed as a purported source equivalent.

`applyDamage(6, {cause: magic})` changed health 2→0 within the call, and directly
setting health to its current value plus four changed 2→6 within the call.
These observations identify possible tools for a future instantaneous adapter;
they do not prove Java armor/resistance/absorption, undead inversion, damage
attribution, cancelled hooks, player deaths, or healing-hook equivalence.
The current drink repair restores dispatch/container order while native instant
execution remains a concrete separate bug.

Primary API reference: [Entity.addEffect and applyDamage](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entity?view=minecraft-bedrock-stable#addeffect).
