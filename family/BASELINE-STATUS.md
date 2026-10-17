# 家族現行基線與修復主線

更新：**2026-10-17，香港時間**。本頁是三個移植倉庫的共用現況入口；按玩家行為追蹤工作，各庫矩陣保留具體來源與場景。本次以三個代理分別核對 Tavern、Grilling、World Liquor，再交叉核對主分支、正式 release、仍開放的 PR／Issue 及既有驗收紀錄。這是 GitHub 來源與文件核查，未重新連線 LIVE、啟動 BDS、操作 Blockbench 或進行真人驗收。

**目前公開來源為 T173／G150／W151；公開下載為 T170／G149／W148；倉庫最後記錄直接核驗的部署為 T169／G144／W147／private-integration。完整 Java 一比一與現行全物品客戶端驗收均未完成。**

## 1. 來源、公開下載與部署

以下 SHA 固定本次核對的來源，後续只改文件的提交不新增遊戲版本。

| 模組 | 已合併的維護來源 | 公開 release／UTC 發布時間 | 倉庫最後記錄的部署 |
| --- | --- | --- | --- |
| Tavern | **0.6.173**；[115942e5](https://github.com/casama233/kaleidoscope-tavern-unofficial/commit/115942e55e9946cfd257fbcdc41c849f75b77509) | [v0.6.170](https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/tag/v0.6.170)；2026-10-16 14:23:44 | **0.6.169** |
| Grilling | **2.8.150**；[2422c2ab](https://github.com/casama233/kaleidoscope-grilling-unofficial/commit/2422c2ab217aadc0d4ca56b6fd560ad9ed233a1f) | [A2.8.149](https://github.com/casama233/kaleidoscope-grilling-unofficial/releases/tag/A2.8.149)；2026-10-16 14:51:47 | **2.8.144** |
| World Liquor | **0.1.151**；[b8692380](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/commit/b86923801febbf23a43f36017ad299b28128b029) | [v0.1.148](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/releases/tag/v0.1.148)；2026-10-16 14:53:37 | **0.1.147** |

- 正式 release 的來源依次為 T `3bd8f6ca285b5ef5f6e9abe962d12873dfae5752`、G `aa7431f9ea729338f75f134a9c9be8194298b968`、W `978c2594040555a668e842f3452d98a07973db34`。三者實際 release API 均為 `draft=false`、`prerelease=false`，本次 `releases/latest` 也回讀這三版；歷史「non-latest」請求文字不代替 API 現況。
- **公開下載配對**：W148 使用 T170；G149 公開包依賴 Cookery **1.6.0**。
- **目前來源配對**：W151 使用 T173；G150 適配 Cookery **1.6.1**／family API **0.2.11**。新舊 Cookery UUID 不可互換。版本／相依分別由各庫 `baseline.json`、manifests、[家族鎖](upstream.lock.json)及 W 的 [CI 配對鎖](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/blob/b86923801febbf23a43f36017ad299b28128b029/.github/baseline-integration.json)決定。
- G150 與 W151 的 [G 發版請求](https://github.com/casama233/kaleidoscope-grilling-unofficial/blob/2422c2ab217aadc0d4ca56b6fd560ad9ed233a1f/.github/release-request.json)／[W 發版請求](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/blob/b86923801febbf23a43f36017ad299b28128b029/.github/release-request.json)均為 `publication_request=false`。W 的 [Publish run 38930909636](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/actions/runs/38930909636)是 authorization 成功、publish 跳過；不能從 workflow 綠勾推定已發版。
- 三個固定主分支均有成功的既有來源 CI：[T 39011686331](https://github.com/casama233/kaleidoscope-tavern-unofficial/actions/runs/39011686331)、[G 38933508247](https://github.com/casama233/kaleidoscope-grilling-unofficial/actions/runs/38933508247)、[W 38930909505](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/actions/runs/38930909505)。每份證據保留實際 checkout／tree／job 範圍。

### 部署紀錄的邊界

[整理前的家族紀錄](https://github.com/casama233/kaleidoscope-tavern-unofficial/blob/115942e55e9946cfd257fbcdc41c849f75b77509/family/BASELINE-STATUS.md)頂段記錄：該工作批開始時直接核驗到的LIVE，是於 **2026-10-15 22:40:27 HKT部署** 的T169／G144／W147／private-integration，共42包；reviewed receipt SHA256 為 `c563149cea7e4413e67da2a37777ed583aa1ed0d739b3160b7e9130bc9f91bd3`。這是倉庫的最後已記錄核驗，本次沒有直接確認服務器此刻狀態。舊 T166、T167 段落與各自收據都是歷史證據。

T173／G150／W151 的 stable-author 來源已合併，完整家族同批次的存檔／准入／部署證據仍需接續。私有配套不能只改一個版本標籤便視為完成：[穩定作者原範圍](../docs/STABLE-FAMILY-20261016.md)以private-integration起步，後來有 P46／private-integration／private-integration 的有限修補；最新 [T PR397](https://github.com/casama233/kaleidoscope-tavern-unofficial/pull/397)只合併 P49 搪瓷盆蓋 consumer，明確沒有接觸 production host、保存世界或 client。其 T／W 隔離 native 回歸不能代替這項 Cookery 修補的整套驗收。完整私有來源及收據繼續在私有維護入口管理，不複製到公開 Git。

## 2. 完成度的統一記法

每項工作同時記錄**交付位置**與**還原證據**，不用 PR 數、通過測試數或模組版本推算百分比。

| 欄位 | 可以證明甚麼 | 完成條件 |
| --- | --- | --- |
| 來源已實作／仍有差距 | 當前 canonical 程式與指定 Java 分支的具體行為 | 指定 source commit、行為差異與可分辨的案例；檢查後續主線仍保留該修補 |
| PR／CI 已合併 | 該提交完成來源整合與所要求的檢查 | 實際 merged SHA、必要 jobs 及適用來源一致 |
| 已公開發布 | 指定 tag／archive 可取得 | 實際 release／資產與來源身份核對；Stable 是發布通道 |
| 家族已部署 | 某時刻整套 BP／RP、順序及存檔已核對 | 同一批次 receipt、存檔 first／restart、准入與部署後讀回 |
| 編輯器已檢視 | 指定資產、路由、姿態在 Blockbench 中的觀察 | 逐項 ID／材質／視圖／狀態及結果；preview adapter 的差異明列 |
| 真人已接受 | 該候選在指定裝置的實際操作、聲畫與完整流程 | 準確版本／配套／場景、結果與錄影或明確回饋；舊失敗和未測項各自保留 |

全家族目前繼續 `client=false`、`production_ready=false`、`pending_client_acceptance`。既有有限正向觀察仍有效於原候選及場景。

**保留使用者已作的決定**：2026-10-16 的 T170／G149／W148 穩定通道發布允許使用來源、有限編輯器、完整所需 CI 與精確包證據，不等待額外真人 gate；本次整理不修改該發布授權。完整一比一的聲畫結論仍須實際證據，後續家族部署沿用現行 [更新流程](UPDATE-WORKFLOW.md)。

## 3. 收斂後的修復線

同一行為只使用一條主線；「待驗收」表示已有來源修補且仍欠結果，不能改寫成當前已重現同一個舊 bug。下表的優先序用於接續工作，沒有授權本次文件整理另作 runtime 修改。

| 優先序／主線 | 現行狀態 | 下一個可驗收結果／原追蹤入口 |
| --- | --- | --- |
| **P0：來源與完整家族配套** | T173／G150／W151 已合併；公開下載和最後部署各有不同身份；新作者適配已進來源，整套 gate 未閉合 | 固定同一批公開／私有來源、Cookery1.6.1及其餘作者 UUID／API／state，補足同批保存／准入／讀回。沿用本頁與既有家族工具 |
| **P1：全部物品顯示／動作** | T160 動態 sprite 側面、T170 副手算式、G145–G149 動作及 W110 四杯來源修補已承接；全物品最新 Blockbench 檢查仍欠完整覆蓋 | 每個 item ID 的第一人稱、側面 UV／透明、主副手、動作與必要其他 contexts 都有結果；T [#288](https://github.com/casama233/kaleidoscope-tavern-unofficial/issues/288)，G／W 各庫矩陣共同接續 |
| **P1：物品交易守恆** | G [PR214](https://github.com/casama233/kaleidoscope-grilling-unofficial/pull/214)的餐盤回滾 ownership／未知出料、花椒採果確認仍有未吸收差異 | 從 G150 後的新候選承接窄修；外來物品不被舊快照覆蓋，未知交付不重複退款／採收，保持既有保存與隔離。舊 draft 不直接合併或沿用版本 |
| **P1：雪克杯／進食 HUD 與手感** | T165位置、T166快取、T167插值、T169圖形過期及 G141首幀／G143 owning-player 已有來源修補 | 同一雪克杯快開／取消／換槽／完成取出，串進食／取消／結算；同步看位置、尾幀、聲音與實際延遲。跨維度／長 title 共存另由 T [#285](https://github.com/casama233/kaleidoscope-tavern-unofficial/issues/285)追蹤 |
| **P1：料理與同瓶完整流程** | 穿串、四翻、調料 bottle lifecycle、放置／手持盤都有多輪實作；最新整條真人流程未閉合 | 正常取得食材 → 牛肉塊／紅辣椒／牛肉塊穿串 → 上油／四翻 → 同瓶三料、PENDING、80 ticks搖勻、SPECIAL撒料 → 取出食用／取消 → 保存重載。G [#168](https://github.com/casama233/kaleidoscope-grilling-unofficial/issues/168)、[#181](https://github.com/casama233/kaleidoscope-grilling-unofficial/issues/181)、[#182](https://github.com/casama233/kaleidoscope-grilling-unofficial/issues/182) |
| **P2：仍缺的庫存投影與容器細節** | 任意三槽秘製串每 stack inventory icon仍缺；W布丁餘碗 routing仍有來源差距；儲存、家具、唱片已有局部來源修補 | G [#166](https://github.com/casama233/kaleidoscope-grilling-unofficial/issues/166)按保存食材／生熟／variant顯示原生背包及快捷欄；W布丁分最後一份／多份／Creative核對碗的去向；四朝向櫃架、唱片掉落／音訊、中鍵與破壞粒子由原矩陣驗收 |
| **P2：原生酒效與視覺差距** | reach、target clear、step height、XP、through-wall outlines、純roll、W Luck／Elbow／CaptainGift等仍有實作或平台差距 | T [#98](https://github.com/casama233/kaleidoscope-tavern-unofficial/issues/98)總索引、Tipsy [#286](https://github.com/casama233/kaleidoscope-tavern-unofficial/issues/286)、RGB [#287](https://github.com/casama233/kaleidoscope-tavern-unofficial/issues/287)及 W矩陣各持有一個行為責任；分開未實作、適配與待真人驗收 |
| **明列保留：W Treasure Guide生物掉落** | W151與W148的 `effects.js` 相同；近處新item推定死亡drops及重疊回呼放大缺陷仍在；使用者已選擇暫時保留 | 維持已知保留，不自動刪除／修復或聲稱安全。日後啟動修復時才驗證同tick兩mob、旁邊玩家丟物、回呼去重及本次死亡cohort。方塊loot reroll是另一條已修來源 |
| **P3：新 Java 分支適配** | 維護中的1.20.1／1.21.1與26.1.2分開；W26 custom Luck／BlockDrops／registration仍未完整適配 | 依每Minecraft／loader的原作差異接續；既有 obsidian／milk／height修補不重開。見 [26分支審查](world-liquor-26.1.2-1.1.6-review.json) |

原模組細節：
[Tavern差距](../docs/PARITY-MATRIX.md)／[玩家回饋](../docs/BUGS.md)；
[Grilling差距](https://github.com/casama233/kaleidoscope-grilling-unofficial/blob/main/docs/PARITY-MATRIX.md)／[場景](https://github.com/casama233/kaleidoscope-grilling-unofficial/blob/main/docs/BUGS.md)；
[World Liquor差距](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/blob/main/docs/PARITY-MATRIX.md)／[場景](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/blob/main/docs/BUGS.md)。

## 4. 全物品 Blockbench 覆蓋欠帳

使用者要求的「全部物品第一人稱手持檢查」仍未交付完整當前結果。本次來源盤點只提供建立清單的起點：

| 倉庫 | 目前來源盤點 | 可追溯的既有編輯器範圍 |
| --- | --- | --- |
| Tavern T173 | 255份BP item定義；另有161份block定義。art-map的158個source item IDs＋2個template不是同一分母 | T170局部副手雪克杯算式；10/02曾開白色沙發；source contracts不等於全部GUI逐項檢查 |
| Grilling G150 | 249份BP item定義、151份attachable | G17舊107 attachables／214 captures已有後續client反例；最近G149只兩個代表瓶case／18 snapshots |
| World Liquor W151 | 157份BP item定義；current contract為27家具＋130 sprite routes | W48 freezer有手動FP／TP／GUI的有限檢視，明記all_views_individually_observed=false；不是157項當前覆蓋 |

盤點依據：[T item definitions](https://github.com/casama233/kaleidoscope-tavern-unofficial/tree/115942e55e9946cfd257fbcdc41c849f75b77509/runtime/BP/items)、[T art map](https://github.com/casama233/kaleidoscope-tavern-unofficial/blob/115942e55e9946cfd257fbcdc41c849f75b77509/art/interfaces/item-art-map.json)、[G item definitions](https://github.com/casama233/kaleidoscope-grilling-unofficial/tree/2422c2ab217aadc0d4ca56b6fd560ad9ed233a1f/projects/grilling/gameplay_core/behavior_pack/items)、[W render contract](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/blob/b86923801febbf23a43f36017ad299b28128b029/tools/item_render_contract.py)。

這些都是來源檔案／路由數，不能直接加成玩家獨立物品數或還原百分比。要先展開方塊物品、別名、同材質不同ID、動態內容及視圖，才有可驗收分母。W的舊156清單、G的舊107 attachable與T的158來源映射都不能代替當前總表。

每列至少記錄：**item ID、所屬包版本／SHA、Java模型與貼圖、Bedrock sprite／geometry路由、檢查視圖與動作狀態、Blockbench觀察、遊戲觀察、差異與修補PR**。共用模型可重用同一模型檢查，但每個ID的貼圖／路由綁定仍須覆核。先檢查已回報側面／近鏡／尾段／瓶層問題，再完成其餘全量；代表物品通過不關閉全量工作。

依既有 [動畫／物品顯示流程](MAINTENANCE.md#動畫物品顯示與手持修復)及 [Grilling流程](https://github.com/casama233/kaleidoscope-grilling-unofficial/blob/main/docs/ANIMATION-ITEM-REPAIR-WORKFLOW.md)；使用者要求停止的反覆HUD探針保持停止，收集正常操作中的可辨別結果。

## 5. 舊 PR 的實際承接

本次文件PR建立前，Tavern／World Liquor無開放功能PR；Grilling有以下4個draft。**開放數量不等於未實作功能數量**。

| G PR | 與G150來源核對 | 現行處置 |
| --- | --- | --- |
| [#214](https://github.com/casama233/kaleidoscope-grilling-unofficial/pull/214) | 餐盤完整signature ownership、未知結果停止早段退款、花椒清果／掉落確認仍不在main | 保留獨立修補審查；有新版本／canonical驗證前不可直接合併、發布或部署 |
| [#217](https://github.com/casama233/kaleidoscope-grilling-unofficial/pull/217) | grill及advanced-rack兩個runtime JSON與main相同；G150／#229已承接碰撞 | 主體已吸收；只審剩餘文檔／測試，收束到現有碰撞線 |
| [#220](https://github.com/casama233/kaleidoscope-grilling-unofficial/pull/220) | 20-ID THREE核心、player clip、20套helper幾何／貼圖已進後續composition；owner guards／offhand又有後續修補 | 主體已吸收；檢查殘餘唯一差異後收束，禁止整支舊G143覆寫新主線 |
| [#222](https://github.com/casama233/kaleidoscope-grilling-unofficial/pull/222) | 18個runtime檔中16個與main相同，其餘為舊manifest；動畫sprite與G150碰撞已承接 | 主體已吸收；審工具／文檔殘餘，不再作獨立G144遊戲候選 |

這是功能承接判定，沒有把未合併的PR改稱merged。保留原head／失敗／測試身份，尚未完成殘餘審閱前不自動關閉或刪分支。G66／G128 draft releases是歷史staging，W149／W150是已由W151接續的歷史候選，均不新增平行修復線。

## 6. 既有 Issue 的當前責任

| 入口 | 當前狀態與保留責任 |
| --- | --- |
| T [#285](https://github.com/casama233/kaleidoscope-tavern-unofficial/issues/285) | 現有HUD transports／自有 namespace已在；跨維度HUD重建的有限refresh與長title ownership／foreign writer完整共存仍需實作或驗證 |
| T [#286](https://github.com/casama233/kaleidoscope-tavern-unofficial/issues/286) | 純加法roll、保持準星／原生手臂仍未完成；yaw為明確opt-in，首次online時計anchor亦保留原問題 |
| T [#287](https://github.com/casama233/kaleidoscope-tavern-unofficial/issues/287) | source texel×cupRGB陰影與六幀路由已補；原生material、透明、遠距濾波／PBR及全contexts仍待驗收，舊平面overlay描述是歷史起點 |
| T [#288](https://github.com/casama233/kaleidoscope-tavern-unofficial/issues/288) | socket／clone／arm-Y／T160側邊／T170算式修補已承接；全物品BB、FP副手framing、掉落3D及完整contexts仍欠 |
| T [#98](https://github.com/casama233/kaleidoscope-tavern-unofficial/issues/98) | 保留native reach／target／step／XP／outline及其餘平台差距；Tipsy只連#286，不重複開一條 |
| G [#166](https://github.com/casama233/kaleidoscope-grilling-unofficial/issues/166) | 任意三槽每stack庫存投影仍缺；固定物品的五幀動畫不是此功能的完成證據 |
| G [#168](https://github.com/casama233/kaleidoscope-grilling-unofficial/issues/168) | 裝料／保存／G143等價比較／G148–149顯示已有實作；轉成目前同瓶80tick→撒料流程及畫面驗收 |
| G [#181](https://github.com/casama233/kaleidoscope-grilling-unofficial/issues/181) | G118放置盤renderer及後續special/slime內容已有實作；驗四朝向、1–5份、更新／重載／殘影 |
| G [#182](https://github.com/casama233/kaleidoscope-grilling-unofficial/issues/182) | G119手持盤、每手writer、獨立count及G146左臂已有實作；驗兩手混持、換槽、1–5份、secret-alt與實機解碼 |

World Liquor目前0個open issue；未完成工作仍在其矩陣與BUGS，不等於零差距。布丁餘碗另從W92歷史記錄提升到現行差距：current `main.js`仍統一inventory.addItem，原作 last-serving hand replacement與非空／Creative drop規則未對齊。來源：[W92](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/blob/b86923801febbf23a43f36017ad299b28128b029/docs/RELEASE-NOTES-0.1.92.md)、[current main.js](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/blob/b86923801febbf23a43f36017ad299b28128b029/runtime/BP/scripts/main.js)。

## 7. 應保留的修補與使用者選擇

- T160的動態手持sprite側邊與RGB texel修補、W普通／勁涼冰紅茶brown匹配及18配方來源修正、W110四杯mesh／UV、W147冰櫃material registry、掛唱片朝向／掉落保全，都已有來源修補；接續當前場景，不再當成完全未開發。
- G花椒樹有G72種苗／樹冠／果葉／重入的有限舊證據。當前新chunk自然生成、舊無葉殘桩與G150仍需場景確認；不能把舊「只有木頭」直接標成目前重現。
- 高階廚具架直接取放、無UI是使用者指定的適配；保留四工具與五調料格、普通／潛行操作及保存。詳見 [原作與適配邊界](https://github.com/casama233/kaleidoscope-grilling-unofficial/blob/2422c2ab217aadc0d4ca56b6fd560ad9ed233a1f/docs/RACK-DIRECT-INTERACTION.md)。Grilling六個料理分類、Tavern七個釀造入口各自保留，家族共用資料／導航不要求兩者分類數相同。
- 「只影響視覺、保持瞄準及原生手臂」仍是Tipsy的接受條件。現有yaw opt-in不視為純roll完成。
- 維護Java來源仍按 [java-upstream.json](java-upstream.json)逐Minecraft／loader分支追蹤。此次核對既有來源pin與倉庫證據，未重新核查CurseForge全部最新發布，不能把舊查核時間改成今天。版本或hash吻合不證明全部玩法相同。

## 8. 接續方式

1. 維護者先讀本頁，確定要改／要驗的是公開release、當前source還是倉庫記錄的已部署批次；只讀該行為所需的矩陣與原作來源。
2. 可平行分工：一人負責整套作者相依／保存准入，一人整理全物品顯示及動作，一人審查Grilling PR #214等未吸收交易差異。共同HUD、投影生成器與家族鎖指定單一整合者，禁止整份舊工作樹覆蓋。
3. 同一玩法的相依修補完成後再凍結一次新身份，沿用必要PR／CI與家族流程。純文件修改不升包、不建立遊戲候選、不重啟LIVE，也不新增測試。
4. 每次交付只更新本頁現況、所屬模組矩陣／Issue和一個具辨別力的場景結果；歷史證據保持原版本。未取得新證據的欄位保持待驗收。

### 歷史與文件權責

[本次整理前完整主索引](https://github.com/casama233/kaleidoscope-tavern-unofficial/blob/115942e55e9946cfd257fbcdc41c849f75b77509/family/BASELINE-STATUS.md)保留T166／T167等部署、原收據、失敗及上游查核時間；[PR歷史處置](../docs/audit/PR-DISPOSITIONS.md)保留舊來源承接。歷史頁的「當前／候選／已部署」只指原記錄時點。

**本頁只管全家族現况及修復順序；各庫PARITY-MATRIX管行為差距，BUGS管回報與重現，原Issue管未閉合工作，release notes／evidence管不可挪用的版本證據。**
