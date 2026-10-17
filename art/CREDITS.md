# Credits / 來源與署名

Original work: **Kaleidoscope Tavern / 森羅物語：酒館**.
Original author / licensor: **Kaleidoscope Official Production Team**.
This is an unofficial, noncommercial asset-conversion and appearance-test project. It is not endorsed by the original team, Loyallay, Mojang, or Microsoft.

Pinned upstream source:
https://github.com/KaleidoscopeMods/KaleidoscopeTavern/tree/6b0d619145316492f055e03d70427107cd73efa8

Target release page (the JAR has NOT been obtained or compared):
https://www.curseforge.com/minecraft/mc-mods/kaleidoscope-tavern/files/8350841

## Resource license

Original PNG textures are copied byte-for-byte and have not been repainted.
Original Tavern JSON models and the Tavern-authored portions of converted `.geo.json`, editor `.bbmodel` resources, and renders in this distribution are provided under **CC BY-NC-SA 4.0**. The same license is applied to the new resource adaptations. See LICENSE-ASSETS and:
https://creativecommons.org/licenses/by-nc-sa/4.0/

Changes: conversion from Java elements / ModelPart into centered editor models and Bedrock geometry; texture registration; appearance-only fixtures; local preview rendering. No original upstream trademark endorsement is implied.

## Code license

The original BarrelModel.java source is distributed under its upstream BSD 3-Clause notice. The asset tooling is provided under BSD-3-Clause as well. See LICENSE-CODE. No source code from Blockbench has been copied into this project; its published format conventions were consulted.

## References consulted for conversion

Blockbench Bedrock codec: X/rotation and UV serialization conventions:
https://github.com/JannisX11/blockbench/blob/574d8a0ae148fc5b36bb52b7bb1f8940022dd079/js/formats/bedrock/bedrock.js

Bedrock geometry 1.21.0 schema:
https://learn.microsoft.com/en-us/minecraft/creator/reference/content/schemasreference/schemas/minecraftschema_geometry_1.21.0?view=minecraft-bedrock-stable

bridge project configuration:
https://bridge-core.app/guide/misc/project-config.html

No Cookery package, source, or assets are included. Cookery remains a required dependency for the planned production port; its actual package identities have not yet been bound. The separate visual lab does not require Cookery because it exercises only these local assets.

## A2 resource adaptations

The cumulative A2 batch additionally includes seven original trellis shapes, four normal grapevine stages, eighteen crop-stage models, three grape item textures and six juice-bucket item textures. Java `rescale` is baked into cube bounds. Signed UVs and source `shade=false` are retained in geometry/material assignments.

`ice_grape.png` remains byte-identical as a full 12-frame strip. Twelve cropped frame PNGs and an offline interpolation WebP are new adaptations of that source, under the same CC BY-NC-SA 4.0 asset license. The in-game fixture uses only frame 0; it does not claim native inventory animation parity.

A2 migration tooling is newly written for this project. It is not a copy of Loyallay’s port. No Cookery code or assets are bundled. All original file paths and hashes are in `sources.lock.json`.

Bedrock block material instances and item visual documentation were consulted:
https://learn.microsoft.com/en-us/minecraft/creator/reference/content/blockreference/examples/blockcomponents/minecraftblock_material_instances?view=minecraft-bedrock-stable
https://learn.microsoft.com/en-us/minecraft/creator/reference/content/blockreference/examples/blockcomponents/minecraftblock_item_visual?view=minecraft-bedrock-stable


## A3 asset conversions and inspector

A3 adds six mature normal-vine shapes, ten ice-vine shapes, ten gold-vine shapes,
two wild-grapevine variants, and one oriented-face empty-bottle conversion candidate.
Four additional Tavern PNGs remain byte-identical. The original negative-dimension
bottle model is retained; only a separate candidate decomposes it into oriented
planes. Vertex/UV matching is not a claim of engine visual acceptance.

The local Canvas2D software-3D inspector and its tests are newly written asset tools
under LICENSE-CODE. No third-party JavaScript rendering framework or font file is bundled.
Images in previews are derived asset inspection results, not Minecraft screenshots.

## Separate Minecraft vanilla reference — NOT relicensed as Tavern CC material

`references/minecraft-1.20.1/cross.json` is a small vanilla model reference authored by
Mojang/Microsoft, retrieved from a third-party versioned asset mirror:
https://github.com/InventivetalentDev/minecraft-assets/blob/1.20.1/assets/minecraft/models/block/cross.json

Its original rights remain with Mojang/Microsoft. Neither the mirror's availability
nor Tavern's asset license is presented as a new license grant for this vanilla file.
The Tavern wild-vine JSON explicitly inherits `minecraft:block/cross`; conversion
resolves that reference to preserve its geometry and uses Tavern's own vine textures.
The source lock identifies this external reference separately, including its Git blob
hash. It has not been independently compared with an official Minecraft JAR here.

The planned Cookery production dependency remains unbound. A3 still bundles no
Cookery artwork, scripts, package, or private interfaces.


## A4 additions and source recovery

A4 adds 16 original sofa textures, six base shapes and all 96 inherited color/shape wrappers; full tree object SHA is verified against the pinned upstream directory. Source wrappers reconstructed from the exact public template are only accepted when the entire Git tree hash matches. Three bottle families (Champagne, Honey Wine, Ice Wine) include original count1–4 files; each reconstructed file must match its upstream Git blob SHA-1 before it enters `upstream/`. Emerald's two reversed-size elements are decomposed into directed panels, with UVs and shade flags retained. No source PNGs are repainted or recolored. Sources/paths/hashes are in `sources.lock.json` and `docs/SOFA-SOURCE-TREE.json`.

Geometry reuse across 16 colors is an output packaging choice. All 96 editor models embed the correct original texture. Java display transforms are recorded but not represented as game-tested hand/GUI parity. Source `translucent` is mapped to a `blend` candidate for Emerald; its PNG has only alpha 0/255. No artificial partial-alpha or PBR material maps are introduced.

Technical material reference (Microsoft): https://learn.microsoft.com/en-us/minecraft/creator/reference/content/blockreference/examples/blockcomponents/minecraftblock_material_instances?view=minecraft-bedrock-stable

## A5 dependency inspector and interface tools

`tools/cookery_dependency.py` is carried forward from the Tavern–Cookery M0 integration toolkit under its MIT notice; see `LICENSE-DEPENDENCY-TOOL`. That file retains its own license; this does not relicense any upstream Tavern or Cookery assets. A5's new SDK, linkage compiler, validators, wrappers, tests and docs are part of the port tooling under the project code license. No upstream art, geometry or texture was changed in A5.


## A6 追加來源與修改

本批追加固定提交下的 bar_cabinet / glass_bar_cabinet / cellar_cabinet 各四形狀、tilted_rack / circular_rack / glassware_holder，以及Vodka count1–4。共25份來源（19 JSON、6 PNG）逐檔驗證原始Git blob SHA-1。詳細路徑、雜湊和來源連結見 docs/A6-SOURCE-MANIFEST.json。

PNG保持原始位元組，未改繪、未變更alpha、未捏造PBR貼圖。衍生幾何轉換座標與UV，編輯檔內嵌原图，靜態展示定義與預覽是本專案製作；按LICENSE-ASSETS保留署名、非商業與相同方式分享要求。Cookery素材不包含在內，沒有聲稱官方認可。來源JAR與引擎驗收仍未完成。


## A7 追加來源與修改

新增 Rum、Sherry、Red Queen、Vinegar、Whiskey、Miners’ Star、Sauvignon Blanc Dry White、Sweet Berry Wine、Sakura Wine 的 count1–4 原作模型，以及 Empty Glassware 和 Screwdriver，共38個源模型及11張未重繪PNG。來源固定相同提交，49檔均以完整位元組的Git blob SHA-1核對，另記錄SHA-256。

部分重複排列來源由已讀取的原始資料重組，只有整份位元組與固定上游blob雜湊完全吻合才接受；沒有把猜測排列當作原作。相應方法註記見docs/A7-SOURCE-MANIFEST.json。此證據不代表已核對正式發布JAR。

杯內壁反向尺寸轉成有向平面，保留UV、面方向和shade標記；原始檔不修改。原作translucent語意映射成blend候選，原圖alpha保持不變（本批兩杯均只有0/255像素）。未額外繪製玻璃半透明像素或PBR素材。模型、編輯檔及離線預覽是衍生資源，依LICENSE-ASSETS署名、非商業及相同方式分享。Cookery仍未綁定，沒有附帶對方包或素材。

## A9 — pinned bottled arrangements and White Lady

The 44 new locked sources are 33 bottled-arrangement JSON files, White Lady JSON, and 10 original PNG files from the same pinned Tavern commit. All received/reconstructed bytes must match their upstream Git blob hashes. No author textures were repainted; translated inspection labels are local draft labels. See `docs/A9-SOURCE-MANIFEST.json`. Models/previews remain asset derivatives under LICENSE-ASSETS. No new third-party font or package is bundled.


## A12 — furniture, pendant lamps and a plain board

A12 obtains 28 exact pinned-source files: 17 original model JSONs, six PNG paths and five generated blockstate/parent-model references. Three lamp PNG paths share the same original image bytes. No original PNG is redrawn or recolored. See docs/A12-SOURCE-MANIFEST.json for full paths, byte counts, Git blob hashes and SHA-256.

Five inspection composites combine the original lower and upper parts at a 16-pixel vertical offset. These are explicitly derived assets, not five additional upstream models or gameplay implementations. Original tables and assemblies preserve missing faces, slender geometry, signed UV, rotation origins and source part dimensions. A dangling editor-only group index in base_top.json is recorded rather than adding a nonexistent cube; cullface intent is recorded without claiming Java neighbor culling parity.

Derived geometries, editor documents, assembly inspection views and image previews follow LICENSE-ASSETS (CC BY-NC-SA 4.0), attributed to Kaleidoscope Official Production Team. Conversion tools and tests retain their applicable code notices. No fonts, game JAR, Cookery package, user data or implied endorsement are included.


## A13 additions

Original incense closed/open model families (16 exact source JSONs), eight original incense PNGs; five original paintings and the common parent; blue stool base and two-bone body plus renderer reference. All source blobs are pinned in sources.lock.json and verified as full original bytes. The derived 128x32 stool atlas copies two original textures without scaling or recoloring and remains under the original asset license; it is not an original upstream file. No runtime particle, placement, seating or shader parity is claimed.


## A14 additions

Pinned commit remains 6b0d619145316492f055e03d70427107cd73efa8. Added nine original painting PNGs and their generated parent references, five original stool base/seat color pairs and generated child references, and the exact blue string-light model/texture.
Original Tartaric Acid metadata retains repeated frames [0,0,0,0,0,0,0,1] at 10 ticks; its third stored frame is not played. Five 128x32 atlases are derived by lossless pixel placement without recoloring. Original artwork remains credited to Kaleidoscope Official Production Team under LICENSE-ASSETS. Added conversion tools follow LICENSE-CODE; no upstream or Mojang endorsement is implied. See docs/A14-SOURCE-MANIFEST.json.


## A15 — four stool color sets and three separate string-light designs

Source commit: `6b0d619145316492f055e03d70427107cd73efa8`.
18 new pinned original files are listed in `docs/A15-SOURCE-MANIFEST.json`: original orange, magenta, light-blue and yellow stool image pairs and parent refs; red, white and black string-light models and images.
Original art: Kaleidoscope Official Production Team, CC BY-NC-SA 4.0 (`LICENSE-ASSETS`).
Changes: convert original model coordinates/UVs, create four lossless 128x32 combined stool atlases, bind unchanged source images, produce editable models and offline inspection renders. No recolored replacement art.
The original black-light model contains a string-valued `ambientocclusion`; this source is retained verbatim and flagged, not silently rewritten.
These are untested-in-Minecraft art candidates. No endorsement by the upstream team, Loyallay, Mojang or Microsoft is claimed.


## A16 — complete sixteen-color stool art palette and four additional light designs

Source commit remains `6b0d619145316492f055e03d70427107cd73efa8`. All 26 newly accepted raw files are listed in `docs/A16-SOURCE-MANIFEST.json` and match their full Git blob hash.
Original lime, pink, gray, light-gray, purple and green stool base/seat PNGs plus original generated model references complete the sixteen-color static family. Six 128x32 atlases copy original pixels without scaling or recoloring; atlases are derived art, not original upstream PNGs.
Original colorless, brown, cyan and gray string-light models are independently converted, with each source's dimensions, signed UVs, omitted faces and shading flags retained. They are not recolored substitutes of the blue light.
Art and derived geometry, editors, atlases and offline previews remain attributed to Kaleidoscope Official Production Team under LICENSE-ASSETS (CC BY-NC-SA 4.0). Conversion tooling retains its applicable code notices. No fonts, Cookery archive, game JAR or upstream/Mojang/Microsoft endorsement is included.
All added assets are static inspection candidates. No engine validation, gameplay, seating, illumination or placement parity is claimed.

## A17 uploaded JAR art baseline

Source: user-supplied `kaleidoscopetavern-1.2.0-neoforge+mc1.21.1.jar`, SHA-256
`03f35e1e614953b22cd1f5e34345613f3a6a283bf1b1c99659b57d58970edeff`.
Original art: Kaleidoscope Official Production Team. Original images/audio and derived models/atlases retain LICENSE-ASSETS (CC BY-NC-SA 4.0). No author/Mojang endorsement.
All305 originalPNG and6 originalOGG files are preserved bytewise in a distinct namespace; historical Git-pinned files remain unmodified.
2vanillaJava drip sprite dependencies are NOT included in the mod. Their nativeBedrockatlas mapping is a declared cross-edition substitution, not exact original pixels. Reference: Mojang/bedrock-samples water_drip.json at46ba6ea985fb5a92d79a9419198f10dda14c199d. No Mojang atlas or font is redistributed by A17.
Chalkboard Java source references are separately pinned and model constants cross-checked to the uploaded JAR. The referenced1.21.1branch commit is not asserted to be the build commit of the entire JAR.
Source bytecode listings were produced by read-only javap; no JAR was executed, and no executable JAR or class files are bundled here.
