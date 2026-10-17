# BDS performance repair: effect snapshot delivery

Source preimage: Tavern ececd2a0; runtime source is the admitted T167 implementation. Candidate: T168. This is source/script evidence, not BDS wall-clock or rendered-client/RTT acceptance.

The production foundation publisher sent eleven empty snapshots per recipient/source over 100 idle ticks (one initial plus ten heartbeat refreshes). Empty snapshots grant no effect lease. The unchanged consumer immediately returns no effects for empty rows and expires snapshots after twenty ticks.

T168 sends one initial/transition clear, suppresses repeated empty state, and avoids recipient enumeration when no effect descriptor exists. Nonempty state retains the original five-tick publisher cadence, ten-tick heartbeat window, sequence/chunk framing and twenty-tick receiver TTL. Cache publication follows successful send: a failed clear is retried next pass. Already-cleared departing recipients do not emit another clear.

Targeted production-adapter regression: eleven idle packets become one; active 200 -> 195 ticks still publishes; rejected clear retries on the following five-tick pass; successful clear and unload remain quiet. Existing cross-pack owner-property isolation regression also passes. The required PR CI runs the complete existing suite; no simulated player or Minecraft client was used here.

Audit scope: custom-status loops already share same-tick snapshots and index fast recipients; ambient particles already spatially index emitters; storage visuals retain reconciliation and ownership checks; mixology keeps its original per-tick view/interaction timing. Those mechanics were not slowed to manufacture a performance result.

BDS 1.26.52.3 configuration inspection found view-distance8/tick-distance4, Snappy compression threshold512, movement/dismount/entity-interaction strict flagsfalse and position acceptance0.5. These settings were retained. A short native script profile was captured on the pre-fix LIVE stack with two real connected players; API command success alone is not profiling/latency proof, and workload differences prevent attributing overall CPU deltas to this patch. Sanitized LIVE/profile/deployment results are committed separately to the private integration evidence index, bound to the actual installed and Git revisions.

Official references: [BDS properties](https://learn.microsoft.com/en-us/minecraft/creator/documents/bedrockserver/server-properties?view=minecraft-bedrock-stable), [system scheduling](https://learn.microsoft.com/en-us/minecraft/creator/documents/scripting/system-run-guide?view=minecraft-bedrock-stable), [script profiler](https://learn.microsoft.com/en-us/minecraft/creator/commands/commands/script?view=minecraft-bedrock-stable). Full Java parity and client acceptance remain pending.

PR378's [first CI run](https://github.com/casama233/kaleidoscope-tavern-unofficial/actions/runs/38736947788)
retains two tooling failures: catalog selected W145 against the W146 family
lock, and package's historical launch guard rejected the newly reviewed
foundation bridge. Current validation now pins W146/G144. The appended test-only
T168 review reverses this one bridge file only after comparing its complete
bytes to immutable T167 `ec856cca4186220e2acf5741e7e0dc8ca4363b0f` and frozen
T168 `4e549925509f3ab3e8521485a0e14b5d66f218a9` Git sources. Extra lines and
coordinated ledger checksum changes still fail. The original historical guard
and all earlier ledger entries remain unchanged; packaging uses current runtime.
