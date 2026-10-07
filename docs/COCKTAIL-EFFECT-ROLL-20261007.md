# 雞尾酒效果的 Java float 機率

依據當前作者發佈的 `kaleidoscopetavern-1.2.0-neoforge+mc1.21.1-sources.jar`：
`CocktailBlockItem.java` 90–103 行與 `SignatureCocktailBlockItem.java` 47–58 行，
每個 entry 都先呼叫 `level.random.nextFloat()`，以嚴格 `< entry.probability()` 判斷，
成功則立即套用該效果，再處理下一個 entry。`DrinkEffectData.Entry.probability` 是
Java float，資料 codec 使用 `Codec.FLOAT`。

一般酒瓶已有 `core/java-random.js` 的正確 24-bit conversion；雞尾酒 completion
先前仍直接比較 JS double 的 `Math.random()` 與高精度 JSON number。本次重用同一
`javaRandomFloat`，將機率窄化為 `Math.fround`，保留每個 entry 一次 draw 與立即
dispatch 的次序，不預先整批抽完，也不跳過 0／1 機率的 RNG 消耗。

具體來源反例：輸入 draw=0.1 對應 next(24)=1677721，Java nextFloat 是
0.09999996423721313，比 0.1F 的 0.10000000149011612 小，因此命中；舊 JS 比較在
0.1 等於 0.1 時漏套效果。反方向，JSON 機率 0.500000005 在 Java 先轉成 0.5F，
draw=0.5 應被拒絕；舊 JS 比較則錯誤套用。

`tools/cocktail-effect-roll.test.mjs` 直接執行真正 `completeCocktail` adapter，覆蓋
上述兩個來源數值、每項 RNG 消耗與 effect interleaving，以及無效果／無關物品。
這些是 JavaScript API fixtures，不是原生飲用、聲音、動畫或真人客戶端驗收。
數值對照只證明相同輸入 draw 的 nextFloat conversion 與 completion interleaving；
沒有宣稱 Bedrock／Java 共用 RNG 種子，或兩個引擎全部效果 callback 的次序相同。
此修復另匹配末個 Survival 飲料的容器直接寫回手持欄位；瞬時 callback
與整體容器／效果次序的其他已知差距仍保留。

同一來源的 `DrinkBlockItem.java` 144–157 行也在每次成功抽選後立即 dispatch，再抽
下一項。瓶裝酒先前的 production `consumeDrink` 呼叫 `rollDrinkEffects`，整批抽完
再套效果，會令較早 effect callback 的 RNG 消耗錯誤影響其後機率。本次改以
`iterateDrinkEffects` generator 給 completion 逐項抽選；既有 pure callers／投擲
藥水 builders 仍可透過 `rollDrinkEffects` 取得原來的 array API。

真正瓶裝 completion 回歸使用來源 vinegar q6：blindness callback 多消耗一次 draw
後，下一個 fatigue 應拿到後續 draw 並命中。舊 eager 實作則漏掉 fatigue、錯選
speed；此場景驗證實際效果結果與事件次序。CI 的 foundation script job 已明確
納入新回歸。容器交換仍保持原有 host 先容器後效果的相對次序，沒有用兩行
對調冒充完整原作 lifecycle。

`DrinkBlockItem.finishUsingItem` 117–126、`CocktailBlockItem.finishUsingItem`
68–77 透過 `IHasContainer.returnContainerToEntity` 35–36，在消耗後的本地 stack 為空時
直接回傳新容器；Minecraft `LivingEntity.completeUsingItem` 隨後把新 stack
寫回使用的手。末個 Survival 飲料因此必須讓手持欄位成為空瓶／空杯，即使
背包其他位置已有同種容器。舊 `planInventory` 會先合併到別處並留空手；
`finishDrinkContainer` 現在對這一分支直接寫回原欄位。兩個完成入口反例
確認原有容器 stack 數量保持不變。堆疊／Creative、死亡／換手、world-drop
位置及 40-tick 拾取延遲仍須完成，不屬於已驗收項目。

同版 `JuiceBucketItem.java` 30–43 在消耗／返還之前執行 NeoForge HONEY cure。
已核對的 [NeoForge default](https://github.com/neoforged/NeoForge/blob/a2d6402a3c1eec093aef7e7d10ac5145906c199e/src/main/java/net/neoforged/neoforge/common/extensions/IMobEffectExtension.java#L23-L27)
只替原生 POISON identity 加入 HONEY。原來以 Forge milk 說明不移除效果的註解
不適用這個 NeoForge 分支；現在六種 juice bucket completion 先以 stable
`removeEffect('poison')` 移除預設原生中毒，其他／fatal／自訂效果保持。沒有
poison 時仍返還桶，Creative 也執行 cure。

NeoForge 還允許每個 MobEffectInstance 修改／保存 cure set，並在
[實際移除時觸發可取消事件](https://github.com/neoforged/NeoForge/blob/a2d6402a3c1eec093aef7e7d10ac5145906c199e/patches/net/minecraft/world/entity/LivingEntity.java.patch#L712-L726)。
Native 沒有這些 cure registry／instance／取消 hook 的對應。本修復是有來源
的 default Poison 分支，不宣稱未知第三方修改、已保存 cure 或所有 Java
LivingEntity 飲用入口都已還原。
