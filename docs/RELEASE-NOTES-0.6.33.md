# 森羅物語：酒館（非官方）0.6.33-beta.1

首個公開測試包 / First public beta

## 安裝 / Installation

- Minecraft Bedrock **26.50+**；載入檢查版本為 BDS **1.26.51.1**。
- 需另外安裝 [Kaleidoscope Cookery (Unofficial) **1.0.6**](https://www.curseforge.com/minecraft-bedrock/addons/kaleidoscope-cookery-unofficial)。
- 匯入 `.mcaddon`，啟用 BP、RP，將酒館置於廚房對應包上方。
- Install Cookery 1.0.6 separately, import the `.mcaddon`, and enable both Tavern packs above Cookery.

## 本次整理 / Changes

- 英文、簡中、繁中各 1,655 個語言鍵；補齊繁中缺漏、14 個創造欄方塊名稱別名及英文圖鑑殘留中文。
- 告示牌編輯介面直接跟隨遊戲語言；圖鑑沿用廚房本體語言選項，合成與使用合併同一條目。
- 告示牌字形改用附授權的 GNU Unifont，保留現有文字定位；字型與素材署名隨包附上。
- 包含先前的特調雞尾酒混色與材質、雪克杯、Java 動畫與音效修正。
- 酒桶提示為經驗欄上方單行文字，以 `  丨  ` 分隔，取消外框滾動效果。
- 支援靈動視效相容宣告；能否開啟仍取決於裝置、伺服器設定及其他啟用的資源包。

English, Simplified Chinese and Traditional Chinese have matching language keys and guide coverage. Board editing now uses the game language. Crafting and usage share one guide entry. This beta includes the signature cocktail rendering/color, shaker, Java visual effects, compact barrel tooltip and PBR compatibility work. Japanese and Russian translations remain partial.

## 驗證範圍 / Verification

靜態資源、腳本、翻譯與圖鑑資料檢查，以及真實 BDS 啟動載入檢查。沒有模擬玩家互動；BDS 載入不代表 Android 渲染或靈動視效已完成實機驗收。Realms、所有裝置及任意模組組合尚未驗證。微醺、草叢隱匿、延伸觸及三個自訂效果尚未提供。

Static resource/script/translation checks and a real BDS startup were used. No simulated player interactions were run. Client rendering, Realms and arbitrary add-on combinations remain public-test targets. Slightly Tipsy, Grass Stealth and Long Reach are not implemented.

請回報遊戲版本、裝置、啟用包清單、重現步驟、截圖及 Content Log：
[GitHub Issues](https://github.com/casama233/kaleidoscope-tavern-unofficial/issues)
