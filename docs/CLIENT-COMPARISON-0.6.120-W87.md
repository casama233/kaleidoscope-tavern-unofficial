# dot 真人對照：酒館 0.6.120／世界名酒 0.1.87

參照 Java Tavern 1.2.0＋World Liquor 1.1.11／NeoForge Minecraft 1.21.1。
完整家族部署後才開始；候選 BDS／腳本成功不代表下面場景已通過。
微醺按使用者要求排除。紀錄兩版的物品數量、落點／方向與聲畫差異。

1. Survival 單瓶／單杯，其他格各放空瓶／杯×5，喝完應在手上留下
   空容器×1，其他格仍×5。堆疊×2 再測一次：扣一次酒、回一個容器，
   成功放進背包時有原作拾取聲，最後單件返手沒有這個插入聲。
2. Creative 單杯及滿背包：飲品保留，返一個空容器；滿包溢出時
   出現在玩家 y+0.5，初速度向上0.2、不額外播方塊聲。
   連續已載入的40-tick阻擋、卸載及物品合併分開記錄，後兩項仍有差距。
3. 開喝0.5秒後放開、切槽、換雙手，確認未完成時沒有完成效果／容器；
   隨後喝新飲品，舊使用不可串到新飲品。比對第一／第三人稱喝酒動作。
4. Nether 置電量2的錨，設為個人點、keepInventory=true、四周相同石地。
   飲用長島冰茶 `kaleidoscope_world_liquor:long_island_iced_tea`（100%重生）。
   比對 North 首落點、看向錨、起點／終點原作 chorus-fruit 聲與 Hunger300。
   Native 個人點是否是錨 BlockPos 尚待實測，不要因未知點未傳送就算通過。
5. Overworld 新床朝北，分別以 +90／−90 的視角重新設點，再轉身喝長島
   冰茶，比對原作兩種側邊搜尋。歷史點、同點拒絕與真正睡眠分開測。
   keepInventory=false 的錨須已確認／宣告 nonforced 資料，成功只扣一次電量。
6. 無個人點、default spawn radius=0 的普通石地，比對來源 column 落點；
   加水／擋住落點後再測。Native shared-Y32767不能拿來當真正高度。

未完成：Native instant heal／damage下一tick、death dropped-stack alias、
共享Java RNG、任意addon幾何／metadata、卸載／合併pickup時鐘、fallDistance、
封包／客戶端速度与完整模型／動畫／音效驗收；肘擊仍未有production force adapter。
來源與具體界限見 DRINK-COMPLETION-LIFECYCLE.md、NATIVE-DRINK-PHASE-20261007.md，
以及世界名酒的 RESPAWN-RUNTIME-SOURCE-ADAPTER.md。這些不得由本轮部署算成完成。
