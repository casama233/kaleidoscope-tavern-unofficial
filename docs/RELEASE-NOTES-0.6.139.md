# 0.6.139：指南與完整還原修復合流

本候選整合已發布主線的三語指南與固定 T138 的實際修補，配對 World
Liquor 0.1.116。家族 Grilling 使用本輪已核對的主線來源，精確身份見
[家族鎖](../family/upstream.lock.json)。

## 玩家可見的變更

保留主線的七個指南入口、子分類、個別條目與完整製作資料。獨立酒館
指南與可選 Cookery 入口使用同一份內容；三語正文、用途與按需開啟
的配方資料保持已發布的指南修訂。W116 的 67 個三語條目完整保留。

配套 G122 精確來源為 `8002da0086544cd18c9854e7fe79e8ccb2f9f982`。
共用指南交接保留 G121 的 bytes；Cookery helper 已進至 0.2.9，正式
家族組裝必須使用同版本 descriptor、作者 patch 與全部 copied helpers。
本次 T／W 配套 native 不代表私人完整家族已通過。

同時合入以下已完成的功能修補：

- 機器保留真正原料數量與支援的原生 metadata，保存、重啟、回滾、
  取回與掉落不退回單純物品 ID；雪克杯保留三種合法 Q4 原料。
- 原生光效所有權跟隨實際 native 倒數；倒數暫停不因 script tick
  前進而誤失控制。保存讀回當前倒數，真正 entityLoad 的一次同 tick
  確認保留重啟光效，外部刷新仍交還控制，不重施／移除外部效果。
- 倒轉依 Java 的完整存活 Mob 名單與 AABB 先選取後改名；包括來源魚類，
  排除 Player／ArmorStand，早先的回呼不改寫已選定的其他目標。
- 保留靜默操作、opt-in Tipsy yaw、Ardent／Grass／Vision 時序、板面
  八向描邊、冰葡萄原料動畫、RGB texel 明暗及 25 份 PBR companion。
- W116 保留已確認下界重生錨的新出生點 metadata、yaw=0／forced=false、
  同 tick 重複與取消邊界，以及既有 Respawn 結算和玩家資料保留。

## 精確來源及相同舊版號的處理

主線來源為 `c461a8e643a08304587ef468ff7f8051369a2dd5`，固定的修補
來源為 `d9e7bcc6dd9d00beca0bbf76f0fff50b6eca0813`。World Liquor 分別為
`beda960c242b3b98a6b69e8950486ab5c6a44564` 與
`41c71180aa86be28297c767f7759298f02de1621`。兩側均保留 Git 祖先。

已發布的 T136／W113 與較早未發布 trial 存在相同版號、不同內容的
紀錄。主線每個已發布 history key 保持原值；trial 的原始 commits、
claims、功能見證與失敗／成功原生證據皆保留。本次使用新 T139／W116，
不重新發布或覆寫任何舊版本。相同路徑的舊 release note 依各見證的
`reviewedSourceCommit` 解析，主線 pathname 保留已發布文件。T133 是
既有例外：runtime source 早於 release note，後補文件精確來源
`d6dd97bc8e0488dc02d6b3bee34cb91ccd7d505b` 另列於合成紀錄，原 layer
不改寫。

[來源合成紀錄](../data/main-guide-integration-20261009.json)逐路徑核對
實際輸出。T139 的非身份 bytes 每個檔案都完整來自上述已審查主線或
trial，沒有未審查的混合檔案。主線 14 個功能 layers 與 trial 原有
6 個新增 layers 的路徑不相交，原 objects 依序保留，共 20 個 layers；
asset layers 保留為 5 個，59 個 trial additions 只追加、不覆寫舊列。
683 個既有反向投影、身份與來源雜湊限制全部通過。

## 本候選驗證

指南定向 Node 測試 44 項通過；W 的 storage guide projection 6 項、
實際 payload 保存投影、正式生成器逐 byte 冪等與 paired guide check
皆通過。配套指南包括 223 個 entries、67 個 addon 商品頁、31 個分類
與七入口；這是資料與控制器契約驗證，未代替真人輸入或渲染。

完整 native recorder 保留 first 20／restart 21 個必要案例，並整合
main 的生成輸入綁定：runner 根據本次實際複製的 W BP／RP／baseline
產生 observer 身份，recorder 重新生成並逐 byte 驗證。四 chunk 場地、
一次性 native-clock sentinel、reload／foreign handoff、Mob、q4 原料
與原始日誌契約均保留。Recorder 的 12 項拒絕回歸通過。

[先前 T138／W115 原生成功](https://github.com/casama233/kaleidoscope-tavern-unofficial/blob/d9e7bcc6dd9d00beca0bbf76f0fff50b6eca0813/docs/native/T138-W115-20261009.json)
保持原身份。新 T139／W116 的 build、完整首次／保存／重啟及 canonical
CI 以本候選後續實際結果為準，不將先前證據改名。

## 固定候選的實際首次／保存／重啟結果

T139／W116 已在 BDS 1.26.52.3 完成新的首次 20 個與重啟 21 個完整
案例，兩階段零玩家、零內容錯誤、正常保存停止。嚴格 recorder 也
通過完整來源／生成輸入／原始日誌綁定；[本版證據](native/T139-W116-20261009.json)
保留真實結果。重啟有且只有一次 speed 載入確認，外部 800-tick 刷新
三 ticks 後為 797 並交還控制；兩阶段的一 tick 隱形均經原生倒數
2 ticks、script 等待 3 ticks 確认到期。原料數量、metadata、三種合法
q4 酒款與完整 Mob 選取皆保留。沒有 Player 操作或渲染驗收宣稱。

本次真實 packager 已通過凍結、乾淨來源與 archive 全檔驗證；
archive SHA256：`232173376267e2ddfa044094e9bb00dcaf5597bc7de79f943d726b60e558e3d1`。
最終 canonical CI 由本候選 PR 的完整必要工作執行，與本機證據分列。

## 仍未完成的畫面與操作範圍

Grumm 實際倒轉／名字可見性、PBR／透明、粒子與音效、同場景操作和
鍵鼠／觸控／手柄仍待真人一比一比較。完整 Player 重生錨操作、原生
Player 載入生命周期與私人存檔遷移未由零玩家引擎測試證明。

純第一人稱附加 roll、真正穿牆輪廓、完整裝備／名字隱藏與清仇恨、
全域 reach／step-height／XP pickup、彩字距離／望遠鏡語義、任意三份
裝飾非堆疊雪克杯原料、掉落展示上下文及部分效果仍有差距。多行板面
只有隔離 client 診斷工具，正式 editor 沒有宣稱完成。

私人 BSM、quality 與 LIVE 世界連線不可用，完整家族與 fresh
stopped-world 演練、備份及部署讀回仍未執行。既有持續部署授權保留；
client=false、production_ready=false、live_deployment=false。
