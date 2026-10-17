# Cookery v1.0.6 實包調查與酒館整合邊界

本報告根據使用者上傳的安裝包，不是只讀宣傳頁。

| 欄位 | 實際值 |
|---|---|
| 檔案 | `Kaleidoscope Cookery v1.0.6.mcaddon` |
| SHA-256 | `c589efb60277bea295ac12ef760d8f2c7e8af3ea62e809b320862bd786033351` |
| BP header UUID | `10f37ae2-9ccf-435f-b34b-0eec8191cd94` |
| RP header UUID | `c89dc8df-c3fc-4bc8-8bd0-527abba76681` |
| 兩包 header.version | `[1,0,6]` |
| BP Script依賴 | server2.7.0、server-ui2.0.0 |
| 註冊資料 | 215物品、118方塊；ID清單在 `compat/cookery/observed-ids.json` |

這些是header UUID，不是module UUID；依賴版本來自內部manifest，不從檔名推測。C1 BP依賴Cookery BP＋C1 RP；C1 RP依賴Cookery RP。Cookery原件從未修改。

## 查閱的實際實作

`BP/scripts/api/extensionRegistry.js`：公開 recipe API，內建配方維持優先；附屬註冊放記憶體中的map，不改原始配方表；Script Event握手，不跨包import私有檔案。

`BP/scripts/api/guidebookExtensionRegistry.js`：独立指南內容通過begin/chunk/end傳輸；有分段、逾時、來源標記、語言和分類。每次世界工作階段重新註冊，不把附屬頁永久塞入存檔。

`BP/scripts/events/guidebook.js`：自有指南物品与玩家語言、已學配方資料；使用原生server-ui表單。未發現RP全域JSON UI覆蓋目錄。

實包還附 `documentation/KC_EXTENSION_API.md`、`KC_GUIDEBOOK_EXTENSION_API.md`，以上參考文件逐檔雜湊已保存。**未把整段Cookery來源貼進酒館，也未跟發行包重散布Cookery程式。**

## 酒館採用什麼，哪些不共用

沿用跨包Script Event、內建优先、重啟重新註冊、分段及來源管理這些思路。酒館自行實作API1的整包驗證、ACK、FNV傳輸檢查、上限及重送SDK。

不共用指南資料庫、不讀寫`kc:guidebook_language`或`kc:known_recipes`，也不向 `kaleidoscope_cookery:register_recipe`／`guidebook_begin/chunk/end` 發送內容。酒館只發送Cookery `api_ping`並觀察`api_ready`，供診斷確認腳本握手；實際套件依賴仍由manifest處理。

酒館的`kaleidoscope_tavern:guidebook`和`recipe_book`、語言／書籤、頁面及附屬API都完全獨立。**前置依賴與指南獨立不衝突：沒有移除Cookery前置，也沒有讓酒館書成為Cookery書的一個分頁。**

跨包食材按已註冊ID使用。核心23種酒配方按來源保留，沒有因依賴Cookery就亂改原配方。附屬API可指定真實Cookery材料；測試使用已查明的 `kaleidoscope_cookery:rice` 作為測試附屬原料，不預設加入正式平衡配方。

## 測試結果的證據邊界

本輪在Node模擬事件環境中，只讀載入上述Cookery配方API及指南API模組，酒館SDK與它們同時訂閱同一個事件總線。握手可被觀察；新增酒館配方與頁面後，Cookery對外列出的配方／指南未變。

**不是完整Cookery啟動，也不是Bedrock遊戲相容性測試。** 真實Cookery其他世界事件、資源包疊放、手機表單以及遊戲版本仍需實機驗收。所有結果在 `TEST-RESULTS.json` 保留這個範圍。
