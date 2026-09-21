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
| 專屬效果 | Bloody Mary 規則；XP Drain、Zenith、Shriek、Upside Down、Vision、Tomb Raider 適配 | **5項**：slightly_tipsy、high_heels、grass_stealth、ardent_heat、long_reach |
| 高腳凳 | 16色、放置/回收、原生座位、座墊隨乘客轉向 | Steve/Alex 座高、精細碰撞、手機/多人/重連實機 |
| String Lights | 17款、原模型/貼圖、染料換款、亮度15、四方向 | waterlogging、自然支撐/掉落、精確 selection |
| Sofa / Table / Bar Counter | 美術資產已在基線 | `SofaBlock`、`TableBlock`、`BarCounterBlock`、`IConnectionBlock` 的連接狀態、碰撞與沙發乘坐 |
| 酒櫃／酒架／杯架 | 多數原始模型/貼圖已有 | `BarCabinetBlock`、`CellarCabinetBlock`、`CircularRackBlock`、`TiltedRackBlock`、`GlasswareHolderBlock` 的存放、展示與互動 |
| 黑板／立牌 | 原始模型已有 | `ChalkboardBlock`、`SandwichBoardBlock`、`TextScreen` 的文字輸入、中文、同步與渲染 |
| 其他裝飾 | 部分資產/靜態展示已收錄 | Pendant Lamp、Incense、Painting、Stepladder、Holder 等逐個核對放置、形狀、狀態與掉落 |
| 葡萄／種植 | 7 crop blocks 與基本生長適配 | `WildGrapevine*` 世界生成、氣候/土壤加速、藤架連接與野生生成 |
| Molotov | 配方明示排除 | `MolotovBlock/Item`、投擲實體、火焰/命中行為、渲染 |
| 發射器／原版互動 | 基本手動瓶/杯流程 | `BottleBlockDispenseBehavior` 等 dispenser 行為及部分原版事件 |
| GUI／整合 | 獨立 Tavern 指南與原生配方冊 | Java Jade/JEI/REI/EMI 類整合需按 Bedrock UI 能力另做等價入口 |
| 視覺/客戶端 | 原作資產大量沿用；C4-C6已有動畫適配 | Slightly Tipsy 相機 roll、Grass Stealth 玩家渲染隱藏、動態飲品色、透明排序、第一/三人稱精準姿態 |
| 引擎驗收 | Node/mock 測試框架 | Minecraft、觸控、控制器、多人、BDS、Realms、存檔升級、Molang/rideable/food 原生事件最終驗收 |

## 專屬效果剩餘 5 項：Java 真實語義

1. `slightly_tipsy`：客戶端相機 roll，由三個不同週期的 sin/cos 波疊加。
2. `high_heels`：`STEP_HEIGHT_ADDITION +0.5`。
3. `grass_stealth`：潛行且位於成熟作物/指定植物；週期性耗體力、清除32格內仇恨並阻止新鎖定；Java客戶端還隱藏玩家渲染。
4. `ardent_heat`：衝刺撞破前方3×3指定方塊；加速飢餓消耗、撞牆耗護甲；裸裝累積5次受1傷；飢餓耗盡或效果結束後附加30秒 Hunger。
5. `long_reach`：方塊與實體互動距離各 `+3.0`。

## Batch 1：Upside Down

Java `UpsideDownEffect` 是瞬時效果：以使用者碰撞箱向 XYZ 各膨脹16格，取得存活 `Mob`，全部自訂名為 `Grumm`，並設為不強制顯示名稱。

Bedrock 本批次使用 `EntityQueryOptions.families=['mob']` 作類別過濾、`getAABB()` 作二次相交判定、`Entity.nameTag='Grumm'` 觸發原生倒立彩蛋；不寫入持續效果狀態。

已知 API 級差異：Bedrock Script API 沒有通用的 Java `setCustomNameVisible(false)` 對等 setter，因此名稱牌可見性列入實機驗收，不能宣稱完全一致。

## Batch 2：Vision

Java `VisionEffect` 每當剩餘 duration 可被50整除時觸發：半徑為 `min(amplifier+1,3)*6`，對範圍內除自己外的存活 `LivingEntity` 續上60 tick `Glowing`；只有至少一個目標在本次前沒有 Glowing 時才播放 `effect.vision`。

Bedrock 本批次把 `vision` 納入可持久化自訂效果；既有5 tick巡檢透過倒數跨越判定保留50 tick節奏，使用原生 `glowing` 效果與已存在的 `kt_assets_a17.effect.vision` 音效。候選實體先做有界 volume query，再以 `getAABB()` 做 Java 式膨脹AABB相交確認。

明示差異：為避免把所有自訂效果改成每tick寫入動態屬性，Vision pulse 可能在跨過Java節點後最多延遲一個5 tick巡檢窗口；Minecraft客戶端的發光描邊、聲音範圍與多人同步仍需實機驗收。

## Batch 3：Tomb Raider

Java `EffectEvent.onLivingHurt` 在攻擊者持有 `tomb_raider` 時，僅對 `#minecraft:skeletons`、Zombie/Zombie Villager/Drowned/Husk、Piglin/Piglin Brute/Zombified Piglin、Vindicator/Pillager/Witch 生效。目標自己的 `nextFloat() < 0.3F` 才觸發；主手可損耗物先把 damage 設為 `maxDamage-1`，之後卸下並在原地生成掉落，拾取延遲40 tick。

Bedrock 映射保留 Java 1.21.1 `#minecraft:skeletons` 的 Skeleton、Stray、Wither Skeleton、Bogged、Skeleton Horse；Zombified Piglin 對應 Bedrock 仍使用的 `minecraft:zombie_pigman`。機率把 JS RNG 先 `Math.fround` 再與 `0.3F` 比較。主手透過 `minecraft:equippable` 讀寫；耐久用 `minecraft:durability`；掉落使用 `Dimension.spawnItem()`。生成的物品實體保存解鎖 tick，`entityItemPickup` before-event 在40 tick內取消拾取。

明示差異：C6目前只讓玩家持有自訂酒效，而Java可把效果施加給任意 LivingEntity；另外 Bedrock `entityHurt` 是 after-event，Forge `LivingHurtEvent` 的致死一擊時序不完全相同，因此 lethal-hit 卸裝需實機驗收。
