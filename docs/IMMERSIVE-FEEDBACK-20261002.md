# Immersive feedback

Tavern 0.6.85 keeps normal play free of recurring effect and barrel Actionbar text. The owner's immersion requirement makes both optional displays opt-in, with no change to brewing, effect durations, inventory transactions or saved identities.

The Java reference is [KaleidoscopeTavern at c4ec188](https://github.com/KaleidoscopeMods/KaleidoscopeTavern/tree/c4ec1880bd44cf3139d3ba744ab30bb379cf1416):

- `client/gui/overlay/ShakerOverlay.java` draws ingredient icons and the shaking progress image. Those graphics remain enabled.
- `compat/jade/block/BarrelComponentProvider.java` exposes brewing status to optional Jade. Automatic barrel Actionbar status is disabled by default; the status fields remain available through the existing display.
- `item/ShakerItem.java` rejects insufficient ingredients with one Actionbar packet. Bedrock rejection text now sends once and fades naturally, instead of refreshing while the display is polled.
- `block/AbstractStorageBlock.java` sends rejection messages for unsuitable bottles. These rejection routes remain intact.

Successful shaking retains its item transition, sound and graphics and no longer announces “ready” as text. Leaving a HUD target never clears the shared Actionbar, so another addon's message can finish normally.

Servers that want the optional text can explicitly add `kaleidoscope_tavern:show_effect_bar` or `kaleidoscope_tavern:show_barrel_hud` to a player. Removing the tag stops refreshes. The legacy `kaleidoscope_tavern:hide_effect_bar` tag still takes precedence. No new menu or chat command is introduced.

Script regressions exercise long idle/active-effect windows, opt-in and removal, one-shot rejections, preserved shaker packets and a foreign Actionbar written before target cleanup. Static checks and native BDS loading are separate from actual client rendering and saved-world deployment acceptance.
