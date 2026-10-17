## Current maintained source: 0.6.173

Source snapshot reviewed on **2026-10-17**: [115942e5](https://github.com/casama233/kaleidoscope-tavern-unofficial/commit/115942e55e9946cfd257fbcdc41c849f75b77509). The public source family is **T173 / G150 / W151**. Stable-author identity/state adaptation and the later P48/P49 consumer repairs have source evidence. Full-family acceptance is separate and remains incomplete for the current batch.

**Public download:** [Tavern v0.6.170](https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/tag/v0.6.170), paired with **World Liquor 0.1.148** and the optional **Grilling 2.8.149** source-check family. The G149 public package uses Cookery **1.6.0**; current G150 source uses **1.6.1**. Main-source requirements and published-package requirements must be read for their own version.

**Last LIVE batch recorded in the repository:** **T169 / G144 / W147 / private42**, deployed **2026-10-15 22:40:27 HKT** and reported checked at the start of the following source batch. This documentation audit did not connect to the server. Current source, downloads and that deployment have separate identities; see [family/BASELINE-STATUS.md](family/BASELINE-STATUS.md).

**Remaining work:** complete the current full-family evidence, the owner's all-item Blockbench first-person/side-texture inspection, and the specific gameplay/client scenes in [PARITY-MATRIX](docs/PARITY-MATRIX.md) and [BUGS](docs/BUGS.md). T160 side faces, T167 cursor work and T169 progress expiry repairs are retained. `client=false`, `production_ready=false`, `pending_client_acceptance`.

The T170/G149/W148 stable-channel publication followed the owner's source/editor/CI/package decision; this audit does not add a new client gate to that publication. [Earlier README evidence](https://github.com/casama233/kaleidoscope-tavern-unofficial/blob/115942e55e9946cfd257fbcdc41c849f75b77509/README.md) and versioned release notes retain their original scope.

# Kaleidoscope Tavern (Unofficial)

A Bedrock port of [Kaleidoscope Tavern](https://github.com/KaleidoscopeMods/KaleidoscopeTavern), with standalone brewing, cocktails, storage, furniture and a shared seven-section Tavern guide. [繁體中文](README.zh-TW.md).

## Current source and requirements

- Current work, public downloads, repository-recorded deployment and acceptance are maintained in [one family status index](family/BASELINE-STATUS.md). [PR dispositions](docs/audit/PR-DISPOSITIONS.md) retain historical source decisions.
- [baseline.json](baseline.json) owns package identity and exact dependencies; [CHANGELOG.md](CHANGELOG.md) records changes.
- Bedrock 1.26.50 or newer; current load target BDS 1.26.52.3.
- Enable both Tavern BP and RP. Cookery is optional; the reviewed family target is author Cookery1.6.1. World Liquor uses its exact paired Tavern version.
- Use canonical source/releases, keep a world backup and remove duplicate older Tavern packs before an upgrade. Private integration is a separately identified addon; it is not a different Tavern runtime.
- For a family candidate with the P50 Cookery RP repair, a clean resource-pack installation or targeted removal of the older Cookery RP is a prerequisite for client acceptance. Server replacement alone does not prove a client refresh; see [Cookery RP installation](family/COOKERY-RP-INSTALLATION.md).

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
