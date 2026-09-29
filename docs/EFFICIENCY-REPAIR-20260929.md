# 酒館能效修補：2026-09-29

基於 `main@4aeb47d6856c4cfaa50277cd45dd409f67c2e7d7`（0.6.65-beta.1）。
這是程式效率修補，不是耗電量、FPS 或 TPS 驗收。未改版本、未部署伺服器。

## 已修改

- **展示維護**：巡檢只建立最多 128 個 handle 的批次，保留跨批次進度；窖藏酒櫃、圓形酒架及附屬酒櫃按方塊去重。本體窖藏櫃／圓架每次整櫃同步只查一次附近實體。位置、朝向及種類與引擎實際值相符時不重設；仍修補遺失、重複、錯誤類型及遭移動的 helper，失敗傳送下次重試。未知／未載入方塊不當成空氣。
- **文字**：上限 128 塊板面的 LRU 排版快取，不快取世界中的實體集合。每次維護仍查詢實體，用 anchor 分組、signature 比對，只重建不符的字元；缺字和重複字仍可修復。初始化最後才寫入 signature。Java 排版公式、發光、色彩、傾斜、粗體、對齊未改。
- **環境特效**：按維度和 32 格空間桶索引；先檢查原取樣可達的 **floor(player position) ±31 立方體**，不是球形。相關玩家仍使用未修改的 667 組雙半徑取樣；只略過不可能命中的玩家。登記過期／移除會同步清理桶及停用空計時器。空圓架不登記；香薰關閉時煙霧邏輯未改。
- **效果**：兩條逐 tick 迴圈只遍歷有炙熱／高跟鞋的玩家，同 tick 共用狀態快照。空／未變動狀態不重寫。每 5 tick 的全玩家發現與有效果持久化仍保留，以發現額外狀態變更並保留離線、到期副作用及遷移語義。套用、清除、出生、離線、遷移回滾會維護或失效快取。

## 相同測試場景的呼叫計數

下表由**完整生產模組**搭配確定性 native API 替身執行，並對原版與修改版跑相同腳本；不是抽出函式的估算。仍不代表引擎執行耗時。

| 場景 | 修前 | 修後 |
| --- | ---: | ---: |
| 空櫃一次方塊維護：getEntities | 9 | 1 |
| 1 滿櫃，一次方塊維護＋一次 helper 巡檢：getEntities | 90 | 2 |
| 10 滿櫃，同上：getEntities | 900 | 20 |
| 100 滿櫃，同上：getEntities | 2,052 | 115 |
| 10 滿櫃，同上：種類／旋轉／位置修改呼叫合計 | 2,700 | 0 |
| 300 字元黑板改一個同寬字元：移除／生成 | 300／300 | 1／1 |
| 兩位不相關玩家、單 tick：環境亂數呼叫 | 16,008 | 0 |
| 無效果玩家、20 tick：狀態讀取／設定 | 44／4 | 4／0 |

方塊維護與 helper 巡檢在正常排程每 20 tick 一次；只有正常 20 TPS 才相當於一秒。巡檢預算仍按 handle 數限制，去重只發生在單批次內，沒有宣稱所有櫃在任何世界規模都每秒各巡檢一次。一次字寬或排版變化可合理影響多個字元，並非所有編輯只重建一字。

`docs/EFFICIENCY-COUNTS-20260929.json` 保存本次結果；CI 的 `efficiency-api-counts` artifact 每次重新量測。

## 回歸與來源保護

```bash
# 有原始基準 checkout 時，亦執行四項 byte-for-byte 保護測試。
TAVERN_BASELINE_ROOT=<checkout-of-4aeb47d6> node --experimental-loader ./tools/efficiency/mock-loader.mjs --test tools/efficiency/*.test.mjs
node --experimental-loader ./tools/efficiency/mock-loader.mjs tools/efficiency/measure.mjs <checkout-of-4aeb47d6> > before.json
node --experimental-loader ./tools/efficiency/mock-loader.mjs tools/efficiency/measure.mjs . > after.json
node tools/efficiency/compare-counts.mjs before.json after.json
python tools/efficiency/reference.py <checkout-of-4aeb47d6>
python tools/check_release.py
```

`data/launch-repair-reference.json` 保持原樣；小型 `data/efficiency-repair-reference.json` 以舊 after SHA-256 為 before 串接新的審查。`check_launch.py` 先驗證鏈，保留原 baseline、beforeProjected、未審查檔案防變更及所有原驗證斷言。新增 runtime 檔案也明確登記；不能靠此分層略過既有 gate。

本輪本地 48 項 adapter／生命週期案例及 4 項原始碼保護案例通過。持續整合另外執行既有倉庫工作流程；以 PR checks 的實際結果為準，不能從本地 52 項推論完整 CI 通過。

## 尚待實機驗收

原生 BDS、觸控／鍵鼠客戶端、長時間多人負載、跨區塊重載、真實 CPU/GPU/網路／耗電尚未測量。沒有減少瓶子或字元實體數量；沒有降低粒子密度或微醺頻率；沒有改存檔槽位、觸控 schema-2 aim、物品交易、紅石發射、酒桶時間及 RP 資產。

部署新增 script 必須真正重啟，不以 reload 代替；遵守 HANDOFF 的版本、配對依賴及本地修改保護限制。
