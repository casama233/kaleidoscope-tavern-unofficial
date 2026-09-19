# A17 → 程式實作：交接規格與開工門檻

## 本次凍結的是什麼

凍結**使用者上傳JAR的原始美術與已轉換的靜態資源／動態測試層**，不是凍結所有尚未驗收的引擎行為。來源、圖集、模型ID、顯示參數與純邏輯接口可以開始被程式引用。不要再一個顏色、一個PNG零碎重抓。

`docs/ART-READINESS.json`是狀態入口，`docs/A17-ALL-SOURCE-COVERAGE.json`是1295份原件逐件去向；`source-jar.lock.json`與`neoforge-source.lock.json`負責來源驗證。原A1–A16素材不覆寫，新JAR圖庫另放一層，避免因JSON排版或PNG編碼變動誤判版本差異。

## 必須維持的邊界

本包的`kt_assets_a*`是歷史外觀實驗室ID，不應直接變成所有正式玩法ID。下一階段新增正式`kaleidoscope_tavern`行為包，以映射表引用幾何／材質，保持VisualLab用於回歸；不要一次批量重命名全部舊ID使舊測試世界損毀。

Cookery依然是production必需前置；真實基岩安裝包尚未取得。只能從真實BP/RP的header.uuid、header.version讀取，不能用Java Tavern JAR代替，不從展示版本字符串猜內部版本。未綁定時不得生成宣稱正式整合的release。

`1.26.50`是此專案沿用的格式，不是本文件重新查证的最新正式版。填腳本manifest以前必須在目標遊戲實測可用的stable Script API與容器／方塊資料元件；不要複製早期聊天裡互相矛盾的API版本結論。

## 資源入口

| 入口 | 實際用途 |
|---|---|
| `interfaces/asset-registry.json` | 491外觀、92測試圖示、幾何／材質檔、真實測試ID |
| `interfaces/item-art-map.json` | 原作158個具體物品：76模型／82圖示；2模板另列 |
| `interfaces/blockstate-art-map.json` | 原作159份方塊狀態引用；不等於自動放置已實作 |
| `interfaces/board-orientations.json` | 14板類×16方向的原作旋轉，對應藝術測試事件 |
| `interfaces/texture-animations.json` | 10原作動畫序列、時間、幀槽與插值，不能把重複幀刪掉 |
| `interfaces/particle-art-map.json` | 16粒子、來源圖片及每項偏差／繼承物理限制 |
| `interfaces/sound-art-map.json` | 4音效事件、6原OGG與字幕鍵 |
| `interfaces/runtime-visual-hooks.json` | 液位、特調顏色、板類、文字、手持、櫃內展示總入口 |
| `interfaces/source-render-anchors.json` | 原渲染器槽位／文字平面的角度、位置、尺寸 |
| `interfaces/shaker-hand-source.json` | 真正的搖杯使用曲線與啟用條件；不是草叢隱身動畫 |
| `sdk/index.mjs` / `.d.mts` | 唯讀資源選擇SDK，JS与TS均覆蓋新家族 |
| `sdk/visual-state.mjs` / `.d.mts` | 不依賴Minecraft的視覺數學函數，可直接單測 |

## 可執行的純函數示例

```js
import { createAssetRegistry } from './sdk/index.mjs';
import { liquidFrame, boardRotation, rgbProperties, shakerSourcePose } from './sdk/visual-state.mjs';

// registryDocument由建置時匯入的asset-registry.json提供；SDK本身不讀檔。
const api = createAssetRegistry(registryDocument);
const board = api.selectVisual({family:'decorated_board',state:{variant:'allium'}});
const chalk = api.selectVisual({family:'chalkboard',state:{size:'large'}});
const light = api.selectVisual({family:'string_lights',state:{color:'yellow'}});
const liquid = liquidFrame('pressing_tub',500); // y=.25格，寬=.75格
const facing = boardRotation(4);                // 90度，kt_art:rotation_4
const color = rgbProperties(192,64,128);        // 嚴格0..255整數
const hand = shakerSourcePose(20.5,'right',true);// 來源ticks+partial，不是秒
```

以上函數不觸碰背包、世界、網路、存檔；不能把「單元測試通過」寫成「機器已可玩」。

## 動態資源接入規格

**液位：** 原作酒桶capacity4000mB，液面y=`2 + .65*(amount/4000)`格、寬1格；壓榨桶capacity1000mB，y=`.125 + .25*(amount/1000)`格、寬.75格。`amount=0`時整個面不可見。數值是源模型局部座標，生成實體時要套機器核心與朝向。12個測試entity的`kt_art:amount`為client_sync整數；`kt_art:level_0..8`只供驗收，正式程式可更新實際amount。不能把32格視為4000mB後搞混模型單位。

**告示牌：** 14種完整組合均支持原作16方向的native art事件，每方向22.5度；這不會替你生成上下兩格collision或在破壞時同步拆除。方塊結構和可編輯文字分開設計。

**特調顏色：** 玻璃和液體共兩個幾何／控制器。只能染色原作指定26個面，不要整杯染色。`kt_art:red/green/blue`各0..255。6幀sprite候選由UV動畫控制，未做引擎透明排序與插值驗收。

**粒子：** 16個JSON已存在，不必再找原圖。小粒子與螢火蟲步進按JAR常數轉寫，但RNG序列不保證Java／Molang一致。其餘大型粒子的原版Minecraft基類不在mod JAR，基礎quadsize／加速度要由下一輪渲染適配補齊，檢查預設不可宣稱完整原作效果。Java滴落貼圖用Bedrock原生atlas代替是顯式的跨版本差異；懸掛→掉落→落地子粒子、每tick流量由code/emitter adapter連接。

**手持與物品GUI：** 原作item JSON並不全都等同放置模型；76個專用幾何與82個圖示按map引用。PoseLab包含來源提供的數值，不代表兩端的手坐標約定完全一樣。動畫item圖示目前只有首幀，正式animated attachable/GUI方案仍須原型。不要用單張伸長貼圖敷衍動畫。

**文字：** 原字體不打包。使用遊戲可用字體／UI渲染機制，根據source anchors校正對齊、換行、發光、色彩、字數／行數限制。小黑板maxwidth63，大232，11行、行高12、scale.012；告示牌寬55，8行、行高10、scale.01、bold。這是Java渲染空間，不是直接傳給實體的世界座標。任意中文文字的場景渲染目前仍是重要原型門檻。

**指南與本地化：** 4份Ponder原件只保存來源，不是BedrockGuidebook。en_US/zh_CN/ja_JP/ru_RU已保留原值；原Java鍵型態不必原封不動用作正式Bedrock物品名，應由build產生映射；人工zh_TW校正單獨排期。

## 實作順序與每階段出口

| 階段 | 工作 | 必須驗證後才往下走 |
|---|---|---|
| M0-A 引擎美術載入 | 在目標Bedrock載入A17，查ContentLog；代表性塊／实体／物品／粒子／聲音／动画分别检查 | 不因缺component／幾何格式／錯誤Molang而整包跳過；實際渲染記錄 |
| M0-B 前置／資料層 | Cookery真實綁定；一個測試機器state保存／讀回／版本遷移 | 退出重進、區塊重載、多人讀寫正確；未依賴不可用實驗元件 |
| M0-C 物品交换 | 單件消耗、產出空間預檢、失敗回退、原ItemStack保真、創造模式規則 | 16空桶裝一次後仍剩15空桶＋1成品；滿背包不吞物；同tick兩玩家不雙領 |
| M1 葡萄酒閉環 | 葡萄取得→壓榨→果汁轉移→酒桶發酵→品質→取酒→飲用返瓶 | 所有消耗／產量／持久化正確，資料變化同步驅動模型液位 |
| M2 釀造／調酒擴充 | 全量已完成美術對應成品、效果、可擺放、多瓶、雪克杯 | 不啟用沒有成品輸出的配方；品質堆疊不丟資料 |
| M3 家具／文字／指南 | 座位、相鄰连接、展示庫存、文本、指南、自动粒子与照明 | 拆除清理、載入重建、手機操作、多人同步、Realm/BDS逐一實測 |

## 必須先修掉舊原型問題

最初v0.1使用替換整個手持欄位的helper會丟掉剩餘空桶；建立新ItemStack只保存ID/count會吞掉原物品資料；多方塊各部分排程拆除容易重複掉落。不要把這些舊helper搬進正式code，再因美術已齊就假設它可用。

保存層應抽象`load/save/migrate/remove`，實際元件和最大容量依目標API測試決定。大黑板長文與小機器狀態不可共用一個毫無容量檢查的欄位。

## 完成狀態用語

可以寫：完整JAR來源盤點；靜態家族與item資源資料已就緒；動態渲染測試層可開始接程式。
不能寫：全部視覺100%還原；已支援Realms；Achievement Friendly已驗證；Cookery已綁定；只剩灌JSON就完成。

目前production匯出被真實前置、渲染適配、玩法與引擎驗收条件阻擋。這是發布門檻，不阻擋開始正式實作。
