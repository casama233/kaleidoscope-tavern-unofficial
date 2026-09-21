# Java 1.2.0 → Bedrock 完整移植差異追蹤

基準固定為 **Kaleidoscope Tavern 1.2.0 / Minecraft Java 1.21.1 NeoForge**。

- 上游：`KaleidoscopeMods/KaleidoscopeTavern`
- 本倉庫鎖定來源提交：`6b0d619145316492f055e03d70427107cd73efa8`（2026-07-01）
- release JAR SHA-256：`03f35e1e614953b22cd1f5e34345613f3a6a283bf1b1c99659b57d58970edeff`
- 目前 Bedrock 主開發階段：C6；Minecraft／手機／Realms／BDS 實機驗收仍為 **NOT_RUN**。

「已適配」表示已有 Bedrock 等價或明示適配，不表示兩個引擎逐像素或逐事件完全相同。

| 類別 | 已有 | 尚缺／仍需核對 |
|---|---|---|
| 釀造／壓榨 | 23酒桶＋6壓榨配方、品質飲品、容器交易、Cookery 隔離 | 原作特殊自動化與外部模組互動仍需實機逐項核對 |
| 雪克杯／雞尾酒 | 12固定配方、14雞尾酒、特調 payload、藥水身份、長按/倒酒適配 | 原生手腕/杯嘴動畫、下方容器自動接酒、西瓜汁等特殊酒嘴 |
| 專屬效果 | Bloody Mary 規則；XP Drain、Zenith、Shriek、Upside Down、Vision、Tomb Raider、Ardent Heat、High Heels 適配 | **3項**：slightly_tipsy、grass_stealth、long_reach |
| 高腳凳 | 16色、放置/回收、原生座位、座墊隨乘客轉向 | Steve/Alex 座高、精細碰撞、手機/多人/重連實機 |
| String Lights | 17款、原模型/貼圖、染料換款、亮度15、四方向；洋紅款已同步官方 post-1.2 `c4ec188` 面剔除修正 | waterlogging、自然支撐/掉落、精確 selection；洋紅雙面薄片仍待實機多視角驗收 |
| Sofa / Table / Bar Counter | **16色 Sofa、Table、Bar Counter 均已可合成、放置／回收與自動連接**；Sofa/Bar Counter 共用原作6態 IConnectionBlock，Table 為4位置＋X/Z軸鎖定；Sofa 每格1人乘坐 | Sofa/Table waterlogging、Sofa 背靠複合碰撞與實機座高；連接/碰撞仍待實機驗收 |
| 酒櫃／酒架／杯架 | 多數原始模型/貼圖已有 | `BarCabinetBlock`、`CellarCabinetBlock`、`CircularRackBlock`、`TiltedRackBlock`、`GlasswareHolderBlock` 的存放、展示與互動 |
| 黑板／立牌 | 原始模型已有 | `ChalkboardBlock`、`SandwichBoardBlock`、`TextScreen` 的文字輸入、中文、同步與渲染 |
| 其他裝飾 | 部分資產/靜態展示已收錄 | Pendant Lamp、Incense、Painting、Stepladder、Holder 等逐個核對放置、形狀、狀態與掉落 |
| 葡萄／種植 | 7 crop blocks 與基本生長適配 | `WildGrapevine*` 世界生成、氣候/土壤加速、藤架連接與野生生成 |
| Molotov | 配方明示排除 | `MolotovBlock/Item`、投擲實體、火焰/命中行為、渲染 |
| 發射器／原版互動 | 基本手動瓶/杯流程 | `BottleBlockDispenseBehavior` 等 dispenser 行為及部分原版事件 |
| GUI／整合 | 獨立 Tavern 指南與原生配方冊 | Java Jade/JEI/REI/EMI 類整合需按 Bedrock UI 能力另做等價入口 |
| 視覺/客戶端 | 原作資產大量沿用；C4-C6已有動畫適配；post-1.2 洋紅彩燈 `c4ec188`、金色果汁桶 `b30f34a`，以及 `c70eec1` 第一組4杯 cutout/shade 修正已同步 | `c70eec1` 其餘11個模型與7張block貼圖＋Depth Charge item貼圖仍待分組同步；另有 Slightly Tipsy 相機 roll、Grass Stealth 玩家渲染隱藏等引擎差異 |
| 引擎驗收 | Node/mock 測試框架 | Minecraft、觸控、控制器、多人、BDS、Realms、存檔升級、Molang/rideable/food 原生事件最終驗收 |

## 專屬效果剩餘 3 項：Java 真實語義

1. `slightly_tipsy`：客戶端相機 roll，由三個不同週期的 sin/cos 波疊加。
2. `grass_stealth`：潛行且位於成熟作物/指定植物；週期性耗體力、清除32格內仇恨並阻止新鎖定；Java客戶端還隱藏玩家渲染。
3. `long_reach`：方塊與實體互動距離各 `+3.0`。

## Batch 1：Upside Down

Java `UpsideDownEffect` 是瞬時效果：以使用者碰撞箱向 XYZ 各膨脹16格，取得存活 `Mob`，全部自訂名為 `Grumm`，並設為不強制顯示名稱。

Bedrock 本批次使用 `EntityQueryOptions.families=['mob']` 作類別過濾、`getAABB()` 作二次相交判定、`Entity.nameTag='Grumm'` 觸發原生倒立彩蛋；不寫入持續效果狀態。

已知 API 級差異：Bedrock Script API 沒有通用的 Java `setCustomNameVisible(false)` 對等 setter，因此名稱牌可見性列入實機驗收，不能宣稱完全一致。

## Batch 2：Vision

Java `VisionEffect` 每當剩餘 duration 能被50整除時執行：半徑為 `min(amplifier+1,3)*6`，對使用者以外的存活 `LivingEntity` 刷新60 tick Glowing；只有至少一個目標在本次之前沒有 Glowing 時才播放 `effect.vision`。已重新核對目前上游 `c4ec1880`，此效果源碼與1.2.0鎖定提交一致。

Bedrock 本批次把 `vision` 保存在 Tavern 自己的玩家持續狀態，以既有5tick巡檢偵測跨過的50tick倒數節點。候選先用 `EntityQueryOptions.location + volume` 有界查詢，再以來源與目標 `getAABB()` 做嚴格相交；原生 `glowing` 刷新60 tick，音效直接使用已收錄的 `kt_assets_a17.effect.vision`。

明示差異：Java 的類型條件是 `LivingEntity`，Bedrock Script API沒有同名類別查詢，因此以存活 health component 近似並排除 Tavern seat／visual helper；5tick排程最多令 pulse 晚一個巡檢窗口。實際發光描邊、音效、多玩家與引擎時序仍為 NOT_RUN。

## Batch 3：Tomb Raider

Java 1.2.0 的摸金校尉不是獨立 MobEffect tick 類，而是 `EffectEvent.onLivingHurt`：攻擊者持有效果，目標屬於 `tomb_raider_disarmable`，以目標 `nextFloat() < 0.3F` 判定。成功時若主手為可損耗物，直接把 damage 設為 `maxDamage-1`（僅剩1耐久），清空主手、在目標位置生成真實 `ItemEntity`，拾取延遲40 tick。上游 `EffectEvent`、`TagEntityType` 與 Nether Special datamap 已核對至 `c4ec1880`，與鎖定1.2.0一致。

來源目標共15個：Java `minecraft:skeletons` 的 bogged、skeleton、skeleton_horse、stray、wither_skeleton，加 zombie、zombie_villager、drowned、husk、piglin、piglin_brute、zombified_piglin、vindicator、pillager、witch。Bedrock 對 zombified piglin 使用實際ID `minecraft:zombie_pigman`。

Bedrock 2.7.0 以玩家持續狀態＋`afterEvents.entityHurt` 觸發；讀寫 `EquipmentSlot.Mainhand`，用 `Dimension.spawnItem` 生成真實掉落，item entity動態屬性記解鎖tick，`beforeEvents.entityItemPickup` 在前40tick取消拾取。若生成或寫入解鎖標記失敗，移除半成品並回滾原主手，避免吞裝。

明示差異：Java `LivingHurtEvent` 位於傷害流程更早位置；Bedrock before-hurt 回呼禁止安全修改世界，因此本適配使用 after-hurt。致死一擊時序，以及Java允許任意帶效果 `LivingEntity` 攻擊者而本包效果持有者層目前只支援玩家，均不宣稱完全等價，需實機驗收。

## Batch 4：Ardent Heat

Java 1.2.0 的 `ArdentHeatEffect` 每tick只處理玩家。效果自然剩餘<=1 tick時給600tick Hunger；非衝刺時不做破牆。衝刺時依玩家水平朝向取得正前方3×3平面（腳部高度、上方1格、上方2格，左右各1），只破壞 `base_stone_overworld`、`base_stone_nether` 與 end_stone。這些來源tag在1.21系展開為10種：stone、granite、diorite、andesite、tuff、deepslate、netherrack、basalt、blackstone、end_stone。

只要本tick至少成功破一塊，Java追加1.2 exhaustion；若有任何已穿盔甲，從非空 HEAD/CHEST/LEGS/FEET 隨機選一件，若可損耗則扣1耐久。完全沒穿盔甲則累積撞擊次數，每第5次受1 generic傷害。另由 `EffectEvent.onPlayerTick` 在 food<=0 且 saturation<=0.01 時提前移除醇熱並給600tick Hunger。Depth Charge與Brass Heart兩杯的datamap都固定提供300秒 amplifier 0；上述 Java source/tag/datamap 已核對至 `c4ec1880`，與鎖定1.2.0一致。

Bedrock適配精確列出10種可撞碎方塊，不使用名稱模糊匹配；以1tick排程讀 `Entity.isSprinting`，對前方3×3逐塊交易式設air並生成明確原版掉落（stone→cobblestone、deepslate→cobbled_deepslate，其餘自身），掉落失敗時恢復原方塊。本tick有成功破塊才增加 exhaustion 1.2，並按已穿裝備或裸裝DP計數施加一次成本。5tick持續狀態層處理自然到期與飢餓／飽和耗盡後的600tick Hunger。

明示差異：Java使用方塊loot-table和世界RNG；本適配不模擬工具／附魔／完整loot-table，裝備選擇也不宣稱同一RNG序列。Exhaustion到食物／飽和的換算交給Bedrock 2.7.0玩家exhaustion元件；到期／耗盡偵測最多晚現有5tick巡檢窗口。實機仍需驗證掉落、盔甲破損、飢餓換算、多人同步與每tick衝刺巡檢負載。

## Post-1.2 視覺同步 Batch 1：洋紅彩燈

官方上游在 2026-07-21 的 `c4ec1880bd44cf3139d3ba744ab30bb379cf1416` 提交「修复品红色小灯的模型面剔除问题」。與前一提交 `b30f34a` 做結構比對後，兩版仍是同一組19個元素，座標、旋轉與貼圖均未改；唯一功能差異是12個斜向零厚度燈面由只有 `up`，改成同時具有 `up + down`。

Bedrock 轉換同步只為對應12個旋轉零厚度 cube 加入反面 UV，保持 geometry identifier、19個 cube、材質、貼圖與方塊四方向不變。官方 Java 模型快照鎖在 `data/upstream/post-1.2/c4ec1880/string_lights_magenta.json`，來源與轉換說明見 `docs/UPSTREAM-VISUAL-SYNC.json`。

這解決的是單面 alpha-test 幾何在背視角被剔除的來源問題；Minecraft Bedrock 實機的正反面、四方向、手持 item_visual 與行動端渲染仍為 **NOT_RUN**。

## Post-1.2 視覺同步 Batch 2：金色果汁顏色

官方上游在 2026-07-06 的 `b30f34a2e340fed1528954104f93cf2c7e90fd79` 提交「校正金色果汁颜色」，相對前一提交 `c70eec1` **只修改** `textures/item/gold_grape_bucket.png`。同步前本倉庫兩份 Bedrock runtime PNG 的 Git blob 都是 `90836790746091ae951b03035e2d0f2fbe84d771`，與官方修正前檔案完全相同；官方修正後 blob 為 `7d2452dc5a07f82fd114db6df9e1fb5998878fef`，檔案由245 bytes變為388 bytes，SHA-256 為 `ae8dd1d9802fa02568c3eb457b9e1bacf25d92047faf67bf3dd78bb7ae5691d0`。

本批把官方 388-byte PNG 原樣鎖定到 `data/upstream/post-1.2/b30f34a/gold_grape_bucket.png`，並逐位元組同步到 `runtime/RP/textures/kaleidoscope_tavern/item/gold_grape_bucket.png` 與 `runtime/RP/textures/kaleidoscope_tavern_jar/item/gold_grape_bucket.png`。回歸測試直接對三份二進位檔做 SHA-256，不接受截圖、重編碼或近似顏色。

這是物品貼圖的官方顏色校正；遊戲內物品欄、手持與不同顯示設定的實際顏色仍為 **NOT_RUN**。

## Batch 5：High Heels

Java 1.2.0 的 `HighHeelsEffect` 沒有週期 tick 邏輯，而是對 Forge `STEP_HEIGHT_ADDITION` 加上固定 `+0.5`；目前來源酒效均為 amplifier 0，因此實際意圖是把原本約半格的自然跨步提升到可順暢跨越完整一格障礙。上游目前 `c4ec1880` 的該類仍與鎖定 1.2.0 語義一致。

Bedrock 穩定 Script API 沒有可直接寫入玩家 step-height 的屬性，因此本批次採保守的「被障礙卡住才跨步」適配，而不是常駐跳躍增益或修改 `player.json`。每 tick 僅對持有效果、著地且非跳躍／飛行／滑翔／游泳／攀爬的玩家工作；讀取原生 movement input 與 yaw 算出移動方向，要求輸入強度足夠、水平速度已降到近乎 0、玩家已抵達方塊邊緣、正前方腳部是一格障礙且其上兩格為空，最後用 `tryTeleport(..., {checkForBlocks:true})` 上移 1 格並向前帶 0.2 格。另記錄上一次跨步的水平位置，沒有至少 0.35 格水平進展前拒絕再次抬升，避免沿兩格直牆連續「爬牆」。

明示差異：這不是原生碰撞屬性的逐 tick 等價，而是碰撞觸發式移動適配；自訂非完整方塊、柵欄／牆、觸控搖桿、控制器與多人延遲仍必須實機驗收。White Lady 的 3600 秒 High Heels 已由實際飲用派發鏈路接通；酒桶品質資料中既有的 High Heels 也會走同一持續狀態適配。

## Batch 6：Sofa 家具

Java 1.2.0 的 `SofaBlock` 使用 `IConnectionBlock` 共6種狀態：`single / left / right / middle / left_corner / right_corner`。判定不是只看同色；`sameType` 只要求鄰居也是 `SofaBlock`，因此不同顏色沙發同樣會連接。直線連接優先於轉角，前方垂直沙發才形成 corner。每一格沙發互動時生成一個 `SitEntity`，來源錨點高度為0.5125。

Bedrock 本批次加入全部16色來源沙發與16份原配方，直接使用已收錄的6套原作 sofa geometry；方塊以 `kaleidoscope_tavern:connection` 0..5 保存連接狀態。放置／回收時立即刷新自己與四鄰，並保留20tick方塊巡檢修復外部命令造成的陳舊狀態。連接判定按 Java `IConnectionBlock` 的左右、前方轉角與優先級移植。每格沙發只在有人坐下時生成不可見 `sofa_seat` rideable helper，離座後即刪除，避免大型酒館堆積空座實體；候選 Bedrock 坐點為0.45格（來源0.5125沿用現有-0.0625座位校正）。

明示差異：目前碰撞以可玩的8/16格座墊主體 AABB 近似，未模擬 Java 背靠／轉角的複合 VoxelShape；waterlogging 暫未移植。這兩項不影響核心裝修、連接與乘坐流程，留待實機或有直接 API 時再補。

## Post-1.2 視覺同步 Batch 3：c70eec1 第一組

官方 `c70eec14b4d8cede23f7274910b8424a8fd49f89` 的目標是「整體優化雞尾酒模型，改為 cutout、減少混素感」。為降低一次同步23個資源檔的風險，本批先選 **Brass Heart／Emerald／Godfather／Nether Special** 四個「模型-only、PNG未變」的項目建立自動化流程。

這四個模型經舊/新 source 結構比對後，元素數、座標、UV、display transform 與非 particle texture reference 全部不變；差異只有 `render_type: translucent -> cutout`，以及少數指定 element 的 `shade: true -> false`。Bedrock 對普通立體 cutout 模型沿用工程既有 `alpha_test_single_sided` 映射，並把 plan 指定 cube 的 face material 標成 `unshaded`。

來源 old/new JSON 均逐位元組鎖定在 `data/upstream/post-1.2/c70eec1/model-only-1/`，Git blob SHA 寫入 `sync-plan.json`。新增 `tools/sync_post12_visuals.py`：完整 rebuild 會自動 apply 所有 plan，CI 另用 `--check` 驗證來源語義、Git blob、registry、runtime block 與 geo。之後同類模型不再手改多處，只需新增 source snapshot + plan。

本批只覆蓋 c70eec 的4/15個模型；其餘模型／貼圖會繼續小批次推進。實際 Minecraft 的 cutout 邊緣、透明排序、內外杯面、手持／物品欄效果仍為 **NOT_RUN**。


## Batch 7：Table / Bar Counter 家具

Java 1.2.0 的 `BarCounterBlock` 與 `SofaBlock` 共用同一個 `IConnectionBlock`：六種 `single / left / right / middle / left_corner / right_corner` 狀態及完全相同的左右／前方轉角優先級。本批 Bedrock 不再複製一套演算法，而是把原 Sofa 核心抽成共用 `connectionType`，Sofa 與 Bar Counter 都由同一份規則驅動；吧台直接使用倉庫既有六套原作幾何與原貼圖。

Java `TableBlock` 是另一套較簡單的連桌規則：`single / left / middle / right` 四位置，並在連成一列後鎖定 X 或 Z 軸，避免十字交叉時改向；相鄰桌若已沿垂直方向形成非單體組合，也不可被另一方向強行接入。本批按這套規則移植，使用既有 single/left/middle/right 與三套 rot 幾何。來源碰撞只包含 Y=13..16 的 3/16 高桌面，本批保留這個特性，而不是把桌腿錯做成實心方塊。

兩者加入原作合成配方、潛行放置／空手回收、鄰居即時刷新與20tick陳舊狀態修復。Table 的 waterlogging 與 Minecraft／手機／Realms／BDS 實機狀態刷新仍為 **NOT_RUN**。
