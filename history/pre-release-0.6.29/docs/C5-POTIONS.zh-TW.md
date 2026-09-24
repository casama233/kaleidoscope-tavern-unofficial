# C5 原生藥水資料與接受邊界

這是選擇性無損身份處理，不是任意NBT/ItemStack序列化。

## 讀取 → 快照 → 退料

1. 檢查是原生potion/splash_potion/lingering_potion且amount=1。
2. 拒絕額外名稱、lore、附魔、DP、CanPlace/Destroy、鎖定與keepOnDeath。
3. `item.getComponent("minecraft:potion")`取得effect與delivery型別ID。
4. 用`Potions.getEffectType`/`getDeliveryType`核對當前引擎存在，再從effect.durationTicks取得時長。識別符必須有明確映射，未識別不是水瓶。
5. **投入以前**做`Potions.resolve`往返核對；類型或身份不同則拒收，不返免費空瓶。
6. 保存`{item,container,color,effects,potion:{effectId,deliveryId}}`到同一雪克杯slot；退料消耗一玻璃瓶，resolve回原來投送方式與長效/強效。
7. 所有交易經原有空間預檢/回退；滿背包16玻璃瓶退藥水時，沒有多餘空間就取消。切欄/同ID但不同藥水替換也會取消延後互動。

## 固定配方 / 特調 / 附屬

只有drinkable `minecraft:potion`屬上傳JAR白色tag。其他投送方式不自動參與這個白色固定選項，但可參與特調或附屬明確指定的配方。

特調使用標準基礎藥水效果是一項明示適配：Java helper讀customEffects，本版按實際type和duration選映射。即使同一個`minecraft:potion`物品ID，強效/長效不同資料也不能混成同一快照。

附屬API1新增`native_potion_inputs`，SDK必須見到能力才發含potion輸入的調酒bundle。v1配方仍按item ID，**不能指定只接受Healing或某種amplifier**；這種effect篩選DSL並未實作。未提供藥水身份描述的potion產物一律拒絕，避免new ItemStack產出錯藥水。barrel/pressing不自動獲得藥水效果處理。

## 映射与限制

當前程式有43個明確ID映射，但只接受當前native registry存在者。`potionCapabilities()`在診斷中列recognized/unrecognized，**不能把靜態表43項當成實機全部可用**。

包含一般速度/跳躍/夜視/隱身/抗火/水下呼吸/緩降/虛弱/力量/再生/中毒/緩速、生命/傷害瞬時、凋零、海龜雙效果，以及水/平凡/粗製/濃稠無效果基底的明確類型。具體強效/長效名以core/potions.js為準；來源之外新效果不猜值。

Native PotionEffectType.durationTicks是已解析的藥水型別時長；不是噴濺落點衰减後的時間，**倒入調酒杯不是再次投擲該藥水**。未知duration的非瞬時效果拒收。自訂藥水混合多效果資料並不一定能從此API取得，因此不承諾任意命令NBT保真。

原生Food飲用和返杯仍由引擎執行，效果回呼不再扣第二杯/返第二杯。
