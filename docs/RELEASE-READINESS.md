# Public beta readiness — 0.6.42-beta.1

Complete Tavern BP/RP, based on 0.6.41 at `f533cc0119f68e3250c6216d04cfa555fd4b682c`. Previous PBR, cocktail icon, cup recovery, finite incense, storage, motion, grip and barrel-scale fixes are retained. Item/block IDs, recipes, saved-data formats and public Cookery 1.0.6 dependencies remain unchanged.

## Evidence

The 0.6.42 branch passed the full release checks, including localization, guide, Java storage-source comparison, previous visual/motion assertions and the new HUD/material checks. The downloaded CI artifact was compared to all 3,637 reviewed runtime files; archive SHA256 is `1c3916f3cce54756b6efc7eac67d085fc98b65103ebfd431e9dca7f7c7ba17b8`.

New HUD checks cover 512 slot combinations, 112 cursor states, 256 idle no-send samples and 26 literal image references. Block checks cover 160 block IDs and 2,473 effective world/item material configurations. No mixed render methods inside a Tavern material configuration or empty local block_placer target were found. Six differences across mutually exclusive states/item versus world rendering are reported separately, not assumed to be engine faults.

## Corrected own-code failure

Tavern no longer writes title/subtitle, including idle `ktmix:off` every two ticks. It does not replace vanilla title/actionbar controls. Active packets are readable actionbar strings; a dedicated factory uses literal textures and a configured 0.6-second lifetime. Idle/cancel/leave cleanup deletes private state without clearing another pack's shared channel. Native actionbar text retains the engine's own fade timing.

## Not verified

No Minecraft client, BDS or simulated-player interaction tests were run for this revision. Factory replacement/expiry, real-device motion, alpha sorting, actual A Magic Way/UI Queue/Novelty API versions and all resource-pack orders remain unverified. The actionbar channel is still shared and this is not a universal cross-pack scheduler.

The blank `Block  couldn't be found in the registry` line has no identifier or source path and remains unattributed. No unknown block is changed to air. The screenshot and own-code findings do not establish that every magenta magic-wheel image is caused by Tavern.

The named `STATUS-A2.7.14-SERVER.md` belongs to Grilling. Its current eight missing recipe unlocks and same-map big-vat material mismatch are being handled in that repository; historical private-server shims are not silently copied into this public Tavern pack.

## Provenance and installation

Original code, art and third-party licenses remain separate; see `CREDITS.md`. No other add-on, Minecraft client JAR, world, credentials or server executable is included. Back up and leave the world before updating both BP/RP. Private Cookery UUID/1.0.7 wiring remains a separate deployment concern; see `INSTALLATION.md`.
