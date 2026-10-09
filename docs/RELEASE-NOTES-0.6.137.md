# 0.6.137：原生重啟光效、倒轉目標與重生錨配套

本候選為 **Tavern 0.6.137／World Liquor 0.1.114**。保留 T136／W113
所有來源修補，並修復完整原生重啟實測發現的光效保存問題。T136／W113
的 frozen identity、原生失敗報告和功能來源見證均保留，不改名為本版成功。

## 修復原因與行為

[T136 原始配套報告](native/T136-W113-20261009.json) 的首次啟動通過，
重啟卻在 saved appearance lease not restored 失敗。獨立世界副本的較早
實際資料有 speed lease ticks=540、native ticks=537；最後原生效果仍有
464 ticks、ShowParticles=0，保存的光效紀錄已消失。

新的[唯讀原生事件追蹤](native/AURA-RELOAD-DIAGNOSIS-20261009.json)確定原因：同一 restart tick 的 entityLoad 先以
保存 550／native 549 成功恢復 ownership，緊接的原生 EffectAdd 仍是 549，
卻被原程式視為外部刷新，造成 handoff 增加並清除紀錄。不是效果未保存，
也不需要放寬原本最多 5 ticks 的保存比對或補施效果。

修補只在真正 entityLoad 入口，針對已通過舊 schema／duration 檢查的
保存效果建立一次載入通知見證。只有同 tick、同效果、同 amplifier、
同原生 duration 的對應通知可被消耗一次。一般恢復／掃描不產生見證，
新的宿主寫入、外部接管、失效或下一 tick 都會使它失效。消耗前再核對
保存原字串與目前停權狀態；原生效果單獨存在的生物死亡時，也在當 tick
清理載入見證。真正外部刷新
仍交還粒子外觀控制，不重新施加、刪除或延長對方的 gameplay 效果。

這修正了原生效果仍在但來源光效停止的重啟差距。穩定 API 沒有提供
完整效果來源或粒子旗標，不能由此宣稱任意同 tick 跨套件行為或真人
粒子畫面全部一比一；實際 Player lifecycle 仍需真人環境驗收。

## 本輪保留的玩家修復

- 倒轉效果依 Java Mob 類別及 AABB 取得完整存活名單後才逐一改名；
  納入沒有 Native mob family 的原生魚，排除 Player／ArmorStand。
- W114 保留 W113 的已確認原生下界錨 metadata、yaw=0／forced=false、
  repeat／取消／重生／離線處理，以及原有 Respawn 成功結算順序。
- 原料完整原生保存、count／rollback／回收、可堆疊原料 metadata、
  板面描邊、冰葡萄動畫、RGB 明暗、25 份材質 companions、靜默操作、
  Ardent／Grass／Vision 時序及 W110 作者內容全部保留。
- G120 保持已審查的 helper／指南相容來源；完整 Cookery 0.2.7 的
  descriptor／作者 patch／copied helper 仍須成組驗證。

## 測試與來源保留

T136 的 Mob／Vision／BloodyMary 18 項、Ardent／Grass 21 項、W113 的
錨 metadata／正式 resolver 33 項及兩個材質 checker 已通過且相關內容
不變。本版補上能重現原生事件次序的定向回歸與外部刷新反例。
完整必要套件由最終 PR CI 執行；原生 paired 首次、正常停止、重啟、
完整 observer recorder 及發行 archive 皆按本版 exact source 讀回。

承接 T135 後續來源 `26626bdc39e687dbb465e33c7f0e10083fe80e95` 的
完整原生記錄器、machineKind 及 CI 完整場景門檻。保留本輪已實測的
原座標四 chunk preload 場地，並將 Mob、更明確原料種類及載入觀察
納入同一完整記錄契約，不能只看 done 或部分成功行數。

T136/W113 原始來源在 `edc9e464f8ea987fa07927182a2b741720c82430`／
`0031f5939c32b707f5081a6e4b1ad47c108a587c`；功能見證仍指向各自
原始 functional source，後續提交不重寫已審查差異。

## 尚未完成的驗收

純相機 roll、真正穿牆輪廓、完整裝備／名字隱藏與清仇恨、原生全域
reach／step-height／XP pickup、多行板面編輯、彩字腳位距離／望遠鏡、
任意三份非堆疊雪克杯內部原料、掉落展示及部分 World Liquor 效果仍
有平台或實作差距。Grumm 實際倒轉、透明、粒子、音效、相同场景鍵鼠／
觸控／手柄仍未取得真人一比一驗收。

私人 BSM、當前 quality checkpoint 與 LIVE 世界連線不可用，完整
私人家族、fresh stopped-world 演練、備份、部署與讀回未執行。既有
持續授權保持不變；client=false、production_ready=false、live=false。
