# 酒櫃／酒架東西向鏡像：根因、反例與觸控驗收

## 基準與結論

本次從 `main@8add56c2bb8a9d5a6de18dee176cdf88bf87b08b` 開始，先讀
`HANDOFF-20260929.md`，不重做已排除的引擎點擊面基底表。

**找到可確定重現的取物端錯誤，不是推測顯示端鏡像：舊路由先印出 `used=aim`，
再因觸控路徑中的 `hit.face` 拋錯，最後靜默退回原始事件座標。**
另外，斜酒架的自算選取盒沒有跟著方塊朝向旋轉，是第二個獨立缺陷。

本文件及 CI 的重現使用正式互動路由與明確的 API 測試替身，**不是原生觸控
客戶端、BDS 玩家工作階段或 SimulatedPlayer 驗收**。真機驗收仍未完成。

## 根因一：日誌在成功返回以前就宣告用了 aim

舊版 `runtime/BP/scripts/bedrock/stateful-storage-router.js`：

```js
const aimed=aimPointFor(player,block);
const hit=rayMouse?nativeBlockHit(player,block):undefined;
// ... 先輸出 used: aimed ? 'aim' : ...
return {face:hit.face,faceLocation:location};
// ... 外層 catch 遇到 TypeError 時 return fallback
```

一般觸控 `rayMouse=false`，`hit` 本來就不存在；有正確 `aimed` 仍必定在返回時拋錯。
键鼠有原生 ray 結果時不會暴露此錯誤。未知輸入模式、原生 ray 打空或失敗也可觸發。

固定相同事件及視線，經正式 `registerJavaBlockUseHandler`、預檢和下一 tick 的互動：

| 值 | 未修復主線 | 本次修復 |
| --- | --- | --- |
| 輸入 | Touch，普通觸控 | 相同 |
| event | `(0, .84, .88)` | 相同 |
| aimed | `(1, .74, .12)` | 相同 |
| 日誌 `used` | `aim`（誤導） | `aim` |
| 真正送入兩個消費端的點 | `(0, .84, .88)` | `(1, .74, .12)` |
| `cellarCabinetSlot`（0 起算） | `0` | `2` |
| 此正常觸控造成的解析錯誤 | `1` | `0` |

修復把解析與觀測隔離：保留 `hit?.face ?? eventFace`，已取得的瞄準点不再依賴
可選原生 ray、輸入資訊或日誌成功。只有自算瞄準點確實不可用才保留既有 fallback。
不改動面向基底表、主副手規則、存檔槽位、取物交易或物品資料。

## 根因二：只校驗原始盒尺寸，沒校驗朝向變換後的盒

原版 `slotBoxFor()` 只讀 shape 名稱；`aimPointFor()` 沒有讀取方塊朝向。
斜酒架的基底盒為 `origin=[-8,0,-3], size=[16,14,10]`；方塊本身卻有
`minecraft:transformation` 的 `0/-90/-180/-270` 度朝向 permutation。

例如 facing=1 的真正選取盒應為 `origin=[-7,0,-8], size=[10,14,16]`。
舊盒 z 只覆蓋 `5/16..15/16`，有效的外側瓶位 `z=.1575` 被錯判射線打空，
普通觸控便再次走到鏡像事件 fallback。

修復按已出貨的方塊 rotation 旋轉盒的界限，不依賴引擎回報的點擊面。
窖藏櫃等置中的完整方盒不受影響；斜架及有內縮的掛杯架獲得正確有效盒。
新測試從實際 block JSON 讀取 permutation、用獨立角點矩陣計算期望值，
驗證五類盒、四方向、每個面的射線交點及負世界座標的外側瓶位。

官方組件參考：[minecraft:transformation](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/blockreference/examples/blockcomponents/minecraftblock_transformation?view=minecraft-bedrock-stable)。
這不是新的引擎事件座標查表。

## 為何舊測試全綠也會錯

- 純 `aimHitInBlock()` 測試沒有進入拋錯的正式事件路由。
- `pick(pose(slot)) == slot` 只证明兩個函式互相吻合，不能證明傳到它們的座標正確。
- 原始盒與 block JSON 一致，不代表套用朝向之後仍一致。
- 舊 `[Tavern storage aim]` 印在可能失敗的 return 以前，不是成功提交證據。

現在 `storage-routing.test.mjs` 經正式事件入口、`shouldInteract`、延後執行、
原生庫存及實際 adapter 顯示同步，驗證 5 款本體與 10 款註冊附屬櫃架，四方向，
Touch／鍵鼠／手把。每槽用相同 ID、不同名稱的酒測試，避免只看 ID 而漏掉串槽。
另涵蓋原生空手回呼、延後時轉頭、換手持格、重複事件、缺失原生 ray、輸入與日誌例外。
顯示檢查驗證 adapter 寫入的實體位置、rotation 和 slot anchor，**不冒稱客戶端渲染**。

## 同一組測試的反事實驗證

| 被測程式 | 正式路由／物品往返 210 項 | 選取盒／射線 34 項 |
| --- | --- | --- |
| 原始 `8add56c2` | 151 通過、59 失敗 | 26 通過、8 失敗 |
| 只修路由、仍用未旋轉的盒 | 208 通過、2 失敗 | 26 通過、8 失敗 |
| 同時修正兩處 | 210 通過、0 失敗 | 34 通過、0 失敗 |

只修路由後剩下的兩個物品往返反例，正是朝東／朝西斜酒架普通觸控。
全部案例沒有 skip/cancel。舊函式及測試沒有被重新實作成另一份「相同假設」；
`check-storage-counterfactual.py` 會把兩個正式 runtime 檔暫換為雜湊固定的原始版本，
跑完全相同的新測試，再恢復修復檔。CI 保留 TAP、最小重現 JSON 及來源提交。

```bash
# 先取得並指定《世界名酒》ce8c41e48c731985221945479650de121e4d477c
export LIQUOR_SOURCE=<peer-checkout>
node --test tools/glassware/hit-basis.test.mjs tools/glassware/aim-hit.test.mjs
node --experimental-loader ./tools/pickup/mock-loader.mjs --test tools/glassware/storage-routing.test.mjs
node tools/check_surface_repairs.mjs
# 僅在獨立開發副本執行，絕不可對正在運行的伺服器包執行：
python tools/glassware/check-storage-counterfactual.py --evidence <evidence-directory>
```

反事實工具需要 git 歷史中的固定基準；來源匯出副本可用 `--baseline-dir`，仍核對原始雜湊。
`data/launch-repair-reference.json` 僅更新兩個 runtime 檔的 after 雜湊與修復說明；
不改動原始 before／beforeProjected 基準。

## 新日誌：先確認是 schema 2，不能再用舊 used=aim 判斷

`[Tavern storage aim]` 的 `schema:2` 增加 `resolved`（真正返回給選格端的點）、
`route`、`facing`、`reason`；`used` 對應 `resolved` 的來源。觀測失敗不會改變解析結果。
`aimHits/basisHits/eventHits/errors/diagnosticErrors/lastError` 分別統計，避免吞掉原因。

預設只記錄此腳本實例前 12 次；需要持續抓某位玩家時，在該玩家的遊戲聊天欄執行：

```mcfunction
/tag @s add kaleidoscope_tavern:debug_storage_aim
```

完成後關閉：

```mcfunction
/tag @s remove kaleidoscope_tavern:debug_storage_aim
```

若在伺服器控制台操作，將 `@s` 換成該玩家名稱。只啟用日誌，不改玩家或櫃子物品。

## 觸控真機驗收與部署閘門（未完成，不以 CI 代替）

1. 備份並在副本部署兩個 runtime 檔，保存伺服器本地 UUID／圍欄改動。
   真正停止並重啟伺服器，不以 reload 代替；本次不加 runtime 檔、不改 RP。
   看到 `schema:2` 才能確認觸控操作到的是新路由，而不是舊 release 或重複載入的包。
2. 必須用手機／平板原先出錯的觸控控制模式，不能只用外接鍵鼠。
   分別測酒館窖藏櫃、附屬窖藏櫃、斜酒架；東西向逐槽放入不同酒或不同名稱的酒，
   再逐槽取回，記錄實際畫面位置與手上物品。南北向作對照，斜架兩個外側位必測。
3. 同一事件核對 `used=aim` 且 `resolved == aimed`，再對照實際選中槽與
   `cellarCabinetVisualPose/tiltedRackVisualPose/circularRackVisualPose`。
   若 `resolved` 是 fallback，先查看 `reason`；若兩者吻合但畫面仍錯，再調查原生顯示。
4. 普通觸控「點畫面位置」與準星型觸控可能不是同一條意向射線；本修復保留交接指定的
   全模式優先眼射線策略。離準星點擊且眼射線落在同一方塊別格的情形仍需真機確認，
   不能由鍵鼠、測試替身或這份日誌單獨宣布通過。

**未操作使用者的 live server、未宣告部署、未合併 main、未變更版本號或發布新版。**
只修程式中可重現的兩個缺陷；真正觸控客戶端畫面／操作驗收仍是發布前必要條件。
