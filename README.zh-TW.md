# 森羅物語：酒館（非官方）

Minecraft 基岩版非官方移植，作為 [森羅物語廚房基岩移植版（Kaleidoscope Cookery (Unofficial)）](https://www.curseforge.com/minecraft-bedrock/addons/kaleidoscope-cookery-unofficial) 的附屬使用。

目前為 **0.6.37-beta.1 公開測試版**。玩法、模型及素材以 Java 原作為依據；本專案未代表原作者、廚房移植作者、Mojang 或 Microsoft。

## 內容

葡萄種植與壓榨、酒桶釀造與熟成、酒瓶擺放和收納、雪克杯調酒、依材料混色的特調雞尾酒，以及吧檯、座椅、燈具、香薰、掛畫與可編輯告示牌。

圖鑑沿用廚房本體的指南：同一物品的合成與使用放在同一頁，酒款的配方與品質效果合併查閱，減少重複條目和中間選單。

## 安裝

1. 使用 Minecraft 基岩版 **26.50 或更新版**。
2. 另外安裝上述 CurseForge 頁面的 **Kaleidoscope Cookery (Unofficial) 1.0.6**。
3. 匯入酒館 `.mcaddon`，在世界啟用 BP 與 RP，兩者均置於廚房對應包上方。
4. 進入世界後，使用廚房指南查看酒館章節。

目前公開測試版未以 Realms 或所有手機機型完成驗收。舊正式服整合包使用本地修改的廚房 UUID／1.0.7；升級前請看 [安裝與遷移說明](docs/INSTALLATION.md)。

## 原始碼與打包

需要 Python 3.12+、Node.js 22+；無額外套件依賴。

```sh
python3 tools/check_release.py
python3 tools/build_release.py
```

結果在 `dist/`。當前 `runtime/` 即實際打包來源；不再從舊提交、伺服器補丁和工作區覆蓋檔拼出成品。舊工具與階段紀錄已歸檔。

## 發布狀態與授權

詳見 [版本說明](docs/RELEASE-NOTES-0.6.37.md)、[驗收狀態](docs/RELEASE-READINESS.md)、[原作與素材署名](CREDITS.md)。代碼與美術使用不同授權，字型另依各自的第三方條款。已完成靜態資源、腳本、多語言檢查及 BDS 1.26.51.1 載入檢查；Android 實際畫面與各裝置相容性仍由公開測試收集回饋。

## 語言與下載

支援英文、簡體中文、繁體中文，每種語言均有 1,658 個語言鍵。告示牌編輯介面跟隨遊戲語言，圖鑑跟隨廚房本體的語言選項。日文及俄文保留部分舊翻譯，未列為完整支援。

[下載 0.6.37-beta.1 公開測試包](https://raw.githubusercontent.com/casama233/kaleidoscope-tavern-unofficial/v0.6.37-beta.1/downloads/Kaleidoscope_Tavern_Unofficial_0.6.37_beta1.mcaddon)。
