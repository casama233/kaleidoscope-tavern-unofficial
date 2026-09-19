# A9 接口契約

本檔的「接口」是**本專案的資源讀取與建置接口**。不是對方 Cookery 的公開 API，也不是已接上事件的 Bedrock 自訂元件。

## 核心 SDK

| 方法 | 返回／行為 |
|---|---|
| `createAssetRegistry(json)` | 驗證基本格式與重複／懸空綁定，深拷貝並凍結資料。 |
| `getVisual(key)` | 找到一個已轉換候選；含原始來源、模型／材質路徑和真實 Lab ID。 |
| `getIcon(key)` | 找到十個現有圖示之一；冰葡萄明確註記首幀展示。 |
| `selectVisual({family,state})` | 依下表匹配外觀，拒收未知狀態、缺參數、錯誤型別和超界值。 |
| `getByFixtureId(id)` | 反查實際 Lab ID，大小寫完全匹配。 |
| `blockVisual(key, context)` | 返回 world 的幾何／材質元件，或 inventory 的明確 item_visual；實體不允許冒充方塊。 |
| `catalog(locale)` | 產生唯讀離線目錄資料，配方欄為空；不注入任何 Guidebook。 |
| `resolveCookeryItem(alias,map,lock)` | 只解析被已檢查 Cookery BP 註冊的 ID；未綁定、未對照、捏造 ID 都報錯。 |

`blockVisual()` 回傳的是 JSON 描述，不會直接 `setPermutation()`，也沒有背包操作。SDK 不讀寫磁碟；完整檔案雜湊和路徑檢查由 Python 建置／驗證工具負責。`sdk/index.d.mts` 提供可編譯驗證的 TypeScript 宣告。

## 15 組狀態選擇

| family | state | 覆蓋數 |
|---|---|---:|
| sofa | color：16 色；shape：single/left/middle/right/left_corner/right_corner | 96 |
| bottled_drink | 全部25類；brandy/carignan/sunset_glow 的 count 為1–3，其他22類為1–4 | 97 |
| grape_crop | variant：normal/ice/gold；stage：0–5 | 18 |
| grapevine | variant：normal/ice/gold；form：四個 stage 或六種連接形狀 | 30 |
| trellis | form：single 或六種連接形狀 | 7 |
| barrel | lid：closed/open | 2 |
| tap | handle：closed/open | 2 |
| pressing_tub | pose：upright/tilted | 2 |
| wild_grapevine | section：tip/stem | 2 |
| empty_bottle | 空 state | 1 |
| cocktail | drink：emerald/screwdriver/depth_charge/mojito/signature_cocktail/mystery_cocktail/white_lady | 7 |
| shaker | 空 state | 1 |
| empty_glassware | 空 state | 1 |
| cabinet | type：bar_cabinet/glass_bar_cabinet/cellar_cabinet；shape：single/left/middle/right | 12 |
| rack | type：tilted_rack/circular_rack/glassware_holder | 3 |

共281種外觀；A9新增34個幾何候選，累積191份幾何。

A7 新飲品 ID：`rum`、`sherry`、`red_queen`、`vinegar`、`whiskey`、`miners_star`、`sauvignon_blanc_dry_white`、`sweet_berry_wine`、`sakura_wine`。

```javascript
api.selectVisual({family: "bottled_drink", state: {drink: "rum", count: 4}});
api.selectVisual({family: "empty_glassware"});
api.selectVisual({family: "cocktail", state: {drink: "screwdriver"}});
```

原作 Brandy、Carignan、Sunset Glow 只有1–3瓶來源；A9已全部轉出，接口及TypeScript型別均限制為1–3，四瓶明確報錯。其餘22類允許1–4。這些 state 名稱是接口參數，**不會自動讓沙發連接、葡萄生長或桶蓋開啟**。例如 barrel 的兩個選項仍對應兩個靜態展示實體。

## 報錯行為

- `NOT_PORTED`：不存在／未移植的物件或系列。
- `INVALID_STATE`：缺參數、多參數、類型錯誤、非法顏色或數量。
- `WRONG_BINDING_KIND`：企圖把展示實體當方塊。
- `UNIMPLEMENTED_CONTEXT`：尚未移植的顯示姿態。
- `DEPENDENCY_UNBOUND`：沒有實際檢查的 Cookery 身份。
- `UNMAPPED_EXTERNAL_ID`／`UNVERIFIED_EXTERNAL_ID`：沒有對照或對照內容不在已檢查包內。

不做隱藏降級：不會將 Vodka 映射成 Wine，不會把第五個瓶子截成第四個，不會猜一個 Cookery UUID。

## 建置整合

`build_assets.py` 先執行保留的 A4 資源建置，依序轉出 A6、A7、A8、A9 原作資源，再補舊方塊的物品外觀元件、修正 bridge type、提高自己的 manifest 版本，最後重新套用已驗證格式的 Cookery 鎖定資料。其他外部依賴版本不會一起升成 Tavern 版本。

只有實際 `--apply` 才會寫綁定；來源檔不會被執行。工具可攔截路徑逃逸、檔案重名、錯誤 UUID／版本、依賴回圈以及自我綁定。SHA-256 用於識別位元組，**不能認證下載者或作者身份**。

## 匯出門檻

`release_gate.py --profile lab` 可檢查資源引用。`--profile production` 列出未滿足條件並以退出碼2拒絕；本專案刻意沒有正式玩法包導出器，因此不能靠手改幾個旗標就得到「已完成的正式版」。這不限制使用者手動打 ZIP，只是防止正常工具流程誤標發行。

剩下未完成的 runtime 接口：Cookery Guidebook 注入、Cookery 工作站配方註冊、座位與容器事件、黑板文字顯示、動態酒瓶／液面和多人同步。它們沒有偽造空實作來假裝完成。

## A8 動態資源接口

`interfaces/dynamic-visuals.json` 保存三組材質動畫（逐幀原圖、32×32幀尺寸、幀序、frametime與插值開關）、特調的局部tint面對照，以及雪克杯PUT動畫。此檔是本專案的描述格式，不是可直接把所有欄位貼入Minecraft的官方schema。

`cocktail` 新增 `depth_charge`、`mojito`、`signature_cocktail`、`mystery_cocktail`，連同Emerald/Screwdriver共6款。新增無參數 `shaker` 選擇器。全部回傳唯讀外觀資料，沒有倒酒／混合／投料API。

```javascript
api.selectVisual({family:'shaker'});
api.selectVisual({family:'bottled_drink',state:{drink:'glowflower_brew',count:4}});
api.selectVisual({family:'cocktail',state:{drink:'depth_charge'}});
```

`interfaces/pose-candidates.json` 記錄獨立可選PoseLab，31份幾何／46外觀。主包未套用姿態，不把optional overlay算成runtime完成。特調tint槽位有對照但沒有任意RGB運行時接口。

## A9 新增範圍

全部25類瓶裝飲品均可查詢；三瓶上限沒有被擴成四瓶。White Lady已加入，但Grasshopper等七種未移植雞尾酒仍拒絕查詢。

```javascript
api.selectVisual({family:'bottled_drink',state:{drink:'brandy',count:3}});
api.selectVisual({family:'bottled_drink',state:{drink:'watermelon_juice',count:4}});
api.selectVisual({family:'cocktail',state:{drink:'white_lady'}});
```

A9亦修正了A8 TypeScript宣告未跟上其執行時範圍的缺口：螢花釀、流明新娘、雪克杯及A8雞尾酒現在都能通過型別檢查。接口不是玩法程式。
