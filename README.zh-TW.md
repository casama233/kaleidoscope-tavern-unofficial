# 森羅物語：酒館 C7 — 家具／文字／世界生成、燃燒瓶與來源式酒嘴

**C7 是功能開發測試版，不是正式發布版。沒有在本環境啟動 Minecraft、手機、Realms 或 BDS；原生長按與手腕／杯嘴位置因此仍不能標為實機確認。** C7 包含 C1–C6，繼續依賴使用者提供的 Kaleidoscope Cookery v1.0.6，酒館指南／配方書及附屬 API 仍與 Cookery 本體分離。

## 本輪新增

| 系統 | C7 已實作 | 明確差異／待驗收 |
|---|---|---|
| 調酒長按診斷 | 保留原生 `itemStartUse/release/stop` 路徑；新增 `/function kt_c7_native_probe` 顯示實際事件計數與杯嘴 locator | 本環境沒有 Minecraft 客戶端，**不能宣稱原生長按已實機通過**；雙點相容模式不能替代驗收 |
| 手腕／杯嘴 | 杯嘴沿用原模型 `root/kt_spout=(-3.5,11,0)`；第一／第三人稱候選集中在 calibration 資料 | 腕部仍 `NOT_CALIBRATED`；需 Steve/Alex、FOV、觸控實機截圖調整 |
| 專屬酒效 | 新接微醺、高跟鞋、穿草隱身、靈視、醇熱、摸金校尉、倒立；沿用 C5/C6 的血腥瑪麗、XP Drain、Zenith、Shriek | `Long Reach` 仍沒有可信的穩定 per-player 交互距離等價能力，不用其他 buff 冒充；部分效果是有文件的 Bedrock 適配 |
| 沙發／吧檯／桌 | 沙發16色跨色自動連接＋原生座位；吧檯六種連接；桌 X/Z 行連接 | 水浸、精確聯集碰撞與實際玩家坐姿待引擎驗收 |
| 展示家具 | 酒櫃2、玻璃酒櫃2、酒窖櫃9、傾斜架3、圓架6、Holder1、杯架4；真實物品資料保存＋來源錨點 helper | renderer helper 的姿態、透明排序及網路同步待實測 |
| 黑板 | 小1×2/350字、大3×2/1500字，三空白板自動合併；16色、左中右、發光、蜂蠟、8格編輯鎖 | 世界文字使用 nameTag helper 適配，不是 Java 字體／glow renderer 1:1 |
| 野生葡萄／氣候 | loaded-chunk 野藤生成；冰/金葡萄加入冷/熱環境 proxy 的0.8加速 | 不是 Java 原版 tree decorator 注入或 biome base-temperature 精確值 |
| 燃燒瓶 | 原熔岩酒桶配方啟用；按住至少10tick投擲；來源半徑3＋外延2格點火概率 | Bedrock 可放火判斷為安全適配；請只在測試場驗收 |
| 酒嘴 | 改為「來源在後、容器在下」，30tick 才結算、前5tick滴液；revision/容器變更取消 | 酒桶、熔岩煉藥鍋→燃燒瓶、西瓜→西瓜汁、蜂巢/蜂箱→蜂蜜瓶、龍首→龍息瓶已接；紅石及水煉藥鍋仍待後續 |

| 家具手持 | 背包继续使用源模型渲染图标；57个有来源3D item display的家具/灯具改用 attachable 候选 | 直接沿用 Java first/third-person display 数值，左右手/Bedrock手腕坐标仍须实机校正 |

C7 啟用 Molotov 後，內建機器配方為 **42 = 24 酒桶 + 6 壓榨 + 12 調酒**。舊 C6 的「41配方」是歷史狀態，不是回歸失敗。

## 安裝

1. 備份，建立新的測試世界。
2. 啟用你提供的 **Cookery v1.0.6 BP/RP**。
3. 啟用 `Tavern-C7-Gameplay-DEV.mcaddon` 的 C7 BP/RP，酒館 RP 放在 Cookery 上方。
4. 不要同時啟用 C1–C6、A17 VisualLab 或 PoseLab。

C7 沿用 Tavern UUID，版本提高到 **`[0,7,0]`**。Cookery 依賴仍為 BP `10f37ae2-9ccf-435f-b34b-0eec8191cd94`、RP `c89dc8df-c3fc-4bc8-8bd0-527abba76681`，皆 `[1,0,6]`。Script API 仍沿用實包基線 `@minecraft/server 2.7.0` / UI `2.0.0`；不是最新 API 聲明或實機相容認證。

## 測試套件

```mcfunction
/function kt_c7_kit
```

只給物品，不清空或自動建造世界。

### 原生長按 probe

```mcfunction
/function kt_c7_native_probe
```

先跑一次，實際拿滿料雪克杯按住／鬆手，再跑一次。只有 `native start` 和 `release` 計數真的增加，才能把**該客戶端**標為進入原生路徑。這個 probe 不會自動把 `engineAcceptance` 改成 PASS。

### 30 tick 酒嘴

1. 把酒嘴朝向酒桶，使來源位於酒嘴後方。
2. 潛行拿空酒瓶點支撐方塊上表面，先放一個 `empty_bottle_placed` 到酒嘴下方。
3. 點酒嘴開啟。前5tick滴液，第30tick才變為實際品質成品。
4. 中途拿走/替換空瓶或酒桶 revision 改變時，本次取消。

Molotov 走相同下方空瓶流程；取出成品後按住至少10tick再投擲。西瓜、蜂巢/蜂箱、龍首、熔岩煉藥鍋也可作後方來源：分別得到西瓜汁、蜂蜜瓶、龍息瓶、燃燒瓶。蜂巢成功取蜜會降低一級 `honey_level`。水煉藥鍋目前刻意未接，避免把無法實機確認身份的普通 `minecraft:potion` 當成正確水瓶。

## 專屬酒效狀態

來源規則與適配差異見 `docs/C7-EFFECT-COVERAGE.json`。

- **來源規則/近似直接表達**：Vision、Tomb Raider、Upside Down，以及先前 Bloody Mary。
- **明示適配**：Slightly Tipsy、High Heels、Grass Stealth、Ardent Heat、XP Drain、Zenith、Shriek Attack。
- **仍待實作**：Long Reach（來源是 +3 block/entity interaction range）。

## 家具與庫存

沙發、吧檯和桌會定期重算鄰接外觀；沙發座位 helper 不保存物品。展示家具則由 world DP 保存真實物品；helper 只渲染，所以 helper 被清理後不会凭空补发/删除库存。

完整槽位与源 renderer 锚点说明见 `docs/C7-FUNCTIONS.zh-TW.md`。

## 黑板

放一个黑板建立 1×2 小板；三个空白、同向、相邻小板可合并为 3×2 大板。空手编辑，染料改色，萤光墨开 glow、墨囊关 glow，蜂蜡锁定。文字保存格式独立于当前 nameTag renderer，后续若换真正世界文字渲染层无需迁移文本数据。

## 野生葡萄

C7 不去伪造 Java 的 configured-tree decorator 注入。它在玩家附近已加载的主世界 chunk 只扫描一次 oak/birch 顶层叶片并做 deterministic 生成，保存 bitset 避免来回加载重复长藤。该策略属于 Bedrock 适配。

## 建置與測試

```text
python tools/build_runtime.py
python tools/validate_runtime.py
python tools/test_c7.py
python tools/audit_rebuild.py
python tools/package_c7.py
```

当前 C7 gate 使用仍有效的历史不变量测试 + 新 C7 测试；不会把旧版本“功能必须未实现”的断言硬改成绿勾。说明见 `docs/C7-REGRESSION-NOTES.zh-TW.md`。

**本环境未启动 Minecraft。** 实机清单见 `docs/ENGINE-TEST-CHECKLIST.zh-TW.md`。在原生长按、腕部/杯嘴、helper 渲染、返瓶、chunk、多人与存档升级没有真实记录前，`--production` 仍应拒绝输出。

## 仍未完成

- Long Reach 的源等价交互距离。
- 原生长按的真实平台确认，Steve/Alex/手机的精确手腕与杯嘴校准。
- Java 完整 Ardent Heat 护甲耐久／exhaustion、Grass Stealth 客户端真正隐藏等细节。
- 酒嘴红石自动触发及水炼药锅输出；蜂巢／西瓜／龙首／熔岩炼药锅已经接入30tick下方空瓶流程。
- 黑板 Java 字体/glow/精确行宽渲染。
- 世界生成与气候的 Java 级逐配置等价、水浸、自然爆炸/活塞物理。
- Minecraft/手机/Realm/BDS/真实存档升级验收。

原作美术继续使用冻结的 A17 来源，不重画、不包含字型、Java JAR/class 或 Cookery 本体。
