# 0.6.142：整合板面、雪克杯與載入光效修復

T142 以 canonical T141 `ebca0bbf6efc5459ed30a9a4a1c264477c274453`
為基礎，配對 W119。完整保留 [T141 板面換行／雪克杯來源辨識修補](RELEASE-NOTES-0.6.141.md)、
四頁 AMW 指南、三語七入口與兩入口共享投影，以及既有原料保存、
RGB texel 明暗、描邊、冰葡萄動畫、Mob 選取與原作靜默操作。

## 載入與登入光效

保存光效的原生恢復必須具有同一實體的 invalid-before、真正 entityLoad、
同 tick 精確 after，並核對保存 row、native identity、amplifier、
剩餘時間及 durable fence。有效實體的真正外部刷新會否決對應票券。
initialSpawn 保留已核對 proof 和已消耗狀態，不能自行授權或重發；
一般 restore、重複 load、跨 tick、死亡、離線及資料衝突均保留拒絕／清理。

未知 before 名稱暫停既有 proof；只有同 tick 已存在的 own-write ticket，
經 after 及 native 精確讀回，才能解除無關暫停。一般 foreign after、
歧義或取消不解除；保留載入 Speed 後合法新增 Strength 的原有行為。
原生倒數暫停、逐 row 新鮮保存、五個 native ticks 容差、合法其他 row
保存、rollback／fence、own-write 退休與 native-only 死亡清理均保留。

## 保存證據與新配對

Recorder 在最新 canonical 契約上合入完整來源綁定：frozen baseline、
current source、runner 啟動前 recorded repository／version／commit／
完整 BP／RP 一致，並精確核對六份 observer／helper／generated inputs
與 main append marker 的七個 overlay entries。不能同步更改 source／
stage 後重用舊日誌，也不能覆寫舊證據。

最新 familyless-fall 場景與原有反例全數保留，完整契約為 **first 21／
restart 22**。融合後 recorder 定向測試 **15／15** 實際通過一次。
三份 aura source／test bytes 精確承接先前 PR310 的已測內容，重用
**58／58** 定向結果；沒有為版號重跑相同測試。

先前 aura 候選 head `e831804435a88c59f625c7dd2026a5c02bd56653` 的
[CI run 37882973224](https://github.com/casama233/kaleidoscope-tavern-unofficial/actions/runs/37882973224)
13 jobs 及 native 20／21 已成功，但不包含後來加入的 board／shaker／
fish 整合。該 head、archive、claims、history、原始日誌及全部 witness
保留原身份；T142 需要自己的完整 CI 與 native 21／22，不能改標舊結果。
Canonical T141 的 note、history、native 報告與三個功能 witness 也原樣保留。

W119 基於 `bd022a205a317a0fe813041dcc5b99152d07bdf5`，保留 W118
84 個原版 LivingEntity 對應與魚類 MultiJump／Tequila／instant／credit
入口、確認重生錨、全部 67 個三語頁及作者效果資產，只更新身份和 T142 相依。
公開指南 223 條目／31 分類與完整家族 227 的來源範圍分開。

保留主線 [G123 指南語系整合候選](../family/GUIDE-LOCALE-ADAPTATION.md)
與 family lock 的原值。G123／helper 0.2.10 的 descriptor、Cookery
registry 微型掛鉤和 copied helpers 必須整組驗證；W 的固定 G122
CI helper 對照沒有 entity definitions 差異，不能替代私人家族接收。
G123 自身 canonical／發布狀態以其 PR／release 實際結果為準。

## 驗收界線

本次兩庫完整 CI、來源綁定原生首次／正常保存／重啟與正式 archive
完整性各按新候選結果核對。零玩家引擎結果不等於真正 Player 登入或
真人粒子、PBR／透明、音效、鍵鼠／觸控／手柄驗收；沒有 simulated players。

純第一人稱附加 roll、穿牆輪廓、完整裝備／名字隱藏與清仇恨、全域
reach／step-height／XP pickup、彩字距離／望遠鏡、任意三份裝飾
非堆疊原料、掉落展示上下文與正式多行板面 editor 仍有差距。
原生 API 沒有通用 producer／transaction ID，未知同值事件不能當作自己。

本環境沒有私人 BSM／quality／LIVE 連線；完整家族、fresh stopped-world
保存演練、備份與部署讀回未執行。持續部署授權保留，`client=false`、
`production_ready=false`、`live_deployment=false`。

## 凍結與封裝來源

完整審查來源 `717b129cd0a7bd614d0b4bf697c6f309af1a6a02`，Git tree
`a4136bc6687535b7307ec98dfbfe23abdb813c56`，與本地乾淨建置提交
`c7d0633c422caa58741274b689126936cbed1a04` 的完整 tree 相同。
正式 `Kaleidoscope_Tavern_Unofficial_0.6.142_baseline1.mcaddon`
為 5886443 bytes，SHA256
`6905419012c4344e29e7a63cd25751c8b93d575c885a3ff0c774dfed1c5afad4`。
實際建包已驗證 BP／RP 每個輸出與材質宣告。後續 witness、archive
審查和 peer pin 只改 metadata，凍結 runtime 不變；最終 CI 仍檢查
新 PR 自身完整來源，不把封裝成功當作發布或 client 驗收。

## 最終公開配對

五個 CI peer checkout 固定 W119 最終來源
`e85ad815f90e9ddf30f09d4f0a3b2f168ec7fa2a`，完整 Git tree
`c9d259f4bb63ab051b8ca05f2b794f8cdc795b7e`。W119 的 integration 與 release
request 固定 Tavern 審查來源 `2c378031110d6ff6e348613d4bc3c34092770ddf`。
兩側 exported runtime 與各自凍結封裝來源相同；本配套仍須完成
其實際 PR CI／原生 first 21／restart 22，不預先宣稱發布或客戶端成功。
