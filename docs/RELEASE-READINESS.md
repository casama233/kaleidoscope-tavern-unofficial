# Release readiness

## Prepared

- Current gameplay/assets promoted from the installed 0.6.28 build into one canonical runtime.
- Public Cookery 1.0.6 archive identity/hash and guide interface inspected.
- One-entry product guide; usage and crafting shown together.
- Public manifests, attribution, installation instructions, English/Chinese README, changelog and CurseForge description draft.
- Local-only server snapshots, secrets and third-party server patches excluded from release contents.
- Static checks and deterministic packaging workflow; no interaction simulations.

## Validation completed

Static validation passed for 1483 JSON files and 928 geometry identifiers. The generated guide contains 140 unique entries in 11 categories. A fresh BDS 1.26.51.1 world loaded only official Cookery 1.0.6 and Tavern 0.6.29 successfully, with zero ERROR lines after creating the load harness allowlist file. No simulated interactions were run. See `VALIDATION-0.6.29.json`.

## Before a public CurseForge upload

- Client acceptance of the 0.6.28 visual fixes and the public pack stack: mixed drink color, held shaker/animation, board text placement, barrel tooltip clearing, and guide pages.
- Confirm distribution terms for the Minecraft bitmap-provider glyph subset used in the board atlases, or replace that subset with a distributable font while preserving the renderer's layout. The Unifont license notice alone does not cover those bitmap glyphs.
- Confirm intended support beyond the tested BDS version; no Realms/all-mobile guarantee is made.

The GitHub upload and draft release are preparation. They do not publish a CurseForge listing or change repository visibility. Live server gameplay is not modified by this preparation step.
