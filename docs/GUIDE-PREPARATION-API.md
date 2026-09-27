# Product preparations (0.6.48)

Use the existing Cookery guide renderer. A workstation page describes operation; a product page owns its preparation methods. Workbench recipes for furniture/tools remain in Minecraft's crafting book.

Tavern automatically projects registered barrel/shaker recipes onto their output product. Alternative ingredients occupy one labelled input slot, with the allowed quality range. This avoids expanding thousands of combinations or silently selecting only one allowed material.

For an addon-specific food machine, provide `pages[].preparations`: up to 24 records with `method` (`Freezer`, `Crafting Table`, `Barrel`, `Shaker`, `Pressing Tub`), `ingredients` (1–12 namespaced IDs), `result` equal to the page item, `count` (1–64), `time` in ticks (0–72000). The registry validates and preserves these records; Cookery displays them using its native Preparation view. Names and icon still come from the same product page. Existing recipe IDs, gameplay inputs and outputs are unchanged.

For shared drink/cabinet blocks with empty native loot, add `kaleidoscope_tavern:natural_break` with `drop` (the placeable item ID); shared extension cabinets also set `storage: true`. The callback runs on real block destruction, returns stored items and removes authoritative state/helpers. It does not intercept explosions or simulate player use. Pair this component with the Java-derived `minecraft:destructible_by_explosion` value. Addon-owned unique machines retain their own destruction callback.
