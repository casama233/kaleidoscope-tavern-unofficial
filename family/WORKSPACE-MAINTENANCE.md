# 工作區與部署資料整理

先部署最新已合併並通過檢查的完整家族，再清理已結束的副本。
來源、遊戲存檔與可重建測試產物各自保留明確入口；不以清理修改遊戲內容或驗收狀態。

## 固定入口

- 每庫只保留一個 canonical main，加最多一個實際活動的開發 worktree；不按歷史修復線永久保留 checkout。
- 一份本機當前工作索引指向 LIVE 收據、目前工作、未完成差距與下一步；不要複製歷史時間線。
- 一份本機部署設定指標指向本次不可變設定，使用 `tools/family_update.py`。每次有新 runtime 才建立新的輸出目錄。
- 新部署資料集中於現有證據根目錄的 `runs/<日期-配套版本>/`；舊證據保持原路徑，避免破壞引用。
- 設定、認證介面、私有來源、存檔及機器日誌留在本機；公開 Git 只保存可公開的工具、規則及修補。

## 每轮順序

1. 核對當前索引、遠端 main、dirty／未合併工作及作者狀態；保留唯一修改，不覆蓋其他修補。
2. 完成相關修補、同步版本與相依，再走 PR／必要 CI／合併。家族鎖須與實際三庫來源一致。
3. 凍結來源與本次設定；以 canonical `family_update.py update --execute` 組裝、准入與部署。
4. 重用同一不可變候選的成功 CI／BDS 證據；真正的新輸出仍要求完整家族與本次停服一致備份／存檔演練。
5. 部署後更新當前入口；保持 `client=false`、`production_ready=false`，直到有真人驗收。
6. 按下列保留規則退役副本；不為清理建立另一份封存。

## 清理邊界

依使用者2026-10-11要求，保留正式世界、最新一份完整一致回退、canonical Git、作者原包、活動工作與唯一未合併差異、現行政策及其傳遞引用的證據。

已完成部署的舊候選、QA DB／packs及多餘回退，先用 `cleanup-copies` 產生計畫，再用 `--execute` 執行。沿用 maintenance lock、host process namespace、掛載／symlink 拒絕、政策引用與保留副本核對；不得另寫通用刪除器绕過家族保護。

已合併且乾淨的開發 checkout 可退役，但先核對 canonical／遠端已保留其提交、沒有程序使用、沒有現行來源或證據引用、沒有外部 worktree 依賴。待審或已結束的唯一差異先整理為可核對的 Git commit／branch，確認已保存至正確公開或私有遠端，再核對 tree／diff 與來源引用後退役 checkout；原 branch／commit 保留。dirty 尚未保存或仍有實際來源／驗證引用時保留現場，先完成 checkpoint 或把依賴改為精確來源提交／小型驗證證據，不強制刪除。不能把私有來源或憑證推到公開遠端。

非部署的舊開發測試副本必須逐項辨認用途。只清理已結束、可重建、沒有活動程序或現行引用的生成內容，保留原始來源及診斷日誌／JSON。不得把正式世界、原包或未知目錄加入批次刪除。

已完成且沒有目前引用的 QA，可另用 `cleanup-engine-inputs` 退役可重建的 BDS 執行檔與固定原版輸入目錄。此入口同樣先計畫、再 `--execute`，沿用 canonical lock／host namespace／證據引用；有部署收據的目錄必須先由 `cleanup-copies` 完整退役。最新一份回退、失敗／未結束、沒有正面正常結束報告或仍被引用的引擎不在範圍內。保留世界與 observer 腳本、JSON／日誌，退役引擎不得重啟，重驗建立新目錄。

清理記錄只保存被刪路徑、原因、保留依據與回收空間，不為刪除產物複製完整內容。每小時清理仍走同一 canonical 入口；出現失敗保留現場，不能讓清理中止健康 LIVE。

使用者2026-10-11另要求退役已結束、被後續修補取代的失敗診斷QA，避免其生成資料永久堆積。
這是持續清理授權：修補已完成或後續版本已取代、且核實無current／active／source引用時，
可立即明列退役並清理生成內容；不因failure永久保留全部副本，也不逐項重問使用者刪除許可。
同一 `cleanup-engine-inputs` 入口可傳 `--retire-diagnostics /local/retired-diagnostics.json`。
清單留在Git外，格式為 `{"schema":1,"engines":[{"engine":"/absolute/old-qa-engine","reason":"已人工核實結束及退役的具體理由"}]}`；
不支持glob或整個任務目錄。本機命令先產生計畫，核對精確清单後才加 `--execute`。
有清單時只處理明列的非部署QA，不掃描或重驗其他部署；沒有清單時仍要求成功正常結束報告。

明列退役可保留失敗或缺報告的原狀，只移除實際複製的引擎執行檔、測試世界的生成LevelDB檔，
以及BP structures／RP textures和sounds內的常規二進位資產。
保留DB診斷LOG、observer／scripts、JSON、模型、來源與原始報告／日誌，不刪整個世界或包。
退休標記另列人工理由及原報告狀態，不將failed改成success。
正式世界、最新回退、current config／policy／lease引用、任何Git祖先、掛載、symlink與活動程序仍拒絕；
明列清單不能退役任何有部署祖先的QA。沿用maintenance lock和host process namespace，
清單、報告及生成檔案stat在刪除邊界重新核對，不重跑遊戲或全盤hash。

同一次清理可沿用已解析的引用集合；每個刪除邊界仍核對所有JSON/config的full stat／ctime，
以及source／reference的存在、inode／mode、解析結果和完整symlink鏈身份。
正式世界正常autosave不改路徑身份時不失效；JSON內容、路徑身份或解析改變則拒絕並重新計畫。
cache只存在本次呼叫內；lease、host namespace、掛載、活動程序（含argv）、目標資料仍逐次檢查。

失敗診斷的生成檔以 `selected_files` 精確集合在同一worlds／包目錄scope內批次處理，
每scope只做一次完整metadata及活動程序／引用／掛載邊界；逐leaf仍核stat／ctime，
用不跟隨symlink的directory descriptor檢查父層namespace與Git再unlink。
只記實際unlink的leaf，保留JSON／JS／LOG與群組目錄；中斷保持retiring，重新計畫只選剩餘生成檔，
前次成功移除紀錄另留 `previous_removed`。明列退休不代表正常QA，`qa_closed=false`及原失敗狀態保留。

同次清理的共用hardlink以記憶體內inode ledger處理，原計畫metadata不刷新。
每leaf以不跟隨symlink的fd核對既定身份／ctime／nlink；unlink後保持dev／inode／size／mtime／mode／uid／gid，
且nlink恰減1，才登記精確原→後ctime／nlink鏈。群組和後續leaf只接受此鏈到目前身份的轉換，
不忽略ctime、不重hash；最後alias移除後不再保留該ledger項。實際unlink立即記錄，事後核對失敗也不漏記。
外部metadata變更保留該engine剩餘輸入與retiring標記並繼續其他項；來源／Git／掛載／活動／引用異常仍中止。
fd前後stat沿用既有競態邊界，不宣稱核心提供因果證明；實際空間回收以disk delta確認，不累加hardlink路徑大小。

## 避免重複工作

本機只診斷具體失敗；完整套件交必要 CI。版本／檔案完整性核對是部署前提，不是玩法或畫面證據。沒有內容變更就不升包、不建立 QA 世界、不重啟 LIVE；工作區或文件整理只審閱差異。

QA共用的引擎symlink不刪、不遍歷。已完成且未引用QA的RP複製textures／sounds目錄，以及BP structures內僅含.mcstructure的資產目錄，只有所有檔案都逐檔等於目前已准入候選相同side／UUID的保留資產才可退役；不匹配的直接檔案保留，子目錄各自比對。structures內的JSON與其他非.mcstructure檔案、世界DB、observer與其他腳本、manifest、模型、特殊診斷資產及日誌仍保留。比較證據只在同一次不可變清理階段、完整檔案stat相同時重用，不重複掃描未變來源。


## 明列已被取代的失敗部署輸出

`cleanup-copies --retire-outputs /local/retired-outputs.json` 只處理人工明列的舊輸出，
格式為 `{"schema":1,"outputs":[{"output":"/absolute/old-output","reason":"已結束且被目前版本取代的具體理由","targets":["release-candidate/resource_packs","production-snapshot"]}]}`。
清單必須在 Git 外；不接受 glob、整個任務目錄或任意相對路徑。
允許的目標仍是既有 COPIES／BACKUPS，加明列 exact-engine／saved-world-engine 的複製引擎執行檔。
正式存檔、production-before、production-original-db、Git／來源、原始 report JSON／日誌與 observer 不在目標範圍。
QA db 目標只刪生成 LevelDB 葉檔，保留診斷 LOG／JSON；QA pack 僅刪既有生成二進位 selector，保留 JS／JSON／模型／observer。
RC 只退原 family receipt 登記的普通複本，未知額外檔保留；舊 BACKUPS 可退全部生成副本內容。
完整相對檔名／stat／ctime 與 directory namespace 在刪除邊界重核，沿用 inode ledger 處理自己的 hardlink unlink；空目錄可保留。
共用引擎 symlink 拒絕而不遍歷。

這個 opt-in 不要求已缺失或不一致的歷史 snapshot 假裝完整，也不將原 failed 收據改成 success。
必須仍有原 deployment／build 記錄；只有完整 pack／逐檔 hash／來源及 order 綁定的原 RC build receipt 時，僅可退 RC packs，不能退 QA／引擎／BACKUPS。
綁清單和原報告 metadata、精確目標身份；
最新一份成功部署及完整 snapshot／rollback 仍按既有收據完整性邊界核對一次。
current config／policy／來源／驗證傳遞引用、maintenance lock、host namespace、活動程序／argv、
掛載、symlink／Git 和每次刪除邊界檢查保持；變更則拒絕重用計畫。
只有明列的歷史 client_failure_reports／client_hud_observations 作保存 leaf，
不把其過去修復 deployment 所引用的舊 rollback 當現行依賴；同一 leaf 若也被當前證據引用，仍完整遞迴保護。
正常 cleanup-copies 的成功部署保留規則不變。此工具／文件更新不升包、不建立候選、不重啟 LIVE。

明列退役的 CLI 乾跑只回傳標記為不可執行計畫的摘要；完整檔案 metadata 留在同次執行記憶體，結果只保存 scope／數量／配置量／binding 與實際刪除葉檔，避免重複巨型清單。
