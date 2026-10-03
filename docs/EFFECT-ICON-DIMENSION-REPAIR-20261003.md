# Effect icon HUD dimension lifecycle repair

Root reported active Tipsy and working `camera_api` after Overworld-to-Nether
travel, while the custom effect icon disappeared. The existing view already
compares dimension IDs and immediately sends the unchanged icon packet once.
Adding another dimension comparison would not address this case.

The source gap is admission timing: `createEffectIcons` remembers a successful
server send, without a client HUD receipt. If the client rebuilds its local HUD
after that send, the cached packet/dimension suppresses every later unchanged
snapshot. A deterministic display test reproduces this order. The three
transport variants all fail to restore the late-rebuilt display with the
pre-repair adapter. This is a source reproduction consistent with root's
observation, not proof of the exact native HUD rebuild time.

## Minimal repair

The existing adapter subscribes to the official
[player dimension-change event](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/playerdimensionchangeafterevent?view=minecraft-bedrock-stable).
Each event schedules two cache refresh admissions at +20 and +40 script ticks.
Each callback marks only a previously active view dirty; the existing 20-tick
HUD interval then reads current canonical status and sends the ordinary scoped
formatting snapshot. There are at most two additional sends per transition,
which can coalesce under lag. No perpetual keepalive is introduced.

A newer transition, leave or spawn cancels old callbacks. Invalid handles or
a different current dimension discard the pending work. Milk/expiry/hide changes
are read again at actual send time; stale active packets cannot be resurrected.
An inactive prefix-only snapshot receives neither delayed clear replays nor a
redundant immediate clear on a dimension change.

The existing strict prefix/duplicate-marker filter, UI property ownership,
native root, resources, queue election and transport choices are unchanged.
There is no empty-title clear, foreign-packet resend, native HUD visibility reset,
Actionbar write or player state mutation in this repair. The shared title
transport retains its existing coexistence limits: the official
[ScreenDisplay API](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/screendisplay?view=minecraft-bedrock-stable)
has no getter for the current title or its owner. Optional routers and scoped
UI caches remain the existing coexistence mechanism. Rendered foreign-title
coexistence still requires root's native check.

## Verification and remaining acceptance

The focused HUD tests pass 19/19, including nine new lifecycle tests covering
all three transports, delayed rebuild, bounded sends, inactive/hidden views,
Milk/expiry, rapid transitions, leave/rejoin, respawn and invalid handles.
The pre-repair adapter fails the three delayed-rebuild cases as expected.
The release test runner includes the new suite; preservation gates are unchanged.

Combined immersion/effect-bar/icon tests pass 50 tests, with one paired World
Liquor source test skipped because this worker has no `LIQUOR_SOURCE` checkout.
Four UI contract regressions pass, and the pinned Mojang root check preserves
29 native controls with zero registered root redefinitions. Static shaker HUD
compatibility and both changed modules' syntax checks pass.

The raw HUD generator `--check` fails in this Windows working copy; its RP file
has CRLF line endings and matches the unchanged Git blob after CRLF normalization.
This is recorded as a failed check, without
regenerating framework assets or weakening the gate. The full release check
stops at the unchanged `board-text.js` efficiency preservation hash
(`Efficiency source mutated`), after visual static checks and the 32 focused
Tipsy cases pass. Integrated release identity and preservation hash reconciliation
remain root's responsibility; no gate is relaxed.

Root should integrate this independent source commit, then drink a long actual
Tipsy drink and cross into Nether while it remains active. Check the icon after
HUD load and again after more than three seconds; verify it stays visible without
steady title traffic. Test return travel, rapid transitions, and Milk/expiry
during travel. Repeat with the existing foreign title/router and confirm its
owned cache is preserved. No rendered HUD recovery result is claimed here;
the finite retry window cannot guarantee recovery after an arbitrarily late
client rebuild. Signed Java roll remains NOT_RESTORED.
