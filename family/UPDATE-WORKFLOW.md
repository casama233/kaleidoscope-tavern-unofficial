# 完整家族更新流程

`tools/family_update.py` 取代每輪複製、改版號與路徑的私人部署腳本。
版本仍由各自 canonical runtime 決定；本工具不凍結版本、不修改包內容，
不替代 `family_bundle.py`、`family_guard.py` 或 BSM 准入。

## 精簡工作規則（使用者 2026-10-08）

工作以玩家遇到的問題及原作行為為單位，不以增加測試數、收據數或版本數為進度。

1. **只有一個當前入口。** 本機維護固定的當前進度指標，指向現行 LIVE 收據、當前工作區、未完成差距及下一步。開始時讀這些內容和相關來源即可；不要遍歷歷史目錄、重新整理整份時間線，或逐輪複製上一輪報告。歷史原始證據保持不變，結束的舊副本交既有每小時清理。
2. **先確定要修的行為。** 每項工作寫清楚 Java 的觸發／結果、目前的具體差異、要改的模組和一個能分辨修正是否有效的場景。優先修玩法、數量、時序、互動和保存問題；不要以文件美化、更多 hash 或重複探測代替實作。
3. **本機診斷與 CI 分工。** 本機只跑受影響的既有檢查，或重現已發現的具體失敗；完整必要套件由該 PR 的 CI 執行一次。CI 已通過後，沒有新變更或新失敗就不在本機重跑。用設定中的 venv，避免因選錯解譯器缺依賴而重跑。可逆文件整理只審閱差異，不為它新增測試。
4. **新測試須回答問題。** 僅在既有檢查無法覆蓋重要行為／回歸時新增；不要照抄實作公式、測試記錄格式，或用大量排列製造通過數。BDS 用於腳本無法證明的引擎行為、保存與相容性；畫面、聲音及真人操作交 Dot，同一未變候選不反覆啟動引擎等待不同結論。
5. **相關修補先整合再凍結。** 在一個明確玩法問題內，把相依修補、配方／效果／動畫資料及適配一起完成，再凍結版本、PR／CI／合併並組裝候選。不要每改一行就發版；也不要為湊批次拖延已完成候選的 LIVE 部署。
6. **按狀態邊界核對一次。** 同一 prepare 階段已核對的 candidate receipt 傳給 static 和既有 native 證據檢查，不再次掃描所有包。實際啟動新 BDS、停服備份、安裝、重啟與部署後讀回仍各自核對；不跨變更階段永久快取，不刪除准入要求。
7. **只報告新結果。** 完成後更新當前入口、相關差距和 Dot 場景，交代修了甚麼、LIVE 版本及真正未完成的部分。測試數及 hash 留在證據中，不作為還原度或工作量的宣傳。

工具／文件變更未改輸出 runtime 時，合併 canonical Git 即完成套用；不為此新建遊戲候選、升包版本或重啟 LIVE。若出現來源漂移、真實失敗或驗證不足，針對該原因處理，不把全套檢查當成預設排錯方式。

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

私有整合正在更新外部AMW相依而尚未完成完整驗證時，可以canonical家族鎖的
`extension_deployment_hold`和設定`extension_hold: true`明列保留目前已安裝的兩側。
`extension`路徑須使用固定私有Git提交的乾淨隔離checkout；最新main／候選保持原狀。
必須保留提交的reason_file、私有遠端身份與main祖先、version／source_trees、當前live
逐檔相等及全部准入／fresh保存門檻。不得沿用保留來安裝新private bytes或改寫收據。

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

一般更新要求 UUID 不變。已提交的 Cookery 1.0.8→1.6.0 作者身份遷移可用 `identity_migration` 指向 canonical `family/identity-migrations/cookery-108-to-160.json`；工具限制原／新作者 UUID、版本、archive 與原 manifest，先在本次停服副本逐筆搬移所有權並演練，再採用未受 QA 引擎修改的資料庫。其他身份遷移仍須另行設計與審查。
私人 extension 如果有 runtime 變動，也須補它自己的功能證據，不能用三個公開 PR 代替。

## 保持驗收誠實

成功部署狀態仍是 `pending_client_acceptance`，`client=false`、`production_ready=false`。
沒有模擬玩家；沒有把原生載入、API accepted 次數或腳本 double 當成 Windows 渲染驗收。
完成的人工作業、版本及結果應另行記錄，不修改本次未經真人測試的原始報告。

## 已審查的下一版保留包

`prospective_preserved_inputs` 可引用 Git 外的審查 JSON，將四個已安裝的保留包
換成 canonical extension recipe 的下一版輸出。它不是 live 漂移核准：目前所有
identity、逐檔內容及順序仍須先與現行准入一致，禁止新增或替换 UUID。
四個輸出須是兩組版本與相依同步的 BP/RP，保留 module UUID/type；來源目錄
不能與 live、來源 Git 或候選重疊，不能使用 symlink／hardlink。

審查記錄包含 `schema: 1`、`source_commit`、`recipe` 的相對路徑與摘要、
`native_validation` 的絕對路徑與摘要，以及按 recipe output name 對應的
`packs: {name: {path, uuid}}`。來源須為乾淨 canonical extension，recipe 必須
已提交。`extension_validation` 必須指向同一份實際原生保存／功能證據；
四個完整輸出都要與該次原生測試收據相同，缺少或不同證據時拒絕組裝。

此模式不與保留舊 source、部署 hold、preserved reconciliation 或 additions
併用。家族組裝器記錄原樣的 preserved ownership，另記 recipe／Native 來源；
cache 重驗全部輸入及證據。整套 static、BDS、fresh saved-world、備份與
family_guard 仍須完成，真人驗收狀態仍保留 pending。

原生證據的實測提交保持原樣。現行 source HEAD 不同時，僅允許它是實測提交的
後代，且**完整 Git tree 完全相同**；只看 runtime 版本或輸出 hash 相同仍拒絕。
准入記錄分別保存現行提交、實測提交及兩個 tree OID，不重寫原證據冒充新測試。

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

### 保留並審查另一項正在進行的修復

既有 preserved pack 與旧收據不同時，仍拒絕漂移。`preserved_reconciliation` 可引用
Git 外的獨立審查證據，目前僅支援既有 AMW 2.4.18→2.4.19 的果汁桶、小麥配方／
指引及配對 manifest。必須保留完整原始與目前 bytes 於乾淨 private Git；原始 tree
逐檔等於不可變舊收據，目前 tree 逐檔等於 observed inventory，每條差異記錄原因。
還需該完整候選在原生 BDS 首次與重啟的果汁堆疊、配方、六級成品測試，且不得
以 probe 修改被審查的 AMW bytes。未找到原始編輯者時，來源記錄必須明說。

此審查只讓新候選保留已核對的變更；不改舊政策、收據或驗收結果，也不能用來
引入自有包 gameplay、別的 preserved pack、額外檔案或身份遷移。完整家族准入、
新停服備份和存檔演練仍必須完成。整合包僅允許與此已審查 pair 精確同步相依。
翻譯審查的 `canonical_preserved_commit` 只引用 separately validated integration
的精確 history preimage，保留已觀察內容；後續 canonical 功能變更另外通過
`extension_validation` 的全檔與原生功能驗證，不能偽裝成翻譯修補。
# Reviewing an unrelated pack already added to live

`preserved_additions` may name a schema-1 JSON review with `source_provenance`,
`review_reason`, the exact `observed_inventory` and a `packs` map keyed by each
new UUID. Every entry records a review `reason` and the original single-pack
`artifact` (`path`, `sha256`). This is an explicit source review for assembly,
not approval of the old stack. The tool requires the observed pack to match
every original archive file, retains all previous identities and their relative
order, and still rejects existing gameplay drift. Managed UUIDs cannot use it.
Archives and review inputs are frozen at the build boundary. The new complete
candidate must pass normal static, native, fresh stopped-world and guard gates;
the original policy and live files remain unchanged until authorized deployment.

## 其他自有包的完成門檻

來源更新與部署可分開：`upstream.lock.json`的owned保留最新已審查來源，例如Grilling2.8.73；`deployment_holds`明列使用者完成門檻文件、已合併canonical commit、舊版／tree及candidate版。需要保留時，設定`held_sources: ["grilling"]`，該sources路徑使用指定commit的乾淨隔離Git checkout，不回退canonical main。此功能不能用來安裝歷史artifact、改玩法或自動降級。

source_state核對宣告／committed門檻文件、held版本／trees／commit、正確canonical remote及main ancestry。完整家族仍由family_bundle組裝，已保留BP/RP的版本及每個檔案必須等於本次live capture，任一側缺失、內容漂移、新UUID或版本不同都拒絕。CI驗證使用該已合併held來源的真實PR；static/BDS/fresh saved-world／准入／備份／回退／readback全部保留。候選收據明列held_revision，latest來源鎖不改成較舊來源。別包完成門檻不因本輪酒館／世界名酒修復而自動撤銷。

### Reuse unchanged Tavern gameplay CI after a family-only PR

When a new Tavern runtime has already passed its complete CI, a later family
lock/maintenance PR legitimately skips gameplay jobs. The current full source
still needs its own merged PR and successful `impact`/`baseline`; skipped jobs
are never relabelled as success. Local config may additionally declare
`runtime_ci_pull_requests: {"tavern": <merged runtime PR>}`.

The update entry records both actual GitHub check revisions separately. The
runtime merge must be an ancestor of current canonical source. Own runtime
Git trees, baseline and the impact classifier must be identical. Every later
path must be classified as family tooling/data or prose by the unchanged
classifier; runtime, fixture, general build or unknown inputs reject reuse.
All required gameplay checks must actually succeed on the retained runtime
revision. Current metadata checks cannot be satisfied by those older results.
The conservation proof is rechecked when cached evidence is used. Other public
sources retain the existing exact-tree CI rule. Full family static/native,
fresh stopped backup/saved-world and admission/readback gates remain required.

Historical approved-runtime retention validates reused CI against the immutable
admitted rows already bound by checked receipt references, rather than the
next deployment's configuration. Conservation reads that retained source's
Git baseline. Current evidence separately records its configured runtime CI
references and refuses cached references from a different configuration.
