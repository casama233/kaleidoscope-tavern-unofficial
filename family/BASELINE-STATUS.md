# 家族現行來源基線

2026-10-09 **13:23:16 香港時間（05:23:16 UTC）**：luosen 已部署並正常啟動 **T142／G123／W119**，引擎 **1.26.52.3**。完整家族 **42 包（22 BP／20 RP）**，作者 Cookery **1.6.0**、私有料理 **1.0.30**；版本、相依、逐檔來源及順序以 [家族鎖](upstream.lock.json)和本次完整收據為準。真人接受仍 pending。

| 自有來源 | 本次已合併來源 | Runtime 來源／範圍 |
|---|---|---|
| 酒館 0.6.142 | [PR311](https://github.com/casama233/kaleidoscope-tavern-unofficial/pull/311)，`4dd3ff3216ab055a3806d5d11d3e6d9b6c06b041` | `717b129cd0a7bd614d0b4bf697c6f309af1a6a02`；保留 T141 板面／雪克杯及全部三語指南，整合載入光效 proof／fence 與完整來源 recorder 修補 |
| 世界名酒 0.1.119 | [PR100](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/pull/100)，`a16855806c93e0ff32877b0d1177eeeb2eb1fa90` | `f60174df93bb8544ea0836b3d7bb9bb06a281255`；僅更新身份及 T142 相依，保留 W118 的 84 個 LivingEntity、魚類效果、存活 credit、67 個指南條目與確認錨 metadata |
| 煙火／燒烤 2.8.123 | [PR188](https://github.com/casama233/kaleidoscope-grilling-unofficial/pull/188)，`080b04959f469626da36180198da6489435df5be` | `632fbae02208e2752f3a977c3b7f7dd2176b9aa0`；保留 G122 玩法／指南交接，以登記 helper 0.2.10 修正 Cookery 標準語系正文接收 |

## 指南與保留的玩法

公開 Tavern／World Liquor 配套為 **223 條目**；完整家族加上 AMW 的 Kirsch、Kriek、酸櫻桃與酸櫻桃汁桶，共 **227 條目／31 分類／94 製作方法**。來源投影保留七入口、子分類、單品圖示及完整繁中／簡中／英文；獨立酒館書和可選 Cookery 入口使用同一投影。設備講操作與保存限制，產品先講用途，完整材料、數量、容器與時間由製作方法按需開啟。見 [T140 說明](../docs/RELEASE-NOTES-0.6.140.md)及[指南審修規則](../docs/GUIDE-EDITORIAL.md)。

T142 保留真正原料數量、支援的 native metadata 保存／回滾、合法 Q4 原料及 Mob／AABB 選取；承接 T141 的板面分隔符／index 0 換行和原料數量改變後的新雪克杯手勢。W119 保留 W118 的 84 個 LivingEntity 對應、無 mob family 魚類效果入口、非生物拒絕與存活 kill-credit 門檻。

保存光效恢復須具有同一實體 invalid-before、真正 entityLoad、同 tick 精確 after，以及保存 row／native identity／amplifier／剩餘時間／durable fence；initialSpawn 不重發已消耗授權，外部刷新、一般 restore、跨 tick 與衝突仍拒絕或清理。Recorder 綁定凍結及 current source、完整 BP／RP 與七個 observer overlay entries，詳見 [T142 說明](../docs/RELEASE-NOTES-0.6.142.md)。舊候選失敗與既有原生證據保留原身份。

G122 新炒鍋保存備料、第一鏟起算、三翻及成品／黑暗料理／木炭階段；三道料理保留 exact 並接通 flex，品質進入原生食物、冷卻與食材快照。油渣由 23 增至 25 類，補乾燥紅樹葉下生苗及懸掛苗成熟；退款須先確認本次寫入與復原所有權。G123 的 Cookery helper **0.2.10** 以 `publicGuideLocale` 接收標準三語正文鍵；通用 source／revision／category token 驗證不變，descriptor、作者短掛鉤及全部 copied helpers 須成組組裝。來源及有限原 Java 品質／營養證據見 [G122 說明](https://github.com/casama233/kaleidoscope-grilling-unofficial/blob/8002da0086544cd18c9854e7fe79e8ccb2f9f982/docs/STATUS-A2.8.122.md)；原包缺陷、精確登記適配及作者回報仍未送出的狀態見 [GUIDE-LOCALE-ADAPTATION.md](GUIDE-LOCALE-ADAPTATION.md)。

## 本次驗證與 LIVE

T142 的 PR311 全部 13 項必要 CI、W119 的 PR100 全部必要 CI 均已通過並合併；G123 的 PR188 全部必要 CI（含 Windows）已通過。T141／W118 的首次 21／正常保存重啟 22 項零玩家案例及嚴格 recorder 保留其原身份，見 [該版原生證據](../docs/native/T141-W118-20261009.json)；T142 的當次 CI／recorder 以完整新來源核對，舊報告不改名。

先前 T140／W117／G122 家族收進 227 條目／31 分類，但 lowercase-only cleanToken 丟棄三語正文，接收失敗且未部署。G123 已在乾淨作者原包重現並以登記微型掛鉤修復。後續 T141／W118／G123 完整家族與實際 Cookery 接收通過 **227 條目／31 分類／681 個三語條目正文**；該次部署因遠端合法新來源前進，於停服前被拒絕，沒有更新 LIVE。這些成功與拒絕證據保留原收據，不改成 T142 的結果。

最終 T142／W119／G123 本次完整 **42 包 static、新世界首次／正常停止／重啟 BDS** 已通過；實際 Cookery registry 接收 **227 條目／31 分類，三語正文共 681 組** 全部通過，零玩家／零錯誤。接收 observer 僅為隔離 QA 的兩檔 overlay，沒有進入部署包。

**05:17:42.966 UTC** 正常停服取得本次一致備份；保存世界首次／重啟均通過，**18 筆玩家資料前後完全相同、兩個自訂容器內容保留**。原生冰櫃輸入是零樣本，不當作非空輸入驗收。安裝沒有替換正式世界 DB 或 `level.dat`。

**05:23:16.240 UTC** 部署完成，狀態 `deployed_running`；poststart `ok=true`、42 包逐檔與順序相符、引擎／完整家族啟動及 quality 准入通過、`errors=[]`。本次完成紀錄為 `20261009-guide-final-t142-g123-w119`；reviewed receipt SHA256 為 **`e7b02bd5f9101b5421aaf4ffe1f127e4ea2097a903f073b5bf14fb5b32d829cd`**，政策延期真人接受登記綁定同一 SHA。`static=true`、`bds=true`、`saved_world_migration=true`，仍保持 **`client=false`、`production_ready=false`、`pending_client_acceptance`**。

Poststart 視窗記錄 **401 條 warning**，包括 97853 block permutations 與其他包的載入／watchdog 提示；零錯誤不等於效能或完整 Java 一比一驗收。停服一致回退、本次原始收據與成功／失敗證據保留；本文件整理不改 runtime、版號或重啟 LIVE。

## 實際剩餘差距

- 酒館：純相機 roll、真正穿牆輪廓、名字／裝備隱藏與清仇恨、任意三份裝飾非堆疊原料、正式多行編輯器、完整渲染／輸入／音效仍未完成。
- 世界名酒：已確認新下界錨的 yaw=0／forced=false、同 tick 重複及取消／lifecycle 防線保留；真 Player、舊／未知錨仍待驗證。Native Luck 掉落、SkullOwner／Elbow／CaptainGift、部分事件與跨模組行為仍有差距。
- 煙火：三道 exact／flex producer 已接通，完整宿主操作、原生食用／營養、保存事件與聲畫仍待驗證。任意秘製串背包圖示、調料 registry 原型、其他料理與未適配植物保持開放。
- 完整 Java 一比一與本候選真人指南排版／操作尚未接受；逐項範圍見各 canonical `docs/PARITY-MATRIX.md`／`docs/BUGS.md`，不以載入或 hash 相同推定完成。

## 作者版本與維護分支

下表是目前已釘選作者參考；查核來源與持續追蹤規則見 [java-upstream.json](java-upstream.json)。維護版 T142／W119／G123 不等於作者發布版，也不代表整分支已移植。

| 作者分支 | 已釘選發布參考 | 維護範圍 |
|---|---|---|
| Tavern Forge 1.20.1 | 1.2.0／CF8350841 | 原作 `c4ec1880`；與 NeoForge 分開核對，完整一比一待完成 |
| Tavern NeoForge 1.21.1 | 1.2.0／CF8350856 | 原作 `a1afba34`；保留本分支差異 |
| Tavern NeoForge 26.1.2 | 尚未找到正式發行 | 來源 `9b8f165a` 宣告 1.1.2；局部查核，定期 Git HEAD 監控差距保留 |
| Grilling Forge 1.20.1／NeoForge 1.21.1 | 1.1.1／CF8726006、CF8726014 | 作者參考不變；G123 保留已合併 G122 自有修補，品質／營養的兩分支差異分列 |
| World Liquor Forge 1.20.1 | 1.1.12／CF9066402 | 保留 W110 選定配方／效果／杯子素材適配；Forge 事件、酒櫃自動化及 Create／Jade／SMC 未完整適配 |
| World Liquor NeoForge 1.21.1 | 1.1.11／CF9066406 | 主要玩法參考；冰櫃保存、時序及五個配方修補保留，完整互動／效果仍未閉合 |
| World Liquor NeoForge 26.1.2 | 1.1.6／CF9087098 | Luck／BlockDrops 等差異已審查；整分支待適配，不替換 1.21.1 玩法 |

五個 Bedrock 作者包目前鎖定 Cookery **1.6.0**、Chinese Food **1.0.4**、Immersive Eating **1.0.0**、Nether **1.0.1**、End **1.0.1**。Cookery UUID 遷移的原收據保留；國味 **1.0.10430** 是登記相容變體。其他 preserved 包維持本次收據的原 bytes／順序，不從私服較大版號推論作者最新。

## 政策與歷史入口

執行 [MAINTENANCE.md](MAINTENANCE.md)及 [UPDATE-WORKFLOW.md](UPDATE-WORKFLOW.md)：完整家族組裝與 `family_guard` 准入、逐候選延期真人接受、停服一致備份與回退、部署後讀回均保留。作者每六小時唯讀查核、家族每五分鐘漂移查核；新作者版／查詢失敗須審查，不自動安裝或改鎖。

舊候選、相同版號的不同來源、未合併原型及草稿處置見 [PR-DISPOSITIONS.md](../docs/audit/PR-DISPOSITIONS.md)、[T139 來源合成紀錄](../data/main-guide-integration-20261009.json)及各歷史 release notes。它們保留原 Git、history、claims 和收據身份，不作另一個「當前候選」或新包輸入。
