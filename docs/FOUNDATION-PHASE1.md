# 共用底層第一階段：酒櫃、外部效果與跨包交接

狀態：配對工作分支，不是新 Release。基準：酒館 `769585f7ad032137f3b78ce03308fb11e851f462`、世界名酒 `e7e808ca7124ad6e1641b373d6f07e9a29be19c3`。不修改既有發布請求，不覆蓋已發布資產，也不新增 player.json。

## 本次接管的範圍

酒館新增 `furniture_storage` 與 `external_effect_lifecycle` 能力。世界名酒提交 5 木種 × 2 型的 10 個家具定義，使用本體的 `barCabinetPut/Take`、`cellarCabinetPut/Take`、動態酒瓶分類器、姿態計算、`commitStoredStateTransaction`、互動快照及保護性破壞回收路由。第三個附屬只要正確註冊酒瓶描述與展示實體，不必再修改世界名酒的物品白名單。

世界名酒 14 種持續效果進入酒館的在線 ticks 狀態機；4 種瞬時效果仍交由世界名酒執行行為。附屬只讀本體推送的快照，供原有傷害、移動、回血等行為使用。喝奶、死亡、重生與離線計時由本體管理，附屬的舊資料及快照清理屬於交接／快取，而不是另一個持續效果引擎。本次不補冥視、寶藏感知等原本缺失的行為。

## 為何不是直接讀另一個包的動態屬性

動態屬性按行為包隔離。不能讓酒館直接讀到附屬原本的儲存，也不能讓附屬直接讀取酒館玩家狀態。本次以現有分片協議承載 `foundation_begin/chunk/commit`，原資料由所屬包讀出，本體校驗後保存，再回傳對應 revision 的 ACK。快照有來源、序號、分片總數與失效窗口；SDK 不讀其他包的 DP。

參考：Microsoft Learn，World.clearDynamicProperties 對行為包範圍的定義：
https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/world?view=minecraft-bedrock-stable

## 舊世界交接

1. **升級前備份整個世界，兩包配對使用。** 保留原有 BP/RP UUID。能力不符時附屬阻擋酒櫃操作，不退回舊交易程式。
2. 所屬附屬交出原始 JSON；酒館核對類型、槽數、物品、品質及特殊單瓶規則。未知內容、壞 JSON、類型錯位、消失的容器均不當空櫃處理。
3. 新內容與遷移回執寫入同一條本體屬性；只有成功回執才清理所屬包中仍與快照一致的舊資料。ACK 遺失可重試，已取出的酒不會被舊快照灌回。
4. 回收保留 tombstone，防止舊快照重放。展示成功後才清理舊附屬展示實體；區塊未載入不等同空氣。
5. 新放置先取得目標位置的附屬資料證明；異步交接後再次檢查手持槽、維度、距離與方塊。舊容器首次交接尚未完成時操作會安全失敗，可重試，不先扣材料。
6. 舊效果先把尚未到期的絕對期限轉成剩餘 ticks；遷移回執與效果保存在同一玩家屬性。清除操作會阻止遲到快照復活效果。

這不是可自動降級的存檔格式。遷移後不能只換回舊附屬繼續讀新資料；需要恢復升級前的完整世界備份。現有共用交易提供同步異常回滾，不聲稱跨世界存檔崩潰的 ACID 保證。

## 順便修正的接入阻塞

原附屬註冊 payload 為 215,810 UTF-8 bytes，已超過舊 192,000 bytes 上限；加入家具／效果描述後為 219,290 bytes。本體與 SDK 同步提升為有界 262,144 bytes、最多 512 分片，每包仍不超過 1,900 bytes，並增加完整 payload 實際組包／接收／註冊測試，而非只檢查 JSON 能解析。

地窖槽位的點擊座標正好為 1 時，改成 clamp 到最後一格，不再用 modulo 繞回第一格。

## 驗證與限制

執行：
```sh
LIQUOR_SOURCE=/path/to/kaleidoscope-world-liquor-unofficial \
node --experimental-loader ./tools/foundation/mock-loader.mjs \
  --test ./tools/foundation/foundation.test.mjs
python tools/check_release.py
```

本地 55 項 Node 腳本回歸通過，涵蓋獨立包 DP 空間、10 種酒櫃遷移、重放與 tombstone、寫入失敗、滿背包、切手、多人衝突、保護性回收、離線計時、喝奶、死亡、配對 SDK 與實際附屬效果快照。兩個專案的既有靜態檢查通過，原版姿態矩陣檢查仍保留。這些是確定性測試替身，不是 Minecraft 客戶端或 BDS 實測。

仍需配對客戶端驗收：多人同時操作、舊世界與重新載入、觸控與第三人稱、異步首次交接、展示實體恢復、混裝舊包時的阻擋提示。CI artifact 應查看 `TAVERN_COMMIT`／`LIQUOR_COMMIT`，不要僅憑既有版本號混用。

## 明確留待後續

冰櫃、唱片機、壁掛唱片、座位和食物仍保留其現有專用邏輯；其中的通用交易／機器匹配尚未全部接管。本次沒有補 Java 新玩法、改指南內容、加入新材質或發行新版本。舊展示資源、`visual-items.js`／`compact-items.js` 保留供歷史資源重建與相容檢查，但不再是酒櫃執行期的接納規則；重複的姿態執行模組已刪除。
