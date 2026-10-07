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
此修復沒有改動 Java 容器返還／瞬時 callback 的其他已知次序差距。

同一來源的 `DrinkBlockItem.java` 144–157 行也在每次成功抽選後立即 dispatch，再抽
下一項。瓶裝酒先前的 production `consumeDrink` 呼叫 `rollDrinkEffects`，整批抽完
再套效果，會令較早 effect callback 的 RNG 消耗錯誤影響其後機率。本次改以
`iterateDrinkEffects` generator 給 completion 逐項抽選；既有 pure callers／投擲
藥水 builders 仍可透過 `rollDrinkEffects` 取得原來的 array API。

真正瓶裝 completion 回歸使用來源 vinegar q6：blindness callback 多消耗一次 draw
後，下一個 fatigue 應拿到後續 draw 並命中。舊 eager 實作則漏掉 fatigue、錯選
speed；此場景驗證實際效果結果與事件次序。CI 的 foundation script job 已明確
納入新回歸。容器交換仍保持原有 host 次序，沒有用兩行對調冒充完整原作 lifecycle。
