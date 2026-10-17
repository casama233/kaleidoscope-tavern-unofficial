# Tavern 0.6.136 guide revision

T136 retains the deployed T132 gameplay baseline and rewrites the shared Tavern
guide, paired with World Liquor W113 and the registered G121 Cookery bridge.
It does not include the still-failing, unmerged T135 appearance-lease work in
PR302. That source and its restart diagnostics remain available separately;
no failed gate is waived or credited to this candidate.

The original Bedrock author's Tavern1.0.1 and Cookery1.6.0 guidebooks inform the
short paragraphs and preparation links; operating facts are checked against the
actual maintained runtime. All 223 combined entries have three-language content,
the same seven entrances and 84 preparation records. Equipment describes use;
product introductions describe purpose, with complete quantities, liquid volume,
slots, carriers and timing available from their preparation buttons. Six-quality
effect tables, repeated operation blocks and unnecessary probability/formula
details are removed from introductions. Actual active-effect details remain an
explicit action. See [GUIDE-EDITORIAL.md](GUIDE-EDITORIAL.md).

Corrected instructions cover the locked barrel lid and partial bottling,
loaded-area aging, grape fruiting space, pressing collection, shaker cancellation
and clearing, bottle/carrier compatibility, incense, board capacity/wax and
furniture recovery. The shared view keeps headings with their paragraphs, uses
native text colors and resets formatting. It never truncates source prose or
invents crafting-grid positions.

The optional Cookery chapter now opens Tavern's identical projection and view
using G121's sparse registered hook. The player-origin handshake verifies the
chapter, actor, language, nonce and deadline; absent/older Tavern falls back to
the original chapter. Back returns to Cookery, while Close stays closed and the
temporary host language does not silently overwrite the player's saved setting.
No complete author script is copied into a public repository.

Focused projection, recipe and SDK-controller/transport checks pass. Canonical
CI and full-family native first/restart, stopped-backup migration and deployment
remain required for this new immutable identity. No simulated player is used.
Human reading, rendered layout, input, sound and complete gameplay acceptance
remain pending; successful tooling or deployment does not certify them.
