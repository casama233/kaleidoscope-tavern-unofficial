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
