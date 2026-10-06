# Tavern 0.6.106 first-person shaker candidate

This candidate preserves the frozen 0.6.105 gameplay and four rebuilt repairs,
then restores only the final source-backed first-person held shaker idle/use
poses using the actual native item-socket hierarchy. Third-person and player-arm
tracks, attachable selectors, geometry, UVs, texture, item logic, Java half-scale
and 2.4-pixel shaking waveform remain unchanged.

The exact 0.6.105 / World Liquor 0.1.66 baseline was observed in the actual
Minecraft 1.26.52.3 x86_64 client: the held shaker rendered in third person but
was invisible at rest and during use in first person. Placed model, inventory
icon and functional loading/pickup/use/serving controls worked. This candidate
fixes the concrete source mismatch between the Blockbench display calibration
and the bound native socket; actual candidate rendering remains pending.

Identity 0.6.106 is distinct and immutable. Older frozen runtime bytes are not
rewritten. The reviewed-change ledger preserves all historical preimages and
accepts only the exact reviewed candidate hashes. The pinned Mojang frame files
were freshly downloaded and SHA256-verified. Mathematical, static, BDS,
saved-world and actual rendered-client verification are separate evidence.

See [the source investigation and acceptance boundary](SHAKER-FIRST-PERSON-0.6.106.md).
No native candidate success, release publication, production readiness or live
deployment is claimed at this source checkpoint. The matching World Liquor
full-pair identity will be coordinated separately before paired acceptance.
