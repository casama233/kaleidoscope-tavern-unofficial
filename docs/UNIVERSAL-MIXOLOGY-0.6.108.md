# Shared mixology categories and Java matching

The host now matches Java item/tag ingredients with an exact three-input
bipartite assignment. Repeated colours need separate inputs; ordering does not
matter. Exact item conditions remain exact. Recipes resolve at release, and
Signature colour/effects resolve against the current catalogue when served.
The source timing bands and float duration merge remain unchanged.

Latest primary references are Tavern Forge/NeoForge 1.2.0 and World Liquor
NeoForge 1.1.11 (CF 9066406). The actual NeoForge `RecipeMatcher` at
`a2d6402a3c1eec093aef7e7d10ac5145906c199e` agrees with this implementation on
all 512 possible three-by-three match graphs. This is logic verification, not
Minecraft client or all-platform acceptance.

## Registration without a host patch

All fields travel through the existing chunked API v1. Any valid addon source
namespace can use them; neither source names nor drink IDs are whitelisted.

```js
{
  api: 1, source: "new_tavern_pack", version: "1.0.0",
  shakerColors: [{
    tag: "new_tavern_pack:neon", color: 0x123456,
    labels: {en_US: "Neon", zh_CN: "霓虹色", zh_TW: "霓虹色"}
  }],
  shakerInputs: [{item: "new_tavern_pack:drink", color: 0x123456}],
  recipes: [{
    id: "new_tavern_pack:shaker/neon", kind: "shaker",
    ingredients: [
      {tag: "new_tavern_pack:neon"},
      {tag: "kaleidoscope_tavern:cocktail_ingredient_white"},
      {item: "minecraft:sugar"}
    ],
    output: {item: "new_tavern_pack:neon_cocktail"}
  }]
}
```

The physical drink/cup, effects, containers and localized product page remain
addon-owned `content`/`pages` data, as in the existing SDK. Bottle content
automatically supplies its Q4–Q6 inputs, effects, colour and empty container;
explicit input descriptors may override that derivation.

An exact RGB identifies a category when exactly one registered category has
that RGB. Explicit `ingredientTags` or `ingredientColor` take precedence.
Equal RGB in different categories needs explicit membership; RGB distance,
localized item names and texture guessing never grant a Java tag. The sixteen
standard colour names work without an extra palette. New short colour names
resolve to `kaleidoscope_tavern:cocktail_ingredient_NAME`; arbitrary namespaced
tags work as well. `ingredientColors: ["red", "white", "yellow"]` is a shorthand
for the three tag predicates.

Native `minecraft:tags` are read from real ItemStacks, including items whose
addon does not register a shaker descriptor. `itemTagChanges` supplies exact
`item`, `add` and `remove` arrays for Java datapack reclassification. Palettes,
tag changes and generated inputs rebuild on replacement/removal; conflicting
palette RGB rejects the whole registration before changing live state.

Java Ingredient objects and arrays of alternatives are supported alongside
legacy option arrays. Existing recipe-only generic tag memberships remain
compatible. Plain ordinary inputs retain Java RESET semantics. Bottles below
Q4 stay rejected. Existing metadata-preservation restrictions still reject
unsupported custom item data before consuming it; this API does not pretend
to infer arbitrary addon code/effects that were never declared.

## Current World Liquor data

World Liquor registers the exact four source RGB colours (brown, orange,
light blue, pink), source precedence, additions/removals and all eighteen
current recipes. This includes Highball and its original model, UVs and
textures. The historical `smc:ice_tea` source rename is explicitly recorded in
the addon adapter, not hardcoded in the generic host. Highball's source
600-second Creative Flight effect is preserved as data, but stable Bedrock
does not implement its actual flight ability; the guide states that limit.

The shared seven-entrance guide supports arbitrary registered colour labels
and preserves all three tag-only recipe slots. The quiet HUD defaults stay in
place. No simulated players or client pass is claimed.
