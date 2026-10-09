# 0.6.132：濺射效果、雪克杯交易與指南動畫

本批從已合併、已發布的 T131／L108 接續，配對 **Tavern 0.6.132、
World Liquor 0.1.109**。Grilling 仍為已合併的可選 G119
`b010ec2a6709ada74ed96ead19c60da4e0bc2789`。本次沒有宣稱畫面、
沉浸感和操作已全部一比一；剩餘差距集中在 [PARITY-MATRIX](PARITY-MATRIX.md)。

## 已修的玩家行為

| 行為 | 原有問題及本批修法 | 可分辨的場景 |
| --- | --- | --- |
| 投擲儲存酒瓶的瞬時效果 | 濺射仍使用舊 signed-delta 計算，繞過飲用的 Java 類別、反轉、整數溢位、浮點收窄與治療 hook。現在共用 dispatcher，保留距離衰減及直擊完整強度。 | 相同酒液分別飲用、近距濺射、直擊；自訂零原始治療量經宣告 hook 後仍能治療，負溢位不會改變治療／傷害操作。 |
| 濺射免疫與來源順序 | 補上獨立的 `isAffectedByPotions` 政策。盔甲座在整串濺射前排除；每個目標只在效果迴圈前判定一次，前一列效果不能吞掉後一列的來源 hook。 | 盔甲座同時收到治療及速度濺射均不生效；第一列致死後仍執行來源允許的後續列，但不復活。 |
| 站台持物互動 | 原生 component 只回補空手，可能漏掉主手持合法原料的操作。現在使用實際命中的站台回補 block-use，維持原版主手加料。 | 沒有 before／item-use ray 回呼時，原生持瓶點擊仍加一份；副手不變成額外站台加料入口。 |
| 同一手勢誤拿回雪克杯 | 最後一份原料消耗後、副手放置後，晚到的原生回呼可能把空手重新解讀為拿取。成功交易現在保留前後手部狀態及真正放置目標。 | 最後一瓶加入後站台保留；副手放置後不立即拿回；新的正式第一個手勢仍可立即取杯。 |
| 寫入失敗後重試 | 前一次成功的 callback cache 可能攔下後一次已回滾的操作。失敗時僅清同玩家、槽位、物品、方塊的紀錄，保留不同目標和較新交易。 | 原生成功一次、下一次寫入失敗並回滾、立即原生重試只加一份。 |
| 原生物品保存回滾 | 第一個清槽或持久欄位寫回失敗，會跳過其餘清理。現在各槽、載體移除、pointer 和 required marker 分別嘗試，仍失敗則明確回報。 | 注入第一槽清理失敗仍移除新載體；pointer 回寫失敗仍恢復 required marker，重試不操作已移除容器。 |
| 感知的生物目標 | 有生命值的載具可能被選取；先套效果再選下一目標也會改變原版查詢結果。現在先完成 LivingEntity／存活／AABB 名單再套效果，共用類別適配亦納入未帶 Native `mob` family 的已知魚類。 | 同範圍的船不觸發、牛／盔甲座／鱈魚觸發；第一個效果改動後續目標時，查詢時的名單仍保留。 |
| 指南四個動畫圖示 | 深水炸彈、神祕雞尾酒、下界特調、冰葡萄原為靜態圖。新增精確路徑與檔案系統分流的 UI flipbook，保留其他圖示。 | 開啟對應條目，核對畫格、透明邊界與不同 UI 包順序；七入口及共用附屬內容不變。 |
| 板面文字與 HUD 尾巴 | 字面反斜線／`\n` 可能在再次提交時變成換行；現在明確編碼兩種字元。材料槽移除額外 0.1 秒淡出，保留 0.5 秒局部到期等待。 | 重新開啟並提交同時包含字面 `\n` 和真換行的板面，文字不變；停止操作時觀察材料槽尾巴。 |

## 來源與相容邊界

原作分支本輪重新核對為 Forge 1.20.1 `c4ec1880bd44cf3139d3ba744ab30bb379cf1416`、
NeoForge 1.21.1 `a1afba34981a00e89d57130d3dc8f1e64f1820a2`，以及獨立的
NeoForge 26.1.2 `9b8f165a4641e738e694641dd81240a0206573e1`。
站台取／放／加料順序來自 `ShakerBlock`、`ShakerBlockEntity` 和
`ShakerItem`；感知來自各分支的 `VisionEffect`。

濺射沿用 T122 的 NeoForge **1.21.1** 效果政策。Mojang 官方 JAR 與
mappings 經 SHA-1 核對後，實際 bytecode 顯示：1.20.1 的
`LivingEntity.isAffectedByPotions` 固定 true；1.21.1 為
`!isDeadOrDying`；兩版盔甲座均 false。這不是兩個分支完全相同的證明。
新 `affectedByPotions` 宣告接受 `false`、`true`、`"alive"`；舊 schema 1
資料仍可飲用，未宣告的自訂瞬時濺射保持 unknown，待同 owner 更新。
未知自訂類別的 timed/custom 濺射保留既有 family 適配，完整 Java
class／override 還原仍未完成。[共用協定說明](INSTANT-HEALTH-DISPATCH-PROTOTYPE.md)
列出完整欄位與不支持的行為。

原生傷害使用可用的 `magic + owner`，無 owner 時不指定 attacker。
診斷明列 `magic_owner_only`；沒有把 direct projectile、Java damage tags、
擊退或跨模組事件階段宣稱完成。既有實測也顯示 `applyDamage` 的 API
acknowledgement 可能先於後續取消；它不是最終已造成傷害的證明。

指南使用固定 Mojang UI 範例
[`46ba6ea985fb5a92d79a9419198f10dda14c199d`](https://github.com/Mojang/bedrock-samples/tree/46ba6ea985fb5a92d79a9419198f10dda14c199d/resource_pack/ui)
的 `flip_book`。四張圖展開為 10／18／80／24 個遊戲刻畫格，20 fps；兩個
插值素材以未修改的 Mojang 1.20.1 `SpriteContents$InterpolationData`
獨立驗證全部 RGBA，見 `tools/fixtures/guide-animation-java-reference.json`。
只有四個精確本包路徑且 `InUserPackage` 才切換；未知值保留原生靜態圖。
每次表單建立有自己的 UI 時鐘，尚未同步 Java 全域 atlas 相位。

## 驗證與交付

三個代理與主代理分工實作並交叉審查，使用真實 production callback 搭配
API doubles 重現加料／echo／回滾、濺射／hook、魚類及查詢順序反例。
指南來源像素、生成器重建、板面 round-trip、HUD 到期與官方原生根節點
保留檢查均有定向證據。完整必要套件以本批確切 PR 的 CI 為準；
不將舊 T131 的成功改寫成本批結果。

既有 `native-persistence` lane 在選取元件保存測試後載入完整 T132／L109
BP/RP，核對實際附屬註冊、原生雪克杯 metadata migration、PUT 恢復，並在
同一次首次／正常重啟場景加入濺射與感知。使用真正 Entity、ItemStack、
查詢、傷害及事件 API；impact event envelope 和特殊效果 payload 是明列
的 observer 輸入，不能稱為物理投擲碰撞或真人使用。
原生報告分開記錄引擎、兩庫來源、凍結包、測試 overlay、API acknowledgement、
實際 HP／事件、零玩家和正常退出。結果由 CI 產出，不預先宣告通過。

首輪 [CI 37865527379](https://github.com/casama233/kaleidoscope-tavern-unofficial/actions/runs/37865527379)
保留原始失敗：封裝 guard 仍指向舊 callback 名稱；原生 observer 誤把船當作
帶生命值的排除見證。[第二輪 CI](https://github.com/casama233/kaleidoscope-tavern-unofficial/actions/runs/37866278725)
的封裝已通過，但經驗球的複合前置判斷仍失敗。
[官方固定樣本](https://github.com/Mojang/bedrock-samples/blob/46ba6ea985fb5a92d79a9419198f10dda14c199d/behavior_pack/entities/xp_orb.json)
有 health／inanimate，Java 1.21.1 bytecode 亦確認 `ExperienceOrb` 直接繼承
`Entity`；這些不等於目標 Script API 已暴露同樣元件。

新版 observer 逐項記錄經驗球在生成即時及一 tick 後的實際元件、生命值、
family 與讀取錯誤，未知值保留 null。另加入明列的測試專用 health helper，
硬性要求真正 Native health > 0、`inanimate` 且非 `mob`，保留 health-only
錯誤判定必須失敗的反例；這是 adapter policy 測試，不是 Java class 反射。
原版鱈魚仍須明確無 `mob` 且入選，helper 與原版經驗球均排除，精確三目標
及一次回饋保持不變。新增測試實體列入 overlay 清單與摘要，凍結 runtime
不變。完整首次／重啟結果以 PR 最新提交的 CI 為準，兩次原始失敗不改寫。

W109 只同步 BP/RP、module、payload 和 T132 相依身分，保留其既有玩法與
G119 helper 修復。兩庫互用不可變提交；版本、全包 digest 與發布讀回由
baseline/history、family lock 和 release request 約束。

## 仍需完成的驗收

板面仍使用單行 escape 編輯器。官方有 multiline primitive，但尚未找到
足夠可靠的單一 factory 動態接法；兩套輸入僅以 visible 切換的候選已撤回，
沒有改寫其他表單的輸入、焦點或提交。HUD 停止也不是即時：材料槽仍有
0.5 秒等待，進度保留 0.05 秒。

真人需在同一候選比較鍵鼠／觸控／手柄、主副手事件、GUIDE 圖示分流與
動畫相位、板面文字、隔牆感知輪廓、GUI／快捷欄／掉落幾何及聲音。
穿牆輪廓、純相機 roll、任意 RGB 陰影、掉落 3D／GUI 2D 分離、完整三份
任意 ItemStack、身體粒子和原生效果階段仍保留原有未完成記錄。

實際私人 BSM／LIVE 世界／quality 入口在本工作區不可用，完整家族組裝、
fresh stopped-world 演練、備份、准入、部署及讀回尚待真實連線。
既有持續 LIVE 授權保持有效；本批 `client=false`、`production_ready=false`、
`live_deployment=false`，沒有把獨立零玩家 BDS 當作真人或 LIVE 成功。
