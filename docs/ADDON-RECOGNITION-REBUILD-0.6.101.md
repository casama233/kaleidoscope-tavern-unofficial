# Addon cocktail ingredient recognition rebuild

This is a new source WIP checkpoint, not a recovery of the lost T98 bytes, release, merge, or live deployment.

Tavern 0.6.95 already contains 12 core shaker recipes, and World Liquor 0.1.58 already declares 14 addon recipes and 56 shaker inputs. Those declarations were not absent. The remaining defect is that the registry infers Java color-category membership from each recipe's expanded item list. A stale or conflicting item list can therefore keep a drink in the wrong category even when its registered Java ingredient tag changes or is removed.

This checkpoint resolves the 16 Java cocktail color categories from authoritative ingredient-tag declarations. Core membership is recorded from [KaleidoscopeTavern c4ec188](https://github.com/KaleidoscopeMods/KaleidoscopeTavern/tree/c4ec1880bd44cf3139d3ba744ab30bb379cf1416/src/generated/resources/data/kaleidoscope_tavern/tags/items). World Liquor supplies its existing explicit ingredientTags. Java category slots are expanded from those declarations only. Untagged, explicitly named ingredient slots and custom addon tags retain their established semantics. Unordered matching still consumes three distinct input slots, including repeated colors.

Logical color categories do not come from arbitrary rendered RGB. Iced tea remains dark_red, distinct from red; its full-palette HUD rendering is separate work. Changing the recipe's display list cannot override ingredient classification. Replacing or removing an addon rebuilds the categories from current declarations.

Before this public Git checkpoint: syntax checks and one core/one addon registry smoke check only. Focused source/recipe fixtures and the repository checks remain pending. Native Bedrock loading, actual client acceptance, and saved-world migration are not claimed. No simulated players are used. The paired World Liquor export/dependency identity is not updated by this standalone Tavern WIP; aggregate integration owns the final pairing.
