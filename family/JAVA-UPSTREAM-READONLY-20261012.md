# Dot：Java 上游唯讀查核原檔

Dot 回報 Windows SSH 的 DNS／networkDenied 失敗，因而無法讀取要求的 BSM 上游狀態。這份原檔由可讀 BSM 的維護端取得，讓 Dot 透過 GitHub connector 直接讀取；不必為讀檔持續重試 Windows SSH。

- BSM 原檔：`/private-server-data/operation-record`
- 作者查核時間：`2026-10-12T10:23:03.930533+00:00`（香港 2026-10-12 18:23:03）
- 本次讀取 UTC：`2026-10-12T12:12:25.314295+00:00`
- 原檔長度：**7621 bytes**
- 原檔 SHA256：`24407c143f904c208cd5e56d46de54a66843077c941d728c56307b0f0a095f37`

下方唯一 `json` 區塊完整保留原檔的 UTF-8 bytes，包括結尾換行。Dot 可用 GitHub connector 讀取此 Markdown，擷取區塊內容並保存為其所需的 `addon_quality/senluo-java-upstream-status.json`；讀回 bytes／SHA 與上列值相符後，和 [family/java-upstream.json](java-upstream.json) 一起供本輪修補前查核。這是取得時間點的唯讀快照；超過原定六小時查核週期或另有新版／查詢失敗時仍須取得新結果，不把舊快照當永久最新。

六個已維護 Forge／NeoForge 分支的發布 metadata current、parity pending；World Liquor 的獨立 NeoForge 26.1.2／1.1.6 分支仍為 `new_release_requires_adaptation`，因此原檔的 `all_reference_release_metadata_current=false` 保持不變。全部分支 `parity_verified=false`；這份查核不證明完整 Java 還原、客戶端 UI 或任何候選驗收。

此文件只提供原檔讀取途徑，不替代 `family/java-upstream.json` 的分支來源紀錄、BSM 現行政策或家族准入。內容只有作者發布 metadata／既有公開來源範圍，沒有憑證、世界資料或第三方完整腳本；沒有安裝 JAR、改遊戲 runtime、升包或重啟 LIVE。

```json
{
  "schema": 1,
  "checked_at": "2026-10-12T10:23:03.930533+00:00",
  "read_only": true,
  "automatic_deployment": false,
  "downloads": false,
  "all_reference_release_metadata_current": false,
  "full_java_parity_verified": false,
  "projects": [
    {
      "name": "Tavern",
      "project_id": 1475175,
      "parity_verified": false,
      "minecraft": "1.20.1",
      "loader": "Forge",
      "source_reference_file_ids": [
        8350841
      ],
      "source_scope": "Author1.2.0; reviewed Forge1.20.1 sourcec4ec1880. Current implementation and open/native/client scopes are maintained in Tavern docs/PARITY-MATRIX.md; deployed full-family evidence in family/BASELINE-STATUS.md. Separate unpublished26.1.2 source9b8f165a remains partially reviewed. Version/hash equality does not establish Java gameplay or rendered-client parity.",
      "newest_author_file": {
        "id": 8350841,
        "displayName": "kaleidoscopetavern-1.2.0-forge+mc1.20.1.jar",
        "fileDate": "2026-07-01T08:02:28.523Z",
        "releaseType": 1
      },
      "newest_stable_file": {
        "id": 8350841,
        "displayName": "kaleidoscopetavern-1.2.0-forge+mc1.20.1.jar",
        "fileDate": "2026-07-01T08:02:28.523Z",
        "releaseType": 1
      },
      "status": "reference_metadata_current_parity_pending"
    },
    {
      "name": "Tavern",
      "project_id": 1475175,
      "parity_verified": false,
      "minecraft": "1.21.1",
      "loader": "NeoForge",
      "source_reference_file_ids": [
        8350856
      ],
      "source_scope": "Author1.2.0; reviewed NeoForge1.21.1 sourcea1afba34. Current implementation and open/native/client scopes are maintained in Tavern docs/PARITY-MATRIX.md; deployed full-family evidence in family/BASELINE-STATUS.md. Separate unpublished26.1.2 source9b8f165a remains partially reviewed. Version/hash equality does not establish Java gameplay or rendered-client parity.",
      "newest_author_file": {
        "id": 8350856,
        "displayName": "kaleidoscopetavern-1.2.0-neoforge+mc1.21.1.jar",
        "fileDate": "2026-07-01T08:08:12.91Z",
        "releaseType": 1
      },
      "newest_stable_file": {
        "id": 8350856,
        "displayName": "kaleidoscopetavern-1.2.0-neoforge+mc1.21.1.jar",
        "fileDate": "2026-07-01T08:08:12.91Z",
        "releaseType": 1
      },
      "status": "reference_metadata_current_parity_pending"
    },
    {
      "name": "Grilling",
      "project_id": 1666863,
      "parity_verified": false,
      "minecraft": "1.20.1",
      "loader": "Forge",
      "source_reference_file_ids": [
        8726006
      ],
      "source_scope": "Author1.1.1; maintained Forge1.20.1 reference. Source-backed producer, seasoning, persistence and platform/client scopes are maintained in Grilling docs/PARITY-MATRIX.md; current full-family deployment in Tavern family/BASELINE-STATUS.md. No complete Java or client parity claimed.",
      "newest_author_file": {
        "id": 8726006,
        "displayName": "kaleidoscope_grilling-1.1.1-forge1.20.1.jar",
        "fileDate": "2026-08-24T18:01:22.283Z",
        "releaseType": 1
      },
      "newest_stable_file": {
        "id": 8726006,
        "displayName": "kaleidoscope_grilling-1.1.1-forge1.20.1.jar",
        "fileDate": "2026-08-24T18:01:22.283Z",
        "releaseType": 1
      },
      "status": "reference_metadata_current_parity_pending"
    },
    {
      "name": "Grilling",
      "project_id": 1666863,
      "parity_verified": false,
      "minecraft": "1.21.1",
      "loader": "NeoForge",
      "source_reference_file_ids": [
        8726014
      ],
      "source_scope": "Author1.1.1; maintained NeoForge1.21.1 reference. Source-backed producer, seasoning, persistence and platform/client scopes are maintained in Grilling docs/PARITY-MATRIX.md; current full-family deployment in Tavern family/BASELINE-STATUS.md. No complete Java or client parity claimed.",
      "newest_author_file": {
        "id": 8726014,
        "displayName": "kaleidoscope_grilling-1.1.1-neoforge1.21.1.jar",
        "fileDate": "2026-08-24T18:02:36.913Z",
        "releaseType": 1
      },
      "newest_stable_file": {
        "id": 8726014,
        "displayName": "kaleidoscope_grilling-1.1.1-neoforge1.21.1.jar",
        "fileDate": "2026-08-24T18:02:36.913Z",
        "releaseType": 1
      },
      "status": "reference_metadata_current_parity_pending"
    },
    {
      "name": "World Liquor",
      "project_id": 1502365,
      "parity_verified": false,
      "minecraft": "1.20.1",
      "loader": "Forge",
      "source_reference_file_ids": [
        8947050,
        9066402
      ],
      "source_scope": "Author1.1.12; maintained Forge1.20.1 reference. Current author bytes, recipes/effects/assets review is World Liquor data/current-author-review-20261009.json; implementation/open/event/platform/client scopes in docs/PARITY-MATRIX.md. Full-family deployment evidence is Tavern family/BASELINE-STATUS.md. No complete branch or client parity claimed.",
      "newest_author_file": {
        "id": 9066402,
        "displayName": "kaleidoscope_world_liquor-1.1.12-forge+mc1.20.1-fix-all.jar",
        "fileDate": "2026-10-05T05:34:28.403Z",
        "releaseType": 1
      },
      "newest_stable_file": {
        "id": 9066402,
        "displayName": "kaleidoscope_world_liquor-1.1.12-forge+mc1.20.1-fix-all.jar",
        "fileDate": "2026-10-05T05:34:28.403Z",
        "releaseType": 1
      },
      "status": "reference_metadata_current_parity_pending"
    },
    {
      "name": "World Liquor",
      "project_id": 1502365,
      "parity_verified": false,
      "minecraft": "1.21.1",
      "loader": "NeoForge",
      "source_reference_file_ids": [
        8704187,
        8947041,
        9066406
      ],
      "source_scope": "Author1.1.11; maintained NeoForge1.21.1 reference. Current author bytes, recipes/effects/assets review is World Liquor data/current-author-review-20261009.json; implementation/open/event/platform/client scopes in docs/PARITY-MATRIX.md. Full-family deployment evidence is Tavern family/BASELINE-STATUS.md. No complete branch or client parity claimed.",
      "newest_author_file": {
        "id": 9066406,
        "displayName": "kaleidoscope_world_liquor-1.1.11-neoforge+1.21.1.jar",
        "fileDate": "2026-10-05T05:35:28.54Z",
        "releaseType": 1
      },
      "newest_stable_file": {
        "id": 9066406,
        "displayName": "kaleidoscope_world_liquor-1.1.11-neoforge+1.21.1.jar",
        "fileDate": "2026-10-05T05:35:28.54Z",
        "releaseType": 1
      },
      "status": "reference_metadata_current_parity_pending"
    },
    {
      "name": "World Liquor",
      "project_id": 1502365,
      "parity_verified": false,
      "minecraft": "26.1.2",
      "loader": "NeoForge",
      "source_reference_file_ids": [],
      "source_scope": "Separate author1.1.6 CF9087098. Branch divergence is reviewed in World Liquor family/world-liquor-26.1.2-1.1.6-review.json; Luck/BlockDrops/own registration adaptation remains incomplete. Does not replace the maintained1.21.1 gameplay reference; no full branch/client parity claimed.",
      "newest_author_file": {
        "id": 9087098,
        "displayName": "kaleidoscope_world_liquor-1.1.6-neoforge+26.1.2.jar",
        "fileDate": "2026-10-07T06:54:58.387Z",
        "releaseType": 1
      },
      "newest_stable_file": {
        "id": 9087098,
        "displayName": "kaleidoscope_world_liquor-1.1.6-neoforge+26.1.2.jar",
        "fileDate": "2026-10-07T06:54:58.387Z",
        "releaseType": 1
      },
      "status": "new_release_requires_adaptation"
    }
  ]
}
```
