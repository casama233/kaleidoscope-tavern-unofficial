# Tavern A1 — 原作素材／模型展示專案

**這不是可玩的 Tavern 移植版。** 本包只整理原作素材、轉換幾何模型和建立外觀檢查用的靜態物件。

## 本次交付

- 18 份固定來源原始檔，全部核對 Git blob SHA-1，另外記錄 SHA-256。
- 6 張原作 PNG：大酒桶、壓榨桶、龍頭、葡萄酒、空瓶及葡萄物品圖示；全部未重繪。
- 10 個 Bedrock 幾何模型候選：大酒桶開／關蓋、壓榨桶平放／傾斜、龍頭開／關、葡萄酒 1–4 瓶排列。
- 12 個內嵌原作貼圖的 Blockbench 編輯檔：上述狀態，加大酒桶完整骨架，以及暫停轉出的空瓶原始幾何。
- `RP/` 與 `VisualLab_BP/` 是一組外觀測試包。沒有 runtime JavaScript，沒有釀造、調酒、作物生長、容器或多人資料程式。
- `previews/index.html` 可離線開啟。預覽為轉換後檔案的軟體投影，**不是 Minecraft 截圖**。

## 來源版本的重要限制

目前實際取得並鎖定的是提交 `6b0d619145316492f055e03d70427107cd73efa8`（2026-07-01T05:20:30Z）。正式發布 JAR 因下載受限尚未取得，**沒有證明此提交與 CurseForge 正式檔案 8350841 逐檔相同**。本包沒有混用較晚的 main 資源。

詳見 `sources.lock.json`。不要把「原始檔 Git 雜湊匹配」誤當成「正式 JAR 比對已完成」。

## bridge 與 Blockbench 檢查

解壓後，以含 `config.json` 的資料夾作為 bridge 專案。設定的行為包是 `VisualLab_BP`，資源包是 `RP`，目標格式為 `1.26.50`。本次沒有實際操作 bridge 的瀏覽器工作區，沒有宣稱通過它的互動式載入測試。

查看模型請在 Blockbench 開啟 `editor/*.bbmodel`；貼圖已內嵌，不依賴下載。`barrel_master.bbmodel` 同時保存 `close` 與 `open` 分支，檢查時只顯示其中一個分支；單一狀態檔已分別裁出，避免兩個蓋子重疊。

## 在 Minecraft 做外觀驗收

使用全新的測試世界，不要把這個包當成舊 v0.1 的直接升級。測試命名空間為 `kt_assets_a1`，與舊原型分離。建議測試目標為 Bedrock 26.51；**遊戲內 Content Log 尚未實測**。

匯入隨本次交付的 `Tavern-A1-VisualLab.mcaddon`，或手動裝入 `RP` 和 `VisualLab_BP` 並啟用兩包。這個純展示包沒有實驗功能設定，也沒有 Script API 依賴；是否在指定引擎成功載入仍需實機確認。

八個小型模型會出现在創造模式建築分類，名稱帶 `[A1]`。也可用以下指令測試：

```mcfunction
/give @s kt_assets_a1:pressing_tub
/give @s kt_assets_a1:pressing_tub_tilt
/give @s kt_assets_a1:tap_closed
/give @s kt_assets_a1:tap_open
/give @s kt_assets_a1:wine_1
/give @s kt_assets_a1:wine_2
/give @s kt_assets_a1:wine_3
/give @s kt_assets_a1:wine_4
/give @s kt_assets_a1:grape
```

大酒桶保留原始完整尺寸，暫時以不移動的展示實體檢查，**不是互動多格酒桶**：

```mcfunction
/summon kt_assets_a1:barrel_closed ~ ~ ~
/summon kt_assets_a1:barrel_open ~4 ~ ~
```

每次 summon 都會新增一個展示實體。移除時限定本測試實體類型，不要使用不加篩選的 `/kill @e`。

## Cookery 前置狀態

正式移植仍規劃必需 Cookery。這次尚未取得其真實安裝包，因此沒有填造 UUID、沒有聲稱跨包相容。`cookery.requirement.json` 保留此要求。外觀實驗室獨立於正式發行包，不使用 Cookery 的素材與介面，因此可單獨檢視。

## 未完成／不可當成通過的項目

空瓶有反向 X 尺寸元素，原始檔和編輯模型均保留；未擅自改形，也未加入遊戲註冊。詳細狀態見 `docs/STATUS.zh-TW.md`。

葡萄藤架與各生長階段、其他葡萄、六種果汁桶、其他酒、家具、音效、粒子、液面／原料動態顯示尚未移植。本批也沒有完成手持／掉落／GUI 顯示姿態與整套原作語言檔移植；現有中文只是外觀測試標籤。

目前測試只包含檔案雜湊、JSON、PNG、資源引用和幾何／UV 數值往返檢查，結果在 `docs/VALIDATION.json`。這不能代替 Minecraft、Blockbench、bridge 實際載入與外觀驗收。不可聲稱 100% 還原、Realm 相容或成就相容。

## 重建（僅資源工具，非玩法開發）

Python 3.10+：

```text
python -m pip install -r tools/requirements.txt
python tools/build_assets.py --force
python tools/verify_assets.py
python tools/render_preview.py
```

重建會覆蓋 `RP/` 與 `VisualLab_BP/`；修改過的檔案請先另存。`--force` 是明確允許覆寫這兩個生成目錄。

不需要網路下載上游素材；本批原始檔已在 `upstream/`。預覽程式使用作業系統現有中文字型，不附帶字型檔。未安装中文字型時，中文預覽文字可能無法正常顯示。

原作署名與授權見 `CREDITS.md`、`LICENSE-ASSETS`、`LICENSE-CODE`。
