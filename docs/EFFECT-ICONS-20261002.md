# Active drink effect icons

Tavern 0.6.86 provides original Java effect sprites for currently active, host-managed drink effects. Native Minecraft effects keep their native display. World Liquor 0.1.50 restores its original 1.1.8 JAR sprites unchanged. The effect state, timers, milk clearing and death/reconnect rules are unchanged.

Sneak-use the existing Tavern guide to open current effect names, levels and remaining times. This is a snapshot with an explicit Refresh button, not an automatically opening form. The form also offers a personal icon toggle. Ordinary book use retains the existing seven guide entrances. Repeated text bars and barrel gaze text remain opt-in.

## Compatibility contract

- Icons use the installed UI Queue `ui_load_script` router. Tavern never calls `setTitle`, `updateSubtitle`, `setActionBar`, scoreboard display or HUD hiding for these icons. When UI Queue is absent, automatic icons stay silent and the manually opened effect details remain available.
- The reserved queue identifier is `kt_effect_icons`. Payloads contain only valid Minecraft formatting pairs, so even the native title renderer has no visible glyphs. No native title filter is overridden. UI Queue alone performs its existing zero-duration queued transport.
- A new namespaced root control reads only the reserved packet prefix and caches it across unrelated title updates. AMW's existing caches read distinct literal suffixes, and no AMW file/control is replaced. Each image has a literal allowlisted texture; packets never provide texture paths.
- A packet is sent only when the active icon set changes, the player changes dimension, or a spawn invalidates the view. Expiry, milk and icon opt-out send one scoped empty icon snapshot. Ordinary countdown changes do not send new packets. Actionbar users such as Java Saturation, Grilling, Farmer's Delight and Cookery receive no new competing writes.
- The 18×18 original sprites occupy a separate top-left panel below the usual coordinate area, with at most 32 packed slots. Native and AMW effect displays remain in their existing locations. Unknown future addon effects remain readable in details but need a reviewed sprite descriptor before joining the graphical allowlist.

## Evidence limits

`tools/effect-icons.test.mjs` checks lifecycle views, protocol safety and literal sprites. `tools/check_effect_hud_stack.mjs` audits actual active addons and executes their installed queue routing code with deterministic display handles. These are script/static checks, not native players or client acceptance. Exact full-stack BDS loading/restart is recorded separately. Real client GUI scales, touch controls, pack merging and simultaneous visible HUDs still need human rendering acceptance; BDS does not render JSON UI.

Existing UI Queue title transport can already interrupt unrelated timed titles. Tavern adds only finite change packets and does not claim universal compatibility with arbitrary additional title writers. Changing the live addon stack requires a fresh compatibility review.
