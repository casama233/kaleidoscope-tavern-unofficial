# 0.6.136：倒轉目標、重生錨配套及原生驗證修正

本候選為 **Tavern 0.6.136／World Liquor 0.1.113**。以 PR302 reviewed
T135 `6dc43f3bd589a370782f7005c9d672e141de0be3` 與 PR91 reviewed W112
`ed78beed3204a8a9e3c3a83d48350fb0e84ba516` 為直接來源，保留其全部
原料保存、交易、板面描邊、冰葡萄動畫、RGB 明暗、材質和狀態外觀修復。
T134、T135、W111、W112 的 freeze、歷史、來源見證與實際失敗結果不改寫。

## 真正改變的玩家行為

| 行為 | 本次修復 | 仍未完成 |
| --- | --- | --- |
| Upside Down 選取生物 | Java 先取得 AABB 膨脹 16 格內的完整存活 Mob 名單，再逐一更名。Native 現使用一次有界查詢、精確 AABB 與已審查 Mob 分類，鱈魚／鮭魚／熱帶魚即使沒有 mob family 仍入選；玩家與盔甲架排除。完整名單固定後才寫 nameTag，避免早期回呼改變後續選取。 | Java 的名稱可見旗標沒有對應的 stable setter；改名不等於實際倒轉畫面已驗收。未知 addon 維持 health＋mob family 適配。 |
| World Liquor Respawn 使用新設定的原生重生錨 | W113 在有效下界錨互動前捕捉舊點，deferred 時確認原生出生點確實改到同錨、方塊與正數 charge 保持一致，才保存 yaw=0、forced=false。keepInventory=false 的正式 resolver 因而能使用已確認資料。 | 舊錨／未觀察點、無法讀取的點與自訂維度仍需要既有明確宣告；真正 Player lifecycle 尚待驗收。 |
| 連續互動與取消 | 同 tick 同錨 repeat 保留第一份 changed-point 觀察；任何保留事件的晚取消都阻止保存，換目標／charge、重生與離線使 pending 失效。已確認資料保留。 | 無法觀察的外部同點覆寫不猜來源 metadata，保留原先限制。 |

W113 不改 Respawn 的成功結算順序：有效落點決定後才扣一次 charge，
保留起點聲音、傳送、終點聲音與 Hunger。W110 新版獺祭 amplifier、四款
原作模型／atlas、兩張圖示、配方、冰櫃與指南 bytes 均保留。

## 原作來源

- Forge [UpsideDownEffect at c4ec1880](https://github.com/KaleidoscopeMods/KaleidoscopeTavern/blob/c4ec1880bd44cf3139d3ba744ab30bb379cf1416/src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/effect/UpsideDownEffect.java)。
- NeoForge [UpsideDownEffect at a1afba34](https://github.com/KaleidoscopeMods/KaleidoscopeTavern/blob/a1afba34981a00e89d57130d3dc8f1e64f1820a2/src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/effect/UpsideDownEffect.java)。
- W113 的小型來源紀錄保留 Mojang 1.21.1 client／mapping SHA1、RespawnAnchorBlock 判定與方法對照；未將完整原作 JAR 或反編譯檔加入公開倉庫。

兩位代理分工實作後互相審查；重生錨 repeat 覆寫首次觀察的反例在交叉
審查中重現並修復。另一代理核對現有板面與材質，保留 T135 的既有修復，
補上動畫與 RGB 檢查器對材質定義的明確斷言。

## 原生 observer 的修正

[T135 CI 37871245685](https://github.com/casama233/kaleidoscope-tavern-unofficial/actions/runs/37871245685)
的 12 個工作通過；native-persistence 在 portableIngredients 使用不屬
正式 cocktail ingredient 的糖時，被 NOT_SHAKER_INGREDIENT 拒絕。
本版改用原作與正式 registry 都允許的三種 q4 酒，保留每格 type、名稱、
raw lore、Adventure 清單、雙向原生可堆疊性、保存與獨立 clone 斷言。
沒有修改配方規則以通過測試。

T135 的下一次 [CI 37872094738](https://github.com/casama233/kaleidoscope-tavern-unofficial/actions/runs/37872094738)
仍有 12 個工作通過；原生 portable metadata 與 pressing tub／barrel 首次保存
已到達並通過，接著 aura 觀察器在 (-17,300,-17) 遇到未載入且未 ticking 的
chunk 而停止。新觀察器為原有四個負座標 chunk 建立明確 ticking 區域並
等待可讀；重啟保留原狼與保存 lease，不另施放或製造通過結果。
此先前失敗仍保留，不能推定後續效果或重啟已成功。

本機原生診斷另發現自然地形的竹子掉落污染 doTileDrops 場景：正常停止
後的世界副本包含 28 個竹子物品，原先當刻查詢未記錄完整列表，因此不
將其寫成已證明 netherrack 的掉落規則錯誤。場景改用封閉高空測試室，
保留三種方塊在 true／false 下全部六項數量斷言，並記錄實際物品與規則。
Adventure metadata 的重啟階段必須存在先前保存的值，不能重新捕捉後
把資料遺失寫成成功。 原生 getter 還會展開 stone／dirt 的舊方塊變體；測試逐項保存完整原生清單，僅在確認必要成員時補命名空間，沒有把它限制為單一名稱。這些是觀察器修正，不是遊戲配方或掉落規則變更。
本機首次階段曾在正常停止後發現 executable mode 由 0755 變為 0644；
檔案 SHA256 仍與原下載完全相同。runner 在每次啟動前恢復原執行模式，
不更換引擎 bytes，也不把缺少的重啟結果改成通過。修後隔離 v4 的首次與
正常停止後重啟均通過：完整 7／2 項 Adventure 清單、原生等價與保存讀回；
第一階段全部六項方塊掉落判定通過。此結果仍不是完整配套包或 Player 測試。

同時保留 T135 後續 observer 修正：缺失的物品元件以 null 形成有效 JSON，
以及讓原生光效狼留在場地的圍欄，不重新施加光效或虛構重啟 lease。

完整 paired native observer 保留原有全部場景，追加真實 cow／cod／
observer Mob 的 Grumm 名稱讀回，以及 armor stand／health helper／XP
保持原名。此觀察只證明實際 API 分類與更名；未建立 Player，也不證明渲染。
確切新候選的首次、正常停止、重啟與 CI 結果需單獨讀回，不沿用舊綠燈。

## G120 相容來源

可選 Grilling 更新到已合併 PR185 的 `8dc3e9d440577cd70501c377722f8e27b0913d44`。
其 entity 定義與 shared station storage 保留原 bytes，T/W 的 56＋21＋10
個零碰撞 helper 檢查通過。T/W runtime 沒有新增 Grilling 相依或修改清單。
完整家族必須把 G120 Cookery family API 0.2.7 descriptor、作者 patch 與
copied helper 一起組裝；私人宿主並未因此驗證或部署。

## 驗證與交付邊界

本機針對 Mob 分類／完整名單、Vision／Bloody Mary、Ardent／Grass 排程、
錨 producer→resolver、repeat／取消／保存 lifecycle 及材質做定向檢查。
完整必要 CI 由本候選 PR 執行；發布需要乾淨來源、append-only baseline、
精確 T/W peer、archive 及遠端讀回。最終結果記錄在 PR 與發布 metadata。

純相機 roll、真正穿牆輪廓、全身／裝備／名稱隱藏及清除仇恨、全域 reach／
step-height／XP pickup、多行板面編輯器、彩色字腳位距離／望遠鏡例外、
任意三份非堆疊雪克杯內部原料、掉落展示上下文及部分 World Liquor
效果仍有差距。相同場景的真人鍵鼠／觸控／手柄、透明、音效和資源堆疊
尚待比較，不能把本批修復稱作完整一比一。

私人 BSM、當前 quality checkpoint 與 LIVE 世界連線在本工作區不可用。
完整家族組裝、fresh stopped-world 演練、備份、准入、部署及讀回保持未執行；
既有持續授權不變。client=false、production_ready=false、live_deployment=false。

## 本機確切配套重啟結果：未通過

[原始原生報告](native/T136-W113-20261009.json) 記錄 T136／W113 的完整
frozen runtime 與顯式 observer hashes。T 本機實測 commit `96668b8b` 的
完整 tree 與公開 functional source `721414648d08c17d78db6bb3d5a08f27080acbc4`
相同；W 為公開 `a5b22dfb05176f626b89de3f46f1ecc1806e8f62`。
這是隔離診斷，沒有把本機 commit 重新標成正式 CI 或部署准入。

首次啟動通過，包括三種原料、機器原生資料、aura 取得、PUT 恢復、即時
治療／傷害與取消、Vision 和 Upside Down 真實 Mob／鱈魚／排除對象。
正常停止後的重啟通過兩種雪克杯 ID 保存、三種原料資料與兩種機器回收，
但在 `saved appearance lease not restored` 失敗。兩階段均正常停止，
沒有玩家連線或內容 ERROR；失敗不能被後續版本或只看首次 done 覆蓋。
停止後世界副本的狼仍有 speed 效果，光效 dynamic property 已空，根因
及修補仍待獨立原生事件追蹤確認。T136／W113 不因此聲稱可部署或完整通過。
