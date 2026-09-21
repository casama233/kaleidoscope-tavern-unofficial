# Cookery v1.0.6 實包調查與酒館整合邊界

> **2026-09-21 現行結論：酒館是 Cookery 的附屬，不再把自己做成第二個「森羅家族宿主」。**
>
> 本文件已按目前 `main`（含 #28 Cookery 家族指南整合）重寫。舊版「酒館指南／配方書完全獨立」的結論已失效；保留它只會讓後續實作再次造輪子。

本報告根據使用者上傳並已雜湊鎖定的 Cookery 安裝包，不是只讀宣傳頁。

| 欄位 | 實際值 |
|---|---|
| 檔案 | `Kaleidoscope Cookery v1.0.6.mcaddon` |
| SHA-256 | `c589efb60277bea295ac12ef760d8f2c7e8af3ea62e809b320862bd786033351` |
| BP header UUID | `10f37ae2-9ccf-435f-b34b-0eec8191cd94` |
| RP header UUID | `c89dc8df-c3fc-4bc8-8bd0-527abba76681` |
| 兩包 header.version | `[1,0,6]` |
| BP Script 依賴 | `@minecraft/server 2.7.0`、`@minecraft/server-ui 2.0.0` |
| 註冊資料 | 215 物品、118 方塊；ID 清單在 `compat/cookery/observed-ids.json` |

這些是 header UUID，不是 module UUID；依賴版本來自內部 manifest，不從檔名推測。Tavern BP 目前硬依賴 Cookery BP `[1,0,6]`，所以「Cookery 不存在時仍維持另一套完整家族 UI」不是主要支援目標。

## 查閱的 Cookery 實際實作

`BP/scripts/api/extensionRegistry.js`：Cookery 自己的公開 recipe API。內建配方優先；附屬註冊只存在記憶體；透過 Script Event 握手，不要求跨包 import 私有模組。

`BP/scripts/api/guidebookExtensionRegistry.js`：公開 Guidebook Extension API v1。附屬指南透過 `guidebook_begin/chunk/end` 分段傳輸，有來源、revision、語言／分類與逾時管理；每次世界工作階段重新註冊。

`BP/scripts/events/guidebook.js`：Cookery 自己維護指南物品、玩家語言與已學配方，使用原生 `server-ui`。

實包還附 `documentation/KC_EXTENSION_API.md`、`KC_GUIDEBOOK_EXTENSION_API.md`；逐檔雜湊保存在 `compat/cookery/cookery.lock.json`。Cookery 原件不應被 Tavern 修改、vendor 或跨包私有 import。

## 目前 Tavern 已經做對的整合

### 1. 家族指南改走 Cookery Guidebook Extension API

`runtime/BP/scripts/core/cookery-guide-publisher.js` 是正確方向：它只實作公開的 Script Event 適配器，把 `COOKERY_GUIDE_PAYLOAD` 發布成 Cookery 原指南的一個 Tavern 章節，不覆蓋 Cookery UI。

#28 已把 Cookery 家族指南設為主要玩家入口，並把 Tavern 舊書從 Creative 主入口隱藏。這部分**不要再另造第三套指南**。

### 2. Cookery 版本／ID／API 契約有 source lock

`compat/cookery/cookery.lock.json`、`observed-ids.json` 應繼續保留。後續若升 Cookery 版本，先重新掃描／鎖定，再調整適配器；不要靠猜 namespace、UUID 或事件名。

### 3. 酒館獨有狀態機仍由 Tavern 自己實作

酒桶熟成、壓榨、Q1–Q6 精確酒瓶狀態、雪克杯 3 槽與時間窗口、特調 payload、酒架／酒櫃逐槽精確品質，都是 Tavern 的玩法語義。除非 Cookery 公開 API 明確支援同一資料模型，不能為「共用」而把這些資料硬塞進 Cookery recipe registry。

`transactions.js`、狀態鎖、精確回滾、Tavern 機器 store 因而屬於必要的附屬內核，不算重複造輪子。

## 目前仍然重複／過度設計的部分

| 區域 | 現況 | 結論 | 收斂方向 |
|---|---|---|---|
| 獨立 Tavern Guide UI | `bedrock/guidebook.js` + `core/guide.js` + 自己的語言／書籤／搜尋／server-ui | **明顯重複** | Cookery 指南作唯一正常入口；舊 Tavern 書只保留短期 legacy redirect，之後刪除獨立 UI |
| Tavern `guidebook` / `recipe_book` 物品 | manifest 已硬依賴 Cookery 1.0.6，但仍保留兩套書 | **重複入口** | 不再新增功能；舊世界兼容期只提示玩家使用 `kaleidoscope_cookery:guidebook` |
| Tavern Extension Host / Transport / SDK / Demo | `extension-host.js`、`transport.js`、`sdk/`、`examples/Tavern-Extension-*` 讓 Tavern 再成為一個附屬平台 | **對移植目標屬於 scope creep** | 凍結，不再擴張；沒有真實下游 consumer 前，不為它增加協議、UI、能力 |
| 動態 guide pages 綁 Tavern registry | 第三方 Tavern page 主要服務舊獨立書 | **與家族單一指南方向衝突** | 若未來真有 Tavern 下游附屬，應轉發到 Cookery Guidebook Extension API，而不是復活第二本書 |
| 通用放置／互動路由 | bottle/furniture 等多處自己攔截 `beforeEvents` | **高風險重複模式** | 每新增一種通用互動前先掃 Cookery 同類實作；能照宿主既有事件順序／元件模式就照，不再另造全域 router |
| 家具通用行為 | Cookery 實包已有 chair/cook_stool/table 家族，Tavern 也維護大套 placement/seat/connection 邏輯 | **需逐項對照後收斂** | Tavern 特有模型／狀態可保留；坐下、朝向、放置、回收、連接等通用規則優先照 Cookery 做法 |
| 方塊破壞回收 | 曾在各系統自行處理 | **已開始收斂** | #31 的共享 Survival drop/sound adapter 是正確方向；後續不要再做每方塊一套 break controller |

## 關於 Tavern 自己的 Extension API：不要誤砍，也不要再擴張

Cookery 的 `extensionRegistry.js` 是 Cookery 的 recipe 宿主；Tavern 現有 registry 還承擔 barrel / pressing / shaker 這些 Cookery 未證實理解的 recipe kind。因此不能只因名稱相似就直接以 Cookery registry 取代 Tavern 的內部配方查找。

但「內部需要 registry」不等於「必須維護一整套公開 Tavern 平台」。目前沒有已知正式下游附屬依賴 Tavern SDK，所以：

1. 保留內部 built-in recipe registry / lookup，服務 Tavern 自己的機器。
2. 凍結公開 `kaleidoscope_tavern:extension_*` 協議、SDK、demo，不再為移植工作增加成本。
3. 等真的出現需要擴充 Tavern 酒桶／雪克杯的第三方附屬，再決定是否恢復／精簡公開 API。
4. 玩家可見指南頁一律走 Cookery host；不要讓公開 Tavern API 成為第二本指南存在的理由。

## 接下來每個 Batch 的「不造輪子」檢查

新增功能前固定依序問：

1. Cookery 1.0.6 是否已有同類方塊／物品／交互？
2. 是否有公開 API 可直接註冊？有就用 API，不讀宿主私有檔。
3. 沒有公開 API 時，是否能照 Cookery 已驗證的 Bedrock 事件順序、元件、state、helper 生命週期實作？
4. 只有 Tavern 原作確實獨有的資料模型才建立新 core。
5. 不為「將來也許有附屬」先做 SDK、registry、UI、搜尋、書籤、傳輸層。
6. 所有共用互動優先一個共享 adapter，不允許各模組再各寫一份。

## 第一批建議收斂順序

1. **指南**：把獨立 Tavern guide 由 fallback UI 降成 legacy redirect，最後移除 `server-ui` 依賴（若確認其他模組未使用）。
2. **放置／飲用**：直接對照 Cookery placeable food 的真實事件路由，替換 Tavern bottle 的「潛行放置 + 原生飲用取消」特殊補丁；這是目前最容易互相打架的地方。
3. **家具**：對照 Cookery chair / cook_stool / table 的 placement、seat helper、回收、connection 做法，抽出 Tavern 真正不同的部分。
4. **公開 Tavern SDK**：凍結並移出 parity 主線；不再讓它影響指南、機器或測試優先級。
5. **破壞／聲音／掉落**：延續 #31 共用 adapter，將仍存在的 ad-hoc break 邏輯逐批併入。

## 測試與證據邊界

目前 Cookery Guidebook host protocol 已按 1.0.6 實包契約接入；Node／靜態測試不等於 Minecraft 客戶端、Realms 或 BDS 驗收。互動事件優先級、原生 food use、家具乘坐、材質／聲音仍需遊戲內驗收。

**總原則：Tavern 是 Cookery 家族的一個附屬內容包，不是第二個 Cookery。家族級能力由 Cookery host 提供；Tavern 只維護原作酒館真正獨有的玩法。**
