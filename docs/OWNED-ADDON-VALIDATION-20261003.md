# Owned addon validation: 2026-10-03

Scope: Tavern 0.6.90, World Liquor 0.1.56 and Grilling. No claim of complete Java parity or production/client acceptance.

## Creator Tools / MCP
Official @minecraft/creator-tools 0.19.0 was called through local stdio MCP validateContent using exact BP/RP-only ZIPs. Its bundled schema package is @minecraft/bedrock-schemas 1.26.20-beta.21. Initialization/tool discovery is not validation. A successful MCP transport is not a clean result.

- Tavern 0.6.90: exact 798 BP + 3,126 RP inventory verified; asset-reference checks pass. Full validateContent response was not obtained because the execution approval review was cancelled. Remains unvalidated by this tool.
- World Liquor 0.1.56: 816 files, no JSON parse errors. Report contains 1 dependency-context error, 548 warnings and 78 recommendations. Required Tavern resources are absent from a standalone ZIP but present in the exact reviewed family. String texture catalog paths, optional render-controller fields and valid uniform MER arrays account for schema mismatches. No new runtime defect was established by this report.
- Grilling 2.8.58: report contains 7 classified errors, 395 warnings and 629 recommendations. Confirmed actionable issues are two missing cosmetic pack icons and 16 identical 2048x704 RGBA pending-seasoning texture sheets. Each sheet is 5.5 MiB decoded (8,824 compressed bytes), nominally 88 MiB across distinct resources before mipmaps if loaded independently. This is a duplication/performance risk, not measured GPU allocation or proof of visible corruption. Dependency context, generic namespace/default-value recommendations and schema mismatches are separate.
- Grilling 2.8.59: new serialized runtime identity; a fresh Creator Tools call was cancelled before a response. The .58 report must not be relabelled as a .59 certificate.

## Cross-platform repair
Grilling PR119 at 7430ac1c486f3ab20d428ec8d1974ccd468391cc passes all four workflows, including Windows exact regeneration, official pinned bridge Dash compile, exported-file comparison and packaging. The .59 repair normalizes signed zero after rounding and selects one initial Euler representative before continuous unwrapping; checks remain byte-exact. Full client animation parity remains open.

## Family runtime
The isolated 16-pack family at Tavern .90 / Liquor .56 / Grilling .59 passes BDS checks without logged errors. See BDS-FAMILY-90-56-59-20261003.json. Tavern reports 24 checks and 9 fluids; Liquor registers 32 recipes, 66 guide pages and 56 shaker inputs. Guide transfer remains sent_unconfirmed without an acknowledgement. Client, saved-world migration and production flags remain false.

## Priorities
1. Complete blocked Tavern/current-Grilling Creator Tools validation when the execution review is available
2. Deduplicate pending-seasoning texture resources with unchanged pixels, UV/color routing and slot behavior
3. Continue native hand/use/render tests for all three owned ports and Java feature-gap work

No merge, release or live deployment is implied by this report.

## Schema references
- [Official custom item examples](https://learn.microsoft.com/en-us/minecraft/creator/documents/addcustomitems?view=minecraft-bedrock-stable)
- [Official render-controller reference](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/animationsreference/generated/animationrendercontroller?view=minecraft-bedrock-stable)
- [Official uniform texture-set values](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/texturesetsreference/texturesetsintroduction?view=minecraft-bedrock-stable)
