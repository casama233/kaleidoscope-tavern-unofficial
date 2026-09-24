# 0.6.31 rc1

- 修正 0.6.30 客戶端日誌中的 `kt_signature_animated` 未定義錯誤：將材質移至 `materials/entity.material`，讓液體的透明裁切、單面繪製和 UV 圖集動畫使用同一個已註冊材質。保留 Java 混色資料及原有杯子。
- 產生工具改用正確的材質入口；打包檢查增加自訂實體材質註冊及 `USE_UV_ANIM` 檢查。BDS 能啟動並不能驗證客戶端材質，這是上一版漏掉的檢查。
- 酒桶提示下移至經驗欄上方，維持「酒款 ×數量丨品質丨MM:SS」單行置中。加入 252×18 的半透明窄框、細金色邊線及沿外圈移動的微光。
- 外圈動畫使用原生 JSON UI offset 動畫，在客戶端循環播放；不是釀造百分比，也不增加伺服器更新頻率。移開視線沿用原有清除流程。

驗證只包含靜態資源、腳本及 BDS 載入，不執行模擬玩家互動。Android 材質和 UI 效果仍需實機確認。

參考：[Microsoft 材質說明](https://learn.microsoft.com/en-us/minecraft/creator/documents/material-files?view=minecraft-bedrock-stable)、[Mojang JSON UI 動畫範例](https://github.com/Mojang/bedrock-samples/blob/main/resource_pack/ui/test_anims_screen.json)。
