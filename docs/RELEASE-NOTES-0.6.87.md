# Tavern 0.6.87 — standalone drink effect icons

Original effect icons now work with only Tavern BP/RP installed. The built-in transport needs no UI Queue, Cookery, World Liquor, AMW, server setting or experiment. Existing optional routers are reused when available. Unchanged effects do not send countdown updates; automatic text remains opt-in.

World Liquor owns its optional sprite definitions in its paired 0.1.51 release. Removing that addon leaves saved effect data inert without missing Tavern textures. Sneak-use the guide to inspect current names, levels and remaining time or toggle icons.

Canonical static/source checks and native loading/restart are separate from rendered-client acceptance. Native titles share a channel: the fallback may interrupt a simultaneous title on an icon change. Arbitrary third-party HUD replacements require client testing. No simulated players are used. See [transport contract and limits](STANDALONE-EFFECT-ICONS-20261002.md).
