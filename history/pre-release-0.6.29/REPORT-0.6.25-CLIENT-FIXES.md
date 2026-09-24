# 酒館 0.6.25：2026-09-24 客戶端回報修正

## 本次依據

- 使用者的 ContentLog2026-09-24_08-21-22_1.txt、7428–7431 四張實機截圖，以及額外貼出的 UI 警告。
- Java 原始碼與資源：`/root/tavern-official-current`。
- 本次由主代理修改，沒有執行模擬玩家互動測試。

## 修改內容與原因

| 問題 | 修改 | 驗證範圍 |
| --- | --- | --- |
| 雪克杯仍在腳邊、握持與搖晃動畫失效 | 客戶端日誌拒收 `.12`、`.28`、`.4` 時間鍵，並報告找不到 hold_first、hold_third、shake_first、kt_mixology_shake。改成 `0.12`、`0.28`、`0.4`，倒酒手勢另存一個動畫檔，避免拖累握持動畫。保留握持骨骼绑定與位移，不再盲改數值。 | 新增動畫時間鍵格式與調酒動畫引用的靜態檢查；握持位置須由客戶端實機確認。 |
| 搖晃進度條閃爍 | 移除每 tick 切換整張進度 PNG 的做法。固定使用 Java 原始底圖與游標兩張貼圖，112 個位置只切換游標可見性；底圖持續存在。 | 打包結果只有兩張進度貼圖；游標仍採 Java `round(tick × 1.5)` 位置。尚未取得新版本手機畫面。 |
| 展牌東／西反向 | 修正所有 14 款、16 向展牌的骨骼 Y 旋轉符號。保留存檔的旋轉狀態和 Java 方位計算，修正在 Bedrock 模型轉換處。 | 224 個方向模型重新生成並打包。 |
| 展牌文字重疊、異常字形 | 移除同一幾何體經 12 個控制器重複切換字形的方式。每字獨立定位、單控制器、單正面，避免正反面貼字重疊。保留 Java 字體、字寬、行高、粗體和對齊規則；舊文字資料不改，顯示助手按版本更新。 | 資源引用和腳本語法檢查；中文字形、英文與斜面貼合的最終畫面仍待客戶端確認。 |
| 懸掛杯架玻璃杯呈藍色實心塊 | 原作空杯有朝內的面，Java 使用 cutout；Bedrock `alpha_test` 會畫背面。統一改用 `alpha_test_single_sided`，保留原作幾何、貼圖與杯子位置。 | 材質一致性檢查。單面裁切語義見 [Microsoft 文件](https://learn.microsoft.com/en-us/minecraft/creator/documents/customblockrenderlighting?view=minecraft-bedrock-stable)。 |
| 素面立式告示牌 icon 錯誤 | 直接讀 Java 的 `models/item/base_sandwich_board.json`、body 原圖與 GUI 旋轉，產生正面带字的圖標；不再以拼裝方塊模型配物品 UV 圖生成。 | 已人工查看生成的圖標。這是離線物品圖標，不是遊戲截圖。 |
| 卷軸選單 JSON UI expected an array | 追到 Magic Way `fast_swap_scroll.json` 的 `$max_size\|default` 為字串。酒館整合資源提供相同檔案，僅改為二維陣列；其他控制項原樣保留。 | JSON 和打包內容檢查，需客戶端載入確認警告消失。 |

## 驗證界限

靜態檢查與伺服器啟動可以確認包、腳本和伺服器端資源能載入，無法證明 Android 的動畫、JSON UI 或字形渲染已完全符合 Java。本次不以這些檢查冒充視覺驗收，也不宣稱已完成整個模組的一比一驗收。

## 部署結果

- 已安裝至 `luosen`，行為包與資源包皆為 0.6.25，已重啟。
- 正式服日誌出現 `Server started` 和 `Server edition 0.6.25`，此輪啟動沒有 ERROR 行。
- 已逐檔核對正式服酒館檔案與打包目錄一致。
- 備份：`luosen-before-20260924-085532.tar`（195,092,480 bytes）。
- 安裝時存檔 DB、level.dat、server.properties 及其餘 14,824 個模組檔案保持不變。
- 隔離服仍有既有第三方 damage_sensor schema 與 RakNet 設定錯誤；酒館已初始化。正式服使用原有連線設定，未出現上述錯誤。

## 可追溯檔案

- `tavern-src/tools/rebuild_mixology_visuals.py`
- `tavern-src/tools/rebuild_java_wall_decor.py`
- `tavern-src/tools/rebuild_java_board_font.py`
- `tavern-src/runtime/BP/scripts/bedrock/board-text.js`
- `derive_icons.py`、`validate_package.py`
- `validation.json`：最終包雜湊與靜態檢查結果。
- `/tmp/bds-v25-load.log`：隔離服載入日誌。
- `load-0.6.25-live.log`：本次正式服啟動日誌副本。
