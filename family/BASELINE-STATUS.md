# 家族現行來源基線

查核日期：2026-10-09。這份入口說明已合併的開發來源與作者參考，
不代替 BSM 當前政策、逐候選部署收據或真人驗收。
完整更新走 [UPDATE-WORKFLOW.md](UPDATE-WORKFLOW.md)。

## 本輪指南候選：T136／W113／G121

| 候選 | 凍結來源 | 本輪範圍 |
| --- | --- | --- |
| 酒館 0.6.136 | `496ce702161fb48ab6f67ea6645ad1e4d41b2a12` | 以已部署 T132 玩法為基礎，全面整理三語指南與兩入口共用呈現；見 [指南文案規則](../docs/GUIDE-EDITORIAL.md) 及 [T136 說明](../docs/RELEASE-NOTES-0.6.136.md) |
| 世界名酒 0.1.113 | `92168bec36d396b3eca2d71558863a4955ddc2e8` | 重寫 67 個三語條目，保留 W110 玩法、配方、效果與資源；W112 的版本／配對來源不引入未合併的 T135 功能；見 [W113 說明](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/blob/92168bec36d396b3eca2d71558863a4955ddc2e8/docs/RELEASE-NOTES-0.1.113.md) |
| 煙火／燒烤 2.8.121 | `2b422458ebfdd3831bc7a57af30c24cfa211d23a` | 保留已合併 G120 `8dc3e9d440577cd70501c377722f8e27b0913d44`，加入可選 Cookery 酒館章節交接；完整作者腳本不進公開來源 |

目前 LIVE 仍為 **T132／G119／W110**，新候選尚待本次 PR／CI、完整家族
static、BDS、存檔演練與准入部署流程。指南文字／投影檢查不代表真人閱讀、
排版或輸入驗收；維持 `client=false`、`production_ready=false`、
`pending_client_acceptance`。

另行保留的 [T135 PR302](https://github.com/casama233/kaleidoscope-tavern-unofficial/pull/302)
尚未合併，原生重啟時的 `effectAdd` 重播會撤銷保存的外觀 lease；該失敗
未豁免，T135 runtime 不納入本候選。既有
[T133 draft PR298](https://github.com/casama233/kaleidoscope-tavern-unofficial/pull/298)
及其來源／提交繼續保留。

## 已交付來源與 LIVE 起點

| 自有來源 | 目前版本 | 已交付來源 | 目前主要差距 |
| --- | --- | --- | --- |
| 酒館 | 0.6.132 | [PR297](https://github.com/casama233/kaleidoscope-tavern-unofficial/pull/297)；承接 T131，補濺射、雪克杯交易／保存及指南動畫 | 任意三份 ItemStack、穿牆輪廓、相機 roll、部分原生效果與實際聲畫／輸入 |
| 煙火／燒烤 | 2.8.119 | [PR184](https://github.com/casama233/kaleidoscope-grilling-unofficial/pull/184)；餐盤內容、植物及重金屬結算 | 任意秘製串背包圖示、正常 Cookery producer、調料 registry、實際操作／聲畫 |
| 世界名酒 | 0.1.110 | [PR90](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/pull/90)；最新 Forge／NeoForge 獺祭 Luck 資料與四款雞尾酒模型／貼圖更新；精確配對 T132、保留 87 個無碰撞家族 helper | 各分支事件時序、斬首／SkullOwner、Elbow production、CaptainGift、跨模組整合與真人驗收 |
| 私有料理整合 | 1.0.30 | 保持已核驗 private canonical；不在公開倉庫保存作者私有完整腳本 | 原生與真人證據按功能 scope，不能用公開包 CI 代替 |

版本號不同不能直接比較還原度。各包完整差距以自己的
`docs/PARITY-MATRIX.md`、`docs/BUGS.md` 和當前 release notes 為準。
未完成調料原型及其他唯一差異保留，不能混入已凍結來源。
T133 原生儲存 XYZ 修補仍為 [draft PR298](https://github.com/casama233/kaleidoscope-tavern-unofficial/pull/298)，
尚未合併或納入本次家族候選。舊失敗和更新後來源的 CI 各自保留，
現態以 PR 的 exact head 證據為準；不把草稿宣稱已交付。
衝突的兩份 W109 提交／claim 已分別保留，新作者適配使用獨立 W110 身份。

## 作者版本與分支

| 作者項目 | 最新已發布參考 | 本次判定 |
| --- | --- | --- |
| Tavern Forge 1.20.1 | 1.2.0／CF8350841 | 已釘選；原作 main `c4ec1880` 與 T131 核對來源相同，完整一比一仍待完成 |
| Tavern NeoForge 1.21.1 | 1.2.0／CF8350856 | 已釘選；原作 `a1afba34` 與 T131 核對來源相同，保持分支差異 |
| Tavern NeoForge 26.1.2 | 尚未找到正式發行 | 來源 `9b8f165a` 宣告 1.1.2；T131 局部核對，不冒充已發布或整分支已移植 |
| Grilling Forge 1.20.1／NeoForge 1.21.1 | 1.1.1／CF8726006、CF8726014 | 沒有新發行，保留 G119，不為相同內容另升版本 |
| World Liquor Forge 1.20.1 | 1.1.12／CF9066402 | 配方、25 個飲品效果資料檔及共用聲畫已比對；W110 承接四款雞尾酒模型／貼圖與兩個背包圖示更新，並修正獺祭 Q3–Q6 amplifier；原生 Luck 掉落仍未完成；事件階段、酒櫃自動化及 Create／Jade／SMC 等仍待適配 |
| World Liquor NeoForge 1.21.1 | 1.1.11／CF9066406 | 現行主要玩法參考；已承接五個冰櫃配方及相關保存修補，完整玩法尚未閉合 |
| World Liquor NeoForge 26.1.2 | 1.1.6／CF9087098 | 已有分支差異審查；Luck／BlockDrops 等不同，不直接替換 1.21.1 玩法，仍待適配 |

`java-upstream.json` 的 reference IDs 表示明列 scope 的已查核來源，
不表示整份 JAR 已移植。`reference_metadata_current_parity_pending`
也不是完整最新版玩法驗收。未發布來源分支另列，不能填入要求存在
CurseForge 發行的監控分支而製造 `check_failed`。

五個 Bedrock 作者包目前均為最新鎖定版本：Cookery **1.6.0**、
Chinese Food **1.0.4**、Immersive Eating **1.0.0**、Nether **1.0.1**、
End **1.0.1**。Cookery 作者 UUID 遷移已完成的證據保留原收據；
國味 **1.0.10430** 是已登記相容變體，不是作者新版。
其他 preserved packs 保持現行完整收據的來源與內容，不能從較大的
私服版號推論作者最新，也不能單包覆蓋。

## 開發與部署判定

開發 main、候選和 LIVE 分別記錄。各版本完成來源 PR／CI 後，
安裝仍需本次完整家族 static、新世界 BDS 首次／重啟、停服一致備份、
本次存檔首次／重啟、family_guard 准入及部署後讀回。
沿用已授權的 LIVE 開發更新；未經真人實測仍保持 `client=false`、
`production_ready=false`、`pending_client_acceptance`。

作者已發布版本每六小時唯讀查核；家族漂移每五分鐘查核。
未發布 Tavern 26.1.2 目前僅有本輪來源查核，尚未納入定期 Git HEAD
監控，這項監控差距保持開放。
報告失敗須查來源與原因，不用重寫 hash 清掉告警。
只有工具／文件／參考 scope 更新時，不升包、不重啟 LIVE；
已完成 runtime 候選仍按完整流程部署。
