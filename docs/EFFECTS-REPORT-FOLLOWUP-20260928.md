# 特效報告逐項修補：2026-09-28 follow-up

## 修訂基準與驗收邊界

本分支承接已存在的 `fix/effects-parity-20260928` 修補提交 `3ced3c48ef00d74b7712a88bd6d7d7be72389de4`，不是重新覆蓋主分支。該提交包括 PR #93 的龍頭空瓶交易修補。本輪分支為 `fix/effects-report-followup-20260928`；起始遠端修訂 `6faf144597b065d4b857ad00a1aadf81b682b2cd` 已加入擴充的原版證據蒐集器。

原版固定為 `KaleidoscopeMods/KaleidoscopeTavern@c4ec1880bd44cf3139d3ba744ab30bb379cf1416`（Minecraft Java 1.20.1）；原報告的移植版基準為 `f793a98a0180e1948f98e69a8ca879a028884e38`（0.6.63）。本次沒有改版本、合併 main 或發布 Release。

**這是程式修補與驗證紀錄，不是「畫面已全部一模一樣」的驗收證書。** 分別標示已補的程式路徑、來源参数及仍有差異的部分；沒有使用模擬 Minecraft 玩家，沒有聲稱執行過 BDS 或真人客戶端。

## 原報告的 30 項追蹤

「承接」是既有 3ced3c4 修補，本輪保留並重新測試；「本輪」是新增的實際程式變更。所有項目都尚缺兩端同場景真人錄影驗收。

| 報告 ID | 項目 | 本分支狀態與剩餘差異 |
|---|---|---|
| TAP-01 | 水／岩漿滴流 | 承接：30 tick 接取、前5 tick父粒子、20Hz遞推及子滴液；著地衍生粒子／聲音、液體表面相交仍未完成。 |
| TAP-02 | 空龍頭 | 承接：CLOUD於2／4／6 tick各一次、第6 tick關閉；附近玩家高度吸附行為仍有差異。 |
| TAP-03 | 接取完成 | 承接：7種來源成功交易後10顆WAX_OFF，正確位置、高斯散布與速度；失败不冒成功粒子。 |
| PRESS-01 | 已知原料碎屑 | 承接10顆與參數；本輪按完整物品ID及Java模型粒子貼圖擴展，不用物品圖示猜模型碎屑。 |
| PRESS-02 | 未知／錯誤原料碎屑 | 本輪取消「外部grape冒本地葡萄／所有未知物品冒木屑」。靜態模型圖集239個ID（含隱藏方塊）、另16色高腳凳羊毛／24種原版物品及既有果實；新增第三方粒子註冊。未註冊、動態模型及動畫貼圖仍未完整復刻，會記錄診斷。 |
| PRESS-03 | 空踩／滿桶水花 | 承接10顆RAIN；本輪乾桶空踩用桶材質的BLOCK粒子建構子，而非ITEM木屑。RAIN著地分支仍有差異。 |
| SHAKER-01 | 投料氣泡 | 承接8顆BUBBLE_POP、杯口位置、散布及容器／固體音效分流。 |
| SHAKER-02 | 倒出成品 | 承接20顆EFFECT、三軸高斯散布.1、速度.5及正確瓶裝聲；不是20次多粒子原生emitter。 |
| MYSTERY-01 | 神秘雞尾酒 | 承接每觀察者的Java取樣、單顆EFFECT及隨機速度／位置。 |
| BOARD-01 | 黑板／展板上蠟 | 承接10顆WAX_ON與染料／墨囊／蠟音效；保留既有五種水平／三種垂直文字對齊。 |
| TRELLIS-01 | 藤架上蠟 | 本輪補回事件3003：六個面各3～5顆、法線方向速度0；保留Java use與levelEvent各一次上蠟聲的源碼行為。 |
| TRELLIS-02 | 藤架除蠟 | 本輪補回事件3004的六面粒子與除蠟聲，只在成功交易後執行。 |
| LIGHT-01 | 燈串染色 | 本輪補回2005生長粒子：中心必發，其餘15個候選點按下方非空氣篩選；同色與交易失敗不發。 |
| GLASS-01 | 打碎已放置瓶／杯 | 本輪補回完整玻璃方塊4×4×4＝64碎片，而非縮小瓶形／單一玻璃emitter；音量1、音高.8。碰撞／光照仍需原生驗收。 |
| GLASS-02 | 已放置酒瓶碎裂後濺射 | 本輪以最高品質內容建立零初速投擲酒瓶，位置採原版整數方塊原點、保留射手；不再立即套用效果後冒水花。建立失敗保留原瓶與資料。 |
| RACK-01 | 酒架發射普通酒瓶命中 | 本輪補回8片ITEM＋100顆EFFECT、原版位置／速度／setPower／染色與音效；無效果飲品也濺射；重複命中只結算一次；移除BP重複命中聲。 |
| RACK-02 | 圓形酒架光點 | 承接Java附近方塊取樣、1／8機率及有內容才冒END_ROD；不再固定每秒一次。 |
| INCENSE-01 | 香薰觸發／密度 | 承接每玩家每tick667組半徑16／32三角取樣；開啟每次5大型、關閉保留1／3機率小粒子。舊方塊註冊延遲／裁切與性能仍未真人驗收。 |
| INCENSE-02 | 八種小粒子 | 承接40～59 tick、水平隨機擾動與×.95衰減、最後25%淡出；不再連續無阻力直飛。 |
| INCENSE-03 | 櫻花大型 | 承接CherryParticle自由飛行、300tick；Java AABB碰撞／光照仍不同。 |
| INCENSE-04 | 松香大型 | 同上，保留對應松針貼圖與選幀。 |
| INCENSE-05 | 銀杏大型 | 同上，保留1.5倍縮放。 |
| INCENSE-06 | 雪大型 | 同上，保留對應雪花貼圖與選幀。 |
| INCENSE-07 | 孢子大型 | 承接原版滴狀圖、顏色、500～1000tick與懸浮建構子；光照／裁切未驗收。 |
| INCENSE-08 | 貓薄荷大型 | 承接懸浮建構子及尺寸／速度／壽命分布；渲染尚未驗收。 |
| INCENSE-09 | 蝴蝶大型 | 承接每5tick換幀、3幀循環、500～1000tick及懸浮運動。 |
| INCENSE-10 | 螢火蟲大型 | 承接三軸擾動、XZ×.96、60～99tick、閃爍／淡出與全亮。 |
| MOLOTOV-01 | 莫洛托夫命中 | 承接30FLAME＋20SMOKE及原版建構子／高斯參數；不改傷害或擴大火勢。粒子碰撞仍不同。 |
| SONIC-01 | 音波 | 承接16個、每2格、原版幀／16tick／大小1.5；未更改原有PvE-only傷害策略。 |
| CAMERA-01 | 微醺 | **未還原**：仍是既有yaw適配而不是Java相機roll；沒有用切換自由相機或刪掉效果冒充修復。 |

## 不能用常識「改好看」的原版細節

`DrinkBlockItem.makeThrownPotion()` 只設定 CustomPotionEffects，沒有設定 Potion 或 CustomPotionColor。Java 1.20.1 `PotionUtils.getColor(ItemStack)` 遇到 EMPTY base potion 回傳16253176（0xf800f8），而不是把自訂效果色平均。原生 `ThrownPotion` 的2002／2007事件選擇也看base potion，這條Tavern流程會是普通EFFECT。此次按實際執行源碼保留，沒有擅自換成藍色水花或按buff猜顏色。

玻璃被投射物打碎时，原版是以完整GLASS方塊觸發破壞事件，並非以瓶子模型形狀切碎。因此本輪采用64個完整方塊分割点；后續另一个ThrownPotion命中才负责8＋100濺射。

## 新增的第三方壓榨碎屑接口

既有foundation payload可選加入：

```json
{
  "itemParticles": [
    {"item":"example:fruit", "particle":"example:fruit_debris"}
  ]
}
```

item和particle都必須屬於註冊來源的namespace；最多256項，拒絕不存在的item／重複item／跨來源覆蓋；重新註冊會清除該來源舊映射。第三方RP粒子必須每次生成一顆，讀取 `variable.kt_vx/vy/vz`（blocks/second）作為初始速度，並自行提供其真正模型的粒子貼圖。主程式在壓榨時按原版10個高斯位置呼叫。這不代表已替第三方資源包驗證粒子數、貼圖或原生渲染。

本體236份BP item定義中：211份可由Java静态模型粒子圖集解析；16份高腳凳另外對應正確顏色的原版羊毛貼圖。既有冰葡萄碎屑映射仍可用，但動畫貼圖相位不等於完整Java，因此不算「全部228項完全一致」。其餘技術物品／無明確particle材質／動畫貼圖有清楚的unresolved紀錄。

## 驗證

本地執行：

```sh
node --experimental-vm-modules --test tools/effects/effects-regression.test.mjs tools/effects/interaction-regression.test.mjs
python tools/check_release.py
```

- **105／105項獨立測試通過**：原有72項（已含tap fixture所註冊的19項）＋新33項；不可再加19重複報成124。
- **完整本地靜態檢查通過**：2000 JSON、929 geometry；此流程本身不是遊戲互動測試。
- 新增測試執行真實JS交易／命中模組，但依賴為隔離的JS doubles，**不是Minecraft SimulatedPlayer／BDS**。
- 覆蓋成功／失敗／同色／重複命中、粒子失敗不重做交易、建立投擲物失敗時保留原瓶、原版事件幾何、atlas參數、第三方namespace、來源SHA與離線生成重現。
- 修正繼承提交漏掉的tap fixture export／Molang記錄欄位，讓72項測試能在乾淨checkout實際執行。
- CI必須額外執行既有 `check_launch.py --java-source ... --baseline ...`，核對原Java及`cedfaedf`整包基線。本地尚未下載該歷史checkout，不冒稱本地已核對它；以本次CI結果為準。
- 真人兩端比較、BDS、行動裝置與多人壓力：**NOT RUN**。沒有把程式或數學測試當成肉眼一致。

## 歷史檢查的維護

`check_repair.py` 原要求每秒steady emitter，與今回按Java客戶端採樣的instant burst衝突。已替換成更具體的數量輸入、有限發射器、20Hz遞推、壽命、衰減、範圍、貼圖引用及觸發呼叫檢查；原有不可變基線指紋保留。`check_launch.py` 現在读取實際EFFECT_BURSTS匯出，驗證30＋20及散布／速度，不再要求舊原生粒子名稱的字串。

`launch-repair-reference.json` 只列入此次明确審核的53個既有runtime變更及184個新增runtime檔（包含承接修補）；所有原before／beforeProjected指紋和基線commit不变。沒有「任意更新全部hash就算通過」；完整CI仍拒绝未列出變更、錯誤before指紋與不可重現資源。版本0.6.63既有發布證據文件不被本地檢查結果覆蓋；新結果保留於本次CI artifact。

## 原生剩餘工作

相機roll、滴液落地二次效果／音效、液體表面、Java AABB碰撞、CLOUD接近玩家吸附、RAIN著地50%消失、光照與混合、動畫輸入貼圖／未註冊外部輸入，以及大量玩家／低FPS下的原生表現，仍須繼續修補與驗收。這些是具體差異，不會只用「基岩限制」概括，也不聲稱已全部完成。
