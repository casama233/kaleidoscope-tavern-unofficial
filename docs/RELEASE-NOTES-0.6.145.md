# 0.6.145：原生 use 事件副本缺值時的手持雪克杯辨識

本版修正一個只在實機事件語意下出現的調酒缺陷：`captureShakerHand`、搖晃停止與
清除手勢原本要求 **native use 事件的 ItemStack 副本** 必須回報與實際手持物品相同的
`kaleidoscope_tavern:shaker_data`。若引擎副本沒有帶該動態屬性值，主手事件會直接
`STALE_HAND`，雪克杯完全無法開始或完成搖晃；此設計自 T131 引入，最後一次真人確認
雪克杯是 T106，mock 回歸無法覆蓋事件副本語意。

live 2026-10-10 主控台在 09:27 與 10:46 出現 11 次 `[Tavern Mixology] STALE_HAND`
（前幾日 session 為 0 次），且 live 酒館 BP 與 T143 收據逐檔相同，不是檔案漂移。
隔離引擎探針另確認可堆疊物品不可設動態屬性、帶名牌可堆疊原料與純藥水在見證邏輯
下不受影響，因此把辨識來源改回實際手持物品。

## 修改

- `shaker-hands.js`：新增 `matchesReportedShaker`（副本未回報值時只比對 typeId／數量）、
  `liveShakerStack`（兩手都有雪克杯時不回傳，維持不猜測）與 `reportedShakerData`
  （副本未回報值時取實際手持 dp）。`captureShakerHand` 改用前者的嚴格規則：
  **副本有值時比對值**，未回報值時才落到實際手持；兩手相同雪克杯仍
  `AMBIGUOUS_SHAKER_HAND`。
- `mixology.js`：`nativeStop` 在副本缺值時以 `sameUse` 已驗證過的實際手持物品取值；
  `clearHeldShaker` 對缺值副本只比對 typeId／數量；`beforeShakerUse` 缺值時讀
  `liveShakerStack`，找不到實際雪克杯仍取消。
- 未動 T141 的見證／echo 防線：block-use 快照、`verifySnapshot`、`sameItemSnapshot`
  與 `completedBlockUses` 全部保持原樣。

## 回歸

`tools/shaker-offhand.test.mjs` 追加 6 個案例（缺值副本仍可完成搖晃、兩手雪克杯缺值
時拒絕、實際手持被換掉仍取消、缺值副本的清除手勢、`beforeShakerUse` 缺值時信任實際
手持、副本有值仍須逐值相符）；`tools/shaker-item-retention.test.mjs` 與
`tools/universal-mixology.test.mjs` 維持通過。這些是靜態／mock 證據，**不是**實機
事件語意或真人畫面驗收。

## 尚未完成

副本「有值但與實際手持不同」的實機情況、真正客戶端的搖晃進度／音效／倒出畫面、
觸控與手把、以及 `[Tavern C2] SPACE_NOT_CLEAR` 所屬的放置情境仍需真人確認。
