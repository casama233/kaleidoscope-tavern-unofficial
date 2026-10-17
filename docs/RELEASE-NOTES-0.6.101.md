# 0.6.101 source WIP: addon ingredient categories

This is a new reconstruction checkpoint in draft PR186. It is not a published release, the lost T98 bytes, or a live deployment.

Java cocktail color-category slots now use explicit input ingredientTags rather than trusting stale expanded recipe item lists. Core memberships are pinned to primary Java c4ec188. World Liquor0.1.58 retains its56 input descriptors and14 recipes; Tavern retains12 core recipes. Iced tea stays dark_red. Explicit-item slots retain Java semantics. Rendered RGB does not determine category membership.

Verification:218 focused tests pass; all26 current recipe declarations, all56 addon inputs and16 core source tag files are covered. Full source/static checks passed against pinned primary Java and historical baseline:2025 JSON files and930 geometries. Exact baseline101 source hashes are preserved. Native Bedrock loading, actual client acceptance, saved-world migration and complete-family deployment are not certified. Final World Liquor dependency/export pairing belongs to the aggregate candidate. Separate reconstruction branches own shaker graphics expiry and full HUD/signature RGB rendering.

See [source analysis and coverage](ADDON-RECOGNITION-REBUILD-0.6.101.md) and [machine-readable result](COCKTAIL-RECOGNITION-0.6.101.json).
