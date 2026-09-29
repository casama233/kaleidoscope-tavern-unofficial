# 第二批 CI 範圍補充：保留四項未通過的歷史檢查

2026-09-29。本文補充 `FAMILY-COMPAT-BATCH2.md`，不修改候選包、runtime、原生測試工具或既有測試結果。

## 已通過與未通過是兩套證據

提交 `2c08638c7e66d54ea1c6833455c5c752477a6ebd` 的正式唯讀工作流 `36511428098`（Family2 native compatibility checks）成功，`36511428170`（Release package checks）也成功。前述原生整合 `36510726766` 的16項檢查，確實使用真正BDS、0玩家、沒有模擬玩家。

但建立PR #100時，繼承的 `Shared foundation regression` 因 `tools/**` 規則自動觸發，執行了 `mock-loader.mjs` 的模擬測試。這不符合本批原生驗證的範圍，不能說「本輪所有CI都沒有跑過模擬玩家」。它不是本批16項原生驗收的一部分。

此工作流 `36511428120`、job `109224199199` 保持 **failure**：196項中192通過、4項失敗，沒有改寫成成功。其輸入世界名酒固定於舊0.1.7提交 `b6d52c65ca314afc24fb3eaa87eebb7755dce71f`，不是家族候選0.1.28。此事只能說輸入不同，不能據此把所有失敗當成無效或證明新實作沒有缺陷。

## 四項未解決檢查

1. `native potion metadata is restored exactly`：`POTION_DELIVERY_UNSUPPORTED: minecraft:consumable`。
2. `water bottle is real water`：`POTION_TYPE_UNAVAILABLE`。
3. `shared transaction takes one item and returns exact quality`：讀取 undefined 的 `typeId`。
4. `unloaded anchor is retained; confirmed air removes new helper`：`assert(entity.removed)` 未滿足。

本批沒有修改酒館runtime、放寬上述檢查或以假資料讓它们通過。這四項的正式來源／原生驗收仍需另行核對；不能因後續不執行模擬工作流就宣稱它們已修好。

原始TAP和確切輸入提交已下載保存。Artifact `11009083881`，ZIP SHA256 `5353e60c669e73a15d0a337a7ef5612e77ca25028e70b64b2b88ca8f864e457f`。交付包保留於 `native-evidence/history/36511428120-legacy-mock/`；該資料夾是歷史失敗紀錄，不是原生通過證據。

## 後續執行範圍

`foundation-ci.yml` 僅排除明確命名的 batch1/batch2 家族草稿PR，防止繼續自動執行模擬玩家測試；main與其他PR原有行為不變。原生BDS、套件與來源檢查不排除。這是測試範圍修正，不是讓失敗轉綠；保留草稿狀態，不合併、不發公開Release，也不宣稱整套CI或所有兼容性已通過。
