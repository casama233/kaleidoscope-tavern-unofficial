# Rebuild Java HUD colors and signature RGB fallback

This independent work-in-progress branch rebuilds the missing color behavior from
public Tavern 0.6.95 and pinned Java c4ec1880bd44cf3139d3ba744ab30bb379cf1416.
It is not restoration of a lost T98/L63 commit. Version 0.6.102 is an isolated
source identity, not a merged release, deployed pack or client acceptance.

Java ColorUtils declares all sixteen ChatFormatting ingredient colors;
ShakerOverlay multiplies its white rhombus by the tag RGB. The old HUD only
represented seven colors. All sixteen now have literal image controls, preserving
the original seven protocol indices and the existing progress/expiry controls.

The existing 336 exact Java RGB mixture atlas is retained byte-for-byte. Arbitrary
registered RGB values now sample the shaded white entry and use a separate
USE_COLOR_MASK material for multiplication. Full-alpha overlay over the black
palette entry flattened shading. Glass remains an independent untinted pass.

Microsoft documents the [multiplicative color mask](https://learn.microsoft.com/en-us/minecraft/creator/documents/material-files?view=minecraft-bedrock-stable)
and [normalized script RGB channels](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/rgb?view=minecraft-bedrock-stable).
The existing item dye normalization is correct and remains unchanged.

Focused checks are recorded after the initial Git checkpoint. They verify source,
protocol and generated texels. Native renderer, Java pixel comparison and complete
family acceptance are not claimed here.

## Focused validation after the remote Git checkpoint

- 4913 complete HUD color/empty combinations, 112 progress states and foreign
  actionbar preservation passed
- All 48 nonempty color sprites match source-mask RGB and alpha texels
- All 4096 three-input Java RGB combinations retain exact integer means and
  an existing atlas entry; RESET exclusion and arbitrary RGB also passed
- All six white fallback atlas frames match the source texture exactly
- Canonical baseline 0.6.102 release check passed from a clean commit

Initial published commit ebaf00febd43c3e1e39794eb110681670d43ea7a has tree
270cdf316b56ba05b04a3433918f2b830e02ff1b, identical to local checkpoint
5b52cf6062621ebace7189fb6a0ac91551e9d6c5. Every changed blob SHA was checked.

The full runtime diff has 37 intentionally changed or added paths. Their reviewed
postimages are recorded in the test-only historical reconciliation, preserving
all previous preimages. The four signature visual files also retain exact
preimages verified identical in public 0.6.95 and pinned launch baseline cedfaedf.
The 27 new sprites are explicit additions, preserving the original asset guards.

After those metadata corrections, the complete source-pinned check_release.py
passed locally against Java c4ec188 and the pinned integration baseline. It parsed
2025 JSON files and 930 geometries and passed all source/static preservation
checks. This does not certify native renderer or interaction acceptance.
