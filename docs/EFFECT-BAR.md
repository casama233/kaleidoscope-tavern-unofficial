# Simple shared effect bar

Scope: only a compact ActionBar. No new guide page, popup/refresh/expiry notification system, JSON UI, effect icons, or fake native potion effects.

The Tavern host reads `statusNow(player)` every 20 ticks and displays the strongest active layer per custom-effect ID. Remaining time is always the host's time, never a second counter. Level I is omitted; II–X use Roman numerals, larger levels use numbers. Times round up to seconds; long durations use H:MM:SS. Each page shows at most two effects and rotates every 60 ticks. Names use existing `effect.<namespace>.<id>` resource-language keys, including the newly exported World Liquor names.

The native effect HUD is untouched. Milk, expiry, death and reconnect need no new save format: the view follows the host state. Inactive players generate no ActionBar writes. The last message fades naturally after updates stop; we deliberately do not clear a shared channel with an empty string.

Foreground: shaker/barrel HUD takes priority; block/item interactions reserve a three-second quiet window for interaction messages. This does not guarantee compatibility with arbitrary third-party continuous ActionBar writers: the official ScreenDisplay API has no current-actionbar getter or ownership/merge protocol. For such servers, opt a player out with `tag <player> add kaleidoscope_tavern:hide_effect_bar`; remove that tag to restore the bar. No new settings menu is added.

This feature does not change the effect's gameplay implementation. Existing incomplete effects remain incomplete even when their active timed entry is visible. Instant actions do not acquire fake duration bars.

## Pairing and validation

The bar is implemented once in Tavern. World Liquor only supplies its translated names and continues using the shared lifecycle introduced in the paired foundation PRs. Both PRs must be used together. No released version or release-request metadata is bumped by this work; main's 0.6.42 shader/HUD compatibility fixes are preserved.

`LIQUOR_SOURCE=/path/to/world-liquor node --test tools/effect-bar.test.mjs`

Tests cover formatting, per-player isolation, host timer reads, stronger/weaker layers, refresh, pagination, expiry/no idle writes, foreground priority, opt-out, invalid handles/state, entrypoint wiring, and English/Simplified/Traditional Chinese names for the paired effects. The source host's existing foundation and HUD checks still apply.

No Minecraft client, BDS, touch-layout or simultaneous third-party HUD test has been run. On-device acceptance: drink with two different timed effects; verify countdown and pages; open shaker and inspect barrel without bar contention; drink milk; die/rejoin; have two players carry different effects; exercise GUI scales and another continuous ActionBar addon.

Official API: https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/screendisplay?view=minecraft-bedrock-stable#setactionbar
