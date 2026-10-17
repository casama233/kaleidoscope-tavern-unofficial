# T154／G132／W131 公開下載與 LIVE

**[private deployment time]**：managed-server **T154／G132／W131／private-integration／Ribbits1.0.10036**，42包，BDS1.26.52.3 RUNNING。Canonical PR／必要CI、static、一次停服存檔副本first／restart、完整准入及逐檔／順序讀回通過。`client=false`、`production_ready=false`、`pending_client_acceptance`。

2026-10-13 15:03:22 HKT核對：六個自有BP／RP共 **9346檔**，公開archive／LIVE／reviewed receipt逐檔完全相同。T154／W131本次匿名下載；G132沿用前次已匿名核對的不可變archive並以同檔案系統hardlink重用，沒有重新下載。三個release metadata／digest均已重新核對。

| 公開版本 | 發布來源 | 成功發布workflow |
| --- | --- | --- |
| [T154](https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/tag/v0.6.154-beta.1) | `a39373ad64b11f1b9cde5734e3254b647fb016cd` | [38359967114](https://github.com/casama233/kaleidoscope-tavern-unofficial/actions/runs/38359967114) |
| [G132](https://github.com/casama233/kaleidoscope-grilling-unofficial/releases/tag/A2.8.132-beta.1) | `da1cfc0ef5ef4f3b3972580cc863a715813fe348` | [38343310299](https://github.com/casama233/kaleidoscope-grilling-unofficial/actions/runs/38343310299) |
| [W131](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/releases/tag/v0.1.131-preview.1) | `1c11561da290f9babbaecb7e26d89cc21d75215b` | [38358864702](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/actions/runs/38358864702) |

| 版本 | BP檔案 | RP檔案 | 來源 |
| --- | --- | --- | --- |
| T154 | 833 | 3225 | 本次匿名下載 |
| G132 | 774 | 3624 | 沿用原匿名下載，同inode連結 |
| W131 | 341 | 549 | 本次匿名下載 |

部署來源Tavern `fbfe4be4aa8beaf0e735ddd27189bc1e4cd37a9b`、World Liquor `1c11561da290f9babbaecb7e26d89cc21d75215b`；T348的[實際CI](https://github.com/casama233/kaleidoscope-tavern-unofficial/actions/runs/38357105609)與W115的[實際CI](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/actions/runs/38357104491)保持原提交身份。[PR349](https://github.com/casama233/kaleidoscope-tavern-unofficial/pull/349)只修正`.github/release-request.json`，發布來源為`a39373ad64b11f1b9cde5734e3254b647fb016cd`；相對部署來源只差這一份JSON，runtime／archive保持，沒有重啟LIVE或改寫部署收據。

本次紀錄 `private-operation-record`：

- 公開核對SHA256：`19e450dae8264e0dbb69535522c47f78d9172d78378e2ed7e26034f764499097`；原始時間 `2026-10-13T07:03:22.334766+00:00`。
- Reviewed receipt：`9df9645c0ca8d87ea4f9685196b6af11652adaace6242ee150713f4c085fbdbe`；raw receipt：`71f1746a31a738199a7313eefb644eb272320d633c8f232bab9cd737e97468c5`，分開保留。
- T154 archive SHA256 `7de139af65edb3e60b37c046b082453ab2b00f4296ac26dcd00048ec712d7269`；
- G132 archive SHA256 `e923b13903a4f1d4ce70ede946ec7194436657611fe16fab14b3720d3315e6d3`；
- W131 archive SHA256 `aee9420d1e2fced7b0e986eca817f0c4a35cedd3e1a9dcfc69c2f819a9585511`

本次poststart **208 warnings／0 errors**；watchdog **181（8 Spike／173 Slowdown／0 High Memory）**。這是本候選的觀測窗口，不作整體效能百分比或完整watchdog驗收。原profile只捕捉啟動後傳輸工作，未捕捉首次初始化尖峰。 本次LIVE Spike為AMW310、Cookery313、Nether111、Ribbits417、Villager146、W119、T215、G302ms。停服存檔first368 warnings／336 watchdog，restart381 warnings／349 watchdog；兩次均0 errors，保留LIVE的100／10ms門檻。

玩家記錄（數量未公開）及容器（數量未公開）保留，冰櫃樣本（數量未公開）；此投料樣本不當非空投料驗收。私有料理與登記第三方host變體另有來源，不包含在這六個公開包範圍。此核對只證明下載與安裝內容一致；Java一比一、真人HUD／操作／聲畫仍待完成。見[現行差距](BASELINE-STATUS.md)與[真人流程](../docs/HUD-COMPAT-CLIENT-HANDOFF-20261012.md)。歷史收據和影片保持原候選身份。
