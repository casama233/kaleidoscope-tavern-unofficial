# 酒／雞尾酒／杯瓶拿取修復（2026-09-29）

## 比對基準與範圍

- 本 PR 由移植主線 `f793a98a0180e1948f98e69a8ca879a028884e38` 分出。
- Java：`KaleidoscopeMods/KaleidoscopeTavern@c4ec1880bd44cf3139d3ba744ab30bb379cf1416`。
- Java 原生聲音：Minecraft 1.20.1 官方 asset index，13 份音檔逐一驗 SHA-1／SHA-256；`data/pickup-java-audio-reference.json` 保留來源與事件。
- PR #96 只選取酒杯架命中座標與槽位映射修復；未合併該分支其他改動。
- 未合併主線、未調整版本號或發布正式版、未修改 `player.json`／原生物品定義。

## 已實作的程式差異

| 類別 | 修復與 Java 依據 |
| --- | --- |
| 普通／玻璃酒櫃、窖藏櫃、單瓶架、斜架、圓架，以及經共用接口註冊的附屬酒櫃 | `AbstractStorageBlock.takeOut`／`BarCabinetBlock`：直接交到選中的空主手，不先合併背包；持物再次點擊走原有放入規則。 |
| 掛杯架 | `GlasswareHolderBlock`：指定槽位交到主手；創造放杯不扣量，普通酒櫃／酒架的 `split(1)` 仍會扣量。保留四方向杯位修正。 |
| 地面品質酒／西瓜汁、空瓶、水瓶、蜂蜜、龍息、燃燒瓶、經驗瓶、藥水、空杯／雞尾酒 | 分別沿 `DrinkBlock`／`BottleBlock`／`GlasswareBlock` 走 Forge 背包規則：相容堆疊優先、再依 0..35 找空格；不刻意跳過選中格。 |
| 品質、物品資料 | 品質酒保留後放先取。櫃架、掛杯架、品質酒與非水藥水使用原生 ItemStack 庫存，不再以字串 ID 重建改名／Lore／附魔／動態屬性等資料。 |
| 原生藥水 | 放置與配方解析分流。擺放非水藥水不再因改名／Lore 被拒；讀回原生堆疊。配方輸入仍使用原有語意與資料安全限制。 |
| 九宮格外邊界 | `CellarCabinetBlock` 的整數截斷後 `% 3`，不再使用 clamp。 |
| 取放聲音 | 酒架取物 item-frame remove；酒櫃玻璃放置並保留原版音量／音高分支；掛杯架紫水晶；DrinkBlock 玻璃、其他放置瓶杯石頭，另有 Forge 插入成功的拾取聲。 |
| 可互動模式 | 普通存取允许 Adventure、拒绝 Spectator；放置與破壞繼續遵守 `canWrite`，不能透過回收工具繞過 Adventure 限制。 |
| 背包剩餘輸出 | 顯式 Forge 拾取可以掉落剩餘物品。只為自己的溢出物品設 40 世界 tick 拾取等待、初始水平速度零；其他機器交換仍採原本背包滿則回滾的規則。 |
| 破壞、投射物、紅石 | 回收取回同一份原生物品；紅石發射／投射物破壞依既有 Java 行為消耗，不再遺留可重取的原生庫存。非互動破壞不誤播拿取音效。 |

## 原生資料保存契約

`kaleidoscope_tavern:stored_items` 是不可碰撞、無模型、不可由漏斗抽取的持久私有九格實體庫存，僅在有物品時建立；最後取走或破壞後清理。並非把未知 NBT／自訂資料序列化成 JSON。

原有 ID 狀態繼續驅動模型與版本相容；世界指標記錄庫存實體 ID、token、位置、槽位 ID。已採用原生庫存後，若實體未載入、被刪除、移位、token 不符、槽位多／少了物品或資料損壞，**停止交易，不降級成普通 ID 物品**。只有真正沒有原生庫存紀錄的舊存檔，才可依原有資料進行一次遷移；遷移不能恢復舊版本本來就沒有保存的資料。

庫存、方塊與狀態採同步例外回滾；這**不是**斷電／程序中止時的跨 LevelDB 記錄 ACID 保證。現有存檔導入前應備份；不要用清理所有實體的指令刪掉有物品的庫存實體。

Java 本身對某些简单放置物只按 loot 重建物品。水瓶沿原版事件變成簡單水瓶方塊，普通杯按原版的杯／特調有效載荷重建。因此沒有把「保留所有物品任意 NBT」錯誤套用到每一種方塊。

## 驗證

- `node --test tools/pickup/core.test.mjs tools/glassware/hit-basis.test.mjs`。
- `node --experimental-loader ./tools/pickup/mock-loader.mjs --test tools/pickup/adapters.test.mjs`。
- `python tools/pickup/check_audio.py`。
- `python tools/check_release.py`、`python tools/check_launch.py --java-source <pinned Java source>`、`python tools/build_release.py`。
- `tools/pickup/run_native_smoke.py`：在獨立一次性 BDS 1.26.52.3 世界中，使用本 PR 原生庫存實體和核心，保存附魔／損耗／改名／Lore／動態屬性物品與原生藥水，正常關服，再重啟驗證與取出清理。CI 日誌與 source SHA 為證，**不是整包、玩家互動或客户端測試**。

腳本測試使用明確標記的確定性測試替身；没有使用 Minecraft SimulatedPlayer。保留歷史驗證報告，不把舊證據改成新版本實測。新增純規則與實際 adapter 路徑測試獨立保存。

## 尚未宣稱一比一的引擎邊界與驗收項目

1. **Java 副手回退**：Bedrock 的 block-use 事件沒有 Java 的 InteractionHand 欄位，目前手持快照仍讀主手。沒有把「主手持物、副手空白」一律當空手，否則會吞掉主手堆疊放置、飲用或其他 addon 互動。本 PR 不宣稱任意 Java 副手派發完全相同。
2. **兩端客戶端驗收**：滑鼠、手柄、觸控長按、潛行、副手，以及多人同點／跨區塊卸載重載，仍需真實客戶端測試；單元測試或無玩家 BDS 保存測試不代替它們。
3. **引擎掉落物合併**：40-tick 防拾取標記掛在自己的原生 item entity；Bedrock 合併掉落物時的實體保留／標記行為，以及聲音混音與距離衰減，尚未以 Java／Bedrock 客戶端並排量測。
4. **已有世界損壞／外部刪實體**：不猜物品資料、不製造空白替代品；保留錯誤而停止交易。需從備份復原，不能將其描述為無條件自動修復。

以上界線不應寫成「全部已實機驗收／與 Java 完全一模一樣」。合併前先完成客戶端驗收矩陣：主手位置、同類堆疊、全滿背包、兩瓶同 ID 不同改名、混合品質、特調效果／顏色、創造與冒險、正常重啟、破壞回收及多人同時操作。

## CI 後續核對

GitHub Actions `36517978171` 的原生 BDS 1.26.52.3 隔離保存／正常關閉／重啟測試已通過：物品名稱、Lore、動態屬性、可破壞／可放置資料、附魔與損耗，以及 healing／Consume 藥水類型均保留；取完後庫存輔助實體清除。此結果仍不代表整包或雙端玩家驗收。

原有跨附屬測試揭示註冊酒櫃漏接新主手規則；現共用接口亦採原生槽位資料保存、主手給物與個別音效，保留原有遷移 receipt／tombstone、防重取與失敗回滾。新增全部 10 款附屬酒櫃的生存、創造與冒險模式往返測試，逐槽使用相同 ID／不同名稱驗證不串物。測試替身統一到實際穩定版藥水 delivery ID 與 `Entity.isValid`，沒有修改歷史檔案或停用任何測試。
