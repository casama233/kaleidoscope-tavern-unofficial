# 公開下載与LIVE：T150／G130／W127

**[private deployment time]**，managed-server完整T150／G130／W127／private-integration／Ribbits1.0.10036家族通過canonical PR／CI、static、一次停服存檔first／restart、准入及逐檔／順序讀回，42包、BDS1.26.52.3 RUNNING。

三個公开mcaddon已匿名實際下載，在 **2026-10-13 02:09:03 香港時間** 核對；六自有BP／RP **9344檔** 的集合与內容全部等於LIVE／reviewed receipt，没有組裝／翻譯／安裝時另加自有玩法補丁。G130沿用原已發布版本，不製造G131；私有料理／Ribbits及其他host變體另有來源，不包含在這六份公開下載範圍。

| 包 | 公開下載 | 部署／發布來源 |
|---|---|---|
| 酒館 0.6.150 | [v0.6.150-beta.1](https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/tag/v0.6.150-beta.1)／[mcaddon](https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/download/v0.6.150-beta.1/Kaleidoscope_Tavern_Unofficial_0.6.150_baseline1.mcaddon) | `3f59f984e55fca1ad7ff0a1ee4b7281ecd654daa` |
| 燒烤 A2.8.130 | [A2.8.130-beta.1](https://github.com/casama233/kaleidoscope-grilling-unofficial/releases/tag/A2.8.130-beta.1)／[mcaddon](https://github.com/casama233/kaleidoscope-grilling-unofficial/releases/download/A2.8.130-beta.1/Kaleidoscope_Grilling_A2.8.130_Review.mcaddon) | `a567e17c0316f7f2175dfef07004bb944634ca90` |
| 世界名酒 0.1.127 | [v0.1.127-preview.1](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/releases/tag/v0.1.127-preview.1)／[mcaddon](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/releases/download/v0.1.127-preview.1/Kaleidoscope_World_Liquor_Unofficial_0.1.127_preview1.mcaddon) | `eaf1fa03a182f32b98fc04727c399f19b982423c` |

本次紀錄 `private-operation-record`；reviewed SHA **`c0d1f1d1c47da8fb53b7c2e6d8ab9c85ad85f73dd0d1e5c5bed0a26b491c92fa`**，政策installed／deferred_client_acceptance綁同SHA。Original SHA `285838cbfc8ff22b55b72d312ad3f8bec3bab7721a09a27543804ce9759fa6bb` 分開保留；以下公開JSON SHA256 **`1943561ec1c563496660d7fb6b45bb15a6a5af7eae93567b6ef835f86ff4baf8`**。

當次poststart257 warnings／0 errors，其中230 watchdog（9 Spike／220 Slowdown／1 High Memory）。T249／288、Ribbits431、W265、G447、Cookery310ms Spike仍在；本輪native保留LIVE明確100／10ms門檻，舊native未設定而關閉告警与不同採樣窗口不能混比性能。Source page／wire／connection回歸及呼叫次數減少不算引擎／client效能接受。

`client=false`、`production_ready=false`、`pending_client_acceptance`。快速重開短空條、完整聲畫／操作、任意whole HUD／title、Java一比一及作者新版適配仍待完成。[现況／差距](BASELINE-STATUS.md)及[真人流程](../docs/HUD-COMPAT-CLIENT-HANDOFF-20261012.md)另列；后續未凍結原型不屬此候選。旧[149proof](PUBLIC-DOWNLOAD-LIVE-HUD-20261013.md)、[148proof](PUBLIC-DOWNLOAD-LIVE-UI-20261012.md)及其他歷史證據不改寫。

以下唯一JSON原文只有三公開來源／六自有包與公開基線核對metadata；没有私有來源commit／script／path／日誌、玩家／世界鍵或其hash。Review receipt是整體候選的聚合基線digest，archive hashes屬公開下載，不是私人玩家資料。完整family/native/world報告保留本機。

```json
{
  "schema": 1,
  "recorded_at": "2026-10-12T18:09:03.745236+00:00",
  "run": "20261013-startup-t150-g130-w127-p34-ribbits10036",
  "reviewed_receipt_sha256": "c0d1f1d1c47da8fb53b7c2e6d8ab9c85ad85f73dd0d1e5c5bed0a26b491c92fa",
  "status": "all_three_public_archives_match_six_installed_owned_packs",
  "releases": [
    {
      "repository": "casama233/kaleidoscope-tavern-unofficial",
      "version": [
        0,
        6,
        150
      ],
      "tag": "v0.6.150-beta.1",
      "archive": "Kaleidoscope_Tavern_Unofficial_0.6.150_baseline1.mcaddon",
      "download_url": "https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/download/v0.6.150-beta.1/Kaleidoscope_Tavern_Unofficial_0.6.150_baseline1.mcaddon",
      "release": "https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/tag/v0.6.150-beta.1",
      "publication_commit": "3f59f984e55fca1ad7ff0a1ee4b7281ecd654daa",
      "archive_sha256": "da16d9ad28ff33eac6cfae8f50e25a4103cd5a6190cc3f36f235d36021a71d04",
      "bytes": 5901742,
      "anonymous_public_download": true,
      "packs": [
        {
          "uuid": "f54f37f9-485a-55bf-8f89-6558aca988c5",
          "side": "behavior",
          "version": [
            0,
            6,
            150
          ],
          "files": 832,
          "archive_matches_receipt": true,
          "archive_matches_live": true
        },
        {
          "uuid": "c2990d50-2cf7-59f7-886a-0f2d0240d156",
          "side": "resource",
          "version": [
            0,
            6,
            150
          ],
          "files": 3225,
          "archive_matches_receipt": true,
          "archive_matches_live": true
        }
      ],
      "full_file_match": true
    },
    {
      "repository": "casama233/kaleidoscope-grilling-unofficial",
      "version": "A2.8.130",
      "tag": "A2.8.130-beta.1",
      "archive": "Kaleidoscope_Grilling_A2.8.130_Review.mcaddon",
      "download_url": "https://github.com/casama233/kaleidoscope-grilling-unofficial/releases/download/A2.8.130-beta.1/Kaleidoscope_Grilling_A2.8.130_Review.mcaddon",
      "release": "https://github.com/casama233/kaleidoscope-grilling-unofficial/releases/tag/A2.8.130-beta.1",
      "publication_commit": "a567e17c0316f7f2175dfef07004bb944634ca90",
      "archive_sha256": "acdeef990da652898cd9c3d50932820243a68efa2283fd8cb7946504d7247855",
      "bytes": 14615269,
      "anonymous_public_download": true,
      "packs": [
        {
          "uuid": "c68005c5-23ff-54e8-a3ff-da6349ad43c2",
          "side": "behavior",
          "version": [
            2,
            8,
            130
          ],
          "files": 774,
          "archive_matches_receipt": true,
          "archive_matches_live": true
        },
        {
          "uuid": "bbbd2d60-52e5-53a6-8b9a-c09b0f516389",
          "side": "resource",
          "version": [
            2,
            8,
            130
          ],
          "files": 3624,
          "archive_matches_receipt": true,
          "archive_matches_live": true
        }
      ],
      "full_file_match": true
    },
    {
      "repository": "casama233/kaleidoscope-world-liquor-unofficial",
      "version": [
        0,
        1,
        127
      ],
      "tag": "v0.1.127-preview.1",
      "archive": "Kaleidoscope_World_Liquor_Unofficial_0.1.127_preview1.mcaddon",
      "download_url": "https://github.com/casama233/kaleidoscope-world-liquor-unofficial/releases/download/v0.1.127-preview.1/Kaleidoscope_World_Liquor_Unofficial_0.1.127_preview1.mcaddon",
      "release": "https://github.com/casama233/kaleidoscope-world-liquor-unofficial/releases/tag/v0.1.127-preview.1",
      "publication_commit": "eaf1fa03a182f32b98fc04727c399f19b982423c",
      "archive_sha256": "30f48fd172526114453ab0439f0be6c1cd31561e84ef9a8147b95778568eb7c2",
      "bytes": 7169842,
      "anonymous_public_download": true,
      "packs": [
        {
          "uuid": "355ffdfc-50e6-5a33-a126-4d78ab955b2b",
          "side": "behavior",
          "version": [
            0,
            1,
            127
          ],
          "files": 340,
          "archive_matches_receipt": true,
          "archive_matches_live": true
        },
        {
          "uuid": "a610b357-ba70-5a2f-bca5-5a7a8a0fb2a8",
          "side": "resource",
          "version": [
            0,
            1,
            127
          ],
          "files": 549,
          "archive_matches_receipt": true,
          "archive_matches_live": true
        }
      ],
      "full_file_match": true
    }
  ],
  "matched_packs": 6,
  "matched_files": 9344,
  "all_files_match": true,
  "client": false,
  "production_ready": false,
  "scope": "Three public ports only; private cuisine and reviewed third-party host extensions are separate."
}
```
