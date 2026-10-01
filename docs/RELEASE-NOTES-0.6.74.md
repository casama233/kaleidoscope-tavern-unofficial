# 0.6.74 — Luminous Bride base geometry normalization

- Remove the occluded shell strips overlapping the solid base in all four count variants (40 strips total). The old audit missed 20 opposite-facing coplanar overlaps.
- Preserve the top-anchored UV mapping while cropping only hidden bottom texels. No texture repainting or gameplay changes.
- Remove 20 obsolete east/west depth offsets that created tiny corner seams after trimming.
- Preserve the single-sided material fix from 0.6.73, all IDs, UUIDs, storage indices, pivots and display poses.
- Include an editable Blockbench source, actual Blockbench 5.2.1 native export, and exact geometry roundtrip verification.
- Add opposite-facing overlap regressions and idempotent canonical normalization. Minecraft client acceptance remains separate.
