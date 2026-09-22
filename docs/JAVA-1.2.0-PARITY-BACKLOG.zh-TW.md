# Java 1.2.0 → Bedrock 完整移植差異追蹤

基準固定為 **Kaleidoscope Tavern 1.2.0 / Minecraft Java 1.21.1 NeoForge**。

- 上游：`KaleidoscopeMods/KaleidoscopeTavern`
- 本倉庫鎖定來源提交：`6b0d619145316492f055e03d70427107cd73efa8`（2026-07-01）
- release JAR SHA-256：`03f35e1e614953b22cd1f5e34345613f3a6a283bf1b1c99659b57d58970edeff`
- 目前 Bedrock 主開發階段：C6；Minecraft／手機／Realms／BDS 實機驗收仍為 **NOT_RUN**。

「已適配」表示已有 Bedrock 等價或明示適配，不表示兩個引擎逐像素或逐事件完全相同。

| 類別 | 已有 | 尚缺／仍需核對 |
|---|---|---|
| 釀造／壓榨 | 23酒桶＋6壓榨配方、4000 mB／4×16 酒桶輸入、Q1–Q6 分段發酵、醋 fallback、容器交易；最後一瓶後維持關蓋與壓榨桶 1／64 取料語義已對齊；**Barrel Tap 已完成 open→30 tick→close、紅石上升沿、placed/item carrier、原生 facing／waterlogging 與第二層正面中心嚴格連接**；**WaterCauldronTapBehavior 已用原生 cauldron states 適配空瓶／未滿水鍋輸出**；placed empty bottle 已改用 Mojang `block_placer`＋原生 cardinal／waterlogging；Pressing Tub 已使用原生 placement traits 對齊平放／側掛 tilt 與 water containment | Tap 的 generic Waterlogged/Lava/Beehive/Watermelon/DragonHead behaviors；filled BottleBlock projectile 打碎與其他原版可放置瓶；Pressing Tub Forge capability 與精確複合碰撞；實機時序仍需核對 |
| 雪克杯／雞尾酒 | 12固定配方、14雞尾酒、特調 payload、藥水身份、長按/倒酒適配 | 原生手腕/杯嘴動畫、下方容器自動接酒、西瓜汁等特殊酒嘴 |
| 專屬效果 | Bloody Mary 規則；XP Drain、Zenith、Shriek、Upside Down、Vision、Tomb Raider、Ardent Heat、High Heels 適配 | **3項**：slightly_tipsy、grass_stealth、long_reach |
| 高腳凳 | 16色、放置/回收、原生座位、座墊隨乘客轉向 | Steve/Alex 座高、精細碰撞、手機/多人/重連實機 |
| String Lights | 17款、原模型/貼圖、染料換款、亮度15、四方向；洋紅款已同步官方 post-1.2 `c4ec188` 面剔除修正 | waterlogging、自然支撐/掉落、精確 selection；洋紅雙面薄片仍待實機多視角驗收 |
| Sofa / Table / Bar Counter | **16色 Sofa、Table、Bar Counter 均已可合成、放置／回收與自動連接**；Sofa/Bar Counter 共用原作6態 IConnectionBlock；Table 使用X/Z軸四態；Sofa可乘坐 | Sofa/Table waterlogging、Sofa背靠複合碰撞與連接/座高實機驗收 |
| 酒櫃／酒架／杯架 | **Glassware Holder 4槽、Holder單槽、Tilted Rack三槽、Circular Rack六槽、木質／玻璃 Bar Cabinet 雙槽，以及 Cellar Cabinet 九槽手動存取／精確品質返還／來源展示已完成**；Holder／Tilted Rack／Circular Rack／Cellar Cabinet 已按 Java `AbstractStorageBlock` 上升沿隨機彈出一瓶品質飲品 | Molotov 本體與其 storage 紅石發射仍待 Molotov 批；projectile 軌跡／splash／多人仍需實機驗收 |
| 黑板／立牌 | 原始模型已有 | `ChalkboardBlock`、`SandwichBoardBlock`、`TextScreen` 的文字輸入、中文、同步與渲染 |
| 其他裝飾 | **3款 Pendant Lamp＋14款 Painting 已移植**；Painting 支援牆/地/天花板三種附著、四方向與來源1/16薄碰撞；部分資產/靜態展示已收錄 | Incense、Stepladder；Stepladder 的 Java 複合 VoxelShape 暫無單一 Bedrock collision box 等價 |
| 葡萄／種植 | 7 crop blocks、三種土壤種別、藤架生長／擴散優先序、果實 1–2 級成長、剪刀收穫與骨粉適配 | `WildGrapevine*` 世界生成；冰葡萄 `<0.15`／金葡萄 `>1.0` 的 Java biome base-temperature 80% 加速；藤架 waterlogging 與實機隨機 tick 驗收 |
| Molotov | 配方明示排除 | `MolotovBlock/Item`、投擲實體、火焰/命中行為、渲染 |
| 發射器／原版互動 | 基本手動瓶/杯流程 | `BottleBlockDispenseBehavior` 等 dispenser 行為及部分原版事件 |
| GUI／整合 | 獨立 Tavern 指南與原生配方冊 | Java Jade/JEI/REI/EMI 類整合需按 Bedrock UI 能力另做等價入口 |
| 視覺/客戶端 | 原作資產大量沿用；C4-C6已有動畫適配；post-1.2 洋紅彩燈 `c4ec188`、金色果汁桶 `b30f34a`，以及 `c70eec1` **15/15模型與該提交全部變更的block/item貼圖均已同步**；來源快照、blob SHA、source-driven geometry regeneration 與CI離線驗證已收束 | `c70eec1` 資產差異已清零；仍剩 Slightly Tipsy 相機 roll、Grass Stealth 玩家渲染隱藏與各批次標記為 NOT_RUN 的 Minecraft 實機視覺驗收 |
| 引擎驗收 | Node/mock 測試框架 | Minecraft、觸控、控制器、多人、BDS、Realms、存檔升級、Molang/rideable/food 原生事件最終驗收 |


## 釀酒閉環核對 Batch 1：Barrel／Pressing Tub／Grape

本批重新以鎖定 Java 1.2.0 提交 `6b0d619145316492f055e03d70427107cd73efa8` 核對完整鏈路，而不是只看既有 Bedrock 行為。

- `IBarrel`／`BarrelBlockEntity`：4 個原料槽、每槽上限 16、液體必須滿 4000 mB 才能開始；關蓋後每 97 tick 檢查。開始時快照輸出數量，正常配方取所有非空原料槽的最小數量（上限 16），無匹配配方固定轉成 16 份醋。
- 發酵品質實際為 `brewLevel 1..6`；每階段時間是 `unitTime × 當前 brewLevel`。Java 沒有卸載區塊離線補時，因此 Bedrock 的 loaded-block cadence 不是差異，不另造 real-time catch-up。
- Java `resetIfOutputEmpty()` 在最後一份成品取完後只清 batch／recipe／時間，**不會自動開桶蓋**。Bedrock 已改為同樣保持關蓋，下一輪必須由玩家重新開蓋後才能灌液。
- Java `PressingTubBlock.use` 空手普通互動只移除 1 個原料；潛行空手才請求移除最多 64 個。Bedrock 先前固定整組取出，本批已改為 1／64 分流；Barrel 的原料移除仍保持整槽返還。
- 葡萄核心生長規則已確認：普通葡萄固定 25%；冰葡萄在 Java biome base temperature `< 0.15` 時 80%，否則 25%；金葡萄在 `> 1.0` 時 80%，否則 25%。Bedrock Script API 2.7 可取得 biome identity/tags，但沒有 Java base-temperature 數值，因此目前維持 25% 保守降級，不用猜測 biome 表冒充等價。
- Tap 的 Barrel＋item-entity carrier 核心閉環已完成，placed empty-bottle block carrier 亦在後續 Batch 4 補齊；仍需其他 TapBehavior、Facing／waterlogging。Pressing Tub 側掛／water containment 已完成，WildGrapevine 世界生成與 biome 溫度加速仍待後續小批。  


## 釀酒閉環核對 Batch 2：Tap × Barrel item-entity carrier

Java `TapBlock` 並不是「玩家手持空瓶點一下立即取酒」。來源流程是：關閉狀態嘗試開啟 → `TapBlockEntity` 進入取酒狀態 → **30 tick 後 Tap scheduled tick 先關閉，再重新驗證 source／destination，最後才由 Barrel 消耗 1 份成品**。玩家在 Tap 開著時再次點擊會直接關閉，因此能取消尚未完成的取酒；紅石只在未觸發→有訊號的上升沿嘗試開啟。

本批先完成最小而真實的 Barrel carrier 路徑：

- Tap block 新增 `kaleidoscope_tavern:open=[0,1]`，closed/open 分別使用原作 `geometry.kt_assets_a1.tap_closed/tap_open`；item visual 繼續保持 closed。
- 使用原生 `minecraft:redstone_consumer {min_power:0, propagates_power:false}`，custom component 只在 `previousPowerLevel<=0 && powerLevel>0` 時開啟；`firstUpdate` 不製造假的上升沿。
- 有有效 Barrel batch 且 Tap 正下方 1×1×1 AABB 內存在符合 carrier 的 item entity 時進入 30 tick extraction；不符合時仍依 Java 做 **5 tick 空擰**，不直接報錯或消耗內容。
- 取酒前 5 tick 使用已收錄的 `kt_assets_a17:water_tap_drip` 粒子。Tap open session 只存在 Script 記憶體；若存檔／Script 重啟後留下 open block state，20 tick repair 會保守關閉而不補發成品，避免重複產物。
- 30 tick 結束時重新解析相鄰 Barrel、batch 與 carrier。Barrel output 仍透過既有 `interact(... action:'extract')` 計算，因此保持 Q1–Q6、remaining、最後一瓶 reset／關蓋語義。
- carrier item entity 支援 stack：多於1瓶時先生成 remainder，再移除原 entity；任一步失敗不提交 Barrel state。若 output placement／barrel save 失敗，會回滾 carrier、下方 bottle display／drop 與 machine raw state。
- 下方為 air 且成品是品質酒瓶時，直接建立既有 `bottle_<base>` display block，並寫入同一 `BottleStore` 的精確 `*_q1..q6` item ID；若下方不是 air，則像 Java 一樣把結果生成為 item entity。
- 手動第二次點擊 Tap 會立即關閉並取消 timer；不再把玩家手上的空瓶當作 Tap carrier。

deterministic adapter 測試已覆蓋：32葡萄→4桶汁→4000mB→Q2→16份成品完整鏈、每份30 tick延遲、第一份轉成 placed bottle display、其餘在已佔用 destination 時成為 item drops、最後一份後 Barrel batch 清空而 lid 保持 closed；另有手動取消與紅石上升沿／持續高電平不重啟測試。

**本批當時刻意未宣稱完成**：Java 的 placed `EMPTY_BOTTLE` block carrier 已由後續 Batch 4 補齊；Tap 的 horizontal facing／嚴格 barrel front-layer connection、waterlogging，以及 `WaterCauldronTapBehavior`、`WaterloggedBehavior`、`LavaCauldronTapBehavior`、`BeehiveTapBehavior`、`WatermelonTapBehavior`、`DragonHeadTapBehavior` 仍待後續批次。Minecraft／BDS／Realms 的 redstone callback、30-tick 實機時序、particle／sound 與 carrier AABB 也仍為 **NOT_RUN**。



## 釀酒閉環核對 Batch 3：Pressing Tub 放置姿態／waterlogging

Java `PressingTubBlock.getStateForPlacement` 的規則不是固定平放：

- 點擊上／下表面放置時，`tilt=false`，朝向為玩家水平朝向的反向。
- 點擊東／西／南／北側面放置時，`tilt=true`，朝向直接使用被點擊的側面。
- 傾斜果盆在 `fallOn` 不進入壓榨流程，而是回到普通方塊的落下處理；只有平放狀態可踩踏壓榨。
- Java 同時實作 `SimpleWaterloggedBlock`。

Bedrock 本批不新增 Tavern 私有 facing/tilt 狀態，而是直接使用引擎提供的 placement traits：
`minecraft:block_face` 保存放置所依附的六向面，`minecraft:cardinal_direction` 搭配 `y_rotation_offset:180` 保存平放時的玩家反向。四個水平 `block_face` 直接選用倉庫早已存在的原作 `geometry.kt_assets_a1.pressing_tub_tilt`，四個垂直放置組合保持正常模型。

waterlogging 使用穩定 `minecraft:liquid_detection` 的 water rule（`can_contain_liquid:true`），不另存一份容易漂移的自訂 waterlogged state。傾斜時 `press()` 讀原生 `minecraft:block_face`，水平面立即拒絕壓榨。

碰撞有一個明示的引擎級降級：Java 傾斜形狀是三個 AABB 的聯集；目前穩定 custom-block `minecraft:collision_box` 只給單一 AABB。本批使用 Java 三段形狀中**中間那一段的原尺寸 AABB**作保守碰撞，不使用整個 1×1×1 包圍盒製造幽靈牆；selection 維持完整格，精確複合碰撞仍列為 pending。

Minecraft／手機／BDS／Realms 的實際側掛方向、含水渲染、流體更新與落下傷害仍為 **NOT_RUN**。


## 釀酒閉環核對 Batch 4：Placed Empty Bottle Carrier

Java `EMPTY_BOTTLE` 直接註冊為普通 `BottleBlock::new`，因此它不是多瓶展示容器，也沒有 BottleBlockEntity；一格只放一瓶。其 `BottleBlock.SHAPE` 為 `Block.box(5,0,5,11,14,11)`，即6×14×6，具有水平 facing；空手使用會取回該瓶，普通 `BottleBlockItem` 使用即可放置，不要求潛行。

Bedrock 本批新增**隱藏內部 block** `kaleidoscope_tavern:bottle_empty`，玩家物品 ID 仍只有 `kaleidoscope_tavern:empty_bottle`：

- geometry 使用已存在的 `geometry.kt_assets_a3.empty_bottle_faces`，texture 使用 `kt_assets_a3_empty_bottle_faces`；內部 block 不進 creative catalog。
- collision／selection 都鎖為 Java 的6×14×6範圍；方向不再維護 Tavern 私有 `facing[0..3]`，改用 Bedrock 原生 `minecraft:placement_direction → minecraft:cardinal_direction`，`y_rotation_offset=180` 對應 Java `getHorizontalDirection().getOpposite()`。
- `empty_bottle` item 不再走 Tavern 自訂 Java item-use-on router，而使用 Mojang 穩定 `minecraft:block_placer { block: bottle_empty }`。這保留原生 BlockItem 的 Survival／Creative 放置與事件順序，並讓全域 scripted placement route 由12條回到11條。
- item 同時使用 `minecraft:liquid_clipped=true`，block 使用 `minecraft:liquid_detection`（water / can_contain_liquid / blocking），因此 placed empty bottle 不再欠 waterlogging。
- 空手使用 placed empty bottle 返還1個 `empty_bottle`；生存破壞仍復用 bottles protected-break route，以玻璃聲回收且不依賴 native loot。
- #65 原先為防 metadata 遺失而拒絕命名／Lore 空瓶放置；Java 普通 `BottleBlockItem` 並無此額外限制。改回 native block placer 後不再由 Tavern 發明這個拒絕規則。
- 同批修正品質酒瓶既有朝向公式：原腳本在已經表示「面向玩家反向」的 Bedrock yaw 映射上又額外 +180°，造成相對 Java `BottleBlock` 反向；現在 0/1/2/3 明確鎖回 north/east/south/west。

Barrel Tap carrier resolver 現在先檢查正下方 block：只有目前配方 carrier 為 `empty_bottle` 且 block 為 `bottle_empty` 才匹配；否則再回退到既有 item-entity carrier。30 tick 結束時先原子移除 carrier，再建立品質輸出、最後提交 Barrel state；任何一步失敗都回滾。placed carrier 的 facing 會保留到 `bottle_<base>` 品質 display，精確 `*_q1..q6` 仍存入 BottleStore。

deterministic 測試覆蓋：普通非潛行放置、空手取回、Creative 不消耗放置、生存 break 世界掉落＋玻璃聲、metadata 拒絕，以及 placed carrier 經 Tap 30 tick 原地轉為同 facing 的 Q2 `bottle_wine` 並保存 `wine_q2`。

**仍待**：filled DrinkBlock/BottleBlock 的 waterlogging、projectile 打碎 placed bottle 的 Java `onProjectileHit` 等價；Tap 的 facing／嚴格 barrel front-layer connection 與其他 TapBehavior；Minecraft／BDS／Realms 的 native block_placer、水中放置、碰撞、選框、破壞音效與 Tap carrier 時序仍為 **NOT_RUN**。



## 釀酒閉環核對 Batch 5：Tap native facing／waterlogging／Barrel front

這批先查官方成功案例再動手，而不是延長自訂狀態機：

- Mojang 穩定 custom-block placement traits 已能用 `minecraft:placement_position → minecraft:block_face` 保存玩家點擊的面，並用 `minecraft:placement_direction → minecraft:cardinal_direction` 保存水平玩家朝向；因此 Tap 不新增 Tavern 私有 facing。
- 與 #70 的 placed empty bottle 相同，waterlogging 繼續使用穩定 `minecraft:liquid_detection` 的 water containment，不再模擬一份 Java `WATERLOGGED` 布林。
- Java `TapBlock.getStateForPlacement`：點水平側面時 facing=clickedFace；點上／下面時 facing=player horizontal opposite。本批直接用 `block_face` + `cardinal_direction(y_rotation_offset=180)` 表達。
- Java Tap shape 原始 north AABB 是 `[5,5,6]→[11,13,16]`。Bedrock selection 改為同尺寸 origin `[-3,5,-2]` / size `[6,8,10]`，並由四方向 permutation 旋轉，不再使用過大的 8×16×8 泛用選框。
- Java Barrel Tap 只允許緊貼**第二層正面中心**：north=index1、south=index7、west=index3、east=index5。Bedrock barrel proxy 的 `dx/dy/dz` 已經等價保存這些世界位置，因此不需要新增 Barrel facing state；Tap facing 自身即可唯一決定背後應是哪個 `dy=1` front-center part。
- `findTapCore()` 因此不再掃六鄰居。它只檢查 Tap facing 的背面一格，要求該格是 `barrel_part`、`dy=1` 且 world offset 恰好是該 facing 的 front-center。錯層、桶側面、Tap 反向都不再誤連。

這個設計刻意復用 Bedrock 原生 placement/liquid 能力和既有 barrel part offset，不建立第二套 facing、front-index 或 waterlogged adapter。

Minecraft／手機／BDS／Realms 的側放方向、含水渲染、selection rotation、紅石與 Tap front connection 仍為 **NOT_RUN**。



## 釀酒閉環核對 Batch 6：Water Cauldron TapBehavior

這批先用 Mojang/Bedrock 已公開的原生資料模型對照 Java，而不是自己維護 cauldron 狀態。Bedrock 的 `minecraft:cauldron` 直接透過 `cauldron_liquid` 與 `fill_level` 表示液體與液位；目前 full water 對應 `fill_level=6`。

Java `WaterCauldronTapBehavior` 的來源語義：

- source 必須是 `Blocks.WATER_CAULDRON`；來源**不扣液位**，所以這條本來就是無限水源行為。
- destination 可以是 empty cauldron、未滿 water cauldron，或 Tavern placed `EMPTY_BOTTLE`。
- cauldron destination 一次直接補滿；empty bottle 直接替換成 `WATER_BOTTLE`。
- 和 Barrel 一樣走 Tap 的 open → 30 tick → close；結束時重新檢查 source/destination。

Bedrock 本批適配：

1. Tap 後方只讀原生 `minecraft:cauldron` permutation；只有 `cauldron_liquid='water'` 且 `fill_level>0` 才視為 Java Water Cauldron source。empty / lava cauldron 不誤匹配。
2. 下方若為 `bottle_empty`，30 tick 後替換成隱藏 display block `bottle_water`。它直接使用已收錄來源 `geometry.kt_assets_a17.water_bottle`／`kt_assets_a17_water_bottle`，Java `simpleBottle()` 的 6×10×6 shape，以及原生 cardinal／water containment。
3. `bottle_water` 空手取回時不建立空白 `ItemStack('minecraft:potion')`；復用既有 `Potions.resolve` 路徑返回身份為 `minecraft:water + minecraft:consumable` 的真正原生水瓶。
4. 下方若為 water cauldron 且 `fill_level<6`，30 tick 後直接把原生 `fill_level` 設為6；source cauldron 保持原液位。
5. 30 tick 結束時會重新解析 source 與 destination，避免開始後環境被換掉仍強行產物。
6. Java 結束時還有 `WAX_OFF` 粒子；目前沒有找到可證實的 Bedrock 穩定對等 particle ID，因此本批**不猜 ID**。開啟期間仍沿用已收錄的 `water_tap_drip`。

明示未完成：generic `WaterloggedBehavior`。Bedrock `Block.isLiquid` 明確不把 waterlogged block 視為 liquid；雖然 `BlockPermutation.canContainLiquid(water)` 能表示「可含水」，它不等於「當前真的含水」。在沒有可靠的實際 waterlogged occupancy 讀取方法前，不把「可含水」誤當成「已含水」。

deterministic 測試覆蓋：水鍋→placed empty bottle、partial water cauldron→full level6、empty/lava source 不匹配，以及 placed water bottle 回收後原生 potion identity 仍為 water/consumable。Minecraft／手機／BDS／Realms 的 cauldron state、native potion、流體與 Tap 30-tick 時序仍為 **NOT_RUN**。


## 功能 Batch：紅石儲存家具投瓶

視覺資產線完成後，本批收束 Java `AbstractStorageBlock` 的共用紅石語義，範圍固定為 **Holder／Tilted Rack／Circular Rack／Cellar Cabinet**；Bar Cabinet 等未繼承該基類的家具不會被誤套同一行為。

Java 1.2.0 來源規則：

- 只在鄰接紅石由未通電→通電的**上升沿**觸發；持續高電平不重複發射。
- 從全部非空 `BottleBlockItem` 槽位中隨機選一槽，每個脈衝最多處理一瓶。若隨機抽到 `empty_bottle`，因它不是 `DrinkBlockItem`／`MolotovBlockItem`，該次脈衝原樣 no-op，不會偷偷改抽下一槽。
- `DrinkBlockItem` 保留 brew level／品質建立投擲飲品；Java 同基類亦支援 `MolotovBlockItem`，但 Bedrock Molotov 本體仍未移植。
- Holder：方塊中心 Y=0.875 向正面0.5格；速度為正面法線＋Y 0.375，整體乘0.5～1.5。
- Tilted Rack：向自身 facing **反方向**發射，中心 Y=0.875；速度為反向法線＋Y 0.75，乘0.5～1.5。
- Circular Rack：方塊中心垂直向上，Y速度0.5～2.5。
- Cellar Cabinet：中心向正面0.5格；速度為正面法線＋Y 0.1，乘0.5～2.5。

Bedrock 已實作：

1. 四個 block 都使用原生 `minecraft:redstone_consumer {min_power:0, propagates_power:false}`；custom component 的 `onRedstoneUpdate` 讀 `previousPowerLevel/powerLevel`，只在0→正值時把工作 defer 到共用 `stateful-storage-router.js`。引擎首次觀察 `firstUpdate` 不製造假的上升沿。
2. 共用 router 負責隨機槽、精確 item ID、revision、block permutation 與 rollback。先成功建立 projectile，再提交 storage state；spawn／state-save 任一步失敗都移除半成品 projectile、恢復原 state／方塊／helper，避免吞瓶或幽靈瓶。
3. 新增真正的 `kaleidoscope_tavern:thrown_drink` projectile entity，復用現有25種酒瓶 geometry／texture map。entity DP 保存精確 `*_q1..q6` ID與**發射時已 roll 好**的效果列；因此飛行途中不會退化成只剩 base bottle。
4. 命中以 projectile 位置為中心查詢水平4格／垂直2格候選，距離平方<16；直接命中係數1，其餘用 `1-sqrt(distance²)/4` 衰減。原生 Bedrock effect 依縮放後 duration 套用；Tavern 自訂效果仍只對玩家套用，沒有對一般 Mob 偽造不存在的持續狀態。
5. projectile JSON 使用原生 gravity 0.05 與 glass hit sound；Script 不再額外播放第二份碎瓶聲。Holder 的發射成功音效使用已收錄來源 `holder_pop`。
6. Holder／Tilted／Circular／Cellar diagnostics 均標記 `ADAPTED_DRINKS_MOLOTOV_PENDING`；生成的家具 binding 亦把品質飲品 redstone pop 標為完成，Molotov 明示 pending。

回歸測試覆蓋：first-update／高電平不誤觸發、0→15只發一瓶、empty bottle no-op、四朝向 launch pose、Tilted/Circular/Cellar 多槽隨機只消耗一瓶、spawn failure/state-save failure rollback，以及 `wine_q6` projectile 命中後保留精確 item payload 並對4格內目標套用原生效果。這些是 deterministic mock／adapter 測試，Minecraft／手機／BDS／Realms 的真實 redstone callback 時序、projectile hitbox、網路同步與效果視覺仍為 **NOT_RUN**。

**尚未宣稱完成**：Molotov 投擲實體與燃燒／命中行為；其完成後再回接同一 storage launcher factory，不需要重做四種家具紅石路由。

### 後續優先序

1. **Dispenser／Tap 原版互動**：`BottleBlockDispenseBehavior` 的 dispenser 放置酒瓶；Tap 的紅石上升沿、下方容器自動接酒與特殊酒嘴／西瓜汁流程。
2. **黑板／立牌文字系統**：`ChalkboardBlock`、`SandwichBoardBlock`、`TextScreen` 的輸入、中文、同步與渲染。
3. **剩餘3個效果**：`slightly_tipsy`、`grass_stealth`、`long_reach`；其中相機 roll／玩家隱藏／reach 屬客戶端或引擎能力差異，先做可證實的 Bedrock 等價部分。
4. **世界與裝飾內容**：WildGrapevine 世界生成／氣候與土壤加速，Incense、Stepladder。
5. **Molotov**：方塊／物品／投擲實體／命中與火焰行為，完成後回接本批已預留的 storage launcher。

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

## Post-1.2 視覺同步 Batch 4：c70eec1 第二組

第二組選擇 **Empty Glassware／Mystery Cocktail／Sculk Special／Signature Cocktail**。逐份比對鎖定的 Java 1.2.0 提交 `6b0d619` 與官方 `c70eec1` 後，四個模型都只有 `render_type: translucent -> cutout`；元素數、座標、旋轉、UV、display transform、非 particle 貼圖引用與 `shade` 均完全不變。

因此 Bedrock 本批不改任何 geometry cube，只把四個 visual binding 與對應 runtime cup block 的材質從 `blend` 切到 `alpha_test_single_sided`。old/new 原始 JSON 逐位元組鎖在 `data/upstream/post-1.2/c70eec1/model-only-2/`，其 Git blob SHA 寫入第二份 `sync-plan.json`，並繼續由同一個 `tools/sync_post12_visuals.py` apply/check；沒有建立第二套同步工具。

完成後 c70eec 模型覆蓋由 **4/15 提升到 8/15**，尚餘7個模型與7張 block PNG、另有 Depth Charge item PNG。實際 Minecraft 的 alpha-test 邊緣、杯體內外面與各平台透明排序仍為 **NOT_RUN**。

## Post-1.2 視覺同步 Batch 5：Allium Garden

Allium Garden 是剩餘模型中最小的非純 render-mode 差異。逐份核對 `6b0d619` 與官方 `c70eec1` 後，14個 element 數量、display transform 與非 particle 貼圖引用不變；實際模型差異只有：`render_type: translucent -> cutout`、element 3 新增 `shade:false`，以及 element 12 north UV `[7.5,10.5,13,15.5] -> [7.5,10,13,15]`。同一官方提交亦更新 `textures/block/mixology/allium_garden.png`。

Bedrock 對應中，Java element 3 轉換為四個杯壁 cube 3–6，因此四面全部標成 `unshaded`；element 12 對應 cube 18，north UV 由 `[15,21]` 修正為 `[15,20]`。材質仍沿用既有映射，把 cutout 轉為 `alpha_test_single_sided`。官方 block PNG 的舊／新 Git blob 分別為 `39a25d464bf350af5ae464e27c7f57fc5688f9eb` 與 `42d41bb699d7c5f31aa38d4ec0faee55309379a8`；兩份來源快照與兩個 runtime block-texture target 均由同一 `sync-plan + tools/sync_post12_visuals.py` 離線驗證／套用，不經重編碼。

同步器因此新增兩個可重用能力：plan 可聲明精確 source UV→Bedrock UV 映射，以及可鎖定／複製二進位 texture blob。完成本批後 c70eec 模型覆蓋為 **9/15**，剩餘6個模型、6張 block PNG 與 Depth Charge item PNG。實機透明邊緣、花瓣細節與不同圖形設定仍為 **NOT_RUN**。

## Post-1.2 視覺同步 Batch 6：Grasshopper

Grasshopper 保持14個 Java elements，但官方 `c70eec1` 對其中11個調整位置／旋轉／面集合或UV，已不適合繼續用逐面手工 patch。本批把既有 A17 的 Java→Bedrock 轉換規則正式抽成 source-driven geometry regeneration：X座標鏡像到 Bedrock、X/Y rotation 反向、UV 由 Java 16-unit 座標映射到32px geometry；負尺寸 element 依 face 拆成單面 cube。plan 鎖定14→17的 element/cube 結構映射。

為防轉換器『自洽但錯』，另鎖定同步前 `grasshopper.geo.json`（Git blob `87393074bf6bd1460cf46eaa749b6511ee23f18f`）。每次 apply/check 都先用舊 Java model 重新生成17個舊 cubes，必須逐字段等於這份 baseline geo；通過後才用新版 source 重建11個 changed elements。官方 block PNG 同步由舊 blob `75794e7e5eda9d6cf98496b21b8fdb95b8bf0bf2`（438 B）更新到 `ba65d8604f6ba2515a72b3d3bdf30c5c4aa243a0`（676 B），兩份 runtime block texture 原樣使用新版 bytes。

完成後 c70eec 模型覆蓋為 **10/15**；尚餘 Bloody Mary、Depth Charge、Mojito、Screwdriver、White Lady 共5個模型，及其5張 block PNG，另有 Depth Charge item PNG。實機模型朝向、薄面剔除與alpha-test邊緣仍為 **NOT_RUN**。

## Post-1.2 視覺同步 Batch 7：Bloody Mary

Bloody Mary 仍是14個 Java elements，但官方 `c70eec1` 修改其中9個。沿用上一批 source-driven geometry regeneration，本批鎖定舊 Java model、舊 Bedrock `bloody_mary.geo.json`（Git blob `7304d36b0bff91dc7ab377f44b986092ee4f1a76`）、新版 Java model與14→18 element/cube 映射；每次 apply/check 先用舊 Java source 重建18個 baseline cubes並逐字段比對，通過後才生成新版9個 changed elements。

這批補上一個可重用的 face-remap 能力：反向X尺寸的 source element 4 會拆成四個側面 cube，並把 Java `down` 明示映射到 Bedrock `up`，同時保留 A17 既有的 `uv_rotation:180`。這個行為寫在 plan，不做全域硬編碼。官方 block PNG 從 blob `6b389971a45f53606d7fff96197d50ed74bb9246`（396 B）同步到 `07f47d76f7b9e5ede07eeee3a968471b1ee59a2d`（593 B），兩份 runtime block texture 都使用原始新版 bytes。

完成後 c70eec 模型覆蓋為 **11/15**；尚餘 Depth Charge、Mojito、Screwdriver、White Lady 共4個模型及4張 block PNG，另有 Depth Charge item PNG。實機杯壁、裝飾薄片與alpha-test邊緣仍為 **NOT_RUN**。

## Post-1.2 視覺同步 Batch 8：Screwdriver

Screwdriver 維持10個 Java elements，但官方 `c70eec1` 對10個全部重排，因此直接沿用已完成的 source-driven geometry regeneration。同步前另鎖定舊 Bedrock `screwdriver.geo.json`（Git blob `b981b34b15e5c8a2d3e980450f9b891adc9ff512`）；每次 apply/check 先從舊 Java source 依10→13 mapping 重新生成 baseline geometry，其中 element 0 因反向X尺寸拆成四個側面 cube 0–3，其餘 element 1–9 一對一對應 cube 4–12。13個 baseline cubes 全部逐字段一致後，才用新版 source 重建全部10個 elements。

這一批沒有新增 converter 特例，證明 Grasshopper／Bloody Mary 抽出的通用轉換路徑可直接復用。官方 block PNG 從 blob `3fb9e5995929620f04a60bce85db127d2d39ee4d`（763 B）同步到 `125669746daa8b7db1049c698757b788423da014`（1037 B），兩份 runtime block texture 都使用官方新版原始 bytes。

完成後 c70eec 模型覆蓋為 **12/15**；尚餘 Depth Charge、Mojito、White Lady 共3個模型及3張 block PNG，另有 Depth Charge item PNG。這三個剩餘模型都涉及 element 數量變化，需下一階段擴展 source-driven mapping 的新增／刪除 cube 支援。實機杯壁、裝飾物與alpha-test邊緣仍為 **NOT_RUN**。

## Post-1.2 視覺同步 Batch 9：White Lady

White Lady 是第一個 source element 數量減少的同步：Java 從14個 elements 降到13個。同步前鎖定舊 Bedrock `white_lady.geo.json`（Git blob `290005c943d0fad7e9f2708d9e48e84c6f78e668`）並驗證舊14→17 cube mapping；官方新版刪除舊 element 6，因此 plan 將 `updated_element` 明示為 `null`，其對應 Bedrock cube 9 被刪除，舊 element 7–13 則重新映射到新版 element 6–12。runtime 最終由17 cubes 收束為16 cubes。

同步器因此新增可重用的 old→updated element index mapping／deletion 支援：baseline 仍必須完整重建全部舊 cubes；新版生成時只允許 plan 明示的刪除，並重新組裝 cube list。官方 block PNG 從 blob `3da7ad25918346745807da46c23c2d11b50d99cf`（596 B）同步到 `c3796b7eaa62fcf34515eee8ad0227f7392c4c7c`（879 B），兩份 runtime block texture 使用官方新版原始 bytes。

完成後 c70eec 模型覆蓋為 **13/15**；只剩 Mojito、Depth Charge 兩個模型與兩張 block PNG，另有 Depth Charge item PNG。Mojito 同樣屬於 element 刪除型，下一批可直接復用本批 deletion mapping；Depth Charge 則是最後的 element 新增型。實機薄面、杯口與alpha-test邊緣仍為 **NOT_RUN**。

## Post-1.2 視覺同步 Batch 10：Mojito

Mojito 從15個 Java elements 收束為14個；Bedrock runtime 由21 cubes 收束為20 cubes。舊 source 的 elements 12、13 含 `rotation.rescale:true` 的45°旋轉平面，因此同步器新增了對 Java rescale 語義的鎖定轉換：先以 `1/cos(angle)` 沿旋轉軸垂直方向、相對 source rotation origin 擴張 cube，再用舊 `mojito.geo.json` 逐 cube 驗證；21個 baseline cubes 全部重建一致後才允許生成新版。

新版 mapping 明示刪除舊 element 10，舊 11→新10、舊12→新11、舊14→新12；新版 element 13 是新的大型雙面薄平面，因此復用舊 element 13 的單-cube Bedrock 槽位來 materialize 新 element 13，並讓 remap 後輸出順序依 `updated_element` 排列，而不是依舊 cube index。官方 block PNG 由 blob `db879ba67959610ae87e75b0f4a678ff85a3e546` 更新到 `ed3b8944a1624b14a0905c77a46d23b0399e956e`，兩份 runtime texture byte-for-byte 同步。

本批另外使用倉庫既有 `art/tools/render_preview.py` 對 baseline 與 materialized Mojito 的實際 `geo.json + PNG` 做離線 raster 比較；此圖只用於幾何/貼圖人工檢查，**不是 Minecraft 引擎截圖，也不替代 engine acceptance**。完成後 c70eec 模型覆蓋為 **14/15**，只剩 Depth Charge：12→13 elements、block PNG 與 item PNG。

## Post-1.2 視覺同步 Batch 11：Depth Charge（c70eec1 收尾）

Depth Charge 是 `c70eec1` 最後一個模型：Java 從12個 elements 增加到13個，Bedrock 由18 cubes 增加到19 cubes。同步前鎖定舊 Java model、舊 Bedrock `depth_charge.geo.json`（Git blob `2143d5c9e6a50f942dbac0d51eb0ca88ea2ef7dc`）、新版 Java model，以及官方 block/item PNG 的 old/new blobs。每次 apply/check 都先由舊 Java source 完整重建18個 baseline cubes，通過後才生成新版。

這批新增最後一個可重用 mapping 能力 `added_elements`：舊 handle element 6 對應新版 element 5，新版 elements 6/7 以新增 cuboid 明示加入，形成三段式把手；舊交叉平面 element 8 對應新版 element 11，舊 element 9 明示刪除；舊 element 4 則重排到新版 element 12。新版 target 依 updated source element index 決定 cube 順序，因此最終為19 cubes。官方 block PNG 由 `5ee0738a935f880bf9d643e0500cee182cd761a7`（958 B）同步到 `962980356fbecf1548ec5991feac3facee10db00`（1408 B）；實際物品圖示 `textures/kaleidoscope_tavern_jar/item/depth_charge.png` 由官方 baseline blob `30a9abbeb4176a96d0ab0f7375df7495efab23e4` 更新到 `25703204a0c40bb8cf4bcce59211e50fd8b6594e`。

本批也用實際 baseline/materialized `geo.json` 做3D人工檢查，並直接比較官方 old/new item PNG；檢查圖不進正式主線。完成後 **`c70eec1` 的15/15模型與該提交涉及的block/item貼圖差異全部收束**。Minecraft 遊戲內alpha-test、手持、第一/三人稱與不同圖形模式仍標記 **NOT_RUN**，不能用離線渲染代替實機驗收。

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

## Batch 13：Circular Rack 六槽圓形酒架

Java 1.2.0 `CircularRackBlock` 固定6槽，`circular_rack_blocklist` 為空。點擊槽位先依 facing 套用 `getLocalX/getLocalZ`，再以 `atan2(localZ-0.5, localX-0.5)` 取得0–360°角度，依來源邊界順序分成六個60°扇區。Bedrock 因 Molotov 整體仍明示排除，因此支援 `empty_bottle` 與全部24種品質飲品 base，world DP 保存6個獨立完整 ID，可混放任意品質並原樣返還。

展示復用 Batch 12 的25種來源瓶型映射；每個非空槽最多1個 `circular_rack_bottle_visual`。來源六個位置為 (0.5,0.125)、(0.875,0.3125)、(0.875,0.6875)、(0.5,0.875)、(0.125,0.6875)、(0.125,0.3125)，scale 0.82，slot yRot 依序 0 / 22.5 / -22.5 / 180 / 157.5 / -157.5，再按 facing 旋轉。空槽不保留 helper。

來源方塊固定亮度14、shape `Block.box(0,0,0,16,2,16)`，Bedrock 對應 origin [-8,0,-8] size [16,2,16]；配方 IRI 三行（I=iron ingot、R=end rod）輸出2個。Java `animateTick` 在有物品時以1/8機率沿邊線生成 End Rod 粒子；Bedrock 使用穩定 `Dimension.spawnParticle('minecraft:endrod')`，在20tick custom block cadence 每次生成1個隨機邊線粒子，明示為較低頻的視覺適配而非逐tick等價。

Java紅石上升沿投擲酒瓶／Molotov仍按既定原則保持 **NOT_ADAPTED**。實機 helper 朝向、粒子密度、多人重連與手機角度點選仍為 **NOT_RUN**。


## Batch 14：14 款 Painting 掛畫

Java 1.2.0 的 `PaintingBlock` 共14個註冊變體，共用相同方塊邏輯與基礎模型。來源放置規則完整保留：點側面為 `wall` 並使用被點擊面作 facing；點上表面為 `floor`，facing 取玩家水平朝向的反向；點下表面為 `ceiling`，facing 取玩家原水平朝向。三種 attach face × 四方向共12態。

六種來源碰撞／選擇形狀都是單一 1/16 格薄 AABB，因此 Bedrock 可逐態等價，不需要 helper entity。14款直接復用 A13/A14 已轉換的 `geometry.kt_assets_a13.painting_base` 與來源貼圖。13份 shapeless 配方及 Mondrian shaped 配方由鎖定 Java recipe 自動轉換；`c:dyes/*` 映射原版染料，`c:gems/diamond` 映射原版 diamond。

Java 原本使用共同名稱「掛畫」再用 tooltip 顯示作品名；Bedrock 方塊物品缺少同等 tooltip 流程，因此顯示名合併為「掛畫・作品名」保留辨識資訊。明示差異：waterlogging 暫不移植；Java inventory 的獨立2D item sprite 改用既有 block item visual。Minecraft／手機／多人／BDS／Realms 的牆/地/天花板旋轉與單面材質仍為 **NOT_RUN**。

## Stepladder 暫緩原因

Stepladder 的雙格放置可以直接復用 Batch 11 的 vertical-double 核心，但 Java 每個 half 的碰撞都是兩個 VoxelShape box 的聯集。Bedrock 穩定 custom block `minecraft:collision_box` 只能描述單一 AABB；直接取包圍盒會把人字梯變成大實心牆，明顯損害可玩性。因此目前只完成來源核對，不用錯誤碰撞宣稱完成；找到穩定複合碰撞方案後再回補。

## Batch 15：Bar Cabinet / Glass Bar Cabinet

Java 1.2.0 的 `BAR_CABINET` 與 `GLASS_BAR_CABINET` 都直接註冊 `BarCabinetBlock::new`，因此兩者只差模型／貼圖／配方，互動與存儲完全共用。每個櫃體有 left/right 兩個物品位與 `is_single`。普通 BottleBlockItem 可放兩瓶；若只有一側已佔用，玩家點到已佔用側再次放瓶時來源會自動改放空側，空手點到空側時也會自動改取唯一瓶子。

`bar_cabinet_irregular` 來源 tag 精確只有 brandy、carignan。異形瓶只能在完全空櫃放入，強制寫入 left 並設 `single=true`，渲染時置中；single 狀態不接受第二瓶。取出後 single 恢復 false。Bedrock world DP 保存 left/right 完整品質 ID 與 single flag，validation 禁止非法 single/異形組合。

櫃體連接依 Java `updateShape/getStateForPlacement` 還原 single/left/middle/right 四態，只承認「同一 Block 類型 + 同 facing」鄰居，所以木質 Bar Cabinet 與 Glass Bar Cabinet 不互連。瓶子展示使用最多兩個 `bar_cabinet_bottle_visual`，復用既有25種來源瓶型；scale 0.9，普通瓶左右分置，異形 single 居中。櫃體未覆寫 shape，因此完整方塊碰撞。

木櫃配方 GGG/G G/GGG 使用 grapevine。玻璃櫃 Java 配方中央為 `c:glass_panes`；Bedrock shaped recipe 支援 tag ingredient，但無法可靠假設 Java common tag 名在 Bedrock 端存在，因此本移植明確展開成無色 glass_pane + 16色 stained_glass_pane，共17份等價配方。

Batch 14 的14款掛畫與其 generator/測試全部保留。實機瓶型位置、Glass Cabinet cutout/透明效果、多人重連與手機左右點擊仍為 **NOT_RUN**。

## Batch 16：Cellar Cabinet 九槽窖藏酒櫃

Java 1.2.0 `CellarCabinetBlock` 繼承 `AbstractStorageBlock`，固定9槽，只允許點擊方塊正面。來源 `getClickedSlot` 先以 facing 套用 `getLocalX`，再用 `column=floor(localX*3)%3`、`row=2-floor(relativeY*3)%3` 建立3×3九宮格，最後 `slot=column+row*3`。Bedrock 直接使用 `blockFace + faceLocation`，側面／背面返回無操作，不猜測槽位。

`cellar_cabinet_blocklist` 與 Holder 相同，拒絕 brandy、carignan、mother_snow、miners_star、madame_shexiang、sunset_glow、riesling_dry_white、sweet_berry_wine、vodka、rum；因此支援 `empty_bottle` + 14種普通品質飲品 base。world DP 保存9個獨立完整 `*_q1..q6` ID，抽取與拆除原樣返還，背包不足整筆 rollback。

Cellar Cabinet 亦沿用 Java single/left/middle/right 連接規則，只連相同 block + 相同 facing。每個非空槽最多1個 `cellar_cabinet_bottle_visual`，共最多9個；來源 renderer 位置為三列 `x=0.825/0.5/0.175`、三行 `y=0.78/0.49/0.20`、`z=0.875`，scale 1、X -90°，再按 facing 旋轉。來源未覆寫 shape，因此完整方塊碰撞；`getShadeBrightness=0.2` 沒有直接穩定 Bedrock 方塊等價，本批標記為 **NOT_ADAPTED**。

Java 配方中央使用 `minecraft:trapdoors` item tag。1.21.1 tag 包含11種木／菌木活板門、iron trapdoor，以及 copper / exposed / weathered / oxidized 加四種 waxed 版本，共20個 item；Bedrock 本批明確展開成20份等價 shaped recipe，避免假設 Java tag 名可直接跨版使用。

來源 `POWERED` 僅用於紅石上升沿隨機投擲 DrinkBlockItem／Molotov，所有 powered blockstate 仍引用同一模型。因 projectile 路徑仍依既定原則保持 **NOT_ADAPTED**，本批省略沒有實際作用的 powered state，待未來真正接紅石投擲時一起加入。實機九瓶位置、正面觸控、多人重連仍為 **NOT_RUN**。
