# Optional product guide fields (Tavern 0.6.38 / API v1)

Existing guide pages remain valid. New optional fields:

- `item`: physical namespaced product ID belonging to the extension source.
- `category`: equipment, barrel, cocktail, storage, cultivation, furniture, lighting, incense, art, boards or food.
- `crafting`: up to 16 display recipes; `method` must be `Crafting Table`, `result` must equal item, `ingredients` contains 1–9 item IDs (or #tag IDs), `count` is 1–64, `time` is zero. This is guide metadata only and does not register a crafting recipe. Use the actual BP recipe files as its source. Tag examples must be identified as examples in body text.

Recipe IDs still reference the real registered recipes; ingredients/output/carrier are projected from the registry, never inferred from prose. A product page stays in its normal Tavern category. Extension recipes targeting a core product merge into the core product's existing page. Add-on text cannot overwrite core item names.

Capability: `guide_product_pages`. Cookery 1.0.6 transport deliberately supplies complete Traditional Chinese + English mechanics because its mechanicsByLocale sanitizer rejects standard region-code keys; the internal catalog and product names retain all three locales.
