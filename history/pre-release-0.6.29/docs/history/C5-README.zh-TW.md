# 森羅物語：酒館 C5 — 原生使用事件、杯嘴定位、藥水與首批專屬酒效

**C5 是可供測試的功能程式，不是經過 Minecraft／手機／Realms／BDS 驗收的完整發布版。** 原生長按的元件與開始／鬆手事件已接線；mock 注入原生事件測試不證明目標遊戲真的啟動一般工具長按。精確手腕校正仍需客戶端實測。

## C5 真正新增

| 項目 | 程式實作 | 必須保留的邊界 |
|---|---|---|
| 原生長按 | `use_modifiers.start_using=always`，`itemStartUse`／`itemReleaseUse`／`itemStopUse`，按剩餘tick差值結算；111tick保底 | 預設native；尚未實機確認桌面／觸控能觸發。可在獨立指南明確切換舊兩次使用模式；不暗中回退 |
| 使用中穩定性 | 原生開始時不重寫或換掉ItemStack，避免中斷引擎使用；鬆手／停止去重、取消與切欄清理 | 只在結算時同步寫回结果；伺服器tick與剩餘使用量差異超3tick即取消保留材料 |
| 杯嘴 | 原模型杯身唇緣`root/kt_spout=(-3.5,11,0)`；倒酒動畫7個keyframe從locator發出液滴 | 真正是模型局部定位，不是玩家眼睛偏移線；仍未實機確認，未完成精確手腕／手臂融合或物理命中杯心 |
| 原生藥水 | 飲用、噴濺、滯留類型讀取原生effect/delivery；實際durationTicks；退料經Potions.resolve核對身份 | 43個明確效果識別映射只在當前引擎註冊且duration有效時接受；未知／自訂meta拒收，非通用NBT複製 |
| 血腥瑪麗 | 玩家持效果擊殺後回復floor(目標最大生命/3)，不超自身最大生命；重複死亡訊號去重 | 玩家專屬DP計時，不提供原生狀態欄圖示；未做原作所有相機／視覺效果 |
| 經驗汲取 | 每5tick牽引8格軸向範圍內的既有經驗球，保留原球和值、近處讓原生拾取 | 明示適配：不清除Java原生XP拾取冷卻；每玩家每次最多128球 |
| Zenith／教父 | 同柱可用安全頂面傳送，附來源600tick飢餓 | 明示適配：不是Java MOTION_BLOCKING高度圖，也沒有確定落距重置；不挖方塊、不強制傳入不安全位置 |
| 附屬 | API1新增`native_potion_inputs`能力；舊主機無此能力就不傳藥水調酒配方 | 僅物品ID篩選，不新增藥水品種/效果條件DSL；不允許用普通potion ID當不帶身份的產物 |

C1–C4的41個內建機器配方、葡萄種植、釀造、逐瓶品質、杯具保存、獨立兩本書及附屬接口繼續保留。沒有新增家具、文字或世界生成程式，不能把既有美術當成已完成玩法。

## 安裝與版本

先备份，使用新的測試世界。啟用上傳的 **Cookery v1.0.6 BP/RP**，再開C5 BP/RP，酒館RP在Cookery上方。C5包含C1–C4，不同時啟用舊功能包、A17 VisualLab或PoseLab。

C5 own header/module version **[0,5,0]**，UUID不變。Cookery真實依賴保持BP `10f37ae2-9ccf-435f-b34b-0eec8191cd94`、RP `c89dc8df-c3fc-4bc8-8bd0-527abba76681`，版本[1,0,6]。Script API仍為`@minecraft/server 2.7.0`、`@minecraft/server-ui 2.0.0`；沿用工程1.26.50格式、既定26.51測試目標，**不是最新版本或相容性認證**。

不包含player.json、不覆蓋Cookery指南/UI/偏好、不加入food/shooter/throwable去假裝捕捉長按。新自訂狀態只有酒館命名空間玩家DP；原機器/杯具/可攜保存鍵未改。schema1的slot增加可選`potion`身份：**裝入藥水後不要降回不認識該欄位的C4，真實存檔升級未測。**

## 第一輪調酒

```mcfunction
/function kt_c5_kit
```

只給物品，不清空或搭建世界。工具包沿用C4的基酒與杯子，另給16個原版玻璃瓶。不同藥水從創造模式物品欄拿取；不使用猜測的數字data值發藥水。

1. 潛行放置雪克杯，依次投入伏特加Q4、雷司令乾白Q4、螢花釀Q4，觀察原PUT杯蓋動畫與返瓶。
2. 潛行空手點上表面拿起；對空氣**按住使用**，鬆手停止。停止落在89–98tick才走固定配方；其他原作時間區間不變。
3. `酒館指南 → 沉浸／計時輔助`可開精確tick。原生輸入預設啟用；若客戶端完全沒有開始事件，在同頁**明確選擇兩次使用相容模式**並記錄Content Log，不能把fallback成功當作native通過。
4. 過早鬆手(<19)、潛行、切快捷欄、離開維度等取消，已有原料不重抽。111tick自動完成後仍按住不會開始第二次。
5. 對已放空杯倒酒，12tick後才提交。杯嘴液滴改用客戶端locator；杯位仍被預約，失敗不扣料。液滴不是具碰撞的權威液體。

## 藥水輸入與退料

支援三種原生投送方式：`minecraft:potion`、`minecraft:splash_potion`、`minecraft:lingering_potion`。每次一瓶，投入立即返一個`minecraft:glass_bottle`；退料必須交回玻璃瓶，按保存的effectId/deliveryId重建並確認沒有變成水瓶。

原作白色標籤只列drinkable potion，因此**只有飲用藥水自動加入固定配方的白色選項**。噴濺/滯留可用於特調，或由附屬明確列入固定配方，不擅自擴大原作tag。

已明確映射標準強度/延長類型及兩種海龜效果；持續時間讀原生PotionEffectType.durationTicks，不由固定中文/英文名稱猜秒數。沒有持續時間的非瞬時效果、未知種類、命名/附魔/lore/CanPlaceOn/CanDestroy/額外DP/物品鎖或keepOnDeath的藥水拒收。

**適配差異：** Java CocktailEffectHelper只迭代customEffects；C5刻意使標準基礎藥水效果也參與特調。這是有文件的玩法適配，不叫逐行等價。藥水顏色沿用原作白色規則；特調合併仍用來源float1.2／最大強度與機率。新編織/滲漿/寄生/風爆類沒有偷套別種效果，未知則拒收。

更多範圍與交易限制見`docs/C5-POTIONS.zh-TW.md`。

## 專屬效果完成狀態

- **血腥瑪麗**：擊殺回血規則實作；原固定杯1800秒，與特調同用計時器。
- **蔥花園／xp_drain**：既有經驗球牽引適配，原固定杯1800秒，原生拾取仍由引擎執行，不造XP。
- **教父／zenith**：安全頂面傳送適配，飢餓600tick；不安全、未載入或已在頂部則不傳送。

其他9個Java效果仍未實作：slightly_tipsy、high_heels、grass_stealth、vision、ardent_heat、long_reach、tomb_raider、upside_down、shriek_attack。指南逐杯顯示實際狀態，不用速度、力量或相機抖動冒充。

持续效果每5tick保存剩餘時間，離線暫停，牛奶完成飲用/死亡清除，不修改其他包DP。普通斷線最多存在一個保存間隔的時間差；引擎硬崩潰不保證零回退。無原生圖示，`/effect clear`不保證清除自訂DP，使用牛奶。見`docs/C5-EFFECT-COVERAGE.json`。

## 手腕和杯嘴：哪些是真的校正

杯嘴點由原模型身體盒`[-3.5,4,-3.5]+[7,7,7]`量出，綁在原骨架、跟隨第一/第三人稱變換；不修改原cube/UV。原PUT動畫不变，C4倒酒0.6秒/65°仍是Bedrock适配。

**手腕位置並未完成實機校正。** `data/hand-calibration.json`集中第一/第三人稱位置、角度和尺度，建置時讀取；目前沿用C4候選值並標NOT engine calibrated。不能把杯嘴局部座標正確說成Steve/Alex手腕、FOV、控制器/手機、其他動畫包融合均正確。

客戶端杯嘴液滴現為中性白色；不能從ItemStack私有DP直接讀取Signature RGB。杯位接觸粒子保留伺服器已知顏色；兩者不等同於完整有色連續流束。機器交易/杯位決定仍在伺服器，不由裝飾液滴命中決定。

## 程式入口與驗證

`core/native-use.js`與`bedrock/mixology.js`處理原生生命週期；`core/potions.js`/`bedrock/potions.js`處理身份、效果與退料；`core/custom-effects.js`/`bedrock/custom-effects.js`處理酒馆独立状态。資料/元件/動畫由`tools/build_c5.py`建置，不覆寫`art/`。

```text
python tools/build_runtime.py
python tools/validate_runtime.py
python tools/test_c5.py --cookery-reference "外部Cookery BP資料夾"
python tools/audit_rebuild.py
python tools/package_c5.py
```

不提供Cookery-reference時，原Cookery兩個API模組的模擬聯測會明確跳過；有路徑也只是在mock bus載入配方/指南兩模組，不啟動完整Cookery。單元測試的藥水registry、native-use事件、health/orb/teleport是本地測試替身，不是引擎。原生消耗、返瓶、原生使用是否開始、網路延遲、動畫混合、Molang、locator粒子和碰撞仍須依`ENGINE-TEST-CHECKLIST.zh-TW.md`實测。

## 剩餘工作

九種專屬酒效；精確實機手腕/杯嘴姿態與長按驗收；更廣藥水/自訂NBT；家具乘坐/連接/庫存展示、黑板任意文字、野生生成/氣候、水浸/碰撞、燃燒瓶/西瓜汁/下方自動接酒及真實存檔/多人驗收。C5未新增這些系統，不用「全部完成」概括。

授權保持原`LICENSE-ASSETS`和BSD條款；不重新散布Cookery本體/腳本、字型、JAR/class。A17美術與C1–C4具名文件是歷史基線，當前結果以本文件/C5報告為準。`--production`仍拒絕輸出。
