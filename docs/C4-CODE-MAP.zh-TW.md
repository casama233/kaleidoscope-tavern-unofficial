# C4 程式入口

- `core/immersion.js`：可攜資料schema、原搖杯波形、12tick過場進度、有限液滴插點。純函數不碰引擎。
- `bedrock/mixology.js`：桌面／手持生命週期、暫態item ID、兩次使用、持有快照、杯位預約、延時交易、取消及孤立暫態修復。原C3配方規則在core/mixology.js不改。
- `bedrock/immersion.js`：非權威音效／粒子／原PUT動畫、helper去重、短期cue去重、停止手臂。所有錯誤記有限診斷，不改材料。
- `bedrock/machines.js`：原交易提交後的開／關蓋、壓榨、裝取汁回饋。
- `bedrock/guidebook.js`：獨立玩家計時輔助偏好，預設off；不動Cookery。
- `tools/build_c4.py`：在C1–C3生成後加attachable、動畫、helper、粒子和C4版本；原assets維持原樣。
- `tests/c4-core.test.js`／`tests/c4-runtime.test.js`：數值與事件/交易模擬，不會渲染Minecraft。

## 核心不變量

1. 同一實體工具的內容只存在世界station或物品payload其中之一；交換包含回退。
2. 手持session只保留驗證快照，不是可無條件重建工具的第二份背包。
3. 動作和音效在交易成功後才播；倒酒過場是預约、完成再交易。
4. 任何取消不擅自生產不存在的工具／產物；舊payload仍在的工具才復原。
5. 顯示item的active/pouring ID是有相同payload的暫態，不是新產品。
6. 原始recipe窗口、結果快照與public extension schema不改。
7. 專屬效果不作原生替代；儀式更完整不代表效果程式已實作。
