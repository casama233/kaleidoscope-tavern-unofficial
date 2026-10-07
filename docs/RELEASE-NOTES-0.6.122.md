# 0.6.122: instant health/harm before drink completion

Carignan bottles, ordinary addon cocktails and signature cocktails now dispatch
vanilla instant health/harm synchronously before the next effect entry and empty
container return. They keep the original per-entry Java float probability draw,
32-bit signed shift/narrowing and explicit undead inversion. Native harm keeps
self attribution and the engine's Resistance/Protection/absorption/hurt cooldown
and totem processing. No instant one-tick fallback, replay or polling HUD is added.

Known source classes work with Tavern alone. The bounded Server declaration API
allows optional addons to declare custom class/inversion and simple heal rules;
unknown classes/hooks remain explicit unresolved diagnostics. This declaration
does not prove arbitrary Java executable mod hooks or source damage-type tags.

Evidence: 22 arithmetic/dispatch and 5 actual drink-callback regressions; 18 real
zero-player Native observations, including 16 source-health matches and two
nonpositive hurt observations. Stopped QA NBT confirms equipped armor, Protection
IV, unchanged durability and consumed totem. Original failed observer scenes are
retained and not relabelled passed. Details and limits are in
INSTANT-HEALTH-DISPATCH-PROTOTYPE.md and the dated Native capability JSON.

Java indirect_magic knockback, exact Native damage/death callbacks, executable
heal hooks/custom class attributes, death dropped-stack alias and Player/client
consumption remain unfinished. APPLIED_NATIVE_INSTANT is API dispatch rather
than proof of accepted damage. This is progress toward full Java fidelity, not
complete Java or client acceptance. Existing T121 storage repair is retained.

Normal client scene: drink Carignan while below full health, compare a successful
instant-heal roll against Java while recording the final drinking frames, health
change and empty-bottle return. Repeat with an addon cocktail and signature
cocktail; cancel midway and switch slots to verify no early effect/return. Native
mob observations do not certify these real Player scenarios. Full canonical Git,
family loading/restart, fresh stopped-world rehearsal, admission and live readback
remain mandatory. Client=false and production_ready=false until dot acceptance.
