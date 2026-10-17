# T147／G128／W124 公開測試版準備

本頁記錄 2026-10-12 的發版準備狀態：新家族為酒館 **0.6.147**、燒烤 **2.8.128**、
世界名酒 **0.1.124**；此時原 LIVE 仍是 T146／G125／W123。
合併來源、公開下載、完整家族驗證、實際安裝與真人驗收分別記錄；本頁不是部署收據。
後續真正的部署狀態見 [家族現況](../family/BASELINE-STATUS.md)。

公開酒館 mcaddon 只封裝 canonical BP／RP。完整家族組裝使用同一份自有 runtime，
不在本地 builder、翻譯或安裝階段加入另一套玩法。公開檔案與正式安裝檔案的逐檔相等，
仍須由本輪 archive 和完整部署讀回核對。私有料理整合與第三方 host 變體不冒充公開自有包。

## 本次自有來源

| 包 | 已合併 runtime 來源 | 變更範圍 |
| --- | --- | --- |
| 酒館 T147 | [T331](https://github.com/casama233/kaleidoscope-tavern-unofficial/pull/331)，`b0e5351e33ad2d4cde2aeeca91f540b67267a69d` | HUD 可見期限由 100 ms 改為 200 ms；50 ms 有界游標插值、玩法時鐘與配方保持原狀。 |
| 燒烤 G128 | [G193](https://github.com/casama233/kaleidoscope-grilling-unofficial/pull/193)、[G194](https://github.com/casama233/kaleidoscope-grilling-unofficial/pull/194)，`ff452251cf62632d88b17237b6ea9e4fa49c4c83` | 保留既有動畫／Atlas 修補；正規辨識並更新唯一 Uses lore、保留 Ingredients／自訂 lore，移除 Numb stop 的空 bones map。 |
| 世界名酒 W124 | [W106](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/pull/106)，`63d6f5c11ffe6e3c5579212a51314c24466c49a8` | 包／模組／payload 身份與兩側相依精確配對 T147；玩法、三語指南與作者資源保持原狀。 |

酒館封包為 `Kaleidoscope_Tavern_Unofficial_0.6.147_baseline1.mcaddon`，
已成功 [T147 CI](https://github.com/casama233/kaleidoscope-tavern-unofficial/actions/runs/38125105783) 的 archive SHA256 為
`013295193c5879de20c59ed4ed7aaedab189cd250255159e7c05c091abb8952f`。
發佈流程仍驗 source／baseline、完整 ZIP 文件及上傳後讀回；發佈的 `SOURCE_COMMIT`
記錄實際 publication commit。新 request 預設不自動公開，維護者明確手動啟用後才發布。

## 驗證範圍

[原始 T147 診斷與準備紀錄](RELEASE-NOTES-0.6.147.md) 保持原文和證據身份。
HUD100 的自然／快速切換失敗沒有改寫成成功；HUD200 的有限錄影支持連續可見改善，
不證明根因已修復、精確釋放延遲、所有裝置／尺度、多人或完整家族真人驗收。
Uses 的原生觀察屬於原 G125 診斷；Numb 的新正式身份仍需原生觸發／消退核對。
這些觀察不能合併成新 T147／G128／W124 的完整驗收。

完整家族仍須本輪來源 CI、相依／static、停服一致備份與一次存檔副本 first/restart、准入及
正常啟動讀回。真人完整驗收保持 pending，`client=false`、`production_ready=false`。
不建立模擬玩家，也不把 archive 相同或 BDS 載入成功當作畫面／玩法已驗收。

## 公開的 Cookery API 組裝

Grilling G128 保留已核驗作者 **Cookery 1.6.0** 與公開 family API **0.2.10**。
砧板、油壺、炒鍋、出料資料和指南交接的 host 呼叫點不是乾淨作者 Cookery 自帶的功能。
它們由 Grilling 已提交的 `host-extensions/board-api.json` 登記原檔／改後 hash，
並把其版本化自有 module 複製到 hash 釘選的 Cookery；不透過 `addon_localizations` 隱藏修補。

現有公開組裝器可在**不提供私有 integration**的情況下復現這份 Cookery API：
取得本發布 `SOURCE_COMMIT` 的 Tavern checkout，配對上表 G128／W124 checkout，
並提供 [family lock](../family/upstream.lock.json) 釘選的五個官方原包，在 Tavern 目錄執行：

```sh
python3 tools/family_bundle.py build \
  --tavern . \
  --grilling ../kaleidoscope-grilling-unofficial \
  --world-liquor ../kaleidoscope-world-liquor-unofficial \
  --archives /path/to/pinned-official-archives \
  --output /path/to/new-public-family
```

此入口核對 clean committed baseline、原包與 exact dependencies，輸出 static candidate。
沒有 `--extension` 就不加入私有料理整合、國味恢復／冰櫃／人偶變體或 AMW 整合；
此候選也不等於現服完整 42 包組合，不取得本服部署准入或真人驗收。
只安裝自有 mcaddon 加乾淨作者 Cookery，不會自動執行這些已登記 host 轉換。

## 作者新版待適配

2026-10-11 **17:22:53 UTC** 已重新用官方 API 核對四個新版的身份和 download URL，
HEAD 均返回 **HTTP 200**：Cookery1.6.1（CF9123386）、ChineseFood1.0.5（CF9123382）、
Nether1.0.2（CF9123379）、End1.0.2（CF9123371）。先前 404 是早先查核結果，不能沿用為目前不可取得。
隨後本輪已取得四份官方原包，並按官方 API 的 SHA1／MD5 核對下載身份。
原包初審發現四個 BP／RP pair 的 UUID 全部重新生成；Cookery1.6.1 為
BP `d0ca7a68-2877-4bd5-bc82-6c7b325cccf2`／RP `c9df2982-d72e-4bbf-a72c-b77de4ea915b`。
新原包的 API／相依、現有 host preimage／修補及動態資料所有權保存適配仍待審查。
它們不納入本輪已凍結候選，不直接替換身份或自動安裝單包，作者 pins 保持已核驗版本。
當前維持 Cookery1.6.0、ChineseFood1.0.4、ImmersiveEating1.1.0、Nether／End1.0.1 的已核驗來源。
Java 各 Minecraft／loader 分支繼續分開追蹤，完整 Java 對等與 W26.1.2 分支適配未宣稱完成。
