# 0.6.28 修正紀錄

## 特調雞尾酒

沿輸入顏色、RGB 整數平均、成品 payload、放置資料與實體同步屬性逐段查核。液體 render controller 已傳入 RGB，但原先使用的 `entity_alphatest_one_sided` 沒有染色遮罩，因此仍顯示灰白原圖。液體改用 `entity_alphatest_change_color`；玻璃保留獨立材質與 render pass。六張動畫幀的有效像素 alpha 為 255，能完整套用液體色。

依據 [Microsoft 材質文件](https://learn.microsoft.com/en-us/minecraft/creator/documents/material-files?view=minecraft-bedrock-stable)，`USE_COLOR_MASK` 使用貼圖 alpha 決定原圖 RGB 與染色 RGB 的混合。這次修正材質連接，保留 Java 的混色演算法及既有酒效、材料紀錄。

## 雪克杯

第一、第三人稱握持比例由 0.5 改為 0.625，放大 25%。保留 0.6.27 已能正確握持的單一 grip 骨骼、pivot、item slot 綁定及動作。

## 展牌文字

原先行距傾斜位移的 X/Z 符號相反，文字往離開板面的方向排列。按 Java `SandwichBlockEntityRender` 的旋轉軸 `(-cos(yaw), 0, -sin(yaw))` 修正行位置，保留原字型尺寸、粗體間距、字元旋轉與板面錨點。渲染版本升為 28，既有字元助手會在方塊維護時重建，不需重寫文字。

資源座標核對涵蓋 16 個方向、8 行：各行位移沿同一板面，法向漂移最大約 3.47e-17 格。這是座標檢查，不是模擬玩家互動或客戶端畫面驗收。

## 酒桶提示

- Java 的釀造資訊來自 Jade `BarrelComponentProvider`。改為頂部緊湊提示框、左對齊、酒桶圖標與模組名；Pocket 介面預留頂部按鈕位置。
- 品質、下一階段、最大品質的文字與時間取整對齊 Java；英文使用 Level / Next Level / Max Level。
- 原先清除只送一次，和其他模組共用 title 通道時可能遺失。現在閒置時重送清除狀態，每 2 tick 最多一次，避免舊提示鎖住。
- HUD 更新加入 finally 清除，取消使用、目標卸載或持有物資料異常時也會清除。

## 圖鑑

合併 9 個操作入口至物品條目：壓榨桶、酒桶、酒嘴、雪克杯，以及酒架、家具、燈具、掛畫、黑板／展牌的共用說明。物品詳情同時包含操作與原生合成面板。雪克杯只剩一個入口，包含 4 段說明與 1 個合成配方。保留沒有對應單一物品的葡萄、酒效等總覽。

## 檢查與部署

只執行資源／腳本／包檢查與 BDS 實際載入，沒有模擬互動測試。隔離服成功初始化 0.6.28；隔離环境的既有第三方 minecraft:item damage_sensor 與 transport 設定錯誤不屬於本次酒館修改。

已備份正式服並只安裝酒館 0.6.28。其他包 15060 個檔案、world DB、level.dat、server.properties 在安裝前後一致。備份：`luosen-before-20260924-103700.tar`。正式伺服器已恢復 RUNNING；啟動日誌保存在 `load-0.6.28-live.log`。

Android 端的最終顏色、文字貼面與 HUD 消失效果尚未實機驗收；伺服器載入成功不代表客戶端視覺已通過。
