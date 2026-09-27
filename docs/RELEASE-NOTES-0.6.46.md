# 0.6.46-beta.1 — 回歸整理

配對 World Liquor 0.1.9-preview.1。維持原有物品 ID、包 UUID、配方及世界資料格式。

- 香薰：8 種近處／環境粒子改為朝向觀察者的 billboard，避免固定平面在側面幾乎不可見。近處煙霧每秒 20/3 個；開啟後的環境粒子每秒 48 個，保留 Java 的範圍、素材、速度及種類差異。每個發射器只發射一秒；40 格內無玩家時不傳送視覺封包，亡靈效果維持原來週期。環境密度是有上限的 Bedrock 適配，不聲稱等同 Java 隨機 animateTick 頻率。
- 指南：酒館與附屬共用酒桶／雪克杯操作說明。傳輸時完整整理為最多 8 段、每段最多 512 字，防止森羅本體截掉原料、使用方法和高品質效果。保留英／簡／繁三種語言且不修改原始目錄；現代接口按玩家語言顯示，舊 1.0.6 接口使用完整雙語後備。UTF-8 封包按位元組上限分割，不拆 Unicode 字元；合併圖鑑不超過 512 包。
- 保留伺服器已有的三種雞尾酒指南圖標與 World Liquor 共用創造分類圖標修正。
- PBR：433 個表面通過既有完整材質檢查；淘汰會從 unshaded 面誤推導發光的舊生成器入口，統一使用審核過的遮罩。物品圖標與原版效果譯名通過現有檢查。
- 酒杯回收與雪克杯第三人稱：使用者已確認目前版本修好，保留現有模型與動畫，不套用候選變更。

## 驗證界線

只做靜態／資料投影檢查及真正 BDS 載入檢查，不模擬玩家互動。客戶端粒子可見度與微醺鏡頭仍需實機確認；微醺保留現有 yaw 適配，不聲稱已實現 Java 的純鏡頭 roll。

來源：Java `c4ec1880bd44cf3139d3ba744ab30bb379cf1416` 的 IncenseBlock / GlasswareBlock；[Script Event 訊息限制](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/commandsreference/examples/commands/scriptevent?view=minecraft-bedrock-stable)。

本次發佈檢查依要求只執行靜態／資料投影與 BDS 載入；既有模擬互動回呼測試保留在來源中，未納入本次主線發佈流程。
