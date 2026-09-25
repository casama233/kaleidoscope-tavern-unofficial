# 酒架展示修復：莫洛托夫與西瓜汁 / Storage rendering repair

## 來源與根因

本版基於酒館主分支 `e0330aaa4311519a2a646a2421c686b51cbe6a35`，保留 0.6.39 已發布修復。Java 對照固定於 `KaleidoscopeMods/KaleidoscopeTavern@c4ec1880bd44cf3139d3ba744ab30bb379cf1416`；21 個來源檔的雜湊與獨立矩陣參數列在 `data/storage-render-source.json`。

Java `StorageBlockEntityRender.renderStack` 渲染物品所對應方塊的 **defaultBlockState**，不是 GUI 圖示或手持模型。套用順序為槽位平移、Y 旋轉、X 旋轉、縮放，再將方塊底面中心移至旋轉原點。瓶子不能沿用物品在手中／投擲時的原點。

已找到的差異：

- 移植版一般酒瓶根骨骼原點是 `[0,0,0]`，莫洛托夫卻是 `[0,8,0]`。酒架共用俯仰／縮放因而繞瓶身中間計算，而非瓶底。僅此差異在窖藏酒櫃的 -90° 展示就產生各半格的高度與深度偏移，位移向量長約 0.7071 格。
- 窖藏酒櫃在助手實體設定 -90° 俯仰，RP 根骨骼動畫又設定 -90°；本版只保留 RP 的模型俯仰，助手只承擔方塊世界朝向。實體俯仰是否及如何影響客戶端外觀仍屬引擎驗收，不能把兩個設定數字相加當成已實測角度。
- 圓形酒架的槽位 YP 角度原本直接加到 Bedrock yaw。本版依 Java 與 Bedrock yaw 的相反號慣例轉換一次，保留六個槽位的原位置。

## 修正範圍

新增專用 `geometry.kt_runtime.storage_molotov`，只改識別與根骨骼原點；所有立方體頂點、UV、材質、貼圖保留原樣。單瓶架、傾斜酒架、圓形酒架、普通酒櫃、玻璃酒櫃、窖藏酒櫃全部引用這個專用模型。原本的放置、手持、投擲莫洛托夫模型沒有改動。

Java 西瓜汁是 `DrinkBlockItem` → `BottleBlockItem`，其方塊屬於 `BottleBlock`，也不在這些酒架的拒收標籤。移植版卻漏了接受表及顯示索引。本版補回真實 `kaleidoscope_tavern:watermelon_juice` 的收納及既有方塊模型映射，不虛構六種品質版本。對應的通用紅石酒瓶投射物顯示索引一併補齊；莫洛托夫仍走原有燃燒彈邏輯。

舊索引保持不變：莫洛托夫仍是 compact 16／general 26；西瓜汁追加為 17／27，不插入舊列表中間。方塊狀態仍維持原本合法值數量，新增的是助手實體属性範圍。庫存 key、資料 schema、slot 順序、物品與方塊 ID、包 UUID 均未更換。

## 可重現檢查

```sh
python tools/build_storage_visuals.py
python tools/check_release.py
python tools/check_storage_rendering.py --java-source ../java-src --report docs/STORAGE-VALIDATION-0.6.40.json
python tools/build_release.py
```

`java-src` 必須檢出上述固定提交。檢查逐檔核對 Java 雜湊，再以獨立的 PoseStack 運算順序比對 runtime 核心函式、骨骼原點、RP 動畫及縮放。六種家具變體 × 四方向，共 100 組槽位／模式；莫洛托夫和西瓜汁合計 200 組模型姿態、10,400 次頂點比對。這包括普通／玻璃酒櫃單瓶模式的數學覆蓋；不宣稱這兩種普通瓶實際會觸發異形瓶單瓶模式。

所有已映射本體酒瓶共 142 個模型綁定均檢查根骨骼原點。2,022 個既有資產／玩法檔案保持雜湊不變，其中貼圖目錄以帶路徑的整體清單雜湊核對，會偵測增加、刪除和內容變化。另有舊莫洛托夫原點的反例，確認檢查確實能辨認原先偏移，而非只驗 JSON 可解析。

**本版沒有執行模擬玩家互動、新 BDS 載入或 Minecraft 客戶端測試。** 以上是來源、資產與矩陣證據，不是手機畫面的驗收。各方向的實際可見位置、透明排序、互動命中、紅石射出和重載後的外觀仍待實機確認。

## 更新與存檔

更新本體 BP 與 RP 後重新進入世界／重啟伺服器，讓新的模型資源和助手朝向同步生效。不要為修外觀清空庫存或拆掉所有酒架；本版没有重新分配物品。若同時使用世界名酒，使用對應 0.1.5-preview.1：它會修正附屬自有酒櫃的同類原點／俯仰問題、補回西瓜汁映射並對齊依賴；既有指南、配方與內容保留。仍依賴公開 Cookery 1.0.6；自訂伺服器的 Cookery UUID 重綁另依其整合流程處理，本版未操作正式服。
