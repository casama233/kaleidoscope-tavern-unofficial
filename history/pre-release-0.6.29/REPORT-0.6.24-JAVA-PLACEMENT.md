# 0.6.24：Java 放置、碰撞、板面文字重構

## 本次改動

- 新增 `core/java-placement.js`：明確區分玩家水平朝向、相反朝向、被點擊的面、16 段旋轉及實體 yaw。人字梯、掛畫、黑板和展牌共用這個轉換。
- 人字梯：恢復真正的上下半部模型；以 Java `StepladderBlock` 的兩個盒子表示每半部碰撞；模型和碰撞僅做一次方向旋轉。移除附近玩家跳躍時額外施加上升速度的實作。
- 14 幅掛畫：修復不存在的模型引用；牆、地板、天花板分別選擇模型與局部碰撞；按 Java `PaintingBlock` 和生成的 blockstates 處理朝向，牆面厚度 1/16 格。
- 黑板：恢復 Java 的實體碰撞，上下兩格分別為 `[0,2,15]..[16,16,16]`、`[0,0,15]..[16,14,16]` 的北向基準。小黑板與大黑板切成獨立合法尺寸模型，保持原紋理像素。點擊牆面時使用被點擊面的朝向。
- 14 種展牌：每種重建 16 個朝向，旋轉只作用於模型骨骼。碰撞保持 Java 的固定軸向形狀；上下兩格的聯合集合覆蓋高度 22/16 格。
- 板面文字：替換舊的 Noto 字形和估算字寬。從 Mojang 的 Java 1.20.1 客戶端及資產索引取得原版 bitmap / Unihex 字形，按提供者優先順序生成字寬和字形圖集。UV 不再重複縮放。展牌使用粗體、55 像素寬、8 行、10 像素行距、0.01 世界縮放與 22.5° 傾角；黑板使用 63 / 232 像素寬、11 行、12 像素行距、0.012 縮放。英文、繁中、簡中共用實際字寬；既有文字資料保留並重新排版。
- 酒桶：接回看向酒桶時的 HUD。按照 Java `BarrelComponentProvider` 顯示酒款及數量、品質、下一階段時間／最高品質。未開始釀造與結構受損亦有訊息，含繁中、簡中、英文。
- 單體酒架、傾斜酒架、懸掛杯架及三種吊燈：移除已換算成世界方向後又被方塊轉換旋轉的碰撞／選取框。
- 水花：壓榨與投射物效果呼叫原版 `water_splash_particle` 時補上 `variable.direction` 向量。
- 打包：缺失模型引用現在直接阻止產出套件；新增檔案已列入固定來源建置的覆蓋清單。移除預設 rebuild 流程中的模擬互動測試。

## Java 參照

來源目錄：`/root/tavern-official-current`。

- `block/deco/StepladderBlock.java`
- `block/deco/PaintingBlock.java`
- `block/deco/ChalkboardBlock.java`
- `block/deco/SandwichBoardBlock.java`
- `client/render/block/TextBlockEntityRender.java`
- `client/render/block/ChalkboardBlockEntityRender.java`
- `client/render/block/SandwichBlockEntityRender.java`
- `compat/jade/block/BarrelComponentProvider.java`

基岩版旋轉方向依 Microsoft 的 block traits 文件：北 0°、東 -90°、南 180°、西 90°。
https://learn.microsoft.com/en-us/minecraft/creator/documents/intro-block-traits

## 驗證範圍與未驗收事項

本次僅執行 JSON／資源引用／JavaScript 語法檢查及真實 BDS 載入檢查，沒有模擬玩家互動。

這些檢查不能證明手機客戶端的動畫、字形、透明材質及 HUD 已達到 Java 一比一；本次沒有實際進入客戶端驗收。這份記錄也不表示整個酒館所有系統均已完成一比一移植。

基岩版的人字梯選取框仍使用每半格的包圍盒；碰撞才是 Java 的盒子聯集。板面字庫覆蓋原版字庫中 BMP 字元；超出 BMP 的字元使用可見替代符號。其餘尚未對照的系統不能以本次載入成功視為已完成。

## 安裝記錄

已安裝 0.6.24 BP / RP 至 luosen，安裝時世界資料庫、level.dat 及伺服器設定檔均未改動。

備份：`/root/bsm-family-unification-20260923/luosen-before-20260924-081927.tar`。
