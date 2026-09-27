# 森羅物語：酒館（非官方）

Minecraft 基岩版非官方移植，作為 [森羅物語廚房基岩移植版（Kaleidoscope Cookery (Unofficial)）](https://www.curseforge.com/minecraft-bedrock/addons/kaleidoscope-cookery-unofficial) 的附屬使用。

目前為 **0.6.52-beta.1 公開測試版**，配對世界名酒 **0.1.15-preview.1**。本次修正輸入模式 API 欄位錯誤，讓本體酒架與附屬酒櫃的共用原生命中分支真正執行。引擎 API 及四方向射線已驗證，東西朝向的玩家實際點擊仍待驗收。

已通過靜態資產、原作資料比對與 BDS 1.26.51.1 實際載入檢查（廚房 1.0.6）。客戶端畫面仍待實機驗收；微醺仍是 yaw 適配，**尚未實現或驗收 Java 純鏡頭 roll**。詳見[回歸整理](docs/REGRESSION-STATUS-2026-09-27.md)。

## 內容

葡萄種植與壓榨、酒桶釀造與熟成、酒瓶擺放和收納、雪克杯調酒、依材料混色的特調雞尾酒，以及吧檯、座椅、燈具、香薰、掛畫與可編輯告示牌。

圖鑑沿用廚房本體的指南：產品條目使用本體原生製作方法頁，機器條目說明操作；家具工作台配方交由原生合成介面顯示。

## 安裝

1. 使用 Minecraft 基岩版 **26.50 或更新版**。
2. 另外安裝上述 CurseForge 頁面的 **Kaleidoscope Cookery (Unofficial) 1.0.6**。
3. 備份世界並離開世界後匯入酒館 `.mcaddon`；啟用對應的 0.6.52 BP 與 RP，兩者均置於廚房對應包上方，不要同時啟用舊版酒館。
4. 進入世界後，使用廚房指南查看酒館章節。微醺採原作三波節奏的小幅水平轉向，不再依賴「允許鏡頭晃動」。

目前公開測試版未以 Realms 或所有手機機型完成驗收。舊正式服整合包使用本地修改的廚房 UUID／1.0.7；升級前請看 [安裝與遷移說明](docs/INSTALLATION.md)。

## 原始碼與打包

需要 Python 3.12+、Node.js 22+，以及影像檢查套件 Pillow 11.3.0。

```sh
python3 -m pip install Pillow==11.3.0
python3 tools/check_release.py
python3 tools/build_release.py
```

結果在 `dist/`。當前 `runtime/` 即實際打包來源；不再從舊提交、伺服器補丁和工作區覆蓋檔拼出成品。GitHub 發布前檢查固定版本、成品雜湊和上傳後的逐檔內容，不覆蓋既有 Release。

## 發布狀態與授權

詳見 [版本說明](docs/RELEASE-NOTES-0.6.52.md)、[驗收狀態](docs/RELEASE-READINESS.md)、[原作與素材署名](CREDITS.md)。代碼、美術及第三方字型分別依各自條款。本版已通過靜態檢查及 BDS 1.26.51.1 載入；未宣稱通過客戶端畫面驗收。微醺會輕微影響瞄準，不是 Java 純鏡頭 roll；可用 `/function kt_tipsy_motion_off` 個人停用。

## 語言與下載

英文、簡體中文、繁體中文各有 1,685 個語言鍵。告示牌編輯跟隨遊戲語言，圖鑑名稱與分類跟隨廚房語言；操作文字因 Cookery 1.0.6 欄位限制使用完整繁中＋英文回退。日文及俄文保留部分舊翻譯，未列為完整支援。

[下載 0.6.52-beta.1 完整酒館套件](https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/download/v0.6.52-beta.1/Kaleidoscope_Tavern_Unofficial_0.6.52_beta1.mcaddon) · [GitHub Release 與驗證報告](https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/tag/v0.6.52-beta.1)。
