# Luminous Bride editable source

Open `luminous_bride_1.bbmodel` in Blockbench 5.2.1. The original texture is embedded; no external download or plugin is required. This file was created from the actual desktop editor project and corrected with the same reviewed geometry transform as all four runtime count variants.

The native desktop Bedrock export is retained beside it. Its complete geometry payload (UVs, pivots, rotations and bounds included) equals runtime count 1. Only the document wrapper version differs: Blockbench chooses 1.12.0; the existing pack keeps 1.21.0.

Do not move the wall using the default Position control without checking the pivot: Blockbench can move the pivot with the cube. Moving Pivot then compensates the cube coordinates. The roundtrip gate catches either change. Treat coordinate/pivot pairs atomically and compare the final native export.

## Normalization contract

- Keep Java's intentional inward shell and the release's single-sided material selection
- Crop only its bottom hidden unit, y=0.1..1.1, covered by the solid base
- Crop the bottom UV texel, keeping the top anchor and texel scale; do not stretch or repaint
- Remove the obsolete 0.0625-unit east/west separation biases, restoring joined corners
- Check both same-facing and opposite-facing depth overlaps, not only the former
- Keep identifiers, root pivot, bottle poses, saved indices and textures unchanged

Editor previews and native export verification are not Minecraft client acceptance. Do not mark client acceptance merely because these checks pass.
