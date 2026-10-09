## Current maintained baseline: 0.6.141

T141/W118 retains the published T140 guide, including all four reviewed AMW pages, seven sections and both shared entrances. It repairs board separator wrapping, native metadata and fresh-quantity shaker gestures, and World Liquor's familyless living-entity classification. Earlier native parity repairs and G122 integration remain intact. See the [release notes](docs/RELEASE-NOTES-0.6.141.md); the fresh integrated native first/save/restart and strict recorder passed. Full CI runs with this repair PR; client, private full-family and LIVE verification remain pending.

# Kaleidoscope Tavern (Unofficial)

A Bedrock port of [Kaleidoscope Tavern](https://github.com/KaleidoscopeMods/KaleidoscopeTavern), with standalone brewing, cocktails, storage, furniture and a shared seven-section Tavern guide. [繁體中文](README.zh-TW.md).

## Current source and requirements

- [T140 guide revision](docs/RELEASE-NOTES-0.6.140.md) retains all three languages and preparation details on demand, adds four reviewed AMW pages and shares the view through the optional Cookery entrance. T141 preserves this published guide and T139's native clock/reload, machine ingredient, Mob selection and immersion repairs.
- [T132 repairs](docs/RELEASE-NOTES-0.6.132.md) share instant splash dispatch and source immunity, repair shaker input echoes and storage rollback, preserve Vision's living recipients and query order, and add scoped guide flipbooks, board escaping and shorter HUD expiry. [Current PR disposition](docs/audit/PR-DISPOSITIONS.md) is the single backlog index; native/client/live acceptance remains separate.
- The current public-family candidate is Tavern **0.6.141**, World Liquor **0.1.118** and Grilling **2.8.122**. The [family lock](family/upstream.lock.json) and immutable CI peer commits define the candidate; the index preserves remaining workstreams and earlier evidence.
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

Pure additive first-person camera roll remains unimplemented; the yaw adapter is explicit opt-in. Native machine counts and supported stackable ingredient metadata, source RGB texels, board outlines and effect appearance ownership have reviewed repairs. Colored board outlines still differ at the per-viewer feet-versus-camera 16-block boundary and first-person spyglass condition. Arbitrary NBT and three decorated nonstackable shaker inputs, wall outlines, the multiline board editor and dropped-shaker display contexts remain incomplete. Native reach, mob-target clearing, step-height, XP pickup and some instant-effect delivery semantics remain incomplete. All new hand, item-render, material and input paths need paired client review. See the release notes and matrix for source and engine boundaries.

## Licensing and history

Original Tavern code is BSD-3-Clause; original/derived art is CC BY-NC-SA4.0. Fonts and other assets retain their own notices. See [CREDITS.md](CREDITS.md), LICENSE-CODE and LICENSE-ASSETS. Historical install/download instructions are preserved in [the archive](docs/archive/pre-reorganization-README.md), not current requirements. Open the root config.json for bridge authoring; see [BRIDGE-WORKFLOW.md](docs/BRIDGE-WORKFLOW.md).
