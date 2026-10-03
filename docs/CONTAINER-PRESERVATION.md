# Native custom-container preservation

An author upgrade can load without script errors yet delete a previous native
`DataDriven` block inventory when the new block definition omits its container.
Saved-world rehearsal now compares every nonempty native custom-block inventory,
including complete typed item NBT, after first load and restart. Player record
hashes remain a separate requirement. Test-only ticking areas load recovered
positions; no simulated player or client acceptance is claimed.

An optional external `container_recovery_plan` contains SHA256-pinned historical
NBT records and provenance. Recovery runs on the latest stopped snapshot copy,
requires the original freezer identifier at each position, and rejects nonempty
conflicting inventories. Only those records are changed; sibling block entities,
player records and every unrelated LevelDB value remain byte-exact. Deployment
applies the same rehearsed result to a staged copy of the fresh stopped database,
retains the original database for recovery, and does not restore old chunks or a
whole historical world. Once recovery begins, failure keeps the compatible
candidate stopped; it cannot restart the incompatible previous runtime.

A scoped author extension may add a native 54-slot container and an empty loot
table to the six pinned ChineseFood freezer definitions. The algorithm and exact
host declaration belong to a versioned canonical integration. Original archive
identity, file hashes, expiry and author-feedback metadata remain required.
`minecraft:block_entity` in a permutation is unsupported by the measured engine
and is rejected. Both halves currently have 54 slots; Java's upper 36-slot capacity
remains an explicit client/mechanics parity gap.

An optional `translation_reconciliation` can preserve a reviewed local integration
language delta during a new build. It cannot add/remove old files, change gameplay,
change UUID/dependencies, reorder packs or approve the drifted old receipt. Observed
language bytes must survive in the new canonical source. Added restorations are
language-only. A changed private integration also requires `extension_validation`
bound to its commit, baseline, exported files, append-only release check and native
functional/inventory logs. These external inputs are pinned in build evidence;
public PR checks never certify private runtime changes.

Plans and private evidence stay outside this public repository. Each candidate
still requires full-family static, exact native loading, fresh stopped-world
rehearsal, family guard admission and the standing live-development authorization.
`client=false`, `production_ready=false`, and `pending_client_acceptance` remain
until the owner performs actual client testing.

`preserve_captured_experiments=true` selects the already enabled feature flags
from the hash-pinned captured level metadata for the empty QA world. It cannot
supply or enable new flags and never writes the live level. Native reports record
the exact inherited flags and cache validation checks their captured values.
Default QA continues to clear all experimental flags. Native custom containers
require the target world's existing Upcoming Creator Features setting in the
measured engine; a blank world with that setting cleared is a different scenario.
