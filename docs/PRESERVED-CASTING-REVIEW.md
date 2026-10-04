# Scoped concurrent casting reconciliation

The observed AMW 2.4.20 repair writes casting durability immediately to the actual
held stack. Candidate preparation may preserve it only through the named
`amw-casting-durability-2420` review profile. This is a local observed repair,
not an official author release. The original approved policy remains immutable.

The review requires exact clean Git preimages matching the approved 2.4.19
receipt, exact observed 2.4.20 inventories, a fixed helper hash, the sole casting
event transformation and paired manifest changes. Other paths and gameplay
changes are rejected. Native first and restart evidence must import the exact
helper bytes, use actual non-player equipment, preserve metadata, and leave all
AMW runtime files unchanged. Only three recorded test-world overlays are allowed.

Concurrent integration manifest drift can use an explicit receipt preimage when
both complete canonical Git runtime trees match the approved receipt exactly and
are ancestors of the separately validated integration history base. The observed
integration delta remains limited to manifest/language files, with identities,
order and reviewed dependency pins checked. This permits later valid canonical
fixes to coexist with an older receipt without importing observed gameplay.

These reviews permit building a new complete family candidate. They do not
approve drift, install files, change the upstream lock or skip static, native,
saved-world, backup or exact-receipt admission requirements.
