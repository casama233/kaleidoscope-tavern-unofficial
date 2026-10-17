# Shriek 的查詢快照與逐目標次序

本次以作者已發佈 `kaleidoscopetavern-1.2.0-neoforge+mc1.21.1-sources.jar` 中
`com/github/ysbbbbbb/kaleidoscopetavern/effect/ShriekAttackEffect.java` 為依據。
來源身份沿用 `data/java-parity/instant-source-reference.json`，本次未重新下載或
將 SHA 相同當作玩法證明。

- 56–58 行在施法開始讀眼睛位置、視線及當時生命值；傷害乘數 `1.2F` 只計算一次。
- 60–67 行先播放音效，再讀施法者當時的 AABB 並膨脹 32 格，查詢其中的 `LivingEntity`，
  predicate 在查詢時排除自己與不存活的目標。
- 78–94 行按所得列表次序，在每個目標輪到時才讀當時位置、寬度與高度，判斷是否
  落在音波射線內；第一個傷害 callback 因此可以改變下一個目標是否命中。
- 96–105 行呼叫傷害，無論其布林結果如何，接著對目標當時速度加上音波速度。
  迴圈沒有再次檢查 `isAlive()`，所以列表中的晚目標被較早 callback 殺死，也不應
  因新增的晚期存活篩選而跳過這兩步。
- 108–118 行處理完列表才依序發出 16 個音波粒子。

Minecraft 1.21.1 官方 Mojang JAR／mappings 亦確認 `EntityGetter.getEntitiesOfClass`
委派 `Level.getEntities`，後者建立獨立 `ArrayList`；其 query callback 在
`Predicate.test(entity)` 成功時加入列表，再將完整列表回傳給作者迴圈。
`EntitySection.getEntities` 在這個查詢階段做 AABB 交集檢查。因此查詢時的存活與
搜尋區域資格應形成快照；不得在逐目標命中判斷時重新套用查詢範圍或存活篩選。
官方物件：[Minecraft 1.21.1 JAR](https://piston-data.mojang.com/v1/objects/30c73b1c5da787909b2f73340419fdf13b9def88/client.jar)、
[Mojang mappings](https://piston-data.mojang.com/v1/objects/2244b6f072256667bcd9a73df124d6c58de77992/client.txt)。

先前 Bedrock adapter 預先對所有目標計算射線資格，然後才逐個傷害，會漏打被較早
callback 移入射線的目標，也會打中已被移出射線的目標。本次保留查詢資格快照，
將射線幾何讀取放回每個目標的傷害前，也把搜尋 AABB 讀取放回音效之後。
回歸覆蓋雙向位移、查詢後死亡／復活、音效 callback 移動施法者後的新搜尋區域、
查詢外目標後續移入，以及生命值只讀一次與音效／傷害／速度／粒子次序。

這些是實際 adapter 的 JavaScript API fixtures，沒有使用模擬玩家。它們證明程式
次序與來源相符，不證明 Bedrock native callback 時機、跨引擎查詢排序、任意
addon 的 Java class 等價、速度數值或真人音效／畫面驗收。先前原生 BDS 的
270 個目標及 rejected-hurt 觀察也不能代替上述完整客戶端驗收。
