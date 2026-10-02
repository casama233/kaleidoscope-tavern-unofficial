# Tavern 0.6.89 — ambient sampling and XP attraction fidelity

Sparse ambient emitters now use the exact categorical distribution of Java's 667 paired display-tick trials, preserving repeated hits and near/far event order while skipping misses. One nearby emitter averages about 2.3 random draws per viewer tick in the deterministic benchmark, down from 8,004. Scenes with more than 32 reachable emitters retain the original sampler. This is an algorithm benchmark, not a claim that native server lag has been resolved.

XP Drain now measures attraction speed from the player's feet while aiming half a block higher, and uses the source's inflated player bounding box. Orbs near the top/side/corner are no longer missed and the first 128 query results no longer starve later orbs. Native orb identities and XP values remain intact; Java's immediate pickup cooldown reset still has no Bedrock adapter.

The comprehensive [source and immersion audit](JAVA-IMMERSION-AUDIT-20261003.md) separates confirmed behavior, actual differences and pending client checks. Source regressions and release packaging do not certify client rendering. No simulated players were used.
