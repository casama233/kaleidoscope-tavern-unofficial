# Tavern A3 — 原作資源移植與外觀檢查

**這是累積資源／模型候選包，不是可玩的 Tavern 移植版。** 依照「原作素材先行」的要求，本批沒有增加生長、採收、鄰居連接、釀造、調酒、容器或其他玩法程式。

## 這一輪改進

| 類別 | 新增 | 具體內容 |
|---|---:|---|
| 普通帶葉藤架 | 6 模型 | 東西／南北橫向、三種十字、六向連接；沿用 A2 已有直立 0–3 階段 |
| 冰葡萄藤架 | 10 模型 | 直立 0–3 階段與六種成熟連接形狀 |
| 金葡萄藤架 | 10 模型 | 直立 0–3 階段與六種成熟連接形狀 |
| 野生葡萄藤 | 2 模型 | 末梢與中段，展開原作引用的 Minecraft `block/cross` 父模型 |
| 空瓶 | 1 模型候選 | 將原作反向 X 尺寸元素轉成有向薄片，保留 21 個材質面的頂點、UV 與面方向 |
| 檢視工具 | 1 套 | 可搜尋、旋轉、縮放的离線 3D 檢視器；使用軟體光柵，不依賴 WebGL 或外部 CDN |

累積 **68 個 Bedrock 幾何、70 個 Blockbench 編輯檔、24 張未重繪的 Tavern 原作 PNG**。其中 57 個模型用於裸藤架、三種葡萄藤架、三種果實階段與兩種野生藤蔓的靜態展示；不代表這些作物會生長。

原始來源為 **94 份 Tavern 檔案，加 1 份單獨註記的 vanilla 父模型參考**。動畫拆幀與預覽不計入原作 PNG 數量。

## 先看模型：不必先裝遊戲

解壓完整 ZIP，開啟 `previews/index.html`。在模型清單選擇物件，拖曳旋轉、滾輪縮放；也可用正面／背面／俯視按鈕。鍵盤方向鍵旋轉，`+`、`-` 縮放，Escape 重設。

「單面檢查」用於檢查原作明確的正反面；「原色貼圖」可切換原色與簡化光照。這些是自製檢視器選項，**不是 Minecraft 材質行為的驗收結果**。圖示、模型與縮圖資料在本地包內，不使用 CDN、遠端字型或網路素材。

`previews/A3-overview.png` 是本批概覽；`previews/empty-bottle-inspection.png` 是空瓶三個角度的離線投影。`viewer-desktop.png` 等圖片是自製檢視器的瀏覽器畫面，並非 Minecraft 截圖。

`editor/*.bbmodel` 內嵌原作貼圖，可交由 Blockbench 檢查。原始反向尺寸空瓶仍是 `empty_bottle.bbmodel`；新的候選是 `empty_bottle_faces.bbmodel`，兩者分開保存，沒有覆蓋原始證據。

## bridge 專案

根目錄 `config.json` 指向 `VisualLab_BP` 和 `RP`。目標格式沿用 `1.26.50`，計畫的遊戲驗收目標仍為 26.51；**並不代表本包已在該引擎成功載入**。本輪沒有操作 bridge 或 Blockbench 的互動工作區。

BP 是必要的靜態展示定義，不含 runtime JavaScript、Script API 依賴、`player.json` 或實驗開關。具備外觀定義，不等於對應玩法已存在。

## 遊戲檢查與升級

A3 包含 A1 和 A2，**不必同時載入舊版**。保留 BP／RP 原 UUID，版本提高為 `[0,4,0]`。既有 `kt_assets_a1:*` 與 `kt_assets_a2:*` ID 保留；A3 新物件用 `kt_assets_a3:*`。這不是早期玩法原型 v0.1 的存檔升級。

請用新測試世界，匯入 `Tavern-A3-VisualLab.mcaddon` 並啟用 BP／RP。新品名稱帶 `[A3]`，放在創造模式建築分類；A3 選取框與無碰撞設定僅供模型觀察，不作正式玩法規格。

可分批取得展示物件（每條只執行 `give @s`，不清除或搭建世界）：

```mcfunction
/function kt_a3/grapevine
/function kt_a3/ice_grapevine
/function kt_a3/gold_grapevine
/function kt_a3/wild
/function kt_a3/bottle
```

五批分別給 6、10、10、2、1 種物件。請分開執行並留出背包空位；沒有驗證背包已滿時指令行為，不應把這些測試功能檔用在正式生存流程。

例：

```mcfunction
/give @s kt_assets_a3:grapevine_six_direction
/give @s kt_assets_a3:ice_grapevine_stage3
/give @s kt_assets_a3:gold_grapevine_cross_east_west
/give @s kt_assets_a3:wild_grapevine
/give @s kt_assets_a3:empty_bottle_faces
```

舊的 `/function kt_a2/trellis`、`kt_a2/vine`、`kt_a2/crop`、`kt_a2/items` 保留。A1 大酒桶仍是完整尺寸的靜態展示實體：

```mcfunction
/summon kt_assets_a1:barrel_closed ~ ~ ~
/summon kt_assets_a1:barrel_open ~4 ~ ~
```

每次召喚會新增一個實體；清理時只選本測試實體，不使用無篩選的 `/kill @e`。

## 空瓶與模型轉換的改進

原空瓶最後一個元素的反向 X 尺寸沒有直接取絕對值。A3 按原作每個有效材質面生成正尺寸、零厚度薄片，尋找保持有向頂點及 UV 配對的面／UV 旋轉組合。結果是 7 個輸出 cubes、21 個有向材質面；原作 4 個元素的檔案完全未修改。

這解除的是「無法匯出候選」的阻擋；**內側面、透明裁切、遮擋及雙面效果仍待遊戲實測**。對照表在 `docs/EMPTY-BOTTLE-FACE-MAP.json`。

新增成熟藤架的原始分段橫桿、細微偏移、45 度葉片 rescale 與反向 UV 保留。A3 明確正反面採 `alpha_test_single_sided` 的展示材質候選，避免檢視時把同一薄片雙面重複繪製；這一選擇仍需引擎驗證。

## 本次實際檢查

`docs/VALIDATION.json`：**1003 項本地完整性與數值檢查通過**。包括 94 份來源雜湊、原圖位元組、引用、旋轉／UV、父模型展開、空瓶 21 面、A2 80 份舊幾何與編輯檔的回歸核對。

`docs/VIEWER-BROWSER-TEST.json`：**89 項自製檢視器瀏覽器檢查通過**，包括 68 模型各自材質載入及非空畫面、搜尋／批次、拖曳、缩放、視角、旋轉、縮圖與手機寬度。

本環境的瀏覽器管理政策封鎖 `file://` 與 loopback 網頁導航；沒有更改或繞過該政策。檢視器測試是把包內 HTML／JS 在記憶體中載入 Chromium，使用嵌入貼圖做渲染。**它沒有驗證下載解壓後的雙擊開檔流程，也沒有驗證遊戲、bridge 或 Blockbench 載入。**

## 來源與授權邊界

Tavern 來源固定為 `6b0d619145316492f055e03d70427107cd73efa8`。正式 CurseForge JAR 8350841 仍未取得，沒有完成提交與正式 JAR 的逐檔比對。

野生藤蔓使用的 Minecraft 1.20.1 `cross.json` 是從 `InventivetalentDev/minecraft-assets` 版本化鏡像取得的 Mojang 資源參考，Git blob 已核對；並非直接取得官方 JAR 的證據，也不是由 Tavern 授予的 CC 素材。來源與權利分別記載在 `sources.lock.json` 的 `external_references` 與 `CREDITS.md`。

正式版仍要求 Cookery 前置，但真實套件未取得，`cookery.requirement.json` 保持 `required_for_production=true, bound=false`。本獨立展示包沒有使用 Cookery 素材或介面，不猜填 UUID。

## 未完成

所有模型的 Minecraft 外觀驗收、手持／掉落／GUI 顯示、官方 JAR 核對、Cookery 綁定、其他酒類與家具、粒子／液面、原作位置隨機偏移、完整語言文本、冰葡萄背包動畫與所有玩法仍未完成。冰葡萄仍只以第一幀作遊戲圖示，12 幀來源與離線動畫保留。

## 離線重建

Python 3.10+，資源工具依賴見 `tools/requirements.txt`：

```text
python -m pip install -r tools/requirements.txt
python tools/build_assets.py --force
python tools/verify_assets.py
python tools/render_a3_preview.py
python tools/package_assets.py
```

`--force` 會覆寫生成的 BP／RP 和編輯模型，手工修改請先備份。完整重建不需要下載上游。預覽使用系統字型；包內不包含字型檔。

可選的檢視器回歸工具為 `tools/test_viewer.py --chromium <Chromium路徑>`，需另裝 Playwright；它不是遊戲測試器。重建或修改 viewer 後，應重跑相關檢查，不能沿用舊報告聲稱新內容已驗證。

原作署名與素材條款見 `CREDITS.md`、`LICENSE-ASSETS`；工具及原作程式來源見 `LICENSE-CODE`。不宣稱原團隊、Loyallay、Mojang 或 Microsoft 背書。
