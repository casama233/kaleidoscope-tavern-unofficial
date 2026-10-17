# Java 動畫與細節核對（0.6.32）

基準：KaleidoscopeMods/KaleidoscopeTavern，commit `c4ec1880bd44cf3139d3ba744ab30bb379cf1416`。
這是原碼／資源對照記錄，不是 Android 畫面驗收。

| 項目 | Java 依據 | 核對結果／處理 |
| --- | --- | --- |
| 雪克杯放入材料的杯蓋動畫 | `ShakerAnimation.PUT` | 0.375 秒、根部偏轉和杯蓋旋轉／抬升五個關鍵幀、Catmull-Rom 插值已對應。保留既有可用握持骨架。 |
| 持杯搖晃 | `ShakerAnimation.SHAKING`、`applyForgeHandTransform` | 正弦頻率為每秒 30 弧度；第一人稱垂直振幅 2.4 模型像素、第三人稱手臂振幅 45 度。移除非持杯左臂的額外搖晃。 |
| 搖晃聲音 | `ShakerItem.onUseTick` | 每 10 tick，音量 0.75–0.95、音高 0.8–1.0；本次恢復隨機範圍。 |
| 倒出成品粒子 | `ShakerItem.pourResult` | 原移植缺少 Java 的 20 個 EFFECT 粒子。本次補上對應的原生 Bedrock spell emitter，明確傳入白色色值。 |
| 神秘雞尾酒粒子 | `MysteryCocktailBlock.animateTick` | 原移植缺失。本次在杯口中心附近 ±0.2 格生成；Bedrock 以 4–8 tick 排程，並非 Java 客戶端隨機 display tick 的完全相同時序。 |
| 燃燒瓶飛行 | `ThrownMolotovRenderer.render` | 原移植只有靜態模型，且縮放為 0.65。本次加入中心點雙軸旋轉、縮放 0.5；專用投射物骨架不改變擺放方塊。 |
| 酒桶內原料浮動 | `BarrelBlockEntityRender.renderItems` | 已有每秒 2 弧度正弦、0.02 格振幅及原料索引相位，保留。 |
| 座椅轉向 | `BarStoolBlockEntityRender` | 已有客戶端骨架轉向；伺服器玩家朝向取樣與 Java render partialTick 插值不是相同執行機制。 |
| 圓形酒架粒子 | `CircularRackBlock.animateTick` | 已有非空酒架邊緣 end-rod 粒子，保留。服務端排程頻率與 Java 隨機 display tick 有平台差異。 |
| 雞尾酒、冰葡萄、掛畫貼圖動畫 | 原版 10 個 `.png.mcmeta` | 核對既有 flipbook 的幀列表、ticks_per_frame、blend_frames；酒石酸掛畫保留七次 frame 0 再一次 frame 1。特調酒仍為六格、每格 2 tick。 |
| 香薰／壓榨／酒嘴 | 原版粒子與現有專用粒子定義 | 已有對應的專用粒子與互動路徑；沒有把相同名稱當作逐像素或物理軌跡完全一致的證據。 |

尚不能宣稱所有效果與 Java 逐幀一致：原生粒子物理、網路同步、觸控操作與客戶端渲染器都有平台差異。倒酒手臂的短動畫屬於 Bedrock 操作回饋適配，不是 Java 額外定義的關鍵幀。
