# 森羅物語：酒館（非官方）

Minecraft 基岩版非官方移植，作為 [森羅物語廚房基岩移植版（Kaleidoscope Cookery (Unofficial)）](https://www.curseforge.com/minecraft-bedrock/addons/kaleidoscope-cookery-unofficial) 的附屬使用。

目前為 **0.6.39-beta.1 公開測試版**。PBR、特調雞尾酒圖示與微醺視覺修正已整合到酒館本體的完整 BP／RP，不需要另外疊加視覺補丁。玩法、模型及素材以 Java 原作為依據；本專案未代表原作者、廚房移植作者、Mojang 或 Microsoft。

本版另外整合酒杯取回、有限香薰發射器、第三人稱雪克杯修正候選值及世界名酒實物指南；世界名酒請同步更新至 0.1.4-preview.1。

## 內容

葡萄種植與壓榨、酒桶釀造與熟成、酒瓶擺放和收納、雪克杯調酒、依材料混色的特調雞尾酒，以及吧檯、座椅、燈具、香薰、掛畫與可編輯告示牌。

圖鑑沿用廚房本體的指南：同一物品的合成與使用放在同一頁，酒款的配方與品質效果合併查閱，減少重複條目和中間選單。

## 安裝

1. 使用 Minecraft 基岩版 **26.50 或更新版**。
2. 另外安裝上述 CurseForge 頁面的 **Kaleidoscope Cookery (Unofficial) 1.0.6**。
3. 備份世界並離開世界後匯入酒館 `.mcaddon`；啟用對應的 0.6.39 BP 與 RP，兩者均置於廚房對應包上方，不要同時啟用舊版酒館。
4. 進入世界後，使用廚房指南查看酒館章節。微醺需要開啟遊戲設定中的「允許鏡頭晃動」。

目前公開測試版未以 Realms 或所有手機機型完成驗收。舊正式服整合包使用本地修改的廚房 UUID／1.0.7；升級前請看 [安裝與遷移說明](docs/INSTALLATION.md)。

## 原始碼與打包

需要 Python 3.12+、Node.js 22+，以及影像檢查套件 Pillow 11.3.0。

```sh
python3 -m pip install Pillow==11.3.0
python3 tools/check_release.py
python3 tools/build_release.py
```

結果在 `dist/`。當前 `runtime/` 即實際打包來源；不再從舊提交、伺服器補丁和工作區覆蓋檔拼出成品。舊工具與階段紀錄已歸檔。GitHub 發布工作流程只在主分支明確更新 `.github/release-request.json` 或手動啟動時執行；發布前檢查固定版本、成品雜湊和上傳後的逐檔內容，不覆蓋既有 Release。

## 發布狀態與授權

詳見 [版本說明](docs/RELEASE-NOTES-0.6.39.md)、[驗收狀態](docs/RELEASE-READINESS.md)、[原作與素材署名](CREDITS.md)。代碼與美術使用不同授權，字型另依各自的第三方條款。0.6.39 以靜態檢查驗證；既有 BDS 1.26.51.1 載入紀錄屬於 0.6.37，不代表本版已通過 BDS 或客戶端實測。微醺採基岩版旋轉晃動近似，並非 Java 原作的平滑 roll 完全復刻。

## 語言與下載

支援英文、簡體中文、繁體中文，每種語言均有 1,685 個語言鍵。告示牌編輯介面跟隨遊戲語言，圖鑑名稱與分類跟隨廚房本體的語言選項；操作文字因 Cookery 1.0.6 的欄位限制，使用完整繁中＋英文回退。日文及俄文保留部分舊翻譯，未列為完整支援。

[下載 0.6.39-beta.1 完整酒館套件](https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/download/v0.6.39-beta.1/Kaleidoscope_Tavern_Unofficial_0.6.39_beta1.mcaddon) · [GitHub Release 與驗證報告](https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/tag/v0.6.39-beta.1)。
