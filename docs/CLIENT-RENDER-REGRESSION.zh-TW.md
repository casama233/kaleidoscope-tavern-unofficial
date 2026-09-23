# 放置模型與生成朝向：2026-09-23

使用者回報 0.6.10 中龍頭、放置酒瓶及雞尾酒仍不可見；稍後確認廚房本體與所有附屬的**舊放置物可見，新放置物不可見**。較早版本曾可顯示，但尚未確認最後正常版本。另有酒桶、高腳凳生成後短暫歪斜再復位。

## 已確認與修訂

- 酒桶、高腳凳、特調杯與酒架展示物先前先 `spawnEntity`、再 `setRotation`。改用原生 `SpawnEntityOptions.initialRotation`，讓生成本身攜帶朝向；保留既有實體的朝向修復。高腳凳動畫從同步的 `seat_yaw` 初始化，避免載入有乘客的凳子時先從零角度插值。
- 0.6.9 起的編譯步驟複製 113 個已有模型至 `models/blocks/placed`，並改寫放置方塊的幾何 ID；0.6.11 又為 UV 面加入顯式材質名稱。兩項候選修訂均沒有客戶端成功畫面支持，0.6.13 撤回，恢復原本的模型 ID 與 `*` 後備材質。保留酒桶 27 格的空白幾何與完整碰撞方塊，以及已修正的實體生成朝向。
- 整個世界的方塊幾何定義曾由約 944 增至 1057 個，與回報時間相近；這是值得消除的無謂複製，**不是已證實的渲染上限或隱形根因**。
- 正式服已啟用 `texturepack-required=true`，要求客戶端載入世界資源包。這同樣是相容性措施，**尚未證明它就是隱形的根因或已修復實際畫面**。

## 排查證據與限制

- 正式服只有一份酒館 RP；查無跨包重複酒館 geometry ID 或 terrain texture key。安裝檔案與建置相同。其他 15 個世界資源包和 15 個行為包的引用皆有實際安裝檔案且版本相符。
- 葡萄酒、龍頭、白色佳人的模型引用貼圖存在，實際 UV 區域含不透明像素；不是貼圖全透明。
- C2～C6 歷史快照中的 `bottle_wine` 基礎模型／材質設定相同。尚不能指定某次最近的 commit 為退化點。
- `blocks.json` 對這類自訂幾何方塊是選用；把檔案移入 `models/blocks` 本身也不能證明可見性。0.6.10 原先關於目錄必然導致隱形的推斷已撤回。
- BDS 能驗證放置、碰撞、生成朝向與交易，無法驗證手機的幾何載入、GPU 材質和最終畫面。要結案仍需客戶端內容記錄或實際畫面。

參考：[原生生成選項](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/spawnentityoptions?view=minecraft-bedrock-stable)、[材質元件](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/blockreference/examples/blockcomponents/minecraftblock_material_instances?view=minecraft-bedrock-stable)、[廚房基岩移植版](https://www.curseforge.com/minecraft-bedrock/addons/kaleidoscope-cookery-unofficial)。
