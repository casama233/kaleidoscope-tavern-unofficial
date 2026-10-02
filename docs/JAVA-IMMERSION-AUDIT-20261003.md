# 酒館 Java 還原與沉浸審查 — 2026-10-03

本審查從 canonical 0.6.88 / `98fe4d73` 逐一覆蓋酒館功能家族；修復候選為 **0.6.89**。兩项確定修復是環境抽樣成本和經驗汲取速度/邊界/數量。現有重大差異（洞察、微醺、草叢潛行、長手）保留實情，不因靜態通過改標為完整還原。

## 原作與資料邊界

- 原作 [Java pinned source](https://github.com/KaleidoscopeMods/KaleidoscopeTavern/tree/c4ec1880bd44cf3139d3ba744ab30bb379cf1416)，`gradle.properties` 為 `1.2.0-forge+mc1.20.1`。
- 2026-10-03 唯讀查核 [CurseForge 原作頁](https://www.curseforge.com/minecraft/mc-mods/kaleidoscope-tavern)，最新列出的 Forge/NeoForge 皆1.2.0（2026-07-01）。
- 資產 `art/source-jar.lock.json` 鎖定 user_upload NeoForge 1.2.0 JAR SHA256 `03f35e1e614953b22cd1f5e34345613f3a6a283bf1b1c99659b57d58970edeff`；該鎖明示 publisher_checksum_verified=false。不能把目前exact bytes說成已核對作者下載checksum。
- 本表覆蓋玩法、互動、特效、音效、渲染、指南、持久化及性能。不是宣稱所有生成檔、每個裝置和每個粒子碰撞已逐像素認證；原始明顯粒子/音效入口另見 `effects-source-index-20260928.json`。
- Grilling 與 World Liquor 有各自版本和審查，不用其歷史artifacts覆寫本體。

## 逐項矩陣

`source_and_regressions` 是有來源與回歸契約；`known_difference` 是現存程式差異；其餘狀態的精確定義與來源路徑見同名JSON。所有實際client觀察仍獨立記錄。

| 功能 | 狀態 | 現況 / 本輪修正 | 未結案的觀察或差異 |
|---|---|---|---|
| 酒桶多階段／七品質／酒液、素材、狀態 | `source_and_regressions` | 現有釀造狀態、品質、回收及交易回滾回歸；本輪未改配方或計時。 | 真人：投料、等待品質變化、取酒及重登。 |
| 壓榨成功／失敗／完成與原物料碎屑 | `source_and_regressions` | 三種聲音、10 顆粒子及散布為源碼契約；外部物品缺 sprite 會記錄而非偽裝成木屑。 | 真人：六種內建及附屬果實逐一踩踏；未知第三方粒子仍需其作者註冊。 |
| 龍頭放瓶、滴液、空轉、成功完成、紅石 | `source_and_regressions` | 30 tick 取酒、1–5滴液、空轉2/4/6、10 WAX_OFF 已有回歸；交易保持原庫存。 | 真人：手动/上方紅石信號、30tick觀察、滴液落地與完成聲音。 |
| 龍頭液滴完整落地／液體碰撞鏈 | `known_difference` | 現有自由飛行與19子滴路徑有數學驗證；Java落地splash/landing lava、落地音效和精確液面高度仍未完整對齊。 | P2：需原生碰撞／液面及兩端錄影；不能把terrain expire當完整粒子鏈。 |
| 野葡萄、藤架傳播、三種葡萄、青提副產物 | `source_and_regressions` | 現有方向優先、水浸、成長、剪切、成熟果與堆肥契約；青提非獨立藤種。 | 真人：不同土壤／生物群系、生長、骨粉、剪切、支撐移除。 |
| 投料、搖動、倒出、顏色、特調負載 | `source_and_regressions` | 投料8 BUBBLE_POP／倒出20 EFFECT、原品質／顏色規則有回歸；圖像介面保留。 | 真人：一/三人稱雙手、杯蓋、搖杯、倒出、取消、掉地及切槽。 |
| 雪克杯掉落視角 | `known_difference` | 既有 item-view 審查明確留下 dropped perspective 未解；不能由手持矩陣推導掉落完成。 | P2：Bedrock dropped route 及 Java 同視角比對。 |
| 32tick飲用、品質效果、容器返還 | `source_and_regressions` | 品質概率與原生效果名稱顯式映射、堆疊/滿背包返還有回歸；汁桶不誤清所有效果。 | 真人：生存/創造、滿背包、取消飲用、切槽、附屬品質。 |
| 血腥瑪麗擊殺回復 | `source_and_regressions` | floor(被殺目標最大生命/3)、不超過本人上限；事件重複保護。 | 真人：直接/投射物擊殺、已死或非生物目標。 |
| 經驗汲取方向、速度、範圍與數量 | `fixed_this_release` | 0.6.89 修正腳部距離算速度、+0.5目標算方向、inflate(8)玩家AABB及任意前128截斷。 | 原生球身份/值保留；Java takeXpDelay=0 和 playerTouch 仍無對等 API，現有近距傳送是適配。 |
| 天頂傳送 | `intentional_adapter` | 以安全地表、兩格空間和tryTeleport檢查適配；原作MOTION_BLOCKING高度圖/強制teleport並非完全同一。 | 真人：洞穴、樹冠、水、世界高度與飢餓30s；不可宣稱全地形等價。 |
| 音波攻擊 | `intentional_adapter` | 已對齊 SONIC_BOOM 圖幀和單粒子；保留既有PvE-only安全適配。 | 真人：遮擋、穿透、距離、擊退；PvP功能與Java不同。 |
| 倒置與名字顯示 | `source_with_client_gap` | 更正舊audit：Java本身即把Mob設為Grumm，並setCustomNameVisible(false)，不是另一套渲染事件。 | Bedrock nameTag是否可見、每個Mob是否翻轉仍需Windows畫面驗收；未提供等價名字可見開關。 |
| 洞察穿牆輪廓 | `known_difference` | P1：pulseVision仍呼叫Java glowing名稱；Bedrock缺少該原生效果，不能實現原作穿牆輪廓，也不能用圖示宣稱已實現。 | 需明確可支援的client渲染方案；不以漂浮文字/粒子假扮輪廓。本輪未假稱修好。 |
| 盜墓奪械 | `source_and_regressions` | 30% float比較、原生物品metadata、剩1耐久與40tick拾取保護；分類有Bedrock別名適配。 | 真人：各骷髏/殭屍/piglin/illager類、搶拾、掉落合併。 |
| 熾熱衝刺破塊、護甲損耗和飢餓 | `source_and_regressions` | source-backed可破石種/3×3前方與盔甲Unbreaking規則；延用既有碰撞/區塊API適配。 | 真人：方向邊界、保護區、創造、不穿甲、低飽食度。 |
| 高跟自動上階 | `intentional_adapter` | Java階梯高度attribute由Bedrock邊緣受阻＋安全1格teleport適配；不是原生同一碰撞流程。 | 真人：半磚、完整方塊、斜角、梯子、游泳、網路延遲。 |
| 草叢潛行 | `known_difference` | 植物表/成熟作物/蹲伏/消耗已對齊；原作是清除32格內Mob現有target，移植仍用短暫隱身。 | P1：已有仇恨不會因現有API清除，並多了玩家可見隱身；不可稱完整還原。 |
| 長手交互範圍 | `known_difference` | 現有9格路由僅自有item-use；Java的attribute覆蓋面更大。 | P1：原版方塊/挖掘/攻擊範圍不等價，需可驗證的原生方案。 |
| 微醺視角 | `known_difference` | P1：現有yaw adapter改變玩家朝向，Java原作camera roll只傾斜畫面；已有opt-out與診斷不是還原證明。 | 需要保持玩家控制/FOV的實際client roll方案；不再用不同特效冒充。 |
| 香薰、圓架、神秘雞尾酒 display tick | `fixed_this_release` | 0.6.89保留Minecraft 1.20.1 ClientLevel.animateTick的667×(r16,r32)聯合抽樣分布；稀疏場景精確跳過未命中，33+emitter回原抽樣。 | 真人比較密度/聲音/視覺；Node抽樣成本降低不能當live watchdog原因已排除。 |
| 八種香薰、大/小粒子与發光 | `source_with_client_gap` | 既有sprite、自由飛行、採樣強度有source及數學契約；JavaAABB碰撞、光照漸變與混合仍有明確差异。 | P2：受牆角/天花板/水/不同幀率及Windows材質模式驗收。 |
| 同類堆疊、瓶架杯架櫃、原生物品保存 | `source_and_regressions` | 未知metadata、品質、名字/自訂物品以原生inventory保存；損壞/未載入fail closed不退回ID重建。 | 真人：同ID不同名字、滿背包、多人、重啟、實體暫未載入；舊無metadata資料不能憑空復原。 |
| 瓶架紅石投射、投擲藥水、燃燒瓶 | `source_with_client_gap` | 既有原品質effect payload、發射/投射物時序和交易回滾；Molotov火/煙精確數量。 確認現存差異：customRow僅接受minecraft:player，Java ThrownPotion可向LivingEntity套用適用的custom effects；原生效果仍有非玩家路徑。 | 真人：紅石上升沿/重載、方塊/實體命中、距離衰减、火與方塊破壞規則。 P1：非玩家custom splash效果尚未還原，不將native splash通過套用至自訂效果。 |
| 坐椅、16色沙發/高凳、吧檯/桌 | `source_with_client_gap` | 模型/座位與相鄰連接已實作，helper姿態與去重有回歸；伺服器取樣非Java partialTick render。 | 真人：座位切換、多人、四方向/轉角、水浸與下線移除。 |
| 黑板/立牌文字、上蠟、染色、對齊 | `intentional_extension` | 原left/center/right保留；Word-style左右/分散及垂直對齊為使用者已授權擴充；超長輸入不靜默截斷。 | 真人：7全形/10半形小板、混排、繁簡英文、顏色與發光；字型不宣稱逐像素相同。 |
| GUI、一/三人稱、框、掉地與animated icons | `source_with_client_gap` | 既有19 sprite / 74 geometric routes與八種Java transform契約；不是以方塊model猜手持。 | P2：GUI front lighting、部分animated item/frame0、所有视角还需client；详见ITEM-VIEW-PARITY-20261002。 |
| 拾取、放置、釀造、剪切、特效 | `source_with_client_gap` | 已登記Java原生聲音來源雜湊及事件/音量/pitch；避免無源碼成功Actionbar。 | 真人：source位置/聽者排除/衰減/混音；bytes相同不等於聽感一致。 |
| 独立书与可选Cookery七入口共用投影 | `intentional_extension` | 七入口、child分組、單條目直入、繁簡英與shared addon投影依用戶規範；Cookery非必裝。 | 真人：獨立+全家族、返回、空附屬隱藏、圖示与配方內容。 |
| 圖示、選擇性文字、雪克圖形 | `source_with_client_gap` | 0.6.88保留Mojang native root、namespaced optional addon mount；不接管原生/外部狀態。 | 真人Windows：原生效果圖示+自有圖示、多效果、過期、喝奶、斷線/重登；0.6.87舊方案曾被真client拒絕。 |
| 跨重啟自有狀態、附屬遷移與身份 | `source_and_regressions` | 原生metadata與自有dynamic狀態有回歸；舊私服UUID到author身份仍須停服副本演練/保留資料驗證。 | saved_world_migration 與 BDS 重啟由完整家族候選收據判定；本audit沒有批准production_ready。 |
| 原生watchdog、輪詢、視覺helper维护 | `partially_fixed` | live紀錄有10–15ms slowdown與208ms尖峰；本輪可確證ambient固定8,004 RNG/viewer/tick被消除（稀疏），其餘cellar/board/timed effects既有去重。 | 需同場景native profile/活動人數/裝飾數量對比；尚不能把全部lag歸因或宣稱修完。 |

## 精確抽樣與性能證據

對每個半徑 `r ∈ {16,32}`、偏移 `(dx,dy,dz)`，原作六次均勻整數抽樣的單次命中概率為：

```text
p_r = max(0,r-|dx|) × max(0,r-|dy|) × max(0,r-|dz|) / r^6
```

每個半徑仍是667個categorical試驗。稀疏路徑使用全部已註冊位置的整數權重總和，按 geometric gap 跳過未命中試驗，再從同一categorical分布選中一個位置。兩半徑成功事件以 `(trial index, near before far)` 合併，因此同trial互斥、重複命中、負共變異及667上限均保留；不是每方塊獨立Poisson，也不是固定粒子配額。原生有限PRNG的逐seed相同序列不在聲明範圍。

最多32個可達emitter時使用此路徑，33+使用未改的原始抽樣器。快取在玩家整數方塊座標、維度或註冊世代改變時重建；失效block在emit時再次核對，玩家離線釋放快取。

固定seed71349、每場景10,000tick的Node algorithm benchmark：

| 可達emitter數 | 原RNG/tick | 現RNG/tick | 路徑 |
|---:|---:|---:|---|
| 1 | 8,004 | 2.3036 | 精確稀疏 |
| 8 | 8,004 | 4.6550 | 精確稀疏 |
| 32 | 8,004 | 11.4544 | 精確稀疏 |
| 33 | 8,004 | 8,004 | 原始密集 |

完整含耗時JSON由 `node tools/efficiency/ambient-benchmark.mjs` 重現。耗時是Node微基準，不能當成BDS/FPS或整體watchdog改善比例。

## 證據及live驗收

- `tools/ambient-sparse.test.mjs`：獨立枚舉Java整數差機率、順序、重複命中、固定seed均值、binomial variance與兩emitter負共變異。
- `tools/efficiency/*.test.mjs`：目前production adapter、稀疏/密集選擇、跨格/跨維度/離線/新增/移除/消失block，以及XP高處/側面/角落/129+球。這是純腳本/API double，不是Minecraft模擬玩家或真人。
- `data/parity-review-20261003.json`：本輪逐檔before/after與Java源碼hash；基線舊preimage不修改。
- 完整家族 BDS、停服一致世界副本遷移及live部署逐檔收據由家族流程另行產生。Windows真人需要觀察香薰、手持/掉地/GUI、微醺/各效果、取放聲音、指南與多人；任何未測項保持 `client=false`。
- 已存在live持續開發授權時可按最新維護政策登記該候選收據的延期client驗收；此文件本身不代表production_ready。
