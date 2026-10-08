# 0.6.131：原版操作順序、副手雪克杯與動畫物品

本批從 T130 的已合併來源 `c4453491e2f52d4b4515dda0385db204aa892c97`
接續一比一體驗查核，配對 World Liquor **0.1.108** 及可選 Grilling
**2.8.118**。可直接修正的操作、資料交易與資源綁定已落到正式 runtime。
這是待真人驗收的測試候選；來源回歸、原生伺服器場景及兩端客戶端觀察
分開記錄，沒有宣稱整體畫面、沉浸感和操作已完全相同。

## 原版基準

預設外觀及操作以使用者提供的原作 main 為準：
[Forge 1.20.1／1.2.0](https://github.com/KaleidoscopeMods/KaleidoscopeTavern/tree/c4ec1880bd44cf3139d3ba744ab30bb379cf1416)。
另核對 [NeoForge 1.21.1／1.2.0](https://github.com/KaleidoscopeMods/KaleidoscopeTavern/tree/a1afba34981a00e89d57130d3dc8f1e64f1820a2)
及 [26.1.2／1.1.2](https://github.com/KaleidoscopeMods/KaleidoscopeTavern/tree/9b8f165a4641e738e694641dd81240a0206573e1)。
分支本身的杯子貼圖差異不混成單一外觀目標。既有七入口指南、水平／垂直
文字對齊等使用者指定擴充保留。

## 一、家具及普通設施使用

- 掛杯架採用事件提供的直接觸控座標。有效點擊不再被螢幕中央射線覆蓋；
  讀取輸入裝置資料失敗時，仍保留已取得的有效座標。
- 香薰可在普通手持狀態直接開關，保留原版「潛行且任一手持物時繼續物品
  使用」規則。跨面重複事件合併，失敗後可再點擊，不重複切換或播放聲音。
- 轉椅離座後恢復方塊方向；已坐下時可以直接換到空椅。只移除正在換位的
  玩家，坐入失敗會嘗試回復原座位，不把其他乘客一併移除。
- 冒險模式可以使用原版允許的普通設施：調酒、取杯、倒酒、坐椅、切換
  香薰、燈具染色、板面編輯／染色／發光／上蠟／樣式及已確認的農架互動。
  放置、拆除及骨粉這類物品擁有的操作仍走各自建造規則。

## 二、手持雪克杯與兩手事件

副手路徑不只開啟 `allow_off_hand`。正式 callback 從原生事件的 ItemStack
核對實際主手／副手槽、原有杯資料與維度；讀寫副手使用原生 equippable。
搖酒完成及倒出保留原雪克杯完整外層 clone，輸出回到同一來源手，主手
無關物品不會被覆蓋。兩手持有無法區分的相同杯時保持原物品，不猜測來源。

主手物品路由先執行，再嘗試副手雪克杯。外部保護取消及已認領點擊的
跨手／跨面回呼會在再次進入方塊 handler 前被攔截；同一待執行交易只排
一次，交易結束即釋放 pending，失敗後立即重試不再被固定兩 tick 窗口吞掉。

提早停止不結算配方。舊一輪的 stop event 必須符合當前杯資料及可用的
原生剩餘 tick 才能終止新一輪；維度切換造成的空 ItemStack stop 會取消
而不產出。副手寫入拒絕或部分寫入拋錯時，庫存、杯方塊及記錄一併回滾。

API 依據：Microsoft 的 [ItemStartUseAfterEvent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/itemstartuseafterevent?view=minecraft-bedrock-stable)、
[ItemStopUseAfterEvent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/itemstopuseafterevent?view=minecraft-bedrock-stable)
及 [EntityEquippableComponent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityequippablecomponent?view=minecraft-bedrock-stable)。
事件剩餘 tick 核對保留一 tick 邊界容差。文件與 API fixture 不證明實際
鍵鼠、觸控、手柄都會發出相同副手使用序列；未知 vanilla 主手使用及
實際雙手動作仍需同一候選的真人場景。

## 三、安靜的提示及畫面綁定

空杯、已完成杯及已滿桌面雪克杯的原版靜默操作不再彈出自訂 Actionbar。
只有一／兩份原料時使用原版不足三份的翻譯鍵；品質不足的配方訊息按
原版送到聊天，不佔用調酒 Actionbar。

深水炸彈、神秘雞尾酒、下界特調及冰葡萄改用原生 `item_visual` 與
terrain flipbook 路徑，補上先前被固定 PNG 首幀綁定截斷的物品動畫。
薄片幾何依 Mojang 原生 `ItemModelGenerator` 的所有影格邊界生成並交叉
比對。原圖、影格順序、持續時間及插值設定保留：

| 物品 | 來源影格與時鐘 | 來源幾何元素 |
| --- | --- | ---: |
| 深水炸彈 | 2 幀，每幀 5 tick，不插值 | 31 |
| 神秘雞尾酒 | 6 幀，每幀 3 tick，不插值 | 35 |
| 下界特調 | 4 幀，每幀 20 tick，插值 | 29 |
| 冰葡萄 | 12 幀，每幀 2 tick，插值 | 42 |

前三者的桌面杯模型及材料沿用；冰葡萄只增加不可放置的物品顯示載體，
不改作物／農架。原食用時長、堆疊、堆肥與飲用 callback 保留。背包、
快捷欄、手持、掉落及真實食用優先序需要原生客戶端各自驗收。指南表單
本身的 PNG 圖示仍為靜態，不能用世界方塊動畫替它宣稱通過。

雪克杯三個現行／舊 ID attachable 增加真正左手 selector 與左手姿勢。
第一、第三人稱及搖杯波形依原作矩陣轉換；主手既有姿勢數值保留。進度
HUD 停止刷新後的淡出尾巴由 0.10 秒縮短至 0.05 秒；插槽提示仍保留既有
0.5 秒等待及 0.1 秒淡出。沒有為立即清除而覆寫其他 addon 的 Actionbar。

資產來源與可重現檢查見
[animated-item-java-reference.json](../art/interfaces/animated-item-java-reference.json)
及 `tools/animated_item_render_contract.py`。

## 四、感知與莫洛托夫

感知先查詢原生效果 registry，避免在沒有 `glowing` 的引擎對每個目標
重複發出無效 API 呼叫。新增目標音效獨立於輪廓 API：每 50 tick 判定，
以目標共享的 60 tick 快取辨認新發現，避免多位觀察者重複提示。
這修好了被失敗效果呼叫連帶吞掉的聲音，**沒有實作 Java 穿牆輪廓**。

莫洛托夫補上已確認的靈魂火基底、相鄰可燃物、支撐面及非完整方塊判定。
已知原版案例使用明確規則；未知外部方塊保留可辨識的舊適配與診斷。
Java 完整 face-sturdy／flammability／傳送門建立條件尚未全部可映射，
所以不宣稱任意方塊的點火位置均一比一。

## 五、板面、材料交易及農架

板面材料消耗與文字 dynamic property 寫入改為同一次交易。保存失敗，
包括先寫入部分資料後拋錯時，回復原板資料與完整材料 ItemStack。字形
helper 更新屬已提交後的展示維護；字形生成失敗不會再次扣料，後續 tick
可修復展示。樣式變更保留上下兩半共同回滾。

板面文字操作及表單送出都按原作的根部整數座標核對八格距離，並重驗
維度、方塊、文字狀態及上蠟狀態。已上蠟／超距離的後續使用規則亦按
`TextBlockEntity` 的 PASS 路徑處理；花朵樣式變更維持原作先於文字
wax／range gate 的順序。來源仍為原作板面互動與封包接收端。

農架上蠟不消耗蜂巢、去蠟不磨損斧頭，對齊原作 `TrellisBlock`，修正
先前移植額外扣料與耐久的行為。剪枝、採果及相應冒險模式操作沿用完整
交易，掉落生成失敗會回復方塊與工具。骨粉仍走獨立物品使用限制。

原版編輯器是多行 `TextScreen`；當前 server-ui 表單沒有已證實等同的
多行編輯控制。因此保留既有 ModalForm 與文字換行編碼，沒有為 API 升版
而丟掉使用者指定的對齊功能。Microsoft [TextFieldOptions](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-ui/textfieldoptions?view=minecraft-bedrock-stable)
及 [CustomForm](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-ui/customform?view=minecraft-bedrock-stable)
的可用欄位不構成原版編輯器已完成的證據。

## 六、World Liquor 配對

L108 的 BP／RP 精確依賴 T131，並補認 G118 新增的兩個已核對無碰撞
helper：`plate_food_visual` 及 `recipe_icon_visual`。共享出生點的
Respawn 不再因這兩個正式家族展示實體誤判為未知障礙；未知外部 ID
依然拒絕。已知 helper 總數由 85 增至 87，沒有把可選 Grilling 變成
硬性依賴。對應來源及六個 source/API 案例記在 L108 release notes。

## 驗證分層

本地只執行受影響的定向回歸；完整必要套件交正式 PR CI，結果以確切
提交的 Actions 為準。主要已執行項目：

- 副手／來源手交易 16 個案例，共用輸入與 echo 21 個案例，共 37 項通過。
  六個獨立反例涵蓋舊停止事件、同資料快速重啟、跨手保護取消、主手優先、
  潛行狀態改變後的重複回呼及失敗後立即重試。
- 家具 13 項及原有相鄰互動回歸；板面／農架 17 項及既有 trellis 4 項。
  板面最後一輪連同共用輸入的 21 項合計 38 項通過，包含已上蠟 PASS、
  原生／腳本物品後續路由、最後一份材料的跨半部 echo 與超距離安靜退出。
- 感知 4 項、莫洛托夫 7 項，以及相鄰高跟鞋 4 項／草叢潛行 6 項回歸。
- 動畫物品來源幾何、4 個動畫手持路由及 14 個板面路由；雪克杯來源姿勢
  矩陣 2016 個對照、HUD 及既有 frame tests。這些不是螢幕像素／真人操作測試。
- CI 使用的 storage/HUD 來源生成器對本候選執行後，受影響資產沒有漂移。

所有 Node 案例明確使用 API fixtures，沒有 SimulatedPlayer，也不當作
BDS 或真玩家驗收。T130/L107 既有原生證據保留原版號，不改寫成 T131/L108。
本輪候選原生載入／保存／重啟與發布結果需記錄新的確切來源。

## 尚未達到一比一的項目與下一個驗收

| 項目 | 本輪判定及具體下一步 |
| --- | --- |
| 內部三份任意 ItemStack | 保留拒收不支援 metadata 的保護。穩定 API 沒有已證實可攜、可複製、跨世界保存的完整三格方案；既有原生 potion 重量限制仍有效。新 preview block-entity storage 不能當成目前穩定包可用。 |
| 任意外部 RGB 的紋理陰影 | 現有 336 色來源 atlas 保留，域外 RGB 仍為平面適配。十遮罩實驗因 mip／透明測試可能造成遠距液面破洞而完整撤除，沒有把未驗證渲染方案發進 runtime。 |
| 微醺純相機 roll | 官方已有三軸相機動畫，但未證明可疊加且保留自由瞄準、手持與玩家視角。既有可選 yaw 適配仍不能當成原版 roll；需兩端客戶端驗證可行方案。 |
| 感知穿牆輪廓 | 新目標提示音已修；穩定原生輪廓路徑仍未完成。隔不透明牆測輪廓與重複目標。 |
| 草叢潛行、長臂、高跟鞋 | 既有仇恨清除、全局攻擊／挖掘距離及原生步高仍有引擎適配差距，不以隱形、腳本射線或傳送替代宣稱等同。 |
| 摸金、經驗及其他原生效果 | 保留先前已證實的 scope；原生怪物裝備、經驗拾取冷卻／多人歸屬、瞬時效果完整時序仍按現有矩陣追蹤。 |
| 掉落雪克杯 3D／背包 2D | 目前沒有經驗證的通用 item_visual 方案，可按顯示環境切換這兩種幾何。掉落路徑仍待獨立方案；新增左手姿勢不表示此項完成。 |
| 板面編輯器及 HUD 即時隱藏 | 原生多行編輯器與瞬時停止隱藏仍未等同；保留已明確說明的表單／尾巴適配。 |
| 客戶端畫面及輸入 | 同一來源候選比較鍵鼠／觸控／手柄、兩手、第一／第三人稱、GUI／快捷欄／掉落、各 FOV、透明重疊、標準／Vibrant Visuals、音量與實際食用。 |
| 效果身體粒子與效能 | 純自訂狀態的旁觀粒子仍需原生客戶端辨識；密集櫃架／香薰／文字以 frame-time 和伺服器 tick 量測，不從 API 次數推算 FPS／耗電。 |
| 完整家族及 LIVE | 使用既有授權的 canonical family_update 流程。實際 BSM／引擎／世界／quality 路徑在本工作區不可用；新的完整家族 BDS、停服副本演練、備份、部署與讀回待真實連線。沒有新 LIVE 成功宣告。 |

來源修補、原生場景及真人驗收的當前入口為 [PARITY-MATRIX.md](PARITY-MATRIX.md)、
[BUGS.md](BUGS.md) 及 [PR-DISPOSITIONS.md](audit/PR-DISPOSITIONS.md)。
