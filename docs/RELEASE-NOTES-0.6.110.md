# Tavern0.6.110: native-traced Sneak-transition cancellation repair

## Exact failure and minimal change

A second virgin-location Creative trial on the separately identified109/70
interaction probe reproduced one cup plus the yellow cancellation warning from
one bound100ms Shift/right-click at130.5,-60,130.5, yaw0/pitch45. The first trial
at120.5 did not reproduce it; that pass was not used to dismiss the failure.

The [bounded native excerpt](INTERACTION-SNEAK-TRACE-0.6.109.json) shows:

- seq32/tick18224: first=true block callback observes Sneak=false
- seq50: the original cup write succeeds after Sneak becomes true
- seq54/tick18225: a false continuation targets the same ground block while
  Sneak=true; the previous owned claim still records Sneak=false
- seq56: the mismatch queues the identical placement a second time
- seq67: the second execute raises SPACE_NOT_CLEAR from placeCup

The fix changes only the already-owned echo matcher to retain its original
Sneak value. The same item, selected slot and existing two-tick limit remain
required. Raw false continuations and itemUse fallbacks therefore stay with the
owned gesture across the native modifier transition. Fresh authoritative true
block callbacks retain their modifier-sensitive handling. A failed transaction
still releases its claim immediately. Foreign cancellation, genuine stale hand,
blocked placement, inventory rollback and immediate failure retry remain intact.
No warning is hidden or converted into success. No diagnostic logger enters
canonical runtime. No camera, effect, UI, model or gameplay tuning is included.

## Focused verification

The current20 shared-interaction API-double tests pass, including the native
sequence replay, pending press/release edges, fresh true actions, and changed-
modifier retry after failure. Replacing only the new matcher with109's old
matcher makes exactly the two new duplicate-regression tests fail (18pass/2fail).
These are source regressions, not native110 acceptance. The109 trace proves the
failure mechanism; a fresh110/71 actual-client retest remains necessary.

## Bounded production109/70 findings retained

Root's exact production archives were Tavern109 SHA256
`e95f04500f1d5a03e722b448e00763eb98e32445afbbfc5efb63308675b3aa37`
and Liquor70 SHA256
`fb81a789316c185c996ecd38ebd32fbf8db76431b99a115f4a0562ed39174ddc`,
with Liquor first in BP/RP priority and no diagnostic probe active:

- Normal Mystery consumption rendered its Tipsy icon
- The visible FOREIGN title coexisted with the icon
- Actual completed milk consumption cleared the icon; the guide later reported
  no custom effects and diagnose reported statusTicks0
- One100ms Creative Shift/right-click at virgin100.5,-60,100.5, yaw0/pitch45,
  still produced one cup plus false cancellation

Screenshots retained by the native operator: hud-foreign-native.jpg,
hud-milk-native.jpg, and t109-single-cup-false-cancel.jpg. These observations
supersede only the corresponding pending109 production-panel checks. They do
not accept all effects/models, camera roll, storage, breaking, FOV/skins/devices,
full Java parity,110/71, saved-world migration, live deployment or release.

## Identity and publication scope

Canonical110 synchronizes BP/RP/module, package, release, diagnostic build and
guide identities. World Liquor71 is the paired companion. Frozen109/70 and
historical rejected candidates remain unchanged. The separate diagnostic tools
remain pinned to their original109 source and are run from that frozen commit;
they are not repackaged into110. Git publication alone is not native acceptance,
a release, or authorization to deploy live.
