# Tavern 0.6.107 shared interaction and effect-HUD candidate

This candidate keeps all four reconstructed repairs and the 0.6.106 first-person
shaker frame. It changes shared callback ownership and one effect-icon binding
flag. Version 0.6.106 and its published bytes remain immutable.

## Shared interaction repairs

The actual 0.6.106 / World Liquor 0.1.67 client placed two empty glasswares and
reported two SPACE_NOT_CLEAR cancellations from a single short Creative
Shift/right-click. Empty glassware has no native block_placer; Creative retains
the stack. A focused replay through the current production router reproduces
the same two-place/two-warning result when one authoritative block interaction
is followed by itemUse fallback rays to alternating targets before commits.

The candidate binds matching fallback echoes to the owned block gesture rather
than treating a changed ray target/face as another action. Equal queued storage
hits are coalesced after hit resolution, with captured state and native stack
metadata comparison. Equal queued protected-break snapshots are coalesced too.
Pending claims clear in finally, including failure/rollback and a guard that
never invokes recovery. New authoritative actions, fresh touch false events,
distinct targets/hits/items/players, foreign cancellation, genuine stale-hand
and block/state conflicts remain supported. Error messages are not globally
suppressed and the inventory/rollback guards are unchanged.

The storage raw-face and pending-break failures are source-level counterexamples
using explicit API doubles, not claims of a traced native callback sequence.
Fifteen focused production-adapter regressions pass; rendered-client acceptance
of this exact new candidate remains pending.

## Effect-HUD binding candidate

The exact 0.6.106 / 0.1.67 native client had an active custom effect and icons
enabled, but no custom icon rendered. The candidate adds resolve_sibling_scope
only to icon-image bindings that read the typed sibling packet cache. The
packet, capture duration, Unicode precision, placement, gameplay effects and
native HUD roots are unchanged. Six icon tests, five UI contract tests and the
pinned 29-control Mojang root-preservation check pass. This source/structural
repair does not prove native capture or icon rendering; exact client replay is
required, including the existing zero-duration and Unicode capture boundaries.

The matching World Liquor 0.1.68 companion applies the same binding correction
and new host dependency separately. No full-pair, BDS, saved-world, live,
production, audio or all-FOV/skin acceptance is claimed by this Git checkpoint.
