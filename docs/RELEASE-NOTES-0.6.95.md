# 0.6.95: Recover a broken tap only once

Breaking one tap previously returned the scripted recovery item and triggered a second natural destruction drop. The tap dismantle transaction now uses the existing recorded block-removal helper to suppress the recovery callback it already owns. Genuine natural destruction continues to drop one tap; Creative scripted dismantling emits none. Failed removal restores both block and inventory.

Validation:24 tap script regressions pass, including queued and synchronous destruction callbacks, Creative removal and rollback followed by genuine destruction. These are script adapters; no Minecraft simulated players or client acceptance are claimed. Full-family static/BDS/saved-world gates precede the authorized live development update. Existing barrel extraction, metadata, visual feedback and all other current family repairs are retained.
