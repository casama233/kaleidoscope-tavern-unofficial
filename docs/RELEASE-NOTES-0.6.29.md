# 0.6.29-rc.1 — public release preparation

## Guidebook

- Keep equipment usage and crafting on the same item page, including the shaker, barrel, pressing tub, racks, furniture and boards.
- Merge a drink's recipe and quality/effect information into one product entry.
- Include cocktail operation instructions on its product page.
- Collapse small intermediate equipment, storage and drink categories; preserve useful decor groups.
- Continue using Cookery's native Guidebook Extension API and item detail renderer, with Chinese (Simplified/Traditional) and English text.

## Included fixes from the server iteration

Ingredient RGB is connected to the signature liquid's tint-capable material; shaker hand scale is 25% larger than 0.6.27; board line offsets follow the actual tilted plane; barrel status uses a compact tooltip with repeated and exception-safe clearing.

## Public packaging

- Bind the original Cookery 1.0.6 BP/RP UUIDs.
- Remove private server HUD and player-resource overrides belonging to other add-ons.
- Keep Tavern's existing pack and content identifiers.
- Build directly from the committed runtime with static checks and reproducible archive ordering/timestamps.
- Archive superseded generation/test reports and private operational material separately.

This is a release candidate. Server loading is not proof of Android rendering, complete gameplay parity or Realms support. Three custom effects remain unavailable: Slightly Tipsy, Grass Stealth and Long Reach.
