# 森羅物語：酒館（非官方）

Minecraft 基岩版非官方移植，作為 [森羅物語廚房基岩移植版（Kaleidoscope Cookery (Unofficial)）](https://www.curseforge.com/minecraft-bedrock/addons/kaleidoscope-cookery-unofficial) 的附屬使用。

目前為 **0.6.42-beta.1 公開測試版**。PBR、特調雞尾酒圖示與微醺視覺修正已整合到酒館本體的完整 BP／RP，不需要另外疊加視覺補丁。玩法、模型及素材以 Java 原作為依據；本專案未代表原作者、廚房移植作者、Mojang 或 Microsoft。

0.6.42 移除酒館的 title/subtitle 資料傳輸與閒置 `ktmix:off` 迴圈，圖形 HUD 改為有限壽命的独立 actionbar factory，使用固定圖片路徑。這修掉酒館自身的跨包干擾，不宣稱所有 A Magic Way 缺圖或無 identifier 的 registry 錯誤已實機解決。

本版保留酒杯取回、有限香薰發射器、第三人稱雪克杯與世界名酒實物指南；世界名酒沿用 0.1.5-preview.1 配套。

0.6.40 的莫洛托夫瓶底旋轉原點、窖藏櫃重複俯仰及西瓜汁收納修正完整保留，詳見 [酒架修復與驗證](docs/STORAGE-REPAIR-0.6.40.md)。0.6.41 的微醺去震動、第三人稱握持下移、酒桶方塊原料 FIXED 縮放與全部 160 份合成解鎖資料也未改動。

## 內容

葡萄種植與壓榨、酒桶釀造與熟成、酒瓶擺放和收納、雪克杯調酒、依材料混色的特調雞尾酒，以及吧檯、座椅、燈具、香薰、掛畫與可編輯告示牌。

圖鑑沿用廚房本體的指南：同一物品的合成與使用放在同一頁，酒款的配方與品質效果合併查閱，減少重複條目和中間選單。

## 安裝

1. 使用 Minecraft 基岩版 **26.50 或更新版**。
2. 另外安裝上述 CurseForge 頁面的 **Kaleidoscope Cookery (Unofficial) 1.0.6**。
3. 備份世界並離開世界後匯入酒館 `.mcaddon`；啟用對應的 0.6.42 BP 與 RP，兩者均置於廚房對應包上方，不要同時啟用舊版酒館。
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

詳見 [版本說明](docs/RELEASE-NOTES-0.6.42.md)、[驗收狀態](docs/RELEASE-READINESS.md)、[原作與素材署名](CREDITS.md)。代碼、美術及第三方字型分別依各自條款。本版以靜態檢查驗證；既有 BDS 1.26.51.1 載入紀錄屬於 0.6.37，不代表本版已通過 BDS 或客戶端實測。微醺會輕微影響瞄準，不是 Java 純鏡頭 roll；可用 `/function kt_tipsy_motion_off` 個人停用。

## 語言與下載

英文、簡體中文、繁體中文各有 1,685 個語言鍵。告示牌編輯跟隨遊戲語言，圖鑑名稱與分類跟隨廚房語言；操作文字因 Cookery 1.0.6 欄位限制使用完整繁中＋英文回退。日文及俄文保留部分舊翻譯，未列為完整支援。

[下載 0.6.42-beta.1 完整酒館套件](https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/download/v0.6.42-beta.1/Kaleidoscope_Tavern_Unofficial_0.6.42_beta1.mcaddon) · [GitHub Release 與驗證報告](https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/tag/v0.6.42-beta.1)。
