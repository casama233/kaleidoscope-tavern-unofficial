# 0.6.134：原料保存、原版狀態粒子與文字／酒液視覺

本候選以 **Tavern 0.6.134／World Liquor 0.1.111** 整合原料保存、
機器操作、狀態粒子及文字／酒液視覺修復；可選 Grilling 維持 **2.8.119**。
本頁是本批單一整合範圍。正式來源修復、原生引擎觀察、真人畫面與 LIVE
交付各有自己的證據，不能由程式碼或資源存在推定整個移植已完全相同。

## 保留的來源與配套

| 來源 | 本候選保留的內容 | 狀態界線 |
| --- | --- | --- |
| [T132／PR297](https://github.com/casama233/kaleidoscope-tavern-unofficial/pull/297)，最終 reviewed source `727fd8853c44247ac8e2cf40faf70122b04e653b` | 濺射瞬時效果、雪克杯回呼／重試、獨立清理與回滾、感知查詢、指南動畫、板面 escape 和 HUD 修補；保留最終 XP／health_helper 原生觀察修正。 | XP orb 實際未暴露 health；明列的 health_helper 才提供真正引擎元件的 health-positive 政策反例。這不實作 XP pickup，也不是 Java 類別反射。 |
| [T133／PR298](https://github.com/casama233/kaleidoscope-tavern-unofficial/pull/298)，reviewed head `625ff769f4c656ff224314bba38d26a1ef5dacc0` | 原生保存位置以有限數值 XYZ 逐軸比較，避免 `{x,y,z}`／`{z,y,x}` 的鍵序讓具名雪克杯第一瓶水被錯誤拒絕；其餘有序槽位、身份與交易守衛保留。 | 整合時 PR298 仍是 open／draft，未合入 main；本候選保留它的修復，不把承接來源寫成原 PR 已合併。原 [T133 說明](RELEASE-NOTES-0.6.133.md) 和歷史保持不變。 |
| [World Liquor W110／PR90](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/pull/90)，已合併來源 `387dc58ff342118d9817a8e02e9a35ffde496c62` | W111 完整保留作者新版 Dassai Q3–Q6 Luck amplifier `1/3/5/7`、Around the World／Jerk／Long Island Iced Tea／Shrimp Cocktail 四款杯子模型與 atlas，以及前兩款原作物品圖，再精確配對 T134。 | Forge 1.1.12／NeoForge 1.1.11 的已選來源修復保留；Luck 原生掉落效果、其他分支及真人渲染不因此完成。四模型沿用原 geometry ID，不增加本輪配額。 |

並行修復已使用 T133 與 W110，本批改用 T134／W111；舊候選版本、原文、
歷史 witness 與 archive 身分不改寫。最終兩庫 PR、精確 CI 與 archive
證據由本候選補入，不能沿用先前撞號候選的成功狀態。

## 操作與保存

| 玩家行為 | 本次正式修復 | 保存和失敗邊界 |
| --- | --- | --- |
| 酒桶／壓榨桶放入原料 | 用原生 ItemStack clone 保存每份原料，保留名稱、lore、損耗、附魔、可讀或不可讀的原生內容；同 ID 不同 metadata 分開存放，依原生可堆疊性合併。 | 原始數量、邏輯槽和原生 carrier 共同核對；已採用原生保存後若 carrier 遺失，不退回純 ID 重建。 |
| 原有機器升級 | 舊 ID/count 槽首次使用時才建立原生保存，保留原數量；舊版生成瓶身 lore 的正規化只用於舊資料。 | 不覆蓋殘留的 orphan carrier，不把不合法的舊超量單件物品靜默截短。 |
| 壓榨、發酵及拆除 | 壓榨一次消耗一個完整原料；不合格原料按原版方向退回原物品；發酵只消耗一次；壓榨桶拆除掉落保留完整原料。 | 保存、扣料或掉物失敗時回滾；成功後的重複破壞回呼不再掉第二份。Survival 遵守 doTileDrops，Creative 清理而不掉物。 |
| 桶子容器交換 | 原版 FluidUtil 的 Creative 分支保留來源水／奶桶；產物優先回到空手，滿背包時走原版掉落分支。普通原料仍按原版扣除。 | 這不宣稱任意第三方 fluid capability 或改變物品種類時的任意 metadata 轉換已完成。 |
| 空手取料與冒險模式 | 取出的真正原料優先進入當前空手；一般機器操作與踩壓可在 Adventure 使用。 | 建造／拆除仍保留其模式權限，Spectator 不獲得操作入口。 |
| 雪克杯內具名可堆疊原料 | 保存有界、自足的可攜 metadata，保留原料名稱、raw lore、可讀 dynamic properties 及 Adventure 標籤；放置、取回、複製和調酒都使用同一份資料。 | 每個可堆疊輸入在扣除前都重建並做雙向原生 isStackableWith 核對；隱藏資料無法證明相等時完整拒絕。不使用指向世界 escrow 的可攜指標。 |

完整外層雪克杯保存、T132 的主／副手事件、防 echo、失敗立即重試，以及
T133 的位置鍵序修正均保留。雪克杯內三份**任意**非堆疊原料／裝飾藥水
仍不受支持：此前真正原生容量實驗不允許穩定三份藥水容器。拒絕時保留原物品，沒有以不完整
序列化、超量設定或空白物品替代原料。

## 畫面與沉浸

| 原版效果 | 本次修復 | 尚待實際客戶端核對 |
| --- | --- | --- |
| 黑色／彩色發光板面 | 黑字保留黑色前景、奶油色八方向描邊；其他顏色使用原版暗描邊。Unihex shadow offset 為 0.5 字型像素。描邊與前景分成兩個 pass，遠處只提交前景。 | 彩色描邊目前以相機距離作 16 格判定；Java 以 camera entity feet，且有第一人稱望遠鏡例外。48 格裁切、字重、縮放、透明排序需同場景驗收。 |
| 機器內冰葡萄 | 4 個酒桶與 8 個壓榨桶顯示位置都接回原始 12 幀、每幀 2 tick 的動畫與插值，不再停在靜態圖。 | 客戶端全域動畫相位、實際幀連續性和資源包順序仍須核對。 |
| 任意 RGB 特調酒液 | 保留既有 336 色 atlas；atlas 外的 RGB 用原作每幀每面 texel 分組，保留源圖明暗再乘實際 RGB。以完全不透明白色貼圖著色；原作透明 texel 不生成表面，避免稀疏透明遮罩造成 mip 破洞，不新增實體。 | 這是新的正式資源路由；原生 RP 載入不能證明實際 shader、透明順序、PBR／Vibrant Visuals 或各視角畫面已相同。 |
| 自訂狀態身體粒子 | 加入原作持續效果顏色、Java float32 加權與截斷、普通／隱形／全 ambient 發射機率、AABB 取樣及原作 SpellParticle 圖集與運動。 | 任意外部效果的 ambient／showParticles／來源不可由目前 Effect API 完整讀取；未知外部效果保留原生外觀所有權。粒子像素、亮度及攝影機相關外觀仍待真人比較。 |
| 原生與自訂效果混色 | 僅有保存 lease、effectAdd 訊號和強度／時間讀回證據的自有原生效果才加入同一層；外部刷新交還外觀，不移除或重施外部效果。 | 已存在或來源不明的效果不猜可見性。保存失敗、卸載／重載和外部刷新均須避免留下可再接管的 stale lease。 |
| 草叢潛行退出 | 每 tick 檢查潛行、草叢及自訂效果；僅在沒有原生隱形時給 1 tick lease。離草、站起或效果清除後自然到期。 | 這沒有實作 Java 取消整個玩家 renderer／裝備／名稱或 Mob.setTarget(null)；真人持續隱藏與目標行為仍有差距。 |
| 微醺干擾瞄準 | 預設停止 yaw 位移；舊水平適配只在玩家明確 opt-in 後啟用，既有退出標記優先。 | 原作純相機 roll 尚未完成。舊版「on」只移除退出 tag，無法與從未設定區分，沒有猜測這種缺少紀錄的偏好。 |

板面仍只使用既有 glyph helpers；任意 RGB 仍使用既有酒液 helper。
機器與杯子的貼圖改用共享 `query.time_stamp`，避免新增或重新建立
helper 時從各自的第零幀開始。Mojang 原廠 cod sample 將 timestamp
與官方定義的 tick 插值比例 frame_alpha 相加，支持 timestamp 採 tick
單位的推論；本輪逐格選圖不另加 frame_alpha。原生客戶端與 terrain／
Java atlas 的相位、長時間世界運行及資源重載仍待實際比較。
模型新增 256 個描邊 ID 和 60 個 RGB 分組／幀 ID，使用精確路徑、來源
提交和 SHA256 見證，另核對骨骼、單面矩形及配置頂點上限。每個描邊模型
為 19 bones／16 cubes／384 個原生配置頂點；RGB 每組最多 28 cubes／672
個配置頂點。既有 base geometry 小於 1024 的**專案預算**和 T131 四個
獨立 item mesh 配額保留；沒有把這個專案數字當成引擎全域硬限制。

## 原作來源與審查

本輪查核的原作 Forge main 為
[`c4ec1880bd44cf3139d3ba744ab30bb379cf1416`](https://github.com/KaleidoscopeMods/KaleidoscopeTavern/tree/c4ec1880bd44cf3139d3ba744ab30bb379cf1416)。
NeoForge 1.21.1 的參考為 `a1afba34981a00e89d57130d3dc8f1e64f1820a2`；
NeoForge 26.1.2 `9b8f165a4641e738e694641dd81240a0206573e1` 僅作未發行
分支的部分核對，不代表完整移植，也未將三個分支混作一套遊戲真值。容器分支、文字及材質的
source oracle、生成器與來源鎖留在 repository。

三位代理分別處理原生原料、沉浸效果和視覺，主代理整合；另一位代理
交叉審查作者之外的交易／外觀所有權及實際 controller 路由。審查發現的
doTileDrops 遺漏、可堆疊原料 managed-lore 保護繞過，以及 aura 保存／
外部刷新邊界均納入修復。既有 T131、T132、T133 的歷史 witness 只追加後繼層，
舊版本、舊原生報告及既有 runtime 內容身分均不改寫。

## 驗證範圍

定向檢查執行真正 production 函式搭配 API fixtures，包含完整資料保存、
數量守恆、失敗回滾、同 ID 不同名稱、損耗附魔、Adventure、Creative、
doTileDrops、原生保存復原、外部粒子所有權與原作數值／像素 oracle。
各分支的定向結果保留原來的來源範圍；T134／W111 最終組合仍須自己的
確切 CI 證據。這些不是模擬玩家遊戲測試，也不證明真正原生事件一定依
fixture 的方式發出。

完整必要套件交由本候選 canonical CI 執行，結果仍待確切提交與 artifacts
確認；本頁不預先宣稱 CI 成功。既有 native-persistence lane 的預定範圍
是在同一對完整 BP/RP 的首次／正常停止／重啟中，保留 T132 最終
XP／health_helper 區分，以及原有真實附屬註冊、雪克杯 migration／PUT、
位置鍵序、濺射和感知場景，再加入可攜原料、機器內完整原生 ItemStacks、
外觀 lease、外部 effectAdd 和 1 tick 隱形
到期。新增 helpers 都是明列的 disposable observer overlays，沒有改寫
正式 runtime，也沒有建立 Player。新增粒子觀察位置與既有 Vision
名單場景分離，避免測試生物污染目標數。結果由確切 CI artifacts 產出，
本說明不預先宣稱原生成功。

## 仍未完成的相同體驗與交付邊界

純相機 roll、原生玩家全域 reach／step-height／XP pickup、草叢清除既有
仇恨、真正穿牆輪廓、原版多行板面編輯器、掉落雪克杯 3D／GUI 2D 分離、
任意三份非堆疊內部原料、完整跨模組原生事件語義，以及 World Liquor
Luck 原生掉落效果仍保留差距。
不能把標記、方框、粒子或改動玩家瞄準當作這些功能的一比一替代。

同候選真人鍵鼠／觸控／手柄、全視角／FOV、聲音、透明與資源包堆疊
仍待比較。公開配套使用精確版本、來源與確定性 archive。實際私人
BSM／quality checkpoint／LIVE 世界在本工作區不可用，完整家族組裝、
fresh stopped-world 保存演練、備份、准入、部署及讀回尚未執行。
既有 LIVE 持續授權不變；保持 client=false、production_ready=false、
live_deployment=false，不將零玩家引擎載入寫成真人或 LIVE 成功。
