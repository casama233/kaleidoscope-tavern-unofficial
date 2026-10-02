# 0.6.80: Independent Tavern and a shared-content guide

The owner requested a standalone Tavern guide and confirmed that Tavern itself must run without Cookery. Cookery's existing chapter remains an optional integration. Both entrances read the same `buildCookeryGuidePayload(registry)` projection; no duplicate recipe or effect database was imported.

## Changes
- Remove mandatory Cookery BP/RP dependencies, preserving Tavern UUIDs, stable Script APIs and its own BP-to-RP dependency.
- Existing Tavern guidebook and recipe_book now open the local guide without consuming/replacing the item. The initialized registry is required; the incomplete startup fallback is never presented as the full guide.
- Add one-book + one-Tavern-grape crafting and the guidebook in the existing brewing creative group. No automatic inventory grant or first-join receipt.
- Keep seven roots, including empty Food; hide empty leaves; single-entry leaves open directly. Preserve source order, all preparation alternatives, full quality/effect text and synthetic color/Q>=4 ingredient labels.
- Use the current registry on every navigation; preserve Cancel/Close/Back, bound pages, one session per user, and validate language persistence. Traditional Chinese, Simplified Chinese and English are supported.
- Crafting preparation data lists ingredients without inventing a grid absent from the shared schema.

## Preserved
Storage formats and recovery, recipe/color matching, extension capabilities/source labels, Molang/mesh repairs and effects remain unchanged. This is a fresh implementation using existing Tavern data; the author's separate runtime, alternate recipes, guide data, settings and assets were not substituted.

## Verification
Pure guide data and UI SDK adapter regressions are not Minecraft simulated-player tests or client UI acceptance. Static checks, standalone BDS and optional-family BDS evidence are recorded separately when completed. Real client use, touch, forms and crafting need client acceptance. No live deployment or world migration is included.

Reference comparison: Loyallay's public Tavern v1.0.0, CurseForge project1718691/file9024364, archive SHA25649b89d1d09ea91ca7d0c6bf1805b2b2b318ac023f132b1a758cfdb8607f2a9e4. Existing project licenses/credits are preserved.
