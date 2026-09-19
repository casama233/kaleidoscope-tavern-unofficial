# Tavern A8 — 動態調酒美術、雪克杯與原作姿態候選

**尚未補齊全部素材。本包不是可玩的 Tavern。** 延續 A7，新增的是原作資源、動態材質和渲染候選，不包含釀造、飲用、調酒、投料、存物、座位或生長玩法。沒有用佔位方塊冒充未移植內容。

## 本輪實際新增

| 範圍 | 已交付 | 未完成 |
|---|---|---|
| 螢花釀、流明新娘 | 各自原作 1–4 瓶排列，共 8 份幾何；兩張未重繪原圖 | 飲用、品質、物品模型繼承與遊戲顯示驗收 |
| 深水炸彈、莫希托、特調、神秘雞尾酒 | 4 份杯身模型及原图；保留反向尺寸內壁和既有液面 | 特調動態 RGB、效果、混合和引擎材質验收 |
| 雪克杯 | 原作兩骨架、五方盒、64×64 原圖；額外一個座標轉換父骨架 | 玩家手臂搖杯、第一人稱搖動、開蓋互動與投料 |
| 雪克杯 PUT | 原作 0.375 秒、三軌道共 13 關鍵幀；轉出 Catmull–Rom 候選 | 遊戲事件觸發與引擎內插值驗收 |
| 三組動態貼圖 | 深水炸彈 4 幀×3 tick、特調 6 幀×2 tick、神秘 9 幀×6 tick／保留插值開關 | 引擎實際播放、物品欄和透明排序驗收 |
| 原作姿態 | 獨立 PoseLab RP：30 份幾何、對應 45 外觀的既有 display 值 | 並非所有物品；主包預設不套用；不宣稱已通過 UCF/非實驗環境 |

累積 **157 份幾何、247 種材質外觀、249 份 Blockbench 編輯檔、68 張原作 PNG**。原有 441 份幾何／編輯檔／原圖與 A7 逐位元組一致。幾何、材質外觀、圖示物品及輔助實體分開計算，不把測試實體算成新模型。

## 下載包與開啟

- `Tavern-Assets-A8.zip`：全部累積來源、BP/RP、模型、接口、測試、離線檢視器及可選姿態層。
- `Tavern-A8-VisualLab.mcaddon`：主外觀實驗室，內含 BP/RP，不含可選 PoseLab；沒有 Script API 模組、player.json 或自動改動世界的腳本。
- `Tavern-A8-PoseLab-OPTIONAL.mcpack`：**另外選用**的姿態檢查覆蓋包。

A8 已含 A1–A7。**不要同時啟用舊 VisualLab**。BP/RP UUID 保留，版本升為 `[0,9,0]`；這不是早期玩法 v0.1 的存檔升級。請使用新的測試世界，舊世界先備份。沿用目標格式 `1.26.50`，計畫在 Bedrock 26.51 驗收；目前未執行 Minecraft 實機載入。

bridge：根目錄 `config.json`，BP=`VisualLab_BP`、RP=`RP`。Blockbench：`editor/*.bbmodel` 內嵌原作貼圖。本輪沒有操作這兩個 IDE 的工作區，JSON 或 Python 測試不能算 IDE 驗收。

## 離線檢視器

解壓後開啟 `previews/index.html`。預設 A8 的 13 個新外觀；可切至全部 247 種。拖曳旋轉、滾輪縮放、正反面與俯視、原色或近似光照。

新增「貼圖動畫」與逐幀滑桿。三組多幀圖均按 **32×32 的單幀尺寸**取樣，而不是把 32×128/192/288 的整張長條拉伸到杯身。離線檢視器播放離散原幀；神秘雞尾酒的插值意圖保存在 RP flipbook 設定，**本檢視器沒有模擬 Bedrock 的插值演算法**。畫面上的特調是原始未染色外觀。

`previews/A8-overview.png` 和模型縮圖使用首幀，**全部是離線幾何投影，不是遊戲截圖**。檢視器未模擬全部引擎材質、實際光照、碰撞和手持。

## 遊戲內外觀測試入口

新測試世界載入 BP/RP，留出背包空位，再執行：

```mcfunction
/function kt_a8/drinks
/function kt_a8/cocktails
/function kt_a8/shaker
```

依次給 8 個瓶装排列、4 杯雞尾酒及 1 個雪克杯展示方塊。全部只給物件，不會清空或搭建場地。亦可用 `kt_a8/glowflower_brew`、`kt_a8/luminous_bride` 分開取得。沒有釀造或飲用功能。

雪克杯另外提供動畫測試實體，共用同一份幾何，不計入新增模型數：

```mcfunction
/summon kt_assets_a8:shaker_animation_rig ~ ~ ~
/playanimation @e[type=kt_assets_a8:shaker_animation_rig,c=1] animation.kt_assets_a8.shaker.put
```

上述是交付的待實機驗收入口，不是已在遊戲執行成功的紀錄。PUT 是原作放下／杯蓋短動畫，**不是手持調酒動畫**。不提供未篩選的 `/kill @e`。

## 可選手持／物品欄姿態層

`extras/PoseLab_RP` 只覆蓋具有明確來源 display 值的 30 份幾何（45 外觀），包括第一／第三人稱、物品欄、掉落和展示框的來源設定；沒有把未知姿態填成猜測值。

目前 Microsoft Learn 的 Item Display Transforms 文件仍寫有 Upcoming Creator Features 要求，所以此層標為**可選實驗候選**，不改主包 `experimentalGameplay: {}`。只有在另外的測試世界有意驗證時才啟用，置於主 RP 上方。主包保留原有顯示。不要把文件中的舊門檻或此層的存在當作當前引擎兼容性實測。

所有來源幾何、旋轉、平移、縮放保持可追溯；GUI 另明示設定 `fit_to_frame:false`，不聲稱此額外基岩顯示策略與 Java 已逐畫面對齊。

## 局部染色、液面和動畫邊界

`interfaces/dynamic-visuals.json` 保存三組動畫、19 張拆幀、完整原圖路徑、原始時序、特調 tintindex=0 的有向面與雪克杯動畫來源。特調的原圖不被染色或重繪；材質面只保留 `tint_0` 等槽位，**尚未指定執行時 RGB**，不把它冒充動態雞尾酒顏色。

新杯／瓶中原作已有的靜態液面已隨模型轉出；酒桶液位隨容量變化、倒酒液柱、粒子、香薰特效、櫃內動態瓶子和手持搖杯仍待移植。沒有捏造法線、金屬度或粗糙度等 PBR 美術。

## 真正執行過的檢查

`docs/VALIDATION.json`：原圖與來源雜湊、全部資源引用、幾何轉換及歷史回歸。`tests/test_a8_assets.py` 另從原始 Java JSON 獨立重算新模型面位置、UV 和方向，檢查每幀像素、雪克杯源座標／渲染矩陣、動畫關鍵幀、染色遮罩、可選姿態層與數量。

本輪 **61 個 Python、28 個 Node.js 測試及 TypeScript 宣告測試通過**。兩次完整重建的 **884 份生成檔一致**；A7 的 **441 份舊資源全部未變**。生成檔包括主 BP/RP、編輯檔、接口、PoseLab 和拆幀，不是 884 個模型。

瀏覽器以 Chromium 在記憶體載入包內 HTML/JS，247 外觀及動畫逐幀／操作共 **300 項檢查通過**；沒有變更瀏覽器安全策略。`agent-browser` CLI 未安裝，使用 Playwright。未驗證下載後雙擊檔案、Minecraft、bridge 或 Blockbench。原圖數量與測試數量不表示可玩度或整套美術完成率。

## 尚未完成

瓶裝飲品：已處理 16／25 類、64／97 個靜態排列；剩 **9 類、33 排列**。雞尾酒：已有 Emerald、Screwdriver、Depth Charge、Mojito、Signature、Mystery，仍欠 **8 種**。普通 Holder、吧檯、高腳凳、桌、人字梯、吊燈、彩燈、畫、香薰、黑板與告示牌等仍欠缺；詳見 `docs/ASSET-COVERAGE.json`。

**正式 CurseForge JAR 8350841 尚未取得／比對。真實 Cookery 包尚未取得／綁定。** 此次查到 Cookery 公開最新候選為 **v1.0.6，2026-09-18**；這只是發布頁資訊，不是安裝包內 header.version 或 UUID。其頁面列 26.30／26.40，沒有因此宣稱与我們目標版本兼容。詳見 `docs/A8-EXTERNAL-STATUS.json`。

正式版仍要求 Cookery，`required_for_production=true,bound=false`。不要拿合成依賴測試包作真實前置，不猜UUID，也不包含／覆寫Cookery。取得實檔後可使用原有工具：

```text
python tools/dependency_overlay.py "Kaleidoscope Cookery v1.0.6.mcaddon"
python tools/dependency_overlay.py "Kaleidoscope Cookery v1.0.6.mcaddon" --apply
python tools/compare_release.py "kaleidoscopetavern-1.2.0-forge+mc1.20.1.jar"
```

第一條只預覽，第二條修改本專案依賴且備份；JAR比較不執行Java類別。它只比對已鎖定資源，不驗證所有未取得素材或檔案下載真偽。

## 本地重建

Python 3.10+，先安裝 `tools/requirements.txt` 依賴；安裝可能要網路，重建本身使用包內來源，不再下載。執行 `--force` 前備份手動修改的生成檔。

```text
python tools/project.py build --force
python tools/project.py test
python tools/render_a8_preview.py
python tools/test_viewer.py --chromium /path/to/chromium
python tools/project.py package
```

瀏覽器測試另需 Playwright／Chromium，SDK 測試需 Node，型別測試需 tsc。缺失的工具要明示 NOT RUN，不能算通過。`python tools/audit_build.py --force` 可重跑兩次建置及主要測試。主展示包靜態預檢可通過；**production 匯出仍被資源缺口、真實前置、JAR、遊戲驗收及玩法缺失阻擋**。

舊 `A1-*` 至 `A7-*` 文件是歷史記錄，不當成 A8 的新驗收。沒有開始完整玩法實作。

## 來源與授權

Tavern 固定提交 `6b0d619145316492f055e03d70427107cd73efa8`。新增 25 源檔逐檔核對 Git blob SHA-1、SHA-256；少數重複排列來源重組後，只有完整位元組與上游雜湊吻合才保存。來源提交一致不等於正式發行 JAR 一致。

原作：Kaleidoscope Official Production Team。原圖、衍生模型、拆幀及預覽按 CC BY-NC-SA 4.0；程式工具和其他來源按 `CREDITS.md` 與各 LICENSE 分列。包內不含字型檔、Cookery 安裝包或 Minecraft JAR。不宣稱原團隊、Loyallay、Mojang 或 Microsoft 背書。
