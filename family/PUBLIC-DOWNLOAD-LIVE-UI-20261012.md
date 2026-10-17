# 公開下載與 LIVE：本輪 UI 修補核對

2026-10-12，三個公開 `.mcaddon` 已發布並以未登入方式實際下載。六份自有 BP／RP 的完整檔案集合與內容逐檔等於 managed-server 本次准入收據和已安裝內容，合計 **9339 檔**。沒有在家族組裝、翻譯或安裝階段另加自有玩法修補。

| 包 | 公開下載 | 發布／部署來源 |
|---|---|---|
| 酒館 0.6.148 | [v0.6.148-beta.1](https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/tag/v0.6.148-beta.1)／[mcaddon](https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/download/v0.6.148-beta.1/Kaleidoscope_Tavern_Unofficial_0.6.148_baseline1.mcaddon) | `4698a3ab3d0ac36422e2c11d598aca6fed16ef98` |
| 燒烤 2.8.129 | [A2.8.129-beta.1](https://github.com/casama233/kaleidoscope-grilling-unofficial/releases/tag/A2.8.129-beta.1)／[mcaddon](https://github.com/casama233/kaleidoscope-grilling-unofficial/releases/download/A2.8.129-beta.1/Kaleidoscope_Grilling_A2.8.129_Review.mcaddon) | `2a923c368a9bef490d44ba3f13c0ac1650052164` |
| 世界名酒 0.1.125 | [v0.1.125-preview.1](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/releases/tag/v0.1.125-preview.1)／[mcaddon](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/releases/download/v0.1.125-preview.1/Kaleidoscope_World_Liquor_Unofficial_0.1.125_preview1.mcaddon) | `7278774a7eebd8f72145a22f8dc32f27514261b7` |

完整家族於 **[private deployment time]** 部署 T148／G129／W125／private-integration，42包（22BP／20RP）、BDS1.26.52.3、RUNNING。Static、一次停服備份存檔副本first／restart、准入及完整檔案／順序／正常啟動讀回通過。當次poststart313 warnings／0 errors，LIVE仍有慢速警告。來源已經canonical PR／檢查／合併；最新完整可用回退一份。

本次紀錄 `private-operation-record`，reviewed receipt SHA **`26a2e98f64f4dbe04fedc948d317f58956bb97c11b0f00bdddcfefa37415fa15`**；准入及deferred_client_acceptance綁同一SHA。下載比對記錄時間 **2026-10-12 21:25:03 香港時間**。舊[公開核對](PUBLIC-DOWNLOAD-LIVE-20261012.md)及失敗紀錄保留各自原始版本／結果。

T／G renderer移入各自註冊命名空間，兩包共用相同最小可選HUD掛載及內部封包過濾；原Atlas、動畫、時間及玩法保持。W125精確配對T148。公開自有包相等的範圍是這六份BP／RP；私有料理／AMW整合和第三方host變體另有canonical來源。private-integration唯一新元件是Cookery配方快取按需重建，原renderer32與ChineseFood1.0.10432保持，沒有混入公開移植包。

Grilling指定作者[Cookery1.6.0／CF9054164](https://www.curseforge.com/minecraft-bedrock/addons/kaleidoscope-cookery-unofficial/files/9054164)。公開family API0.2.10可依[原組裝說明](../docs/PUBLICATION-T147-G128-W124.md)，使用當前三庫來源及釘選原包，在沒有private `--extension`時重現。Cookery1.6.1的新UUID／API／state／保存適配未納入此版。

`client=false`、`production_ready=false`、`pending_client_acceptance`。逐檔相同、CI、BDS或部署成功不等於完整Java一比一或真人畫面／操作驗收。Node來源模組差分的75→7次鍋類快取重建不能冒充BDS watchdog或客戶端卡頓改善。快開短空條、共享Actionbar競爭及第三方完整HUD覆蓋仍待[完整家族客戶端回歸](../docs/HUD-COMPAT-CLIENT-HANDOFF-20261012.md)；[現行差距](BASELINE-STATUS.md)保留原始影片與版本範圍。

以下原JSON只含三個公開自有addon、六份包的來源和核對結果；沒有私人檔案、完整家族逐檔內容或世界資料。完整准入／日誌／政策保留本機，沒有改寫歷史收據。

```json
{
  "schema": 1,
  "recorded_at": "2026-10-12T13:25:03.809659+00:00",
  "run": "20261012-ui-t148-g129-w125-p33-r2",
  "reviewed_receipt_sha256": "26a2e98f64f4dbe04fedc948d317f58956bb97c11b0f00bdddcfefa37415fa15",
  "status": "all_three_public_archives_match_six_installed_owned_packs",
  "releases": [
    {
      "repository": "casama233/kaleidoscope-tavern-unofficial",
      "version": "0.6.148",
      "tag": "v0.6.148-beta.1",
      "archive": "Kaleidoscope_Tavern_Unofficial_0.6.148_baseline1.mcaddon",
      "download_url": "https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/download/v0.6.148-beta.1/Kaleidoscope_Tavern_Unofficial_0.6.148_baseline1.mcaddon",
      "release": "https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/tag/v0.6.148-beta.1",
      "publication_commit": "4698a3ab3d0ac36422e2c11d598aca6fed16ef98",
      "archive_sha256": "97f3efa674c228866969c1b0aa4eb7de540404b6a73a660aecf761abf1c63a08",
      "bytes": 5889378,
      "anonymous_public_download": true,
      "packs": [
        {
          "uuid": "f54f37f9-485a-55bf-8f89-6558aca988c5",
          "side": "behavior",
          "version": [
            0,
            6,
            148
          ],
          "files": 829,
          "archive_matches_receipt": true,
          "archive_matches_live": true
        },
        {
          "uuid": "c2990d50-2cf7-59f7-886a-0f2d0240d156",
          "side": "resource",
          "version": [
            0,
            6,
            148
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
      "version": "2.8.129",
      "tag": "A2.8.129-beta.1",
      "archive": "Kaleidoscope_Grilling_A2.8.129_Review.mcaddon",
      "download_url": "https://github.com/casama233/kaleidoscope-grilling-unofficial/releases/download/A2.8.129-beta.1/Kaleidoscope_Grilling_A2.8.129_Review.mcaddon",
      "release": "https://github.com/casama233/kaleidoscope-grilling-unofficial/releases/tag/A2.8.129-beta.1",
      "publication_commit": "2a923c368a9bef490d44ba3f13c0ac1650052164",
      "archive_sha256": "aaff6df290c760a75507f8f7815c413a35c72d015d6e735e765cc2a177fa2ca6",
      "bytes": 14609147,
      "anonymous_public_download": true,
      "packs": [
        {
          "uuid": "c68005c5-23ff-54e8-a3ff-da6349ad43c2",
          "side": "behavior",
          "version": [
            2,
            8,
            129
          ],
          "files": 772,
          "archive_matches_receipt": true,
          "archive_matches_live": true
        },
        {
          "uuid": "bbbd2d60-52e5-53a6-8b9a-c09b0f516389",
          "side": "resource",
          "version": [
            2,
            8,
            129
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
      "version": "0.1.125",
      "tag": "v0.1.125-preview.1",
      "archive": "Kaleidoscope_World_Liquor_Unofficial_0.1.125_preview1.mcaddon",
      "download_url": "https://github.com/casama233/kaleidoscope-world-liquor-unofficial/releases/download/v0.1.125-preview.1/Kaleidoscope_World_Liquor_Unofficial_0.1.125_preview1.mcaddon",
      "release": "https://github.com/casama233/kaleidoscope-world-liquor-unofficial/releases/tag/v0.1.125-preview.1",
      "publication_commit": "7278774a7eebd8f72145a22f8dc32f27514261b7",
      "archive_sha256": "b840b826e5bc25df9948b221ebd725820baa7caa8866d52df74f2263a475d131",
      "bytes": 7168034,
      "anonymous_public_download": true,
      "packs": [
        {
          "uuid": "355ffdfc-50e6-5a33-a126-4d78ab955b2b",
          "side": "behavior",
          "version": [
            0,
            1,
            125
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
            125
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
  "matched_files": 9339,
  "all_files_match": true,
  "client": false,
  "production_ready": false,
  "scope": "Three public ports only; private cuisine and reviewed third-party host extensions are separate."
}
```
