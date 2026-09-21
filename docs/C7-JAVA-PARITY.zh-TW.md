# C7 Java 1.2.0 ↔ Bedrock 差異核對

比對基準：
- Java 正式版：Kaleidoscope Tavern 1.2.0。
- 上游原始碼：`KaleidoscopeMods/KaleidoscopeTavern@c4ec1880bd44cf3139d3ba744ab30bb379cf1416`（2026-07-21）。
- Bedrock：本倉庫 C7 / 0.7.0，目標 1.26.50，`@minecraft/server 2.7.0`。
- 這是來源與程式層核對；Minecraft / 手機 / Realms / BDS 實機驗收仍為 NOT_RUN。

## 本輪完成

| Java 機制 | C7 | 剩餘跨版差異 |
|---|---|---|
| Tomb Raider / 摸金校尉 | 已接入：效果存續期間，對原作 tag 內目標造成傷害時 30% 機率卸下主手；耐久物降到剩 1 耐久後掉落 | Java ItemEntity 的 40 tick 拾取延遲沒有等價穩定 Script API；Bedrock zombified piglin ID 映射為 `minecraft:zombie_pigman` |
| Upside Down / 倒立 | 已接入：瞬時掃描施用者 AABB inflate(16) 相交的存活 Mob，命名為 `Grumm` | Bedrock Script API 沒有等價 `customNameVisible(false)` 旗標；名稱顯示方式由客戶端規則決定 |

因此 12 種 Java 專屬效果中，C7 已有 6 種規則／適配：Bloody Mary、XP Drain、Zenith、Shriek Attack、Tomb Raider、Upside Down。仍缺 6 種：Slightly Tipsy、High Heels、Grass Stealth、Vision、Ardent Heat、Long Reach。

## 尚未完全等價的主要系統

| 系統 | 現況 | Java 尚有而 Bedrock 未完成 |
|---|---|---|
| 酒桶／壓榨／酒嘴 | 23 酒桶配方、6 壓榨配方、品質與主要取酒流程已接 | 下方容器自動接酒、特殊水／西瓜汁取液、水浸酒嘴/酒桶行為 |
| 調酒 | Shaker、Signature Cocktail、12 調酒配方、14 雞尾酒族已接 | 部分原作動態表現仍需實機校正 |
| 酒效 | 6/12 專屬效果已有規則或明示適配 | 微醺鏡頭 roll、高跟鞋 step height、穿草隱身仇恨清除、靈視 glowing、醇熱破石/飢餓/護甲、長臂 reach |
| 種植 | 藤架、三種葡萄、採收/蠟封/骨粉已接 | 野生葡萄世界生成、冰/金葡萄依 biome temperature 的 0.8 加速、水浸 |
| 家具 | 16 色高腳凳 + 17 款彩燈 | 16 色沙發、桌、吧檯、黑板、展板、掛畫、吊燈、人字梯，以及其連接/乘坐/文字互動 |
| 儲存/展示 | 飲品瓶堆與空杯相關基線已接 | 酒杯架、吧檯櫃/玻璃吧檯櫃/酒窖櫃、傾斜/圓周/單體酒架完整庫存與展示規則 |
| 香薰 | 未接 | 8 種 Incense 的開合、粒子、32 格亡靈傷害與殭屍村民低血量轉化 |
| 戰鬥道具 | Shriek 已接 | Molotov 投擲/燃燒/發射器行為 |
| 原版瓶類展示 | 自訂酒瓶族已接 | 水瓶、蜂蜜瓶、龍息、藥水、經驗瓶等原作可擺放瓶類尚未完整覆蓋 |
| 世界/自然互動 | 以安全保全策略為主 | 原作自然破壞、水浸、部分碰撞與動態粒子仍未 1:1 |

## 六個剩餘效果的阻塞分類

- **可繼續用穩定 API 做適配：** Ardent Heat 的衝刺判定/方塊區域、Vision 的範圍掃描部分。
- **需要跨版設計或 API 缺口：** Slightly Tipsy 的鏡頭 roll；High Heels 的 step-height attribute；Long Reach 的 block/entity reach attribute。
- **目前穩定 API 不足以 1:1：** Grass Stealth 需要直接清除 Mob target，而現行公開 target 操作仍不適合本包的穩定 2.7.0 契約；Vision 還需要 Java Glowing 的等價客戶端輪廓效果。
- **不得用任意 Buff 假裝完成。** 缺口會留在 coverage 中，直到有來源等價或明示適配方案。
