# 森羅物語：酒館（非官方）0.6.40-beta.1

## 酒架中的莫洛托夫與西瓜汁

依 Java 原版 `StorageBlockEntityRender` 及各酒架／酒櫃 renderer 修正展示轉換，覆蓋單瓶架、傾斜酒架、圓形酒架、普通酒櫃、玻璃酒櫃與窖藏酒櫃。

- 莫洛托夫新增酒架專用瓶底原點模型，保留全部頂點、UV 和材質；不改手持、放置或投擲模型。
- 窖藏櫃只在模型骨骼套用俯仰，助手只控制世界 yaw；圓形酒架的槽位角度只轉換一次座標慣例。
- 按 Java 的 BottleBlockItem 接受規則補回西瓜汁收納及顯示，通用紅石投射物索引同步補齊。舊酒瓶索引不重排，莫洛托夫仍是 16／26，西瓜汁追加 17／27。
- 保留 0.6.39 的杯子回收、香薰、雪克杯、指南、PBR、特調圖示與微醺修正。

來源對照固定 Java 提交 `c4ec1880bd44cf3139d3ba744ab30bb379cf1416`。靜態核對 21 個原作來源檔、142 個模型綁定及 10,400 次頂點變換；既有 2,022 個相關資產／玩法檔案雜湊不變。建置直接使用 canonical runtime，並核對成品與上傳資產。

**未執行新 BDS、客戶端或模擬玩家互動測試。** 矩陣吻合不是手機畫面保證，仍以 Beta 發布。詳見 `docs/STORAGE-REPAIR-0.6.40.md` 與 `STORAGE-VALIDATION-0.6.40.json`。

先備份世界，同時更新本體 BP/RP，保留 Cookery 1.0.6。使用世界名酒時更新至 0.1.5-preview.1。UUID、物品 ID、庫存 key 與 slot 順序不變；不需要清空酒架或重建世界。重新載入世界讓新資源與助手同步生效。正式伺服器的私有 Cookery 重綁不在本次公開包內。

## English

Ports the original Java storage matrices and bottom-centred default-block rendering. Uses a storage-only Molotov geometry without modifying held, placed or thrown assets, removes competing cellar pitch ownership, and corrects circular-rack slot yaw conversion. Restores watermelon-juice admission and visual mapping with append-only indices. Existing inventories, UUIDs and content IDs remain unchanged. All earlier 0.6.39 repairs are retained. Static source/model/matrix and exact-package checks only; no new BDS/client or simulated-player run. Use World Liquor 0.1.5-preview.1 when installed, alongside Cookery 1.0.6. Back up the world and update both BP/RP.
