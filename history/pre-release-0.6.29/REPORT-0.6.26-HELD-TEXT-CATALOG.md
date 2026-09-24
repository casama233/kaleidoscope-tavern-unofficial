# 酒館 0.6.26：手持骨骼、字體、創造分類

## 本次改動

- 雪克杯：獨立的 hand_anchor 負責物品槽綁定及 +24 基準補償；子層 grip 才負責 Java 模型的半尺寸、旋轉和搖晃。模型先以杯身握持中心重新定位。移除此前混在握持變換中的 10.5／15 高度補償。
- 手臂：刪除酒館在 player.entity.json 的 is_item_name_any 判斷，由實際玩家的開始／停止使用事件播放搖晃及復位動畫。保留其他模組的玩家渲染，並在其食物查詢前加入 UI 預覽分支，避免 Skin0 沒有實體時讀取物品。
- 展牌文字：對照 Mojang 1.20.1 client.jar 的 UnihexProvider.Glyph 位元碼，getBoldOffset 為 0.5，getAdvance 使用整數 width / 2 + 1；之前用了 1 和小數除法。現在按每個字體提供者保存粗體偏移，字寬及對齊使用相同數值。字形改為 256 個固定 UV 網格，取消 uv_anim 取樣偏移。保留 Unicode 頁面、現有文字資料，舊顯示助手依版本重新建立。
- 創造分類：所有酒館可見物品集中於「物品」頁，六組：種植 12、釀造與容器 9、酒飲 25、雞尾酒 14、裝飾 94、收納 6。收納不再混進廚房的共用分類，空瓶和杯子合入釀造。

## 舊日誌核對

正式服 0.6.25 的 runtime_shaker.animation.json 已無 player_pour，也不存在 `.12`／`.28`／`.4` 時間鍵；倒酒動畫已在獨立檔案使用有效時間鍵。使用者本次貼出的那部分訊息不能對應到已核對的伺服器檔案，可能是歷史日誌或客戶端舊資源，尚無證據區分。0.6.26 保留有效時間格式和前版 UI max_size 陣列修正。

## 驗證

依使用者要求，只做資源、語法、打包及伺服器載入檢查，沒有模擬玩家互動測試。這些檢查不能確認手機最終的手持位置、動畫與字形已正確；仍待實機畫面驗收。

- 靜態檢查：`validation.json`。
- 隔離載入：`/tmp/bds-v26-load.log`。隔離環境仍保留既有第三方 damage_sensor 與非 NetherNet 設定錯誤。
- 主要修改：`rebuild_mixology_visuals.py`、`rebuild_java_board_font.py`、`immersion.js`、`board-text.js`、`unify.py`。

## 正式部署

已安裝並重啟 luosen，狀態 RUNNING。正式服此輪啟動無 ERROR 行，已逐檔核對 708 個 BP 檔案與 2275 個 RP 檔案和建置目錄一致。備份：`/root/bsm-family-unification-20260923/luosen-before-20260924-091712.tar`。存檔資料和其他包保持不變；啟動日誌副本為 `load-0.6.26-live.log`。
