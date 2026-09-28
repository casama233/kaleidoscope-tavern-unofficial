# 森羅家族 × 酒館兼容性審查（2026-09-29）

## 結論與範圍

本輪取得九個基岩版模組：六份第三方公開發布包、三個自有倉庫的固定 canonical runtime；另用 Cookery 1.0.6 作歷史對照。掃描 13,963 個 runtime 檔案，並做原生 BDS 隔離測試。終界／地獄／酒館可以初始化，世界名酒成功 ACK，指南與廚房擴充也實際進入宿主登錄表。但整套不能標成全面兼容；來源缺陷、原生元件錯誤和資料一致性風險仍存在。

沒有模擬玩家，沒有實際客戶端或玩家操作，沒有正式服／既有世界操作。沒有修改 canonical runtime、合併 main 或發布修復 Release。來源和測試均固定於下列版本，不泛指以後的更新。

## 固定版本

| 模組 | 版本 | 精確來源 |
|---|---|---|
| Tavern | 0.6.63 beta | f793a98a0180e1948f98e69a8ca879a028884e38 |
| World Liquor | 0.1.27 preview | ce8c41e48c731985221945479650de121e4d477c |
| Grilling | 2.8.7 canonical | 7ef78bb360ac6a34664a15deef2c2aff5cc3d719 |
| Cookery | 1.0.8 | CurseForge file 8983314 |
| Chinese Food | 1.0.4 | CurseForge file 8983356 |
| Deco | 1.0.1 | CurseForge file 8931626 |
| Immersive Eating | 1.0 / manifest 1.0.0 | CurseForge file 8900604 |
| End | 1.0.1 | CurseForge file 8990981 |
| Nether | 1.0.1 | CurseForge file 8990975 |

自有倉庫依次是 casama233/kaleidoscope-tavern-unofficial、kaleidoscope-world-liquor-unofficial、kaleidoscope-grilling-unofficial。不是九份都核對過 Release 二進位；本次自有包用固定提交的完整 runtime。

公開包 SHA-256：
- Cookery 1.0.8：9e5b617cc4c7a08ecd429fb9e42ec10e8d40a1ed5fc1f6f6687c3aff8a45a5d5
- Chinese Food 1.0.4：63bd2eb2ee2819c985d7c484df633c913cbb995abf3162aa68c997c24ef607f2
- Deco 1.0.1：a554e13edd83012a0e621a98b5ddcf065514ba1fbed6e941019ebe45628adee6
- Immersive Eating 1.0：a3a8c7f9e6229808a620b3d261bb6d63319abdf1e578c163586cbc906c4956d9
- End 1.0.1：3966a6f37ad26d71931dde5c719ad166fce0f8459f7f1b450a3f731c08751398
- Nether 1.0.1：b22c1f51f4941d73198d038e72f7e0e51093e32397c9086f991ae4a68cce781d
- Cookery 1.0.6 歷史對照：c589efb60277bea295ac12ef760d8f2c7e8af3ea62e809b320862bd786033351

## 原生載入矩陣

官方 Linux BDS 1.26.52.3，下載 ZIP SHA-256 f6348d84fa714d04ca194f207e89453ca6bba0a1359396475271a52a150471c6。每例全新平坦世界、不開實驗、零玩家；只讀觀察器記錄 ItemTypes、訊息與 tick，約 65 秒後停止。

| 案例 | 組合 | 結果 |
|---|---|---|
| 00 | 原版＋觀察器 | 啟動、tick、停止正常 |
| 01 | Cookery 1.0.8 | 啟動、tick 正常 |
| 02 | Cookery 1.0.6＋Tavern＋WL | 初始化、WL ACK |
| 03 | Cookery 1.0.8＋Tavern＋WL，依賴不改 | 初始化、WL ACK；依賴宣告仍錯配 |
| 04 | Cookery 1.0.8＋End＋Nether | 初始化、代表物品註冊與擴充訊息正常 |
| 05 | 全九包原件 | 啟動但有煙火容器錯誤、19 食物覆寫、梯子配方衝突及 115644 狀態警告 |
| 06 | 全九包，僅將 Tavern／Grilling 依賴重綁 1.0.8 | 上述問題仍在 |
| 07 | 同 06，反轉顯式包清單 | 上述問題仍在 |

八例 exit 0，原生觀察器均執行；不等於八例無錯通過。所有案例含原版控制組都有預設 transport 不是 NetherNet 的連線提示，沒有阻止 native tick，不能歸咎於 Nether 模組；本輪不認證玩家連線。

第一批 harness 把 offline authentication 與空 allowlist 並用而被拒絕，結果作廢；修正後才列入上表。最初 registry accessor 拼錯的一次也不採納。沒有把 CI 綠燈當作試驗實際執行的證明。

## F01：舊 Cookery 依賴／升級身份【來源確認；P1】

Cookery 1.0.8 BP UUID d322809c-a51e-4742-bfc4-16d3c1491c9d，RP UUID 8e2c6318-2f5f-4907-aad0-31d10610e405。Tavern 和 Grilling 的兩側 manifest 卻仍要求 1.0.6 的 10f37ae2-9ccf-435f-b34b-0eec8191cd94／c89dc8df-c3fc-4bc8-8bd0-527abba76681；九包依賴圖有四條不滿足。

反證亦要保留：03／05 用 BDS 明確世界清單仍成功初始化。因此這是依賴契約與升級路徑錯配，不是任何環境必然啟動失敗。需同步公開基線、依賴、文件、CI，不能同時裝兩份不同 UUID 的 Cookery 來湊依賴。更換宿主 header 也涉及私有世界 DP 的舊站點資料遷移；本輪未測既有世界升級。

## F02：煙火容器需要實驗【原生日誌確認；P0】

Grilling BP/blocks/grill.json 和 advanced_rack_block.json 在 05–07 均被報：To use 'container' in 'minecraft:block_entity', experimental creator features are required。並有 grill_tick 自訂元件未被方塊使用的提示。

烤串物品註冊、腳本啟動不能證明烤爐／高級架可用；這是未開實驗條件下的元件要求，不是新 End／Nether 撞 ID。應明確宣告實驗需求或提供無實驗實作，不直接拿正式存檔開實驗試運氣。

## F03：煙火跨 BP 私有庫存接法無效【來源＋原生作用域；P0】

Grilling scripts/a279_beef_board_runtime.js 用自己的 world.get/setDynamicProperty 操作 kc_station:*；a2739_cookery_oil_pot_block_adapter.js 操作 kc_oilpot:*。這不是 Cookery 公開接口。

另外以兩個不同 header UUID 的新 BP 在原生 BDS 做作用域試驗：A 寫 A，B 讀 undefined；B 寫 B，A 仍讀 A。世界 DP 按 BP 分隔，字串加 kc_ 前綴不會跨包共享。

故煙火在自己資料範圍寫入／讀回成功，不等於廚房權威庫存已更新；共享模型可以改，私有站點資料卻不同。牛肉／油量與扣料、模型可能分叉，是來源與引擎語義支持的資料一致性風險；尚未以玩家操作重現吞料。

修復應由 Cookery 持有單一庫存權威，附屬經公開站點／配方／交易接口請求並等待確認。不能複製私有格式或改 header 假造共享；亦須保留宿主內建配方優先規則。

Tavern—World Liquor 現有 host-owned furniture storage／ACK 路徑與此不同，本輪已收到成功註冊，不能把 Grilling 缺陷無差別套到 WL。

## F04：Tavern—Deco 人字梯配方衝突【來源＋原生警告；P1】

Tavern BP/recipes/stepladder.json 與 Deco BP/recipes/crafting/shaped/step_ladder.json 都是 crafting_table，六個 minecraft:ladder 排成 L空空／LL空／LLL，輸出分別為 kaleidoscope_tavern:stepladder 和 kaleidoscope_deco:step_ladder。

BDS 明確報同料異產物的 duplicate recipe。這不是 ID 撞名，而是輸入不能區分；客戶端哪一個取得優先尚未驗證。需要明確整合／轉換配方，保留兩者取得路徑及既有方塊 ID，不能只靠包順序掩蓋。

## F05／F06：沉浸式進食的覆寫與全局副作用

F05【P2，部分為刻意設計】：十九個異內容的跨包 item ID 重複全來自 Eating 覆寫 Cookery 食物；十七项主要改使用時間／動畫，包子盤和青團盤加可食用及返碗。menu_category 相符，不能說十九項全是錯誤或已證實打散分類。BP／RP 覆寫必須配對。

九包只有 Eating 帶完整 minecraft:player RP 定義；Tavern、End、Nether 沒有競爭同一份玩家定義。playAnimation／手持骨骼仍需實機合測。Eating 只支援其列出的十九道廚房食物，不會自動支援全部酒、串及新 End／Nether 料理。

F06【P1，來源確認】：Eating scripts/main.js 在進食流程設 world.gameRules.sendCommandFeedback=false，最後使用者結束後 100 ticks 還原快取值。這影響全世界而非一名玩家，可能掩蓋其他操作並回寫過時管理設定。應取消這種全局靜音；本輪未跑多人操作重現。

## F07：指南原生登錄成功，但 locale mechanics 遺失【P1】

在明示的 Cookery 1.0.8 診斷副本追加一個只讀 logger，且將 Tavern／Grilling 依賴重綁 108；不分發此宿主副本。tick 300／1000 的真實正規化 registry 均為：

| 擴充 | 條目 | fallback mechanics 條目 | locale mechanics 條目 |
|---|---:|---:|---:|
| Chinese Food | 59 | 17 | 0 |
| Nether | 104 | 36 | 0 |
| End | 58 | 41 | 0 |
| Tavern 合併 WL | 222 | 204 | 0 |
| Grilling | 76 | 76 | 0 |

共五個擴充、519 條；不是只看「訊息已發送」。Tavern 31 個 category 節點包括子分類，不等於 31 個首頁入口。還讀到炒鍋配方 522、精確湯鍋 105；End 紫頌花茶結果正確，Nether 火腿砧板模型槽 1、中華美食黃魚槽 2。

Cookery guidebookExtensionRegistry.js 將 mechanicsByLocale 的鍵交給只接受小寫的 cleanToken，標準 zh_TW／zh_CN／en_US 因而被排除。這是操作文字語言變體丟失，不是整書失效；fallback 和其他名稱／正文語言欄位仍在。Tavern／Grilling 已有繁中＋英文回退，End／Nether 也有 fallback。修宿主 locale 驗證，保留舊版回退和現有指南結構。

新 End／Nether 資料在本輪確實送達，不應只拿某些 UTF-8 chunk 的位元組數推斷 Script API 字串必然拒絕。註冊訊息次數包含重試，不是獨立配方總量。

## F08：中華美食缺失原料【來源確認；P1】

Chinese Food scripts/data/recipes/stationRecipes.js 的 wok/yangzhou_fried_rice 用 kaleidoscope_cookery:raw_ham。九包聯集沒有此物品；Nether 的 kaleidoscope_nether:ham 不是同一 ID，安裝地獄不會自動修正。需核對作者預期，不按中文同名擅自替換。

已檢查的同站點／液體／槽數精確配方材料選項交集沒有另一組異產物衝突，但檢查不涵蓋全部 tag、flex 優先級、批次與真玩家烹飪。

## F09：狀態預算【原生警告；P2】

全套 05–07 均報 115644 block permutations，超過 65536 效能警告門檻；不是硬上限，未量測手機 FPS／記憶體或證明崩潰。順序與 manifest 重綁不減少此數。

靜態熱點：Cookery 砧板自訂狀態笛卡兒積 9216；多種 Cookery／Deco 桌各 1024。這不含引擎／trait 派生且未扣被拒定義，不是 115644 的精確拆帳。需全家族共同預算及舊存檔遷移，不只追責新 End／Nether。

## F10：創造分組仍待客戶端定位【OPEN】

八份 catalog 共 940 條目、以 category＋name 合併成 30 群組。未見自訂項目／圖示缺失、menu_category 錯配、單份清單重複；BDS 也未報 catalog 錯誤。公開 Cookery108 crops 仍在 equipment；Grilling server-edition 將 crops 移到 nature 是另一宿主基線，不能直接套到公開版。

追加既有群組只寫 name、各包固定檔名相同，本身是合法用法，不能直接當成覆蓋衝突。本輪沒有客戶端創造 UI，因此沒有重現／修好使用者先前的攤平截圖。要核對實際啟用堆疊、舊 Cookery 殘留、server-edition 混裝與展開／折疊狀態，不需要先刪世界。

## F11：End／Nether 與酒館的內容互通尚未接線【GAP】

End 靜態 Cookery 站點配方 30（砧板1、炒鍋18、湯鍋7、茶壺4），另沙威瑪2；Nether 106（湯鍋15、磨盤9、砧板1、炒鍋81），另沙威瑪4。兩者走 Cookery API，初始化和代表映射已原生確認。

但 End／Nether 未向 Tavern 註冊 drink_content／shaker_recipes 等描述符。Tavern parseBottle／holder 只接受已知瓶子及 externalDrink；新茶、新酒不會因名字相似自動進酒櫃、調酒、接酒或取得六品質／酒效。這是缺少內容 bridge，不是兩包造成崩潰。應按真 ID、容器、模型、可混合性和效果生命周期明確註冊，不虛構品質。

WL 原生 ACK 為 recipes32、pages66、shakerInputs56，屬已接上的不同路徑。

## F12：HUD、微醺、戰鬥／世界與圖像界線【OPEN】

Tavern 有自己的 hud_screen 擴充；九包無第二個同名 HUD 定義；Grilling 舊準星發送器現為 no-op。Actionbar 仍是共享顯示通道，酒館讓位機制不能代替長提示／並發操作的客戶端合測。

微醺仍 yaw_adapter_unverified、exactJavaRoll=false、clientConfirmed=false，是酒館自身尚未完成 Java roll 的問題。沒有發現 End／Nether 覆寫玩家相機可用來歸因；之前 attempts 增長、lastError=null 不是畫面成功證據。

新 End／Nether 與 Tavern 未發現異內容物品／方塊／粒子／動畫 ID 碰撞、重複字面自訂元件註冊或缺失相對 JS import。十二個跨包重複 geometry 是相同內容，不能算十二個衝突。相同 atlas／語言路徑多按鍵合併，不把 140 個不同內容同路徑誤算成 140 個問題。

九包 RP 均宣告 pbr，未見這項宣告缺失回歸，但 Android Vibrant Visuals／透明排序／手持動畫沒有驗收。生成／掉落靜態 ID 無交叉碰撞、種子與鐮刀擴充訊息收到；實際生成概率、掉落次数、死亡／牛奶清理、Nether 投射物与莫洛托夫傷害歸屬、End 食效與酒效疊加，仍需玩家和跨維度測試。

## 修復優先序

先固定 Cookery 公開基線與遷移；修煙火容器要求／私有 DP 接口；處理梯子配方、缺失食材、Eating 全局靜音；修宿主 locale 並加可選 End／Nether 酒館 bridge；建立全家族狀態預算；最後做桌面／Android、Classic／Pocket、新舊世界、多人／重載、食效酒效重疊的真正客戶端矩陣。不能以調包順序宣稱全部修好。

可作下一輪客戶端起點的是 Cookery108＋End＋Nether，再加入依賴已核對的 Tavern／WL。這只是初始化／registry 正面證據，不是已發布全相容整合包；Eating 可單獨作可選測試項。

## 可追溯原生證據

- 八組載入：https://github.com/casama233/kaleidoscope-tavern-unofficial/actions/runs/36453641283；artifact10984997186，SHA256 a17eba70442eb88e19c6be753548f51cc3a83a38024b3687dc2e71bc57be1775。
- BP 世界 DP 作用域：https://github.com/casama233/kaleidoscope-tavern-unofficial/actions/runs/36453602709；artifact10983874870，SHA256 68c0f1e027762e9ea5d559cb8016cddf50de2dcac55fb717ced82a9fff9f6978。
- 明示 instrumentation 宿主 registry：https://github.com/casama233/kaleidoscope-tavern-unofficial/actions/runs/36454455953；artifact10985426389，SHA256 2aeb44eae0543545c8ab4b5a681cdb5bc552178203334b152909737da4438d9d。

詳細本地交付含完整報告、FINDINGS.json、SOURCE-LOCK.json、逐項結構／哈希表與有效原生日誌；沒有第三方原始 mcaddon、完整私有腳本、BDS 二進位或測試世界。審查分支僅保存工具和證據，沒有把審查結果冒充修復發布。
