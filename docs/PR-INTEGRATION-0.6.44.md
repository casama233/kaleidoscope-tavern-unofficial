# Open PR reconciliation: 0.6.44-beta.1

Reviewed at fixed main `cedfaedf6140bae61b24afb658869b1d0e6ea1a9` and World Liquor `89511c3da4f49463e6ba9e3eb920b18904b51e20`.

| PR | Original head | Integration decision |
|---|---|---|
| #25 | 6ab728c926bc832333a0e9973072516c6c55fb46 | Preserve the newer decorations module, particles and cure adapter, add missing power-presence edge semantics and native placement initialization. Do not resurrect the old competing incense module. |
| #50 | a427c16f55d3a0d5eff08c3f5041832097dfaa70 | Native stool/sofa item placement. Translate cardinal to existing furniture FACING only onPlace; do not remap persisted FACING on tick. This avoids the old branch's different cardinal convention and old-world default-zero ambiguity. |
| #69 | 15155f57d75ead6b73aedb1d509e0afaed6c1b71 | All 64 source-waterloggable blocks are already implemented on main. Preserve newer liquid clipping=true and exact scope; add combined regression, do not restore older generated assets. |
| #88 | e96184327426d61244fac7c6331a041d38976e2a | Integrate launch/splash/instant-health and single-owner impact fixes, preserve Molotov native pick registration and shared effects/foundation. Tipsy camera-only roll remains NOT_RESTORED. |

Thirty new tests run actual exported runtime callbacks through the deterministic engine fixture. Existing 227 tests cover shared foundation, middle-click, effect bar and inventory groups. These are not client/BDS tests. Pure launch source rules and seven pinned Java files are additionally checked in CI. The full runtime before/after ledger is checked against fixed main; original golden hashes remain unchanged. Creative metadata projection remains separately tested and is composed with exact-hash supersession for explicitly reviewed gameplay changes only.

World Liquor 0.1.7 uses the same host core; only version/dependency/build and validation plumbing changed. Neither its recipes nor its stored inventories are rewritten.

## Device acceptance still required
Native middle-click, seat placement/rotation, water visuals, native throw velocity, first/third-person pose and camera appearance. No claim that unresolved original Java parity (camera roll, all LivingEntity custom splash, soul-fire/portal/support) is fixed. Full-world backup required before paired upgrade.
