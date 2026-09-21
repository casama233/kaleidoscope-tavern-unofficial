# C6 實作還原與驗證邊界

| 項目 | 原作依據 | C6 接法 | 不能據此宣稱 |
|---|---|---|---|
| Shriek Attack | 已上傳JAR的ShriekAttackEffect：32距離、1+半寬射線，當前生命×float1.2，水平.63/垂直.28，2格粒子步距 | core/combat-effects.js獨立幾何；bedrock/combat-effects.js原生sonicBoom傷害、addImpulse與聲波粒子 | PvP等价、每種保護插件、無敵穿透、原生引擎已測 |
| Upside Down | 1.2.0 `UpsideDownEffect`：使用者AABB inflate 16；存活 `Mob` 全部 `setCustomName("Grumm")`，名稱不強制顯示 | `core/custom-effects.js` 做AABB相交；`bedrock/custom-effects.js` 用 `families:['mob']` + health + `getAABB()`，寫入 `Entity.nameTag='Grumm'` | `setCustomNameVisible(false)` 沒有通用Script API直接對等；Grumm倒立與名稱牌表現仍需實機驗收 |
| Vision | 1.2.0 `VisionEffect`：`duration % 50 == 0`；半徑 `min(amplifier+1,3)*6`；其他存活 `LivingEntity` 續60tick Glowing；只在新目標出現時播 `effect.vision` | 持續自訂狀態＋50tick倒數跨越判定；有界查詢後用 `getAABB()` 精查；原生 `glowing` 60tick；播放既有 `kt_assets_a17.effect.vision`；排除本包 seat/visual helper | 5tick巡檢可能讓pulse比Java精確tick晚最多一個窗口；health component只是LivingEntity近似；發光描邊／聲音傳播／多人仍未實機驗收 |
| Tomb Raider | 1.2.0 `EffectEvent.onLivingHurt`：指定 entity tag；`nextFloat()<0.3F`；主手有物；可損耗物 `damage=maxDamage-1`；清主手後生成 `ItemEntity`，pickup delay 40 | 玩家自訂持續狀態；15個來源目標ID映射；`EquipmentSlot.Mainhand`＋`spawnItem`；掉落entity DP記40tick解鎖，before pickup取消；spawn/標記失敗回滾原主手 | Bedrock安全改裝使用hurt after-event，比Java hurt事件晚；致死一擊、非玩家持有者與目標原生RNG序列不宣稱完全等價 |
| Ardent Heat | 1.2.0 `ArdentHeatEffect`：每tick；只限玩家且衝刺；正前方3×3的 `base_stone_overworld`＋`base_stone_nether`＋end_stone；成功破塊後 exhaustion +1.2，隨機一件已穿盔甲損1耐久；裸裝每5次成功撞擊受1 generic傷害；自然到期／飢餓與飽和耗盡後 Hunger 600 | 精確展開10種原作石材；1tick衝刺巡檢；set-air＋明確原版掉落映射並失敗回滾；Bedrock exhaustion元件、盔甲 durability、DP撞擊計數；5tick狀態層處理到期／耗盡 Hunger | 掉落不是Java loot-table執行；Bedrock exhaustion→飢餓換算交由引擎；隨機盔甲RNG序列與Java不同；效果結束最多晚5tick |
| 輸出安全 | 原作射線可能命中玩家 | 明確PvE-only、排除自家helper、最多256命中、拒傷不擊退 | 所有友善生物安全；寵物仍可能被擊中 |
| 座位幾何 | 原作SitEntity anchor .875，getPassengerRidingPosition另有顯式-.0625 | native rideable seat位置 .8125候選；一名player；不自動吸入附近生物 | Java基類與Bedrock原生人物附加偏移相同、腿部已校正 |
| 座墊轉動 | source renderRot/moveRenderRot 隨乘客yBodyRot插值，非乘客則保留 | 每5tick用player look yaw更新同步屬性；只轉上層bone，客戶端math.lerprotate短弧度插值 | head/body yaw完全等價、Steve/Alex所有skin已驗收 |
| 座椅生命週期 | 原作乘坐實體與block entity視覺分開 | 主方塊保存類型/朝向，persistent helper同時視覺/rideable；原生空座還保留視覺 | 与Java空座實體刪除方式逐行相同；不支援空座helper自行掉物 |
| 全款彩燈 | source StringLightsBlock全款亮度15；每款不同模型、染料換型 | 17款原幾何、固定光15、四向排列、染料消耗與同色拒消耗 | RGB光照、waterlogged、紅石控制或精確selection已完成 |
| 合成 | 原JAR33份crafting_shaped | 羊毛/鎖鏈/鐵錠與鎖鏈/燈籠/染料，原pattern/result數量 | 任意c:ingots/iron外包鐵錠都接受 |
| 物品顯示 | 原作完整world模型；部分special item renderer | source模型轉64px透明圖示、原world geometry保留 | 原生3D第一/第三人稱家具item姿態完成 |

## 程式入口

- `runtime/BP/scripts/core/combat-effects.js`：純向量、射線、float32傷害、擊退、粒子位置。
- `runtime/BP/scripts/bedrock/combat-effects.js`：世界查詢、原生傷害、逐目標例外、PvE政策、去重。
- `core/custom-effects.js`：持續/瞬時自訂效果契約、Upside Down 嚴格AABB、Vision節點、Tomb Raider目標／機率，以及 Ardent Heat 精確石材／3×3前方平面。
- `bedrock/custom-effects.js`：Bloody Mary、XP Drain、Zenith、Shriek、Upside Down、Vision、Tomb Raider、Ardent Heat 的引擎適配。
- `core/furniture.js`：顏色/物品/方塊/錨點/朝向契約。
- `bedrock/furniture.js`：投放、騎乘、染色、回收交易、helper去重与卸載清理。
- `tools/build_c6.py`：33家具物品、33行為方塊、16座位实体、33配方、衍生圖示与獨立指南。
- `tests/c6-core.test.js`／`tests/c6-runtime.test.js`：目前53個核心＋84個runtime案例，共137個C6回歸案例。

## 文件核實來源

查閱時間：2026-09-21。下面是API參考，不是對freeze在2.7.0的實機二進位驗收。原作JAR有雜湊但未另驗證發行方官方checksum。

- EntityRideableComponent（addRider回傳值、getRiders、eject）：https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityrideablecomponent?view=minecraft-bedrock-stable
- Entity（getAABB、getEffect、addEffect、applyDamage、applyImpulse）：https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entity?view=minecraft-bedrock-stable
- EntityQueryOptions（location／volume有界查詢）：https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityqueryoptions?view=minecraft-bedrock-stable
- EntityEquippableComponent／EquipmentSlot（主手讀寫）：https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityequippablecomponent?view=minecraft-bedrock-stable
- WorldBeforeEvents.entityItemPickup／WorldAfterEvents.entityHurt：`@minecraft/server` 2.7.0 stable 新增，用於40tick拾取鎖與受傷後卸裝。
- Dimension.spawnItem／ItemDurabilityComponent.damage：真實掉落與剩1耐久適配。
- Entity.isSprinting：stable sprint狀態；`@minecraft/server` 2.7.0 的 player exhaustion／hunger／saturation components 與 `EntityAttributeComponent.setCurrentValue` 用於醇熱飢餓流程。
- EntityRidingComponent：https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityridingcomponent?view=minecraft-bedrock-stable
- Mojang原生聲波資源：bedrock-samples固定提交46ba6ea985fb5a92d79a9419198f10dda14c199d的resource_pack/particles/sonic_explosion.json及sounds.json。
- 原生recipe鎖鏈材料：同Mojang固定提交behavior_pack/recipes/oak_hanging_sign.json；保留minecraft:chain，未猜成其他新版ID。

缺少getAABB時目標跳過並記diagnostics，native addRider返回false時拒絕假坐下；API錯誤不改成強制setHP或teleport綁玩家。來源數值檢查見`C6-SOURCE-AUDIT.json`，所有遊戲驗收仍NOT_RUN。
