
## 9. 0.6.39-beta.1（pre-release）

上游改以 GitHub pre-release 發布測試版（`v0.6.39-beta.1`）。本次部署體檢結果：

- 160 個配方 **全部自帶 `unlock`**——0.6.3 時代需要伺服器側補unlock的問題已被上游吸收，伺服器版僅剩相依識別碼改接一項。
- 相依識別碼改接後直接通過管理器安裝與引擎載入（Content Log 0 錯誤）。

## 10. 0.6.41-beta.1

`v0.6.41-beta.1`（微醺去震動、握持與酒桶比例修復）。unlock 全齊、僅需相依改接；注意 release 壓縮檔頂層是 `BP`/`RP` 而非 `behavior_pack`/`resource_pack`。

## 11. 0.6.44-beta.1（與世界名酒 0.1.7 配對）

`v0.6.44-beta.1`（PR 整合、家具與投擲修復）。上游 #89 已在建置流程自行維持 VV manifest 聲明，RP 自帶 `capabilities:["pbr"]`；unlock 160 全齊；伺服器側僅剩相依改接。與 World Liquor 0.1.7 配對安裝（WL 依賴酒館 0.6.44），部署後 Content Log 0 錯誤。

## 12. 0.6.45：指南中英混雜修復（2026-09-25）

現象：酒館指南章節（含世界名酒內容）每條說明「繁中一行＋英文一行」。

根因：`cookery106WirePayload` 為相容公開版 Cookery 1.0.6（其主機會過濾 `mechanicsByLocale` 的大寫區域碼鍵）而把 zh/en 逐行合併成一個雙語 `mechanics` 陣列傳輸。但實際安裝的 Cookery 1.0.7（Family 版）主機**支援** `mechanicsByLocale`（`guidebook.js` 以 `entry.mechanicsByLocale?.[localeCode(player)] || entry.mechanics` 逐玩家解析），雙語合併不僅多餘，正是混雜的直接來源。

修復：`cookery106WirePayload` 改為原樣透傳（保留 `mechanicsByLocale`），`entry.mechanics`（繁中）保留作為不支援主機的後備。BP 0.6.44→0.6.45。另：截圖中「Grapevine」等材料名未翻譯屬上游配方資料缺口，另行回報。

**建議上游**：當主機為 Cookery 1.0.7+（支援 `mechanicsByLocale`）時應直接傳遞本地化目錄；或以主機握手能力協商決定是否使用雙語後備，而不是無條件合併。
