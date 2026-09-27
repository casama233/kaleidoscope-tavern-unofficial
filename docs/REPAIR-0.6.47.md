# 0.6.47 visual regression investigation

## Incense

Evidence: pinned Tavern Java `c4ec1880bd44cf3139d3ba744ab30bb379cf1416`, `IncenseBlock.animateTick`, `ParticleFactoryRegistry`, `IncenseSuspendedParticle`, `ButterflyIncenseLargeParticle`; official Minecraft 1.20.1 client JAR and official mappings inspected locally with `javap` (`ClientLevel` / `Particle`). No original JAR or decompiled class redistributed.

ClientLevel makes 667 samples at radius 16 and 667 at radius 32 per client tick. Each coordinate is `nextInt(r) - nextInt(r)` relative to the player's block position: triangular distribution, not a uniform cube. For coordinate differences d, P(r)=product(max(0,r-abs(d))/r²). Expected block callbacks/sec=20*667*(P(16)+P(32)); plume=callbacks/3, ambient=callbacks*5. At the maximum (same block), ambient averages 18.319702 particles/sec, decreasing with distance. Previous release used 48 everywhere inside 40 blocks.

Implementation uses a per-viewer one-second finite emitter. Stochastic rounding preserves sub-unit mean rates. A source emits at most two packets per viewer per second, not per particle. Another player's presence does not multiply that viewer's density. This reproduces expected sampling rates, not Java's exact random temporal bursts or renderer particle-setting culling. [Player.spawnParticle](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/player?view=minecraft-bedrock-stable) is viewer-specific.

Pine, ginkgo and snow use CherryParticle in Java, not the 25–50-second suspended-particle class. They now share the existing cherry trajectory adaptation and 15-second lifetime; ginkgo size multiplier is 1.5. Catnip and butterfly retain 25–50-second lifetimes but use Particle's normalized randomized initial velocity and gravity converted from per tick to per second: `0.04*0.01*20²=0.16`. Native Bedrock collision expiry and continuous trajectories remain approximations of Java. Particle initial speed supports [three-axis expressions](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/particlesreference/particlecomponents/minecraftparticle_initial_speed?view=minecraft-bedrock-stable).

## Animated held items

Four attachables overrode the native item renderer with an unbound `root` bone and crossed 5x5 zero-depth planes sampling only the corner of a 16x16 icon. Add item-slot binding at the known working hand pivot and first/third-person animations; use a thin two-sided full-icon card. Existing textures and animation controllers/timing remain unchanged. [Official attachment binding](https://learn.microsoft.com/en-us/minecraft/creator/documents/attachables?view=minecraft-bedrock-stable).

The user confirmed the new screenshot concerns mystery cocktail. Signature cocktail uses the native dyeable icon path and is not modified. Shaker poses and cup recovery code are unchanged.

## Barrel HUD

The script already sends translated status through the shared actionbar packet. The resource-side packet had slot and shaker-progress controls only. Add a centered status label above the hotbar, excluding slot/progress packets; keep the existing 0.6-second packet expiration. No title replacement, persistent text storage, scrolling bar or extra textures. Default/native actionbar behavior and stacking with other HUD packs still need a client check.

## Verification scope

Pure distribution/asset/schema checks and real isolated BDS loading; no simulated player interaction, no claim of client visual acceptance. Build/release evidence is included separately.
