# 0.6.141：保留最新指南，修復載入光效與初次登入

T141 以已合併的指南 T140
`79e2ad0fb9f5a59f93be41aee002ddf2a809d71b` 為基礎，配對 W118／G122。
保留 T140 的四個 AMW 條目、三語文案、種植／果汁／附屬釀造分類、
七入口與兩種入口共享投影，以及 receiver 的四 ID 精確限制。公開
Tavern／World Liquor 維持 223 條目；完整家族 227 條目的來源與驗證
範圍保持 [T140 說明](RELEASE-NOTES-0.6.140.md) 所列界線。

## 修正的玩家行為

保存光效的原生載入必須具備同一實體的 invalid-before、真正
entityLoad，以及同 tick 精確 after 三事件鏈。已核對的保存資料、
native row identity、amplifier、剩餘時間及 durable fence 必須相符；
有效實體上的真正外部刷新立即否決對應票券，不改寫其原生效果。

initialSpawn 保留已核對的同 tick proof 與已消耗狀態，修正
`entityLoad → initialSpawn → after` 丟失合法光效，以及已消耗後經
spawn／重複 load 重發票券。initialSpawn 本身與一般 restore 不能
授權載入豁免；普通重生、死亡、離線、跨 tick 及資料衝突仍清理。

未能對應名稱的 valid-before 先暫停既有 proof。只有本 tick 已存在
的 own-write ticket 經 after 與目前 native 讀回精確確認，才以真實
typeId／displayName 唯一解除無關票券的暫停；一般未知 foreign after、
歧義、取消或缺少 after 不解除，已否決／消耗的票券不能復活。這保留
載入 Speed 後正常新增 Strength 的既有行為，名稱不靠猜測映射。

T139／T140 的實際原生倒數暫停、逐 row 新鮮保存、五個原生 ticks
恢復容差、內部合法保存的 witness 重綁、rollback／durable fence、
own-write 退休、native-only 死亡及完整 Mob 選取全部保留。

## 原生證據與保存範圍

Recorder 恢復 frozen baseline、current source 與 runner 啟動前
`report.sources` 的 repository／version／commit／兩個 pack 完整
一致，以及六份 observer／helper／generated inputs、main append
marker 與完整七個 overlay keys 的綁定。Source/stage 同步漂移也不能
將舊日誌改標為新來源；完整 first 20／restart 21 案例、raw logs、
正常停止、零玩家及拒絕覆写舊輸出的守衛保持。

兩份 runtime 效果檔與三份測試／recorder 工具精確承接已固定修補
`c78272afd0eb011aa3b25e2d48678dd9ee4aa6c2`；搬移前確認新主線對應
五檔仍等於 T139，搬移後 disk/index/已測 source bytes 完全一致。
因此重用 aura **58/58** 與 recorder **14/14** 的定向結果，沒有
為新版本名重跑相同測試。原 T139 41 個 aura 案例保留；三個核心
反例已先在未修正 T139 上確認失敗。新的完整配套 CI／原生測試另行
執行，不能挪用先前版本結果。

原來準備的未發布 T140 aura 候選與後來已合併 T140 guide 有不同
內容。其原 commits、frozen claims、history 與 scoped 證據全部保留，
本版採新 T141 身份並保留已合併 guide T140 的 history key 原值。
兩個 aura 功能反向見證只追加本版 layer，所有舊資產／功能 witness
及六個原 geometry allocations 保持原來源，不重寫歷史。

W118 以 `0ebf77ed7d302f453e75d9c56cc603e709ed226d` 為前身，僅同步
身份與 T141 依賴；67 個三語頁、確認重生錨、配方、作者效果資料、
模型及音效不變。G122 固定
`8002da0086544cd18c9854e7fe79e8ccb2f9f982`，Cookery helper 0.2.9
的 descriptor、作者 patch 與 copied helpers 仍須整組驗證。

## 當前完整驗證與一比一界線

本版完整 `Canonical validation` 與配套 W 的 `Release package checks`
以各固定 PR 的實際 Actions 結果為準；native-persistence 必須對本次
輸入重新完成首次／保存／重啟及嚴格 recorder。正式 archive 由乾淨
凍結來源產生，發布時逐 entry 核對與讀回。沒有 simulated players。

上述回呼反例不等於真人登入；零玩家 BDS 不等於粒子、PBR／透明、
音效或鍵鼠／觸控／手柄一模一樣。原作 RGB texel 明暗、板面描邊與
冰葡萄動畫已實作，實際 client 材質與資源包堆疊仍需比較。

純第一人稱附加 roll、穿牆輪廓、完整裝備／名字隱藏與清仇恨、全域
reach／step-height／XP pickup、彩字距離／望遠鏡、任意三份裝飾
非堆疊原料、掉落展示上下文及正式多行板面 editor 仍有實作差距。
原生 API 沒有通用來源 transaction ID，未知同值事件不能推定為自己。

本環境沒有私人 BSM／quality／LIVE 連線；完整家族、fresh stopped-world
保存演練、備份及部署讀回未執行。既有持續部署授權保留，
`client=false`、`production_ready=false`、`live_deployment=false`。

## 凍結來源與封裝

原生修補及指南的完整審查來源為
`ab419bd89ce996ff2ec781eca0927840e4fc6da1`，完整 Git tree
`0e70817d8cc8e624accfc023f66c46fc85598a13`；本地乾淨封裝提交
`c9e2d5725443b66c180967d3494446e1c87a7735` 與該來源全 tree 相同。

正式 `Kaleidoscope_Tavern_Unofficial_0.6.141_baseline1.mcaddon`
共 5884949 bytes，SHA256
`3c0acd9bd7292dfa52b2018c057a3ffa5ca68e3bd4d62f2666fefc427889d0b0`。
實際封裝已核對完整 BP／RP 與資源材質宣告；這不等於發布或客戶端驗收。
來源見證、release request 及後續固定 peer 的提交只增加審查／配對
metadata，不修改凍結 runtime；最終 PR／CI 仍按其自身完整 tree 驗證。
