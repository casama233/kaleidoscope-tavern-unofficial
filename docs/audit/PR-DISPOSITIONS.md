# 森羅家族：當前修補與 PR 處置

更新：2026-10-08。本頁是本輪家族修補與舊 PR 承接的當前入口，版本及內容身分仍由各庫 baseline 和 [family lock](../../family/upstream.lock.json) 決定。歷史 PR 的來源保留為固定證據，不作新包輸入；真正 GitHub 狀態以各 PR 的合併／收束紀錄為準。

## T129／W106 雞尾酒修復

本輪從下列已交付 T128／W105 基線接續；新的 Tavern0.6.129 與 World
Liquor0.1.106 合併調酒操作、完整外層雪克杯保存、提示／HUD／音量及效果
適配。原料內部三格容器因原生失敗排除，避免把腳本 fixture 成功當成引擎
成功。[版本說明](../RELEASE-NOTES-0.6.129.md) 是本批來源、分段修復和驗收
場景的單一入口；[第三方包審查](../THIRD-PARTY-TAVERN-REVIEW.md) 記錄
Loyallay 公開版可吸收設計及未解決的原生限制。

兩庫 CI 固定本批真正配對提交：World Liquor 的 [PR86](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/pull/86)
使用 Tavern 修復提交 `60ba1794168a42405330d777de94011eae371f63`；Tavern 的四個 peer checkout
統一使用 World Liquor `6408e2de67e7bca6dc46fa704a86038617b64e82`。本批發布目標為
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
