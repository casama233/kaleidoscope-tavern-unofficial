# Ribbits FP 解壓修補與LIVE紀錄

**[private deployment time]**：managed-server **T154／G132／W131／private-integration／Ribbits1.0.10037**，42包，BDS1.26.52.3 RUNNING。Canonical PR／必要CI、static、一次停服存檔副本first／restart、完整准入及逐檔／順序讀回通過。`client=false`、`production_ready=false`、`pending_client_acceptance`。

Ribbits1.0.10037只替換FP存檔載入的一處同步Base64解壓呼叫，六位元緩衝解碼保留原UTF16字典結果；異常／非標準輸入交回原方法。保存格式、序列化、property keys、回呼、既有connection修補及其餘資產保留；配對manifest由canonical compiler生成。T154／G132／W131及P34輸出不變。

私有canonical [PR21](https://github.com/casama233/senluo-family-integration-private/pull/21)及CI38364423686已完成，merge `be7cf5287be8d6982052e409de6f9efc28d5cc0c`；准入工具[PR351](https://github.com/casama233/kaleidoscope-tavern-unofficial/pull/351)與CI38364584448通過，merge `831c9dfa`。來源CI核對UTF16全域、原作者roundtrip與異常輸入；必要baseline成功，私有付費pre-commit不可用沒有冒充通過。T154功能來源PR348、G132 PR199、W131 PR115保持。

## 診斷與驗證範圍

原始存檔診斷將FP載入分成解壓與deserialize：原解壓4次254ms、deserialize4次96ms。另一次同程序、相同4份資料的差分診斷，新解壓64ms、原方法249ms，解壓字串嚴格相等；兩者同時執行，不能當整體啟動減時。診斷helper與真實存檔payload未隨包發布。

本次poststart **172 warnings／0 errors**；watchdog **145（8 Spike／137 Slowdown／0 High Memory）**，其中Ribbits啟動Spike **253ms**。存檔first／restart的Ribbits為261／267ms。這些是不同啟動窗口的觀察，不作整體效能百分比或完整watchdog驗收。

紀錄 `private-operation-record`；reviewed SHA `0181b52f8fd0f948502517c664a633ee62914064163de3a0dffe852d2c9d1938`，raw SHA `36f86ac26f9394010a2d9618dcd7a13e06c351a510f494cc0697a3e733a0cd61`。政策installed／deferred_client_acceptance綁同reviewed SHA。玩家記錄（數量未公開）及容器（數量未公開）保留；冰櫃樣本（數量未公開），不當非空投料驗收。首次錯誤CI引用設定在停服前被拒，原失敗紀錄保留；修正設定後使用同一不可變包內容，未改寫失敗或原收據。

六個公開自有BP／RP共9346檔與前次已匿名核對的輸出逐檔相等，本次完整LIVE讀回亦通過；沿用[15:03:22公開下載證據](PUBLIC-DOWNLOAD-LIVE-TRANSPORT-CPU-20261013.md)，本輪没有重新下載或發行T／G／W。

作者原包最新版身份與歷史編輯者仍未核實。真人自然生成、connection、互動、聲畫、HUD快開及完整Java一比一仍未驗收。一次停服副本的載入／重啟不替代這些場景。
