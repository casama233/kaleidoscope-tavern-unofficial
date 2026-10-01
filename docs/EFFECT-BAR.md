# Shared custom-effect bar

The Tavern host reads authoritative remaining time and the strongest active
layer per ID every 20 ticks. Each page contains at most two effects and advances
every 60 ticks. Names remain client-localized, and native effects retain their
native HUD. No second effect store or countdown is introduced.

## Retained display candidate (0.6.75)

The old native ActionBar label can be overwritten by another addon. A controlled
200-tick fixture with a foreign writer every five ticks reproduced only ten
visible ticks for the old display. This is a reproduction, **not measured live
writer cadence**.

The new `§r[KT:FX] ` packet is captured by a dedicated ActionBar factory input.
A separate persistent property bag copies only matching packets, and a stable
label reads that retained text. Nonmatching ActionBar updates do not clear it.
The prefix is filtered only from native ActionBar text; shaker graphics, Java
Saturation filtering and ordinary messages remain intact. No nonexistent global
ActionBar binding is assumed: the documented factory `$actionbar_text` variable
is explicitly exposed through view properties.

Empty authoritative state or opt-out sends a namespaced empty payload to clear
only this retained display. It never sends `setActionBar('')`. A failed clear
remains retryable. Spawn resets the display; leaving forgets server view state.
Foreground hints retain priority for refresh timing, while a retained line does
not disappear during that pause. Milk/death/expiry clearing is not delayed by the
foreground quiet window.

## Verification boundary

The retention algorithm and JSON control graph are tested, not the native
Minecraft JSON UI evaluator. The new view-to-view conditional capture and
factory scope must be validated in a client before acceptance. Packet delivery
can still be affected by a same-frame writer; the API has no ActionBar getter or
cross-addon arbitration protocol. Another resource pack replacing the entire HUD
can also remove the controls. No universal compatibility claim is made.

Client checklist: Bloody Mary and a World Liquor timed effect, simultaneous
continuous ActionBar updates, countdown and pagination, shaker/barrel hints,
milk/expiry/death/rejoin, opt-out, GUI scales/touch layout and packet clear delivery.
If a client fails this checklist, keep the PR in draft rather than just increasing
the send frequency. Hiding the bar via `kaleidoscope_tavern:hide_effect_bar` remains
available without removing gameplay effects.

Tests: `node --test tools/effect-bar.test.mjs tools/effect-bar-retention.test.mjs`.

References: [official ScreenDisplay API](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/screendisplay?view=minecraft-bedrock-stable),
[JSON UI binding fields](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/jsonuireference/examples/jsonuicomponents/ui_element?view=minecraft-bedrock-stable),
[factory-scoped ActionBar variable](https://wiki.bedrock.dev/json-ui/json-ui-intro),
[local retained-property pattern](https://wiki.bedrock.dev/json-ui/preserve-title-texts).
