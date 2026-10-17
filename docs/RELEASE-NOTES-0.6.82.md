# Tavern 0.6.82 — authored Java shaker grip and use transform

Supersedes the unpublished local 0.6.81 candidate. Removes its already diagnosed non-Java extra pouring-arm gesture while retaining cup transactions, particles and sound.

The shaker now uses the source-authored 0.5 hand scale and complete Java-to-Bedrock coordinate conversion. Third-person grip position is [0,-3,-2.75], replacing [0,-1.5,-1]. First-person idle is source-frame converted; active shaking replaces idle with the complete Forge hand-transform matrix and transformed XYZ oscillation. It no longer adds a local Y wave and 15-degree Euler rotation onto the idle pose.

Both original Java shaker_3d and current Bedrock geometry were opened in official Blockbench 5.2.1. Native display/attachment previews confirm the corrected relative hand placement; static matrices compare all five-cube corners over 336 active time samples plus idle poses. Player-arm tests retain 1,008 phase/pose cases. This is not Minecraft client timing, owner-clock phase, touch, FOV/skin, or resource-stack acceptance.

Exact family dependency pairing: Tavern 0.6.82, World Liquor 0.1.46, Grilling 2.8.30; upstream archives unchanged. No live deployment.
