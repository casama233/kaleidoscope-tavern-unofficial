# 0.6.30 rc1

## 修正

- 特調酒液體改用預先按 Java RGB 平均值染色的貼圖；涵蓋 Java 16 種顏色、1–3 個有效顏色的全部 336 種結果。杯架、杯口、杯腳仍使用原始玻璃貼圖。
- 液體改用單面透明裁切材質，保留原圖透明區域。移除零面積的模型面，讓液面正反面由背面剔除決定顯示，避免雙面材質重畫同一平面。
- 保留原版六格動畫、混色資料、已有杯子及物品 ID。第三方提供 Java 色域外的任意 RGB 時使用原生顏色覆蓋；此備援會失去液體的明暗細節。
- 無顏色標籤的配方材料改按 Java RESET 規則排除混色，不再視為白酒稀釋顏色。
- 酒桶提示改成物品欄上方單行「酒款 ×數量丨品質丨MM:SS」，刪除背景框、圖標和頂部多行面板。保留移開視線的清除路徑。
- 包含 0.6.29 的圖鑑條目合併：同一物品的取得、合成與使用方法集中在一個條目。

## 驗證範圍

執行資源／腳本靜態檢查及 BDS 載入檢查，不執行模擬玩家互動。
Android 客戶端的透明度、動畫、視覺位置仍待實機確認；BDS 成功載入不等於視覺驗收完成。

來源：Java `ColorUtils.java`、`models/block/mixology/signature_cocktail.json` 與其 RGBA 動畫貼圖。

已完成：1,483 個 JSON、928 個模型識別碼的靜態檢查；2,016 格染色貼圖的 RGB／透明度比對；BDS 1.26.51.1 搭配公開廚房 1.0.6 載入，零 ERROR。

動畫圖集依照 [Microsoft 的材質與 UV 動畫說明](https://learn.microsoft.com/en-us/minecraft/creator/documents/practices/improvingperformanceandresourceusage?view=minecraft-bedrock-stable) 啟用 `USE_UV_ANIM`；336 種色彩共用一張 1632×1428 圖集，包含每格一像素邊緣延伸。
