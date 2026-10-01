# User-authorized live source-label merge

The user identified a friend as the live editor and requested merging their changes on 2026-10-01. Read-only reconciliation captured the owned Tavern delta at14:13UTC, with the four script hashes stable at14:17. No private Cookery/ChineseFood source, player/world data or credentials were included.

## Semantic integration

- extension-content: retain the friend's per-addon modNameKey on drink descriptors.
- extension-foundation: validate the source-label localization key against the declaring addon namespace.
- registry: add drink_source_labels without removing the existing destruction_feedback or shaker_ingredient_tags capabilities.
- quality-tooltip: preserve the friend's source-footer migration AND 0.6.78's16-color descriptors, exact old no-color lore and amplifier compatibility. The formatter keeps the public showColor third parameter and uses a separate legacySource fourth parameter to avoid the positional-argument conflict.
- All three Tavern locale renames in the friend patch already match current public source; do not overwrite newer unrelated localization entries.
- World Liquor's non-manifest files were unchanged from the backup at14:27. Its wrapper did not declare modNameKey or require drink_source_labels. The paired0.1.44 wrapper now supplies both, with English/Simplified/Traditional localized source labels.

## Validation and boundaries

201 focused color/source-label cases and521 aggregate source tests passed at the merge revision. They include all independent legacy lore combinations, foreign label spoof rejection, retained core capabilities, actual addon wrapper registration, and preserved custom metadata. Full release/BDS checks remain separate evidence.

The ordinary public release still depends on author Cookery1.0.8. This merge alone does not approve private-family replacement or live deployment. Any compatibility deployment must retain a truthful, explicit separate receipt and authorized admission policy; do not rewrite manifests at install or claim missing client/migration tests passed.

The unrelated unfinished Grilling seasoning-native-storage work is excluded. Grilling remains the verified2.8.20 release in this family.
