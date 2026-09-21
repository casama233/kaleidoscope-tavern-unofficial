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
| Sofa / Table / Bar Counter | **16色 Sofa、Table、Bar Counter 均已可合成、放置／回收與自動連接**；Sofa/Bar Counter 共用原作6態 IConnectionBlock；Table 使用X/Z軸四態；Sofa可乘坐 | Sofa/Table waterlogging、Sofa背靠複合碰撞與連接/座高實機驗收 |
| 酒櫃／酒架／杯架 | **Glassware Holder 4槽、Holder單槽、Tilted Rack三槽手動存取／精確品質返還／來源瓶型展示已完成** | Circular Rack、Bar/Cellar Cabinet；Holder/Rack 紅石彈射仍未移植 |
| 黑板／立牌 | 原始模型已有 | `ChalkboardBlock`、`SandwichBoardBlock`、`TextScreen` 的文字輸入、中文、同步與渲染 |
| 其他裝飾 | **3款 Pendant Lamp 已移植雙格上/下半結構、下半亮度13、無碰撞、單件回收與孤兒半格修復**；部分資產/靜態展示已收錄 | Incense、Painting、Stepladder 等逐個核對放置、形狀、狀態與掉落 |
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

## Batch 7：Table 連接桌

Java 1.2.0 `TableBlock` 使用 `axis=x/z` 與 `position=0..3`（single / left / middle / right）。一旦桌子形成 X 或 Z 軸組合桌，垂直方向的新鄰居不能把整排桌子改軸；只有 single 狀態才可切換到另一軸。放置時依玩家水平朝向選擇優先檢查軸，且對方若正處於被修正軸又不是 single，會拒絕接入。

Bedrock 本批次保留軸鎖定與四個 position state，直接使用原作7套幾何。Java 生成 blockstate 中 `position=1` 實際對應 right 模型、`position=3` 對應 left 模型，本移植按官方映射。放置／回收立即刷新自身與四鄰，另有20tick巡檢修復外部命令造成的陳舊連接。

桌面碰撞直接等價於來源 `Block.box(0,13,0,16,16,16)`：Bedrock origin [-8,13,-8] / size [16,3,16]，selection 同步使用相同薄板。來源配方中的 `minecraft:planks` 與 `minecraft:fences` 直接保留 Bedrock 原生 recipe tag；`c:ingots/iron` 明確映射 vanilla iron_ingot。waterlogging 暫不移植。

## Batch 8：Bar Counter 吧台連接

Java 1.2.0 `BarCounterBlock` 直接實作與 Sofa 相同的 `IConnectionBlock`：`single / left / right / middle / left_corner / right_corner` 六態，左右鄰居與前方轉角採同一優先級。本批沒有再寫第二套判定，而是把現有 Sofa 連接核心提升為共用 `connectedFurnitureConnection`，Sofa 與 Bar Counter 的鄰居描述、三輪刷新和20tick陳舊狀態修復也走同一框架。

吧台直接使用倉庫已轉換的原作六套幾何、原貼圖與 item-display 模型，不新增美術。原配方 `NNN / WWW / WWW` 中 `c:nuggets/gold` 映射 vanilla `gold_nugget`，`minecraft:planks` 保留原生 recipe tag。方塊可潛行放置、空手回收，支援直線連接與左右轉角。實際 Minecraft／手機／多人／BDS／Realms 仍為 **NOT_RUN**。

## Batch 9：Glassware Holder 四槽酒杯架

Java 1.2.0 的 `GlasswareHolderBlock` 固定4槽、每槽上限1，互動只接受 `empty_glassware`。點擊位置按方塊局部 X/Z 四象限分槽：左前0、右前1、左後2、右後3；空手取出、手持空酒杯放入，破壞時槽內內容一併掉落。來源亮度為8；N/S shape 為 `Block.box(0,11,1,16,16,15)`，E/W 為 `Block.box(1,11,0,15,16,16)`。

Bedrock 直接使用4個0/1 custom block state作存儲權威，不建立世界DP、inventory helper或展示entity。穩定 Script API 的 `faceLocation` 提供方塊局部座標；資源包將4個來源 empty-glassware 模型依 Java renderer 的位置與 X 180° 旋轉做成4個倒掛 bone，`bone_visibility` 直接讀槽位 state。自訂metadata空杯為避免資料遺失會拒收；Creative沿用本專案守恆交易規則。實機 blend 透明排序、手機點位與多人仍為 **NOT_RUN**。

## Batch 10：Holder 單瓶架

Java 1.2.0 `HolderBlock` 繼承 `AbstractStorageBlock`，只有1槽。它接受 `BottleBlockItem`，但會用 `holder_blocklist` 拒絕10種瓶型：brandy、carignan、mother_snow、miners_star、madame_shexiang、sunset_glow、riesling_dry_white、sweet_berry_wine、vodka、rum。雞尾酒是 `GlasswareBlockItem`，本來就不是 Holder 的合法輸入。Molotov 雖屬 BottleBlockItem，但 Bedrock 移植仍依既定範圍明示排除。

本批次支援 `empty_bottle` 加14種未被 blocklist 排除的品質飲品 base。精確物品 ID（例如 `wine_q5`）保存於 Tavern world dynamic property 的單槽 HolderStore，方塊 `holder_kind=0..15` 只同步空/瓶型，因此取出時品質完整返還，不靠猜測。命名、Lore、額外 DP 等 metadata 物品拒收，避免靜默丟資料。

來源 renderer 以 `(0.5,0.125,0.75)`、scale `0.95`、X `-45°` 顯示實際瓶子。本版在 Holder 有內容時生成最多1個無碰撞 `holder_bottle_visual`，直接重用既有15種來源 geometry/texture；沒有內容即移除，20tick維護會清孤兒與重複 helper。方向 shape 直接還原：N/S 為 origin [-3,0,-6] size [6,16,12]，E/W 為 [-6,0,-3] size [12,16,6]。

Java 的紅石上升沿會隨機挑瓶並投擲 DrinkBlockItem，Molotov 走另一投擲實體路徑。考慮到 Molotov 本身明示排除、且這部分不是簡單穩定的 Bedrock 等價，本批次只完成高價值的手動存取／展示，不做紅石彈射。實機瓶型朝向、helper 重連、多人與觸控仍為 **NOT_RUN**。


## Batch 11：Pendant Lamp 雙格吊燈

> 註：Holder 單瓶架已由並行 Batch 10 / PR #19 先行合併，因此本批在最新 main 上編號順延為 Batch 11。

Java 1.2.0 的 `PendantLampBlock` 由同一方塊的 `upper/lower` 兩半構成。放置位置是上半格，要求其下方仍可替換，隨後自動在下方生成 lower；方向直接取玩家水平朝向。只有 lower 發光，來源亮度為 13；方塊本身 `noCollission()`，但上／下半仍各有方向選擇框。破壞時只有 lower 具有正常掉落，因此完整結構無論從哪一半開始回收，都只應返還 1 件。三個來源款式為 bell / blue / yellow，配方產量分別為 8 / 4 / 4。

Bedrock 本批把 `half=upper/lower` 與 facing 都保存為方塊狀態，放置時用同一筆守恆交易一次寫入兩格；下半格被佔用或任一寫入失敗都會回滾，不扣物品。從任一半回收時，要求另一半仍為同款、同方向與互補 half，再一次清空兩格並只返還 1 件。兩半每 20 tick 檢查配對；命令或外部修改留下的孤兒半格只清理、不憑空補發物品。三款直接使用倉庫已由鎖定 Java 資產轉換的 top / bottom geometry；lower=13、upper=0，碰撞關閉，四方向 selection box 依 Java VoxelShape 換算。

明示差異：Java 物品欄使用獨立 2D item sprite；Bedrock 方塊物品沿用已轉換的 lower 模型 item visual，不宣稱 GUI 顯示逐像素一致。沿用本專案既有家具守恆策略，需要潛行放置／回收；爆炸仍採 Tavern 家具通用安全策略。Minecraft／手機／多人／BDS／Realms 實機仍為 **NOT_RUN**。

## Batch 12：Tilted Rack 三槽斜酒架

Java 1.2.0 `TiltedRackBlock` 繼承 `AbstractStorageBlock`，固定3槽。槽位選擇使用旋轉後的 `getLocalX`：依方塊 facing 把點擊位置換算成0–1局部X，再按 1/3、2/3 分成0/1/2槽。來源 blocklist 只有 brandy 與 carignan，因此除 Molotov（本移植明示排除）外，`empty_bottle` 與其餘22種品質飲品 base 可存，三槽可以混放不同瓶型與品質。

Bedrock Batch 12 把 Batch 10 的瓶型表抽成共用25種 visual kind，但保留 Holder 原本前15個 kind 編號不變，因此既有 Holder state 不需遷移。Tilted Rack 自己的 world DP schema 保存3個獨立完整 item ID（例如 wine_q5 / vodka_q6 / empty_bottle）；抽取與拆除會原樣返還，滿背包時交易整體 rollback。自訂名稱/Lore/DP 的瓶子仍拒收，避免資料被靜默丟棄。

來源 renderer 先 scale 0.9，再依槽位 translate，最後 X +22.5°；本版將 Java block-model中心換算成3個 helper 錨點並隨 facing 旋轉。每個有內容槽最多1個 `tilted_rack_bottle_visual`，直接引用既有25種來源單瓶 geometry/texture；空槽不保留 helper。來源方向 shape 亦直接移植：North [-8,0,-3]/[16,14,10]、South [-8,0,-7]/[16,14,10]、East [-7,0,-8]/[10,14,16]、West [-3,0,-8]/[10,14,16]。來源配方輸出3個 Tilted Rack。

Java 紅石上升沿會隨機挑非空槽並把 DrinkBlockItem 投擲出去，Molotov 另走 ThrownMolotovEntity。依既定「沒有簡單穩定 Bedrock 對等就不硬做」原則，本批次僅完成高價值手動存取／展示，紅石彈射仍為 **NOT_ADAPTED**。實機 helper 角度、多人重連、手機精準點位仍為 **NOT_RUN**。
