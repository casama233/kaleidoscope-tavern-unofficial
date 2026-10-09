## 當前維護基線：0.6.141

T141／W118 保留下述 canonical T140 指南修訂與 G122 整合，再補入先前已測的 aura 載入／登入順序修復及更嚴格的原生證據 recorder。本候選的精確 CI、配對原生首次／重啟仍待完成，先前測試不移作新組合、真人或 LIVE 成功；見 [T141 修復範圍](docs/RELEASE-NOTES-0.6.141.md)。

T140／W117完成原作者風格的三語指南重修，補齊四頁料理聯動條目；七入口及兩個指南入口共用呈現，保留T139原生修補、W116重生錨資料及G122整合。實際範圍見[本版說明](docs/RELEASE-NOTES-0.6.140.md)。

# 森羅物語：酒館（非官方）

T136 全面重修三語指南，保留完整製作方法，獨立書與可選料理入口共用顯示；[本輪改動](docs/RELEASE-NOTES-0.6.136.md)。T139 整合已修正並通過固定 T138 原生場景的原料、光效、倒轉 Mob 與沉浸修補；新候選仍另做配套驗證。

T132 統一濺射瞬時效果與來源免疫，修復雪克杯回呼誤操作／失敗重試及保存回滾、感知類別和查詢順序，補上指南逐格動畫、板面反斜線保存及較短 HUD 尾巴；[變更及驗收範圍](docs/RELEASE-NOTES-0.6.132.md)。[PR 處置索引](docs/audit/PR-DISPOSITIONS.md) 保留尚未完成的工作及先前證據。

Java酒館的基岩版移植，包含釀造、調酒、酒架／酒櫃、家具與獨立酒館指南。指南保留共用七入口；Cookery整合使用同一份內容。[English](README.md)。

## 現行來源與需求

- 版本及精確相依以 [baseline.json](baseline.json) 為準；更新見 [CHANGELOG.md](CHANGELOG.md)。
- 本輪公開家族候選為酒館 **0.6.141**、世界名酒 **0.1.118**、煙火 **2.8.122**；精確內容由[家族鎖](family/upstream.lock.json)與固定 CI 提交決定，[當前索引](docs/audit/PR-DISPOSITIONS.md)集中未完成工作及既有問題報告。
- 基岩版1.26.50以上；目前引擎目標為BDS1.26.52.3。BP與RP兩側一起啟用。
- Cookery可選，家族目前核驗作者1.6.0；世界名酒須搭配其宣告的酒館版本。
- 升級前備份世界並移除重複舊包。私有料理整合是另一個識別明確的addon，不是私有酒館分支。

## 建置

現有檢查工具使用Python3.12+、Node22+及Pillow11.3.0。

```sh
python3 tools/build_release.py
```

打包器直接封装已提交runtime/BP、runtime/RP，輸出至dist/。無需私服目錄、舊產物或玩法補丁。生成器是明確的來源編輯工具，不是一般打包前置。

## 驗證與限制

本機只跑受影響的既有檢查，完整必要套件交canonical CI。[測試分類](docs/audit/TEST-AUDIT.md)分清Java真值、正式交易守恆／回滾、真引擎保存與建置前置；[還原度表](docs/PARITY-MATRIX.md)與[問題場景](docs/BUGS.md)維護實際狀態。

來源一致與引擎載入不能證明客戶端畫面、音效或整條玩法。任意 RGB 已實作原作 texel 明暗與透明覆蓋，實際材質、PBR／透明排序、遠距濾波和資源包堆疊仍待真人驗收。機器完整原生原料與支援的可堆疊雪克杯 metadata 已修，三份任意裝飾非堆疊原料仍不支援。純第一人稱附加 roll 未實作，明確 opt-in 的 yaw 適配仍影響瞄準；穿牆輪廓、正式多行板面編輯器、掉落雪克杯顯示情境及部分原生效果仍有差距。雙手／動畫物品、全視角、輸入與聲音需同候選真人核對。現行擁有者規則及 LIVE 開發授權不變。

## 授權與歷史

酒館原作程式BSD-3-Clause、美術CC BY-NC-SA4.0，字型及其他素材各保留自己的聲明。見[CREDITS.md](CREDITS.md)、LICENSE-CODE、LICENSE-ASSETS。旧安装／下载说明移到[歷史封存](docs/archive/pre-reorganization-README.zh-TW.md)。bridge編輯開啟根config.json；見[工作流程](docs/BRIDGE-WORKFLOW.md)。
