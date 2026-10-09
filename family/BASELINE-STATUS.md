# 家族現行基線與差距

**2026-10-09 20:13:58 香港時間**：luosen 已部署 **酒館0.6.143／燒烤2.8.124／世界名酒0.1.120／沉浸進食1.1.0**；Cookery1.6.0、私有料理1.0.30。引擎1.26.52.3，完整 **42包（22BP／20RP）**、RUNNING、poststart `ok=true`／`errors=[]`。`client=false`、`production_ready=false`、`pending_client_acceptance`。

## 本輪修補與真實剩餘範圍

| 包 | 已修與保留 | 剩餘差距 |
|---|---|---|
| Tavern T143 | 精確酒館三語scope的原生單行容量640／700／3000；原保存限制320／350／1500及stale／reach／wax防線不變。保留全部指南、雪克杯、原料／存檔及光效修補。 | 正式多行、真controller／焦點／输入；任意三份裝飾原料；純roll／穿牆輪廓／名字裝備隱藏、原生Player及完整聲畫。 |
| Grilling G124 | 取料、HUD與食用共用可保存／重新載入的調料映射；後覆寫、讀回／回滾及舊存檔預設。合併兩個重複palette parser，原八種素材不變；保留API0.2.10與G122守恆／品質。 | 需明確Server provider，不自動讀Java datapack或任意producer；任意秘製串背包圖示、完整宿主操作／食用／保存事件及聲畫仍待完成／實測。 |
| World Liquor W120 | 斬首／肘擊依direct LivingEntity判定，斬首要求存活，ground-crit規則保持。保留84類含魚、67頁、配方／作者資源及確認錨。 | Incoming取消／重入／fallback／marker／causal drops、SkullOwner、Luck loot、Elbow原力合成、CaptainGift碰撞、automation與26.1.2整分支。 |
| Immersive Eating1.1.0 | CF9104552完整原包、新UUID／API／相依已審查；新四食物／原指南／手部動畫／音效。新owner遷移完成，本次舊owner資料0筆，不冒充非空音效偏好遷移。 | 真玩家進食、第一人稱、音效啟停與設定保存待接受；不由headless載入推定渲染。 |

詳各canonical [Tavern matrix](../docs/PARITY-MATRIX.md)、[Grilling matrix](https://github.com/casama233/kaleidoscope-grilling-unofficial/blob/main/docs/PARITY-MATRIX.md)、[World Liquor matrix](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/blob/main/docs/PARITY-MATRIX.md)。共享指南入口／fallback、獨立安裝SDK及legacy保存讀取各有用途，保留；歷史原型與來源不刪。

## 來源與當次證據

- T：[PR313](https://github.com/casama233/kaleidoscope-tavern-unofficial/pull/313)及[PR314](https://github.com/casama233/kaleidoscope-tavern-unofficial/pull/314)，部署捕獲`b01cdd9970231c8e7484332dbec7bd81ef62237f`；runtime956727d8。見[T143](../docs/RELEASE-NOTES-0.6.143.md)。
- G：[PR189](https://github.com/casama233/kaleidoscope-grilling-unofficial/pull/189)，部署捕獲`f60d8e90b7a0848c0e8673353e105221ba2da21d`；runtime469441bc。見[G124](https://github.com/casama233/kaleidoscope-grilling-unofficial/blob/469441bc6556b5e91adedfd44876ac072572012a/docs/STATUS-A2.8.124.md)。
- W：[PR101](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/pull/101)，部署捕獲`95c7193ddc3e17f8c7c362df8d2cb88171f9225b`；runtimeaf5af53f。見[W120](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/blob/5c09f0375e5ea2f7dbaf5b69d01bf8227e86816a/docs/RELEASE-NOTES-0.1.120.md)。
- 本次紀錄`20261009-gap-repairs-t143-g124-w120-ie110-preimage`，reviewed SHA **`e242d37dfbd80215c0ba86881ca2d8d9d72827b1e7592aed6f8bae20b5bb445c`**，政策installed與延期真人登記綁同SHA。完整42包static、新世界first／restart、本次fresh正常停服備份與保存first／restart、family_guard／BSM准入及逐檔／順序讀回通過。
- 18筆玩家資料及2容器內容保存；非空T原生儲存的ledger／完整物品NBT保留。冰櫃輸入0樣本，不能當非空操作證據。作者UUID經隔離演練後採用已審DB副本，原停服DB／回退保留，`level.dat`未替換。
- 真Cookery接收Tavern **227條目／31分類／681組三語正文**；七入口／子分類／單品圖示與94製法不變。沉浸進食另有 **23條目**及三語導航／設定，不混入酒館總數。兩個observer只在隔離QA，沒有進LIVE。
- Poststart **407 warnings／0 errors**，包括既有97853 block permutations及載入提示；沒有效能或完整Java一比一接受。首次／重啟與接收皆0玩家／無模擬玩家。

## 作者與維護

依[java-upstream.json](java-upstream.json)分開追蹤Tavern1.2.0（Forge1.20.1／Neo1.21.1）、Grilling1.1.1兩分支、World Liquor Forge1.1.12／Neo1.21.1的1.1.11；未發布T26來源與W26／1.1.6仍另列。W共享obsidian1000／1800→1、milk識別與高度已承接，magma3僅legacy；customLuck／BlockDrops／註冊等26差異仍待適配，見[原審查與重估](world-liquor-26.1.2-1.1.6-review.json)。

Bedrock作者鎖為Cookery1.6.0、ChineseFood1.0.4、ImmersiveEating1.1.0、Nether1.0.1、End1.0.1；國味1.0.10430是登記相容變體。私有料理及24個preserved包保持當次收據來源；不以私服版號當作者最新。[沉浸進食適配](IMMERSIVE-EATING-110-ADAPTATION.md)。

原CI失敗、遷移宣告RP摘要转录錯誤的拒絕候選及容量預檢保持原證據；修正原包核對後由PR314合併，沒有改寫舊收據或绕過准入。舊進度只保留[release notes](../docs/RELEASE-NOTES-0.6.142.md)／[PR處置](../docs/audit/PR-DISPOSITIONS.md)等來源入口，不複製成新「當前」。

依[MAINTENANCE.md](MAINTENANCE.md)及[UPDATE-WORKFLOW.md](UPDATE-WORKFLOW.md)維持逐候選授權／一致備份／完整家族准入；每5分鐘漂移、每6小時作者唯讀查核、每小時canonical清理。文件整理不改runtime、包身份、原始收據或重啟LIVE。
