# 森羅家族：當前修補與 PR 處置

更新：2026-10-09。本頁是本輪家族修補與舊 PR 承接的當前入口，版本及內容身分仍由各庫 baseline 和 [family lock](../../family/upstream.lock.json) 決定。歷史 PR 的來源保留為固定證據，不作新包輸入；真正 GitHub 狀態以各 PR 的合併／收束紀錄為準。

## 當前修復候選：T137／W115／G121

以公開 main `c461a8e643a08304587ef468ff7f8051369a2dd5` 的三語指南為基底，
重新整合 PR302 的原料／交易／視覺／沉浸修復與新的 aura 重播守衛。
[本輪完整範圍](../RELEASE-NOTES-0.6.137.md) 自包含修復、失敗診斷及剩餘差距；
41 個 aura 定向案例已通過；凍結 source `a360fe0e2970c65ee0cfad6ad8d08f86f6cbcbf5`
及實際 archive 已列入本輪說明。配套 PR 和 exact CI 證據仍待補齊，未预先宣稱 native、client 或 LIVE 成功。

| 來源 | 當前處置 |
| --- | --- |
| 公開 [T136 三語指南](../RELEASE-NOTES-0.6.136.md)／main `c461a8e6` | 完整保留七入口、製作明細與同一個可選 Cookery view；公共 notes／歷史原樣保留。 |
| [PR302 unmerged alternate T136](https://github.com/casama233/kaleidoscope-tavern-unofficial/tree/71e5c372cce282d8130290d01812929c9e7db1f8) | 固定 `71e5c372cce282d8130290d01812929c9e7db1f8` 和 [CI 37875325541](https://github.com/casama233/kaleidoscope-tavern-unofficial/actions/runs/37875325541) 的失敗。12 jobs、首次 18 cases 與重啟前六 case 成功不等於 paired native 成功；不將其 alternate T136 notes 蓋到公共指南。修復內容以新 T137 身份整合。 |
| [T133 draft PR298](https://github.com/casama233/kaleidoscope-tavern-unofficial/pull/298) `625ff769f4c656ff224314bba38d26a1ef5dacc0` | 保留 reviewed finite-XYZ 鍵序修復與來源；承接修復不表示原 PR 已合併。 |
| T134／T131 geometry witnesses | 保留原 release、reviewed source、hash 及 reviewDocument；T134 notes 是未合併 PR302 的 immutable 來源證據，不改寫公共版本歷史。 |
| W115／G121 | 保留公共世界名酒指南、W110 Dassai／四杯模型作者適配；保留 G121 與已合併 G120，不退回 G119。W115 精確相依本輪 T137。 |

原生剩餘時計與 invalid-before → verified entityLoad → single-use after
已實作，valid foreign-before 會 veto；同 tick 的 Player initial-spawn 只
保留已驗證 proof，不開一般豁免窗口。完全相同 after-only 來源仍無欄位可辨。
微醺 additive roll 與正式 multiline 仍未完成；隔離 UI 工具不計作修復驗收。
既有 LIVE 持續授權不变，本候選仍須 canonical PR／CI、完整家族與存檔演練、
准入部署及讀回；最後記錄的 T132／G119／W110 不當成本次新讀回。

## 保留的公開 T136 指南候選與來源

以下是公開指南候選的原始範圍；其中「未納入本候選」專指當時 T136，
當前 T137 的整合狀態以上節為準。

本輪候選為 **T136／W113／G121**。T136 凍結來源 `496ce702` 以已部署的
T132 玩法重修指南；W113 `92168bec` 保留 W110 玩法並重寫 67 個三語條目；
G121 `2b422458` 保留已合併 G120 `8dc3e9d4`，提供可選 Cookery 酒館章節交接。
七入口、完整製作方法與三語呈現規則見 [GUIDE-EDITORIAL.md](../GUIDE-EDITORIAL.md)
及 [T136 release notes](../RELEASE-NOTES-0.6.136.md)。

| 來源 | 本輪處置 |
| --- | --- |
| [T135 PR302](https://github.com/casama233/kaleidoscope-tavern-unofficial/pull/302) | 尚未合併並保留來源。原生重啟的 `effectAdd` 重播撤銷保存的外觀 lease，完整 native-persistence 未通過；其 runtime 不納入 T136，未豁免失敗或以指南驗證代替。 |
| [T133 PR298](https://github.com/casama233/kaleidoscope-tavern-unofficial/pull/298) | 草稿與 reviewed source 繼續保留，未納入本候選。 |
| [G120 main](https://github.com/casama233/kaleidoscope-grilling-unofficial/commit/8dc3e9d440577cd70501c377722f8e27b0913d44) | 已合併內容由 G121 承接，不回退到 G119 來源。 |

LIVE 仍為 **T132／G119／W110**。新候選須完成確切來源 PR／CI 與完整家族
static、BDS、停服存檔演練、准入及部署讀回，才更新 LIVE。
`client=false`、`production_ready=false`、`pending_client_acceptance` 繼續保持；
兩入口共用顯示與文字檢查不能當作真人排版／操作驗收。

## T132／W109：多代理同步修復

從已交付 T131 `e02c19da3a8e29d7574c5922e142ef99775dd643` 和 W108
`e8fa8c91606f1fc2d9cc0e54df801aa7c45c3d8c` 接續。
[T132 範圍](../RELEASE-NOTES-0.6.132.md) 集中記錄濺射 dispatcher／免疫政策、
雪克杯回呼及重試、原生保存回滾、感知類別／查詢順序、指南動畫、板面 escape
與 HUD 尾巴。三代理實作後互相及由主代理審查，來源反例補入同一候選。
W109 只同步 T132 相依與本包身分，G119 維持既有來源。

完整必要 CI 與本批 T/W 零玩家首次／重啟結果，以配套 PR 的確切提交為準；
原生 observer 明列測試 event envelope 和 API acknowledgement 邊界。
新版仍沒有宣稱 native multiline、through-wall outline、全域動畫相位、
完整 ItemStack、RGB／camera／drop geometry 或真人輸入全部一比一。
正式版本及互相依賴由 baseline/history、family lock 和不可變 CI pins 定義。
私人 BSM／LIVE 連線與完整家族保存演練仍不可用，既有部署授權繼續有效。

## T131／W108：原版體驗查核後的逐步修補

從已合併 T130 main `c4453491e2f52d4b4515dda0385db204aa892c97` 接續。
[T131 說明](../RELEASE-NOTES-0.6.131.md) 集中記錄直接觸控、家具、Adventure、
兩手雪克杯、靜默提示、四種動畫物品、感知音效、莫洛托夫及板面／農架交易。
W108 精確依賴 T131，並補上 G118 新增、G119 保持相同 bytes 的兩個無碰撞展示 helper；最新 G119 不需更改
runtime。歷史來源對照只追加新 witness，不改寫舊版證據或打包 runtime。

本輪 source/API 定向回歸及凍結 archive 核對已執行。World Liquor
[PR88](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/pull/88)
在 `.github/baseline-integration.json` 固定含工具修正的 Tavern 來源；
[Tavern PR296](https://github.com/casama233/kaleidoscope-tavern-unofficial/pull/296)
的五個 CI peer 則採同一個不可變 L108 提交。實際
原生結果以確切 PR 的 native-persistence 證據為準；完整家族、client 及
LIVE 不從 T130/W107 的既有成功推定。保留差距與下一步見新版 release
notes 及 [當前還原度表](../PARITY-MATRIX.md)。

相機 roll、完整內部 ItemStack、任意 RGB 陰影、穿牆輪廓、掉落3D／GUI2D
及原版多行板面編輯器仍有平台或未驗證方案；沒有為了一比一標籤而移除
資料保護、改掉自由瞄準或發出已知有 mip 破洞風險的資源包。

## T130／W107：視覺效率與可用 API

本輪從已交付 T129／W106 繼續；[T130說明](../RELEASE-NOTES-0.6.130.md)
記錄展示維護、作用中 PUT 回調、醇熱／Bloody Mary、語言路由和舊杯可讀
資料修補。三張中文圖片仍需本候選真人 tooltip 驗收，未用日俄文修正取代。
最終 T130/W107 完整來源已通過隔離零玩家 BDS 的載入／重啟及指定原生
場景；它不等於私人整套家族或 LIVE 世界驗收。

World Liquor 的 integration 與發布 request 同時固定 Tavern
`d5655de6b6bdd50bd19b0ae7b4844d30406d3808`；Tavern 四個 peer checkout
固定 World Liquor `c91a1c0f46c23ae391ff2cdf5e92b0d1d7d77f3b`。
本輪發布目標為 [T130](https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/tag/v0.6.130-beta.1)
與 [W107](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/releases/tag/v0.1.107-preview.1)。
下列已交付版本、歷史 source heads 及未完成玩家場景繼續保留。

## T129／W106 雞尾酒修復

本輪從下列已交付 T128／W105 基線接續；新的 Tavern0.6.129 與 World
Liquor0.1.106 合併調酒操作、完整外層雪克杯保存、提示／HUD／音量及效果
適配。原料內部三格容器因原生失敗排除，避免把腳本 fixture 成功當成引擎
成功。[版本說明](../RELEASE-NOTES-0.6.129.md) 是本批來源、分段修復和驗收
場景的單一入口；[第三方包審查](../THIRD-PARTY-TAVERN-REVIEW.md) 記錄
Loyallay 公開版可吸收設計及未解決的原生限制。

兩庫 CI 固定本批真正配對提交：World Liquor 的 [PR86](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/pull/86)
使用 Tavern [PR290](https://github.com/casama233/kaleidoscope-tavern-unofficial/pull/290) 的修復與審查工具提交 `64f5d25d3e7f6156630a9c3a90020cd87efba051`；Tavern 的四個 peer checkout
統一使用 World Liquor `cbf86880e103dfa9cb6ac80eac1528734b41a73b`。本批發布目標為
[T129 測試版](https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/tag/v0.6.129-beta.1)
與 [W106 測試版](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/releases/tag/v0.1.106-preview.1)，
實際發布以各庫 workflow 的上傳／讀回結果為準。
本工作區的獨立零玩家 BDS 只證明指定保存／掉落場景，沒有完整家族或
LIVE 存檔連線。下方歷史 PR 和六個尚待玩家驗收的工作入口保持原始證據。

## 已交付起點（T128／W105）

| 套件 | 凍結版本與交付 | 已修的行為 |
| --- | --- | --- |
| Tavern | **0.6.128**／[PR284](https://github.com/casama233/kaleidoscope-tavern-unofficial/pull/284) | 安裝包必須通過凍結身分；startup 實際 wiring 可驗證；手持雪克杯提早取消、完成、倒出保持完整物品資料與回滾。 |
| Grilling | **2.8.117**／[PR180](https://github.com/casama233/kaleidoscope-grilling-unofficial/pull/180) | 延後爆炸結算再次確認取消狀態；手持營養在 hunger 更新後重取 saturation／effectiveMax，保留失敗回滾；精確 source witness 納入兩段修補。 |
| World Liquor | **0.1.105**／[PR85](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/pull/85) | Shared-spawn Respawn 排除 85 個已核對的無碰撞家族 helper；未知外部實體保持拒絕；補齊現行工具 interpreter／UTF-8／LF。 |

W105 的 BP/RP 精確依賴 T128。G117 的 Cookery1.6.0 宣告保留；W 不將可選 Grilling 變成硬性依賴。Tavern CI 固定 W105，World CI 固定 T128／G117，避免使用移動分支或舊 sibling 測試來源。

三個公開自有 BP 的現行靜態核查為 245 blocks、3503 material maps、0 errors；baseline／manifest／family lock 的版本、UUID、相依與 source trees 一致。這不包含私人／外部作者包的實體內容，也不是原生 BDS、Player、保存世界或 client 成功證據。每個交付 PR 的 required Actions 必須對確切提交成功才合併；本機不重跑未變且已成功的完整套件。

## 六個集中追蹤入口

| 順序 | 工作與固定入口 | 舊線承接與下一個辨識場景 |
| --- | --- | --- |
| 1 | [Grilling 放置餐盤 #181](https://github.com/casama233/kaleidoscope-grilling-unofficial/issues/181) | #146／147／148／149／150／152 的顯示差異；成功交易後 dirty、完整 ordinary mesh、四朝向與 3→4→5 份轉換。營養／防誤食已保留。 |
| 2 | [Grilling 手持餐盤 #182](https://github.com/casama233/kaleidoscope-grilling-unofficial/issues/182) | #153／155／156／158／161／163／164；先核對兩手 property／registry／publisher，再以可讀 count1／4 與可辨第五槽控制定位 decoder。`+0.5` 尚未原生驗收。 |
| 3 | [HUD／title／foreign writer #285](https://github.com/casama233/kaleidoscope-tavern-unofficial/issues/285) | #170／172／119；有限跨維度恢復、title ownership、三種 transport admission 與 Milk 後不復活舊圖示。 |
| 4 | [Tipsy #286](https://github.com/casama233/kaleidoscope-tavern-unofficial/issues/286) | #169／195；保留原生瞄準／手持的視覺、首次 status read anchor 與清理。T112 過度抖動的使用者拒絕仍有效。 |
| 5 | [特調 RGB #287](https://github.com/casama233/kaleidoscope-tavern-unofficial/issues/287) | #189 七樣本 binding 診斷；保留 atlas／六影格／玻璃分層，辨認域外 RGB 的陰影差距。 |
| 6 | [目前 GUI／shaker 投影 #288](https://github.com/casama233/kaleidoscope-tavern-unofficial/issues/288) | #142 及 #167／149 未完成視圖範圍；真正 GUI 匯出全檔比較與當前候選的 first/third-person、skin、FOV、use/pour 對照。 |

每個 issue 均保留舊 head 的完整 SHA 連結、目前起點、實作邊界及 source／native／client 分開的驗收。建立 issue 和關閉舊草稿不表示剩餘功能已修。放置餐盤不依賴手持尚未確定的解碼。

既有未完成報告仍保留：[Tavern 原生語義總追蹤 #98](https://github.com/casama233/kaleidoscope-tavern-unofficial/issues/98)、[Grilling inventory icon #166](https://github.com/casama233/kaleidoscope-grilling-unofficial/issues/166)、[實際自填瓶搖勻／撒料與顯示 #168](https://github.com/casama233/kaleidoscope-grilling-unofficial/issues/168)。本輪交易修補沒有自動關閉这些 player/client 缺口。

## 37 個原 PR 的承接

Tavern 原 13 個見下表：#284 完成修補並合併，另外 12 個舊草稿已核對 head 後關閉，原分支保留。Grilling 的 [18 個逐項索引](https://github.com/casama233/kaleidoscope-grilling-unofficial/blob/main/docs/audit/PR-TRIAGE.md)保留已吸收、診斷歸檔與 #181／182 承接；World Liquor 的 [6 個逐項索引](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/blob/main/docs/audit/PR-DISPOSITIONS.md)保留現行 HUD／短路徑／工具與配對依據。每個關閉操作在原 PR body 留下固定 head 和替代入口，不刪來源分支。

| PR / reviewed head | Disposition | Current replacement or retained scope |
| --- | --- | --- |
| [#284](https://github.com/casama233/kaleidoscope-tavern-unofficial/pull/284) `596a2019c8bf` | 已合併 T128 | Release/archive identity and startup validation are repaired with carried shaker preservation; 13 required Actions succeeded on the new reviewed head; merged as `a71cca94e1d366ba4a87535e75d1cf96bfdabf52`. |
| [#247](https://github.com/casama233/kaleidoscope-tavern-unofficial/pull/247) `cf7f9e6e2d9e` | 已關閉，已由目前來源承接 | Framing was ported by #280/T127. Keep its bounded historical client observations; do not restore its old identity. |
| [#217](https://github.com/casama233/kaleidoscope-tavern-unofficial/pull/217) `e1174246caae` | 已關閉；一項可選需求保留 | Current prospective-preserved-input and installation transactions carry the complete-family upgrade goal. A generic original-author-archive profile is a separate optional future requirement. |
| [#200](https://github.com/casama233/kaleidoscope-tavern-unofficial/pull/200) `f5f5a971becf` | 已關閉，已由目前來源承接 | The three shared routers and hud_screen.json match main; current family order/migration is retained. |
| [#195](https://github.com/casama233/kaleidoscope-tavern-unofficial/pull/195) `9e04ffda56b8` | 已關閉，承接 [#286](https://github.com/casama233/kaleidoscope-tavern-unofficial/issues/286) | Router/HUD portion is retained. Preserve camera/diagnostic evidence with #169; do not merge an old shader/gameplay union. |
| [#189](https://github.com/casama233/kaleidoscope-tavern-unofficial/pull/189) `0d8443aec314` | 已關閉，承接 [#287](https://github.com/casama233/kaleidoscope-tavern-unofficial/issues/287) | Keep the seven-sample native RGB shader fixture as bounded evidence for shaded arbitrary colours. This does not request a production palette rollback. |
| [#172](https://github.com/casama233/kaleidoscope-tavern-unofficial/pull/172) `cea80addf7b1` | 已關閉，承接 [#285](https://github.com/casama233/kaleidoscope-tavern-unofficial/issues/285) | Player/owner finite title reservations, suspension and snapshot restore require integration with the current standalone/UI Queue/embedded transports. |
| [#170](https://github.com/casama233/kaleidoscope-tavern-unofficial/pull/170) `c643225fb99f` | 已關閉，承接 [#285](https://github.com/casama233/kaleidoscope-tavern-unofficial/issues/285) | Dimension-change +20/+40 bounded replays and cancellation of stale scheduled work remain to be ported against current transport semantics. |
| [#169](https://github.com/casama233/kaleidoscope-tavern-unofficial/pull/169) `d7b2376d8d04` | 已關閉，承接 [#286](https://github.com/casama233/kaleidoscope-tavern-unofficial/issues/286) | Retain bounded native visual feedback and first-anchor handling. Current yaw adapter changes aim; signed Java camera-only roll is still unimplemented/unverified. |
| [#167](https://github.com/casama233/kaleidoscope-tavern-unofficial/pull/167) `c04d4e0035e3` | 已關閉，修補已移入；投影承接 [#288](https://github.com/casama233/kaleidoscope-tavern-unofficial/issues/288) | T127 already preserves arm-Y. T128 ports clone/abort/owned-lore/serving without old registry state. Unknown native projection/FOV/skin acceptance remains in the current shaker matrix. |
| [#149](https://github.com/casama233/kaleidoscope-tavern-unofficial/pull/149) `d21c36bdd4e1` | 已關閉，已由目前來源承接 | Current native socket and T127 framing supersede this first-person candidate; retain historical source evidence only. |
| [#142](https://github.com/casama233/kaleidoscope-tavern-unofficial/pull/142) `0713fd871b97` | 已關閉，承接 [#288](https://github.com/casama233/kaleidoscope-tavern-unofficial/issues/288) | Retain the historical T87/W51/G40 editor/schema observations as evidence. Current bridge export, warnings and client GUI need current-source acceptance. |
| [#119](https://github.com/casama233/kaleidoscope-tavern-unofficial/pull/119) `0bfd0b8bdc45` | 已關閉，承接 [#285](https://github.com/casama233/kaleidoscope-tavern-unofficial/issues/285) | Preserve coexistence with foreign Actionbar writers under current icon transport and opt-in text; do not revive the old polling/retained text design. |

## 起點的配套下載與 LIVE 邊界

T128 與 W105 的 `.github/release-request.json` 分別請求公開 **test prerelease**，且固定完整 archive digest；T 使用已成功 package CI 的同一 runtime digest，W 使用現行 frozen runtime 的確定性建置。G117 由既有合併後 canonical workflow 提供 Integrated Test。發布結果以各庫 Releases 與 upload/readback workflow 為準；所有新測試包保持 client pending、production_ready=false，沒有新 LIVE 宣告。

[family_update](../../family/UPDATE-WORKFLOW.md) 是唯一完整家族更新入口。實際 BSM／world／引擎與 quality checkpoint 在本工作區不可用，因此完整家族新世界 BDS、fresh stopped-world 演練、備份、准入、部署與讀回仍待在真實連線完成。使用者既有 LIVE 持續授權保留，無需再次要求同一部署許可；沒有憑空補入 native／client／LIVE 成功。作者分支的最新上游檢查亦須由實際 BSM current checkpoint 接续，不能以舊網頁快取推定已全部刷新。

當前來源驗證和玩家場景：[T129 release notes](../RELEASE-NOTES-0.6.129.md)、[parity matrix](../PARITY-MATRIX.md)、[BUGS](../BUGS.md)。私人整合維持其獨立 canonical 來源，不將私人包內容或世界資料放入公開庫。
