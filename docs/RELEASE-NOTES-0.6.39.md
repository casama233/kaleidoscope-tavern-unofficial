# 酒館 0.6.39 beta 1 — 香薰、雪克杯與指南修復

2026-09-25。以已發布的 0.6.38-beta.1 主分支 `1b9b46a98d3be2efef19715226eb90252ab2c2bb` 為基線，整合先前針對 `1446518661ee36d9b4f3eaa4008291642821c9c0` 製作的取酒、香薰、第三人稱與指南補丁。保留已發布版本的 PBR、完整特調圖示和微醺修正，不以舊安裝包覆寫來源。

## 本次變更

- 香薰改為杯口小粒子＋開啟後的環境粒子。八款香薰各有一秒有限發射器；伺服器只派發發射器，不逐粒發送。櫻花使用花瓣，孢子使用孢子，蝴蝶保留三幀，螢火蟲保留閃爍與自發光。參照 Java 來源恢復粒子角色、範圍、主要壽命；發射頻率及部分運動是基岩適配，不宣稱完全一致。
- 雪克杯只調整第三人稱握持的旋轉、位置與縮放。第一人稱持杯及搖動資料、共用手持模型、骨骼綁定未修改。實際手掌位置仍待客戶端確認。
- 缺少腳本紀錄的已放置雞尾酒杯可由其精確方塊種類還原；新增原生放置及舊杯恢復路徑。右鍵取回與破壞回收共用同一交易路徑。既有特調配方／色彩／效果保留。若原始特調資料從未保存，無法推回遺失的效果，只能使用原本的預設特調值。已有但損壞／錯配的紀錄不會被悄悄清空。
- 世界名酒 0.1.4 的物品頁按本體分類，釀造、調酒、配方替換選項與成品分開。附屬提供給本體酒款的配方併入該酒款原頁。
- Cookery 1.0.6 的操作文字使用完整繁中＋英文相容回退；名稱、分類仍有三語。既有書與其他章節不被替換。

## 安裝

先備份／複製世界，再匯入此 `.mcaddon`。同時更新本體 BP/RP；使用世界名酒者亦須更新到 0.1.4-preview.1。保留 Cookery 1.0.6 BP/RP。UUID 和既有物品／方塊 ID 保持不變，無需重建世界；同一世界只啟用一組本體及一組世界名酒。

## 驗證界線

本版執行 JSON、JavaScript、資產引用、依賴、多語言、實際配方資料投影與封包檢查，沒有玩家互動模擬；未執行新的 BDS 或遊戲客戶端測試。不能將以前版本的 BDS 結果當作本版已驗收。完整的「附近放置雪克杯時取酒」情境、香薰可見度和第三人稱手掌位置仍待遊戲內驗收。詳見來源中的 `docs/REPAIR-0.6.39.md`、`docs/REPAIR-STATIC-0.6.39.json`。

## English summary

Built on published Tavern 0.6.38-beta.1, preserving its PBR, complete signature icon and Slightly Tipsy changes. Integrates placed-cup recovery, finite Java-inspired incense emitters, third-person-only shaker adjustments, and recipe-driven World Liquor guide support. A fresh version avoids two different packages bearing 0.6.38. Use World Liquor 0.1.4-preview.1 with this release. Validation covers static resources, scripts, recipe projections, dependency consistency and byte-for-byte archive verification. No new BDS/client or simulated-player test was run. Visual fidelity and the full reported interaction scenario remain client acceptance items.
