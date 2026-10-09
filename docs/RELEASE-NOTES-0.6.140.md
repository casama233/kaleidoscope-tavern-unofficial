# 0.6.140：載入光效、外部刷新與初次登入順序

T140 以已合併 T139
`ada02bfd5dd708d0d733ca7ad6593672ca3ad2f7` 為基礎，配對 World Liquor
0.1.117／Grilling 2.8.122。T139 的機器與雪克杯原料保存、完整 Mob
選取、板面描邊、冰葡萄動畫、RGB 原作 texel 明暗、PBR companions、
靜默操作和三語指南全部保留。

## 本輪修正

原生重啟可能先送出尚未有效實體的 before-add，再送 entityLoad，
最後送出效果載入的 after-add。T139 只憑 entityLoad 建立一次確認票券，
因此同 tick、相同效果與剩餘時間的真正外部刷新可能先消耗該票券。
本版要求同一實體的 invalid-before、已核對保存資料的實際 entityLoad
及完全相符的同 tick after 三者連接；有效實體上的外部 before-add
立即否決該效果的載入豁免，不改寫或移除外部原生效果。

玩家 initialSpawn 曾無條件清除 track，造成兩個事件順序錯誤：
`entityLoad → initialSpawn → native after` 丟失合法確認；已消耗確認後
再經 initialSpawn 與重複 entityLoad，則可能重發票券。本版保存已核對
的同 tick proof 與已消耗狀態；initialSpawn 本身不能發票，普通重生、
離線、死亡、跨 tick、保存資料／fence 變動與不明讀取仍撤銷或拒絕。

確認精確綁定原生效果 ID／實測顯示名稱、剩餘時間、amplifier、保存
資料與持久 fence。名稱不靠任意大小寫猜測；未提供 before-add API
時不推定載入來源。互不相干且仍精確相符的其他效果保留各自 proof。
原生已消耗／被拒絕的票券不能透過通用 restore 再建立。

暫時無法對應名稱的有效 before-add 先暫停載入豁免；只有本 tick
既有 own-write ticket 經 after 與目前原生效果精確確認，才能用該
after 的實際 typeId／displayName 唯一解開無關票券的暫停。一般外部
未知 after 不解除；取消、歧義或未收到確認也不放行。這保留載入
Speed 後正常施加 Strength 的既有行为，沒有擴張原生來源猜測。

T139 的原生倒數暫停支援、逐 row 最新讀回、五個原生 ticks 保存容差、
內部合法保存的 witness 重綁、失敗持久 fence、own-write 退休規則及
native-only 死亡清理保留。沒有將整份實作回退至舊候選。

## 原生證據不能改標來源

Recorder 保留完整首次 20／重啟 21 案例與 generated World Liquor
inputs，補回 frozen baseline、目前 source fingerprints 與 runner
在啟動前保存的 `sources` 三方精確一致，包括 repository、version、
commit 及兩個 pack。六份 observer／helper／generated inputs 的雜湊、
main append marker 與完整 overlay key 集合也須相同。

同時更換目前 source 與 staged copy，不能把舊 report／raw log 改標成
新來源。完整日誌、必要案例、正常停止、零玩家與新檔排他輸出守衛
保持原狀。本次工具修補本身不代表重做任何舊原生測試。

## 來源與驗證

三個新 production-callback 反例先在原 T139 重現失敗，再隨修補接受
既有 aura 定向回歸和獨立代理審查。Aura 58 項全部通過，原 T139
41 項斷言保留，新增 17 項針對上述來源／順序與相容性問題。
Recorder 定向 14 項通過，包含
原 12 項與同步來源漂移／完整 overlay 綁定的兩项反例。

正式完整檢查與新的首次／保存／重啟由最終固定 PR 的
`Canonical validation` 執行；其 Actions 結果和原始 native artifact
是本候選的實際結果。舊 T139／W116 的 20／21 原生成功與已發布
T139 的 13 個、W116 的 4 個 CI 工作保留原身份，不能當作 T140 通過。
完整包由乾淨提交的正式 packager 產生，expected archive SHA 在建置後
寫入 release request；打包不套 gameplay patch。

World Liquor 以 `dd56def61d5b66d9bbc9e697e5e272e5f9e3ed4b` 為前身，
只同步新身份與 T140 相依；67 個三語條目、確認的下界重生錨修補、
配方、效果與資源完整保留。所有 CI checkout 固定本輪實際 peer commit。
Grilling 保留 `8002da0086544cd18c9854e7fe79e8ccb2f9f982`，Cookery
helper 0.2.9 的 descriptor、作者 patch 與 copied helpers 須整組驗證。
既有 release history、失敗候選及 geometry source witnesses 不改寫。

## 一比一還原的實際界線

回呼反例證明程式處理方式，零玩家 BDS 證明限定原生場景；兩者均未
證明真人登入事件順序、粒子畫面、PBR／透明、音效或鍵鼠／觸控／手柄
操作一模一樣。原生 API 沒有通用來源 transaction ID，未觀察到的
同值外部原生事件來源不能憑資料相同便宣稱已識別。

純第一人稱附加 roll、穿牆輪廓、完整裝備／名字隱藏與清仇恨、全域
reach／step-height／XP pickup、彩字距離／望遠鏡語義、任意三份裝飾
非堆疊原料及掉落展示上下文仍有實作差距。正式多行板面 editor
尚未完成；隔離診斷工具仍等待真人。原作 RGB 明暗已實作，實際
材質、遠距濾波與資源包堆疊須由 client 比較，不混稱為尚未實作。

本次環境無私人 BSM／quality／LIVE 連線，完整家族、fresh stopped-world
保存演練、备份與部署讀回尚未執行。持續部署授權保留；
`client=false`、`production_ready=false`、`live_deployment=false`。
