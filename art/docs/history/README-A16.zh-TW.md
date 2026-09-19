# Tavern A16 — 高腳凳十六色收齊、四款獨立彩燈

**這是原作美術移植與外觀實驗室，不是可玩的 Tavern。全模組美術仍未完成，沒有開始釀造等玩法。**

## 本輪成果

| 範圍 | 新增美術 | 邊界 |
|---|---|---|
| 完整高腳凳 | 淺綠、粉紅、灰、淺灰、紫、綠六色 | 原作底座＋座墊／靠背／扶手各色貼圖；完整骨架沿用；不是把藍色重染 |
| 四款彩燈 | 無色、棕色、青色、灰色 | 每款自己的七元素原作模型，保留省略面、吊線、薄片與不同 UV；不只是換色 |
| 可選姿態 | 四款彩燈來源明確提供的 display 值 | PoseLab 不預設併入主包，沒有為組合高腳凳猜新姿態 |

新增 **26 份原件、16 個原作 PNG 路徑、10 種外觀／編輯檔、4 份幾何**。六份高腳凳無損圖集是派生資料，不計入原作 PNG 數。

累積 **239 份 Bedrock 幾何、371 種模型／材質外觀、373 份 Blockbench 編輯檔、155 個 Tavern 原作 PNG 路徑**。完整高腳凳 **16／16 色**；彩燈 **8／17 款**。瓶裝排列97／97、雞尾酒靜態模型14／14、畫作14／14沿用已盤點的固定來源範圍，不代表全模組或引擎驗收完成。

## 原圖與幾何

六色高腳凳分別使用兩張原圖：64×32座墊／靠背和32×32底座。派生128×32圖集把它們放在(0,0)及(64,0)，其餘區域透明，不縮放、不重繪、不改顏色。每張原圖獨立保存，完整組合幾何與既有藍色候選相同，因此共用舊幾何、不覆寫原檔。

無色款是三個瓶狀燈體；棕色款是兩個不同高度燈體；青色款保留三組上部／下部結構及下部原本省略的上下表面；灰色款保留各面不同的UV、東面的反向UV和裝飾薄片。各款零厚度吊線仍為薄片，正側視可能不可見，不自行加厚或補成實心。

逐元素 shade=false 轉為對應材質槽，不等於全亮、發光或照亮世界。本批沒有照明、染色、乘坐、放置方向或自動連接程式。

## 交付與匯入

- `Tavern-Assets-A16.zip`：完整累積專案、原件、模型、原圖、工具、測試、接口、可選PoseLab與預覽。
- `Tavern-A16-VisualLab.mcaddon`：主BP／RP外觀實驗室；無Script API模組或player.json。
- `Tavern-A16-PoseLab-OPTIONAL.mcpack`：可選姿態覆蓋候選，不預設啟用。

**A16包含A1–A15，不要同時啟用舊VisualLab。** 保留既有UUID與物件ID，版本升為`[0,17,0]`，新增物件命名空間為`kt_assets_a16`。請使用新測試世界，不是最早v0.1玩法原型的存檔升級。

沿用先前的`1.26.50`格式與26.51驗收目標；本輪未重新調查最新遊戲版本，也未宣稱在該版本載入成功。

## 離線檢查

開啟`previews/index.html`，預設顯示A16十種外觀／無色彩燈。搜尋`bar_stool`或`string_lights`，拖曳旋轉、滾輪縮放、切換正背面／俯視。

- `previews/A16-overview.png`：本輪六色高腳凳＋四款彩燈。
- `previews/A16-stool-palette.png`：累積完整十六色高腳凳。
- `previews/A16-lights-four-views.png`：四款彩燈正面、背面、斜視、側視。

全部預覽都是匯出幾何的離線軟體投影，**不是Minecraft截圖**，不模擬完整引擎shader、光照或透明排序。`editor/*.bbmodel`已內嵌原圖或有來源記錄的派生圖集。bridge根目錄為`config.json`所在處，BP=`VisualLab_BP`，RP=`RP`；本輪未操作bridge／Blockbench工作區。

## 遊戲檢查入口（尚未實機執行）

在新的測試世界啟用主BP／RP，預留背包空位：

```mcfunction
/function kt_a16/string_lights
```

只給四款彩燈，不清空、不自動建造世界；沒有照明或染色互動。

完整高腳凳是**展示實體，不是可用 `/give` 取得的方塊**：

```mcfunction
/summon kt_assets_a16:bar_stool_lime ~ ~ ~
/summon kt_assets_a16:bar_stool_pink ~2 ~ ~
/summon kt_assets_a16:bar_stool_gray ~4 ~ ~
/summon kt_assets_a16:bar_stool_light_gray ~6 ~ ~
/summon kt_assets_a16:bar_stool_purple ~8 ~ ~
/summon kt_assets_a16:bar_stool_green ~10 ~ ~
```

凳子不能坐；展示碰撞不是最終家具規格。舊十色仍沿用A13／A14／A15的ID，全部對照見`docs/A16-FAMILY-COVERAGE.json`。

## 姿態與資源接口

PoseLab現有 **58份幾何／100種外觀**，僅納入來源明確提供的display值；沒有替組合高腳凳猜測姿態。放在主RP上方使用，舊UCF註記為未重新核實事項，不自動開啟實驗。

```javascript
api.selectVisual({family:'bar_stool',state:{color:'green'}});
api.selectVisual({family:'string_lights',state:{color:'colorless'}});
```

九款尚未移植的彩燈仍會明確報錯，不使用其他款代替。

## 驗證與重建

當前實際結果見`docs/TEST-RESULTS.json`、`VALIDATION.json`、`INTERFACE-VALIDATION.json`、`VIEWER-BROWSER-TEST.json`、`REBUILD-REGRESSION.json`與`A15-ASSET-REGRESSION.json`，包含原件全檔雜湊、原圖字節、六圖集逐像素、原始面頂點／UV、無光照功能、全十六色接口、舊資源回歸。

**Minecraft、bridge、Blockbench實際載入皆未執行。** 瀏覽器測試僅以Chromium／Playwright在記憶體載入包內檢視器；agent-browser CLI未安裝，因此使用既有Playwright測試。未測下載後雙擊檔案，不改瀏覽器網路策略，不算引擎驗收。

```text
python tools/project.py build --force
python tools/project.py test
python tools/render_a16_preview.py
python tools/test_viewer.py --chromium /path/to/chromium
python tools/audit_build.py --force
python tools/project.py package
```

先備份手改生成檔。建置只讀已鎖定本地原件，不下載來源。production匯出仍由未完成素材／前置／正式JAR／引擎／玩法條件阻擋。

## 剩餘缺口

彩燈還欠九款：**綠、淺藍、淺灰、淺綠、洋紅、橙、粉紅、紫、黃**。黑板、花草告示牌及完整方向狀態未完成。畫作基本模型不等於完整掛牆／天花板放置。

香薰動態粒子、容量變化液面、倒酒液柱、櫃內物品、特調RGB、手持搖杯與完整物品姿態仍待處理。正式JAR未逐檔對照、真實Cookery未綁定、遊戲外觀未驗收；本輪沒有重新聲稱完成其中任何項目。

## 來源與授權

固定上游提交`6b0d619145316492f055e03d70427107cd73efa8`，Kaleidoscope Official Production Team。素材與衍生模型、圖集、預覽按`LICENSE-ASSETS`（CC BY-NC-SA 4.0）；工具與其他來源保留各自授權。

`docs/A16-SOURCE-MANIFEST.json`列出26份新增原件，完整Git blob雜湊吻合才接納。不包含字型、Cookery本體或Minecraft JAR，不宣稱作者或Mojang背書。具名A1–A15報告屬歷史記錄，當前範圍以本README與覆蓋清單為準。
