# Shaker first-person frame candidate

Base: public main `0d30084021ddbfb09a478bc838eefb90d3ffd6d6`, Tavern 0.6.105.
Candidate identity: Tavern 0.6.106. No 0.6.105 runtime bytes are rewritten.

## Observed baseline failure

The root's actual Minecraft 1.26.52.3 x86_64 client with Efe in Creative and the exact public Tavern 0.6.105 / World Liquor 0.1.66 pair showed an invisible held shaker at rest and during use. Its inventory icon, placed model, three-input loading, pickup, hold/use and serving worked. A third-person front-view control showed the normal held gray shaker in the right hand. This narrows the observed failure to first-person placement; it does not establish a native 0.6.95 baseline result.

## Minimal source repair

The current first-person pose was calculated against Blockbench's display reference arm `[-20,21,0]` and display-camera offset, while the shipped grip is bound to the native player's item socket. The final historical source-backed repair at `bba84a194dca850c9ffe3189e4824433ccc794d6` uses the Mojang empty-hand hierarchy and a shared `[-3,6.5,-6.5]` framing adapter in both idle and use. Only these two first-person animation poses are restored. Third-person and player-arm channels, binding, geometry, textures, attachable selectors, item behavior, Java half-scale and the 2.4-pixel shaking waveform remain unchanged.

Pinned Mojang [first-person animations](https://raw.githubusercontent.com/Mojang/bedrock-samples/v1.26.50.4/resource_pack/animations/player_firstperson.animation.json) and [player item-socket geometry](https://raw.githubusercontent.com/Mojang/bedrock-samples/v1.26.50.4/resource_pack/models/entity/player_armor.json) were freshly downloaded and their SHA256 hashes matched the compact reference fixture. The independent socket regression rejects the old shipped pose and checks every authored cube corner throughout sub-tick shaking samples. These mathematical checks do not reproduce Minecraft rendering.

## Acceptance boundary

The candidate needs root-controlled actual rendered-client verification. No Blockbench GUI/MCP inspection, native candidate success, saved-world acceptance, production readiness, release publication or live deployment is claimed by this repair checkpoint.
