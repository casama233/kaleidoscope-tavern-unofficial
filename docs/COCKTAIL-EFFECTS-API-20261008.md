# 酒效的穩定 API 修復與原生能力觀察

本批從 T129 的 `9752aaee5cb6f0d0460cb9f9c8ab3424f975c1e4` 修復兩個可實作
的行為，沒有升級 Script API、最低引擎、版本或更改凍結紀錄。Java 對照為
NeoForge 1.21.1 `a1afba34981a00e89d57130d3dc8f1e64f1820a2` 的
`effect/ArdentHeatEffect.java` 與 `event/EffectEvent.java`，Forge main
`c4ec1880bd44cf3139d3ba744ab30bb379cf1416` 的對應條件也已核對。

## 醇熱結束時機

原作每 tick 在最後有效 tick 先給 600 tick 飢餓，再處理碰撞；玩家 tick
結束時，食物為 0 且飽和度不大於 0.01 就移除醇熱並給飢餓。原移植把
這兩項放在每五 tick 的保存工作，食物耗盡後仍可能多撞破數個 tick。

現在利用既有活躍玩家索引，每 tick 結算結束條件，普通期間仍只每五
tick 持久化。最後一個有效 tick 保留碰撞；短暫強效果結束時保留仍有效
的較弱效果，飢餓耗盡則移除所有同種效果。完成結算寫回一次，後續保存
不重複給飢餓。其他狀態讀者也不會提前刪掉尚待結算的醇熱索引。

交叉審查另補上兩個交互邊界：醇熱中途保存前，先按既有洞察→草叢潛行
順序結算已跨界的脈衝，避免保存把其比較前像覆蓋；後續五 tick 工作不會
重發。同一 tick 到期的強／弱醇熱一起結束，只有確實更長的弱效果保留，
避免弱效果在次 tick 再給一次飢餓。

`tools/ardent-heat-adapter.test.mjs` 的實際 callback／元件 double 覆蓋
最後一 tick 的順序、兩次保存間耗盡、站立耗盡、仍有飽和度、隱藏弱效果
和其他狀態讀者。這些是腳本時序證據，並未模擬 Minecraft 玩家，也沒有
用本次無玩家引擎觀察宣稱玩家飢餓／碰撞手感已驗收。

## 血腥瑪麗的生物攻擊者

原作死亡事件接受有此效果的任意 `LivingEntity`，回復死者最大生命的
三分之一向下取整。移植先在效果入口、再在死亡事件把攻擊者限定為玩家，
因此紅皇后／甜莓酒的原生酒架投射效果即使命中生物，也無法生效。

現在僅為血腥瑪麗開放既有生物效果計時路徑，死亡事件核對生物類型與
原生歸屬，仍排除自身、載具、重複事件及過期效果。原生生命元件負責
實际讀写與最大生命上限。其他未實作的玩家專用適配沒有被一併開放。

隔離 BDS 的實際觀察為：狼生命 2，帶血腥瑪麗，原生 `applyDamage`
以該狼為來源殺死最大生命 10 的牛；正式死亡事件路徑將狼回復至 5。
事件中死者有效但當前生命為 0，三 tick 後效果剩餘 597 tick。觀察者的
事件訂閱執行在正式回血訂閱之前，因此其事件欄位 `sourceHealth: 2`
不是回血失敗；事後獨立原生讀回為 5。這沒有驗收真人飲用、實際投射
碰撞、狼 AI 攻擊、存檔重啟或 Java 可執行治療 hooks。

## 摸金校尉的裝備邊界

同一輪原生觀察中，骷髏、殭屍、掠奪者、豬布林、狼和盔甲座的
`getComponent('minecraft:equippable')` 全部返回 `undefined`，原生
`getComponents()` 列表也沒有該元件。其中前四種包含原作可卸裝的目標。
既有 `handleTombRaider` 在這些目標會於裝備讀取處返回，不能把其
script-double 測試或 `disarm_drop_adapter` 標籤當作原生卸裝成功。

官方 `EntityEquippableComponent` 文件描述玩家上存在此元件。沒有證據
能由此 API 無損取出上述怪物主手的完整 ItemStack；本批不以猜測武器、
命令覆蓋或重生怪物替代原作卸裝。此項仍是已證實的平台／實作缺口。

## 證據與重現

[原生能力紀錄](../data/native-cocktail-effects-capabilities-20261008.json)
保存完整七項觀察、原始完整 log 與 runner 結果的摘要、確切腳本輸入、
零玩家與退出條件。[裁剪 log](evidence/native-cocktail-effects-api-20261008.log)
保留引擎身份、所有觀察行和正常停止行；原始完整檔保留於紀錄指向的
`audit_work`，沒有將其改寫成發布候選的驗收。

重現使用現有 runner 的單階段入口和新的隔離目錄；`--engine` 指向既有
已停的 BDS 1.26.52.3，`--liquor` 為配對 canonical World Liquor，
`--work` 必須尚不存在。不能把 live 世界或既有失敗現場作為 work。

```sh
python tools/native/run_living_effects.py --engine /path/to/stopped-engine \
  --liquor /path/to/world-liquor --work /path/to/new-isolated-work \
  --port 27320 --probe tools/native/cocktail-effects-api-probe.js --phases first
```

交叉修正醇熱脈衝／同時到期後，因完整腳本輸入已改，再以新的隔離世界
執行同一個單階段 probe，將紀錄與 log 更新到最終精確輸入；首次已通過
的原始檔與輸入摘要仍保留於 `prior_observation`，没有擴大原生場景。
每次都只執行一個新世界階段。runner 確認原生觀察完成、零玩家連線、
沒有引擎／content ERROR，並正常停止、退出碼 0；沒有新增重啟或玩家
測試。此 observer 載入正式腳本與配對兩包，加上清楚標示的測試入口，
不是完整家族或客戶端驗收，也不是已部署版本。

官方穩定 API 與本機官方 `@minecraft/server 2.7.0` 型別共同核對：

- [EntityAttributeComponent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityattributecomponent?view=minecraft-bedrock-stable)：`currentValue`、`effectiveMax` 與 `setCurrentValue`。
- [EntityHungerComponent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityhungercomponent?view=minecraft-bedrock-stable) 與 [EntitySaturationComponent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entitysaturationcomponent?view=minecraft-bedrock-stable)：食物與飽和度的原生元件。
- [EntityDieAfterEvent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entitydieafterevent?view=minecraft-bedrock-stable) 與 [EntityDamageSource](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entitydamagesource?view=minecraft-bedrock-stable)：死者與傷害來源，不是捏造的玩家事件。
- [EntityEquippableComponent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityequippablecomponent?view=minecraft-bedrock-stable)：装備 API 的玩家存在性說明；目標怪物是否提供該元件由本次原生觀察判定。
