# Java parity repair batch — 0.6.76 candidate

Reference: [KaleidoscopeTavern Forge 1.20.1 main c4ec1880](https://github.com/KaleidoscopeMods/KaleidoscopeTavern/tree/c4ec1880bd44cf3139d3ba744ab30bb379cf1416). This is a source-specific repair batch, not a claim of complete parity.

## Repaired

- Grass Stealth: explicitly map all 15 Java-tag plants to current Bedrock block IDs. Java `grass`, `dead_bush`, `sugar_cane` map to `short_grass`, `deadbush`, `reeds`. Both feet and head qualify; berry bushes qualify at every age. The Java-style BP tags JSON alone never tags Bedrock vanilla blocks.
- Mature wheat/carrot/potato/beetroot require Bedrock growth7. Exclude unrelated nether wart, pitcher crops and Tavern grape crops; their Java classes are not CropBlock and are not tagged. Naturally mature torchflower changes into a non-tagged FlowerBlock.
- Preserve the existing explicit custom-block tag extension. The existing native-invisibility fallback still does **not** clear existing mob targets as Java does; that stable-API gap remains.
- Tomb Raider recognizes current native `zombie_villager_v2`, retaining the historical alias.
- Ardent Heat armor wear respects Creative immunity and Java armor Unbreaking (60% unconditional wear plus the remaining40% enchantment roll). It intentionally does not use the tool formula. Bare-player collision behavior is unchanged.
- Native compostable components: grapevine25%; grape, ice grape, gold grape and green grape50% as registered by Java CommonRegistry (four fruit items).
- Pruning vines and harvesting grape bunches use `block.beehive.shear`; wild-grape shearing retains `mob.sheep.shear`.
- Restore all eight incense recipes to vertical feather/ingredient/glass bottle, using preserved `data/upstream/recipes/*_incense.json`. The accidental eight-ink-sac recipes are removed. Output IDs/counts are unchanged.

## Verification and boundaries

New pure and production-adapter tests: `tools/grass-stealth*.test.mjs`, `tools/java-parity*.test.mjs`. Independent Java recipe fixtures are compared with actual runtime recipes. Existing foundation, effects, cultivation, resource, baseline and paired family checks remain required.

Official native component reference: [minecraft:compostable](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/itemreference/examples/itemcomponents/minecraft_compostable?view=minecraft-bedrock-stable).

The version skips the reserved0.6.75 retained-HUD draft. This branch starts from published main and does not incorporate that unaccepted JSON UI prototype. That draft needs rebase/re-version before any future merge. No gameplay changes are hidden in packaging or live hooks. Historical preservation preimages remain unchanged; reconciliation hashes and current behavior tests record this new baseline.

Native client rendering, complete effect parity and existing-private-world migration remain separate unpassed gates. Do not deploy solely because static/BDS loading passes.
