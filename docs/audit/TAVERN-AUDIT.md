# Tavern 重構稽核與計畫（Phase 0，唯讀盤點）

> 狀態：草稿，供擁有者決策。本檔只新增文件，不改任何 runtime。
> 證據基礎：`AGENTS.md`、README、`runtime/BP/scripts/main.js` 全文、`.github/workflows/validation.yml` 全文、`runtime/BP/scripts/{bedrock,core}` 與 `tools/` 的檔案清單與大小。
> **尚未逐檔閱讀**各模組內部與各測試內容；標 `[待驗證]` 者是由結構推論，不是已證實事實。

## 1. 已證實的結構事實

### 1.1 腳本層

- `runtime/BP/scripts/` = `main.js`（10 KB）＋ `familyDisplayRules.js` ＋ `bedrock/`（56 檔）＋ `core/`（約 60 檔）＋ `data/`。
- **`core/`（純邏輯）與 `bedrock/`（引擎適配）的分層已經存在**，這是值得保留的好基礎。
- 但同名模組的大小比例失衡，顯示邏輯滲進適配層（`[待驗證]`）：

| 領域 | `bedrock/` | `core/` |
|---|---|---|
| machines | 35.8 KB | 7.3 KB |
| custom-effects | 25.1 KB | 8.8 KB |
| mixology | 24.9 KB | 7.5 KB |
| furniture | 22.3 KB | 10.9 KB |
| cultivation | 13.3 KB | 3.7 KB |
| bottles | 10.4 KB | 2.6 KB |

### 1.2 `main.js`

- 約 50 條 import，逐一手動呼叫 `register*Components(ev)` 與 `install*Events()`；啟動順序是隱含的（例如 `installNativeStoragePinning` 必須最先）。
- 每個功能模組都各自匯出一組不一致的 `register* / install* / *Diagnostics`，沒有統一介面。
- `diagnosticSnapshot()` 手動列舉約 40 個模組，並寫死了 `artBaseline: 'A17 (engine review pending)'`、`engineAcceptance: 'NOT_RUN_BY_AUTHOR'`。
- 程式碼風格是高度壓縮的長行（單行多條語句），沒有格式化，審查與除錯成本極高。

### 1.3 `tools/`

- 單一資料夾約 150 個項目，混放：
  - 資產生成腳本（`build_*.py`）與靜態檢查（`check_*.py`）
  - 遊戲邏輯測試（`*.test.mjs`，約 30 個）
  - **流程機器本身**：`family_*.py`、`release_claim.py`、`baseline_gate.py`、`baseline_reference.py`、`ci_impact.py`、`reviewed_changes.py`、`check_release.py`、`build_release.py`，以及約 15 個「測流程工具」的 `test_*.py`
- 生成腳本會改寫 `runtime/`，CI 用 `git diff --exit-code -- runtime/` 檢查「生成後沒有變動」：**runtime 同時是原始碼與生成產物**，有兩個真相來源。

### 1.4 CI（`validation.yml`，20.5 KB，12 個 job）

- 跨倉庫釘住大量 commit：Java 原作 `c4ec188…`、Tavern 基線 `cedfaed…` 與 `4aeb47d…`、World Liquor 至少四個不同提交（`d0866bb…`、`c2b7fe5…`、`e0cba77…`、`8a70ecd…`）。
- 多數 job 自己標註「不是客戶端／BDS 驗收」，且依賴各目錄的 `mock-loader.mjs`（"deterministic native API doubles"）。
- 上傳大量 `evidence/` 產物（保留 14 天）。
- **唯一用真引擎的是 `native-persistence`**（隔離 BDS 存檔／重啟冒煙，無玩家工作階段）——應保留。
- 因 `baseline_gate.py check --release` 與 `bridge_project.py --verify-export`，**任何 runtime 變更都要連動版本、UUID、鎖檔**；這讓重構幾乎無法在不跑儀式的情況下進行。

## 2. 診斷

1. **最大的結構債不是程式碼，是儀式。** runtime 的每次變動都牽動 baseline gate、family guard、release claim 與跨倉庫釘版，使重構成本遠大於收益，所以只剩補丁。
2. **啟動與接線是手工且無契約的**：50 個模組、三種函式命名、隱含順序、手動診斷表。
3. **適配層過胖**：重邏輯在引擎相依的檔案中，無法脫離遊戲測試（`[待驗證]`）。
4. **測試重心錯位**：大量 mock 測試與流程測試；真引擎只有一個存檔冒煙；玩家可見的畫面與手感沒有測試也沒有並排驗收流程。
5. **生成產物與原始碼混在 runtime**，使「改哪裡才算改了來源」不明確。

## 3. 要保留的

- `core/` 與 `bedrock/` 分層。
- runtime 直接提交（沒有生成器補丁鏈）。
- Java 原作釘版對照：`check_mixology_java_oracle.py`、`java-random-float.test.mjs`、`cocktail-recognition-source.test.mjs`、`instant-effect-source.test.mjs` 等（屬 A 類：期望值來自 Java）。
- `native-persistence` 真引擎存檔冒煙。
- 授權與署名檔案。

## 4. 目標結構

```
runtime/BP/scripts/
  main.js                 # 只呼叫 bootstrap()
  bootstrap/
    features.js           # 有序功能表（唯一接線處）
    lifecycle.js          # startup / afterStartup 統一排程
    diagnostics.js        # 由功能表自動彙整
  features/<領域>/
    index.js              # 實作統一介面
    core.js               # 純邏輯（不 import @minecraft/server）
    adapter.js            # 引擎橋接，越薄越好
    data.js               # 資料（由 Java 萃取）
  data/ ...
```

統一功能介面：

```js
export default {
  id: 'storage.holder',
  after: ['storage.native-pinning'],
  registerComponents(ev) {},   // 可選
  install(ctx) {},             // 可選
  diagnostics() {},            // 可選，供統一彙整
};
```

建議的領域切分（對應現有檔案）：

| 領域 | 現有檔案（bedrock/） |
|---|---|
| storage | holder、tilted-rack、circular-rack、bar-cabinet、cellar-cabinet、native-item-storage、native-storage-pinning、stateful-storage-router、storage-projectile、storage-visual-maintenance |
| machines | machines、tap-sources、cultivation、bottles、barrel-ingredients、pressing-* |
| mixology | mixology、shaker-screen |
| drinking | drink-completion、drink-effects、instant-effects、custom-effects、potions、effect-bar、effect-icons、effect-feedback、tipsy-visual |
| furniture | furniture、extension-furniture、decorations、writing-boards、board-text、display-projectiles、vanilla-bottle-displays |
| guide | standalone-guide、（core/）cookery-guide-publisher |
| feedback | break-feedback、natural-break、pickup-feedback、pickup-overflow、interaction-particles、java-ambient、immersion |
| extension | extension-host、foundation-bridge |
| combat | combat-effects、molotov |

`tools/` 重整為 `tools/{build,check,test,release,family}/`，並把「流程機器」獨立出主要開發路徑。

## 5. 重構順序（絞殺式，每步行為不變）

| 步驟 | 內容 | 風險 | 前置條件 |
|---|---|---|---|
| R0 | **擁有者決策**：如何處理 baseline gate／版本鎖（見 §6） | 高 | 擁有者批准 |
| R1 | `main.js` 改為功能表驅動；先不動任何模組內部；保持現有啟動順序 | 低 | R0 |
| R2 | 格式化（單獨一個 commit，零語意變更） | 低 | R0 |
| R3 | 依領域把適配層邏輯下沉到 `core.js`，每個領域搭配 A／B 類測試（期望值來自 Java 或不變量） | 中 | R1 |
| R4 | `tools/` 重整＋CI 瘦身（目標 ≤4 個 job：build+static、unit、native smoke、release） | 中 | R3 |
| R5 | 移除流程儀式（family guard、release claim、跨倉庫釘版）改為單純 CI | 中 | 擁有者批准 |
| R6 | 視覺軌：校準場、並排驗收矩陣、雙邊渲染比對 | — | 並行 |

## 6. 需要擁有者決策

1. **baseline gate 怎麼辦？** 任何 runtime 變更現在都會被它攔住。選項：(a) 重構期間在 `refactor/*` 分支暫停此檢查；(b) 先簡化 gate 再重構；(c) 重構完再一次性重新鎖定基線。
2. **是否同意把儀式（family guard／release claim／跨倉庫釘版）降級為部署記錄，不再當驗證？**
3. **公開版與私有部署版是否合併為同一份原始碼？**
4. **真引擎測試政策**：維持「不用模擬玩家」，僅保留現有 `native-persistence` 存檔冒煙；除非另外批准，不新增 C 類互動測試。

## 7. 下一步（本分支）

- 開 draft PR 觀察 CI 對「僅文件變更」的反應，確認 baseline gate 的邊界。
- 取得 R0 決策後，從 R1（`main.js` 功能表）開始。
