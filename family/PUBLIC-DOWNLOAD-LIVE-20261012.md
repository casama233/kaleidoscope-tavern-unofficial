# 公開下載與 LIVE 自有包核對

2026-10-12，三個公開 `.mcaddon` 均已發布並實際下載讀回。六份自有 BP／RP 的完整檔案集合與內容逐檔等於 managed-server 本次准入收據和已安裝內容，合計 9333 檔。沒有在家族組裝、翻譯或安裝階段另加自有玩法修補。

| 包 | 公開下載 | 發布來源 |
|---|---|---|
| 酒館 0.6.147 | [v0.6.147-beta.1](https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/tag/v0.6.147-beta.1)／[mcaddon](https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/download/v0.6.147-beta.1/Kaleidoscope_Tavern_Unofficial_0.6.147_baseline1.mcaddon) | `44fb93d90e401f21072dc3abeaecd791a4ed2d37` |
| 世界名酒 0.1.124 | [v0.1.124-preview.1](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/releases/tag/v0.1.124-preview.1)／[mcaddon](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/releases/download/v0.1.124-preview.1/Kaleidoscope_World_Liquor_Unofficial_0.1.124_preview1.mcaddon) | `c5fdb2424b69c522dc2afd0860e6546a1c8f54b0` |
| 燒烤 2.8.128 | [A2.8.128-beta.2](https://github.com/casama233/kaleidoscope-grilling-unofficial/releases/tag/A2.8.128-beta.2)／[mcaddon](https://github.com/casama233/kaleidoscope-grilling-unofficial/releases/download/A2.8.128-beta.2/Kaleidoscope_Grilling_A2.8.128_Review.mcaddon) | `0a65b9d93a17bcf2c22320083e9c14eadd4b8b44` |

完整家族已於 **[private deployment time]** 部署 T147／G128／W124／private-integration，42包（22BP／20RP）、BDS1.26.52.3、RUNNING。static、一次停服備份存檔副本 first／restart、准入及完整檔案／順序／正常啟動讀回通過，18筆玩家與2個容器資料、原生儲存身份／完整NBT保留；冰櫃輸入0筆。最新完整回退一份，舊生成副本已退休。

G128 beta.1草稿因GitHub按tag找不到draft而未發布；建立tag又觸發舊A1.16工作流寫入實驗產物，來源核對正確中止。原草稿、失敗與c3fac5cc提交均保留。[PR196](https://github.com/casama233/kaleidoscope-grilling-unofficial/pull/196)修正唯一draft的ID讀取、將四個legacy工作流限制在實際來源／人工執行並移除自動寫main；beta.2使用新工具CI的同完整Git tree產物。部署G來源49a1918c和公開發布0a65b9d9只在工具、metadata與已記錄實驗產物不同，G128輸出未變，未另建遊戲候選或重啟LIVE。

公開自有包相等的範圍是這六份BP／RP；私有料理／AMW整合和第三方host變體另有來源。Grilling需要指定作者[Cookery1.6.0／CF9054164](https://www.curseforge.com/minecraft-bedrock/addons/kaleidoscope-cookery-unofficial/files/9054164)。公開family API0.2.10可依[原組裝說明](../docs/PUBLICATION-T147-G128-W124.md)使用官方釘選原包與三庫來源，在沒有private --extension的情況下復現。Cookery1.6.1的新UUID／API／state適配未納入此版。

`client=false`、`production_ready=false`、`pending_client_acceptance`。逐檔相同、CI、BDS或部署成功不代表完整Java一比一及真人畫面／操作驗收。原HUD100失敗、HUD200有限診斷、G126／G127特定影片及G125 Uses原生觀察保留原身份；後續真人比較見[差距與現況](BASELINE-STATUS.md)。

以下JSON摘要只含公開自有包的來源與核對結果；完整逐檔收據、日志及政策保留本機，舊報告不改寫。

```json
{
  "schema": 1,
  "recorded_at": "2026-10-11T18:36:26.064736+00:00",
  "run": "20261012-t147-g128-w124-p32",
  "reviewed_receipt_sha256": "9940f9bc4a1675dd73ed8fccef30bd98e685b3d7021c700aca77752239fde4c8",
  "status": "all_three_public_archives_match_six_installed_owned_packs",
  "releases": [
    {
      "repository": "casama233/kaleidoscope-tavern-unofficial",
      "version": "0.6.147",
      "release": "https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/tag/v0.6.147-beta.1",
      "tag": "v0.6.147-beta.1",
      "publication_commit": "44fb93d90e401f21072dc3abeaecd791a4ed2d37",
      "archive": "Kaleidoscope_Tavern_Unofficial_0.6.147_baseline1.mcaddon",
      "download_url": "https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/download/v0.6.147-beta.1/Kaleidoscope_Tavern_Unofficial_0.6.147_baseline1.mcaddon",
      "archive_sha256": "013295193c5879de20c59ed4ed7aaedab189cd250255159e7c05c091abb8952f",
      "bytes": 5888631,
      "packs": [
        {
          "uuid": "f54f37f9-485a-55bf-8f89-6558aca988c5",
          "side": "behavior",
          "version": [
            0,
            6,
            147
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
            147
          ],
          "files": 3222,
          "archive_matches_receipt": true,
          "archive_matches_live": true
        }
      ],
      "full_file_match": true
    },
    {
      "repository": "casama233/kaleidoscope-world-liquor-unofficial",
      "version": "0.1.124",
      "release": "https://github.com/casama233/kaleidoscope-world-liquor-unofficial/releases/tag/v0.1.124-preview.1",
      "tag": "v0.1.124-preview.1",
      "publication_commit": "c5fdb2424b69c522dc2afd0860e6546a1c8f54b0",
      "archive": "Kaleidoscope_World_Liquor_Unofficial_0.1.124_preview1.mcaddon",
      "download_url": "https://github.com/casama233/kaleidoscope-world-liquor-unofficial/releases/download/v0.1.124-preview.1/Kaleidoscope_World_Liquor_Unofficial_0.1.124_preview1.mcaddon",
      "archive_sha256": "5c5a0352fd743258f323e958d32be56fd2062752343da6afe1f934cdb1c122c5",
      "bytes": 7168034,
      "packs": [
        {
          "uuid": "355ffdfc-50e6-5a33-a126-4d78ab955b2b",
          "side": "behavior",
          "version": [
            0,
            1,
            124
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
            124
          ],
          "files": 549,
          "archive_matches_receipt": true,
          "archive_matches_live": true
        }
      ],
      "full_file_match": true
    },
    {
      "repository": "casama233/kaleidoscope-grilling-unofficial",
      "version": "2.8.128",
      "release": "https://github.com/casama233/kaleidoscope-grilling-unofficial/releases/tag/A2.8.128-beta.2",
      "tag": "A2.8.128-beta.2",
      "publication_commit": "0a65b9d93a17bcf2c22320083e9c14eadd4b8b44",
      "deployed_source_commit": "49a1918cbfccbe0839ca3abc458187b20364023b",
      "publication_only_changes_after_deployment": true,
      "archive": "Kaleidoscope_Grilling_A2.8.128_Review.mcaddon",
      "download_url": "https://github.com/casama233/kaleidoscope-grilling-unofficial/releases/download/A2.8.128-beta.2/Kaleidoscope_Grilling_A2.8.128_Review.mcaddon",
      "archive_sha256": "c9d1ce3b22474389218994a40cf6a4c8beaa28fef2e1e3b5d33dc25757843ca8",
      "bytes": 14608397,
      "packs": [
        {
          "uuid": "c68005c5-23ff-54e8-a3ff-da6349ad43c2",
          "side": "behavior",
          "version": [
            2,
            8,
            128
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
            128
          ],
          "files": 3621,
          "archive_matches_receipt": true,
          "archive_matches_live": true
        }
      ],
      "full_file_match": true
    }
  ],
  "matched_packs": 6,
  "matched_files": 9333,
  "all_files_match": true,
  "client": false,
  "production_ready": false
}
```
