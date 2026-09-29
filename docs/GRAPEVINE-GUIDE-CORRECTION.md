# 葡萄藤指南更正

核對 luosen 現用配方：沒有輸出葡萄藤的合成配方；trellis.json 為三個葡萄藤直排，輸出八個藤架。
野生葡萄藤破壞由 cultivation.js 的 farmBreak 回收葡萄藤。生成條件為 forest / plains / meadow biome tags、橡樹或白樺樹葉下方。
剪刀修剪已種植葡萄藤會掉落藤蔓，裸藤架留在原地。
已更正繁中、簡中、英文指南，沒有新增配方或改動遊戲機制。指南契約檢查通過。

## 自然生成實測（2026-09-27）

Java 權威來源 c4ec1880bd44cf3139d3ba744ab30bb379cf1416 的生成配方中沒有葡萄藤輸出；ShapedRecipeProvider.java 的藤架配方為 3 → 8。

使用 BDS 1.26.51.1 隔離存檔、Tavern 0.6.63 與 Cookery 1.0.6，生成森林附近 64 個新區塊（x/z 11904..12031），沒有指令放置葡萄藤或模擬玩家。三份野生葡萄藤 feature / rule 檔案與 luosen 現用 BP 位元組一致。

唯讀掃描 y=48..180 找到 16076 個橡樹／白樺樹葉方塊及 18 個野生葡萄藤方塊（含生長後的藤身，不代表 18 株）。例如 (11991,70,11980) 為 wild_grapevine。這證明現行生成設定可以在原生 BDS 新地形中實際產生葡萄藤；未替 luosen 尋找實際位置，亦未覆蓋 luosen 全套其他插件的相容性。旧區塊不會因安裝規則自動補生成。

原生紀錄：/root/bsm-repair-20260927/grape-guide/natural-generation.log
探測腳本：/root/bsm-repair-20260927/grape-guide/natural-probe.js
此次未重啟或修改 luosen；指南修正仍待安排套用。
