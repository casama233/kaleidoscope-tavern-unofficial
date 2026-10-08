# Native inventory names

The three supplied screenshots show the raw keys for `sunset_glow_q2`, `shaker`
and `recipe_book` in a Chinese native inventory. They do not identify the active
pack revision. At T129 (`9752aae`), each exact `minecraft:display_name` key already
exists in `en_US`, `zh_CN` and `zh_TW`. The BP dependency names the matching RP UUID
and version; packaging copies those canonical files without rewriting them. This
source review therefore does not establish a current Chinese missing-key defect
or claim that the screenshots came from an older version.

The shipped Japanese and Russian files had a separate, reproducible gap: both
were absent from `RP/texts/languages.json`, and their existing Java item/block
translations had no native `item.namespace:id.name` / `tile.namespace:id.name`
aliases. The release checker inspected only the three listed locales.

The repair registers the two existing partial locales and generates native
aliases from their exact existing Java names. Quality I–VI variants reuse the
bottle name, leaving quality in its existing lore. Explicit native translations
take precedence. Untranslated labels use the pack's existing English fallback;
this is not a complete Japanese/Russian translation or a new guide language.
Run `python tools/build_locale_aliases.py --write` after editing source labels.
The generator changes only its marked section, and the release localization
check rejects stale generated aliases.

The checker now examines every packaged BP/RP language file, catalog/file
agreement, duplicate and empty keys, placeholder compatibility, complete key sets
for the three fully supported languages, native references including block
permutations, English coverage for every unoverridden runtime label, pack labels,
and the exact BP-to-RP dependency. Targeted regressions cover the pictured keys,
the orphan-file failure, missing English fallback, partial-locale placeholders,
full Chinese coverage, stale aliases and an incorrect paired resource version.

Official sources, consulted 2026-10-08:

- [Item display name](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/itemreference/examples/itemcomponents/minecraft_display_name?view=minecraft-bedrock-stable): the component accepts a localization key directly; the official examples do not add a `%` prefix.
- [Language-file validation](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/mctoolsvalreference/langfiles?view=minecraft-bedrock-stable): `LANGFILES102` defines English as the default fallback; `LANGFILES104/105` require catalog/file agreement.
- [Pack contents and supported locales](https://learn.microsoft.com/en-us/minecraft/creator/documents/comprehensivepackcontents?view=minecraft-bedrock-stable): the native locale list includes `zh_CN`, `zh_TW`, `ja_JP` and `ru_RU`. No invented Chinese locale alias is introduced.

Client acceptance remains pending. On the newly installed candidate, verify the
three pictured items in both Chinese client locales, Japanese/Russian translated
bottles and furniture, untranslated cocktail English fallback, a renamed stack,
and a second resource-pack order. Record the client version and enabled pack UUIDs
and versions. Static source checks and a zero-player BDS session cannot validate
native inventory text rendering, cache selection, GUI animation or font layout.

The existing T129 shaker cursor interpolation and local expiry were reviewed;
this change does not alter HUD ownership, factory/animation semantics, the
seven-entry guide, player rendering, or quiet immersion.
