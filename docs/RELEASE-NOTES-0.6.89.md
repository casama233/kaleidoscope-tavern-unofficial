# Tavern 0.6.89 — native first-person shaker socket

Corrects the shaker's first-person idle and use transforms. Previous transforms were computed against the Blockbench display reference, not the pinned Mojang empty-hand arm/item hierarchy. Keep the Java display scale and camera-space shake trajectory; replace only the attachment basis. Third-person poses, player-arm animation, item-use dispatch and geometry remain unchanged.

Five additional independent-socket regressions cover idle, 336 use-time samples, rejection of the previous pose, unchanged third-person/player animations and binding preservation. The actual animation JSON was imported into Blockbench 5.2.1 and played, and its three model animations were read through the local MCP server. These checks do not establish Minecraft client rendering, device FOV or live acceptance.

See [evidence and limits](SHAKER-NATIVE-FRAME-20261002.md).
