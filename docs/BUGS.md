# 玩家可見問題與待驗收項

## 當前 0.6.137

修正已保存原生光效被重啟 EffectAdd 誤判為外部刷新；保留本輪倒轉 Mob 與 W114 重生錨修復。

新的零玩家原生首次／正常停止／重啟已通過，並確認來源光效恢復後，外部同 amplifier 刷新恰好交還一次控制。完整 recorder 綁定實際凍結輸入；真正 Player 與真人畫面仍需分別驗證，見 [本版說明](RELEASE-NOTES-0.6.137.md)。


## 保留 0.6.136

倒轉效果：同場放鱈魚、鮭魚、熱帶魚、牛與盔甲架，核對有效 Mob 名單及 Grumm；玩家與盔甲架不得更名。名稱可見性與實際魚類倒轉仍需真人比較。配套 W113 原生錨場景見其 release notes。

來源與可分辨回歸見 [本版說明](RELEASE-NOTES-0.6.136.md)；下方舊版段落保留歷史範圍。

## 保留 T135／W112：真實 CI 缺口修復

[T135 說明](RELEASE-NOTES-0.6.135.md) 承接下方 T134 的實作與真人場景。
T134 CI run `37869770416` 失敗保留：本版補齊冰葡萄 24 幀與 RGB 白色
表面的 PBR companions，並修正原生 Adventure 清單回傳未含 `minecraft:`
前綴時，合法可堆疊原料被拒絕的問題；原字串、順序及雙向原生相容核對
仍保留。Ardent 的另一個失敗來自 fixture 缺少有剩餘時間的 `getEffect`，
已補測試替身，未放寬斷言或改動該處正式行為。

新增真人場景：具名可堆疊原料帶 `canDestroy`／`canPlaceOn`，投入、取回、
重放及正常保存重啟後核對清單與數量。PBR 仍需標準／Vibrant Visuals
實際畫面比較。W111 CI 成功不替代新的 T135／W112 配對結果；本版窄視覺
檢查通過只證明靜態資源和規則，最終 CI、原生、真人及 LIVE 驗收仍待完成。
原先未實作與私人完整家族／LIVE 限制均保留。

## 保留 T134／W111 範圍：原料、狀態粒子與原版視覺

[T134 整合說明](RELEASE-NOTES-0.6.134.md) 是本批單一範圍，保留 T132、
[T133 座標修正](RELEASE-NOTES-0.6.133.md) 與下方原版本證據。PR298 的修復
已承接，但整合時該 PR 仍 open／draft；本頁不把它寫成已合入 main。
相同候選需要完成下列真人場景：

1. 酒桶／壓榨桶放入同 ID 不同名稱的合法原料，以及帶損耗、附魔、lore 的物品；取出、壓榨、發酵、退料、拆除及正常保存重啟後核對原物品與數量。
2. Survival／Creative／Adventure 比較水奶桶、空手取料、滿背包及 doTileDrops=false；拒絕或失敗不可扣料、重複掉物或遺失 carrier。
3. 具名雪克杯放置後加入第一瓶原版水，核對返瓶、取回／重放及重啟；再以具名可堆疊原料重複操作。不能證明完整保存的裝飾非堆疊輸入應原封不動留在手中。
4. 黑色和彩色發光板面比較近／遠、字重、斜體、四向與使用者對齊延伸；彩色 16 格腳位／眼位判定和望遠鏡仍有明列差距。
5. 不同時間放入冰葡萄、關／開蓋及重新載入，核對共用動畫幀；杯子同時比較 atlas 內外 RGB、各面明暗、透明、動畫及遠距濾波。
6. 自訂／自有原生／外部效果疊加、外部同強度刷新、牛奶清除與重新載入，觀察混色和重複粒子；外部效果不能被移除或縮短。
7. 草叢潛行後站起／離草／清除效果，核對退出隱形；微醺預設瞄準不移動，舊水平適配只在明確 opt-in 後啟用。
8. W111 保留 W110 的 Dassai Q3–Q6 效果資料及四款更新杯子；比較飲用／調酒／指南數值、模型／物品圖、資源堆疊與實際視角。Luck 原生掉落效果仍未實作。

API fixtures、零玩家 observer、真人與 LIVE 是不同證據。PR297 最終修正
已承認 XP orb 沒有 health，以明列 health_helper 核對 health-positive
政策，不把它當作 XP pickup 或 Java 類別證明。純 roll、穿牆輪廓、全身／
裝備隱藏、清除仇恨、多行板面編輯器、三份任意非堆疊原料及掉落雪克杯
展示上下文仍未一比一。下方舊版限制保留其歷史範圍，當前已修與未修
以 T134 說明為準；本頁不預先宣稱最終 CI、client 或 LIVE 通過。

## 本批 T132：濺射、回呼、保存及顯示

[T132 修復說明](RELEASE-NOTES-0.6.132.md) 是本批單一範圍。
真人驗收先使用相同候選重現以下可辨識場景：

1. 最後一瓶原料加入後、兩手皆空的副手放置後，雪克杯不被同一次回呼立即拿回；下一次正式手勢仍能取杯。
2. 持合法原料直接觸控／手柄點取站台；主手只加入一份，保護區拒絕不被其他回呼繞過。
3. 同一酒液比較飲用、近距濺射及直擊；盔甲座不吃濺射，亡靈反轉和自訂已宣告 hook 各自核對。
4. 感知附近放船、牛、盔甲座和鱈魚；確認生物音效、重複目標及隔牆輪廓。來源類別已修不代表輪廓已存在。
5. 開啟深水炸彈／神祕雞尾酒／下界特調／冰葡萄指南圖示；核對動畫、透明、不同 UI 包及七入口。
6. 板面同時保留字面 `\n`、反斜線及真換行，重開提交不能變字；停止雪克杯時觀察材料槽0.5秒、進度0.05秒的剩餘尾巴。

來源／API fixtures 與本批原生 observer 各自保留範圍；板面仍是單行
escape 編輯器，完整三份任意 ItemStack、純相機 roll、RGB 陰影、掉落3D、
真正穿牆輪廓及原生效果階段仍待完成。舊版證據不改寫成本批 client 成功。

## 本批 T131：直接操作、副手、動畫與交易

[T131 修復說明](RELEASE-NOTES-0.6.131.md) 記錄已修的直接觸控、香薰持物
使用、轉椅回正／換座、冒險模式普通設施使用、靜默雪克杯操作與副手交易。
四種動畫物品已改接原生資源路徑；感知新目標音效不再依賴不可用輪廓 API。
板面扣料／保存共同回滾，農架上／去蠟不再多消耗材料／斧頭耐久。

新增反例還修正舊 stop 中斷新一輪搖酒、跨手 echo 繞過外部取消、潛行
鬆開後重複取杯，以及交易失敗後立即重試被吞掉。下方 T130 及更早的
成功記錄保留其原版號；本輪 source/API fixtures 不當作新原生或 client PASS。

同一候選的首批真人驗收：

1. 滿料／已完成／空雪克杯的點擊及空中使用，觀察原料提示與聊天品質訊息。
2. 兩手各放不同物品，副手搖杯、提早停止、立即重啟、倒最後一份及快速換槽；
   保護區取消後不能再由另一手回呼執行。
3. 觸控點取掛杯架不同格位；手持物切換香薰；兩張椅子換位、离座後朝向回復。
4. Adventure 的板面染色／上蠟／編輯、農架剪枝與採果；材料與資料各只改一次。
5. 四種物品在 GUI、快捷欄、第一／第三人稱及掉落時的完整動畫與食用；
   不同 FOV、標準／Vibrant Visuals 與多人旁觀各自記錄。

仍未一比一：完整內部原料 ItemStack、任意 RGB 紋理陰影、純相機 roll、
穿牆輪廓、全局 reach／步高／仇恨清除、掉落雪克杯3D、原版多行編輯器、
HUD 即時隱藏及現有原生效果邊界。新 RGB 多遮罩方案因 mip 破洞風險撤除。
完整狀態及下一場景以 [PARITY-MATRIX.md](PARITY-MATRIX.md) 的 T131 表為準。

## 本批 T130：可用 API、展示效率與名稱路由

[本輪修復與驗證](RELEASE-NOTES-0.6.130.md) 補上斜架／酒櫃的單次查詢、
差異更新及未載入保護，讓雪克杯只在投入動畫期間安排復原回調；並修復
醇熱逐 tick 結束條件、生物 Bloody Mary、舊杯可讀外層資料及日／俄文登錄。

三張中文附件的精確名称鍵在 T129 已存在。這是仍需在 T130/W107 核對
版本、資源包堆疊及實際 tooltip 的客戶端現象，不是已證明的當前缺鍵。
參見 [語言審查](NATIVE-LOCALIZATION-REVIEW.md)。原生怪物 equippable
缺口已由實際引擎確認；摸金卸裝仍不可宣稱完成，見
[效果能力紀錄](COCKTAIL-EFFECTS-API-20261008.md)。

T130 舊杯跨 ID 轉換保存当前 BP scope 可讀寫欄位，不等於另一 BP UUID
私有資料或任意 NBT 的無損轉換。舊 ID 堆疊如帶有不支援的可變元件會保留。


## 保留的 T129 雞尾酒修復

[完整變更與驗證範圍](RELEASE-NOTES-0.6.129.md) 集中記錄原料 gate、空瓶交付
順序、創造放置、空中清空、碰撞／破壞設定、放置杯外層資料、HUD／提示／
指南、個人音量及兩個效果適配。先前「任意物品可投入」及「背包滿即拒絕
退空瓶」的來源差距已修；真人互動與全視角畫面仍待同一候選驗收。

放置杯現在保存完整外層 ItemStack，但無法保存附加資料的原料仍在投入前
拒絕。三瓶原生藥水的 nested item 容器方案因實際容量限制未採用，見
[能力記錄](../data/native-shaker-storage-capabilities-20261008.json)。歷史
active/pouring 改 ID 遷移也不能宣稱外層 metadata 無損。這些限制與下面
T128 手持轉換已修的範圍需分開。

## T-SHAKER-METADATA — T128 手持修補保留，T129 延伸至放置杯

具名手持雪克杯提早停止、完成搖酒或倒酒時，舊 `portable()` 會重建
ItemStack，丟失名稱、外部 dynamic property 及自訂 lore。T128 從現行
來源保留 clone、提早停止零庫存寫入及只更新自有 lore，沒有帶回舊配方
registry。`tools/shaker-item-retention.test.mjs` 執行真正 callbacks，核對
一次結算、保留資料及失敗回滾。實際 BDS、重登與玩家畫面仍待同一候選驗收。

驗收：具名且帶外部資料的已填杯先提早取消，再完成特調並倒入空杯；每步
核對原雪克杯名稱／資料與份數，再正常保存、重啟及重登。這項來源修補不
代表放置方塊的完整 ItemStack 保存或全套 GUI 已獲認證。

來源：T0.6.126／W0.1.103 的 Phase0 盤點。此表區分已確認實作差距、歷史限定觀察及當前待測，沒有把「未測」寫成「已重現 bug」。實際還原狀態統一維護於 PARITY-MATRIX.md；舊逐版證據只作引用。T/、W/ 表示來源倉庫。

## T-GLASS-PBR — 普通玻璃亮度、透明排序、PBR

現行狀態：`implementation_present_current_visual_pending`。

Java 比較來源：refs: T/art/source-jar.lock.json; T/art/sources.lock.json; scope: Original glass textures/models and tint separation; Bedrock PBR values are conservative port tuning, not Java-authored PBR truth.

正式入口：T/runtime/RP/textures/kaleidoscope_tavern/block/mixology/empty_glassware.texture_set.json:5; T/tools/refresh_visual_compat.py:109; T/tools/refresh_visual_compat.py:124

來源檢查：level: L0_material_configuration; refs: T/tools/check_visuals.py:27; T/docs/VISUAL-MATERIAL-AUDIT-0.6.110.json; facts: Current empty_glassware MER=[0,0,150]. Static checks prevent excessive emission/transparent emitting texels; they do not measure brightness or transparency.

原生引擎：scope: Exact T126/W103 full-family load/restart and saved-world deployment gates passed per CURRENT-WORK; loading is not an affected gameplay/render scene.; affected_scene: False

客戶端：current_acceptance: False; meaning: No current T126/W103 client observation located in reviewed sources; this is pending, not a reproduced current defect.

最小重現／驗收場景：

- 同一光照擺空杯、普通有色飲品及真正燈具，先普通渲染，再Vibrant Visuals；日/夜及背光各看一次，四個方向移動，與Java同材質場景並排。

仍需完成：

- 普通玻璃過亮是歷史回報，尚無當前重現；曝光、透明排序、PBR硬體/資源包堆疊仍待D。

## T-SIGNATURE-GUI — 特調庫存/快捷欄圖示杯身完整、僅酒液染色

現行狀態：`implementation_present_current_gui_pending`。

Java 比較來源：refs: reviewed-java-checkout/java-tavern-upstream/src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/client/render/misc/SignatureCocktailColor.java:27; T/data/upstream/c3/javap/item.SignatureCocktailBlockItem.txt; T/art/source-jar.lock.json; scope: Selected original source says tintIndex1 uses item color and other layers stay white; archived checkout/source locks must not be mislabeled newest branch acceptance.

正式入口：T/runtime/BP/items/signature_cocktail.json:12; T/runtime/BP/scripts/bedrock/mixology.js:71; T/runtime/BP/scripts/bedrock/mixology.js:79; T/runtime/BP/scripts/bedrock/mixology.js:272; T/runtime/RP/textures/kt_runtime/signature/icon_dyed.tga

來源檢查：level: L0_texel_and_wiring; refs: T/tools/check_visuals.py:42; T/tools/check_visuals.py:51; facts: Full16x16 default/dyeable icon routes and glass/liquid alpha mask checked; texel counts are asset preconditions, not GUI acceptance.

原生引擎：scope: Exact T126/W103 full-family load/restart and saved-world deployment gates passed per CURRENT-WORK; loading is not an affected gameplay/render scene.; affected_scene: False

客戶端：current_acceptance: False; historical: T105 real-client report confirms a completed signature and named BloodyMary; it does not explicitly certify the full signature inventory mask/all scales.; refs: T/docs/PUBLIC-TEST-VALIDATION-0.6.105.json

最小重現／驗收場景：

- 用三個Java已知顏色且不形成固定配方的材料製作特調；取回，開背包並切快捷欄，比較杯身形狀、透明邊緣及酒液色；重登後再看。

仍需完成：

- 歷史『一小團藍色』不得當成當前已重現BUG；當前全GUI尺度、資源包堆疊及重登顏色待D。

## T-SIGNATURE-3D — 特調放置酒液色/紋理動畫、外部RGB

現行狀態：`bounded_historical_render_verified_external_rgb_shading_gap`。

Java 比較來源：refs: reviewed-java-checkout/java-tavern-upstream/src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/client/render/misc/SignatureCocktailColor.java:14; reviewed-java-checkout/java-tavern-upstream/src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/blockentity/mixology/SignatureCocktailBlockEntity.java:37; T/art/source-jar.lock.json; scope: Source retains per-cup RGB and tints only liquid layer.

正式入口：T/runtime/BP/scripts/bedrock/mixology.js:225; T/runtime/RP/render_controllers/signature_tint.json:27; T/runtime/RP/render_controllers/signature_tint.json:35; T/runtime/RP/render_controllers/signature_tint.json:65

來源檢查：level: L0/L1_data_and_texel; refs: T/tools/signature-rgb.test.mjs:10; T/tools/check_shaker_signature_colors.py:28; facts: Existing336-entry exact Java mean-color atlas retained. RGB arithmetic test mirrors the mean formula and is not an independent rendered oracle; source texture/frame checks only verify declared assets.

原生引擎：scope: Exact T126/W103 full-family load/restart and saved-world deployment gates passed per CURRENT-WORK; loading is not an affected gameplay/render scene.; affected_scene: False

客戶端：current_acceptance: False; historical_render: version: T105/W66; status: bounded_pass; facts: Three actual wine inputs produced a shaded magenta signature; Java-red atlas liquid rendered red with textured shading; Out-of-domain pure-red RGB fallback rendered red with flat shading; supersedes: T102 white/gray material failure is historical and partly superseded by T105; do not claim it persists universally.; refs: T/docs/RELEASE-NOTES-0.6.105.md:17; T/docs/PUBLIC-TEST-VALIDATION-0.6.105.json; T/docs/NATIVE-T102-COLOR-RGB-20261005.json; inheritance: Current signature_tint last changed in T105 commit d0f6f480; this supports retention of the shader route, not full T126/client acceptance.

最小重現／驗收場景：

- 做一杯Java標準顏色混合特調，放置後從四面看酒液與玻璃；另用正式API注册atlas外RGB（如0x123456）材料，製作同一色特調並對照Java陰影，取回再放置。

仍需完成：

- 外部atlas外RGB已知使用平面overlay陰影，非Java像素等價；FOV、影格、所有混色與堆疊待D。

## T-SHAKER-HELD — 雪克杯第一/第三人稱rest/use/release可見與動作

現行狀態：`bounded_historical_client_pass_current_matrix_pending`。

Java 比較來源：refs: T/art/interfaces/shaker-held-java-reference.json; T/art/interfaces/shaker-hand-source.json; scope: Source1.2.0 shaker_3d display transforms and source animation waveform; first-person ordinary filled shaker has no separate skin arm in examined Forge1.20.1 source, not all-branch client proof.

正式入口：T/runtime/RP/animations/runtime_shaker.animation.json; T/runtime/BP/scripts/bedrock/mixology.js:267

來源檢查：level: L0_source_transform_checks; refs: T/tools/test_shaker_native_frame.py; T/docs/SHAKER-FIRST-PERSON-0.6.106.md; facts: Source/socket transform and animation wiring checks do not certify every rendered frame.

原生引擎：scope: Exact T126/W103 full-family load/restart and saved-world deployment gates passed per CURRENT-WORK; loading is not an affected gameplay/render scene.; affected_scene: False

客戶端：current_acceptance: False; historical_render: version: T106/W67; status: bounded_visibility_pass; facts: Empty and filled first-person resting shaker visible; Actual3900ms use/release retained cup/progress; cup survived progress expiry; Third-person front held model visible; Paired cold-load iced tea bottle name/icon/held model visible; refs: T/docs/PUBLIC-TEST-VALIDATION-0.6.106.json; T/docs/REGRESSION-STATUS-2026-09-27.md; inheritance: Current runtime_shaker animation last changed in T106 commit2b95176e. Historical owner third-person confirmation is separately recorded in Sep27 document.

最小重現／驗收場景：

- 空杯與三材料杯各做rest→按住使用→鬆開→進度消失；一/三人稱前後、左右手、預設/高FOV；比較Java同時點影格。

仍需完成：

- 當前完整動作/波形與所有FOV/皮膚未驗收；歷史STALE_HAND/SPACE_NOT_CLEAR原因未證實；舊測試無ALSA音效設備。

## T-INCENSE — 香薰煙霧/環境粒子、開关/紅石可見效果

現行狀態：`source_adaptation_present_current_visual_pending`。

Java 比較來源：refs: reviewed-java-checkout/java-tavern-upstream/src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/block/deco/IncenseBlock.java:148; reviewed-java-checkout/java-tavern-upstream/src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/client/particle/IncenseParticle.java; reviewed-java-checkout/java-tavern-upstream/src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/client/particle/IncenseSuspendedParticle.java; T/art/source-jar.lock.json; expected: Selected source animateTick:1/3小煙，OPEN=false也存在；OPEN=true另5個環境粒子；粒子種類各有motion/size/lifetime。

正式入口：T/runtime/BP/scripts/bedrock/decorations.js:26; T/runtime/BP/scripts/bedrock/decorations.js:37; T/runtime/BP/scripts/bedrock/java-ambient.js:34; T/runtime/BP/scripts/bedrock/java-ambient.js:53; T/runtime/RP/particles/pine_incense_plume.json

來源檢查：level: L0/L1_sampling_and_motion; refs: T/tools/check_incense_sampling.mjs; T/tools/effects/incense_motion.py; T/tools/effects/incense_large_motion.py; facts: Source sampling/motion checks exist; emitted count is recipient-local sample driven. Current pine plume uses lookat_xyz and finite instant emitters.

原生引擎：scope: Exact T126/W103 full-family load/restart and saved-world deployment gates passed per CURRENT-WORK; loading is not an affected gameplay/render scene.; affected_scene: False

客戶端：current_acceptance: False; meaning: No current T126/W103 client observation located in reviewed sources; this is pending, not a reproduced current defect.

最小重現／驗收場景：

- 單香薰於固定位置，空手開/關及紅石邊沿各錄30秒；在近處、8/16/31/32格比較小煙/環境密度，再兩名真正客戶端同場；八種類型至少各一次。

仍需完成：

- 歷史『幾乎不可見』沒有當前客戶端重現；Sep27固定20/3/s+48/s與40格記述已不描述現行recipient-local Java sampling；混音、大小、motion/遮擋與隨機流待D。

## T-W-STORAGE — 酒架/酒櫃格位、瓶身旋轉/莫洛托夫、材料資料保存

現行狀態：`transaction_and_native_preservation_bounded_visual_pending`。

Java 比較來源：refs: T/data/storage-render-source.json; reviewed-java-checkout/java-tavern-upstream/src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/client/render/block/BarCabinetBlockEntityRender.java; reviewed-java-checkout/java-tavern-upstream/src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/client/render/block/CellarCabinetBlockEntityRender.java; reviewed-java-checkout/java-tavern-upstream/src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/client/render/block/TiltedRackBlockEntityRender.java; reviewed-java-checkout/java-tavern-upstream/src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/client/render/block/HolderBlockEntityRender.java; scope: Pinned c4ec188 renderer PoseStack matrices and source bottle coordinates; full newest-branch equivalence remains distinct.

正式入口：T/runtime/BP/scripts/bedrock/stateful-storage-router.js:19; T/runtime/BP/scripts/core/native-item-storage.js:18; T/runtime/BP/scripts/bedrock/native-storage-pinning.js:11; T/runtime/BP/scripts/bedrock/bar-cabinet.js; T/runtime/BP/scripts/bedrock/cellar-cabinet.js; W/runtime/BP/scripts/foundation.js:4

來源檢查：level: L0_geometry / L1_transaction; refs: T/tools/check_storage_rendering.py; T/tools/native-storage-pinning.test.mjs; T/tools/glassware/storage-routing.test.mjs; facts: Fixed slot/model transforms and exact item carrier proof exist. Registered storage paths have source/API cases; fake ray objects do not verify real mouse coordinates.

原生引擎：level: L2_bounded_helper_preservation; refs: T/data/native-storage-reanchor-capabilities-20261007.json; facts: Actual same actor/metadata/record bytes survived displaced carrier recovery/restart. Zero players; synthetic helper restoration, not actual user insert/retrieve, all loaded/unloaded/crash phases or visible bottles.

客戶端：current_acceptance: False; meaning: No current T126/W103 client observation located in reviewed sources; this is pending, not a reproduced current defect.

最小重現／驗收場景：

- 把普通瓶、寬瓶/莫洛托夫、同ID不同名稱/附魔的兩瓶放入四向酒櫃與酒架；精確點每格取回，重登/正常重啟再取；另測相鄰櫃連接。

仍需完成：

- 四向外觀/玻璃/副手/觸控與實際mouse hit待D；T126未採作者Bedrock1.0.1 E/W座標改法，不能宣稱current E/W必壞；完整來源矩陣與client仍需對照。

## T-W-FURNITURE — 家具方向/含水/座位、動畫家具、方塊擺放與連接

現行狀態：`source_adapters_present_current_visual_pending`。

Java 比較來源：refs: T/art/source-jar.lock.json; T/data/storage-render-source.json; W/upstream/assets/kaleidoscope_world_liquor/blockstates; scope: Original blockstates/models plus selected Java placement/render matrices; source-specific hand/face/use ordering matters.

正式入口：T/runtime/BP/scripts/bedrock/furniture.js:13; T/runtime/BP/scripts/bedrock/java-placement-router.js; T/runtime/BP/scripts/core/furniture.js; W/runtime/BP/scripts/furniture.js:140

來源檢查：level: L0_assets / L1_placement; refs: T/tools/check_visual_rules.mjs; T/tools/test_shaker_native_frame.py; W/tests/wall-record.test.mjs; facts: Source bindings/state/transform and callback cases cannot prove actual input, all-view animation or transparent order.

原生引擎：scope: Exact T126/W103 full-family load/restart and saved-world deployment gates passed per CURRENT-WORK; loading is not an affected gameplay/render scene.; affected_scene: False

客戶端：current_acceptance: False; historical: Shaker third-person owner confirmation exists; that confirmation does not certify all furniture/animated assets.; refs: T/docs/REGRESSION-STATUS-2026-09-27.md

最小重現／驗收場景：

- 把酒凳、沙發、桌、燈、酒櫃/酒架各按四面放置；空手坐下/下坐騎、左右連接、含水；他人視角與重登後看模型方向及座位高度。

仍需完成：

- Current全家具、animation/facing/pose與support/多人互動待D；不得把所有家具方向當已知故障。

## T-INSTANT-DRINK — 喝瓶/普通附屬雞尾酒/特調即時治療與傷害在結算前發生

現行狀態：`implemented_bounded_native_synchronous_health_player_pending`。

Java 比較來源：refs: T/docs/INSTANT-HEALTH-DISPATCH-PROTOTYPE.md:8; T/data/java-parity/instant-source-reference.json; methods: CurrentNeo1.2.0 DrinkBlockItem:150,CocktailBlockItem:96,SignatureCocktailBlockItem:52 pass self/direct/indirect,target/intensity1;Minecraft1.21.1 HealOrHarmMobEffect and NeoForge heal hook.

正式入口：T/runtime/BP/scripts/bedrock/drink-effects.js:5; T/runtime/BP/scripts/bedrock/drink-effects.js:17; T/runtime/BP/scripts/bedrock/mixology.js:237; T/runtime/BP/scripts/bedrock/instant-effects.js:60; T/runtime/BP/scripts/bedrock/instant-effects.js:74; T/runtime/BP/scripts/bedrock/instant-effects.js:85

來源檢查：level: L1_source_arithmetic_and_actual_callback; refs: T/tools/java-instant-dispatch.test.mjs; T/tools/instant-drink-completion.test.mjs; facts: Existing22 arithmetic/dispatch+5 actual drink callback regressions reported in122; no new local run. Accepted API dispatch is not proof that engine damage was accepted.

原生引擎：level: L2_bounded_mob_health; refs: T/data/native-instant-health-capabilities-20261008.json; facts: 18 actual zero-player observations,16 source-health matches; immediate and nextTick same scoped health except totem later regeneration. Normal/undead,clamp,Resistance,absorption,cooldown,armor/Protection,toten cases recorded;0/negative hurt source phase not proven. Real Player use/client=false.

客戶端：current_acceptance: False; meaning: No current T126/W103 client observation located in reviewed sources; this is pending, not a reproduced current defect.

最小重現／驗收場景：

- Java與T126各在受傷時喝Carignan，錄成功instant-heal那次最後飲用影格、血量及空瓶；普通附屬雞尾酒與特調各再做一個有instant條目病例。中途取消/切槽不應提前發效果或容器；普通傷害與吸收/抵抗另分開。

仍需完成：

- IndirectMagic tags/knockback、afterHurt/death時序、任意可執行heal hooks/自訂class、Player死亡drop alias仍不等價/未證明。『所有instant要nexttick』已過時。drink-effects.js:39-40舊註解仍籠統延遲，需文件精確化。

## T-INSTANT-SPLASH — 投擲儲存酒瓶的splash治療/傷害

現行狀態：`separate_legacy_adapter_known_source_gap`。

Java 比較來源：refs: T/docs/INSTANT-HEALTH-DISPATCH-PROTOTYPE.md:32; T/runtime/BP/scripts/core/java-instant-effect.js; scope: Same author instant operation differs from old signed-delta projectile helper; potency factor/direct+indirect source matters.

正式入口：T/runtime/BP/scripts/bedrock/storage-projectile.js:51

來源檢查：level: legacy_source_helper_checks_only; refs: T/tools/instant-effect-source.test.mjs; facts: Projectile path directly sets health/applies damage; no new uniform dispatch source-case or actual current normal-player splash acceptance located.

原生引擎：scope: Exact T126/W103 full-family load/restart and saved-world deployment gates passed per CURRENT-WORK; loading is not an affected gameplay/render scene.; affected_scene: False

客戶端：current_acceptance: False; meaning: No current T126/W103 client observation located in reviewed sources; this is pending, not a reproduced current defect.

最小重現／驗收場景：

- 把帶instant效果的酒存架後以真玩家來源投擲，普通mob與亡靈分別比較距離衰減、治療/傷害、歸屬/擊退；若正式API可合法声明極值amplifier或customclass，另做對照。

仍需完成：

- Current仍採Native undead family與signed-delta，未共享T122 class/Java overflow/narrow/hook資料入口；這是獨立source適配缺口，不能用飲用dispatcher的18mob案例宣稱splash已完成。

## T-TIPSY-ROLL — 微醺只旋轉相機roll，不改玩家瞄準方向

現行狀態：`unimplemented_pure_roll_reassess_platform_capability`。

Java 比較來源：refs: T/runtime/BP/scripts/core/tipsy-visual.js:1; expected: Java CameraAnglesEvent modifies roll; source raw rotation is separate from actor yaw.

正式入口：T/runtime/BP/scripts/bedrock/tipsy-visual.js:6; T/runtime/BP/scripts/bedrock/tipsy-visual.js:9; T/runtime/BP/scripts/bedrock/tipsy-visual.js:54

來源檢查：level: L0/L1_yaw_adapter; refs: T/tools/check_visuals.py:68; facts: Checks guard existing yaw adapter; this is not pure-roll parity. Parent platform audit verified currentstable Camera.playAnimation and RotationKeyFrame.rotation Vector3 withz; no blanket no-three-axis-camera claim.

原生引擎：scope: Server setRotation/readback diagnostics only; neither confirms camera overlay nor preserves aim.; refs: T/runtime/BP/scripts/bedrock/tipsy-visual.js:58; pure_roll_engine_or_client_proof: False

客戶端：current_acceptance: False; meaning: No current T126/W103 client observation located in reviewed sources; this is pending, not a reproduced current defect.

最小重現／驗收場景：

- 同一飲品在Java與Bedrock站立瞄準固定點，記錄roll、crosshair/射擊命中與手持渲染；走動轉頭/換FOV/切第一第三人稱及效果清除另觀察。

仍需完成：

- Pureplayer-overlay roll尚未實作；新stable三軸animation是否可不接管視角/手持/瞄準，需要獨立真client評估。是否納入優先切片由擁有者決策，不自行放棄。


## 現行 issue98 的其他機制缺口

以下重新查了正式入口。Java引用為Forge1.20.1來源c4ec1880，不冒稱已完成本輪NeoForge比較；選定切片基準後需補該分支真值。這些不是原生／真人測試通過報告。

### T-LONG-REACH — 長臂原生攻擊／挖掘距離

Java：`effect/LongReachEffect.java`（c4ec1880，Forge1.20.1）：BLOCK_REACH／ENTITY_REACH +3。

Bedrock：`runtime/BP/scripts/bedrock/custom-effects.js:128–129`：只擴大酒館 item-use 射線；原生攻擊／挖掘／一般實體互動未適配。

最小場景：喝到長臂後，對比超過原生距離的挖方塊、攻擊生物與酒館取酒；各自記錄距離與結果。

驗證：本輪L0來源核對；完整原生玩家／客戶端及NeoForge分支比較仍待完成。

### T-GRASS-STEALTH — 草叢潛行已鎖定仇恨

Java：`effect/GrassStealthEffect.java`（c4ec1880，Forge1.20.1）：成熟植物／潛行條件下清除32格內已鎖定的mob target。

Bedrock：`runtime/BP/scripts/bedrock/custom-effects.js:115–125`：目前短暫 invisibility；未清除原作既有target。

最小場景：讓生物先鎖定玩家，再在成熟合格植物中潛行；對比是否立即停止追擊。

驗證：本輪L0來源核對；完整原生玩家／客戶端及NeoForge分支比較仍待完成。

### T-HIGH-HEELS — 高跟鞋原生步高

Java：`effect/HighHeelsEffect.java`（c4ec1880，Forge1.20.1）：STEP_HEIGHT_ADDITION +0.5。

Bedrock：`runtime/BP/scripts/bedrock/custom-effects.js:224–239`：目前條件式 tryTeleport；非原生步高屬性。

最小場景：效果前後走向半磚、樓梯與一格台階，觀察位置、速度與碰撞；移動邊界仍待原生與客戶端。

驗證：本輪L0來源核對；完整原生玩家／客戶端及NeoForge分支比較仍待完成。

### T-XP-PICKUP — 經驗吸引與原生拾取冷卻

Java：`effect/XpDrainEffect.java`（c4ec1880，Forge1.20.1）：8格吸引、1.5格playerTouch及takeXpDelay清零。

Bedrock：`runtime/BP/scripts/bedrock/custom-effects.js:282–291`：保留真經驗球與原生拾取；未清除原生冷卻或證明修補／多人歸屬一致。

最小場景：穿戴修補装备，兩位真人同時靠近多個經驗球，比對所得經驗、耐久及拾取間隔。

驗證：本輪L0來源核對；完整原生玩家／客戶端及NeoForge分支比較仍待完成。

### T-VISION-OUTLINE — 感知穿牆輪廓

Java：`effect/VisionEffect.java`（c4ec1880，Forge1.20.1）：50tick判定、60tickGlowing与來源AABB／新目標聲音。

Bedrock：`runtime/BP/scripts/bedrock/custom-effects.js:130–141`：有glowing效果呼叫與範圍／音效路徑；沒有Java穿牆輪廓渲染實作。

最小場景：玩家與生物隔不透明牆，喝到感知效果，確認可見輪廓、持續時間與首次／重複目標音效。

驗證：本輪L0來源核對；完整原生玩家／客戶端及NeoForge分支比較仍待完成。

## 本輪修補：T0.6.127

已從現行T126新鮮移植PR247主手握持位置与PR167保留第三人稱手臂Y朝向；其他姿態、模型及波形維持原作。數值／分派檢查通過，未稱完成全客戶端矩陣。實測先使用空／滿杯，觀察第一人稱idle→shake→release及第三人稱front/back，保持同皮肤、FOV及音量，再比較Java。
