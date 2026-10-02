# Tavern 0.6.88 — native HUD root recovery

Repairs the paired World Liquor UI hook after the owner's actual client reported the complete HUD missing. World Liquor 0.1.52 provides a fully typed panel in its own namespace; Tavern mounts it through a unique optional variable with a typed empty default. The addon no longer registers a replacement of the native HUD root.

The new regression rejects the reported broken definition and preserves the pinned Mojang root type and 29 controls. Tavern-only operation remains self-contained. Original icon sprites, optional text defaults, effect lifecycle and guide entrances remain unchanged.

Native/server checks do not render the client interface. Human confirmation of the restored HUD and icons remains pending; no simulated players are used. See [cause, repair and verification scope](HUD-ROOT-RECOVERY-20261002.md).
