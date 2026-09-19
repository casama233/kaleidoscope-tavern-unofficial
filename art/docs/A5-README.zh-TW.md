# Tavern A5 — 資源接口與整合檢查版

**累積資源專案，不是可玩的 Tavern。** A5 沒有增加模型或重繪貼圖，沿用 A4 的 87 份幾何、177 種模型／材質外觀、179 份 Blockbench 編輯檔、44 張原作 PNG。新增的是統一資源接口、明確物品顯示綁定、前置工具與匯出檢查；沒有接回釀造、種植、座位或庫存程式。

## 本輪實際交付

| 項目 | 成果與邊界 |
|---|---|
| 統一索引 | `interfaces/asset-registry.json` 對應 177 個外觀、10 個圖示物品，連到現有真實展示 ID、幾何、材質、編輯檔與來源雜湊。 |
| 狀態選擇 | 11 組本專案資源選擇接口；不把這些狀態宣稱為原作或基岩原生 block states。 |
| 物品顯示 | 補上 8 個早期展示方塊缺少的 `minecraft:item_visual`，現有 175 個展示方塊都有明確綁定。只複用正確幾何／材質，不冒充原作手持／GUI 姿態已還原。 |
| bridge 設定 | 補 `type: minecraftBedrock`；保留全部舊物件 ID。 |
| Cookery | 整合真實安裝包檢查、預覽、備份寫入、重新建置後重套、ID 驗證；**本次沒有取得真實 Cookery 包，仍未綁定**。 |
| JAR 對照 | 修正舊工具只查 main resources 的缺口；現在同時檢查所有已鎖定的 main 與 generated resources。正式 JAR 尚未拿到，未完成真正比對。 |
| 發行檢查 | 普通展示包可進行靜態預檢；正式版導出會被缺少資源、Cookery、引擎驗收和玩法阻擋，沒有「強制正式發行」選項。 |

## 直接使用

A5 包含 A1–A4，不要在同一世界同時啟用舊版。保留原有 BP／RP UUID，套件版本升至 `[0,6,0]`；這不是最早 v0.1 玩法原型的存檔升級。

- `Tavern-Assets-A5.zip`：完整專案、SDK、測試、原圖、模型、接口資料和工具。
- `Tavern-A5-VisualLab.mcaddon`：純展示 BP／RP；SDK 不裝進遊戲，沒有 `player.json` 或 Script API 模組。
- `previews/index.html`：仍是 A4 的離線檢視器，因為本輪沒有新增外觀。頁面上的 A4 標題是保留內容，不是又生成了一批模型。沒有重新宣稱新一輪瀏覽器驗收。
- `editor/*.bbmodel`：完整保留、內嵌原作貼圖。

bridge 以根目錄 `config.json` 開專案。遊戲外觀檢查請使用新測試世界；原先 `/function kt_a2/...`、`kt_a3/...`、`kt_a4/...` 指令仍保留。**本次未操作 Minecraft、bridge 或 Blockbench 的互動工作區。**

## 開發接口：已能實際執行

Node.js 18+，不需要安裝 npm 依賴：

```text
node sdk/example.mjs
node --test tests/interfaces.test.mjs
```

核心 SDK `sdk/index.mjs` 不依賴 Minecraft，也不讀檔或改世界。`sdk/example.mjs` 是本地 Node 示範，有檔案讀取；不要直接把這個示範貼進 Bedrock 的 main.js。

```javascript
const api = createAssetRegistry(registryJson);
const sofa = api.selectVisual({
  family: "sofa",
  state: { color: "blue", shape: "left_corner" }
});
// sofa.binding.id === "kt_assets_a4:sofa_blue_left_corner"
const worldComponents = api.blockVisual(sofa.key, "world");
```

缺件與無效參數會拋出有代碼的錯誤；不會把未移植的 Vodka、錯誤顏色或第五個瓶子默默替換成別的東西。完整接口說明見 `docs/INTERFACES.zh-TW.md`。

## 一次檢查／重建

Python 3.10+；已有相依套件時可完全離線使用：

```text
python -m pip install -r tools/requirements.txt
python tools/project.py check
python tools/project.py test
python tools/project.py build --force
python tools/project.py package --out dist
```

安裝套件那一步可能需要網路；重建與檢查本身不下載素材。`--force` 會重建生成的 BP／RP／編輯模型，手改檔先備份。Windows 也可雙擊 `CHECK-ASSETS.cmd`，它不自動安裝任何軟體。

TypeScript 宣告測試需已有 `tsc`：`tsc -p tests/tsconfig.json`。`project.py test` 找不到 `tsc` 時會明示略過，不能當成通過。

## Cookery 綁定接口

從作者來源自行取得真實安裝包後，工具預設只預覽，不改專案：

```text
python tools/dependency_overlay.py "Kaleidoscope Cookery.mcaddon"
python tools/dependency_overlay.py "Kaleidoscope Cookery.mcaddon" --apply
python tools/project.py check
```

`--apply` 只改 Tavern manifest、依賴鎖與狀態，保留 `.dependency-backups`；不修改／執行／重打包 Cookery。使用對方 **header UUID 與 header.version**，不是 module UUID，也不是由檔名猜版本。合成包測試已檢查綁定、重套、寫入錯誤回退、碰撞和重建後版本保留；它們不是與 Loyallay 真實包的相容性實測。

回退範圍是本地程式可捕捉的 I/O 例外；不宣稱多個檔案跨斷電／強制終止具原子性。備份不會附入發行 ZIP。

食材對照在 `compat/cookery/item-map.json`，目前刻意保持空白；只有被實際安裝包註冊的 ID 才能通過驗證。這裡不提供假的 `registerCookeryRecipe()` 或 Guidebook 注入接口，也不讀取 Cookery 私有資料。

本次下載包依然是獨立外觀實驗室：`required_for_production=true, bound=false`。沒有因為工具存在，就把「正式前置已綁定」標成完成。

## 驗收狀態

- 資源完整性與數值檢查：本輪重新執行，見 `docs/VALIDATION.json`。
- 接口引用、條件與自訂 JSON Schema：見 `docs/INTERFACE-VALIDATION.json`。
- 30 項 Python 單元測試、16 項 Node 單元測試與 TypeScript 宣告測試：見 `docs/TEST-RESULTS.json`；Node 的其中一項遍歷全部 177 外觀，不把它虛報成 177 項獨立測試。
- 重建一致性與原作資源回歸：見 `docs/REBUILD-REGRESSION.json`、`docs/A4-ASSET-REGRESSION.json`。
- Minecraft／bridge／Blockbench：NOT RUN；所有 `engine_accepted` 仍為 false。
- `schemas/asset-registry.schema.json` 是本專案自訂接口格式，**不是 Mojang 官方全部內容格式驗證器**。

## 剩餘工作

原模型缺口仍以 `docs/ASSET-COVERAGE.json` 為準：其他瓶裝飲品、雞尾酒、雪克杯、酒櫃、架子、吧檯／凳子、燈具、香薰、畫與告示板等仍未完整移植。手持／掉落／GUI 姿態、冰葡萄背包動畫、正式 JAR 對照和遊戲材質驗收也沒有因此完成。

接口完成度不等於素材完成度，更不等於可玩度。

## 來源與授權

Tavern 來源仍固定提交 `6b0d619145316492f055e03d70427107cd73efa8`，本轮没有新增或替換上游素材。原圖、模型和衍生預覽按 `LICENSE-ASSETS`；程式工具見 `LICENSE-CODE`。從 M0 沿用的 `tools/cookery_dependency.py` 另保留 MIT 的 `LICENSE-DEPENDENCY-TOOL`。外部 Minecraft 父模型參考仍按 `CREDITS.md` 分別記錄。包內不附帶字型、Cookery 安裝包或 Minecraft JAR。
