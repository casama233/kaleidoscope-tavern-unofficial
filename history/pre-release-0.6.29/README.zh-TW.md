# 森羅物語：酒館 C6 — 幽匿聲波、倒立、靈視、摸金校尉、醇熱與酒館家具

**這是功能開發測試版，未經 Minecraft／手機／Realms／BDS／bridge／Blockbench 的實機載入與行為驗收，不是完整發布版。** C6 包含 C1–C5；本輪補實際互動，不再重新收集顏色或重畫原作模型。

## 歷史階段

A17 與 C1～C5 的可追溯程式快照、來源索引、SHA-256 與階段說明集中在 [\`history/\`](history/README.md)。**目前可開發主幹仍是根目錄 C6。**

為避免 Git 重複五遍相同 A17 大型美術，C1～C5 保存的是當時程式／測試／工具／docs／SDK／資料鎖快照，共用美術回指 A17／現行 \`art/\`。歷史生成的 DEV \`.mcaddon\`／Demo \`.mcpack\` 不直接提交，精確檔名、大小與 SHA-256 記錄於 [\`history/artifact-catalog.json\`](history/artifact-catalog.json)。

## 真正新增

| 系統 | C6 已寫入 | 仍有的差異 |
|---|---|---|
| 幽匿特調／shriek_attack | 飲用完成後按視線做32格聲波命中，傷害為施用者**目前生命**×Java float1.2，追加水平0.63／垂直0.28速度；每2格一個原生聲波粒子，共16個，播放原生聲波聲音 | **明示PvE-only適配**：不傷害任何玩家，不攻擊本包helper；最多256個命中目標。使用原生sonicBoom，不繞過引擎拒傷。不是所有專屬酒效完成 |
| 螺絲起子／upside_down | 飲用完成時，以玩家AABB向外16格，將範圍內存活 `mob` 命名為 `Grumm`，觸發原生倒立彩蛋；使用目標AABB再次做相交判定 | Java `Mob.class` 以Bedrock `mob` family對應；Script API無通用 `setCustomNameVisible(false)` 對等項，名稱牌顯示差異待實機驗收 |
| 莫希托／vision | 持續狀態每跨過 Java 50 tick 節點，以 `min(amplifier+1,3)×6` 半徑掃描其他存活實體並刷新60 tick原生 Glowing；只在至少一個目標原本沒有 Glowing 時播放靈視音效 | C6狀態巡檢每5 tick執行，因此 pulse 最多晚一個巡檢窗口；Bedrock以health component近似 `LivingEntity` 並排除本包helper，音效／描邊仍待實機驗收 |
| 下界特調／tomb_raider | 玩家持續效果生效時，攻擊原作指定15類目標有30% Java float32機率卸下主手；耐久物直接改到僅剩1耐久，生成真實掉落並封鎖拾取40 tick | Bedrock用 `afterEvents.entityHurt` 安全改裝，晚於Java `LivingHurtEvent`；致死一擊時序與非玩家效果持有者不宣稱等價 |
| 深水炸彈／黃銅之心／ardent_heat | 兩杯都給300秒醇熱；衝刺時每tick檢查正前方3×3，只撞碎原作10種基礎石材；成功撞牆一次追加1.2 exhaustion，隨機損1件已穿盔甲1耐久，裸裝則每第5次成功撞擊受1傷；效果自然結束或飢餓+飽和耗盡後補600tick Hunger | 方塊掉落用明確原版對照（stone→cobblestone、deepslate→cobbled_deepslate，其餘自掉），不是Java loot-table完整模擬；飢餓換算交由Bedrock exhaustion元件，結束判定最多晚5tick |
| 十六色高腳凳 | 所有原作配色可合成、潛行放置、空手乘坐、潛行離座、回收；每張一個原生座位；座墊／靠背／扶手一起隨乘客轉向，底座不转 | 坐點與原生人物偏移、碰撞、Steve/Alex、手機、多人動畫待實機校正；使用look yaw而非Java yBodyRot |
| 十六色沙發 | 全16色原配方；6種原作連接狀態、跨色相連、放置/回收鄰居刷新；每格空手坐1人，僅乘坐時生成不可見 seat helper | waterlogging、背靠/轉角複合碰撞與 Steve/Alex/手機/多人座高仍待實機驗收 |
| 十七款彩燈 | 原作各款獨立幾何與貼圖、四方向、亮度15、原生染料換款；同色不消耗；可回收當前款式；洋紅款已同步官方 `c4ec188` 斜面背面剔除修正 | 不支援水浸、紅石開關或彩色動態光源；選取框為近似，無自然掛接/掉落還原；洋紅修正仍待實機多視角驗收 |
| 原作家具合成 | 16凳＋17彩燈，共33個新增工作台配方 | Java `c:ingots/iron`明示映射到原版iron_ingot，不冒充任意模組鐵錠標籤 |
| 獨立指南 | 新家具、聲波頁；現有幽匿特調頁與酒效完成度更新 | 不注入Cookery指南、語言、書籤或玩家偏好 |

**C6不是聲稱其餘工作全部做完。** 原有41個機器配方不變；工作台合成由10個增至43個。效果狀態為血腥瑪麗規則實作，經驗汲取／Zenith／聲波／倒立／靈視／摸金校尉／醇熱／高跟鞋八項明示適配；其餘3個Java效果仍未實作。

## 安裝與版本

- 先備份並建立新的測試世界。啟用已提供的 **Cookery v1.0.6 BP/RP**，再啟用 C6 BP/RP，酒館RP位於Cookery上方。
- 不同時啟用舊 C1–C5、A17 VisualLab 或 PoseLab。C6沿用相同UUID，套件版本提高至 **`[0,6,0]`**；真實存檔升級未測。
- Cookery依賴不變：BP `10f37ae2-9ccf-435f-b34b-0eec8191cd94`、RP `c89dc8df-c3fc-4bc8-8bd0-527abba76681`，內部版本均`[1,0,6]`。不重散布Cookery。
- 維持工程`1.26.50`格式、既定26.51驗收目標與Cookery實包基線`@minecraft/server 2.7.0`／`@minecraft/server-ui 2.0.0`。不是本輪最新版本或實機相容性聲明。
- 不包含player.json、全域JSON UI覆蓋或新的實驗開關要求。這些靜態條件不代表成就／Realms相容已證實。

## 第一輪使用

```mcfunction
/function kt_c6_kit
```

只給獨立兩本書、藍／紅高腳凳、藍／紅沙發、無色彩燈、染料、幽匿特調、螺絲起子、莫希托、下界特調、深水炸彈、黃銅之心與白色佳人；**不自動搭建世界、不自動生成攻擊目標或發射聲波**。預留背包與周围空間。

### 高腳凳

1. 潛行手持高腳凳，點擊石頭等已允許完整支撐方塊的上表面。目標與上一格需空氣，實際消耗一個物品。
2. 空手、不潛行，點凳子方塊坐下；同一凳只允許一名玩家。已坐船、馬或其他座位時拒絕，不強制搶走原坐騎。
3. 轉動視角，座墊／靠背／扶手更新角度；底座與腳踏不一起轉。客戶端使用最短角度插值減少±180度跳轉，但Molang尚未在引擎驗收。
4. 潛行離座，再潛行空手點方塊回收。正常破壞也走相同保全交易；有人坐時不能拆，背包放不下也取消。
5. 回收只由方塊產生一個**當前配色**物品，座椅helper不產掉落。Creative同樣消耗實際放置物品，回收返原件，避免複製。

坐點候選使用原作方塊錨點0.875格，加原作顯式乘客修正-0.0625，得到0.8125。Java基類和Bedrock原生騎乘仍可能另有偏移，所以**不是已完成像素級座高／腿部校正**。当前十字/扶手等精細聯集碰撞尚未還原。

### 彩燈

1. 潛行持任一彩燈點擊方塊面，在相鄰空氣放置；按水平面與玩家朝向保存四方向。
2. 拿原生染料點擊彩燈，消耗一份染料，切成該款**自己的原模型和材質**。不是將一個共用燈泡重新染色；同色不扣料。
3. 空手潛行或正常破壞回收一個當前款式。滿背包拒絕回收。無色款可直接合成，但沒有用水/漂白自動退色功能。
4. 所有款式原生`light_emission=15`；這是普通方塊光，不是RGB光照或shader光線追蹤實作。

`/function kt_c6_all_stools`給16款凳子，`/function kt_c6_all_lights`給17款彩燈，均為給物品而非自動放置。

### 合成

- 凳子：對應顏色羊毛、鎖鏈、鐵錠由上而下排列，產1張。
- 無色彩燈：上排3鎖鏈、下排3燈籠，產8件。
- 各色彩燈：前兩排同上，第三排3對應染料，產8件。

以上來自已上傳JAR的33份配方，雜湊見`C6-SOURCE-AUDIT.json`，且33份與實際上傳JAR逐位元組一致（`C6-RECIPE-JAR-COMPARISON.json`）。原生合成冊是這些配方的入口，酒館書新增操作說明；41個機器配方仍讀同一registry。

## 幽匿特調：危險範圍與明示適配

完成飲用時瞬時發射32格視線射線。範例：施用者當前20生命，基礎傷害24；當前10生命則12。不是按最大生命，也不是無條件秒殺。命中判定使用目標AABB中心與半寬；垂直/斜向也計算，不以整個方形範圍取代。

**只排除玩家，不排除所有友善生物：動物、寵物也可能被擊中，請只在空曠測試場對測試生物使用。** 聲波按原規則不檢查牆遮擋，不會爆炸、挖方塊或生成掉落。此版明確不做PvP，且最多處理256個命中目標。

傷害走`EntityDamageCause.sonicBoom`和原生`applyDamage`。只有返回成功才追加`applyImpulse`，不清除既有速度，也不直接覆寫HP去繞過無敵/保護。不同附屬是否實際攔截傷害需引擎測試，不宣稱通用領地插件相容。

新效果不再扣第二個雞尾酒或返第二個杯子；原生food仍負責消耗/返杯。效果不保存成循環狀態，重複同玩家同tick回呼只施放一次。藥水/特調資料、原生長按与杯嘴locator沿用C5，沒有在本輪宣稱它們已獲實機認證。

## 資源與持久化

大多數 A17 模型／貼圖保持；目前已有十一組有來源的官方 post-1.2 同步：洋紅彩燈 `c4ec188`、金色果汁桶 `b30f34a`，以及 `c70eec1` 的 **15/15雞尾酒模型與該提交全部block/item貼圖變更已完成同步**。最後 Depth Charge 批次讓 source-driven geometry regeneration 支援明示新增 element，並同步官方 block 與 item PNG；所有 c70eec 批次都由 `sync-plan.json + tools/sync_post12_visuals.py` 自動套用與 CI 驗證。新家具的**物品欄／手持暫用33張64px原模型渲染圖示**；它們是明確的派生圖，不是原作PNG，也不算已完成家具3D手持姿態。世界中使用完整原作形狀。`C6-FURNITURE-BINDINGS.json`記錄每個源模型、貼圖、圖示和實際ID。

家具由方塊類型與facing保存狀態，不另存一份家具物品庫存到world DP。高腳凳helper只提供視覺和原生rideable，按座標錨點重建/去重。區塊未載入不當空氣；helper錯色、失去主方塊或移位則 eject/remove，不生成第二份物品。

人工`/fill`／`/setblock`等外部替換可繞過本包回收；清掉helper不會補發家具。支撐被拆時可能留下可回收浮空家具。此DEV版防爆、不可推動，不把這個策略當成完整自然破壞物理。API例外有普通交易回退，不保證引擎硬崩潰級原子保存。

## 離線檢查圖

`previews/C6-furniture-overview.png`展示本包33張派生圖示，`previews/C6-stool-turn.gif`只採樣原作座椅上層骨架轉動。它们**不是Minecraft畫面**，不包含玩家模型、坐姿、原生乘客附加偏移或真正的Molang/網路求值。原底座骨架在全部48幀中保持不變。可用`python tools/render_c6_preview.py`重建；字型僅用本機已有字型，不隨包提供。

## 測試與建置

```text
python tools/build_runtime.py
python tools/validate_runtime.py
python tools/test_c6.py --cookery-reference "外部Cookery BP資料夾"
python tools/audit_rebuild.py
python tools/package_c6.py
```

不提供Cookery-reference就明確跳過那一個外部原模組共存案例；其餘562總量中的561例仍執行。提供時也只讀兩個Cookery API模組到mock bus，不啟動Cookery整包。`CHECK-C6.cmd`与npm scripts已更新；舊test/package工具名轉到C6，避免把新檔錯標成C5。

目前累積224個核心測試＋338個適配層測試＝562例。包含16配色/17款逐件測試；是具體單元案例數，不是511場遊戲測試。原生rideable由測試替身模擬；不模擬真實人物坐姿、Molang、light emission、客戶端音畫、返瓶或真實chunk保存。報告在`docs/TEST-RESULTS.json`與`STATIC-VALIDATION.json`。

**沒有Minecraft／bridge／Blockbench／Realms／BDS／手機實機驗收。** 核對清單見`ENGINE-TEST-CHECKLIST.zh-TW.md`，一律NOT_RUN。`--production`仍拒絕匯出。

## 未完成範圍

- 三種專屬效果：slightly_tipsy、grass_stealth、long_reach。
- 原生長按、Steve/Alex手腕/座高、杯嘴流束、跨端动画、藥水/飲用原生消耗及返瓶實測。
- 沙發/吧檯/桌自動連接與乘坐、櫃內物品展示、任意中文黑板文字、指南場景、野生生成/氣候、水浸/自然破壞。
- 燃燒瓶、西瓜汁特殊酒嘴、下方容器自動接酒；其他原作動態粒子適配。

原版來源、授權與Cookery隔離均保留。沒有字型、JAR/class或Cookery本體再散布。C1–C5具名文件及`docs/history/`為歷史記錄，當前狀態以本README、C6報告為準。
