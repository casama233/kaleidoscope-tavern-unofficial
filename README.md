## Current maintained baseline: 0.6.136

[T136 repair scope](docs/RELEASE-NOTES-0.6.136.md) retains the T134/T135 ingredient, transaction, visual and immersion repairs and corrects native aura ownership tracking when an entity's effect countdown pauses while system ticks advance. T135's failed canonical run and completed earlier scenes remain recorded; they do not certify the new T136/W113 candidate. New CI, paired native first/restart, publication, human-client and LIVE acceptance are pending.

# Kaleidoscope Tavern (Unofficial)

A Bedrock port of [Kaleidoscope Tavern](https://github.com/KaleidoscopeMods/KaleidoscopeTavern), with standalone brewing, cocktails, storage, furniture and a shared seven-section Tavern guide. [繁體中文](README.zh-TW.md).

## Current source and requirements

- [T132 repairs](docs/RELEASE-NOTES-0.6.132.md) share instant splash dispatch and source immunity, repair shaker input echoes and storage rollback, preserve Vision's living recipients and query order, and add scoped guide flipbooks, board escaping and shorter HUD expiry. [Current PR disposition](docs/audit/PR-DISPOSITIONS.md) is the single backlog index; native/client/live acceptance remains separate.
- The current public-family candidate is Tavern **0.6.136**, World Liquor **0.1.113** and Grilling **2.8.119**. The [family lock](family/upstream.lock.json) and immutable CI peer commits define the candidate; the index preserves remaining workstreams and earlier evidence.
- [baseline.json](baseline.json) owns package identity and exact dependencies; [CHANGELOG.md](CHANGELOG.md) records changes.
- Bedrock 1.26.50 or newer; current load target BDS 1.26.52.3.
- Enable both Tavern BP and RP. Cookery is optional; the reviewed family target is author Cookery1.6.0. World Liquor uses its exact paired Tavern version.
- Use canonical source/releases, keep a world backup and remove duplicate older Tavern packs before an upgrade. Private integration is a separately identified addon; it is not a different Tavern runtime.

## Build

Python3.12+, Node22+ and Pillow11.3.0 are required for the existing validation tools.

```sh
python3 tools/build_release.py
```

The current builder directly packages committed runtime/BP and runtime/RP into dist/. It needs no historical artifact, private server directory or gameplay patch. Source generators are explicit authoring tools; they are not normal packaging steps.

## Verification

Use existing targeted checks for the behavior being changed; canonical CI owns the full required suite once. [TEST-AUDIT.md](docs/audit/TEST-AUDIT.md) distinguishes original Java oracles, production conservation/rollback, real BDS persistence and build prerequisites. [PARITY-MATRIX.md](docs/PARITY-MATRIX.md) records actual scope; [BUGS.md](docs/BUGS.md) gives reproduction scenes.

Package/source integrity and BDS loading do not certify client visuals, sound or the entire player flow. Current human acceptance remains pending. Owner rules and deployment authorization are unchanged; [proposed revisions](docs/audit/RULE-PROPOSAL.md) require approval.

## Known limits

Exact player-camera roll remains unimplemented; the optional yaw adapter requires explicit opt-in and does not move aim by default. The stable camera API has three-axis animation through the free-camera route, but additive roll preserving native first-person view, aim, hands and other packs' camera ownership is unproven. Machine ingredient clones and supported portable stackable metadata are implemented, while three arbitrary decorated nonstackable shaker inputs remain rejected intact. Source-shaded RGB, board outlines and status particles require actual client comparison. Through-wall outlines, native multiline editing, dropped-shaker display contexts, native reach/step-height/XP pickup, target clearing and some effect/event semantics remain incomplete. The [isolated multiline diagnostic](tools/client-parity/README.md) is a test candidate with new diagnostic pack identities, not an enabled production editor or client acceptance. The T136 notes retain the precise source, engine and client boundaries.

## Retained T133 baseline statement

The following statement records the earlier T133 candidate and its pairing. Current integration and PR status are recorded in the T136 scope above.

- [T133 storage correction](docs/RELEASE-NOTES-0.6.133.md) compares finite XYZ coordinates independently of native object key order. It depends on PR297, retains its rollback repairs and awaits client acceptance; the reviewed family pairing below remains unchanged.

## Licensing and history

Original Tavern code is BSD-3-Clause; original/derived art is CC BY-NC-SA4.0. Fonts and other assets retain their own notices. See [CREDITS.md](CREDITS.md), LICENSE-CODE and LICENSE-ASSETS. Historical install/download instructions are preserved in [the archive](docs/archive/pre-reorganization-README.md), not current requirements. Open the root config.json for bridge authoring; see [BRIDGE-WORKFLOW.md](docs/BRIDGE-WORKFLOW.md).
