# 放置模型與生成朝向：2026-09-23

使用者回報 0.6.10 中龍頭、放置酒瓶及雞尾酒仍不可見，廚房本體顯示正常；較早版本曾可顯示，但尚未確認最後正常版本。另有酒桶、高腳凳生成後短暫歪斜再復位。

## 已確認與修訂

- 酒桶、高腳凳、特調杯與酒架展示物先前先 `spawnEntity`、再 `setRotation`。改用原生 `SpawnEntityOptions.initialRotation`，讓生成本身攜帶朝向；保留既有實體的朝向修復。高腳凳動畫從同步的 `seat_yaw` 初始化，避免載入有乘客的凳子時先從零角度插值。
- 參照已安裝廚房 1.0.6 的 `placeable_food/yakitori` 與 `kitchen/stockpot`，在放置模型編譯步驟為原本未命名的 UV 面明確指定 `kt_surface`，並在各有效方塊 permutation 中綁定對應材質。保留原有液面專用材質、幾何尺寸、UV、貼圖與手持實體模型。不新增酒瓶展示實體或重寫放置／品質儲存流程。
- 材質修訂是針對客戶端的相容性候選，**尚未證明它就是隱形的根因或已修復實際畫面**。Mojang 文件本來允許 `*` 後備材質，不能把合法後備寫法直接認定為錯誤。

## 排查證據與限制

- 正式服只有一份酒館 RP 0.6.10；查無跨包重複酒館 geometry ID 或 terrain texture key。安裝檔案與前一輪建置相同。
- 葡萄酒、龍頭、白色佳人的模型引用貼圖存在，實際 UV 區域含不透明像素；不是貼圖全透明。
- C2～C6 歷史快照中的 `bottle_wine` 基礎模型／材質設定相同。尚不能指定某次最近的 commit 為退化點。
- `blocks.json` 對這類自訂幾何方塊是選用；把檔案移入 `models/blocks` 本身也不能證明可見性。0.6.10 原先關於目錄必然導致隱形的推斷已撤回。
- BDS 能驗證放置、碰撞、生成朝向與交易，無法驗證手機的幾何載入、GPU 材質和最終画面。要結案仍需客戶端內容記錄或實際畫面。

參考：[原生生成選項](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/spawnentityoptions?view=minecraft-bedrock-stable)、[材質元件](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/blockreference/examples/blockcomponents/minecraftblock_material_instances?view=minecraft-bedrock-stable)、[廚房基岩移植版](https://www.curseforge.com/minecraft-bedrock/addons/kaleidoscope-cookery-unofficial)。
