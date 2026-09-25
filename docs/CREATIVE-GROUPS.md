# 創造欄：裝飾與家具分組

## 能力與範圍

使用官方 `BP/item_catalog/crafting_item_catalog.json` 的原生可摺疊群組，不改 JSON UI，也不新增頂層分頁或「群組裡面再放群組」。同一 category 內相同名稱的群組由遊戲合併。世界名酒沿用酒館的群組識別；只追加自己的物品，不複製另一套家具分類器。

官方文件：https://learn.microsoft.com/en-us/minecraft/creator/documents/craftingitemcatalogdocumentation?view=minecraft-bedrock-stable

原版 Java 酒館在 `ModCreativeTabs.java` 分為主要內容與裝飾兩頁，裝飾頁明確按燈串、沙發、吧椅、招牌、掛畫、香薰順序排列；並非任由英文 ID 混排。
參考：KaleidoscopeMods/KaleidoscopeTavern，`c4ec1880bd44cf3139d3ba744ab30bb379cf1416`，`src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/init/ModCreativeTabs.java`。
世界名酒的 pinned Java 語言資源具有一般／家具兩個頁籤名稱；未取得其創造欄 Java 類別，故不宣稱已核對其完整展示順序。

## 新群組（本體／附屬／合計）

| 分組 | 酒館 | 世界名酒 | 合計 |
|---|---:|---:|---:|
| 酒櫃 | 3 | 10 | 13 |
| 酒架與杯架 | 4 | 0 | 4 |
| 桌子與吧檯 | 2 | 0 | 2 |
| 沙發 | 16 | 0 | 16 |
| 吧椅 | 16 | 16 | 32 |
| 燈串 | 17 | 0 | 17 |
| 吊燈 | 3 | 0 | 3 |
| 招牌與黑板 | 15 | 0 | 15 |
| 掛畫 | 14 | 8 | 22 |
| 香薰 | 8 | 0 | 8 |
| 梯子與雜項家具 | 1 | 0 | 1 |
| 唱片 | 0 | 1 | 1 |

以上保留在原本 `equipment` 大分類；每組可獨立展開。世界名酒的冰櫃加入現有釀造設備組，野生葡萄藤改到 `nature` 的栽培組。
共整理原本裝飾／儲存相關 136 個可見 ID（134 個在新群組，另 2 個移入既有群組）。創造欄总數不變：酒館 160，世界名酒 66。酒品品質、雞尾酒、食物及其他原本群組內容不刪減；`category: none` 或未公開的實作方塊不被翻成可見，低品質酒也沒有重新放進創造欄。

顏色固定按 Java 酒館次序：白、淺灰、灰、黑、棕、紅、橙、黃、淺綠、綠、青、淺藍、藍、紫、洋紅、粉紅；燈串最前另有無色。群組／物品順序由清單明確指定，不使用英文 ID 排序。同名群組合併後，各包內容片段的先後仍受引擎的包載入順序影響；不能據此保證跨包任意交錯排序。

## 維護

唯一共用分類規格在酒館 `tools/creative/groups.json`，兩包只在各自 `data/creative-decoration-groups.json` 宣告所屬物品和順序。名稱有繁中、簡中及英文，世界名酒追加既有群組時不覆蓋其圖示。新群組由擁有圖示的包定義 icon。

```sh
python tavern-src/tools/creative/catalog.py --write
python tavern-src/tools/creative/catalog.py --root world-liquor-src --write
python tavern-src/tools/creative/catalog.py --peer world-liquor-src
LIQUOR_SOURCE=/absolute/path/world-liquor-src python tavern-src/tools/creative/test_catalog.py
```

兩包既有 release 檢查已接入只讀校驗，世界名酒 `build_port.py` 的最後一步重新套用共用分類。未知或漏登記的裝飾項目會要求修訂清單，不再悄悄落進混合裝飾籃。

舊 motion/storage 基準雜湊沒有更新或移除。`data/creative-legacy-menus.json` 只列這次變更前的 menu 欄位；測試用投影先驗證現行分類與計畫一致，再還原舊 menu 後檢查既有整檔／整樹基準。元件、貼圖、模型、配方等任何其他變更仍會使驗證失敗。投影不會寫入遊戲資源。

## 驗證邊界

新增 28 項資料測試：分組數量、色序、跨包同組、圖示解析、本地化、項目不漏不重複、隱藏方塊、生成冪等、舊基準保留，以及意外修改玩法仍被檢出。不是創造欄渲染模擬。既有 55 項 foundation 與 27 項效果條回歸仍須通過。

未執行 Minecraft 客戶端／BDS。實機需確認：空搜尋時各組摺疊／展開、鍵鼠和觸控、三種語言、搜尋單件物品、可合成配方書，以及兩包一起啟用時吧椅／酒櫃／掛畫確實合併。搜尋模式可能按引擎既定方式平鋪結果；這不是自訂 UI。

本批不改版本、manifest、UUID、物品 ID、玩法腳本、配方或 Release 請求；工作分支改動不表示已合併 main 或發布成品。
