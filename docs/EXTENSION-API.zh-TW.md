# Tavern Extension API v1 — 附屬作者入口

本接口只管目前真正實作的能力。**它不是Cookery擴充API，也不要求把頁面注入廚房指南。** 指南與實際機器都讀酒館同一份registry。

## 一、分包方式

附屬是單獨BP。依賴酒館BP header UUID `f54f37f9-485a-55bf-8f89-6558aca988c5`、version `[0,1,0]`，以及`@minecraft/server 2.7.0`。有自己的新貼圖／模型才另附RP；單純添加配方／指南不需要新RP。

完整可用範例在 `examples/Tavern-Extension-Demo/BP`，可獨立匯入。自己的附屬必須產生新的BP/module UUID；不要保留示範UUID。

把公開的三個SDK文件複製進自己的 `scripts/sdk/`：`tavern-extension-client.js`、`protocol.js`、`util.js`。它們只處理公開資料與訊息，不匯入核心BP私有程式。型別宣告可使用 `sdk/tavern-extension-client.d.ts`。

```javascript
import {system} from '@minecraft/server';
import {registerTavernExtension} from './sdk/tavern-extension-client.js';
const registration = registerTavernExtension(system, {
  api: 1,
  source: 'my_tavern_addon',
  version: '1.0.0',
  recipes: [{
    id: 'my_tavern_addon:apple_press',
    kind: 'pressing',
    input: ['minecraft:apple'],
    fluid: 'kaleidoscope_tavern:grape_juice',
    amount: 250,
    title: {zh_TW: '測試用蘋果壓榨', en_US: 'TEST: apple press'}
  }],
  pages: [{
    id: 'my_tavern_addon:about',
    title: {zh_TW: '我的酒館附屬'},
    body: {zh_TW: '測試配方：4個蘋果壓榨成1桶葡萄汁。這是示範，不是原作配方。'},
    recipeIds: ['my_tavern_addon:apple_press']
  }]
});
```

上面的範例僅說明如何擴充，不自動安裝。自己的真實食材及產物必須先由Bedrock載入；主機會用ItemTypes確認ID存在。

## 二、實際能力

`api_ready`公開：`barrel_recipes`、`pressing_recipes`、`guide_pages`、`recipe_auto_pages`、`atomic_extension_replace`、`chunk_transport`、`acknowledgements`。

目前不支援新增真正流體註冊、自訂槽數工作站、雪克杯配方、任意效果脚本回呼或任意可執行程式碼。不要把未公布的字段當作這些能力存在。

### 酒桶配方

```json
{
  "id": "my_tavern_addon:rice_test",
  "kind": "barrel",
  "fluid": "minecraft:water",
  "ingredients": [["kaleidoscope_cookery:rice"]],
  "carrier": "kaleidoscope_tavern:empty_bottle",
  "unitTime": 2400,
  "noIngredientCount": 16,
  "output": {"byQuality": [
    "kaleidoscope_tavern:wine_q1", "kaleidoscope_tavern:wine_q2",
    "kaleidoscope_tavern:wine_q3", "kaleidoscope_tavern:wine_q4",
    "kaleidoscope_tavern:wine_q5", "kaleidoscope_tavern:wine_q6"
  ]},
  "title": {"zh_TW": "測試用米釀造"}
}
```

`ingredients`最多四槽，每槽是「可擇一的物品ID陣列」，不是同時要求陣列內所有物品。槽位順序不重要，但重複要求會按數量匹配；使用回溯配對，不是容易錯配的貪心算法。空陣列代表無原料，仍要4000mB液體。

`output`只能二選一：`{"item":"namespace:id"}`表示不隨品質換ID，或`byQuality`剛好六個ID。每次接酒消耗一個carrier，產一個輸出。單一item不能同時提供byQuality。`unitTime`20–72000tick，`noIngredientCount`1–16；有原料時取最少一槽數量，最多16。已啟動批次保存輸出快照，附屬後來移除不會把釀好的產品變成別的配方。

可引用外包已存在的普通物品，但機器拒收有自訂名稱、附魔、損耗或附加資料的實例，不會把這些資料靜默刪掉。自訂新飲品的物品定義／貼圖及消耗效果由附屬自己提供。

### 壓榨配方

`input`為1–16種擇一的普通物品ID。`amount`1–1000且必須整除1000，避免產生不能裝桶的分割餘數；每次跳踩消耗一件。總容量仍是1000mB。

### 現有液體識別碼

`kaleidoscope_tavern:grape_juice`、`ice_grape_juice`、`gold_grape_juice`、`green_grape_juice`、`sweet_berries_juice`、`glow_berries_juice`，以及`minecraft:water`。所有自訂果汁ID都帶前面的完整namespace。填入不存在的液體會拒絕整包，不是假裝建立流體。

六種果汁有液面helper；水面渲染目前未接。移除附屬前先清空依賴其特殊壓榨配方的機器，尤其非整桶液體；C1無管理員清空／遷移UI，保留存檔備份。

### 指南頁

每頁有自有`id`、`title`、`body`的locale map，支援`zh_TW`、`zh_CN`、`en_US`；可選`recipeIds`最多32個、`icon`為自己的`textures/...`路徑，不含副檔名、URL、`..`。自有圖示要由附屬RP提供，主機不保證圖像引用真的可顯示。

頁面只能連到本bundle配方或內建配方；不建立對另一個可移除附屬的隱藏依賴。頁ID和配方ID也不能相同，避免指南索引碰撞。書的搜尋、分頁及書籤由酒館提供，Cookery的語言與已學配方完全不動。

## 三、優先與生命週期

內建配方永遠優先；不同附屬依source字典序、配方依ID字典序排列。相同原料的兩個附屬會有固定先後，不由載入時機決定。相同source再次註冊會**整包替換**原recipes和pages；不是追加。驗證有任一錯誤則全部拒絕，舊bundle保留。

附屬source2–48字元，只允許小寫字母起頭加數字／底線；不能用`minecraft`、`kaleidoscope_tavern`、`kaleidoscope_cookery`或保留字。自有recipe/page ID必須屬於自己的source。這些是合作命名規則，不是密碼學身份驗證。

註冊只存在當次runtime，不永久保存到世界。重載後各附屬重新註冊，已卸載附屬不會留下過時頁面。書籤可以保留ID，但不存在的頁面不顯示。已開始的酒桶仍保存數量與輸出快照；缺少輸出物品包時停止取酒，保留計數。

## 四、傳輸與回覆

公開事件都以`kaleidoscope_tavern:`為前綴：

| 事件 | 方向 | 作用 |
|---|---|---|
| `api_ping` | 附屬→主機 | 要求能力宣告 |
| `api_ready` | 主機→附屬 | API版本、能力、封包上限 |
| `extension_begin` | 附屬→主機 | source、revision、分段數、bytes、digest |
| `extension_chunk` | 附屬→主機 | source、revision、index、data |
| `extension_commit` | 附屬→主機 | 要求完整驗證及登記 |
| `extension_ack` | 主機→附屬 | 成功或失敗碼 |
| `extension_unregister` | 附屬→主機 | `{api:1,source:"my_tavern_addon"}`，移除當次runtime資料 |

僅接受Server-origin Script Event。玩家或command-block-origin訊息不作註冊；**這不防止惡意已安裝的伺服器脚本／管理員偽裝source**，只安裝信任的附屬。FNV digest只做傳輸完整性核對，不是簽名或加密。

成功ACK的`revision`原樣回覆呼叫者的傳輸revision，`registryRevision`另給主機計數；兩者不混用。失敗ACK有`ok:false`及`code`，可能包含source/revision。SDK只接受與自身source、revision匹配的Server回覆。

每封包上限**1900 UTF-8 bytes**；整包上限**48000 bytes**、最多64段。16個待組裝傳輸；TTL600tick；每tick最多256個傳入處理。每附屬最多128配方＋64頁，全域最多64附屬、2048條記錄。SDK每tick至多送4段，缺ACK時預設最多重試3次；長篇文檔不要整本一次塞入body。

可乱序到達，但段索引與內容須一致。相同段重送不重複累積，不同內容的重覆段拒绝。缺段、錯誤digest或不合法資料都不能半註冊。

重要錯誤碼：`API_VERSION_MISMATCH`、`FOREIGN_NAMESPACE`、`UNKNOWN_ITEM`、`UNKNOWN_FLUID`、`UNSUPPORTED_RECIPE_KIND`、`DUPLICATE_RECIPE`、`DUPLICATE_PAGE`、`PAGE_RECIPE_ID_COLLISION`、`MISSING_CHUNKS`、`DIGEST_MISMATCH`、`NO_PENDING_TRANSFER`、`PACKET_TOO_LARGE`。

`registration.registered`只有收到成功ACK才為true。`.dispose()`停止SDK監聽／重送，不等於主機移除bundle；需要當次卸載就發送`extension_unregister`。重新啟用需要新的client實例或重載世界。

## 五、測試與相容性聲明

示範BP、Cookery API模組、酒館host已在Node模擬事件總線中聯測，包含新增配方真正走完酒桶adapter。**未在Minecraft引擎、Realms、BDS或手機執行。** 實機驗收前不要把API1視為永久凍結的發布承諾；若將來有不相容變更，使用新API版本及能力宣告，不默默改現有schema。
