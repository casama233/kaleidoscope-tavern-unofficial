# 0.6.155 — persistent shaker HUD receiver

The reported failure is that eating and shaker graphics are absent while vanilla and AMW HUDs remain visible. The shaker progress container still tested the removed printable ` / 111` protocol and an unbound `$kt_text`; every current formatting packet failed that ancestor gate. The existing checks inspected sprites but missed their parent.

Shaker graphics now mount permanently in their own namespace, retain only their formatting channel, and select the current literal sprites from that cache. They no longer depend on a zero-duration title creating a factory instance or an initial `once` binding capturing data. Remove the obsolete progress-container gate. Interleaved foreign titles cannot overwrite the cached shaker state. Normal end/cancel sends the existing owned terminal packet; a missed refresh sends it after 12 server ticks. Departures cancel the timeout. Queue routing, native HUD controls, AMW mounts, Actionbars, gameplay and saved data are conserved.

The cursor follows the received server-tick position (1.5 pixels per tick, 112 states). Client partial-tick interpolation is pending; the prior factory animation is removed with the unreliable factory lifecycle. This release does not claim fully rendered Java parity.

Targeted checks exercise actual shipped visibility expressions with initial, slot, progress and terminal packets; late channel input, foreign-title interleaving, timeout replacement and disconnect are covered separately. Original textures remain unchanged. Full canonical CI and complete-family admission/deployment are required. `client=false`, `production_ready=false`; client visibility remains pending until observed in Minecraft.

Paired candidate: Tavern 0.6.155, Grilling 2.8.133, World Liquor 0.1.132. Private integration 1.0.34 and Ribbits 1.0.10037 remain unchanged. Java upstream read-only status was checked at 2026-10-13T04:23:03Z; this repairs the Bedrock UI transport, not Java gameplay.
