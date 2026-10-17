# 0.6.42-beta.1 — HUD 通道隔離與方塊引用檢查

完整酒館 BP/RP，基於 0.6.41 的主分支 f533cc0119f68e3250c6216d04cfa555fd4b682c。保留微醺、握持、酒桶原料比例、酒架與 PBR 修正，沒有改 UUID、物品／方塊 ID、配方或保存格式。

## 酒館自身已確認的問題

旧版只要顯示過一次酒館 HUD，閒置後仍會每 2 tick 往共用 title 通道發送 `ktmix:off`；退出時的 clear 還會重新建立追蹤記錄。RP 同時覆寫 `hud_title_text` 的 bindings，並把持久保存的 title 字串加工成動態貼圖路徑。

本版改為只在有酒館操作／看向目標／限時提示時使用 actionbar；閒置、取消、重生與離線清理只刪除本包記錄，不發 off、不清除他包的 title/actionbar。移除酒館對 title/subtitle 的使用，以及全域 title、原版 actionbar 控制項的覆寫。

圖形 HUD 使用獨立 actionbar factory，不受另一個包隱藏原版 actionbar 控制項直接影響。每一份圖形有 0.6 秒本地壽命，不再永久保存外來字串。酒館的圖片路徑全部是固定字面值，保留既有 3 槽／512 種組合、112 段進度與游標位置。RP 缺失或被覆蓋時，BP 發出的是可讀的 `[KT]` 進度、槽位顏色或翻譯提示，不是貼圖路徑。

正常 actionbar 文字仍採引擎本身的淡出時間；為避免清掉其他包剛送來的提示，不發空字串強行清除。其他 actionbar 使用者仍可能互相搶顯示，本修正不是整個 Bedrock UI 通道的跨包仲裁器。

## 使用者提供的兩條報錯

- 對酒館 160 個方塊的 2,473 個有效 world/item 材質配置進行靜態檢查，沒有同一配置內混用 render_method。6 個方塊在互斥狀態或物品／世界顯示間採用不同模式，另列為待引擎驗收，不盲目破壞先前的單面裁切修正。
- `docs/STATUS-A2.7.14-SERVER.md` 位於煙火倉庫。A2.7.66 大缸有 6 份宣告材質表把外殼 alpha_test 與 fluid blend 混用，這是可定位的獨立問題，不能用酒館 RP 替另一個 BP 修正。
- 沒有從酒館定義找到空 block_placer／本包方塊引用。新增 `tools/check_pack_compat.py` 會拒絕空引用、未定義的本包方塊、同組混合材質與循環材質別名；外部原版／他包引用會列出而不是冒充已確認存在。

`Block  couldn't be found in the registry` 這一行沒有 identifier 或來源路徑，尚不能歸因。沒有為了消除警告而把未知方塊改成 air、刪除世界資料或替換原版方塊。

## A Magic Way 的證據邊界

截圖同時出現魔法輪盤缺圖與酒館 `ktmix:off`，足以要求移除我們自己的 title 干擾，但不能證明所有紫黑材質都由酒館造成。A Magic Way 公開說明另有 UI Queue／Novelty API 前置；未核對使用者實際安裝的三者版本及完整包順序。

讀到的公開第三方 AMagicWayR 複本確實以 title 驅動多個動態貼圖控制項，但沒有把它當成使用者或官方 v1.9 原包。本版沒有修改或重散布 A Magic Way、UI Queue、Novelty API，也沒有接管 player.json 或其他附加包素材。

## 驗證與安裝

新增 HUD 協議、全部槽位／進度對應、固定圖片存在性、有限生命週期與空閒不發包的純函數／結構檢查；新增方塊材質／引用檢查並接入正常 release checks。所有貼圖、模型、方塊及配方保持不變。

未啟動 Minecraft 客戶端或 BDS；Android 上 factory 更新與淡出、A Magic Way 實際輪盤、多包載入順序、仍未定位的空方塊錯誤，必須以新的客戶端 Content Log 驗收。靜態通過不等於已消除所有材質問題。

備份世界並退出後，同時更新 BP/RP 至 0.6.42。公開前置仍是 Cookery 1.0.6；私服 UUID／1.0.7 重綁不能直接套成公開版依賴。舊錯誤輪盤如已保存在 UI 狀態中，退出並重新進入世界才是乾淨的本版驗收起點，不把重新進入本身當作修復證據。
