# 放置模型與生成朝向：2026-09-23

使用者回報 0.6.10 中龍頭、放置酒瓶及雞尾酒仍不可見；稍後確認廚房本體與所有附屬的**舊放置物可見，新放置物不可見**。較早版本曾可顯示，但尚未確認最後正常版本。另有酒桶、高腳凳生成後短暫歪斜再復位。

## 已確認與修訂

- 酒桶、高腳凳、特調杯與酒架展示物先前先 `spawnEntity`、再 `setRotation`。改用原生 `SpawnEntityOptions.initialRotation`，讓生成本身攜帶朝向；保留既有實體的朝向修復。高腳凳動畫從同步的 `seat_yaw` 初始化，避免載入有乘客的凳子時先從零角度插值。
- 0.6.9 起的編譯步驟複製 113 個已有模型至 `models/blocks/placed`，並改寫放置方塊的幾何 ID；0.6.11 又為 UV 面加入顯式材質名稱。兩項候選修訂均沒有客戶端成功畫面支持，0.6.13 撤回，恢復原本的模型 ID 與 `*` 後備材質。保留酒桶 27 格的空白幾何與完整碰撞方塊，以及已修正的實體生成朝向。
- 整個世界的方塊幾何定義曾由約 944 增至 1057 個，與回報時間相近；這是值得消除的無謂複製，**不是已證實的渲染上限或隱形根因**。
- 正式服已啟用 `texturepack-required=true`，要求客戶端載入世界資源包。這同樣是相容性措施，**尚未證明它就是隱形的根因或已修復實際畫面**。

## 排查證據與限制

- 正式服只有一份酒館 RP；查無跨包重複酒館 geometry ID 或 terrain texture key。安裝檔案與建置相同。其他 15 個世界資源包和 15 個行為包的引用皆有實際安裝檔案且版本相符。
- 葡萄酒、龍頭、白色佳人的模型引用貼圖存在，實際 UV 區域含不透明像素；不是貼圖全透明。
- C2～C6 歷史快照中的 `bottle_wine` 基礎模型／材質設定相同。尚不能指定某次最近的 commit 為退化點。
- `blocks.json` 對這類自訂幾何方塊是選用；把檔案移入 `models/blocks` 本身也不能證明可見性。0.6.10 原先關於目錄必然導致隱形的推斷已撤回。
- BDS 能驗證放置、碰撞、生成朝向與交易，無法驗證手機的幾何載入、GPU 材質和最終畫面。要結案仍需客戶端內容記錄或實際畫面。

## 0.6.13 新回報與隔離複測

- 使用者回報：登入後模型短暫顯示再消失，酒桶正面龍頭不顯示；西瓜作為龍頭來源無法裝出飲品。**西瓜行為確實尚未移植**：目前龍頭只處理酒桶及水鍋，Java 版另外實作 `WatermelonTapBehavior`。
- 正式服上的廚房 BP/RP 與 9 月 21 日、9 月 23 日的備份逐檔相同。廚房本體檔案未被本次部署改寫。
- 隔離 BDS 在完整模組堆疊下，以模擬玩家依序放置廚房烤串、金色沙拉、酒瓶、酒桶與龍頭，執行酒桶釀造、裝瓶與視覺實體修復後再次檢查：方塊與酒桶實體仍存在。創造模式放置烤串、金色沙拉、酒瓶，以及在酒桶正面放置龍頭也成功；六秒後兩種廚房食物的 `food_stage` 都維持 0。這排除了**該隔離路徑**下的伺服器定時刪除，並未驗證手機畫面或正式世界玩家的實際互動路徑。
- 「沉浸式品嚐」行為包覆寫廚房 19 個物品，正式服啟動時有對應警告，值得獨立整理。但在隔離複測中，金色沙拉即使保留覆寫也可正常放置並保持，所以不能把該覆寫列為本次隱形的已證實根因。
- 初次測試的金色沙拉放置失敗，是測試目標被剛放下的烤串擋住；改用獨立空地後通過。不可引用初次失敗作為模組缺陷。
- 使用者已確認隱形物件仍有選取框與碰撞，範圍包括新放的廚房菜餚、酒瓶和沙發；目前應優先追查客戶端渲染，而不是重做已通過的伺服器放置流程測試。

## 材質檢查與作者原包比對

- 取得作者發布的 Cookery 1.0.6 原包（CurseForge file 8908596），逐檔比對正式服：本體所有模型、貼圖與原包相同；RP 差異只有 manifest 和中文翻譯。BP 有既有兼容修訂，不能稱為完全未修改，但通用菜餚放置流程與原包一致，該檔案差異只有飽食度上限處理。
- 找到兩個違反引擎材質規則的方塊：酒館杯架與烟火大缸在同一組材質中混用 `alpha_test`、`blend`。大缸的五個液體狀態也有此問題。保留半透明玻璃及液體，統一該方塊同組材質為 `blend`，並同步修訂產生器與現有驗證入口。
- 完整模組堆疊的隔離 BDS 載入比較中，`All MaterialInstances must use the same render_method` 警告由 27 條降為 0。這證明已排除該設定錯誤，**尚未證明它是所有方塊隱形的根因**；仍需以客戶端實際畫面與內容記錄確認。
- 伺服器整合包 0.6.14（酒館）與 2.7.64（烟火）完成備份、停服安裝與重新啟動。相對前版只有兩個方塊材質、四個 manifest 與診斷版本字串共 7 檔有變；正式服重新載入亦為 0 條混用材質警告，安裝檔案雜湊與驗證包一致。548 組材質的打包檢查通過。客戶端是否持續可見仍待驗證。
- 原始碼完整靜態檢查為 6131/6134；新增材質檢查全數通過，其餘三項仍失敗：未經伺服器編譯準備的兩個酒桶空白幾何引用，以及既有指南標題字串檢查。實際伺服器包的酒桶幾何引用與指南檢查通過。不可將此結果寫成原始碼全套檢查通過。

參考：[原生生成選項](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/spawnentityoptions?view=minecraft-bedrock-stable)、[材質元件](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/blockreference/examples/blockcomponents/minecraftblock_material_instances?view=minecraft-bedrock-stable)、[廚房基岩移植版](https://www.curseforge.com/minecraft-bedrock/addons/kaleidoscope-cookery-unofficial)。

## 0.6.15：依據客戶端內容記錄修訂

使用者提供的客戶端記錄已明確指出下列定義錯誤。這些錯誤在先前的無畫面 BDS 放置測試中沒有被驗證；不可再以 BDS 載入成功推論客戶端模型正常。

- `geometry.kt_runtime.invisible`、`geometry.kt_block.empty_cell` 沒有任何立方體，卻被高腳凳、特調杯及酒桶用作方塊模型。客戶端明確報出單位方塊範圍與旋轉後尺寸錯誤，並在後續引用中無法找到幾何。19 種酒館方塊現共用一個有正常尺寸的透明小立方體模型；其尺寸位於單格內，貼圖全透明，碰撞及選取設定各自保留。實體專用空模型不再被方塊引用。
- 國味玩法兼容包的 `senluo:lantern_light` 同樣誤用實體倉儲空模型，改用有效透明方塊模型。全套資源掃描又發現家具模組的蠟燭燈光有相同空模型，另以僅資源包的修訂補上有效幾何及已存在的透明貼圖路徑。整套方塊引用空模型由 21 處降至 0，未解析的幾何引用為 0。
- 雪克杯原生長按動畫使用了不存在的 `query.has_tag`，改由已支援的 `query.is_using_item` 與手持物品名稱驅動。既有使用事件仍負責材料及結果交易，動畫只讀取原生使用狀態。
- 三種雪克杯 attachable 依原生 `controller.render.item_default` 契約補齊 `enchanted` 材質及貼圖名稱。移除沒有任何引用、`bones` 卻為空物件的 `shaker.release` 動畫。
- 修訂同步至產生器及既有驗證入口；打包檢查涵蓋方塊空模型、透明佔位範圍與材質、無效查詢、空動畫，以及原生物品渲染器的附魔綁定。原始碼靜態檢查 6635/6635 通過；先前以字串格式比對指南標題的檢查改為讀取真正輸出資料。隔離 BDS 載入及本體指南擴充檢查通過。
- 客戶端記錄中的農夫樂事 `geometry.baby`／`texture.baby` 綁定錯誤，以及國味人偶、香爐的 `blocks.json` 舊材質警告，屬另外的定義問題，本批尚未處理；不能把它們列為已解決。

本批直接修正記錄中已證實的模型載入錯誤；「整體隱形是否完全消失」仍須以更新後客戶端觀察與新內容記錄確認。

契約參考：[官方方塊幾何](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/blockreference/examples/blockcomponents/minecraftblock_geometry?view=minecraft-bedrock-stable)、[官方 attachable 範例](https://learn.microsoft.com/en-us/minecraft/creator/documents/attachables?view=minecraft-bedrock-stable)、[Molang 查詢列表](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/molangreference/examples/molangconcepts/queryfunctions?view=minecraft-bedrock-stable)。
