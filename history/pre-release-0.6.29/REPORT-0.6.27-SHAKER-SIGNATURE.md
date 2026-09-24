# 0.6.27 雪克杯、特調雞尾酒與分類

## 雪克杯排查及修改

已掃描正式服整個資源包堆疊：`kaleidoscope_tavern:shaker` 只有酒館的一個 attachable 定義；沒有發現另一個同 ID 的手持資源覆蓋它。桌面短動畫助手與手持模型使用不同的實體／幾何 ID。舊 native_shaker controller 不在發行包內。

本次移除 v26 的 hand_anchor → grip → root → bone2 層級與 +24 動畫補償。原始五個立方體直接放到一個綁定骨骼中，pivot 為 `[0,24,0]`，把桌面模型 Y 座標平移 16，使杯身握持中心位於 Y=24。採用 [Mojang 原版 trident 幾何](https://github.com/Mojang/bedrock-samples/blob/main/resource_pack/models/entity/trident.geo.json) 的綁定結構。另使用酒館專屬 render controller 與明確玩家 item 綁定。握持與晃動仍使用原有 Java 動作資料；不再以動畫把桌面模型抬到手上。

沒有實機客戶端可確認本次位置。此前多輪腳邊／不可見問題已證明僅載入成功不等於手持效果正確，本次仍不宣稱視覺驗收通過。

## 特調雞尾酒

- Java `ColorUtils.mixColors` 排除 RESET，只對有效顏色做 RGB 整數平均。修正無顏色標籤的擴充原料先前被當作白色的情況；藥水保留 Java 規則中的白色。
- `signature_cocktail` 放置助手原本對 32×192 動畫長條做 UV 縮放，現在拆為六個真正的 32×32 幀，以原作每 2 tick 一幀切換，幾何 UV 不再縮放。
- 玻璃和液體保持分開的幾何／render pass。只有液體乘上儲存的 RGB，材質改為單面 alpha test，對應 Java cutout。
- 圖標原先僅讀 Java layer0，缺少 layer1。現在用原作玻璃圖與液體圖合成預設藍色圖標，再提供 Bedrock dye-mask TGA，讓調酒結果的 RGB 寫入 ItemDyeableComponent；拿取放置酒杯也帶回同一顏色資料。
- 創造欄位取出的特調酒沒有 payload 時，使用 Java 預設色 `0x5555ff` 與空效果，不再因 COCKTAIL_SCHEMA 拒絕使用。
- 舊背包物品選到手上時依其既有 payload 補上染色顯示；不改已有酒效和材料記錄。無記錄的舊特調酒方塊建立預設資料，使其能恢復顯示。
- 染色接口依 [Microsoft ItemDyeableComponent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/itemdyeablecomponent?view=minecraft-bedrock-stable) 與 [自訂物品染色說明](https://learn.microsoft.com/en-us/minecraft/creator/documents/addcustomitems?view=minecraft-bedrock-stable) 實作；手機端圖標染色仍需實機驗收。

## 創造分類

已讀本體 Cookery 的正式分類慣例：作物在 Nature，工具、設備、收納、家具、飲食在 Equipment。本版酒館依此安排：自然 12 項、裝備 148 項；保留酒館自己的分組識別，避免混入廚房分類。

## 檢查

只執行資源／腳本／包檢查和實際 BDS 載入，沒有模擬互動測試。打包已確認單骨骼五立方體、六張動畫幀、TGA 圖標及染色組件都實際存在。隔離服日誌：`/tmp/bds-v27-load.log`；第三方既有錯誤需與酒館區分。最終 Android 畫面尚未驗收。

## 正式部署結果

已備份並安裝至 luosen，伺服器 RUNNING，正式啟動無 ERROR 行。逐檔核對 BP 708 檔、RP 2284 檔皆與建置一致。存檔及其他模組未改。備份：`/root/bsm-family-unification-20260923/luosen-before-20260924-100718.tar`；日誌：`load-0.6.27-live.log`。
