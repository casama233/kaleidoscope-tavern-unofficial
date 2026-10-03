# 完整家族更新流程

`tools/family_update.py` 取代每輪複製、改版號與路徑的私人部署腳本。
版本仍由各自 canonical runtime 決定；本工具不凍結版本、不修改包內容，
不替代 `family_bundle.py`、`family_guard.py` 或 BSM 准入。

## 一次設定，一個入口

將 `family/update-config.example.json` 複製到 **Git 外**的本機設定檔，
填入三個乾淨 canonical main、實際 BDS／世界／quality 路徑、archive 目錄，
以及一個從未用過的候選輸出目錄。各 `pull_requests` 必須填入已合併的實際 PR；
範例的 `0` 是待填值，不能通過驗證。

`api_module` 是本機既有 BSM 認證介面，提供
`req(path, body=None, method='GET')`。密碼、token、原始 BSM 設定和私人套件
不應放在這個倉庫或候選設定檔。Docker 的 API 路徑可用
`api_path_mappings` 明確映射到主機；本工具會核對 BSM servers 根目錄、
active world、summary 名稱及 `server.properties` 原始 bytes，防止停 A 服卻改 B 存檔。

使用設定中的 Python 解譯器，需預先具備 `nbtlib==2.0.4` 與現有 Bedrock
LevelDB Python adapter；`gh` 需已有正常的唯讀 GitHub 認證。缺少依賴會在停服前拒絕。
不要解析 venv Python 的符號連結改用系統 Python，也不要使用 `-O`。

```sh
/path/to/venv/bin/python tools/family_update.py --config /local/update.json plan
/path/to/venv/bin/python tools/family_update.py --config /local/update.json prepare --execute
/path/to/venv/bin/python tools/family_update.py --config /local/update.json deploy --execute
```

已存在本輪 live 開發持續授權時，可用單一命令完成上述流程：

```sh
/path/to/venv/bin/python tools/family_update.py --config /local/update.json update --execute
```

沒有 `--execute` 時只顯示計畫，不建立候選、不停服、不寫政策。`prepare` 不修改 live；
`deploy` 仍必須通過來源、static、BDS、fresh saved-world、canonical／BSM admission。
來源必須是乾淨、與遠端相符的 main，執行中的工具 bytes 也必須與 canonical 相符。

## 哪些工作只做一次

| 階段 | 重用條件 | 不可省略的核對 |
| --- | --- | --- |
| live 清單快照 | 同一輸出目錄已有完整 capture | live 全檔、順序、政策、localization index、server properties、引擎仍相同 |
| 完整家族組裝 | 同候選已成功生成 | 三庫與 extension 的提交／tree／baseline、家族鎖、組裝器、設定、runner、候選全檔仍相同 |
| 功能檢查 | 已合併 PR 的真實 GitHub checks | 完整 PR Git tree 等於本機 main；必要 GitHub Actions checks 都 success；任何失敗／未完成的附加 check 也拒絕 |
| 新世界 BDS 首次＋重啟 | 同候選、場景、引擎與完整輸入的成功報告 | 原始 log hash、兩個不同 phase、server／家族初始化、0 玩家／0 錯誤；builtin packs、definitions 與 engine config 不得漂移 |
| 已部署的同一候選 | 完整 live bytes、版號、顺序與政策仍匹配 | 再次呼叫不重啟；來源或 live 已改則拒絕將舊候選當目前版本 |

GitHub 檢查是實際執行的功能測試證據，不再為了填收據在本機重跑同一套。
需要本機診斷時仍可使用各倉庫的既有驗證命令；CI 與本機結果不得混稱。
Tavern 只改家族工具時 baseline lane 仍執行工具測試；runtime 改動才要求完整
runtime lanes。Grilling 與 World Liquor 保留各自必要 job 名称。

候選和 live 的完整包 bytes、版本及順序已相同時，記錄 `no_runtime_changes`，
不做無意義的新世界測試、停服、存檔複製或政策改寫。這不會把既有 pending client 改成通過。

cache 重用只適用於同一份不可變候選。不是只看版號、mtime、`ok=true` 或 README。
失敗、缺檔、hash 不符或執行工具改變時，保留現場並要求新的輸出目錄，
不清掉舊證據硬跑。來源只改文件但完整 commit/tree 已變，當前工具會保守拒絕重用
舊候選；CI 的變更分類負責避免不必要的功能套件執行。

## 每次部署仍需新的存檔證據

每次真正改 live 都取得 maintenance lock／lease，確認最初為 RUNNING，正常停服，
建立全檔一致備份，從**本次**備份建立隔離世界，載入同一個候選並重啟。
`bds` 和 `saved_world_migration` 共同引用這次保存檔演練，不因有兩個欄位再多跑一次。
新世界初始化與既有世界保存資料是兩個場景，各自首次＋重啟仍保留。

實際安裝前重新比對來源、存檔未被包安裝改寫、完整收據與相依，登記本候選的
`deferred_client_acceptance`，並執行 canonical 與 BSM guard。原始組裝收據不改寫；
驗收結果寫入另一份 reviewed receipt。安裝及啟動後再次比對全檔與順序。

回退失敗或原始包／政策不完整時保持停服及 active `needs_operator_recovery`；
只有核對完成的原始整套包才可重啟。新資料庫不會被舊快照自動覆蓋。

這個入口只處理 UUID 不變的更新。身份遷移仍須另行設計、實際演練及逐筆資料證據。
私人 extension 如果有 runtime 變動，也須補它自己的功能證據，不能用三個公開 PR 代替。

## 保持驗收誠實

成功部署狀態仍是 `pending_client_acceptance`，`client=false`、`production_ready=false`。
沒有模擬玩家；沒有把原生載入、API accepted 次數或腳本 double 當成 Windows 渲染驗收。
完成的人工作業、版本及結果應另行記錄，不修改本次未經真人測試的原始報告。

## 驗證與維護

`python -m unittest discover -s tools/family_update -p 'test_*.py'` 使用隔離暫存目錄
及替代的 BSM／程序介面，檢查恢復、hash 漂移、必要 CI、路徑綁定、no-op 和 resume。
測試不啟動 Minecraft，也不接觸 live。

組裝器在單次 build 中只索引每份 upstream archive 一次，使用時重新核對選中 bytes，
不永久相信檔名快取。复制後已驗證的檔案清單可在同一階段重用；停服、安裝、啟動等
狀態邊界的檔案檢查仍保留。

### 合併期間來源前進

當另一個已審查 PR 在合併前進入 base，PR head 的完整 tree 可能不等於最後的
canonical merge tree。此時僅接受「該 PR 的實際 merge commit 就是目前 canonical
commit」且完整 tree 相同的情況；檢查改查該 merge commit 的實際 GitHub CI。
必要 runtime jobs 必須對此完整來源成功，不能沿用舊 head 的綠燈。收據分別記錄
reviewed PR head、checked commit 與 tree。其他後續來源仍要求自己的目前 merged PR。
