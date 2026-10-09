# 家族現行來源基線

查核日期：2026-10-09。當前修復入口為 [T137／W114](../docs/RELEASE-NOTES-0.6.137.md)，
版本／內容以各 canonical baseline 及 family lock 為準；PR、CI、原生與 LIVE
各自依實際結果，不由版號或資源存在推定完成。

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
