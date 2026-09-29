# 機制審計後續：0.6.64 beta1

基準：Bedrock main f793a98a0180e1948f98e69a8ca879a028884e38；Java c4ec1880bd44cf3139d3ba744ab30bb379cf1416（1.20.1）。整合來源：PR #91、#93、#94、#95。版本不倒退，不覆寫既有發布資產／歷史驗證結果。

| 審計項 | 本次處理 | 尚存限制 |
|---|---|---|
| M01 酒桶 97/20 | 共享97常數、實際onTick回呼修正，純規則和adapter回歸 | 原生負載、卸載等並非持續時間保證 |
| M02 原料 | 普通合法ID不再受配方白名單阻擋；錯配醋／槽位／液體條件 | metadata物品仍拒收以避免資料遺失，非任意NBT等價 |
| M03 空瓶重複掉落 | PR93直接替換及免自然掉落／回滾完整接回 | 外部addon的自有破壞回呼不可全域控制 |
| M04 通用carrier/output | 原生getItemStack辨识carrier，註冊block及無歧義alias，交易回滾，方塊座標識別 | 有歧義alias保留物品掉落，不猜原生預設BlockItem；全部第三方資料未驗收 |
| M05 尖嘯 | Adventure施放、生存／冒險PvP、完整AABB+射線、post-hurt impulse、移除目標截斷 | 保留PvP-off／創造旁觀免疫策略；原生實際多人待驗收 |
| M06 長臂 | 接回明確指南與能力範圍，未假裝原生觸及已延長 | 原生攻擊／挖掘／通用實體互動觸及尚未還原 |
| M07 草叢潛行 | 現有隱形適配保留；描述不再把隱形等同清仇恨 | 穩定2.7原生Entity沒有target屬性；未完成原版直接清target |
| M08 高跟鞋 | 保留受條件限制的上階適配／明示語義 | 非原生STEP_HEIGHT_ADDITION+0.5 |
| M09 XP | 完整膨脹AABB、原版方向和feet距離速度、無128截斷、真實orb | takeXpDelay／playerTouch無等價實作，不造XP以免破壞修補／多人歸屬 |
| M10 微醺 | PR91預設關閉yaw，明確opt-in，不再自動改準星 | 未完成保留原生相機控制的加法roll；不以自由相機冒充 |
| M11 登頂 | 原生solid/liquid ray，不使用bottle_support，保留tryTeleport及高度防護 | Bedrock surface／碰撞與Java高度圖非所有地形等價；不強制傳送穿牆 |
| M12 點火 | soul火基底、普通承托、六面可燃鄰接、waterlogged排除、半磚／階梯狀態 | 有界白名單／tags適配；未知geometry／portal不是完整BaseFireBlock |
| 感知 | 使用EffectType.getName真實登錄表，缺少Glowing明示diagnostics | 尚未提供Java穿牆輪廓 |
| 倒置 | Grumm與Java同法；原生nameplateRenderDistance存在時設0 | 生物客戶端渲染仍需測試 |

## 實際檢查

- `python tools/check_release.py`：全包靜態與155獨立腳本回歸。API doubles 明確標記，不冒充原生玩家。
- `python tools/java_collision.py --java-source <pinned-java>`：42方塊／97瓶數形狀、Java來源吻合。
- `python tools/check_storage_rendering.py --java-source <pinned-java> --report docs/STORAGE-VALIDATION-0.6.64.json`。
- `python tools/check_launch.py --java-source <pinned-java> --baseline <cedfaedf...>`：歷史before/beforeProjected保留，after僅更新已審查變更；新檔顯式登記。
- `tools/mechanics/native_validate.py`：只接受fresh disposable BDS，載入Cookery1.0.6及此runtime，僅隔離副本追加測試入口／probe entity，不改原包。
- 原生fixtures：實際龍頭空瓶與通用方塊交易、97tick排程、點火分支、效果登錄表，另有508狀態／4172碰撞點／4172選取射線。以CI實際產物判定是否通過，不預先簽認。

### 已執行的 API 能力探測（不是整包驗收）

GitHub Actions run 36504744172，BDS1.26.51.1／API2.7.0，零玩家：同位置getBlock物件不相同；Entity.target不存在；Block.canPlace、trySetPermutation及isSolid不存在；nameplateRenderDistance有原生getter/setter。第一次EffectType探測錯用id並記錄TypeError，不能由該錯誤推定Glowing不存在；修正使用getName後由整包原生fixture重新列出。來源／原始log位於該run artifact11007127020。

不覆寫player.json或原版實體AI，不捏造未公開API，不以自訂狀態顯示當作原生效果成立。保持已要求的七入口指南、Cookery共用UI、Word式展板扩展及第三方命名空間隔離。

## 特效還原的既有缺口

PR95的105tests接回，但`docs/EFFECTS-REPORT-FOLLOWUP-20260928.md`仍有未完成粒子落地、液體交界、Cloud靠近玩家、Rain著地、Java AABB、光照／混合／裁切，以及未知動態粒子貼圖等差異。舊報告中的PvE-only是當時狀態，本版尖嘯策略以上表為準；不改寫歷史報告偽裝舊版本已修復。

本版是可追溯的修補beta，不是全部機制與渲染1:1驗收證書。原生長臂／步高／仇恨／XP冷卻／感知／roll的實作缺口，以及真人與多人驗收應保持open追蹤，不能隨PR清空一起消失。
