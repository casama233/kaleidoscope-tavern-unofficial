# Tavern 0.6.137：原料、操作、視覺與效果保存修復候選

本候選為 **Tavern 0.6.137／World Liquor 0.1.115／Grilling 2.8.121**。
以公開 T136 三語指南 main 為基底，重新整合本輪機器原料、可攜雪克杯、
操作交易、板面描邊、酒液 RGB、動畫與狀態粒子修復，並完成原生效果
剩餘時計及重啟外觀重播守衛。**41 個 aura 定向案例已通過；本候選 exact
canonical CI 及配對原生首次／重啟仍 pending；凍結來源與實際建置如下。** 沒有新的
真人 client 或 LIVE 成功；程式、資源與 CI 各自只證明其實際範圍。

## 不可變來源與實際建置

- 本輪功能 source：[a360fe0e2970c65ee0cfad6ad8d08f86f6cbcbf5](https://github.com/casama233/kaleidoscope-tavern-unofficial/tree/a360fe0e2970c65ee0cfad6ad8d08f86f6cbcbf5)。它與本機乾淨建置提交的完整 Git tree 相等；後續 metadata／peer pin 不改 runtime。
- BP：829 檔，`ebad55d2207433a3f5ac7b90f73ec1d9c15b30091340b3e2f641e96382fbdf07`。
- RP：3222 檔，`82696862dd594026716d0638cc742a94906e9873bff9a3216443debac2ae3f23`。
- 實際 archive：`Kaleidoscope_Tavern_Unofficial_0.6.137_baseline1.mcaddon`，5,882,274 bytes，SHA256 `83dae1880765f62d4870b7ce972ae91881c5de7d274265f3b8f4bd5bbdf0402a`。乾淨提交建置、完整 export 與 frozen identity 核對成功；這不是 native／client 成功。
- 新 T137 review layer 對公共 T136 精確 preimage 附加 17 個 script、23 個既有資產／command 及 59 個新增檔見證；既有所有 review rows／layers 與公共 release-history 保留。兩個 T134 geometry allocation row 維持原身份。

## 來源與保留的公開指南

| 來源 | 本候選保留的內容與身份界線 |
| --- | --- |
| 公開 T136 main `c461a8e643a08304587ef468ff7f8051369a2dd5` | 保留三語指南、七入口、223 個合計條目、84 份完整製作記錄，獨立書與 G121 可選 Cookery 入口使用同一 projection／view。[公共 T136 notes](RELEASE-NOTES-0.6.136.md) 與其歷史原文保留。 |
| 未合併 PR302 alternate T136 `71e5c372cce282d8130290d01812929c9e7db1f8` | [固定來源](https://github.com/casama233/kaleidoscope-tavern-unofficial/tree/71e5c372cce282d8130290d01812929c9e7db1f8) 的修復重新整合為 T137；其 [alternate T136 notes](https://github.com/casama233/kaleidoscope-tavern-unofficial/blob/71e5c372cce282d8130290d01812929c9e7db1f8/docs/RELEASE-NOTES-0.6.136.md) 和失敗 CI 不改寫，也不覆蓋同版號的公共指南文件。 |
| T132／PR297 最終 reviewed source `727fd8853c44247ac8e2cf40faf70122b04e653b` | 保留濺射 dispatcher／免疫政策、雪克杯 echo／重試／回滾、感知查詢、guide 動畫、board escape、HUD 和 XP／health_helper 原生觀察區分。這不實作原生 XP pickup。 |
| T133／PR298 reviewed source `625ff769f4c656ff224314bba38d26a1ef5dacc0` | 保留有限 XYZ 逐軸比較，修復原生位置物件鍵序不同造成的錯誤拒絕；承接修復不表示原草稿 PR 已合併。 |
| World Liquor／Grilling | W115 保留公開指南和 W110 原作 Dassai Q3–Q6 Luck amplifier 1／3／5／7、四款雞尾酒杯模型與前兩款原作 inventory icons，精確配對 T137；G121 保留已合併 G120 及 Cookery 章節交接，不回退到 G119。這不補完 Luck 原生掉落或真人顯示。 |

原作對照保持分支身份：Forge main
[`c4ec1880bd44cf3139d3ba744ab30bb379cf1416`](https://github.com/KaleidoscopeMods/KaleidoscopeTavern/tree/c4ec1880bd44cf3139d3ba744ab30bb379cf1416)，
NeoForge 1.21.1 `a1afba34981a00e89d57130d3dc8f1e64f1820a2`；未發行
26.1.2 `9b8f165a4641e738e694641dd81240a0206573e1` 只保留已記錄的部分
核對，不能混作一套真值或宣稱整個最新分支已完成移植。

## 原料保存與操作

| 玩家行為 | 正式實作 | 拒絕／失敗邊界 |
| --- | --- | --- |
| 酒桶／壓榨桶放入原料 | 用原生 ItemStack clone 保存完整原料；保留名稱、raw lore、損耗、附魔及原生內容。同 ID 不同 metadata 分開，按原生可堆疊性合併；原數量、邏輯槽與 carrier 一同核對。 | 已採用原生保存後 carrier 遺失不退回純 ID 重建；不以不完整序列化替代物品。 |
| 舊機器升級與重啟 | 首次使用時採用舊 ID/count 槽並保留數量；只對舊資料做既有生成 lore 正規化。 | 不覆蓋 orphan carrier，不靜默截短不合法的超量單件原料；保存／讀回失敗保持保護。 |
| 加工、取料及拆除 | 壓榨逐份扣除完整原料，不合格物按來源退回；發酵只消耗一次。空手取料優先交回当前手，滿背包走掉落；壓榨桶破壞時完整掉出原料；酒桶依原作只掉出酒桶本體，不另噴出槽料。重複回呼不再掉第二份。 | 保存、扣料、掉物失敗回滾；Survival 遵守 doTileDrops，Creative 清理而不掉物。 |
| 容器交換與模式 | Creative 水／奶容器交換保留來源容器；普通原料按 Java 扣除。Adventure 允許一般機器操作／踩壓，保留建造拆除權限；Spectator 不取得入口。 | 不宣稱任意第三方 FluidUtil capability 或跨物品種類的任意 metadata 轉換已完成。 |
| 雪克杯內具名可堆疊原料 | 保存有界、自足的名稱、raw lore、可讀 dynamic properties 和 Adventure lists；放置、取回、複製、調酒走同一份資料。扣除前重建並雙向 isStackableWith 核對。原生 getter 的裸 vanilla IDs 可驗證，但原字串及順序不改寫。 | 隱藏內容無法證明等價便完整拒絕；沒有世界 escrow 指標。三份任意装飾非堆疊原料仍不支援，先前原生容量失敗證據保留。 |

完整外層雪克杯、主／副手來源、同手勢 echo 防護、失敗即時重試和有限
XYZ 保存位置比較均保留。成功操作保持原作安靜，不新增輪詢 Actionbar
或成功提示；原作拒絕訊息和使用者 opt-in 狀態顯示保留。

## 畫面與沉浸

| 原版效果 | 本輪實作 | 仍待核對 |
| --- | --- | --- |
| 發光板面文字 | 黑色前景搭奶油色八方向描邊；其他顏色用原作暗描邊。保留 glyph-specific shadow offset，Unihex 為 0.5 字型像素。前景／描邊分 pass，遠處不提交描邊。 | 16 格判定目前使用相機位置，Java 用 camera entity feet 並有第一人稱望遠鏡例外；48 格裁切、字重、縮放與排序待 client。 |
| 板面排列 | 保留 Java 左／中／右與舊上方位置；保留使用者要求的 justified／distributed 與垂直對齊擴充。 | 正式 editor 仍以 escape 欄位表示換行；下面的隔離 multiline probe 尚未接入。 |
| 機器冰葡萄 | 四個酒桶與八個壓榨桶位置接回原作 12 幀、每幀兩 tick 及插值，共 24 張 tick 圖；helper 共用 query.time_stamp，重建不再各自回第零幀。 | timestamp 的 tick 單位由 Mojang cod sample／frame_alpha 用法支持；全域 Java／terrain 相位、長時間運作與資源重載仍待 client 比較。 |
| 特調任意 RGB | 既有 336 色 atlas 保留；atlas 外顏色使用原作六幀每面 texel 的十個源色分組，再乘實際 24-bit RGB，保留明暗和透明覆蓋。透明 texel 不生成表面，使用不透明白底著色，同一 helper 不新增 per-texel 實體。 | 未用最近 palette 取代任意顏色；source 算術／UV 正確仍不證明實際 shader、遠距 mip、透明排序或 PBR／Vibrant Visuals 一致。 |
| PBR 資源 | 24 張冰葡萄圖及 rgb_opaque 的 25 個 texture_set companions 齊全；沿用 MER [0,0,215] 與 [0,0,170]，兩個 canonical generator 可重現。 | 這修復真 CI 漏資源，不把 Bedrock PBR 調值稱作 Java 原作 PBR 真值。 |
| 狀態身體粒子 | 原作持續效果顏色、Java float32 加權截斷、普通／隱形／全 ambient 機率、AABB 取樣、SpellParticle 圖集及運動。自有原生效果依保存 lease、事件和讀回證據加入同一層。 | 任意外部效果的 ambient／showParticles／生產者不可完整讀取；未知外部外觀保持原生所有權。粒子亮度、位置與攝影機畫面仍待真人。 |
| 草叢與微醺 | 每 tick 檢查草叢／潛行／效果；沒有既存原生隱形才給一 native tick lease，離開自然到期。微醺預設不再改 yaw，舊水平適配只在明確 opt-in 啟用。 | 不是整個玩家 renderer／裝備／名稱隱藏或 mob target 清除。純相機 roll 未完成，可選 yaw 仍改瞄準。 |

T131 四個動畫 item meshes、offhand shaker 和原有手持路徑保留。
新增描邊為 256 個固定 UV geometry ID，每個 19 bones／16 cubes／384
個配置頂點；RGB 為 60 個分組／幀 ID，每個一 bone、最多 28 cubes／672
個配置頂點。既有 base <1024 是專案預算，不是引擎全域硬上限。

兩個 exact geometry allocation witnesses 保留 **release 0.6.134**、
reviewed source `37ff9f12e74c6a4f3bb3a5fc40502d7e70e68c83`、原 asset hash
與 reviewDocument `docs/RELEASE-NOTES-0.6.134.md`；T131 四項配額亦不改。
[保留的 T134 notes](RELEASE-NOTES-0.6.134.md) 是未合併 PR302 的 immutable
來源審查文件，不代表新公共版本歷史。先前漏 PBR／原生 Adventure IDs
與 fixture 修正見 [固定 T135 歷史](https://github.com/casama233/kaleidoscope-tavern-unofficial/blob/71e5c372cce282d8130290d01812929c9e7db1f8/docs/RELEASE-NOTES-0.6.135.md)；
本頁已完整列出現行修復，不要求讀舊 notes 才能理解本輪範圍。

## 原生剩餘時計與重啟事件

舊 PR302 的 T135 真場景在 script tick 145 讀到 speed 600，146／147
仍為 600；以 system tick 倒算成 598 會誤判外部刷新並撤銷外觀 lease。
當時自有 effectAdd 已於同 tick 正確消耗、沒有外部事件、health 8 且有效。
現在以 native Effect.duration 的非遞增讀回作為剩餘時間；保存／恢复重新
讀取真正值，不靠加大 tolerance 或延後斷言遮蔽差異。原生 sentinel 的
2 native ticks／36 script ticks 記錄保留其實際 scope。

未合併 alternate T136 的
[CI 37875325541](https://github.com/casama233/kaleidoscope-tavern-unofficial/actions/runs/37875325541)
有 12 jobs 成功，首次 18 cases 全部完成；重啟前六 case 依序為 addon
註冊一個、cross-ID 兩個、portable 一個、機器兩個，後兩者完整 native
slots 均通過。接著 aura restore 失敗，剩餘 restart 不算通過；整個
paired native lane 仍失敗，不能用前段成功改寫結果。

隔離 v1 在 restart tick 238 讀到 saved 541／native 537，合法差四；
restore 並保存 537 後，同 tick 的引擎 effectAdd replay 被當外部而撤銷。
v2 在 tick 255 證明 load **有 before 事件**：entity.id 可讀但
isValid=false，DP／health／effect 讀取均 InvalidEntity；同 tick 的
entityLoad 已有效，saved 541／native 539，之後才發出 after。首輪自有
speed 600 及直接 API sentinel speed 20／invisibility 1 的 before 則
都是有效 entity。這些診斷不把 callback 可執行誤當成 entity 可讀。

T137 已實作三事件守衛：

1. invalid-entity before 僅保存有界、當 tick 的 type／duration 見證，受限 callback 不写 DP 或遊戲狀態。
2. 真正 entityLoad 驗證保存內容與 native duration／amplifier／身份，精確匹配實際 Effect.typeId 或 displayName（含 Speed／Invisibility），才建立單次 replay ticket。
3. 同 tick 的 exact after 只能消耗 ticket 一次；valid foreign-before、取消／模糊來源、衝突或失敗讀回／保存會否決豁免。重複／遲到事件回到一般外部交接，不移除或重施外部效果。

Player initial-spawn 的不同 callback 順序只保留同 tick 已驗證的 load
proof；沒有泛用 spawn 豁免窗口，缺 proof、跨 tick 或真正 respawn 均
不能藉此復活舊 lease。已被 foreign veto 的 row 不再接管，其餘獨立
proof 可保留。若引擎沒有 before API，新的 adapter 保持一般原生粒子。

原生紀錄器另有 9 個聚焦反例通過：保存當次 source commit／frozen trees／全部 observer overlay hashes，拒絕來源與 staged 副本同步漂移後套用舊結果；raw log 與完整首次 18／重啟 19 個 case 契約仍必須吻合。這些反例不是原生引擎或真人驗收。

41 個定向案例已通過，涵蓋實際 production callbacks、兩種事件順序、
同值 foreign-before、單次／重複 load、保存失敗、初次 spawn、無 before
API 及不復活被拒 row。這是 fixture／source 證據，**新 exact native
first/restart 仍 pending**。Effect 事件沒有 after-only 生產者欄位；若外部
只提供與原生重播完全相同的 after，來源不可由該事件單獨區分。本方案是
明列三事件前提的有界適配，不能宣稱涵蓋任意外部 producer。

## 多行 UI 的隔離候選

[tools/client-parity](../tools/client-parity/README.md) 可產生全新目錄、獨立
UUID／版本的診斷 overlay，不改正式 runtime、世界板面或正式包身份。
使用同一 native factory 與完整 board title／field marker，分支互斥
visible／enabled／focus／text binding；保留 foreign 分支、兩個 dropdown
索引和原 guide 動畫。三種長度 320／350／1500、真換行與字面 `\n` 分開測。
這是可審的候選接線；未有真人結果，沒有 production 入口或多行已修宣告。
鍵鼠／觸控／手柄的 Enter、焦點、捲動、回傳索引及外部表單共存須逐項測。

## 尚未相同的部分與交付界線

| 分類 | 仍未完成的項目 |
| --- | --- |
| 已實作，欠本候選真人驗收 | 板面描邊／裁切、RGB／PBR／透明／mip、粒子、機器動畫相位、四動畫物品、雙手／第一第三人稱／FOV、聲音、交易與 guide 的實際鍵鼠／觸控／手柄操作。 |
| 已有具體 API／原生證據的範圍限制 | Effect 不提供完整 foreign ambient／showParticles／來源；三份任意非堆疊原料的既試原生 nested-container 路徑失敗；camera 公開 spline 路徑使用 free preset，尚無保留原生 first-person／瞄準／手持／外部所有權的 additive 證明。這些限制不宣告所有替代方案永遠不可能。 |
| 本輪仍未實作／未接線 | 純相機 roll、正式原生 multiline、整體玩家 renderer 隱藏／清除既有 target、真正穿牆 Glowing、原生全域 reach／step-height／XP pickup、掉落雪克杯 3D 與 GUI 2D 分離、World Liquor Luck 及完整跨模組事件語義。板面 feet／望遠鏡距離條件、HUD 即時消失、foreign writer 與部分分支事件差異亦未閉合。 |

[官方 camera spline 說明](https://learn.microsoft.com/en-us/minecraft/creator/documents/update1.26.0?view=minecraft-bedrock-stable#camera-splines-experimental-creator-camera)
限制為 free preset；[1.26.10 更新](https://learn.microsoft.com/en-us/minecraft/creator/documents/update1.26.10?view=minecraft-bedrock-stable)
已將 spline API 穩定化，2.7 有三軸 rotation。不能稱 API 完全不能 roll，
也不能把 free-camera 動畫當成已驗證的 additive overlay；玩家仍可轉向
或互動，不等於動畫鏡頭自動追隨原生瞄準。實際 hand rendering 和其他
camera owner 的保全仍需獨立 client 證據。

本候選的 source／archive 如上；兩庫最終 PR／CI 和 paired native 結果另以精確
提交記錄；舊候選與舊配套成功不繼承為新組合成功。完整私人家族／BSM
checkpoint、停服一致備份、存檔演練、准入部署及讀回尚待本次完成。
最後記錄的 LIVE T132／G119／W110 不是本次新讀回。既有 LIVE 持續授權
不變；保留 client=false、production_ready=false、pending_client_acceptance，
不把零玩家 BDS 或靜態資源通過稱作真人、一比一或 LIVE 成功。
