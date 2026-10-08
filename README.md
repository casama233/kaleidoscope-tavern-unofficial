## Current maintained baseline: 0.6.127

# Kaleidoscope Tavern (Unofficial)

A Bedrock port of [Kaleidoscope Tavern](https://github.com/KaleidoscopeMods/KaleidoscopeTavern), with standalone brewing, cocktails, storage, furniture and a shared seven-section Tavern guide. [繁體中文](README.zh-TW.md).

## Current source and requirements

- [baseline.json](baseline.json) owns package identity and exact dependencies; [CHANGELOG.md](CHANGELOG.md) records changes.
- Bedrock 1.26.50 or newer; current load target BDS 1.26.51.1.
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

Exact player-camera roll is unimplemented; the current optional yaw adapter changes aim. Arbitrary signature colors have shading limits, and all view/hand/material combinations need paired client review. Native reach, mob-target clearing, step-height, XP pickup and some instant-effect delivery semantics remain incomplete. See the matrix for original-source and engine boundaries.

## Licensing and history

Original Tavern code is BSD-3-Clause; original/derived art is CC BY-NC-SA4.0. Fonts and other assets retain their own notices. See [CREDITS.md](CREDITS.md), LICENSE-CODE and LICENSE-ASSETS. Historical install/download instructions are preserved in [the archive](docs/archive/pre-reorganization-README.md), not current requirements. Open the root config.json for bridge authoring; see [BRIDGE-WORKFLOW.md](docs/BRIDGE-WORKFLOW.md).
