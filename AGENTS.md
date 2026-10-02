# Project requirements

- Guide work MUST follow `docs/GUIDE-STANDARD.md`, the user's fixed seven-entrance, child-group, individual-entry contract. Do not flatten or rename it without a new user request.
- Owner requested an independent Tavern guide and optional Cookery integration on 2026-10-02. Both entrances MUST use Tavern's shared addon projection and the same seven-section navigation; addons provide data, not separate content implementations.
- Keep original Java mechanics authoritative. For boards, preserve Java left / center / right and legacy top positioning. The user additionally requested Word-style justified/distributed and vertical alignment on 2026-09-27; these are intentional extensions.
- Do not use simulated players. Distinguish static checks, native BDS loading, and actual client acceptance.
- Do not add successful placement, pickup or machine-operation Actionbar announcements absent from Java. Preserve source-backed rejection messages and brewing status.

# Canonical baseline

- Follow `docs/BASELINE-MAINTENANCE.md`. Own fixes belong to canonical runtime; do not introduce gameplay transforms in a private builder or BSM hook.
- A changed exported file requires a new release identity, lock/history update and functional verification. Never reuse the same version for different content.
- Production deployment requires the family receipt, pinned upstream archives, client acceptance and explicit saved-world migration verification.
