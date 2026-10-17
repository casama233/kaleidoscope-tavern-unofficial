# 龍頭逐項對照與多掉空瓶修補（2026-09-28）

## 範圍與版本

本次結論：**目前不是完全一比一。** 開關模型機制、正常接酒時間及基本取酒判定已對齊；空轉、滴液運動、完成粒子與部分邊界行為仍有差距。本批只修補接酒容器的重複掉落與回滾，不宣稱把所有動畫差距一起修好。

- Bedrock 對照基準：`f793a98a0180e1948f98e69a8ca879a028884e38`，0.6.63 beta / `v0.6.63-beta.1`。
- Java 對照基準：`c4ec1880bd44cf3139d3ba744ab30bb379cf1416`。
- 本地驗證使用該 Bedrock 提交的發布工作流 36367516792、artifact 10947644308 內的 mcaddon 解包內容；`machines.js` 原始 Git blob 為 `0110c570dc2d36b236a4faaa4e6ac8d01fa1a3b7`，與 GitHub 同一提交吻合。
- 修補後 `machines.js` Git blob：`f10cbab0c5b517a0fc8ff3949c2ad62dd3608313`。
- 本批未改版本、release-request、世界存檔、部署設定或 Java 上游；需經 PR 審查及原生驗收。

## Java 與原基準實作對照

| 項目 | Java 原版 | Bedrock 原基準 | 判定 |
| --- | --- | --- | --- |
| 開關外形 | `OPEN` 切換 `brew/tap/open` 與 `close` 靜態模型，開啟把手為 45 度；沒有逐幀平滑旋轉 | open 狀態切換 `tap_open.geo.json` / `tap_closed.geo.json`；七個部件尺寸、位置可對上，座標轉換後把手角度為 -45 | 模型切換機制一致；不是欠缺原版的平滑動畫。未做客戶端逐像素驗收 |
| 桶的連接位置 | 桶第二層正面中央，龍頭朝向與桶相同 | `findTapCore` 要求 dy=1、正面中央 dx/dz、相同朝向 | 判定邏輯一致 |
| 正常接酒時序 | 開啟，排程 30 tick 後关闭，再驗證來源／容器及取酒 | `tryOpenTap` 排程 30 tick，完成時先關閉再取酒 | 正常流程一致；重開與來源替換等邊界不可等同 |
| 開關音效 | 鐵活板門，volume 1、pitch 0.8 | 對應 Bedrock 鐵活板門，volume 1、pitch 0.8 | 事件及參數對齊，未做聽感驗收 |
| 滴液父粒子生成 | 僅前 1–5 tick，每 tick 一個，座標 x+0.5/y+0.25/z+0.5 | 相同五個 tick 與生成座標；普通酒用水，燃燒瓶用岩漿 | 生成時間、位置與分流對齊 |
| 滴液運動 | `TapDripParticle` 壽命 18 tick；每次 preMove 在父粒子當前位置及速度生成 vanilla falling drip；postMove 每軸速度乘 0.02 | 父粒子壽命 0.9 秒，emitter timeline 固定 18 次 child emitter；動態阻力係數 0.02，child 初速 0 | 近似而非同一運動公式。速度乘數不等於阻力係數；emitter 時間線不等於移動中父粒子的 preMove |
| 空轉效果 | `CLOUD`，tickCounter 偶數時生成；判斷 `tickCounter > 5`，因此第 6 次 BE tick 才關閉，可在 2/4/6 生成 | `basic_smoke_particle`，在 2/4 生成、5 tick 關閉 | 粒子種類、次数與嚴格時序都不同；本批未改 |
| 成功完成效果 | 釀造台音效，另發 10 個 `WAX_OFF`：x+0.5/y-0.5/z+0.5，spread 0.25，speed 0.1 | 有釀造台音效，該完成路徑沒有 `WAX_OFF` | 缺完成粒子；本批未改 |
| 已放置空瓶換酒 | `placeBottleResult` 直接換方塊，保留朝向並存入實際品質；不退空瓶 | 先 `setType(air)`，再放酒瓶及写品质 | 本批改為原地替換，並加入腳本替換免掉落保護 |
| 地上空瓶物品堆 | 消耗一個，原 ItemEntity 保留剩餘堆疊；可放置時放出成品，否則掉成品 | 消耗一個，但用 clone / spawn remainder / remove original 重建剩餘實體 | 數量語義對齊，實體身份／物理動作不是完全相同；本批不改 |
| 一般 BlockItem 成品 | 除 BottleBlockItem 外，仍可直接放成一般方塊 | `createTapOutput` 只對 `parseBottle` 成功的酒瓶放方塊；其他成品走掉落 | 一般方塊產物分支仍有差距，本批不擴充 |
| 紅石 | 監看龍頭或其上方方塊的鄰近信號，使用 TRIGGERED 鎖定上升緣 | `onRedstoneUpdate` 使用 powerLevel / previousPowerLevel，忽略 firstUpdate；未明確複製上方方塊檢查 | 不可宣稱紅石完全一致；需要原生線路驗收 |
| 行為分派 | TapBehaviorManager 查表；完成時重新按當前來源選擇 behavior | barrel / water_cauldron / tap-sources 分支，保存 session kind 及來源位置 | 平台實作不同；來源中途替換等情況不應當成已驗證一致 |

## 多掉空瓶的根因

`bottle_empty.json` 有 `kaleidoscope_tavern:natural_break`。`naturalBreak` 會把已破壞的 `bottle_empty` 轉成一個 `empty_bottle` 掉落。倉庫既有 `scripted-block-change.js` 已記錄：腳本替換方塊也可能排入 `onBreak`，所以正常的腳本交易必須先登記免自然掉落 token。

原 `consumeTapCarrier` 直接 `block.setType('minecraft:air')`，跳過了該保護；接著成品被放下，舊空瓶的回呼卻再掉一個空瓶。這不是 Java 的容器返還機制，也不能用刪掉整個 `natural_break` 解決，否則正常破壞會丟失應有掉落。

修补內容：

1. 已放置空瓶且結果是已登記酒瓶時，直接空瓶 → 酒瓶，不再經過中間 air；保留原朝向、品質與一次扣除一份成品。
2. 轉換、非酒瓶結果的容器移除、成品回滾及容器回滾，全部走現有 `replaceBlockWithoutNaturalDrops`。來源空瓶回呼和被回滾的酒瓶回呼均不能掉出額外物品。
3. 成品物品型別在扣容器之前檢查，缺少附屬產物時不消耗容器或成品。
4. `finishWaterCauldronTap` 的空瓶 → 水瓶也使用同一保護。
5. 真正破壞空瓶仍掉一個空瓶；真正破壞酒瓶仍釋出儲存的對應品質。

## 驗證與限制

執行：

```sh
node --experimental-vm-modules --test tools/tap/tap-regression.test.mjs
```

Node 22.16.0，本地結果：未修基準 19 項中 5 通過 / 14 失敗；修補後 19 通過 / 0 失敗。失敗數是測試案例數，不是 14 個獨立 bug。

測試載入真實 `machines.js`、`natural-break.js`、`scripted-block-change.js`、core 狀態及品質邏輯。只將引擎 API、無關渲染／輸入模組替換為測試 double，注入同步及下一 tick 的破壞回呼與存儲／放置失敗。

涵蓋四向已放置瓶子、最後一瓶、地上單瓶及帶 nameTag 的堆疊餘量、普通非方塊成品、酒桶寫入失敗、酒瓶狀態寫入失敗、放置失敗、未知成品、水煉藥鍋接瓶、真正破壞空瓶／酒瓶、完成時容器消失、正常 30 tick / 前 5 tick 滴液及中途手動關閉。

**這不是 BDS、Minecraft 客戶端或真人輸入驗收。** 未宣稱完整 release 檢查、多人競態、原生粒子呈現、引擎實際回呼延遲或所有 addon 組合已通過。本批沒有使用 simulated player。

原生驗收重點：在實际目标 BDS 版本以真人放瓶、開龍頭，觀察地面沒有額外空瓶；檢查桶內只少一份、取回酒的品質正確；單瓶／多瓶掉落物及最後一份各做一次；再正常敲碎空瓶和成品，確認正常掉落未被誤抑制。動畫缺口必須另以 Java 對照錄影驗收，不能用本批交易測試替代。

## 固定原始碼索引

以下 Java 路徑均位於 `src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/`，以頂部固定提交為準：

- [TapBlock：開關、紅石、排程及完成重新判定](https://github.com/KaleidoscopeMods/KaleidoscopeTavern/blob/c4ec1880bd44cf3139d3ba744ab30bb379cf1416/src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/block/brew/TapBlock.java)
- [TapBlockEntity：30/5 tick、CLOUD 及空轉第 6 tick](https://github.com/KaleidoscopeMods/KaleidoscopeTavern/blob/c4ec1880bd44cf3139d3ba744ab30bb379cf1416/src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/blockentity/brew/TapBlockEntity.java)
- [BarrelTapBehavior：接桶位置、粒子分流及完成音效](https://github.com/KaleidoscopeMods/KaleidoscopeTavern/blob/c4ec1880bd44cf3139d3ba744ab30bb379cf1416/src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/game/tap/impl/BarrelTapBehavior.java)
- [BarrelBlockEntity：transformPlacedCarrier / transformItemCarrier / placeBottleResult](https://github.com/KaleidoscopeMods/KaleidoscopeTavern/blob/c4ec1880bd44cf3139d3ba744ab30bb379cf1416/src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/blockentity/brew/BarrelBlockEntity.java)
- [TapDripParticle：父子滴液與速度衰減](https://github.com/KaleidoscopeMods/KaleidoscopeTavern/blob/c4ec1880bd44cf3139d3ba744ab30bb379cf1416/src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/client/particle/TapDripParticle.java)
- [ITapBehavior：10 個 WAX_OFF 完成效果](https://github.com/KaleidoscopeMods/KaleidoscopeTavern/blob/c4ec1880bd44cf3139d3ba744ab30bb379cf1416/src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/api/blockentity/ITapBehavior.java)
- [模型開啟](https://github.com/KaleidoscopeMods/KaleidoscopeTavern/blob/c4ec1880bd44cf3139d3ba744ab30bb379cf1416/src/main/resources/assets/kaleidoscope_tavern/models/block/brew/tap/open.json) / [模型關閉](https://github.com/KaleidoscopeMods/KaleidoscopeTavern/blob/c4ec1880bd44cf3139d3ba744ab30bb379cf1416/src/main/resources/assets/kaleidoscope_tavern/models/block/brew/tap/close.json)

Bedrock 對照檔：`runtime/BP/scripts/bedrock/{machines,natural-break,scripted-block-change,tap-sources}.js`、`runtime/BP/blocks/{tap,bottle_empty}.json`、`runtime/RP/models/entity/tap_{open,closed}.geo.json` 及 `runtime/RP/particles/{water,lava}_tap_drip*.json`。
