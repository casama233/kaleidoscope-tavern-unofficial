# Java 完整還原目標與驗收範圍

使用者本輪目標是酒館與世界名酒 100% 還原 Java 的音效、邏輯、特效及細節，
唯一指定排除是微醺效果。這是持續目標，不因某一批配方或測試通過而縮小。
完整來源清單見 `family/java-fidelity-inventory.json`：實際作者 archive 的
256 個酒館 Java 類別、97 個世界名酒類別，以及各自全部 data/assets 檔案。
每個類別或資源預設尚未完整驗證；列入清單本身不是完成證據。

目前 NeoForge 1.21.1 的直接參考為酒館 1.2.0 與世界名酒 1.1.11。
Forge 1.20.1 的世界名酒最新 1.1.12 與 NeoForge 26.1.2 分支仍須分列。
`family/java-upstream.json` 與作者唯讀巡檢持續追蹤最新發布，不能把不同
Minecraft／loader 的版本號合併，也不能以單一舊 fixture 代表所有分支。

## 完整待核對範圍

| 範圍 | 必須證明的行為 | 當前證據與未完成項 |
|---|---|---|
| 酒桶、壓榨、龍頭 | 全部配方、份量、品質、tick、液體、紅石、失敗、掉落與保存 | 有具體邏輯回歸；全部交互、液滴落地／液面、容器 metadata 和真人畫面仍需逐項核對。 |
| 雪克杯、雞尾酒 | 三槽、全部順序、原料分類、品質、時序、颜色、效果、返回容器及任意外部資料 | Java 實際 RecipeMatcher 512 圖與現行 18 配方已有證據；雙手、杯蓋、精確碰撞、任意 ItemStack metadata 等尚未完整證明。 |
| 飲用、食用 | Java 完整 use lifecycle、營養、返還物、Creative、雙手、取消、音效節拍與強度 | 本輪補 Java 24-bit 隨機抽樣及三種特殊飲品原作聲音節拍；Native 預設聲音是否重疊、混音與真人雙手仍未驗收。 |
| 酒館所有效果 | 來源所作用的 LivingEntity、瞬時／持續、疊加、觸發、傷害、停止、死亡、牛奶及離線 | 微醺依使用者排除；Vision 真正輪廓、完整 mob 投擲效果、原生伸手／步高與碰撞、PvP 音波等仍有差距。 |
| 世界名酒所有效果 | 最新效果定義、全部倍率、條件、音效、視覺、移動及資料保存 | 本輪修地面暴擊條件、浮點倍率／機率和肘擊聲音。已補先前 kill-credit 的核心選擇與原生減傷／吸收階段證據；肘擊實際擊退、重斬同tick冷卻／死亡離線邊界、完整 Respawn、Creative Flight、寶藏／敵對輪廓、Luck、掉落仍需修。0.1.76補操舟控制座位／來源倍率、多段跳新按與下降判斷、反重力緩降／飄浮數值；天花板ground、原生位移／碰撞、淺熔岩與鏡頭仍需修。 |
| 冰箱、櫥櫃、外部酒窖、唱片 | 全物品分類、完整堆疊、任意輸入、流體、漏斗、比较器、红石、音乐和故障恢复 | 有真实原生容器／保存回歸；不能以已測兩種容器取代全部機器／唱片／自動化驗收。 |
| 作物、裝飾、告示板、座椅 | 生長、方向、形狀、對齊、發光、光源、連接、碰撞、尺寸與收納 | 有來源及具體回歸；原生步進、shader、遮擋和全部視角尚未完全驗收。保留先前明確要求的指南／排版擴充，未把它們偷偷算成 Java 原有功能。 |
| 模型、手持、掉地、GUI | 全部作者模型、UV、材質、Java transforms、動畫、杯中物、碰撞和像素 | 各項資產／數學已有部分證據；需要配對真人客戶端同場景觀察，BDS 沒有畫面，不能證明 renderer 完全一致。 |
| 音效、粒子 | 每個呼叫的條件、數量、位置、速度、壽命、幀、顏色、亮度、音量、音高、接收者、停止和衰減 | 本輪補原始 critical／chorus fruit／beacon samples。粒子碰撞鏈、光照、透明混合、原生音源與音效重疊仍為待驗證／待修，不以 samples 相同當作聽感相同。 |
| 兼容與保存 | 酒館單裝、所有可選附屬、多人、重啟、資料所有權、既有堆疊與其他 addon | 現有完整家族和獨立未來附屬有具體證據；任意未知 addon 程式無法從名稱猜測。按原生標籤與公開資料契約接入，未宣告能力不冒充已支援。 |

## 本輪針對性修復的證據

- `tools/fixtures/JavaRandomFloatOracle.java` 實際執行 JDK Random，256 個初始
  seed 對照 24-bit first draw。它不宣稱 Java 與 Bedrock 後续共用 seed 序列。
- 世界名酒 `tests/fixtures/JavaUseCombatOracle.java` 在 Java 計算目前作者的
  暴擊條件、float 伤害／機率與 Minecraft 1.21.1 飲用 predicate。
- 飲用事件測試覆盖取消、舊 callback、切换、离线、位置、18 種品質物品、
  完成節拍及音效失敗隔離。這是程式/API 夾具，沒有模擬 Minecraft 玩家。
- 原生 BDS、完整家族 saved-world 演練、Git PR／檢查／合併和部署都各自記錄。
  真人畫面／聽感須另外證明，任何未測項維持 `client=false`。

完整目標目前**尚未達成**。後續按以上範圍及實際源碼逐項修復，不把
這份差距清單、來源版本、checksum、單一綠色 CI 或部署成功當作 100% 證書。

移動批次來源與原生證據：世界名酒 `docs/JAVA-MOTION-20261007.md`／`NATIVE-MOTION-CAPABILITIES-20261007.json`。Camera.playAnimation／Vector3是可測能力，尚未實作逆轉鏡頭；不以旋轉欄位存在推定畫面已一致。

2026-10-07：使用者強調無任何邏輯BUG，客戶端驗收可交給dot。0.1.77補破勢／先前玩家重斬的來源暴擊追蹤與粒子資料，受傷取消／拒絕不發新粒子；排除有生命值的船等非LivingEntity。原生事件證據不是真人畫面證據，dot清單在世界名酒docs/DOT-CLIENT-ACCEPTANCE-0.1.77.md。原有完整差距、未知addon類別映射及所有尚未核對邏輯仍未完成，不能宣稱全面無BUG。

0.1.78修掉受傷被後續addon取消仍播聲音，以及異維度先前玩家錯發暴擊；共享原生接受判斷保持原作位置／選項和同次多回饋。Native40項相關回歸／真實傷害回饋已有證據。同維度攻擊者tracking／visibility範圍仍是邏輯差距，dot只負責實際聲畫驗收，不能替代邏輯修補。微醺以外完整100%範圍保持原要求。

0.1.79恢復冰凍水面每tick／半徑3+amplifier、不封頂及來源水／空氣判斷。Native實際方塊與grounded/airborne mob已確認圈界及排除條件；不是玩家或畫面驗收。27塊霜冰在randomTickSpeed0下400次tick觀察不老化，與Java排程不同。JavaonPlace先60–120排程，後續同種類／同位置60請求去重；不能改成60固定融化。完整霜冰老化／融化、水面行走流體shape／move／onGround／fallDistance、chunk載入和玩家碰撞時序仍未完成，未獲平台豁免。使用者自行客戶端實測，場景在世界名酒docs/CLIENT-COMPARISON-0.1.79.md。原完整目標除微醺外保持不變。

0.1.80修寶藏引路方塊額外掉落：作物／礦石同15%基礎、最新來源crops/c:ores、原方塊與破壞前工具另算loot、中心生成，不再掃附近物品。Native8場景含兩個自訂標籤方塊、絲綢之觸，原有7綠寶石不複製；不是實際player-break／client驗收。錯誤／空手工具Nativeharvest gate、player/luck/blockEntity/globalLootModifier、事件／RNG階段及兩版loot內容仍待修。Mob掉落原有heuristic、斬首Incoming取消／來源替換／recursion／fallback／持久marker／頭顱metadata與缺頭補入仍未完成。Native改damageSource不改實際來源、readonly不能applyDamage、kill()可取消且selfDestruct、health0為override無攻擊者，不能冒充Java die(killSource)。保留本輪另一維護已合併／部署的G78，不將Grilling平台豁免套入本目標。

0.1.82／宿主0.6.115修外部 LivingEntity 效果派送：timed儲存／mob快照、零時長instant投擲、float逐tick治療、boat排除、玩家專用效果no-op、卸載／重啟復原。118跨包程式回歸與實際BDS生物兩次啟動通過；原生用指定列的test-only observer，不是實際玩家入口或聲畫验收。宿主自身mob效果、mob移動／冰面、完整原生效果集合、NeoForge治療hook／生命週期精確階段及任意未知addon類別仍未完成。完整目標不縮小，client=false。
