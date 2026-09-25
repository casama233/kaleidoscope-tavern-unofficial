# 0.6.38-beta.1 — 酒館視覺修復候選版

基於 0.6.37；適用 Minecraft Bedrock 26.50+ / manifest 1.26.50、`@minecraft/server` 2.7.0，前置仍為公開版 Cookery 1.0.6。保留原 BP/RP UUID、物品與方塊 ID、雞尾酒染色資料、配方、微醺時長和持久化狀態格式。這不是已完成客戶端驗收的正式版。

## 實際修正

### PBR / 靈動視效

追蹤 terrain/item atlas、實體、手持模型、動畫貼圖及既有 texture sets 的引用。433 組本包表面貼圖具備明確 MER 定義；另列出 24 組原版外部貼圖引用和 258 組有意排除的字形、染色遮罩／特效材質。不接管原版貼圖或其他附加包的光照設定。

普通空酒杯原本具有 E=180 的自發光區，現改為 E=0。真正燈具、燈帶、燃燒瓶與發光漿果汁保留局部發光，遮罩受來源像素雜湊檢查約束；發光通道改採 24–48 的保守值，不再通用套用 180。材質粗糙度依玻璃、酒液、木製／混合家具、座椅、植物等分類為 150–230；不從貼圖亮度猜測哪些像素應發光。

同名且像素完全一致的方塊／展示貼圖共用同一份遮罩規則；不同吊燈雖使用相同色彩圖集，仍保留各自不同的發光區。沒有更改方塊照明級別、世界曝光，也沒有壓暗原始色彩貼圖。這是保守 PBR 相容預設，不是逐像素實測材質，也沒有憑空產生法線或高度圖。

### 特調雞尾酒圖示

原 dyed 貼圖只有 18 個酒液像素。Bedrock 使用的是整張替代圖示，而非 Java 的第二疊加圖層，因此杯身遺失。新圖示包含 57 個不染色杯身像素、18 個可染色酒液像素和 181 個透明背景像素；使用原版染色 TGA 的 alpha 0 / 3 / 255 慣例。未染色 PNG 也包含完整杯身與預設藍色酒液。物品 ID、動態調色和世界中的六幀杯體動畫未更換。

### 微醺

原版移植只有倒數資料，實作標記甚至仍為 `camera_unavailable`。新增每人最多每 5 tick 一次、每次最長 0.25 秒的輕微旋轉鏡頭晃動。喝更多酒不另起重疊迴圈。到期、喝奶、死亡、重生及離線停止後續脈衝，清理私人追蹤；不執行全域 camera clear / shake stop，不覆寫 player.json，也不增加假的反胃或移速效果。

2.7.0 使用既有 `camerashake` 命令；只有在實際提供 `Camera.addShake` 的執行環境才使用新 API。`addShake` 是 2.10 新增功能，因此本包不直接匯入 2.7 不存在的 `CameraShakeType`。玩家的「允許鏡頭晃動」必須開啟；伺服器拒絕命令時會限速重試並留下診斷警告，不讓整包脚本崩潰。

這是 Bedrock 的可見近似，不是 Java 原作的三波平滑 roll。清除效果後，已送出的最後一小段晃動可自然結束，最長約 0.25 秒。相機權限與網路延遲仍需實機驗證。

### 其他

三種完整支援語言各補 26 個原版效果別名，包括漂浮、緩降；修正原有品質提示的效果等級偏移。只升級完全吻合舊版格式的本包提示，不覆寫玩家自訂 lore。CI 安裝 Pillow，避免原本缺少影像套件導致打包中斷。

## 檢查與復現

常規檢查與打包只讀取已提交的 `runtime/`：

```sh
python -m pip install Pillow==11.3.0
python tools/check_release.py
python tools/build_release.py
```

開發者明確重建材質／圖示時才執行：

```sh
python tools/refresh_cocktail_icons.py
python tools/refresh_visual_compat.py --write
python tools/check_visuals.py
```

靜態檢查包括 JSON、JavaScript 語法與引用、圖示 alpha、MER 尺寸與發光上限、透明像素不發光、語言鍵、清理掛鉤，以及 3,601 組相機脈衝純數學取樣。未進行模擬玩家互動測試；未宣稱 Windows、Android、Realms 或本次 BDS 實測。

## 匯入與人工驗收

先備份世界，離開世界後匯入新版；啟用對應的 0.6.38 BP 和 RP，避免同時啟用舊版酒館 RP。仍使用公開 Cookery 1.0.6；舊私服 UUID／Cookery 1.0.7 組合請依既有遷移文件處理，不要直接拆掉前置。

開啟靈動視效，檢查白天、夜間、室內的空杯、杯架、吊燈和燈串；檢查創造欄與實際調製的多種顏色雞尾酒；開啟允許鏡頭晃動，喝含微醺的酒，再測試到期、喝奶、死亡與重登。需要回報時附遊戲版本、啟用包順序、畫面和內容記錄；目前不能把靜態通過等同於畫面已驗收。

## 參考

- 上游相機效果：KaleidoscopeMods/KaleidoscopeTavern，`CameraAnglesEvent.java`，commit `c4ec1880bd44cf3139d3ba744ab30bb379cf1416`。
- Mojang/bedrock-samples，`resource_pack/textures/items/wolf_armor_dyed.tga`，blob `52abd599d633e053b9bf6d32534961c621650bde`。
- Microsoft Learn：Texture Set JSON、CameraShakeOptions、`@minecraft/server` Changelog（2.10 新增 addShake）、camerashake 命令。
