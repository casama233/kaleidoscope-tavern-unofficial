# 酒館 C6 伺服器修正版 0.6.2 — 差異與引擎除錯紀錄

> 基準：本倉庫 `runtime/`（上游 `6a860d09ecddccbf2352fbae5b64d650165aedda`，含 Batch 7 酒館桌與 Batch 8 吧檯）。
> 前一版：0.6.1（已部署於實際運營的 BDS 1.26.51.1 伺服器，與森羅物語：廚房 1.0.6 併用）。
> 本文件只記錄「伺服器修正版相對上游 runtime 的差異」與「以伺服器自帶 Content Log／腳本除錯得到的結果」。

## 1. 為什麼不是直接用上游 runtime

0.6.1 的伺服器修正不是可選項：穩定版 Bedrock API 與專用伺服器載入行為，和上游開發時的假設不同。0.6.2 必須重新套用同一組修正，不能以產生器覆蓋。

## 2. 相對上游 runtime 的差異

| # | 項目 | 內容 |
|---|------|------|
| 1 | `server-edition.patch` | 0.6.1 的修正差異原樣重套（上游 `runtime/` 與該補丁觸及的 64 個檔案零重疊，可乾淨套用）：原生載入、壓榨流程、合成配方解鎖、廚房餐桌支援、Molang 與環境光遮蔽欄位修正。 |
| 2 | 版本 | `0.6.1` → `0.6.2`（header、模組、跨包相依與顯示名稱一致），反映納入上游 Batch 7／8 內容。 |
| 3 | 相依識別碼 | 廚房依賴維持指向實際安裝的廚房包（BP `403f7a4a…`、RP `8f39983b…`）。 |
| 4 | 新配方解鎖資料 | 上游新增但缺少 `unlock` 的 18 個工作台配方補上解鎖項目：17 個沙發（以對應羊毛為解鎖）與酒館桌（鐵錠）。1.20+ 配方缺少解鎖資料會被引擎拒絕。 |
| 5 | 吧檯配方 | 上游吧檯配方缺少 `unlock`，以金粒為解鎖項目。 |
| 6 | `recipes/table.json` | 上游使用 `tag:minecraft:fences`，基岩版沒有這個物品標籤，整條配方被引擎判為無效並拒絕（Content Log 逐條報錯）；改為具體的 `minecraft:oak_fence`。 |
| 7 | `scripts/main.js` | 初始化訊息由 `Server edition 0.6.1.` 更新為 `0.6.2.`（避免日誌與實際版本不符）。 |

## 3. 引擎驗證（隔離 BDS ＋ 模擬玩家）

以伺服器自帶 Content Log 與 `@minecraft/server-gametest` 模擬玩家，在獨立的 Bedrock 1.26.50 實例、搭配正式服既有套件堆疊執行 11 項檢查，全部通過：

- **Batch 7 酒館桌**：放置、單桌起始狀態為 single、相鄰兩桌沿 X 軸自動連接。
- **Batch 8 吧檯**：放置、相鄰吧檯放置。
- **Batch 6 沙發**：放置、坐下（原生 rideable 載具）、潛行離座、回收為恰好 1 個物品。
- 執行期無家具錯誤（`furnitureDiagnostics.errors` 為空）。

伺服器啟動另確認：`[Tavern C6] Independent books and extension v1 initialized. Server edition 0.6.2.`，且部署後啟動日誌 0 ERROR。

## 4. 未涵蓋與待確認

- 真實客戶端（iOS／Android／Windows）的模型、坐姿、動畫與觸控操作未驗收；伺服器檢查不等同手機畫面已驗證。
- 模擬玩家不執行原生方塊放置，因此「由物品原生放置家具」未受測（家具放置由模組自身處理函式覆蓋）。
- 多人與長時間負載未測試。
- 隔離測試中曾觀察到酒館桌／吧檯在重啟後未出現在原座標（同批的動態屬性與其他方塊正常保留）；該測試世界的套件曾多次被覆寫，尚不能判定為模組缺陷，需在受控世界重測後才能定論。
- 上游缺少 `unlock` 的配方在本版由建置程序補上，屬於伺服器修正版的一部分；上游若修正，重套補丁時應同步移除本項。

## 5. 重現

```
git archive HEAD runtime | tar -x -C <build>
patch -p1 -i ../server-edition.patch           # 0.6.1 修正差異
python tools/build_server_edition.py           # 版本 0.6.2、補 unlock、修 fences 標籤
```

## 6. 0.6.3（上游 Batch 9–16 與 #42–44 之後的重建）

上游推進到 `c1a11a9`（Batch 9–16：酒窖櫃、畫作、吊燈等；指南併入廚房家族指南 #28/#33；瓶裝與飲用分離 #44 等）。0.6.3 相對上游 runtime 的差異：

- `server-edition.patch` 重套：上游改寫了 BP manifest 描述與 main.js 兩處橫幅字串，3 個 hunk 不再適用，由工具直接改寫（名稱、診斷版本串、初始化訊息）。
- 版本 0.6.2 → 0.6.3（內容大幅變更，不能與已部署的 0.6.2 同版本號）。
- 新增配方 unlock 補齊：77 個（17 沙發、酒館桌、吧檯、酒窖櫃、13 幅畫作等；shaped 以鐵錠／金粒／羊毛等推導，shapeless 取首個材料）。
- 上游以 Java 版物品 ID 命名兩種材料，本版 BDS 判為無效並整條拒絕：`minecraft:item_frame` → `minecraft:frame`（13+1 幅畫作），`minecraft:oak_trapdoor` → `minecraft:trapdoor`（酒窖櫃）。
- 創意目錄 `item_catalog/crafting_item_catalog.json` 的 group name 缺命名空間（schema 拒絕），補為 `kaleidoscope_tavern:tavern_main`／`tavern_deco`。
- 初始化訊息更新為 `Server edition 0.6.3.`。

正式服部署後 Content Log 對比：0.6.2 時代的 `TavernError: EMPTY_HAND_REQUIRED／SNEAK_TO_PLACE`、`FILL_BARREL_FIRST／SPACE_NOT_CLEAR`、`Not substituted: slightly_tipsy` 等執行期錯誤全部消失，無新增錯誤；酒館包腳本錯誤 0。

### 酒館桌重啟保留：最終引擎驗收已通過（並更正先前的誤報）

- **結論**：在同一隔離 BDS 流程完成「放置 → 停服 → 啟服 → 讀取」，`table`／`white_bar_stool`／`bar_counter` 三者皆在原座標，狀態完整保留：桌面 `kaleidoscope_tavern:axis=0`、`position=0`、`minecraft:cardinal_direction=east`（即 #46 改用的原生 trait），椅與吧檯的 `facing`／`connection` 亦保留。
- **更正**：較早記錄的「舊 Batch 7 表格重啟後變空氣」是**本地測試工具缺陷**造成的誤報——測試第二階段未等待區塊載入，未載入區塊的 `dimension.getBlock()` 回傳 `undefined`，斷言因此失敗；並非模組把方塊寫壞。因此該誤報不構成上游缺陷的證據，先前的失敗紀錄不應再被引用。
- 進行驗收的測試流程已修正：兩個階段都先等待測試區四角可讀取再斷言。
- 廚房指南章節（#28/#33）與伺服器修正版指南入口的相容性仍需在真實客戶端驗證（本版仍以 0.6.1 補丁的指南入口為準）。

## 7. 0.6.4（上游 d47f4ac 之後）

上游 `d47f4ac`（#45–#56：Depth Charge、Mojito/Screwdriver/Bloody Mary/White Lady 幾何同步、共用破壞與掉落路由、非潛行放置家具、World Liquor 可用的擴充 API、酒館桌重啟穩定 #46）。伺服器版差異與 0.6.3 相同一組（補丁重套、版本 0.6.3 → 0.6.4、77 個配方 unlock、Java 版物品 ID 改名、目錄命名空間），工具無須改動即可建置。

正式服部署後：兩包內容日誌 0 錯誤，酒館初始化訊息 `Server edition 0.6.4.`。
