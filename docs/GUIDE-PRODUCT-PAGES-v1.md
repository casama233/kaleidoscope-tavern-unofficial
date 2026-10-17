# Optional product guide fields (Tavern 0.6.38 / API v1)

Existing guide pages remain valid. New optional fields:

- `item`: physical namespaced product ID belonging to the extension source.
- `category`: equipment, barrel, cocktail, storage, cultivation, furniture, lighting, incense, art, boards or food.
- `crafting`: up to 16 display recipes; `method` must be `Crafting Table`, `result` must equal item, `ingredients` contains 1–9 item IDs (or #tag IDs), `count` is 1–64, `time` is zero. This is guide metadata only and does not register a crafting recipe. Use the actual BP recipe files as its source. Tag examples must be identified as examples in body text.

Recipe IDs still reference the real registered recipes; ingredients/output/carrier are projected from the registry, never inferred from prose. A product page stays in its normal Tavern category. Extension recipes targeting a core product merge into the core product's existing page. Add-on text cannot overwrite core item names.

Capability: `guide_product_pages`. Cookery 1.0.6 transport deliberately supplies complete Traditional Chinese + English mechanics because its mechanicsByLocale sanitizer rejects standard region-code keys; the internal catalog and product names retain all three locales.

## 0.6.46 統整

- 跟隨廚房本體的工作站／物品百科結構，使用本體原生條目畫面。
- 主分類直接列出物品；移除「裝飾與氛圍」再進下一層的空父選單。本體 8 類，裝附屬後增加食物共 9 類。
- 同一物品的配方、用途、操作及效果在同一條目。酒的品質說明納入酒桶，沒有獨立品質條目。
- 酒館和附屬共用同一份配方格式與操作說明；保留附屬的獨有機器說明。
- 移除已不存在的「酒桶與熟成／壓榨果汁」指引，清理家具重複／互相矛盾的總述。
- 發送時保留完整三語；在舊版每條最多 8×512 字限制內整理段落。限制超出時報錯，禁止靜默截斷。
- 沒有改寫廚房包或加入另一套指南 UI。
