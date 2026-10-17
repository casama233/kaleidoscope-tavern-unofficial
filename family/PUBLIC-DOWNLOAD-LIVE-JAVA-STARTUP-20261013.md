# T153／G132／W130 公開下載與 LIVE

**[private deployment time]**：managed-server **T153／G132／W130／private-integration／Ribbits1.0.10036**，42包（22BP／20RP），BDS1.26.52.3 RUNNING。Canonical PR／必要CI、static、一次停服存檔副本first／restart、完整准入及逐檔／順序讀回通過。`client=false`、`production_ready=false`、`pending_client_acceptance`。

**2026-10-13 11:52:05 HKT** 完成三個新匿名下載archive的核對；六自有BP／RP共 **9346檔** 的完整路徑集合、逐檔內容、UUID及版本，全部等於LIVE與reviewed receipt。沒有重用舊archive或在部署時另加自有玩法修補。

| 移植 | 公開版本／下載 | 發布commit | 來源與執行證據 |
| --- | --- | --- | --- |
| tavern | [v0.6.153-beta.1](https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/tag/v0.6.153-beta.1)／[mcaddon](https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/download/v0.6.153-beta.1/Kaleidoscope_Tavern_Unofficial_0.6.153_baseline1.mcaddon) | `2a4015daad0c25f16e4e3c6518efde2a0ef55f62` | [PR346](https://github.com/casama233/kaleidoscope-tavern-unofficial/pull/346)／[CI](https://github.com/casama233/kaleidoscope-tavern-unofficial/actions/runs/38341772873)／[發布](https://github.com/casama233/kaleidoscope-tavern-unofficial/actions/runs/38343300153) |
| grilling | [A2.8.132-beta.1](https://github.com/casama233/kaleidoscope-grilling-unofficial/releases/tag/A2.8.132-beta.1)／[mcaddon](https://github.com/casama233/kaleidoscope-grilling-unofficial/releases/download/A2.8.132-beta.1/Kaleidoscope_Grilling_A2.8.132_Review.mcaddon) | `da1cfc0ef5ef4f3b3972580cc863a715813fe348` | [PR199](https://github.com/casama233/kaleidoscope-grilling-unofficial/pull/199)／[CI](https://github.com/casama233/kaleidoscope-grilling-unofficial/actions/runs/38341296437)／[發布](https://github.com/casama233/kaleidoscope-grilling-unofficial/actions/runs/38343310299) |
| world-liquor | [v0.1.130-preview.1](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/releases/tag/v0.1.130-preview.1)／[mcaddon](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/releases/download/v0.1.130-preview.1/Kaleidoscope_World_Liquor_Unofficial_0.1.130_preview1.mcaddon) | `3c6a698dc5d1eb3072eb6e56ec2e65ef8e4d2d7e` | [PR114](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/pull/114)／[CI](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/actions/runs/38341828998)／[發布](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/actions/runs/38343304809) |

| 移植 | Side | Version | Files | UUID |
| --- | --- | --- | --- | --- |
| tavern | behavior | 0.6.153 | 833 | `f54f37f9-485a-55bf-8f89-6558aca988c5` |
| tavern | resource | 0.6.153 | 3225 | `c2990d50-2cf7-59f7-886a-0f2d0240d156` |
| grilling | behavior | 2.8.132 | 774 | `c68005c5-23ff-54e8-a3ff-da6349ad43c2` |
| grilling | resource | 2.8.132 | 3624 | `bbbd2d60-52e5-53a6-8b9a-c09b0f516389` |
| world-liquor | behavior | 0.1.130 | 341 | `355ffdfc-50e6-5a33-a126-4d78ab955b2b` |
| world-liquor | resource | 0.1.130 | 549 | `a610b357-ba70-5a2f-bca5-5a7a8a0fb2a8` |

本次紀錄 `private-operation-record`：

- 匿名下載核對 `public-download-live-verification.json`：SHA256 `3b092989dd11b5689f95fbca2efcff6c8f32e1c9344ecd8a6943608f832970a3`；原始時間 `2026-10-13T03:52:05.569001+00:00`。
- Reviewed receipt：`4af54b4cdbf7009e99bf802712f2f09b78790952c97144c0a345f867a8607244`；raw receipt：`475217a0219d9e55f275a00101c42909def8822830a004ddd9503735895f0f04`，分開保留。
- 公開archive SHA256：
  - `Kaleidoscope_Tavern_Unofficial_0.6.153_baseline1.mcaddon`：`eda4f114c7fba03702f7c06c963c23d5a06530ac478794f645719ed6725e5d9e`。
  - `Kaleidoscope_Grilling_A2.8.132_Review.mcaddon`：`e923b13903a4f1d4ce70ede946ec7194436657611fe16fab14b3720d3315e6d3`。
  - `Kaleidoscope_World_Liquor_Unofficial_0.1.130_preview1.mcaddon`：`951ccb73b382edabec957ebd573588b47b0d8666d358cee8fc0f134abad0104b`。

Poststart **197 warnings／0 errors**，其中 **170 watchdog（8 Spike／162 Slowdown／0 High Memory）**。初始化Spike仍有AMW328、Cookery313、Nether112、Ribbits425、Villager155、W124、T231、G316ms。First356／restart404 warnings，各exit0／errors0；保留LIVE100／10ms門檻。這些是當次觀測窗口，不能作全局效能百分比或宣稱watchdog已解決。

玩家記錄（數量未公開）與容器（數量未公開）保留；冰櫃樣本（數量未公開）不當非空投料驗收。私有料理與登記第三方host變體另有來源，不包含在這六個公開包範圍。此核對只證明下載與安裝內容一致；Java一比一、真人HUD／操作／聲畫仍待完成。見[現行差距](BASELINE-STATUS.md)與[真人流程](../docs/HUD-COMPAT-CLIENT-HANDOFF-20261012.md)。歷史收據和影片保持原候選身份。
