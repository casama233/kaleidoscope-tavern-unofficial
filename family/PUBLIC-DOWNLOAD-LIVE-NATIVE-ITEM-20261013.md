# 公開下載与LIVE：T151／G130／W128

**[private deployment time]**，完整42包T151／G130／W128／private-integration／Ribbits1.0.10036部署与讀回通過，BDS1.26.52.3 RUNNING。Canonical PR／CI、static、一次fresh停服存檔first／restart、准入及逐檔／順序核對通過；没有模擬玩家或另建新世界。

**2026-10-13 03:01:20 香港時間** 的嚴格核對確認六自有BP／RP共 **9344檔** 與公開archive、LIVE及reviewed receipt完全相同，沒有local自有玩法覆寫。T151／W128新匿名下載；G130同FS硬連結重用[原T150核對](PUBLIC-DOWNLOAD-LIVE-STARTUP-20261013.md)已验证匿名archive，仍fresh讀取release REST asset name／digest／size／URL／source，不說G重新下載或發G131。

| 包 | 公開下載 | 部署／發布來源 |
|---|---|---|
| 酒館 0.6.151 | [v0.6.151-beta.1](https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/tag/v0.6.151-beta.1)／[mcaddon](https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/download/v0.6.151-beta.1/Kaleidoscope_Tavern_Unofficial_0.6.151_baseline1.mcaddon) | `5c1aa26d9297362d9a7e47671db1258060181d4d` |
| 燒烤 A2.8.130 | [A2.8.130-beta.1](https://github.com/casama233/kaleidoscope-grilling-unofficial/releases/tag/A2.8.130-beta.1)／[mcaddon](https://github.com/casama233/kaleidoscope-grilling-unofficial/releases/download/A2.8.130-beta.1/Kaleidoscope_Grilling_A2.8.130_Review.mcaddon) | `a567e17c0316f7f2175dfef07004bb944634ca90` |
| 世界名酒 0.1.128 | [v0.1.128-preview.1](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/releases/tag/v0.1.128-preview.1)／[mcaddon](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/releases/download/v0.1.128-preview.1/Kaleidoscope_World_Liquor_Unofficial_0.1.128_preview1.mcaddon) | `8d0983dd1c2f16634b393fbed3bd9121d0df78e7` |

G130重用來源為 `private-operation-record`，原公開proof SHA `1943561ec1c563496660d7fb6b45bb15a6a5af7eae93567b6ef835f86ff4baf8`；來源在本輪獨立download-provenance中記錄same-filesystem hardlink／zero新下載bytes。下列JSON的anonymous_public_download指archive确曾匿名取得／核驗，不表示三者都在本次重新下載。Private／Ribbits及其他host變體另有來源，不含在這六個公開包範圍。

本次紀錄 `private-operation-record`；reviewed SHA **`bd059ab13cd6ba38b12f27050c49d130e3db38e2d6a01f5d79391bcd82957ea0`**，政策installed／deferred_client_acceptance綁同SHA；raw **`7b23d895611702659ed50e5d8cf0485807f898d6aa72d92ecf8ae2c013d7f245`** 分開保留。以下公開proof原JSON SHA **`6b111848c8903407ec8ae63ccb58f5866c5ed15145ff50bec300e6470aa943a5`**。

Poststart254 warnings／0 errors、227 watchdog（9 Spike／217 Slowdown／1 High Memory）；T290／282、Ribbits418、W271、G517、Cookery308、AMW307ms Spike仍在。ItemTypes正向lookup source回歸沒有明確native收益；本輪native100／10ms門檻、舊native告警disabled及不同窗口不能比效能百分比。

`client=false`、`production_ready=false`、`pending_client_acceptance`；快開短空條、聲畫／操作、whole HUD／title、Java一比一及作者新UUID/API/保存仍待完成。[現况](BASELINE-STATUS.md)与[真人流程](../docs/HUD-COMPAT-CLIENT-HANDOFF-20261012.md)另列。T152／W129仅本機freeze，native／LIVE未接受；per-chunk快取仍留partial reverse整串FNV，151proof不挪用为152。

以下唯一JSON原文仅三公開repo／六自有UUID、公開archive／source／manifest與聚合baseline metadata，沒有私有commit／path／script／log、玩家／world鍵或其hash。Receipt SHA屬聚合候選，archiveSHA屬公開下載；完整family/native/world報告不外傳。旧150／149／148及其他历史proof与parity保持。

```json
{
  "schema": 1,
  "recorded_at": "2026-10-12T19:01:20.380719+00:00",
  "run": "20261013-native-item-t151-g130-w128-p34-ribbits10036",
  "reviewed_receipt_sha256": "bd059ab13cd6ba38b12f27050c49d130e3db38e2d6a01f5d79391bcd82957ea0",
  "status": "all_three_public_archives_match_six_installed_owned_packs",
  "releases": [
    {
      "repository": "casama233/kaleidoscope-tavern-unofficial",
      "version": [
        0,
        6,
        151
      ],
      "tag": "v0.6.151-beta.1",
      "archive": "Kaleidoscope_Tavern_Unofficial_0.6.151_baseline1.mcaddon",
      "download_url": "https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/download/v0.6.151-beta.1/Kaleidoscope_Tavern_Unofficial_0.6.151_baseline1.mcaddon",
      "release": "https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/tag/v0.6.151-beta.1",
      "publication_commit": "5c1aa26d9297362d9a7e47671db1258060181d4d",
      "archive_sha256": "6e1ebafc77fcce9a13ebe7e0bdd8f427bcb46e1fb432e6903b9451613e48a29f",
      "bytes": 5901855,
      "anonymous_public_download": true,
      "packs": [
        {
          "uuid": "f54f37f9-485a-55bf-8f89-6558aca988c5",
          "side": "behavior",
          "version": [
            0,
            6,
            151
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
            151
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
        128
      ],
      "tag": "v0.1.128-preview.1",
      "archive": "Kaleidoscope_World_Liquor_Unofficial_0.1.128_preview1.mcaddon",
      "download_url": "https://github.com/casama233/kaleidoscope-world-liquor-unofficial/releases/download/v0.1.128-preview.1/Kaleidoscope_World_Liquor_Unofficial_0.1.128_preview1.mcaddon",
      "release": "https://github.com/casama233/kaleidoscope-world-liquor-unofficial/releases/tag/v0.1.128-preview.1",
      "publication_commit": "8d0983dd1c2f16634b393fbed3bd9121d0df78e7",
      "archive_sha256": "0908b6c6c33e110ddb0e2e648948d2846d3a09742cdc7cb7ccebc58e88c13632",
      "bytes": 7169841,
      "anonymous_public_download": true,
      "packs": [
        {
          "uuid": "355ffdfc-50e6-5a33-a126-4d78ab955b2b",
          "side": "behavior",
          "version": [
            0,
            1,
            128
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
            128
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
