# 0.6.140：補齊完整家族的 AMW 四頁指南

承接 canonical T139 `ada02bfd` 的指南與玩法修補，配對 World Liquor 0.1.117；W117 保留 W116 的重生錨、出生點 metadata 與 Respawn 結算修補。Grilling 維持已核對的 G122，Cookery helper 0.2.9 的 descriptor、作者 patch 與 copied helpers 須整組一致。

本版把完整家族中既有的四個 AMW 條目納入酒館共用指南文案適配：Kirsch、Kriek、酸櫻桃和酸櫻桃汁桶。更正英文名稱與品質別名，分開果實和果汁用途，修正採收後由葉片重新長果再成熟的說明，並保留兩酒實際效果和品質 4 調酒門檻。果實歸種植、果汁歸果汁、兩酒留在附屬釀造。三語文案及兩個入口共用同一投影；AMW 原登記資料、配方、數量、時間、效果、圖示與原包身份不改。來源 hash 見 [指南審修記錄](GUIDE-EDITORIAL.md)。

公開 Tavern／World Liquor 配套維持 223 條目；完整 42 包家族加入這四頁後為 227 條目，均保留七入口和 31 分類。接收測試只允許這四個已核對的 AMW ID，並要求實際 Cookery registry 的三語內容與父子分類完整。

T139 的原料數量／原生 metadata 保存、重啟及回滾、Q4 雪克杯原料、原生光效 lease 和外部所有權邊界、完整 Mob／AABB 選取，以及既有靜默操作、動畫、粒子與 PBR 修補全部保留；詳細範圍與原版證據見 [T139 說明](RELEASE-NOTES-0.6.139.md)。本版沒有重新標記舊候選的成功或失敗證據。

完整 canonical CI、家族 static／BDS、fresh 停服一致備份與存檔演練、准入和 LIVE 部署尚待本次實際結果。保留持續部署授權；目前 `client=false`、`production_ready=false`、`live_deployment=false`。無玩家接收檢查不代表真人排版、按鍵、聲畫或 Java 一比一驗收。
