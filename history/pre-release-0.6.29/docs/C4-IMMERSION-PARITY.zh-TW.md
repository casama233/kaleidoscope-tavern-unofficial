# C4 沉浸還原矩陣

本表區分「原作數值」「Bedrock適配」「尚待引擎驗收」，不把全部畫成綠勾。所有遊戲內動畫驗收目前為NOT_RUN。

| 步驟 | 原作依據 | C4處理 | 邊界 |
|---|---|---|---|
| 成功投料 | 3槽、Q4以上、原PUT 0.375秒／13鍵、返容器 | 提交後播放原杯蓋／杯身軌道及原生瓶聲／氣泡 | helper與跨客戶端重播待測 |
| 拿起滿料工具 | 原作Shaker物品攜帶三槽與result | 一個max_stack_size=1工具攜带schema1資料、可再放下 | 拒收外來額外metadata；不等價於任意NBT容器序列化 |
| 開始／停止搖 | 原作長按使用、鬆手定時 | 兩次使用起停，sneak-use取消，111tick看門狗 | **原生長按未做**，不偷加food以捕捉hold |
| 第一人稱波形 | sin(ticks×1.5)×0.25，y=-.52-wave×.6 | 度/弧度換算；位置變動×16進模型單位 | 原作camera平移(.56,-.52,-.72)不能直接當Bedrockwrist；.6縮放／錨點是適配 |
| 第三人稱手臂 | x=4.31969 ± PI×wave，z=±9° | Player.playAnimation專用channel＋stopExpression | vanilla/窄臂/其他動畫融合及controller實際行為未驗收；不覆寫player.json |
| 桌上計時晃動 | 沒有對等原作桌上搖動 | 原波形驅動小幅桌面搖動 | 新增可選操作的視覺反饋，不是source-exact |
| 搖動聲 | 原OGG，10tick節點 | 局部播放，每節點一次；固定音量/音高候選 | 未複製Java隨機音高序列，不保證聲學等效 |
| 結束 | 原作時窗與完成声 | 定時判定保存結果；換回普通工具停止手臂channel | client tick相位不是伺服器判定依據 |
| 倒入已放杯 | 原作手持結果對空杯倒出 | 12tick/65°過場、液滴短流、完成時提交 | 此過場是新增適配，並非原作額外原動畫；落點近似 |
| 特調 | 原作RGB、玻璃與染色面分離 | 沿用C3資料與放置RGBhelper；流滴用結果色 | 手持特調杯RGB仍未完成 |
| 開关蓋/壓榨/取酒 | 原模型液位與事件 | 原狀態更新＋局部sound/氣泡，失败不播成功cue | 非完整粒子煙霧/微醺/相機效果 |

## 計算證据

`docs/C4-ANIMATION-SOURCE.json`記錄原件SHA-256；`tests/c4-core.test.js`以原曲線獨立數值對照，而不是測試相同helper回傳自身。原PUT、PNG、所有原有幾何未覆寫；手持衍生幾何只加綁定父骨，不移動原cube或UV。

`tests/c4-runtime.test.js`調用實際adapter與事件訂閱，驗證交易後才有動畫、失敗不播成功動作、聲音故障不吞料，以及手持→12tick倒酒的生命週期。假的 `playAnimation` 只記錄呼叫，**不會讓它 magically 在Minecraft正確渲染**。

離線GIF與關鍵幀PNG是原模型的CPU投影，用於看缺面、杯蓋不動、UV錯位與幀序；不含玩家模型、聲音、實際液流，也不驗證Bedrock的Molang求值或插值。

## 原生輸入決策

官方Use Modifiers文件將該元件與food、shooter、throwable等使用系統搭配；本次未證明一般資料工具可只靠use_duration收到原生長按／release，因此C4**不假裝已完成**。不為捕捉輸入把雪克杯設成可食物，也不冒風險讓72000tick結束時丟掉工具內容。這是尚待引擎原型驗證的門檻，不是斷言永遠做不到。

## API原始文件（查阅日期2026-09-19）

- Attachables: https://learn.microsoft.com/en-us/minecraft/creator/documents/attachables?view=minecraft-bedrock-stable
- Use modifiers: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/itemreference/examples/itemcomponents/minecraft_use_modifiers?view=minecraft-bedrock-stable
- PlayAnimationOptions: https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/playanimationoptions?view=minecraft-bedrock-stable
- Molang is_item_name_any: https://learn.microsoft.com/en-us/minecraft/creator/reference/content/molangreference/examples/molangconcepts/queryfunctions/query_is_item_name_any?view=minecraft-bedrock-stable
- MolangVariableMap: https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/molangvariablemap?view=minecraft-bedrock-stable

Script API選用仍為上傳Cookery實包的2.7.0，不以文檔latest頁假裝正式2.7全部引擎元件已實機認證。
