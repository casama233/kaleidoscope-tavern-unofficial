# Finite title cooperation candidate — 2026-10-04

This is a source candidate, not native client acceptance. It starts directly from
`28ff1e41926a5b0a487474fc39bc285988d2cb40` / runtime `c643225f`. That ancestry
does **not** include the later shaker `b413` retreat repair. Apply this commit's
minimal diff to root's current integrated source; do not replace that checkout.
World Liquor's unpushed `.58` source is not modified.

## Failure and constrained repair

The existing formatting-only zero-duration title transport works on root's clean
cold-start test. Native title is nevertheless a shared display channel: the next
icon clear after actual Milk terminates an unrelated long title. ScreenDisplay
has no documented getter for that title's owner, text or remaining lifetime.
The independent subtitle replacement already failed native cold initialization
and introduced a dark subtitle background after title priming; PR171 is closed.

This candidate retains the existing title transport. A cooperating title writer
reserves a player's title **before** writing, covering the complete fade-in,
stay, fade-out and issuance/scheduling buffer. Icon packets stop for that finite
interval. Only Tavern's own parent panel hides when title text is foreign;
native controls remain untouched. Optional World Liquor children inherit that
visibility through the existing mount, with their title cache unchanged. After
the reservation ends, the next normal HUD poll sends the current active snapshot
or clears a previously active snapshot. It never replays a saved active packet
after Milk, expiry, death or a status change. A short reservation entirely between
polls also dirties the view so an unchanged active snapshot can return.

**Tradeoffs:** custom icons hide while foreign text occupies title. Arbitrary
uncoordinated `/title` producers remain unsupported; this is not universal
coexistence. Queue/embedded-queue modes reject reservations because already queued
packets cannot be drained or reserved by this API. Their prior delivery remains
unchanged. There is no title priming, keepalive, automatic chat/Actionbar message,
native effect impersonation, scoreboard state or dynamic-property save.

## Producer contract

Prefer the exported synchronous functions in `bedrock/effect-icons.js`:

```js
const end = reserveEffectIconTitle(player, 'my_addon:title', 1400);
// Only after success: show a title whose complete lifetime fits within end.
// Catch rejection and postpone the title or use a different producer channel.
// releaseEffectIconTitle(player, 'my_addon:title') only AFTER the title ends.
```

The transport must have finished startup and be `standalone`; the entity must be
a real player. Duration is an integer 1–2400 ticks. Up to eight owners may hold a
player simultaneously; releasing one does not release another. A continuous
window has a hard 2400-tick deadline. A renewal exceeding it is rejected rather
than silently shortened. Leave/pruning removes reservations; dimension travel
and spawn retain an ongoing reservation so their HUD refresh cannot steal title.
An expired window can start anew. This is cooperation, not a security boundary.

Player-scoped script events are also provided:

```
/scriptevent kaleidoscope_tavern:effect_icon_title_reserve {"owner":"qa","ticks":1400}
/scriptevent kaleidoscope_tavern:effect_icon_title_release {"owner":"qa"}
```

Events require a real `sourceEntity` player and affect only that player. They are
asynchronous and give no success acknowledgement; the producer must verify
acceptance through its integration before issuing title. The synchronous API is
the appropriate path for an atomic addon title writer. Server-source-only events
and guessed player identifiers are rejected. Malformed events report the existing
source diagnostics error without writing any display channel.

## Root's native acceptance steps

1. Integrate only this source diff onto root's shaker-preserving source. Use the
   existing private build/freeze process; this source worker changes no identities
   or immutable gates. Confirm `standalone` transport, fully close/relaunch, and
   consume actual vodka before any title command. Icons must appear with no dark
   subtitle rectangle; ordinary perspective/aim and small Tipsy motion still work.
2. With an actual active drink, reserve 1400 ticks from that real player. Wait for
   script-event handling and verify acceptance/no error in root's private test
   harness. Then use `/title @s times 0 1200 0` followed by
   `/title @s title QA_FOREIGN_TITLE`. The owned icons must hide while the foreign
   title stays visible. Actually drink Milk about 2–3 seconds later. The foreign
   title must retain its full requested lifetime; Tipsy/camera must clear normally.
   After the 70-second reservation ends, no stale icon may reappear.
3. Repeat with a real long mystery drink that remains active after 70 seconds.
   After the title naturally ends and the reservation expires, the current icon
   must return within the next 20-tick HUD poll, without a background rectangle.
   Repeat crossing dimensions during the hold and then after it; inspect both
   Tavern and World Liquor panels without changing World Liquor source.
4. Repeat natural expiry/death, Save/Quit/rejoin, motion and icon opt-outs, two
   owners, and a short title between HUD polls. Check native effect controls and
   first/third-person views. Repeat the uncoordinated-title control and record its
   limitation separately; do not use a cooperative pass to claim universal safety.

## Camera capability checkpoint

Pinned Java `c4ec1880bd44cf3139d3ba744ab30bb379cf1416` adds signed roll from
`sin(t/19)*.6 + cos(t/13)*.3 + sin(t/9)*.1` while Tipsy is present, independently
of amplifier. It does not add a movement penalty, sound or nausea to Tipsy.
The existing short, bounded native rotational shake is an approximation. Root
reports small visible motion but approximately zero horizon roll. This commit
does not change the camera implementation or assert restoration of signed roll.

Bedrock does expose three-axis rotation in cinematic keyframes; saying it has
"no roll API at all" would be false. The documented free-camera animation flow
selects `minecraft:free`, uses prescribed rotations, then clears back to gameplay.
Ordinary camera rotation uses Vector2. The reviewed interfaces do not document an
additive signed-roll hook that preserves ordinary freely aimed first/third-person
camera and another addon's camera. Substituting a cinematic takeover would violate
those requirements. Native shake also exposes no signed axis/frequency control.
This is a documented-capability inference, not proof against future engine APIs.

Official sources reviewed on 2026-10-04: [ScreenDisplay](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/screendisplay?view=minecraft-bedrock-stable),
[CameraSetRotOptions](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/camerasetrotoptions?view=minecraft-bedrock-stable),
[RotationKeyFrame](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/rotationkeyframe?view=minecraft-bedrock-stable),
[Free camera tutorial](https://learn.microsoft.com/en-us/minecraft/creator/documents/camerasystem/freecamerascriptapitutorial?view=minecraft-bedrock-stable),
[CameraShakeOptions](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/camerashakeoptions?view=minecraft-bedrock-stable),
[JSON UI bindings](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/jsonuireference/examples/jsonuicomponents/ui_element?view=minecraft-bedrock-stable),
[pinned Mojang HUD](https://github.com/Mojang/bedrock-samples/blob/46ba6ea985fb5a92d79a9419198f10dda14c199d/resource_pack/ui/hud_screen.json).
Chat collection bindings and shared sidebar/native player properties supply no
verified independent Script-fed cold-start string channel here; they are not
implemented as substitutes. Rendered panel hiding/readmission and the paired
addon inheritance still require root's native acceptance.

## Source validation

The combined Node command using `--loader ./tools/efficiency/mock-loader.mjs`
runs Tipsy client/observer, effect icons/startup/prefix/reservation (which imports
the dimension suite), effect bar and immersion feedback: **102 pass, 0 fail,
1 skip**. The skip is the existing paired World Liquor source check because this
isolated checkout has no paired source. No native engine or simulated player is
represented. An initial invocation without the required loader failed two test
files at import (`@minecraft/server` unavailable); the corrected invocation passes.
Four Python UI regressions pass; the pinned native-root audit preserves all 29
controls with zero registered native redefinitions. HUD generator check, changed
runtime syntax and `git diff --check` pass.

`python tools/check_release.py` remains **blocked** at the existing preserved
`runtime/BP/scripts/bedrock/board-text.js` efficiency-source hash. Its earlier
Tipsy 32 cases and visual/source checks pass; later release checks are not reached.
This candidate does not modify that file, release identities, locks, history,
freeze preimages or gate allowances. Native loading, root's new client scenarios,
queue ownership integration and release admission remain unrun for this commit.
