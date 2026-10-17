# 世界名酒 Java 26.1.2 分支：1.1.6 來源與適配差距

2026-10-07T10:28:04Z 直接查核 CurseForge 官方 API：專案1502365仍由
ChenjdyUltra（138592347）及 bf_meow（115933823）發布，作者身份沒有漂移。
[新版1.1.6／9087098](https://www.curseforge.com/minecraft/mc-mods/kaleidoscope-world-liquor/files/9087098)
於2026-10-07T06:54:58.387Z發布；同分支前版為
[1.1.3／8820767](https://www.curseforge.com/minecraft/mc-mods/kaleidoscope-world-liquor/files/8820767)。
作者沒有提供這兩版的 changelog，因此此審查直接比較公開原包內容。

這是 **Minecraft 26.1.2／NeoForge 的獨立分支**。目前維護的1.21.1來源仍是
世界名酒1.1.11／9066406及酒館1.2.0／8350856，沒有因本文件替換。
26.1.2新版保留 `new_release_requires_adaptation`，沒有完成移植或真人驗收。

原包的Minecraft26.1.2、NeoForge>=26.1.2.71、酒館>=1.1.2相依不變。
JAR metadata 宣告的license由 `MIT + CC BY-NC-SA 4.0` 改為 `CC BY-NC-ND 4.0`；
此處記錄來源差異，沒有由作者身份或metadata推定修改、散布程式／資源的權限。
本倉庫只保存自有來源摘要與差距資料，不包含作者原JAR、完整反編譯程式、
機器記錄、本機證據路徑、世界或玩家資料。

逐項內容比較得到807→831個檔案：55新增、31刪除、73改變、703相同。
配方檔67→68，飲品效果檔19→19，改變的飲品效果資料只有獺祭；六個原聲OGG不變。
13張可對位目前資源包路徑的圖像中，8張解碼後像素相同、5張不同。
內容或像素匹配不代表模型、渲染、互動或客戶端完整相同。

完整的13項來源與適配ID在
[來源差距資料](../family/world-liquor-26.1.2-1.1.6-review.json)。
每項均保留原包member位置、分支差異、對目前1.21.1的影響與未完成狀態。

| 適配ID尾碼 | 新版26.1.2可確認的差異 | 目前1.21.1的處理 |
|---|---|---|
| SOURCE | 發布身份及license metadata更新；依賴不變。 | 保留來源與分支，未推定散布授權。 |
| LUCK | 自有luck替代registered bonemeal_spreader；獺祭Q3–Q6改自有效果。每級25%重抽原loot，最多5次，只加入未出現的item type。 | 不替代1.21.1的vanilla Luck。 |
| LOOT | 方塊宝藏效果複製本次BlockDropsEvent實際掉落。 | 1.21.1依原作獨立Block.getDrops，保留目前重抽適配。 |
| RECIPE | 新湯力水；可樂限定water potion；冷凍岩漿改黑曜石1，取代岩漿塊3；改原生milk。 | 湯力水等已在1.21.1，另一分支的配方數量／fluid變更不直接套入。 |
| DRINK | Consumable音效初始化、瓶裝調料容器流程；32tick使用，可樂／湯力水效果300tick。 | 目前飲用float與單件容器修補的1.21.1依據仍有效；26的引擎節拍未驗證。 |
| MOTION | 船速、逆重力各phase及逆重力下multi-jump判定修正。 | 多數與已有1.21.1作者邏輯對齊；玩家原生碰撞及畫面仍未驗收。 |
| BEHEADING | 遞迴保護、取消原傷害、10000hurt與拒傷fallback、防重複掉頭。 | 1.21.1已有原作流程；移植的因果掉落及fallback仍待完整修復。 |
| STORAGE | 酒櫃transfer handler、每格1件與single全櫃；比較器single3／普通0–2。 | 保留原生存物及遷移修補，另查自動化與多人互動。 |
| FREEZER | 原生milk、MaxOutputCount保存與渲染比率、方向shape、可組合tap及Jade顯示。 | 另做26的fluid／保存／碰撞／視覺適配。 |
| SEAT | 16凳子接宿主SitEntity、height0.9、朝向／佔位／破壞清理與含水。 | 核對現有座位及水保持，不換Java entity身份。 |
| BREW | 加速附魔升一級、上限6、2400tick冷卻、主手限制及operator命令。 | 1.21.1已有來源；基岩附魔與命令對等仍未完成。 |
| ART | cocktail模型／紋理、luck icon、創造分類filter與寶藏server/client渲染變更。 | 26紋理差異不能直接判定1.21.1素材過時，保留逐項畫面驗收。 |
| RECORD | 唱片比較器5→6，九酒配方不變。 | 先核對1.21.1來源，分開處理紅石行為。 |

26.1.2兩版均未註冊crazy、respawn、double_damage、explosion、level_boost、
continuous_heal、creative_flight。刪除舊包裡未註冊的閒置class，不能寫成目前
1.21.1刪除功能，也不能據此縮減完整移植目標。

本次只完成來源審查與差距登記。沒有執行Java26／BDS／存檔遷移或真人場景，
沒有改runtime、版號、家族基線鎖或安裝任何包；完整26.1.2適配仍需按家族流程完成。
