# 0.6.39 修復依據與驗收範圍

## 來源

本體來源 commit：`1446518661ee36d9b4f3eaa4008291642821c9c0`。
Java 對照固定於 `KaleidoscopeMods/KaleidoscopeTavern` commit `c4ec1880bd44cf3139d3ba744ab30bb379cf1416`。

- `src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/block/deco/IncenseBlock.java`：小粒子不受開關控制；開啟後每次 animateTick 發出五個環境粒子，水平 32×32，高度範圍 16。這是隨機 display tick，不能直接說成每遊戲 tick 五粒。
- `init/ModBlocks.java`：櫻花用 CHERRY_LEAVES，孢子用 SPORE_BLOSSOM_AIR；螢火蟲使用 -0.67 起點、5.33 高度範圍。
- `client/particle/IncenseParticle.java`：40–59 tick 壽命，上升與末段淡出。
- `IncenseSuspendedParticle.java`／`ButterflyIncenseLargeParticle.java`：500–1000 tick 壽命，蝴蝶三幀、每五 tick 更新。
- `FireflyIncenseLargeParticle.java`：60–99 tick，閃爍、末段淡出及 full-bright。
- `src/main/resources/assets/kaleidoscope_tavern/models/item/shaker_3d.json`：第三人稱 translation [0,-0.25,0]、scale 0.5。基岩插槽座標不同，不能直接照抄 Java 軸向。

Bedrock 粒子資料參照 Mojang/bedrock-samples commit `46ba6ea985fb5a92d79a9419198f10dda14c199d` 的 `resource_pack/particles/cherry_leaves_particle.json` 與 `spore_blossom_ambient_block_actor.json`。使用遊戲已有圖集，不新增重繪圖像。

## 香薰修復

舊腳本每 20 tick 最多發兩個大型粒子，散布大範圍，且較長壽命被縮短。新腳本每秒啟動一個 plume；開啟時再啟動一個 ambient。plume 每秒 2 粒，ambient 每秒 20 粒，由客戶端發射器生成。每個發射器只活動 1 秒，沒有永久循環。關閉／拆除後不再生成新發射器；已生成粒子依自己的壽命消失，不是瞬間抹除。

主要外觀、範圍與壽命按來源修正，但發射頻率與下落速度為基岩適配值，不宣稱 Java 逐幀等效。多台長壽命香薰同時開啟會增加粒子數；效能與靈動視效下可見度仍待實機。

## 取酒與打不掉

可由程式確定的路徑：普通具名杯沒有存檔時，舊 getCup 只容許空杯，其他杯丟出 CUP_MISMATCH；破壞事件先取消，回收再丟錯，於是杯子留在世界並可反覆失敗。新版本以精確方塊 ID 反查成品，補齊缺少資料的杯子，並補原生放置／原生空手互動接入。

這是程式碼定位，**尚未在客戶端重現「旁邊有雪克杯」的條件**。沒有加入「找附近雪克杯」的操作：路由使用實際點中的方塊，回調再驗證維度、方塊類型及手持快照。單杯及玩家有交易鎖，取回成功才移除方塊。既有原始資料不被恢復邏輯覆蓋；錯配／損壞資料會保留並回報，避免猜錯酒種造成損失。

## 第三人稱

僅修改 `animation.kt_mixology.hold_third` 的 grip：position [0,-0.25,-1]，rotation [90,0,0]，scale 0.5。保留單骨骼綁定及 pivot [0,24,0]，不搬動共用模型。第一人稱與其他动画按基準逐項比較不變。此為插槽軸向修正候選值，不是已經取得客戶端截圖的保證。

## 指南

新可選頁欄位：item、category、crafting；API 維持 v1，舊附屬未提供這些欄位亦可註冊。工作站由真實配方種類決定，成品不再充當材料，三槽各自保留所有替代品及品質範圍。圖示、名稱與實物條目對齊；取出容器單列，不當作釀造材料。

Cookery 1.0.6 的已保存宿主調查指出 mechanicsByLocale 地區碼被 cleanToken 過濾。此版在傳输邊界移除宿主忽略的欄位，將完整繁中及英文保留在 mechanics；不截斷操作文字，也不改 Cookery 原件或私有語言屬性。來源資料仍保留三語。原件調查 SHA-256：`c589efb60277bea295ac12ef760d8f2c7e8af3ea62e809b320862bd786033351`；本次並未重新執行該宿主客戶端。

## 待進遊戲的驗收矩陣（未執行）

1. 空手取回普通／神秘／特調杯：附近無雪克杯、相鄰雪克杯、同屏遠處雪克杯。
2. 手持無關物品不應啟動空手取酒；手持有內容雪克杯才進入倒酒操作。
3. 舊世界缺紀錄杯可取回和打破；已有特調資料的色彩、效果及原料不變。
4. 背包滿時杯子應留在原位；生存破壞掉落一份，創造破壞不額外複製；兩玩家同點不重複取回。
5. 第一人稱靜止／搖動保持原樣；第三人稱站立、走路、潛行、搖杯和不同皮膚尺寸檢查手掌位置。
6. 八種香薰小粒子、開啟後環境粒子、紅石開關、重載、關閉後自然退場；標準與靈動視效各看一次。
7. 世界名酒指南從本體的釀造／調酒／設備／儲存／家具／食物／藝術分類找到商品；檢查環遊世界三槽替代酒、布丁取出碗與本體雞尾酒新增做法。
