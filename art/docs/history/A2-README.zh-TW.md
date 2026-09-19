# Tavern A2 — 原作素材／模型累積展示專案

**這是資源移植與外觀檢查包，不是可玩的 Tavern 移植版。** 本批不加入葡萄生長、採收、藤架自動連接、釀造或調酒程式。

## A2 新增內容

| 分類 | 數量 | 內容 |
|---|---:|---|
| 裸藤架模型 | 7 | 直立、東西／南北橫桿、三種十字、六向連接 |
| 普通葡萄藤模型 | 4 | 直立藤架的 single_stage0–3 |
| 葡萄果實模型 | 18 | 普通、冰、金葡萄各 stage0–5；保留原作交叉薄片 |
| 新物品圖示展示 | 9 | 冰葡萄、金葡萄、青提，以及六種果汁桶 |
| 冰葡萄動畫來源 | 1 組 | 16×192 原圖、12 張拆幀、每幀 2 tick、插值設定 |

新增 29 個幾何模型候選，連同 A1 共 **39 個 Bedrock 幾何模型、41 個 Blockbench 編輯檔、20 張未重繪的原作 PNG**。41 個編輯檔包含大酒桶完整主骨架，以及仍阻擋匯出的空瓶來源模型，因此與 39 個幾何檔數量不同。

共有 62 份固定來源檔（A1 的 18 份 + A2 的 44 份）；A2 新增的 44 份為 29 個 Java JSON、14 張 PNG、1 個動畫 mcmeta。PNG 拆幀及離線預覽是衍生檔，不算額外的原作素材。

## 下載包用途與升級

- `Tavern-Assets-A2.zip`：完整累積專案，含原始檔、可編輯模型、工具、預覽及文件。
- `Tavern-A2-VisualLab.mcaddon`：僅 BP／RP 的遊戲外觀測試包。

**A2 已包含 A1，不需要同時裝 A1 和 A2。** BP／RP 保留 A1 UUID，版本由 A1 的 `[0,2,0]` 提高為 `[0,3,0]`，供遊戲識別更新。A1 的 `kt_assets_a1:*` 物件 ID 保留；新物件使用 `kt_assets_a2:*`。這不是早期玩法原型 v0.1 的存檔升級。

請先在全新的測試世界載入，舊世界先备份。Minecraft 引擎、bridge 與 Blockbench 的互動式載入均未在此環境執行，不把靜態檢查當成已驗收。

## 先看原作模型

直接離線打開 `previews/index.html`。頁面可搜尋模型 ID，包含新舊模型預覽、藤架與懸掛葡萄的組合示意，以及冰葡萄動畫的離線插值示意。

**所有預覽都不是 Minecraft 截圖。** 它們由匯出的幾何檔解碼後以軟體光柵投影；光照、雙面、GUI、手持及透明材質仍以遊戲實測為準。

`editor/*.bbmodel` 已內嵌原作 PNG，可用 Blockbench 開啟。幾何中的 `rescale` 已烘焙成尺寸，不需要自行再縮放。原作第 2 階段葉片的反向 UV 保留，請勿自動正規化 UV 起終點。

## bridge 專案

解壓後，以含 `config.json` 的資料夾作為專案根目錄；行為包路徑為 `VisualLab_BP`，資源包為 `RP`。保持目標格式 `1.26.50`；遊戲驗收目標沿用 26.51，不代表已在该版本成功載入。

本包没有 Script API 依賴、JavaScript 遊戲程式、`player.json` 覆寫或實驗開關設定。新模型只註冊靜態展示方塊和物品；有方塊定義並不代表已接上對應玩法。

## 創造模式檢查

匯入 `.mcaddon` 並在測試世界啟用 BP／RP。方塊名稱帶 `[A2]`，位於建築分類；新物品位於物品分類。

可在開啟指令的測試世界分批取得展示物件；每個功能檔只使用 `give @s`，不會替你填充、清空或修改世界區域：

```mcfunction
/function kt_a2/trellis
/function kt_a2/vine
/function kt_a2/crop
/function kt_a2/items
```

每次只執行一批，避免背包空位不足。四批分別給 7、4、18、9 種展示物件。

單獨取得特定模型：

```mcfunction
/give @s kt_assets_a2:trellis_six_direction
/give @s kt_assets_a2:grapevine_stage3
/give @s kt_assets_a2:grape_crop_stage5
/give @s kt_assets_a2:ice_grape_crop_stage5
/give @s kt_assets_a2:gold_grape_crop_stage5
/give @s kt_assets_a2:grape_bucket
```

要看懸掛位置，可手動將普通葡萄藤階段 3 放在普通葡萄階段 5 上方一格。兩者不會自動長出、連接或掉落；模型仍保留原作超出單格的部分，選取框僅是測試用。

A1 大酒桶依舊是完整尺寸的兩個静態展示實體：

```mcfunction
/summon kt_assets_a1:barrel_closed ~ ~ ~
/summon kt_assets_a1:barrel_open ~4 ~ ~
```

## 冰葡萄動畫的處理

原作冰葡萄圖示不是一張普通 16×16 PNG，而是 12 幀動畫。完整來源及 `.mcmeta` 保存在 `upstream/`，原圖也原樣放在 RP 的來源貼圖路徑；每幀另外拆出到 `RP/textures/derived/ice_grape/`。

**遊戲物品目前只引用 `frame_00`。** 原作時間與插值設定存於 `animations/ice_grape.source-animation.json`，尚未完成基岩背包動畫實作和驗收；不把長條圖擠成方形，也不宣稱離線動畫等於遊戲內動畫。

## 來源與 Cookery 邊界

全部來源鎖在 `6b0d619145316492f055e03d70427107cd73efa8`，沒有混入較新的 `main`。Git blob SHA-1 與本地 SHA-256 已核對；**正式 CurseForge JAR（檔案 8350841）尚未取得，沒有完成提交與正式 JAR 逐檔一致性比對。**

正式 Tavern 仍要求 Cookery 前置；目前未取得其真實安裝包身份，`cookery.requirement.json` 保留 `required_for_production=true, bound=false`。這個獨立外觀實驗室未使用 Cookery 私有介面、程式或素材，因此不猜填 UUID，也不宣稱已測跨包相容。

## 未完成項目

本批普通葡萄藤只涵蓋直立四階段，**不包含其成熟横向／交叉帶葉連接模型**，也未包含冰／金葡萄藤架變體、野生葡萄藤、原作位置隨機偏移、粒子／液體、完整手持／掉落／GUI 變換或全量語言檔。

A1 空瓶最後一個元素有反向 X 尺寸，仍保留編輯來源、阻擋遊戲幾何匯出；沒有偷偷改成另一種模型。所有物品與方塊名稱只是外觀測試標籤，不代表完成正式翻譯。

完整狀態见 `docs/STATUS.zh-TW.md`；可手動填写 `docs/ENGINE-CHECKLIST.zh-TW.md` 進行後續引擎驗收。

## 離線重建

Python 3.10+：

```text
python -m pip install -r tools/requirements.txt
python tools/build_assets.py --force
python tools/verify_assets.py
python tools/render_a2_preview.py
python tools/package_assets.py
```

`--force` 會覆蓋生成的 BP／RP 及相應編輯檔，請先備份手改檔案。重建使用包內原始檔，不需要下載上游。不分享或附帶字型檔；預覽會使用系統現有字型。`build_a1_base.py` 是 A2 建置使用的相容基底，不應單獨當作最終建置命令。

目前通過的是靜態引用、雜湊、UV／座標數值和版本一致性檢查，不是 Minecraft 引擎或多人測試。

## 授權

原作：Kaleidoscope Official Production Team。原作素材、轉換模型、拆幀與預覽：CC BY-NC-SA 4.0；原作程式與資源轉換工具：見 BSD-3-Clause `LICENSE-CODE`。詳細來源及修改說明見 `CREDITS.md`。本專案未宣稱獲得原作團隊、Loyallay、Mojang 或 Microsoft 背書。
