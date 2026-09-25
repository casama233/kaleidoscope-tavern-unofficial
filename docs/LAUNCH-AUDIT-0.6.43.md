# 發射、莫洛托夫與微醺：Java 對照／候選修正

狀態：**0.6.43-candidate.1，不是完整 Java 一致性的驗收報告。微醺的畫面 roll 尚未恢復。**

基岩基線：`casama233/kaleidoscope-tavern-unofficial@e4ce3cad4d8f2ac601a19eb7558fb791bcfcd855`（0.6.42），保留其HUD隔離修正。Java 原作固定於 `KaleidoscopeMods/KaleidoscopeTavern@c4ec1880bd44cf3139d3ba744ab30bb379cf1416`。並從 Mojang 官方 1.20.1 server 與 mappings 核對繼承的 ThrowableProjectile、Projectile、ThrownPotion、MobEffect；下載 SHA-1、來源 URL 和原作檔案 SHA-256 位於 `data/launch-repair-reference.json`。Minecraft JAR 不加入來源／發行包。

## 1. 單體酒架和傾斜酒架

| 項目 | Java 原作 | 基線與候選結果 |
|---|---|---|
| 紅石觸發 | 未通電→通電；持續通電不重發 | 原有上升沿路由保留。首次引擎觀察不發射屬跨引擎適配；重載／短脈衝待實機。 |
| 選瓶 | 在已存的 BottleBlockItem 槽位中等機率抽一個 | 原有選擇與空槽排除保留；抽中空酒瓶是本次無動作，不重抽、不消耗空瓶。 |
| 單體酒架出射 | 中心 `(0.5,0.875,0.5)` 加正面法向量×0.5 | 原公式正確，保留數值，抽為實際路由使用的純函式供數學檢查。 |
| 單體酒架初速度 | `(normal.x,0.375,normal.z)×(0.5+random)` | 原公式正確；random 屬 `[0,1)`，因子 `[0.5,1.5)`。 |
| 傾斜酒架出射 | 同一中心，但沿 FACING 的**反方向** | 原公式正確；三個槽共用出射口是原作，不改成三個展示瓶口。 |
| 傾斜酒架初速度 | `(opposite.x,0.75,opposite.z)×(0.5+random)` | 原公式正確；不是隨便提高 Y 的補丁。 |
| 普通飲品／莫洛托夫 | 分別 ThrownPotion／ThrownMolotovEntity | 原分派正確；`.shoot(velocity,{uncertainty:0})`接收完整速度，兩條酒架發射分支明確不用手擲散射，不另乘0.8。 |
| 出射音效 | holder_pop 只在 DrinkBlockItem 分支 | 修正原先連莫洛托夫也播放普通酒瓶出射聲。 |
| 效果機率 | 發射時選定一次，整瓶沿用同一份 | 原本已有正確快照，保留，不在每個受波及目標重抽。 |
| 飛行期限 | 普通 throwable 沒有這個10秒硬期限 | 刪除移植版兩條腳本200 tick清除，以及莫洛托夫JSON10秒定時器。碰撞後由單一處理路徑移除。 |

原作路徑：`block/AbstractStorageBlock.java`、`block/deco/HolderBlock.java`、`block/deco/TiltedRackBlock.java`，均位於 `src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/`。

### 飲品碰撞效果的差異與修正

原先不是完整 ThrownPotion：瞬間治療／傷害只是添加1 tick原生效果，近／遠目標得到相同強度；持續效果最少強塞1 tick，未遵守 Java 嚴格大於20 tick的門檻；自訂效果又取整成秒，丟失 tick 精度。

候選版按官方1.20.1運算處理：擴張**投射物 AABB** `(4,2,4)`、距離平方嚴格小於16；直擊強度1，其餘`1-distance/4`。持續時間取`floor(originalTicks*factor+0.5)`，只在結果>20時施加。治療／傷害衰減的是強度，並按undead家族反轉；三個原作瞬時自訂效果不當成持續效果。既有酒款品質、機率表和庫存不改。

**仍不一致：**Java所有生物的 `isAffectedByPotions`、免疫、完整傷害歸因／事件鉤子不能由這份Living/undead適配宣稱等價；部分自訂效果仍只對玩家實作。這次沒有將它們寫成已完成。

## 2. 莫洛托夫：距離與蓄力

`item/MolotovBlockItem.java`明確要求：按住至少 **10 tick＝0.5秒**；鬆手才擲出；未到門檻不扣物品；初速固定 **0.8格/tick**、inaccuracy1、額外俯仰0；長按更久**不會更遠**；`UseAnim.SPEAR`；最大使用時間72000 tick。Java使用平面物品模型，不必為蓄力重做手持3D酒瓶。

基線的明確缺漏是：

- item缺少`minecraft:use_animation`，只有`do_swing_animation`（後者不是蓄力姿勢）。候選補回原生`spear`使用動畫，不覆寫player.json，不增加重複玩家動畫／發射處理。
- projectile沒有`anchor`與`offset`。Mojang Bedrock元件文件的預設anchor是origin／腳底；Java繼承的射手建構子則在**眼高-0.1**。候選明確使用`eye_height`和`[0,-0.1,0]`。這是來源與設定的根因證據，不是已拍到遊戲內實際出生高度。
- item的功率倍率和projectile的功率都寫0.8。候選將item倍率／上限設為1，projectile唯一基準為0.8，避免含混的雙層縮放；**沒有引擎量測證明舊版一定是0.64，新版也需量測有效初速**。
- 保留gravity0.03，明確air inertia0.99、water inertia0.8；原本未寫水阻力會走Bedrock0.6的預設。沒有啟用實驗性isolated_physics。

### 碰撞

兩個命中事件改接同一處理器，含已處理標記，避免同一瓶重複產火／音效／粒子。以Java的投射物位置而非HitResult接觸點作基準。移除原生`catch_fire`和額外native flame回調，避免額外直擊點火與重複粒子；Java莫洛托夫沒有單獨的直擊燃燒覆寫。

原作實際遍歷的是dx,dz各-3..3，共7×7格；內圈必試，方形四角依機率試，dy依-1..1找第一個合法位置。不能照註解誤擴成半徑5整圈。火花30、煙20、音效各2.0，候選恢復對應的腳本發送數量和位置散布。

**仍不完整：**完整`BaseFireBlock.canBePlacedAt/getState`的側面支撐、靈魂火、傳送門規則尚未移植；native粒子速度／壽命、Java三角分布散射（0.0172275×inaccuracy）、射手動量繼承、使用時移速與兩版碰撞積分不能只靠相同參數宣稱一致。SPEAR資源接線已補，不代表Android第一／第三人稱已驗收。

## 3. 微醺：不能再次把沒有畫面效果說成修好

原作 `client/event/CameraAnglesEvent.java` 使用：

```
t = player.tickCount + partialTick
roll += sin(t/19)*0.6 + cos(t/13)*0.3 + sin(t/9)*0.1
```

它是**只轉動畫面**的roll，不改玩家yaw／瞄準，也不是隨機地震。現行移植是0.75倍波形、每tick最多0.06度的`player.setRotation` yaw適配。波形存在和setter成功都不能證明本機客戶端有可見效果，也不能當作Java相同實作。

另有明確可靠性問題：一次API異常後`track.failed=true`導致整段酒效不再嘗試。候選改為有限頻率重試、首次異常記錄；施加酒效立即接入既有心跳；加入玩家自己的唯讀診斷。**沒有把這些變動標成微醺畫面已恢復。**

實際飲品效果表沒有刪掉微醺；並不是每個品質都有。例如wine_q2仍有微醺。玩家持久的`kt_no_tipsy_motion`退出標籤、睡眠、旁觀模式或被鎖定的視角會略過；本次不擅自取消使用者退出設定。

目前的API2.7 CameraSetRotOptions只接受Vector2（pitch/yaw）。Camera.playAnimation有獨立鏡頭動畫，但尚未驗證有保留正常第一人稱自由操作、可加到既有視角上的roll通道。**沒有用接管free camera、每tick teleport、噁心狀態或隨機shake冒充原作。**微醺視覺仍是未解決項，不應關閉問題或稱為完整移植。

## 4. 驗證與候選安裝

靜態驗證包括：固定Java源檔雜湊、56組四方向／兩酒架速度純數學案例、瞬間／持續效果邊界、真實酒款表、元件接線、單一命中入口、API版本欄位及既有模型／指南／材質檢查。`reviewedChanges`逐個列出既有檔案的before/after雜湊；歷史保護檢查只對完全匹配的已審變動套用替代，不接受其他變動。

**未執行新的BDS、客戶端或模擬玩家測試。**純軌跡遞推是Java數學參考，不是Bedrock投擲距離量測。

本候選保留UUID與ID。先備份／複製世界，再更新候選本體BP/RP；仍需Cookery1.0.6，世界名酒內容未改。不要用同時啟用兩版本的方法比對。

實機可在自己喝下應有微醺的酒後執行`/function kt_tipsy_diagnose`；輸出statusTicks、退出標籤、略過／錯誤原因、嘗試數。投擲後可執行`/function kt_molotov_diagnose`，只列自己的原生投射物樣本。`delayTicks=1`樣本已經可能經歷物理更新，不能當作原始初速；server readback也不是客戶端画面證明。這兩個函式不給物品、不施加狀態、不自動投擲、不修改鏡頭。
