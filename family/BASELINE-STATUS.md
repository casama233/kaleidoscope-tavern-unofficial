## 當前配套：T140／W117／G122

以已合併 T139／W116 為基礎補齊載入光效與玩家 initialSpawn 順序，並恢復 native report 的精確當時輸入綁定；全部既有修補與指南保留。Grilling 固定 G122 `8002da0086544cd18c9854e7fe79e8ccb2f9f982`，Cookery helper 0.2.9 整組尚待完整家族驗證。精確配套及本輪 CI／原生結果入口見 [本版說明](../docs/RELEASE-NOTES-0.6.140.md)；舊原生證據及下方歷史來源保持原範圍，不代表目前 LIVE 狀態。

## 先前固定 T138／W115／G120

整合 native countdown 與已驗證的 reload acknowledgement；來源以新 release notes 與 data/parallel-source-review-20261009.json 為準。舊候選歷史及 scoped native 結果保留；G120 不回退。新候選完整 CI、native 與 client／私人 LIVE 各自驗證。

# 保留的家族來源基線記錄

歷史查核日期：2026-10-09。以下保留 [T137／W114](../docs/RELEASE-NOTES-0.6.137.md)
及更早候選當時的來源與驗收範圍，不是當前配套或 LIVE 狀態。
當前版本／內容以頁首、各 canonical baseline 及 family lock 為準；PR、CI、
原生與 LIVE 各自依實際結果，不由版號或資源存在推定完成。

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
| 自有來源 | 當前候選 | 這批內容 | 尚待完成 |
| --- | --- | --- | --- |
| 酒館 | 0.6.137 | 保留 T135 全部原料／視覺／沉浸修正；追加 Upside Down 完整 Mob 名單、魚類分類、原生保存與重啟光效修復 | 名稱可見性、真人倒轉、roll／outline／多行編輯器等既有差距 |
| 世界名酒 | 0.1.114 | 保留 W110 作者更新與 W112 全部內容；確認新原生錨 metadata 及 repeat／取消／lifecycle | 原生 Player、舊／未知錨、部分效果與聲畫 |
| 煙火／燒烤 | 2.8.120 | 已合併 PR185 `8dc3e9d4`；helper／guide transport 與 T/W 相容；料理保存、植物與重金屬修復 | 完整 Cookery 0.2.7 descriptor／作者 patch／copied helper 須成組驗證 |
| 私有料理整合 | 沿用既有鎖 | 本輪沒有私人連線及重新驗證；不在公開倉庫保存完整私人作者腳本 | 完整家族、當前保存演練及 LIVE |

T134/W111、T135/W112 和 PR298 草稿的歷史提交、freeze、witness 與實際
CI 成敗保留；新候選不改寫舊內容身份。兩個上輪來源在本輪接續時仍為
開放 PR，承接來源不等於其已合併。新候選使用自己的精確 CI 與發布紀錄。
G120 僅更新已審查 owned／source pin，沒有修改 G runtime 或解除部署門檻。
完整更新遵守 [UPDATE-WORKFLOW.md](UPDATE-WORKFLOW.md)。

## 作者版本與分支

| 作者項目 | 最新已發布參考 | 本次判定 |
| --- | --- | --- |
| Tavern Forge 1.20.1 | 1.2.0／CF8350841 | 已釘選；原作 main `c4ec1880` 與 T131 核對來源相同，完整一比一仍待完成 |
| Tavern NeoForge 1.21.1 | 1.2.0／CF8350856 | 已釘選；原作 `a1afba34` 與 T131 核對來源相同，保持分支差異 |
| Tavern NeoForge 26.1.2 | 尚未找到正式發行 | 來源 `9b8f165a` 宣告 1.1.2；T131 局部核對，不冒充已發布或整分支已移植 |
| Grilling Forge 1.20.1／NeoForge 1.21.1 | 1.1.1／CF8726006、CF8726014 | 作者參考不變；採用已合併 G120 自有修復，保留其原發行身份 |
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
