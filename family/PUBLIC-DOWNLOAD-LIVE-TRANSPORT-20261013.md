# T152／G130／W129 公開下載與 LIVE

**[private deployment time]**：managed-server **T152／G130／W129／private-integration／Ribbits1.0.10036**，42包（22BP／20RP），BDS1.26.52.3 RUNNING。Canonical PR／必要CI、static、一次停服存檔副本first／restart、完整准入及逐檔／順序讀回通過。`client=false`、`production_ready=false`、`pending_client_acceptance`。

[本次公開核對](PUBLIC-DOWNLOAD-LIVE-TRANSPORT-20261013.md)確認六包9344檔相同。T152／W129新匿名下載，G130重用R151已核驗匿名archive的同FS硬連結，fresh REST metadata／digest重驗，不稱新G下載。

公開核對記錄2026-10-13 03:47:02 HKT，proof SHA `8b265eba462ab3eb7b0ed71afc676445aff5996cf4e83096482cb41cd856142c`。每份archive的完整路徑集合、逐檔內容、UUID／版本與reviewed receipt及正式LIVE相同，沒有額外payload。

| Repository | Side | Version | Files | UUID |
| --- | --- | --- | --- | --- |
| casama233/kaleidoscope-tavern-unofficial | behavior | 0.6.152 | 832 | f54f37f9-485a-55bf-8f89-6558aca988c5 |
| casama233/kaleidoscope-tavern-unofficial | resource | 0.6.152 | 3225 | c2990d50-2cf7-59f7-886a-0f2d0240d156 |
| casama233/kaleidoscope-grilling-unofficial | behavior | 2.8.130 | 774 | c68005c5-23ff-54e8-a3ff-da6349ad43c2 |
| casama233/kaleidoscope-grilling-unofficial | resource | 2.8.130 | 3624 | bbbd2d60-52e5-53a6-8b9a-c09b0f516389 |
| casama233/kaleidoscope-world-liquor-unofficial | behavior | 0.1.129 | 340 | 355ffdfc-50e6-5a33-a126-4d78ab955b2b |
| casama233/kaleidoscope-world-liquor-unofficial | resource | 0.1.129 | 549 | a610b357-ba70-5a2f-bca5-5a7a8a0fb2a8 |

T[PR344](https://github.com/casama233/kaleidoscope-tavern-unofficial/pull/344)13項必要CI／pre-commit通過（38298429025），發布来源 `f929cd4fcc7a588d6ff8fb23e7ec5af0409dc79d`；W[PR113](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/pull/113)4項必要CI／pre-commit通過（38298439399），來源 `7edcb3589b849ac54533cd78b8c17d9e1d6a4b1b`。T發布38299743225／W38299753605成功；G130沿用[PR198](https://github.com/casama233/kaleidoscope-grilling-unofficial/pull/198)／來源 `a567e17c0316f7f2175dfef07004bb944634ca90`。private-integration／Ribbits10036內容及原source CI範圍保持，付費pre-commit unavailable不偽寫成功。

紀錄 `private-operation-record`；reviewed SHA `34a50a536dff22ca4e202b35f93fd68457b26464833c086057a57efcf1cb2415`，raw SHA `17b31fc666a57ae3bf3efafd509726554dfb2870bc4792acc24c5e97bc2883f3`。政策installed／deferred_client_acceptance綁同reviewedSHA。玩家記錄（數量未公開）及容器（數量未公開）保留，冰櫃樣本（數量未公開）不當非空投料證據；未另建新世界或使用模擬玩家。只保留最新完整回退，清理6個舊生成根，磁碟可用空間增加1,608,294,400 bytes。來源、失敗JSON／日誌及活動工作保留。

Poststart **245 warnings／0 errors**，其中 **218 watchdog（8 Spike／209 Slowdown／1 High Memory）**。本次窗口沒有再錄到原指南COMMIT約282ms Spike；初始化Spike仍有AMW309、Cookery306、Nether110、Ribbits424、Villager150、W256、T255、G444ms。不同窗口不作百分比或全面效能接受；partial reverse仍有整串FNV fallback。First401／restart361 warnings，各exit0／errors0，保留LIVE100／10ms門檻。

client／production_ready均false；此proof只涵蓋三個公開自有移植，不公開私有料理或第三方完整來源，不當Java一比一／真人效能接受。歷史151與其他proof不改寫。
