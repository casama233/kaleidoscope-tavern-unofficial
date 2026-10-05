# 0.6.95: Recover a broken tap only once

Breaking one tap previously returned the scripted recovery item and triggered a second natural destruction drop. The tap dismantle transaction now uses the existing recorded block-removal helper to suppress the recovery callback it already owns. Genuine natural destruction continues to drop one tap; Creative scripted dismantling emits none. Failed removal restores both block and inventory.

Validation:24 tap script regressions pass, including queued and synchronous destruction callbacks, Creative removal and rollback followed by genuine destruction. These are script adapters; no Minecraft simulated players or client acceptance are claimed. Full-family static/BDS/saved-world gates precede the authorized live development update. Existing barrel extraction, metadata, visual feedback and all other current family repairs are retained.

## Public test publication scope (2026-10-05)

This publication packages the exact canonical 0.6.95 BP/RP from main d3470f385a03afdcc9ad240c9fc200752edc61d0. Publication metadata changes do not alter runtime bytes or reuse the version for new content. Complete archive equality and the canonical baseline gate passed; all 24 tap adapter regressions passed. The normal source/static publication checks are required again for the publication commit. These are not rendered-client acceptance.

Tavern works standalone. Its complete-family compatibility lock remains World Liquor 0.1.58, whose BP and RP both declare Tavern 0.6.95. This publication does not release or claim the later L63/L64 candidate.

The newer local development T96–T98 exports are excluded because their exact source was not recoverable after the workspace reset. Consequently this release does not include their shaker HUD/sprite expiry repair, authoritative addon cocktail ingredient tags, full Java liquid-color HUD assets or signature cocktail RGB/blending corrections. The later final shaker metadata/native-frame integration, bounded native Tipsy camera adapter, dimension icon replay and cooperative title-reservation integration are also outside this canonical-main publication. Their historical observations must not be read as acceptance of this archive.

Known limits: shaker progress graphics can persist after release in this baseline; full held-camera/projection and complete Java visual parity remain pending. Optional retained textual ActionBar work is not included. Client acceptance is pending and production readiness is not certified. No live-server deployment is part of this publication.
