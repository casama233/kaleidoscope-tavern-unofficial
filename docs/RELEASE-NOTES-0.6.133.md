# 0.6.133：雪克杯原生保存位置比較

已放置的命名雪克杯可能在第一瓶水加入前報 `NATIVE_STORAGE_MISMATCH`：保存位置為 `{x,y,z}`，Bedrock `block.location` 卻以 `{z,y,x}` 列舉相同座標。原來的 JSON 字串比較把它們判為不同位置，阻止後續加料。

本版在 [PR297](https://github.com/casama233/kaleidoscope-tavern-unofficial/pull/297) 的精確來源 `291212f58783b8a05a51fd5ac4792ccb000dc5d0` 上，只將位置身份改為三個有限數值 XYZ 的嚴格逐軸比較。材料槽 IDs 仍按原順序核對；required/schema/key/dimension、owner/token、實體位置、容器及數量守衛、交易均保留，包含 T132 新增的獨立清理及回滾步驟。不含診斷 probe，也沒有重建或改寫既有世界資料。

## 證據與驗證範圍

- T130 的一次隔離真人操作後，診斷讀回的五項其他頭條件為 true、position 為 false；兩邊 XYZ 相同、鍵序相反，且輸出未截斷。原錯誤仍拋出，正常保存後水與保存內容不變。這是失敗後讀回，並非原判斷的原子快照。
- 回歸直接執行 production storage 與 shaker 加料／取回程式，覆蓋反序位置、命名 carrier、Water Bottle 身份與玻璃瓶返還、非法座標／有序槽位拒絕及失敗回滾。新增測試在未修原碼上重現拒絕，在修復後通過；它們是 API doubles，不是客戶端驗收。
- 對此 T133 來源重新執行既有 pickup/inventory 及 native storage pinning、shaker/offhand 套件。完整必要檢查由此 PR 的精確來源 CI 執行，不能沿用 T132 或早期本機候選的結果。

本版是依賴 PR297 的獨立 Tavern 測試候選，先以其分支為 PR base。T132／World Liquor 0.1.109／Grilling 2.8.119 的既有家族鎖及固定 CI peer 保持原樣。本次沒有更新對方分支、部署或認證完整家族；基礎 PR 的 CI 問題仍由基礎來源解決，不將缺陷誤列為已通過。

T133 的隔離真人加水、取回／重放及保存重啟驗收仍待完成，`client_visual_acceptance` 保持 pending。先前未發布、與並行來源撞號的本機 T132 候選不作為本版測試或發布產物。
