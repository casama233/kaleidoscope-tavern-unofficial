# 家族兼容第二批：原生儲存、指南語言與全局回饋修復

2026-09-29。承接酒館 PR #97、世界名酒 PR #7、煙火 PR #79。煙火新實作見 PR #80；本批是候選，不是全部家族兼容認證，不修改正式服。

## 此輪完成

### 煙火 2.8.9-compat2：三槽烤爐與九槽高級廚具架

移除兩站需實驗的 `minecraft:block_entity` 宣告，改由持久原生 inventory 實體保存真正 ItemStack。production 操作、tick、破壞與爆炸路徑接回同一後端。資料 ledger、維度／座標、實體身份和 owner token 共同校驗；缺失、錯位、損壞或隔離時停止交易，不能重造空庫存、猜測補發或清除內容。只有交易成功、站點已移除且庫存為空才退役 helper。

保留舊槽位順序、物品與方塊 ID、owned BP/RP/module UUID 及裝箱 schema。1,912 個 runtime 檔案只改／加15個，其餘1,897個雜湊不變。站內原生儲存與舊裝箱 codec 能力不同，沒有承諾任意第三方 metadata 都可裝箱。

新 helper `kaleidoscope_grilling:inventory_grill_v1`／`inventory_rack_v1` 是庫存，不可加入視覺實體清理清單；持久性不能防管理員 /kill 或其他 addon 強制刪除。

### Cookery 1.0.8 的操作說明語言欄位

提供 `tools/build_family_vendor_patches.py`。它接受精確雜湊的原始公開包，只修 `guidebookExtensionRegistry.js` 對標準 locale 的校驗。保留其他識別碼過濾，不把 zh_TW 改成小寫，不替換指南或插入新入口。

真實宿主登錄表中的五個擴充仍共519條，分類、條目數和 fallback 內容數不變。原先全部為0的 `mechanicsByLocale` 條目修復後：中華美食1、地獄36、終界41、酒館（含世界名酒）204、煙火76，共358條。沒有此欄位的條目不憑空補翻譯。End／Nether／Chinese Food 的29種語言及我們的3種語言均逐包與 RP `texts/languages.json` 核對；不是要求所有附屬只能有3種語言。

### 沉浸式進食 1.0 的世界級命令靜音

同一修補器只移除 `main.js` 內兩處寫 `world.gameRules.sendCommandFeedback` 的語句。19個覆寫食物與玩家動畫不改。真實 BDS 中，舊模組會關掉原本 true 的世界回饋，也會把外部改成 false 的設定恢復成舊 true。修補後，實際函式與實際 interval cleanup 都不再改這個全世界設定。

這是原生函式的副作用驗證，不是偽造玩家進食事件，也不是手機動畫驗收。

## 原生證據

成功工作流：`36510726766`，https://github.com/casama233/kaleidoscope-tavern-unofficial/actions/runs/36510726766 。artifact `11008908791`，SHA256 `9692fc50a1b48f06a2c9f82e0b36d78d1d52dc74d88442357e1a731f7a78e3f7`。

使用官方 BDS 1.26.52.3。原始對照、修補後九包及修補後同一世界重啟，共3次；全部0玩家，不開實驗，不使用模擬玩家。16項驗收全部通過，包括世界名酒 ok ACK、終界／地獄真實刀具標籤、兩條容器錯誤的反例及消失、指南資料與語言、世界回饋設定、原生庫存建立與重啟、失敗保護及真實爆炸回收。

重啟後保持同一 inventory 實體ID與確切物品資料：名稱、lore、耐久37、Unbreaking II、字串／向量動態屬性、CanDestroy／CanPlaceOn。爆炸由真正 `createExplosion` 觸發 production 路徑：兩個站點各掉落一次，烤爐物品守恆，架子支持的裝箱資料保留，空 backing 退役。

原生日誌的 SUMMARY SHA256：`586e1135e5392e50e8605cdbb77c9da5e2a3d602dfcfe275625f4a4b59bcc9fc`。原始對照仍有兩條 experimental container 錯誤；修補後首次啟動及重啟無此類內容錯誤。115,680個方塊 permutation 的效能警告、沉浸式進食刻意的覆寫提示及控制組也有的 transport 提示仍在，不能宣稱全套無警告或玩家連線已驗證。

第一次真實驗證 `36510193287` 的 backend、重啟、爆炸和回饋均通過，但總結果失敗：檢查器錯誤要求恰好3種語言，拒絕了原包合法的29種語言。修正為逐包讀原始 RP 宣告後重新跑完整測試；舊失敗紀錄沒有改成成功。更早的工作目錄／重建縮排失敗也不是原生通過證據。

## 安裝與原包修補

組合：Cookery 公開1.0.8、Tavern 0.6.64-compat1、World Liquor 0.1.28-compat1、Grilling 2.8.9-compat2，加公開 End1.0.1、Nether1.0.1、Chinese Food1.0.4、Deco1.0.1、Immersive Eating1.0。酒館與世界名酒本輪 runtime 不重改。Deco 梯子可選兼容 BP 沿用第一批。

**只用新測試世界或已確認兼容的副本。不要在有存貨的舊實驗容器世界關閉實驗後直接換包。** Cookery1.0.6到1.0.8的UUID私有資料及舊原生 block_entity 容器庫存未自動遷移。

修補器不含第三方原包／完整腳本，不覆蓋輸入或已安裝世界：

```sh
python tools/build_family_vendor_patches.py cookery "Kaleidoscope Cookery v1.0.8.mcaddon" --output "cookery-patch"
python tools/build_family_vendor_patches.py immersive-eating "Kaleidoscope Immersive Eating v1.0.mcaddon" --output "eating-patch"
```

輸出資料夾必須不存在，每包只產生一份替換腳本與receipt。它們不是獨立addon。停服／退出世界、備份，再在測試用安裝副本按原包相對路徑替換。UUID、版本和其他檔案不變；未知或已改動雜湊拒絕操作。第三方更新後必須重新審查，不可強制套用。回復時停服並還原原檔。不要重散布產生的第三方完整替換腳本。

## 尚未完成

煙火對廚房的砧板牛肉覆蓋與放置油壺私有庫存交易仍安全隔離，須有宿主擁有庫存的公開操作接口；手持油壺對自有設備的合法操作保留。沒有把錯誤DP訪問重新開回去。

中華美食缺失raw_ham尚未擅換Nether不同火腿；End茶杯尚未偽造六品質酒瓶。完整酒櫃／雪克杯新飲品接入、微醺相機roll、創造分類客戶端、多人UI、舊世界遷移及狀態預算優化仍待後續。原生3次驗證不代表Android圖像、真玩家互動或全套兼容已通過。
