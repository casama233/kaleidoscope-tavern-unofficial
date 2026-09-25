# Public beta readiness — 0.6.38-beta.1

The 0.6.38 visual corrections are integrated into `main` through PR #82 and are distributed as the complete Tavern BP/RP, not an extra compatibility overlay. Publication is a GitHub public prerelease; this does not claim client acceptance or publish a CurseForge listing.

## Evidence for this version

- Static validation covers 1,918 JSON resources, 929 geometries, 141 guide entries in 11 categories, JavaScript syntax/imports and resource references.
- English, Simplified Chinese and Traditional Chinese each have 1,684 language keys. Duplicate keys, missing keys and placeholder mismatches are zero in the recorded checks.
- Visual validation covers 433 surface texture sets, with 258 intentional exclusions and 24 external references; dyed icon alpha roles and MER dimensions/emission bounds are checked.
- Pure mathematical checks cover 3,601 camera samples and 20 effect-level rows. No simulated-player interaction tests were run.
- See `VALIDATION-0.6.38-VISUAL.json` and `VISUAL-MATERIAL-AUDIT-0.6.38.json`. The release workflow checks the committed runtime without rewriting it, verifies all archive files, and compares uploaded release assets byte-for-byte before publication.
- Both manifests retain the original Tavern UUIDs and reference public Cookery 1.0.6. Existing item/block identifiers, recipes and saved-state formats are retained.

## Not yet verified

No BDS or Minecraft client was run for this revision. The 0.6.37 BDS 1.26.51.1 load record remains historical evidence for that revision only. Android/Windows rendering, Vibrant Visuals under different lighting, transparency, multiplayer camera isolation, command permissions, Realms and device-specific behavior require in-game feedback.

Slightly Tipsy now has bounded rotational camera feedback. It requires Allow Camera Shake and is a Bedrock approximation, not Java's exact smooth roll. Grass Stealth, Long Reach and other cross-edition gameplay differences have not been resolved by this visual update.

## Distribution and provenance

Original code, art and third-party notices retain their separate licenses; see `CREDITS.md`. Runtime board atlases use the existing GNU Unifont source pipeline. The public pack does not include Cookery, world backups, server executables, credentials or private server integration patches. This version does not claim a new exhaustive credential-history audit.

The private FAMILY server integration remains separate. Follow `INSTALLATION.md` before migrating from modified Cookery 1.0.7 or a different dependency UUID.
