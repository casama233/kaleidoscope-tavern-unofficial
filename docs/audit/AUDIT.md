# Tavern / World Liquor reorganization audit

This is Phase 0 of the owner's supplied reorganization brief. It audits actual
source rather than adopting the brief's hypotheses as findings. Gameplay,
AGENTS rules, existing PRs and LIVE were not changed by this audit.

## Source and evidence boundary

| Source | Audited revision | Version |
| --- | --- | --- |
| Tavern | `ac4932b4001ab5be95cc471a179ceaef827e2dcc` | 0.6.126 |
| World Liquor | `56314bac4683fd9ff5b4dd727b2c2ad691e83c5f` | 0.1.103 |
| Grilling, outside this audit's repair scope | `6fc3ab711e90ae9f23739b18b1f28ef5f31bbf8a` | 2.8.114 |

The installed family at the audit boundary is T126 / W103 / G114 / private
integration 1.0.30 / author Cookery 1.6.0. The existing deployment readback
reports normal startup, preserved saved data and `client=false`. It establishes
the installed candidate, not Java gameplay or rendered equivalence.

Evidence levels used below: L0 means inspected source/content; L1 means executed
source logic with an identified oracle or invariant; L2 means a stated real-engine
scenario; L3 means a paired real-client rendering/interaction observation.
These levels apply per behavior, not to an entire release.

## Clean build reproduction

Fresh tracked checkouts, with no dist or node_modules, used Python 3.12.3 and
Node 22.23.3. Both current `python3 tools/build_release.py` commands exited 0;
tracked source remained unchanged. They produced the maintained T0.6.126 and
W0.1.103 mcaddons. No obsolete generator, private builder, live world or old
artifact supplied gameplay bytes. Package integrity is a release boundary, not
an A–D functional result. Existing successful gameplay CI was not rerun locally.

World Liquor's packager does **not** require an adjacent Tavern checkout. Its
validation and authoring generators do: `tools/check_release.py` accepts
`TAVERN_ROOT`, otherwise `../tavern-src`. The README's first two build commands
are authoring mutations: `build_storage_visuals.py` writes seven runtime files;
`rebuild_guide.py` writes the guide payload and a versioned report. They were
inspected, not executed. Normal packaging and optional source generation need
separate instructions.

## Seven hypotheses

| Brief hypothesis | Finding | Evidence and implication |
| --- | --- | --- |
| H1: almost only static/fixtures, little Java truth | Partly contradicted | Original-class JVM mixology and JDK RNG oracles exist. Real BDS native storage persistence tests also exist. Some JVM vectors target development copies rather than production. See TEST-AUDIT.md. |
| H2: large scripts with unclear boundaries | Partly supported | T already has data/core/bedrock layers; no static relative-import cycle was found in either repo. T has one core module importing the engine and two data→core imports. Prefer bounded repairs to a rewrite. |
| H3: scattered state and runtime UUID migration | Mixed | Several state roles and legacy data handoffs exist. Author UUID migration is in offline family deployment tools, not daily JS gameplay. Different storage roles are not inherently conflicting. |
| H4: fragile HUD routing with low value | Not established | Queue, observed embedded-router and standalone transports exist, with bounded packets. The owner's effect-icon request gives this player value. Actual coexistence needs client tests; removal is an explicit tradeoff, not an audit result. |
| H5: three large Cookery compatibility implementations | Partly contradicted | A concentrated 153-line publisher retains the old eight-by-512 budget for API-v1 hosts, including 1.6.0. This is a current compatibility constraint, not three parallel implementations. |
| H6: upstream assets / attribution concerns | Concrete packaging gap found | W tracks derived Java assets and documents source references, but its current mcaddon contains no license/notice/credits files. Its own code license is MIT; copied Tavern code is BSD-3-Clause. Do not relabel everything BSD. |
| H7: downloads binaries and repository growth | Supported, bounded | Each repo tracks one historical mcaddon, roughly 4.7 MB / 6.7 MB. Remove obsolete binaries from the current tree after preserving Release availability; a history rewrite is unnecessary. |

## Architecture and persistence

T has 151 runtime JS files / 20,888 lines, including 13,291 data lines, 4,851
Bedrock-adapter lines and 2,649 core lines. W has 48 / 11,674; payload/content
account for 8,783 lines. Large generated catalogs must be distinguished from
handwritten logic. The static relative-import graphs contain 518 and 60 edges
and no strongly connected cycles. This does not prove runtime script-event
coupling is absent.

T `core/break-feedback-engine.js:2` imports Minecraft; its engine role should
move to the adapter layer. W `foundation.js:4` already delegates storage and
effect lifecycles to the host. Data-oriented addon architecture is partly present.

The inventory covers T71 / W31 dynamic-property write sites. Roles include world
registries, player preferences/effects, item metadata, render markers and native
entity containers holding full ItemStacks. Legacy transfer in T
`core/extension-storage.js:42` and W `sdk/tavern-foundation-client.js:36` uses
acknowledgement before retiring unchanged data. Remaining repeated legacy scans
deserve bounded migration work. UUID ownership migration is separately in
`tools/family_update/identity_migration.py`; do not move it into gameplay.

## Current source versus private deployment

Current owned Tavern and World Liquor are deployed from their public canonical
Git revisions. The private integration is a different identified addon, not a
private fork of these runtimes. Public-source equivalence does not require
publishing third-party private scripts or merging them into public tags.
Historical 0.6.44/45 documents are historical evidence, not proof of current
branch divergence. Their labels should leave the current README.

## Findings to implement after Phase 0

1. Replace mixed-era READMEs with current requirements, direct package commands,
   classified verification and known limits; move history to the changelog/archive.
2. Include W's existing code/assets/third-party notices in its shipped packs;
   correct the obsolete statement that Cookery is mandatory. This changes exported
   content and needs a fresh release identity under current rules.
3. Replace the actual tautological shaker-selector assertion and connect Java
   numerical vectors to production functions. Retain valid metadata-conservation
   and real BDS persistence tests. Integrity checks belong in a separate lane.
4. Resolve unmerged useful PR fragments by fresh backport, not whole old packages.
   See PR-DISPOSITIONS.md; no old PR was merged or closed during the audit.
5. Maintain one PARITY-MATRIX and BUGS list per repo. Existing historical evidence
   remains immutable; new rows reference it with revision and scope.

## Source baseline and platform decisions

Current maintained author references are Tavern1.2.0 Forge1.20.1 and
NeoForge1.21.1; W1.1.11 NeoForge1.21.1 is reviewed. The metadata watcher also
reports newer/unadapted W Forge1.1.12 and a separate 26.1.2 branch. Freeze a
single active slice's comparison source by owner decision; do not erase those
gaps or silently revoke the current upstream-tracking rule.

Stable SDK2.7.0 has `Camera.playAnimation` and `RotationKeyFrame.rotation:Vector3`.
The [official camera API](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/camera?view=minecraft-bedrock-stable)
and [free-camera example](https://learn.microsoft.com/en-us/minecraft/creator/documents/camerasystem/freecamerascriptapitutorial?view=minecraft-bedrock-stable)
support investigation of three-axis animation. They do not establish a Java
player-camera roll overlay with unchanged aim, hand rendering and perspective.
The current runtime still changes yaw. Reopen this as a concrete client experiment,
rather than declaring all stable camera roll impossible.

The engine-line GameTest package `1.0.0-beta.1.26.51-stable` exists; its beta
designation is not a stable-API guarantee. Microsoft's
[SimulatedPlayer documentation](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-gametest/simulatedplayer?view=minecraft-bedrock-experimental)
warns that item-use events may differ from real players. Therefore simulated
players cannot be the sole acceptance path even if the owner permits isolated
engine tests. No simulated player or new BDS world was run in Phase0.

## Next slice and pending decisions

Prefer T1 (grapes→juice→barrel→bottle→drink→reload), then T2's color/hand/UI
matrix, then W1's bottle/storage/freezer path. Each uses original-source values,
transaction conservation and real-engine persistence; visuals and sound require
paired clients. Do not expand into all effects before those paths are inspectable.

RULE-PROPOSAL.md is a reviewable proposal, not an effective replacement for
AGENTS. It covers isolated test players, slice deployment cadence, source freeze
and repository layout. Work permitted by current rules can continue meanwhile;
operations depending on an unapproved rule change remain pending.
