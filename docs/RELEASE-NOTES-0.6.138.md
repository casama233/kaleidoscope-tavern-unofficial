# 0.6.138：整合原生效果時計、重啟光效與既有還原修復

本候選為 **Tavern 0.6.138／World Liquor 0.1.115／Grilling 2.8.120**。
來源起點是 `af25ecf9cb3b8e74706ba0167e6a1ef7f08994b5`。T137 已通過的
[原生保存／重啟證據](https://github.com/casama233/kaleidoscope-tavern-unofficial/blob/af25ecf9cb3b8e74706ba0167e6a1ef7f08994b5/docs/native/T137-W114-20261009.json)
與先前失敗均保留。本版再納入並行來源的另一個效果時計問題，沒有把
先前候選的成功結果改名為 T138。

## 這次整合的行為

原生效果倒數可能在腳本 ticks 前進時暫停。並行來源
`71e5c372cce282d8130290d01812929c9e7db1f8` 記錄此差距；實際
[CI 37873046866](https://github.com/casama233/kaleidoscope-tavern-unofficial/actions/runs/37873046866)
也確認完整流程在 own effectAdd 被誤當成 foreign handoff 處失敗。
逐 tick 診斷的 145／146／147 表格來自該固定 source 的 release notes；
本工作區未取得那份獨立診斷 raw log，來源邊界明列於
[並行來源審查](../data/parallel-source-review-20261009.json)。

T138 對已取得所有權的原生效果，使用當前原生剩餘時間維持紀錄，允許
倒數暫停或遞減。效果消失、amplifier 改變、時間延長或未匹配的外部
EffectAdd 仍撤銷控制。每次保存其他效果也讀回其真正倒數，成功載入後
刷新已保存的時間，避免反覆恢復累積舊快照年齡。新的自有寫入仍先保存
預期紀錄，再隱藏其原生粒子；立即讀回與自有事件 ticket 的限制不放寬。

T137 的另一項修復完整保留：只有真正 entityLoad，才能為已通過舊
schema／最多 5 ticks 保存檢查的效果，取得同 tick、同原生 snapshot
的一次載入確認。它綁定刷新後的 raw 與目前 ownership fence；新的
寫入、外部交接、失效、unload 和死亡都要退休相關確認。一般 restore、
startup 與 playerSpawn 不會建立豁免。兩種處理共同維持來源光效，
不靠重新施加、縮短或移除外部 gameplay 效果修補外觀。

一 tick 隱形的 observer 改讀同實體的一次性原生倒數 sentinel；觀察
至少兩個真正原生 ticks、最多 60 個 script ticks，兩個效果均不刷新。
這是驗證時計修正，正式隱形時長沒有加長；完整 recorder 同時要求其
界線與原有四 chunk、q4 原料種類、Mob、reload／handoff 契約。

## 保留的來源與視覺內容

- 倒轉依 Java Mob 類別與 AABB，先取得完整存活名單再改名；魚類納入，
  Player／ArmorStand 排除，回呼不能改寫先前已選定的目標名單。
- W115 保留已確認的下界重生錨、yaw=0／forced=false、重複／取消／
  重生與離線等 pending 清理，以及原本 Respawn 成功結算與玩家資料。
- 原料數量／完整原生保存／回滾／取回、可堆疊 metadata、靜默操作、
  Ardent／Grass／Vision 時序、板面描邊、冰葡萄動畫、RGB 明暗和
  25 份 PBR companion，以及 W110 作者酒款／配方／音效皆保留。
- G120 的版本、helper／指南配套與來源樹不回退；完整 Cookery 0.2.7
  descriptor、作者 patch 與 copied helper 仍須整組驗證。

並行分支的舊 T136／W113 與本輪早期候選存在不同內容的同版號紀錄。
兩套原始提交和歷史保持不變；本版使用新的 T138／W115 身份，功能
delta 追加在真正的 T137 前身之後，沒有搬入衝突的舊歷史 key。

## 客戶端診斷與驗收範圍

新增的[多行輸入診斷工具](../tools/client-parity/README.md)保留來源
五個工具檔，用獨立 UUID 在新目錄生成測試包，讓真人分辨原生文字
控制器對換行、焦點、欄位 sibling 和鍵鼠／觸控／手柄的行為。
正式 UI 沒有因此啟用多行編輯，所有 client 結果仍 pending。

穩定相機 API 的三軸 free-camera 動畫入口，不等於已證明能保留原生
第一人稱、瞄準、手持與其他包的控制權來疊加 roll。真正穿牆輪廓、
完整裝備／名字隱藏與清仇恨、原生全域 reach／step-height／XP pickup、
彩字腳位距離／望遠鏡、任意三份非堆疊雪克杯原料、掉落展示與部分
效果仍有實作或平台差距。Grumm 畫面、透明、粒子、音效與同場景操作
尚未取得真人一比一驗收。

本候選須完成自己的定向回歸、完整配套原生首次／正常保存／重啟、
source-bound recorder、canonical CI 與 archive 核對。私人 BSM、
quality 與 LIVE 世界連線不可用，完整私人家族、fresh stopped-world
演練、備份與部署讀回未執行；既有持續授權保留。client=false、
production_ready=false、live_deployment=false。
