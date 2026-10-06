# Shared callback source proof and limits

Base: released public main a519130e68551f1e75e6630990e8b6a3f9a3e6a3 (0.6.106).

Before the fix, the current mixology and shared router modules replayed one
playerInteractWithBlock at target A followed by itemUse fallback rays B/A/B
before system.run flushed. Creative retained the exact stack. The replay placed
two cups, then emitted two [Tavern C2] SPACE_NOT_CLEAR warnings and two
kt.action.error messages, matching the observed native failure count.

A storage replay sent raw North and Up callbacks while both resolved to the same
North hit; it inserted once, then emitted STALE_HAND. A break replay queued two
identical callbacks; it recovered once, then emitted BLOCK_CHANGED. These are
explicit deterministic API doubles, not native players, event traces or renders.

The fix changes callback ownership/coalescing before duplicate transactions.
The errors, selected-hand/type/revision checks and rollback implementation stay
intact. Native stack equality covers metadata for stackable storage inputs;
nonstackable or unknown comparisons fail open rather than dropping an action.
Only queued equal snapshots are held; success/failure releases them immediately.
Completed owned block work still consumes its bounded itemUse echo, while a new
authoritative block event can retry immediately. Foreign cancellation retains
its block-scoped ownership and is never widened into permission for another use.

Focused regression coverage is tools/shared-interaction-echo.test.mjs. It covers
all three source counterexamples, shared storage fallback echoes, fresh touch
false gestures, distinct real targets/hits/native metadata/players, immediate
success/failure retries, genuine conflicts and failed-write rollback.

Remaining acceptance: the exact 0.6.107 / 0.1.68 native pair must repeat the short
Creative cup click, storage insertion/pickup and protected break. These tests do
not establish every hardware callback sequence or every interaction domain.
