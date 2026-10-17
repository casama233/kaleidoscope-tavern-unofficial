# 公開下載與 LIVE：T149／G130／W126

**[private deployment time]**，managed-server已部署T149／G130／W126／private-integration，42包（22BP／20RP）、BDS1.26.52.3、RUNNING。Canonical PR／CI、完整家族static、一次新鮮停服存檔副本first／restart、准入及逐檔／順序／正常啟動讀回通過。

三個公开 `.mcaddon` 已發布並匿名實際下載。六份自有BP／RP的完整檔案集合與內容逐檔等於本次LIVE與准入收據，共 **9343檔**；沒有在組裝、翻譯或安裝時另加自有玩法補丁。匿名下載比對記錄時間 **2026-10-13 00:42:00 香港時間**。

| 包 | 公開下載 | 發布／部署來源 |
|---|---|---|
| 酒館 0.6.149 | [v0.6.149-beta.1](https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/tag/v0.6.149-beta.1)／[mcaddon](https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/download/v0.6.149-beta.1/Kaleidoscope_Tavern_Unofficial_0.6.149_baseline1.mcaddon) | `75acd5884fabd09ece2a02fa3384099d325f6f83` |
| 燒烤 A2.8.130 | [A2.8.130-beta.1](https://github.com/casama233/kaleidoscope-grilling-unofficial/releases/tag/A2.8.130-beta.1)／[mcaddon](https://github.com/casama233/kaleidoscope-grilling-unofficial/releases/download/A2.8.130-beta.1/Kaleidoscope_Grilling_A2.8.130_Review.mcaddon) | `a567e17c0316f7f2175dfef07004bb944634ca90` |
| 世界名酒 0.1.126 | [v0.1.126-preview.1](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/releases/tag/v0.1.126-preview.1)／[mcaddon](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/releases/download/v0.1.126-preview.1/Kaleidoscope_World_Liquor_Unofficial_0.1.126_preview1.mcaddon) | `57f8fef7c56b2811f198c28daed09a5e27ce6a36` |

本次紀錄 `private-operation-record`；reviewed receipt SHA **`4b8a4746ab253f05da7b3ed10b2b4cf8d624eda652d04b5458fb3673f6c8fefb`**，政策installed／deferred_client_acceptance綁同一SHA。原組裝收據SHA `3e84b79a49946880128a8a09836860038775cfbcaa2756e8648f8520ae9d67e6` 分開保留。以下公開下載核對JSON的SHA256為 **`366a228d8453913d447aec145471f6b2cce665d474b4c7502fe1d92f290b1ab7`**。

T149有界準備指南／擴充，T／G圖形改命名空間封包、已觀測可選UI Queue／title路由、獨立快照與明確END，不覆寫共享Actionbar；原圖、時間、食物與物品結算保持。W126配對T149並分批準備指南註冊。公開相等的範圍是這六份自有包；私有P34指南接收、P33快取、P32 renderer及第三方HUD相容變體有另外的canonical來源／來源CI及fresh native證據，不混入公開下載。

**啟動watchdog仍未全解決。** 當次poststart292 warnings／0 errors，其中265 watchdog（9 Spike、254 Slowdown、2 High Memory）。T仍2／75、G1／39、W1／81、Cookery1／20筆Spike／Slowdown。W最大Spike1479→284ms但採樣54.892／75.552秒，不算全局效能比較。后續[QA工具PR340](https://github.com/casama233/kaleidoscope-tavern-unofficial/pull/340)保留LIVE已設定100／10ms門檻；舊QA未設定值會關閉對應告警，其載入／保存成功不能作性能成功。

`client=false`、`production_ready=false`、`pending_client_acceptance`。快速重開短空條、真人聲畫／操作、任意第三方完整HUD及未協調title寫入仍待[完整家族回歸](../docs/HUD-COMPAT-CLIENT-HANDOFF-20261012.md)。来源操作次數、BDS、雜湊與部署成功不代表Java完整一比一或真人效能驗收；[現行來源與差距](BASELINE-STATUS.md)另列，後續診斷不改寫本候選原始狀態。作者料理快取／指南回饋仍待送達。

舊[T148核對](PUBLIC-DOWNLOAD-LIVE-UI-20261012.md)、[T147核對](PUBLIC-DOWNLOAD-LIVE-20261012.md)及更早版本／失敗證據保留原身份。以下唯一JSON原文只含三個公開移植包及六份自有包的核對結果，沒有私人來源、檔案／日誌或玩家／世界資料。

```json
{
  "schema": 1,
  "recorded_at": "2026-10-12T16:42:00.312464+00:00",
  "run": "20261012-hud-watchdog-t149-g130-w126-p34",
  "reviewed_receipt_sha256": "4b8a4746ab253f05da7b3ed10b2b4cf8d624eda652d04b5458fb3673f6c8fefb",
  "status": "all_three_public_archives_match_six_installed_owned_packs",
  "releases": [
    {
      "repository": "casama233/kaleidoscope-tavern-unofficial",
      "version": "0.6.149",
      "tag": "v0.6.149-beta.1",
      "archive": "Kaleidoscope_Tavern_Unofficial_0.6.149_baseline1.mcaddon",
      "download_url": "https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/download/v0.6.149-beta.1/Kaleidoscope_Tavern_Unofficial_0.6.149_baseline1.mcaddon",
      "release": "https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/tag/v0.6.149-beta.1",
      "publication_commit": "75acd5884fabd09ece2a02fa3384099d325f6f83",
      "archive_sha256": "77b58c8d3391bc039dcc765f3157a994916480855bc97c933a8c23922cfaf36a",
      "bytes": 5893972,
      "anonymous_public_download": true,
      "packs": [
        {
          "uuid": "f54f37f9-485a-55bf-8f89-6558aca988c5",
          "side": "behavior",
          "version": [
            0,
            6,
            149
          ],
          "files": 831,
          "archive_matches_receipt": true,
          "archive_matches_live": true
        },
        {
          "uuid": "c2990d50-2cf7-59f7-886a-0f2d0240d156",
          "side": "resource",
          "version": [
            0,
            6,
            149
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
      "version": "0.1.126",
      "tag": "v0.1.126-preview.1",
      "archive": "Kaleidoscope_World_Liquor_Unofficial_0.1.126_preview1.mcaddon",
      "download_url": "https://github.com/casama233/kaleidoscope-world-liquor-unofficial/releases/download/v0.1.126-preview.1/Kaleidoscope_World_Liquor_Unofficial_0.1.126_preview1.mcaddon",
      "release": "https://github.com/casama233/kaleidoscope-world-liquor-unofficial/releases/tag/v0.1.126-preview.1",
      "publication_commit": "57f8fef7c56b2811f198c28daed09a5e27ce6a36",
      "archive_sha256": "f3379fbddbc76eb097dd69b91323914a5365f024216cb39539fb0eb672a7ee6f",
      "bytes": 7169844,
      "anonymous_public_download": true,
      "packs": [
        {
          "uuid": "355ffdfc-50e6-5a33-a126-4d78ab955b2b",
          "side": "behavior",
          "version": [
            0,
            1,
            126
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
            126
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
  "matched_files": 9343,
  "all_files_match": true,
  "client": false,
  "production_ready": false,
  "scope": "Three public ports only; private cuisine and reviewed third-party host extensions are separate."
}
```
