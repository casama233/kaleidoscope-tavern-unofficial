# 酒桶機制修補（2026-09-29）

基於主分支 `06d941f08c1501c0320952cef5a0286485b2cb73`，保留已合併的 #95 特效、#96 龍頭及各朝向點選修補。本變更不納入 #101 的原生物品庫存遷移，不升級 Cookery 依賴，也不更換包 UUID、物品 ID 或存檔鍵。

## 修正

- `barrel_core.json` 的方塊回呼實際每 97 tick 觸發。原先 adapter 傳入 20，造成每 97 tick 只扣除 20 tick 熟成時間。新增共享 `BARREL_CHECK_INTERVAL = 97`，核心預設值和真實註冊的 onTick 都使用它，測試另對照方塊 JSON 的兩個 interval_range 邊界。
- 酒桶普通非流體原料不再以配方索引當作白名單。未匹配的組合仍走原有醋配方；液體容器優先分支、填滿 4000 mB、4 個槽位各 16 件、關蓋及釀造鎖定沒有放寬。原生特殊資料的 adapter 保護也未修改。
- 沒有離線追趕；只按已載入酒桶的回呼推進。既有存檔的剩餘 tick 不重新計算，不憑牆鐘時間補發品質。

## 回歸覆蓋

`node --experimental-vm-modules --test tools/mechanics/mechanics-regression.test.mjs`

8 項測試載入真實 core、MachineStore 與註冊回呼。其他 Bedrock 依賴使用明示的測試替身，不是遊戲引擎或真人玩家。覆蓋配置／回呼接線、倒數持久化、品質 1→6 完整排程、開蓋與滿品質穩定、普通原料→醋、匹配配方優先、容量／關蓋反例、流體容器分支。

在 20 TPS、unitTime=2400、已進入品質 1 且持續載入的條件下，品質 1→6 共 36,666 tick（30 分 33.3 秒）。這是規則推算與回呼測試，不是兩端客戶端秒錶測試。原始未修補 runtime 在本套測試中為 2 通過、6 失敗；已完成回呼修補的候選為 8 通過。

## 來源與限制

精確修補差異與 SHA-256 見 `data/mechanics-repair-20260929.json`。原始 `launch-repair-reference.json` 的 baseline、before 與 beforeProjected 證據沒有更換；只對明確修補的現行來源更新 after，並另記錄差異。

一次性修補工具已移除，持續保留唯讀回歸 CI。完整來源／打包檢查以該次提交的 GitHub Actions 結果為準。本次沒有執行 BDS、Java 客戶端、Bedrock 客戶端或多人驗收，也不表示所有 Java 機制已一比一還原。
