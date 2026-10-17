# 0.6.52-beta.1 — 修正共用酒架命中入口未生效

玩家確認九格酒櫃、圓周酒架、傾斜酒架及附屬酒櫃在東／西朝向取酒有誤。排查發現 0.6.50 的共用修正讀取了不存在的 `InputInfo.lastInputMode`，導致原生視線命中分支一直跳過。

- 改讀實際 API `lastInputModeUsed`，使滑鼠／手柄使用原生視線命中座標。
- 觸控只影響快捷欄時採準星命中；可直接點畫面的觸控模式保留事件點擊座標。
- 本體與附屬沿用同一共用入口；保留 Java 格位與存檔槽位，不交換已存酒瓶。
- 記錄命中來源計數與最多八次事件／射線差異，便於核對實際點擊。

隔離 BDS 1.26.51.1 確認正確欄位存在、舊欄位不存在；本體九格酒櫃、傾斜酒架、圓周酒架及附屬橡木窖藏酒櫃的四方向共 108 次原生射線格位檢查通過。沒有模擬玩家。這證明 API 與座標路徑有效，實際玩家的東／西點擊仍待客戶端驗收，不能以公式或射線測試替代。

API 依據：[Microsoft InputInfo](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/inputinfo?view=minecraft-bedrock-stable)。

搭配世界名酒 0.1.15-preview.1、廚房 1.0.6。上版飲品重複掉落修正保留。
