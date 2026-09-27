# Java 對齊修復記錄：0.6.53 preview 1

日期：2026-09-27。基線：Bedrock `7eea296e198b45fcaf3ff63cc74cde61d46682ad`（0.6.52）；Java `c4ec1880bd44cf3139d3ba744ab30bb379cf1416`，Forge 1.20.1 / Tavern 1.2.0。分支 `fix/java-parity`。

## 本批修改

| 項目 | 修改 | 驗證範圍 |
|---|---|---|
| 25 款放置酒瓶 | 按 Java `ModBlocks` 的 97 個瓶數形狀建碰撞盒；多盒聯集保留凹位；四個方向沿用模型轉換。 | 388 個朝向／瓶數狀態，原生實體落點。 |
| 15 種空杯／雞尾酒 | `8×10×8` 實體碰撞及選取盒。 | 原生實體落點、射線。 |
| 雪克杯 | `8×16×8` 碰撞及選取盒。 | 原生實體落點、射線。 |
| 酒桶 | N/S 外側沿 X 削去 4/16；E/W 外側沿 Z 削去 4/16；中心保持滿格。 | 104 個桶體部件狀態。 |
| 微醺 | 偏航替代需明確 opt-in；預設不呼叫 `setRotation`，仍保留酒效時間與提示。已有 opt-out 標記仍有效。 | 預設、啟用、停用與同時有兩標記的純規則檢查；3,601 個波形樣本。未聲稱完成純鏡頭 roll。 |
| 尖嘯 | 不再排除所有玩家；生存／冒險可受擊，需 `world.gameRules.pvp === true`。創造／旁觀免疫；冒險模式飲用者可發出音波。 | PvP 開關、遊戲模式、傷害倍率和射程規則通過；多人實際傷害／擊退待驗收。 |
| 玩家指南 | 增加長臂、尖嘯、微醺的實際體驗限制；修正舊調酒頁的「三項未實作」與 PvE 限定文字。 | 實際 Cookery 指南投影三語檢查。 |
| 主線修復保全 | 已包含 0.6.51 防重複掉落、0.6.52 `Player.inputInfo.lastInputModeUsed` 修正。 | 既有掉落／儲存／資產檢查維持通過。 |

### 修正原審查的一處來源錯誤

空瓶基形不能代表所有飲品。Java 在 `ModBlocks` 為每款酒覆寫形狀，例如葡萄酒單瓶為 `4×16×4`、伏特加單瓶 `8×15×8`，三瓶有多盒聯集。已修正原報告。來源固定於 `data/java-collision-shapes.json`，包含相關 Java 檔案 SHA-256，可重新解析原始碼驗證。

原生測試另抓到 Bedrock 本地 X 與 Java/world X 相反。初版直接平移座標在非對稱白蘭地／落霞及酒桶外緣出現 44 個落點錯誤；改為 `origin.x = 8 - javaMaxX` 後全部通過。此項不能只靠 JSON 數值相同來驗收。

## 驗證證據

- `python3 tools/check_release.py`：完整靜態檢查通過，含 1,923 份 JSON、926 個 geometry、本次碰撞與酒效政策檢查。
- `python3 tools/java_collision.py --java-source /root/tavern-official-current`：來源檔案雜湊、25 款／97 個瓶數形狀與 42 個修改方塊一致。
- 原生 BDS **1.26.51.1**：獨立新世界、Cookery **1.0.6**、本候選 Tavern；508 個狀態、4,172 個碰撞落點，全數通過。測試以寬／高 0.01 的臨時物理實體落下，直接讀取落地高度，未以模擬碰撞器代替引擎。
- 準星選取射線另驗 4,172 次，全數符合目前單盒選取定義；瞬間治療 1 tick 在原生牛實體以 amplifier 0–3 施放，結果為 5、9、10、10 HP，符合最大生命上限。完整記錄見 [BDS log](BDS-PARITY-0.6.53.log)、[結果 JSON](PARITY-VALIDATION-0.6.53.json)。隔離環境啟動曾提示缺少 allowlist.json（allow-list=false），不影響測試完成；已補上空白名單檔。
- 測試方塊與探針僅放在隔離世界；探針實體、測試腳本不包含在交付 BP/RP。
- 本批未進入 luosen、未變更其世界、玩家資料或掛載包。未取得真人手機／鍵鼠多人驗收證據。

## 保留的差距與後續驗收

1. **微醺 roll**：目前穩定版一般遊玩鏡頭旋轉接口只有 X/Y；保留真實狀態，預設停用會影響瞄準的替代。可選啟用 `/function kt_tipsy_motion_on`，停用 `/function kt_tipsy_motion_off`。這是修正副作用，並非還原 Java roll。
2. **長臂**：仍是酒館物品放置路徑 6→9 格；沒有完成一般挖掘、近戰或原版互動距離。指南已明示。
3. **草叢隱匿／高跟鞋**：尚未完成 Java 的清除既有仇恨／增加 step-height 語義，既有隱身與跨格位移仍屬替代實作。
4. **多盒選取**：Bedrock 選取盒為單盒，因此三瓶 T 形的準星選取使用緊密包圍盒；碰撞則是精確多盒。不能稱選取凹位也完全一致。
5. **尖嘯**：PvP true/false、冒險／生存施放、創造／旁觀免疫、死亡及傷害保護需要兩名玩家驗收；保留 256 目標上限及原生 `applyDamage` 拒絕時不擊退的行為。
6. **酒櫃**：已包含主線輸入屬性修復；仍需鍵鼠／觸控依視覺逐格放入與取出有辨識資料的酒，確認選中格和返還資料。
7. **其他原報告項目**：物品手持動畫、透明渲染、狀態圖標、完整多包相容性與生產流程回歸尚未納入本批驗收。

## 重現方式

1. 使用 BDS 1.26.51.1 的**隔離世界**掛載 Cookery 1.0.6 與本 `runtime`，開啟 content log；不得在正式存檔放置探針。
2. `python3 tools/java_collision_probe.py --output <隔離 BP>/scripts/parity-probe.js`；隔離 BP 的 `main.js` 加入 `import './parity-probe.js'`。
3. 在隔離 BP 加 `parity:probe` entity：`minecraft:collision_box` 寬／高皆 0.01，`minecraft:physics` 的 gravity/collision 皆 true，health 20，pushable false；只需 server entity，無 AI。
4. 啟動，等 `PARITY_DONE` 後正常停止。查 `PARITY_RESULT` 和 `PARITY_INSTANT_HEALTH`。fixture 會清空 (1024..1087, 80..84, 1024..1087) 的測試區域，請只用可捨棄的測試世界。

## API 依據

- [GameMode 枚舉](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/gamemode?view=minecraft-bedrock-stable)
- [GameRules](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/gamerules?view=minecraft-bedrock-stable)
- [CameraSetRotOptions](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/camerasetrotoptions?view=minecraft-bedrock-stable)
- [Java 上游 ModBlocks](https://github.com/KaleidoscopeMods/KaleidoscopeTavern/blob/c4ec1880bd44cf3139d3ba744ab30bb379cf1416/src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/init/ModBlocks.java)
