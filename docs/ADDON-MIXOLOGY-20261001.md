# Addon cocktail tags and missing color tooltips — 0.6.78 / 0.1.43

## Source-grounded findings

World Liquor NeoForge 1.1.9 explicitly tags smc:ice_tea as cocktail_ingredient_dark_red. The port's canonical item ID is kaleidoscope_world_liquor:ice_tea_q1–q6. Mixing qualities q4–q6 use exact RGB #AA0000. Red coloration on insertion is not by itself a bug.

All 18 addon bottle descriptors omitted their color name, while the host accepted only seven bright color names. Their tooltip color line was therefore missing, including the photographed q6 iced tea.

The host retained frozen per-recipe item lists and never merged addon tag membership into builtin recipes. Source-level reproductions included Smirnoff Red Vodka plus two Plum Wines failing the builtin red/red/red Bloody Mary recipe, and Jack Daniel plus two Miner's Stars failing gold/gold/gold Brass Heart. These defects also existed in the latest public source, independently of live's older private packages.

## Repair

- Merge explicit tagged-recipe alternatives and declared shaker-input ingredientTags on registry rebuild. Do not infer tag membership from visible RGB.
- Rebuild from immutable registered sources on installation, replacement and removal. Preserve builtin-first and deterministic addon recipe precedence. Null-tag literal slots remain exact.
- Support all 16 Java ChatFormatting names/codes in bottle descriptors and tooltip formatting.
- World Liquor declarations derive from 11 exact Java 1.1.9 tag resources, including the explicit smc namespace mapping. Current recipes, effects, containers and models remain unchanged.
- Recognize and upgrade only structurally exact formerly generated no-color lore, including both prior amplifier formats. Such old owned lore remains an acceptable plain ingredient before normalization runs. Custom lore, names and properties are not discarded or admitted as plain ID-only inputs.
- Require the shaker_ingredient_tags host capability, preserving it through the foundation wrapper.

## Verified boundaries

185 focused source tests exercise tagged substitutions, all 14 addon recipe first-options, q1–q3 rejection, q4–q6 iced tea, all 18 bottle color descriptors, both registration orders, replace/remove, exact slots, RGB-only controls and protected lore. The aggregate script suite contains 505 passing tests at the initial repair revision; final CI and BDS evidence are tracked separately. No simulated-player or client acceptance is asserted.

Current source recipes:
- Iced tea + red-tag drink + white-tag drink: Bloody Mary
- Iced tea + white-tag drink + gold-tag drink: Godfather
- Cola + iced tea + green-tag drink: Long Island Iced Tea

All require the existing valid mixing quality and completion timing. A screenshot alone cannot establish the IDs of three inserted drinks or whether a completed shake matched a recipe.

## Still open

The existing graphical shaker HUD compresses 16 Java categories into seven bright swatches, so dark red appears in its red swatch. Exact source RGB remains preserved for signature mixing and placed signature-cup color. This patch does not change the unaccepted HUD-flicker draft or claim pixel-perfect rendering. Native client acceptance and saved-world deployment migration remain separate gates.
