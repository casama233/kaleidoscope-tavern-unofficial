# 酒館即時效果來源修復

來源為作者 Modrinth W9ILsQt7 的 NeoForge MC1.21.1 酒館1.2.0 sources-jar，
檔案 Hy0W1pGu。直接查 ShriekAttackEffect／UpsideDownEffect／ZenithEffect，
不以歷史 PvE 測試約定代替現在作者邏輯。

音波接受有效 LivingEntity 作為使用者，搜尋其 AABB.inflate(32) 中的存活 LivingEntity。
前方投影0–32，射線垂距不大於1+目標半寬；currentHealth*1.2f、sonicBoom來源。
沒有玩家／任意命名空間排除、256目標上限、排序或同tick施放限制。
原作忽略 hurt 的 boolean 結果，再獨立把水平0.63／垂直0.28加入速度，
不強制突破原生傷害拒絕。16個音波粒子在處理目標後沿視線每2格發出。
原生引擎仍處理防護／冷卻；未把兩次施放誤當兩次必定扣血。

三種即時效果不再被宿主的 timed 玩家限制擋住。倒置包含使用者自己所屬的 Mob，
只改符合範圍的 Mob；玩家不算 Mob。Native Grumm畫面與name-visible仍待真人核對。

登頂按block-position與surface判斷，置中、保留速度、原處聲音→傳送→目的聲音，
加600tick Hunger。不再新增任意支持方塊／两格空氣條件或清速度。
Native getTopmostBlock略過水及葉，Block.isSolid在這個BDS穩定API不可用；
目前高度適配補原生solid高度之上的fluid、水logged、明列原生葉及宣告motion_blocking標籤。
石／水／葉／柵欄／半磚Native案例通過；任意其他states／碰撞class、未知addon predicate、
高度圖維護／chunk loading及原生fallDistance重置的完整等價仍需證明，未獲平台豁免。

音波四個、登頂兩個samples採官方Minecraft1.21.1原檔。category player、音量／音高1、
原作16格衰減資料；檔案一致不代表混音、接收者或真人聽感已驗收。

## 已確認

- 六項實際模組API回歸：玩家／mob使用者與目標、health vehicle排除、拒絕傷害獨立擊退、
  270目標、同tick兩次、走廊邊界、高度與聲音／傳送順序。
- 真實BDS1.26.51.1零玩家：五種登頂高度301／速度保留／Hunger600、Mob rename範圍、
  270目標每個扣24、兩次被取消傷害仍有累加衝量且HP100、實際mob落傷種類限制。
- 世界名酒0.1.83：反重力calculateFallDamage只適用Player；multi-jump適用LivingEntity。
  原生mob反重力仍扣4，multi-jump不扣，避免把Player專用hook擴大。

原生observer為複製包中的test-only import，直接呼叫效果；不是正常配酒／飲用／投擲入口、
PvP真人、聲畫或全面Java一致證據。客戶端由使用者按場景實測。
移植完整目標除了微醺外持續；返生仍有Block.isSolid與完整床／anchor／spawn邏輯差距。
