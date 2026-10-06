# Tavern 0.6.113 development draft

This is a selective repair draft based on canonical main
`ea0648434a1799e076dbdf210cac3a8b10d7e987`. It is not a published release,
live deployment or complete Java-parity certification.

## Scope and provenance

- Restore only the shared interaction routers and effect-icon UI repairs from
  `a4581c006896d26e6bdd89cd93150bc851603790` (the 0.6.110 source checkpoint).
  The source includes the bounded pending/settled callback repairs from
  `e596b958ee3217376b9536e72dd14038504365d7`, the continuation/UTF-8 correction
  from `5a128ed353ea1198ea913796fac145275d56188a`, and the owned Sneak-transition
  continuation correction in `a4581c0`. Do not merge PR #195 wholesale.
- Placement, storage and protected break coalesce matching queued callbacks;
  failed writes release their claims for retry. Owned item-use/false continuation
  echoes survive modifier changes for the existing two-tick window. Fresh
  authoritative callbacks, foreign cancellations, distinct targets and native
  metadata retain their existing semantics.
- All 288 Tavern effect images explicitly resolve the sibling packet cache.
  Title capture compares the full 18-byte formatting prefix. The generator and
  UI regressions enforce those exact rules while preserving the pinned Mojang
  native HUD root and typed optional addon panels.
- Family update assembly now carries the reviewed captured BP/RP order through
  world references, effective definition priority and the complete receipt.
  A separately declared canonical author UUID migration replaces its old entry
  in place and still requires full existing archive/manifest/ownership validation.
  Unknown, missing, duplicate or wrong-side identities fail closed.
- Current universal mixology/category/lore changes and the Java ordinary-item
  RESET behavior remain byte-identical. No 0.6.111/0.6.112 visual-shake code,
  motion assets or obsolete release metadata is imported. Existing motion
  remains unchanged and is not claimed accepted by this repair.
- Reserve a fresh 0.6.113 source identity and coordinate the World Liquor
  0.1.73 development draft. Existing release-history entries remain unchanged.

## Checks

Focused source tests passed: 20 shared interaction regressions, 7 effect-icon
regressions, 5 UI contract tests, 10 family-bundle tests, 13 identity-migration
tests, 10 preserved-addition tests and 1 candidate order handoff test.
The authored HUD generator check and pinned 29-control native-root preservation
audit passed. These are source/API-double/structural tests, not native players
or rendered-client acceptance. Baseline identity and exact export checks are
recorded separately for the final committed candidate.

## Mandatory blockers

The owner explicitly approved local repair and Git draft preparation on
2026-10-06 at 12:33 UTC before the unavailable BSM Java-upstream status can be
read. Current `family/java-upstream.json` was read; the current BSM
`addon_quality/senluo-java-upstream-status.json` remains unavailable and was
not fabricated, replaced or marked passed.

Reading that current status and refreshing stale/failed author-release checks
is still mandatory before merge, release or deployment. Review each maintained
Minecraft/loader branch separately. Historical Forge fixtures establish only
the disclosed partial source scope. Full new-family native loading/restart,
fresh saved-world migration, canonical/BSM admission and human client acceptance
remain distinct gates. No release/tag, policy write or live change is authorized
by this draft. Keep client=false and production_ready=false.
