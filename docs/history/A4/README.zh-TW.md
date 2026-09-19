# Tavern A4 — 原作模型與材質累積展示專案

**資源階段中間成果，不是可玩的 Tavern，也不是「全部原作資源已補完」。** A4 沿用 A3 並新增 109 種可檢查外觀。没有生長、釀造、調酒、鄰接連線、座位或庫存程式。

## 這次新增

| 類別 | 原始資源與轉換成果 |
|---|---|
| 沙發 | 16 張原作 PNG × 6 種原作形狀：single、left、middle、right、left_corner、right_corner。共 96 個展示方塊與 96 份內嵌材質的 .bbmodel；只共用 6 個 .geo.json，不重複存 96 套幾何。 |
| 香檳 | 原作 count1–4 模型與原圖，4 個展示方塊／幾何／編輯檔。 |
| 蜂蜜葡萄酒 | 原作 count1–4 模型與原圖，4 個展示方塊／幾何／編輯檔。 |
| 冰葡萄酒 | 原作 count1–4 模型與原圖，4 個展示方塊／幾何／編輯檔。 |
| 翡翠雞尾酒 | 原作 8 個元素，包括 2 個反向尺寸元素。轉為 14 個幾何單元並保留面方向、UV、原始 shade=false 設定；玻璃材質為待實機驗收候選。 |

**A4 累積數量：87 個幾何檔、177 種模型材質外觀、179 份 Blockbench 編輯檔、44 張未重繪的 Tavern 原作 PNG。** 幾何數、外觀數與物品種類不是同一個計數：例如一個沙發形狀由 16 種原圖共用。

A3 原有的 68 個幾何及 70 個編輯檔逐位元組回歸比對保持不變。頂層 `asset-conversion.json` 按每種外觀記錄源模型、材質、共用幾何和編輯檔。

## 開啟、匯入與升級

- `Tavern-Assets-A4.zip`：完整累積專案，包含 BP／RP、原始素材、可編輯模型、來源鎖定、工具和離線預覽。
- `Tavern-A4-VisualLab.mcaddon`：兩個內嵌 .mcpack 的純外觀測試包。
- A4 已包含 A1–A3；**不要在同一個世界同時載入舊 VisualLab**。BP／RP UUID 保持不變，版本升為 `[0,5,0]`，目標格式仍為 `1.26.50`。
- 不是最早玩法原型 v0.1 的存檔升級。使用新測試世界，已有世界先備份。
- 本環境沒有真正載入 Minecraft、bridge 或 Blockbench。不要把語法、數值、瀏覽器測試當成遊戲驗收。

bridge：以含 `config.json` 的資料夾作專案根目錄，行為包是 `VisualLab_BP`，資源包是 `RP`。Blockbench：開啟 `editor/*.bbmodel`，材質已內嵌。

## 離線檢查

開啟 `previews/index.html`。可按批次篩選，搜尋「沙發」、`sofa_blue`、`left_corner`、`champagne` 或 `emerald`，拖曳旋轉／滾輪縮放／切換正反面及俯視。

頁面顯示 **177 種外觀，87 套幾何**，不把共用材質變體冒充新增幾何。所有縮圖、總覽和 3D 投影都不是 Minecraft 截圖。

本轮瀏覽器測試實際使用 Playwright／Chromium，將包內 HTML 和 JavaScript 放到記憶體中載入；驗證 177 種外觀與操作。`agent-browser` CLI 未安裝。本輪未驗證下載後雙擊開檔或本機網站導航；不宣稱橋接 IDE 已載入。

## 遊戲內外觀物件

新測試世界啟用 BP／RP 後，可分批給予：

```mcfunction
/function kt_a4/drinks
/function kt_a4/cocktails
/function kt_a4/sofa_palette
/function kt_a4/sofa_blue
```

`drinks` 給 12 個酒瓶排列；`cocktails` 只給目前移植的翡翠，**不是全部雞尾酒**；`sofa_palette` 給 16 色單座；`sofa_blue` 給藍色的六種形狀。各色都有 `sofa_<color>` 指令，例如 `sofa_white`、`sofa_red`、`sofa_black`。均只使用 `give @s`，不清空或搭建世界區域；背包空位不足可能掉到地上。

單獨取得：

```mcfunction
/give @s kt_assets_a4:sofa_blue_left_corner
/give @s kt_assets_a4:champagne_4
/give @s kt_assets_a4:honey_wine_1
/give @s kt_assets_a4:ice_wine_4
/give @s kt_assets_a4:emerald
```

這些物件不自動連接、不會讓玩家坐下、不會釀造或被喝掉。測試選取框不是原作碰撞的完整移植。各模型原始延伸尺寸均保留，不為了塞進單格而偷偷縮小。

## 材質與特殊幾何

沙發／瓶裝酒沿用原作 cutout 語意，展示候選採 `alpha_test_single_sided`；翡翠原作宣告 `translucent`，保留 `blend` 設定。**翡翠原圖 alpha 實際只有 0 和 255，沒有半透明像素；本包不自行降低 alpha，亦不捏造玻璃半透明效果。** `docs/A4-TEXTURE-ALPHA.json` 記錄這次所有材質的 alpha 統計。

翡翠的負尺寸元素按有向面拆分，未直接取絕對值；拆分後的 `unshaded` 面設定一併保留。面對應見 `docs/A4-REVERSED-FACES.json`。離線透明排序只是近似檢查，不代表 Bedrock 的透明排序、光照、色調和遮擋結果。

没有憑空製作 PBR 法線、金屬度或粗糙度貼圖。Java 的 display 姿態、particle 引用和來源 shade 資訊保留在記錄中；手持、GUI、掉落及粒子語意尚未完成引擎驗收。

## 來源與必要前置

所有 Tavern 原作資料固定提交 `6b0d619145316492f055e03d70427107cd73efa8`；沒有混入後來的 main。來源均驗證 Git blob SHA-1，另存本地 SHA-256。

沙發 96 個子模型使用父模型引用：從已取得的原始模板重建精確位元組，並重建整棵 Git tree，結果與上游 `bbf38b723e5d07ae327deb26da52cbe4b52514e2` 一致。這不是自行猜配色；原圖也分別按原始 blob 雜湊核對。完整證据在 `docs/SOFA-SOURCE-TREE.json`。

**正式 CurseForge JAR 8350841 尚未取得／逐檔對照。** 不把來源提交雜湊匹配誤稱為正式 JAR 比對完成。

正式玩法包仍要求 Cookery。真實 Cookery 安裝包身份尚未取得，沒有猜造依賴 UUID；`cookery.requirement.json` 保持 production 必須、目前未綁定。此 VisualLab 不使用或覆寫 Cookery 的程式／素材，因此可獨立檢查，不能當成正式依賴已完成。

## 仍待補齊

目前瓶裝飲品只包含 Wine、Champagne、Honey Wine、Ice Wine；其他瓶裝酒、醋／西瓜汁排列仍待移植。雞尾酒只新增 Emerald；其他雞尾酒、空雞尾酒杯、雪克杯、酒櫃／杯架、吧檯、凳子、吊燈／彩燈、畫、香薰、黑板、人字梯、文字及動態渲染仍未完成。

已取得的模型還需實機驗收。植物來源模型已在 A1–A3 整理，但不含生長／世界生成、位置隨機偏移和動態材質。冰葡萄圖示仍是明示的首幀展示，不能當作背包動畫已完成。

## 重建與檢查

Python 3.10+；依賴見 `tools/requirements.txt`。

```text
python -m pip install -r tools/requirements.txt
python tools/build_assets.py --force
python tools/verify_assets.py
python tools/render_a4_preview.py
python tools/package_assets.py
```

`--force` 覆蓋生成 BP／RP／編輯模型，請先備份手動修改。全部原始素材已包在 `upstream/`，重建不需要網路。額外可執行 `python tools/test_viewer.py --chromium /path/to/chromium`，需另裝 Playwright；瀏覽器測試不代表 Minecraft 已驗收。

驗收表、來源對照、材質統計與實際限制見 `docs/`。包內不含字型檔；預覽渲染使用作業系統既有字型。

## 授權

原作：Kaleidoscope Official Production Team。原作素材及本次衍生模型／拆幀／預覽按 CC BY-NC-SA 4.0；程式與轉換工具依 `LICENSE-CODE`。保留 `CREDITS.md` 的来源与分別授權。未宣稱原團隊、Loyallay、Mojang 或 Microsoft 背書。
