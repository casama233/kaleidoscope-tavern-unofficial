/** Source-backed Java color categories, independent of rendered RGB.
 * KaleidoscopeMods/KaleidoscopeTavern c4ec1880bd44cf3139d3ba744ab30bb379cf1416
 * src/generated/resources/data/kaleidoscope_tavern/tags/items/cocktail_ingredient_*.json
 */
export const SHAKER_INGREDIENT_TAGS=Object.freeze({
  "kaleidoscope_tavern:ice_wine": [
    "kaleidoscope_tavern:cocktail_ingredient_blue"
  ],
  "kaleidoscope_tavern:polaris_sweet_white": [
    "kaleidoscope_tavern:cocktail_ingredient_blue"
  ],
  "kaleidoscope_tavern:mother_snow": [
    "kaleidoscope_tavern:cocktail_ingredient_blue"
  ],
  "kaleidoscope_tavern:sherry": [
    "kaleidoscope_tavern:cocktail_ingredient_blue"
  ],
  "kaleidoscope_tavern:miners_star": [
    "kaleidoscope_tavern:cocktail_ingredient_gold"
  ],
  "kaleidoscope_tavern:honey_wine": [
    "kaleidoscope_tavern:cocktail_ingredient_gold"
  ],
  "kaleidoscope_tavern:madame_shexiang": [
    "kaleidoscope_tavern:cocktail_ingredient_gold"
  ],
  "kaleidoscope_tavern:sunset_glow": [
    "kaleidoscope_tavern:cocktail_ingredient_gold"
  ],
  "kaleidoscope_tavern:sauvignon_blanc_dry_white": [
    "kaleidoscope_tavern:cocktail_ingredient_green"
  ],
  "kaleidoscope_tavern:riesling_dry_white": [
    "kaleidoscope_tavern:cocktail_ingredient_green"
  ],
  "kaleidoscope_tavern:wine": [
    "kaleidoscope_tavern:cocktail_ingredient_light_purple"
  ],
  "kaleidoscope_tavern:champagne": [
    "kaleidoscope_tavern:cocktail_ingredient_light_purple"
  ],
  "kaleidoscope_tavern:sakura_wine": [
    "kaleidoscope_tavern:cocktail_ingredient_light_purple"
  ],
  "kaleidoscope_tavern:brandy": [
    "kaleidoscope_tavern:cocktail_ingredient_light_purple"
  ],
  "kaleidoscope_tavern:carignan": [
    "kaleidoscope_tavern:cocktail_ingredient_light_purple"
  ],
  "kaleidoscope_tavern:plum_wine": [
    "kaleidoscope_tavern:cocktail_ingredient_red"
  ],
  "kaleidoscope_tavern:sweet_berry_wine": [
    "kaleidoscope_tavern:cocktail_ingredient_red"
  ],
  "kaleidoscope_tavern:red_queen": [
    "kaleidoscope_tavern:cocktail_ingredient_red"
  ],
  "kaleidoscope_tavern:vodka": [
    "kaleidoscope_tavern:cocktail_ingredient_white"
  ],
  "kaleidoscope_tavern:whiskey": [
    "kaleidoscope_tavern:cocktail_ingredient_white"
  ],
  "kaleidoscope_tavern:rum": [
    "kaleidoscope_tavern:cocktail_ingredient_white"
  ],
  "minecraft:potion": [
    "kaleidoscope_tavern:cocktail_ingredient_white"
  ],
  "kaleidoscope_tavern:luminous_bride": [
    "kaleidoscope_tavern:cocktail_ingredient_yellow"
  ],
  "kaleidoscope_tavern:glowflower_brew": [
    "kaleidoscope_tavern:cocktail_ingredient_yellow"
  ]
});
export const coreShakerIngredientTags=item=>SHAKER_INGREDIENT_TAGS[item.replace(/_q[4-6]$/,'')]??[];
