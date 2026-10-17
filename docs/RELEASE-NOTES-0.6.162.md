# Tavern 0.6.162 — readable HUD transport and layered client probes

The owner confirmed that T161/G134 still display neither custom UI. This candidate changes the shaker packet from formatting codes to bounded ASCII tokens that survive formatting removal. Only owned KT_HUD!/KG_HUD! native titles are suppressed; ordinary titles, Actionbars, subtitles, foreign HUDs, all original textures and gameplay remain preserved.

Manual operator packets KT_HUD!D; and KG_HUD!D; reveal UI MOUNT, KT/KG ROOT and each channel CACHE. Normal packets never show the probes. Send the matching END; after the probe. These are real-client diagnostic signals, not automated client acceptance.

Targeted packet, graphics, cancellation, timeout, atlas and bridge checks passed. Full CI, saved-world admission and LIVE readback are required before deployment. Actual cause and rendered recovery remain subject to the layered client observation; no complete Java/client parity claim.
