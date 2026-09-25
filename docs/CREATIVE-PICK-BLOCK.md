# 創造模式中鍵拿取修復（配對測試版）

版本：酒館 0.6.43-beta.1／世界名酒 0.1.6-preview.1。

## 行為

同 ID 家具、掛畫、香薰與冰櫃以原生 `minecraft:block_placer.replace_block_item` 註冊正常物品，保留原本的圖示與使用組件。25 個本體、35 個附屬定義修正。原本由腳本放置的同 ID 物品使用 `use_on: [{"tags":"0"}]` 阻止新增原生放置捷徑；既有 Java 式互動路由仍是唯一放置入口。

不同 ID 的內部方塊由酒館單一 `creative-pick.js` 適配器處理：原生拿取產生內部物品後，下一個腳本 tick 轉換為正常物品。使用穩定版 `playerInventoryItemChange`，以及選中快捷槽事件；不是不存在的中鍵／pickBlock API。只處理創造模式、已知內部 ID、目前選中快捷槽，並要求玩家仍瞄準同一個可觸及方塊。不掃描整個背包、不定時覆寫物品、不碰其他命名空間、不改生存掉落。

- 吧椅和燈串保留顏色；雙層酒桶方塊返回空酒桶，雪克杯工作站返回空雪克杯。酒櫃返回空家具，不複製儲存內容。
- 本體及已註冊附屬的酒瓶，讀取同一個 BottleStore，複製最近放入的一瓶，保留 q1–q6；多瓶展示不會複製成一組，也不一律提升到 q6。
- 已放置雞尾酒讀取同一個 CupStore；招牌雞尾酒保留配方、顏色、效果資料。空杯返回可用杯子。
- 水瓶、藥水、蜂蜜、龍息及經驗瓶返回對應原版物品。藥水透過既有 restorePotion 保留種類，不建立空白藥水。
- 附屬壁掛唱片只提供 model state → 唱片 ID 的資料規則；酒館統一執行轉換，不增加附屬的第二套交易／儲存。19 種原版唱片與 6 個自訂唱片外觀均覆蓋。
- 切手、換維度、離開、失去瞄準、內容改變、超出距離或帶額外命名／資料的內部物品不強制覆寫；損壞或缺少酒品資料時拒絕猜測，原方塊與資料保持不動，錯誤記入 `creativePick` 診斷。

## 不變的部分

沒有變更已放置方塊 ID、世界存檔 schema、家具模型、貼圖、配方、投射物或微醺行為。新增三個唯讀複製函式，原有酒瓶／雞尾酒／藥水交易程式的完整舊內容以 SHA256 前綴驗證保留。歷史物品資源檢查只逆向投影明確批准的原生拿取組件與創造分類；其他欄位仍須符合原始基準。

本版同時包含此前 PR 中的共用酒櫃底層、效果條及可摺疊創造分類。升級前備份**完整世界**；使用附屬時需同時更新兩包。共用底層一旦遷移舊資料，不可只降級其中一包。

## 驗證

本地 111 項中鍵適配腳本測試、6 項原生定義及唯讀邊界測試、55 項共用底層測試、27 項效果條測試及28 項創造分類測試通過。GitHub 構建會再次執行檢查並保存實際輸出。兩包的資源與打包檢查另行執行。

**沒有 Minecraft 客戶端／BDS／真玩家中鍵操作驗收。** 模擬事件測試不是引擎回歸證据。特別需驗收原生同 ID 物品替換、腳本專用 `use_on` 限制、快速連按中鍵、已存在同名物品時引擎的快捷槽选择。若來源酒品資料已損壞，本修復不會凭空恢復它。

## 實機驗收

在世界副本載入兩包；逐一中鍵拿取並再次放置／飲用：本體與附屬吧椅、掛畫、香薰、酒櫃、酒桶上下部、空雪克杯、q1/q3/q6 酒瓶、混合品質瓶組、普通和招牌雞尾酒、水及不同原版藥水、壁掛唱片。確認原方塊不消失、儲存內容未複製，並測試快捷欄已滿、快速切手、多人同時取放。生存模式不應受到中鍵適配器影響。

## 官方依據

- https://learn.microsoft.com/en-us/minecraft/creator/reference/content/itemreference/examples/itemcomponents/minecraft_block_placer?view=minecraft-bedrock-stable
- https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/playerinventoryitemchangeafterevent?view=minecraft-bedrock-stable
- https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/playerhotbarselectedslotchangeafterevent?view=minecraft-bedrock-stable
