# Tavern A11 — 姿態缺口補強批次

**A11 沒有新增原作模型／貼圖來源檔，這一輪主攻仍可在現有來源上推進的美術缺口：手持／GUI／掉落姿態整理與驗收入口。**

主包仍是 A10 的累積美術成果：瓶裝排列 **25 類／97 個**、雞尾酒靜態模型 **14／14**、吧檯 **6 種**、Holder **1 種**、三種展示架、三類酒櫃、沙發、葡萄藤／棚架／釀造靜態美術等，都已保留在 A11 內。

## A11 這輪實際補了什麼

| 範圍 | A11 成果 | 說明 |
|---|---|---|
| PoseLab 索引 | **55 種外觀 / 40 份幾何** | 針對所有已取得且原作 JSON 帶 `display` 的外觀，整理出姿態候選索引 |
| 分組給物品函數 | **6 組新 mcfunction** | `kt_a11/pose_all`、`pose_cocktails`、`pose_sofa_palette`、`pose_trellis`、`pose_cabinets`、`pose_racks`、`pose_misc` |
| 姿態檢視文件 | `docs/A11-POSE-SUMMARY.json` | 列出每個資產對應的 block id、分類與 contexts |
| 離線姿態頁 | `previews/pose-gallery.html` | 可搜尋 55 個姿態候選，快速查 GUI / ground / fixed / first / third person |
| 受阻範圍說明 | `docs/A11-BLOCKED-SCOPE.zh-TW.md` | 清楚標明為何家具、燈具、板件這輪仍未新增 |

## 這輪沒有做什麼

- **沒有新增新的上游原始模型／PNG。**
- **沒有把家具、燈具、黑板、畫、香薰等不存在於本地來源集的內容硬猜出來。**
- **沒有加入玩法邏輯。** 依然不含飲用、調酒、釀造、座位、存物、自動連接、液位變化或粒子運行邏輯。
- **沒有做引擎驗收。** Minecraft / bridge / Blockbench 真機載入仍未跑。

## 交付物

- `Tavern-Assets-A11.zip`：完整 A11 專案原始包。
- `Tavern-A11-VisualLab.mcaddon`：主 BP/RP 外觀實驗室。
- `Tavern-A11-PoseLab-OPTIONAL.mcpack`：可選 PoseLab 覆蓋包。
- `Tavern-A11-VisualLab+PoseLab.mcaddon`：主包 + PoseLab 一次打包的驗收組合。

## 遊戲驗收入口

先載入主包；若要看姿態，再把 PoseLab 放在主 RP 上方。於新測試世界執行：

```mcfunction
/function kt_a11/pose_all
/function kt_a11/pose_cocktails
/function kt_a11/pose_sofa_palette
/function kt_a11/pose_trellis
/function kt_a11/pose_cabinets
/function kt_a11/pose_racks
/function kt_a11/pose_misc
```

這些函數只 `give @s` 對應檢視物件，不清空世界、不自動擺放。

## 離線檢視

- `previews/index.html`：原本的 3D 外觀檢視器。
- `previews/pose-gallery.html`：A11 新增的姿態候選列表頁。

## 目前仍受阻的美術缺口

- 其他家具：高腳凳、桌、人字梯
- 燈具與香薰：吊燈、彩燈、香薰狀態／粒子
- 畫與板類：畫、黑板、告示牌

原因不是忘了做，而是 **本地 `upstream/` 與 `sources.lock.json` 仍沒有這些家族的原始來源檔**。A11 明確維持「**沒有正確來源，就不憑空補模型或重繪貼圖**」的原則。

## 版本與兼容說明

- 主包延續既有 `kt_assets_a10` 命名空間與既有方塊 ID，避免把本輪姿態補強誤當成另一次大規模資產換代。
- manifest 版本升為 **`[0,12,0]`**。
- 仍是美術驗收包，不代表 production 完成。

## 建議的下一步

1. 先取得家具／燈具／板件類的原始來源檔。
2. 再做下一輪（例如 A12）真正補進那批模型與貼圖。
3. 真機時優先驗收 PoseLab：看 GUI、ground、first/third person 是否偏移，再決定是否把部分姿態候選納入主包。
