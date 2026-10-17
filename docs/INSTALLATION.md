# Installation and migration

## Standalone Tavern 0.6.80

Enable Tavern BP and RP together. Cookery is not required. Minimum engine remains Bedrock 1.26.50; Script APIs remain `@minecraft/server` 2.7.0 and `@minecraft/server-ui` 2.0.0. No experimental API is required.

- BP UUID: `f54f37f9-485a-55bf-8f89-6558aca988c5`
- RP UUID: `c2990d50-2cf7-59f7-886a-0f2d0240d156`
- Craft one vanilla book and one Tavern grape into the Tavern Guide, or obtain it from the brewing creative group.
- Use the Tavern Guide to open the independent book. Existing Tavern recipe books also open it without replacement. Language can be selected in its main menu.
- The seven sections and all registered addon content use the same data as the optional Cookery chapter.

## Optional Cookery integration

With [Cookery 1.0.8](https://www.curseforge.com/minecraft-bedrock/addons/kaleidoscope-cookery-unofficial), place Tavern above Cookery in both pack stacks. Cookery's normal guide receives the same Tavern chapter through its public guide API. No Cookery scripts or assets are bundled or overwritten.

The verified public Cookery identities are BP `d322809c-a51e-4742-bfc4-16d3c1491c9d`, RP `8e2c6318-2f5f-4907-aad0-31d10610e405`, version 1.0.8. Public archive SHA256: `9e5b617cc4c7a08ecd429fb9e42ec10e8d40a1ed5fc1f6f6687c3aff8a45a5d5`.

Other family addons may still require Cookery. Optional Tavern integration does not remove another pack's own dependencies. Install matching public versions of Tavern and World Liquor; do not install the independent author's Tavern simultaneously because both use the same content namespace with different pack UUIDs.

## Existing private server installation

The earlier `Family` build depended on locally rebased Cookery UUIDs `403f7a4a-a837-42c8-b5d3-76d5079ef269` / `8f39983b-00a6-4818-b489-0a73daf3bc87`, version 1.0.7. It also composed HUDs from other installed add-ons. Those private integration patches are not part of this public public beta.

Keep the existing server on its installed build until its pack-stack migration is prepared. Do not enable two copies of Cookery or Tavern simultaneously. Back up a world before changing its dependency stack. Tavern's own UUIDs, item/block identifiers and persistent storage keys are preserved.

The public HUD patches only Tavern controls in `hud_screen.json`. A separate pack that replaces that file can still need an integration patch. The public beta does not replace `minecraft:player` resources; shaker arm clips are started by the existing Script API animation calls.
