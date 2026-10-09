# 板面 multiline 真人診斷候選

這是可產生、可拆除的 **UI 診斷 overlay**，不是已完成的板面修復。未經真人 client 驗證，`client_tested=false`、`production_ready=false`。它不改 Tavern runtime、版本、freeze、workflow 或世界板面資料，不產生沿用正式 Tavern 身份的不同 bytes。

原作 `TextScreen.java` 使用 `MultiLineEditBox`，可直接編輯換行。現行 Bedrock 板面仍透過單行 ModalFormData 與 `encodeBoardInput`／`decodeBoardInput` 輸入跳脫字元。Script UI 2.0.0 的 textField options 只有 `defaultValue` 和 `tooltip`；原生 JSON UI 卻有 multiline primitive。此候選要辨別「把該 primitive 接進同一 server-form factory」是否真的能安全回傳原始文字，不把存在 primitive 誤當接線已驗收。

## 產生與移除

從 repository 根目錄執行，指定**尚不存在、位於 repository 外**的輸出目錄：

```sh
python tools/client-parity/generate_board_probe.py --output /absolute/new/kt-board-client-probe
```

工具只讀 canonical `server_form.json`、既有 Mojang fixture 與八個 guide PNG，使用 Python 標準函式庫。輸出自包含的 `BP/`、`RP/`、這份說明及未填寫的 `results.json`。每次產生均分配新的 diagnostic UUID，版本為 `[0,0,1]`；拒絕覆寫既有目錄。沒有 release builder、封裝、BDS 啟動或自動安裝步驟。

把輸出的 BP、RP 分別放入測試 client 的 development behavior/resource packs，僅在可拋棄測試世界啟用這一對。需要 Minecraft 1.26.50 對應的穩定 `@minecraft/server` 2.7.0、`@minecraft/server-ui` 2.0.0。此診斷不需要額外 addon 或 Tavern；若做共存測試，把診斷 RP 排在 Tavern RP 上方並記錄所有包的順序。不要安裝到 LIVE。關閉測試世界後移除這對診斷包即可撤回。每次換輸出先移除前一對，避免多個診斷腳本回應同一事件。

## 已有來源證據與仍待判別的接線

所有原生 UI 參照固定於 Mojang/bedrock-samples `46ba6ea985fb5a92d79a9419198f10dda14c199d`（1.26.50.4），不是滾動的 main：

| 接點 | 原始來源 | 候選怎麼使用 |
| --- | --- | --- |
| 單一 factory、原生 submit、`custom_form` input collection | [server_form.json](https://github.com/Mojang/bedrock-samples/blob/46ba6ea985fb5a92d79a9419198f10dda14c199d/resource_pack/ui/server_form.json) 的 `generated_contents`、`custom_form_scrolling_content`、`custom_input` | 不覆寫 factory、form root、submit 或 dropdown；複製原 `custom_input` 參數，僅改 `$control_name`。 |
| 原生 template hook | [settings_common.json](https://github.com/Mojang/bedrock-samples/blob/46ba6ea985fb5a92d79a9419198f10dda14c199d/resource_pack/ui/settings_sections/settings_common.json) 的 `option_text_edit` 與 `option_generic_core` | 原 `$control_name@$control_name` 插槽接四個互斥 sibling。foreign 分支仍繼承原 `option_text_edit_control`。 |
| 多行按鍵、scroll、enabled/focus、可見時文字 binding | [ui_common.json](https://github.com/Mojang/bedrock-samples/blob/46ba6ea985fb5a92d79a9419198f10dda14c199d/resource_pack/ui/ui_common.json) 的 `text_edit_box`、`text_edit_box_label`、`scrollable_multiline_text_edit_box` | 使用原 multiline primitive 與按鍵；保留原 binding 陣列再追加 guards。文字 binding 使用原生 `visible` condition。 |
| collection 上的 multiline 實例 | [book_screen.json](https://github.com/Mojang/bedrock-samples/blob/46ba6ea985fb5a92d79a9419198f10dda14c199d/resource_pack/ui/book_screen.json) 的 `page_text_edit` | 支持 multiline 與 collection 可組合，不證明 server-form controller 也完全相同。 |
| 同 textbox name 的 normal/maximized 控制及啟用互斥 | [command_block_screen.json](https://github.com/Mojang/bedrock-samples/blob/46ba6ea985fb5a92d79a9419198f10dda14c199d/resource_pack/ui/command_block_screen.json) | 提供互斥 sibling 的原始模式。該原生 controller 有自己的 focus 邏輯，不能直接當成 server-form 的驗收。 |
| textField options 沒有 multiline 選項 | [server-ui 2.0.0 metadata](https://github.com/Mojang/bedrock-samples/blob/46ba6ea985fb5a92d79a9419198f10dda14c199d/metadata/script_modules/%40minecraft/server-ui-bindings_2.0.0.json) | 診斷不傳入虛構 API 參數。 |

**真正待驗證的是原生 server-form controller：** 它是否容許同 collection slot／`text_box_name=custom_input` 的四個 sibling，只由可見、啟用、有焦點資格的那一個讀寫。此候選沒有證據可宣稱「隱藏 sibling 絕不回寫」，也不把 UI JSON 解析成功當成可用。若 Enter 提交整張表單、文字不回傳、hidden sibling 覆蓋、焦點不正確，記錄失敗，不能直接推進 production。

選取條件為**完整 title 和 field label 同時吻合**，不是字串包含。三個 owned 分支各有 `max_length` 320／350／1500，120px 高；foreign 分支沿用原生長度與單行按鍵。四分支均互斥 `visible`／`enabled`／`focus_enabled`，並沿用 native `visible` 文字 binding。這不是動態 `enabled_newline` 或動態 template 名稱的猜測接線。既有四個 guide flipbook 控制及圖片原樣複製，不改動畫、foreign image 分支或 guide 導航。

## 真人人機測試

啟用 client content log。由**真人玩家自己**輸入以下指令；console/command block 不會開表單。腳本只延後 10 ticks 讓聊天欄關閉，不會自動重試。若出現 UserBusy，關閉其他 UI 後手動重試。

```text
/scriptevent kt_client_parity:board sandwich raw
/scriptevent kt_client_parity:board small raw
/scriptevent kt_client_parity:board large raw
/scriptevent kt_client_parity:board foreign raw
/scriptevent kt_client_parity:board near_marker raw
/scriptevent kt_client_parity:board wrong_field raw
/scriptevent kt_client_parity:board guide
```

1. **輸入與回傳。** 先不修改直接 submit：owned raw seed 含一個真正換行、一個字面 `\n`、一個獨立反斜線及中文，應完整 round-trip。再輸入兩行、清空、貼上多行、用中文 IME、選取／剪下／貼上、移動 caret。按 Enter 應新增換行而非提交。此腳本**不呼叫任何 encode/decode**；log 的 JSON 顯示 `\n` 代表原始換行、`\\n` 代表字面反斜線+n，兩者不可混為一談。
2. **隱藏分支及索引。** 改文字後先操作兩個 dropdown，回到文字框，再 submit。回傳應恰好 `[text, horizontalIndex, verticalIndex]`，保留 index 0／1／2。水平依序 left／center／right／justify／distributed，垂直 top／middle／bottom；預設 index 為 3、2。逐個切換並核對 log。反覆交替開 owned／foreign／owned，驗證沒有隱藏 sibling 覆寫、前次文字殘留、額外 Tab 焦點或重複回傳欄位。
3. **容量。** 把 `raw` 依次換成 `101`、`limit`、`over`，對三種板各測一次。`101` 用來發現原生預設 100 字上限殘留；`limit` 分別建立 320／350／1500 個 ASCII 字元，尾端有 `END12345` 便於查看；`over` 多一字。先原樣 submit，再手動嘗試插入／刪除一字。記錄「default 如何顯示／回傳」與「編輯是否阻擋超限」兩種現象，不能因顯示部分文字便判斷底層被截斷。這裡用 ASCII 隔離 UI 長度限制；另記錄中文／emoji 的 UTF-16 計數行為。
4. **foreign 與取消。** `foreign`／`near_marker`（title 不吻合）／`wrong_field`（title 相同、field 不吻合）均應呈現原生單行控制。停用診斷 RP 在另一輪測試作 native 對照，記錄 foreign raw seed 的原始行為，不要求 native 單行能保留換行。Escape／Back／Cancel 不應產生提交值。取消本身也會寫一筆明確標為 canceled 的診斷 log。
5. **平台與 layout。** 分別在 keyboard/mouse、touch、gamepad 檢查聚焦、虛擬鍵盤換行、scroll、caret 可見及按鍵退出；縮放／調 UI scale／改視窗大小時記錄未提交文字是否保留。沒有測到的平台填 `not_tested`，不可以 desktop 代替。小螢幕同時出現外層 form scroll 與內層文字 scroll 的操作也需實測。
6. **guide 與共存。** `guide` 的四個 icon 應仍動畫，最後 apple 是普通 foreign image。再開實際 Tavern guide 與其他包的 Modal/Action forms，檢查按鈕／圖片／文字／焦點。這個 probe ActionForm 只測圖片路由，不取代七入口 guide 的真人完整導航驗收。

輸出以 `[KT_CLIENT_PARITY]` 開頭，包含完整 `seed`、`values`、UTF-16 長度、raw newline 與 literal backslash-n 數量，寫到明確診斷訊息與 content log。這些是回傳資料，不是渲染／操作驗收，也沒有 board-save、玩家物品或世界資料副作用。請只輸入測試文字；長資料以 content log 原文為準，chat 顯示可能被 client 截短。每輪把 log、影片或截圖路徑與平台資訊填入輸出的 `results.json`；null 表示尚未驗證，不能自動填成 true。

## 升為正式 adapter 的門檻

只有上述回傳、隱藏分支、foreign 共存與輸入裝置場景有真人證據，才在**新 release** 討論整合。最小 production 範圍預期為 `tools/build_tavern_forms.py`／其既有回歸、生成的 RP UI，以及 `writing-boards.js` 的 scoped marker 和 raw default/result 分流；現有持久化已是 raw text，不應對既存板面重跑 decode。需保留 stale data／reach／wax／identity 等提交前驗證、原 limit/layout 檢查及兩種 alignment 延伸。若 sibling/controller 路徑失败，不能只放寬靜態檢查後發布。

此 probe 沒有驗證正式板面保存、伺服器重啟、多人並行 stale-editor 防護、Java 256×120 layout 逐像素一致性或跨包任意 UI controller。也不包含 Camera probe。

## 聚焦的靜態檢查

```sh
python tools/client-parity/test_board_probe.py
```

它只檢查全新隔離輸出／拒絕覆寫、身份隔離、canonical UI 與 guide bytes 保留、native template contract 及生成 JS 語法。不啟動 client/BDS，不跑 release suite，不聲稱 multiline 已可用。
