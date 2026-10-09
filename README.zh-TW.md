## Current maintained baseline: 0.6.138

T137 修正原生重啟時，把已保存效果的載入通知誤認為外部接管、導致光效紀錄消失的問題；保留 T136 的倒轉 Mob 選取及配套 W114 的已確認重生錨互動。完整配套及真人驗收邊界見 [本版說明](docs/RELEASE-NOTES-0.6.137.md)。

T138 整合原生效果倒數暫停的時計修復，以及 T137 已經真實重啟通過的載入通知修復；完整保留原料、視覺、沉浸、倒轉 Mob 與世界名酒重生錨功能。候選配對 W115／G120；[本版說明](docs/RELEASE-NOTES-0.6.138.md)區分當前實作、歷史證據與真人／私人 LIVE 驗收。

T135 承接 [T134 的全部原料、交易、視覺與沉浸修復](docs/RELEASE-NOTES-0.6.134.md)，補齊真實 CI 揭露的 25 份 PBR 資源、原生 Adventure 清單 ID 支援及 Ardent 測試 fixture。候選改配 W112；T134 失敗紀錄與 W111 已成功的 CI 各自保留。[本批修復及驗收範圍](docs/RELEASE-NOTES-0.6.135.md)集中說明新增差異與 pending 狀態；[PR 處置索引](docs/audit/PR-DISPOSITIONS.md)保留原 PR 的實際處置。

Java酒館的基岩版移植，包含釀造、調酒、酒架／酒櫃、家具與獨立酒館指南。指南保留共用七入口；Cookery整合使用同一份內容。[English](README.md)。

## 現行來源與需求

- 版本及精確相依以 [baseline.json](baseline.json) 為準；更新見 [CHANGELOG.md](CHANGELOG.md)。
- 本輪公開家族候選為酒館 **0.6.138**、世界名酒 **0.1.115**、煙火 **2.8.120**；精確內容由[家族鎖](family/upstream.lock.json)與固定 CI 提交決定，[當前索引](docs/audit/PR-DISPOSITIONS.md)集中未完成工作及既有問題報告。
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

來源一致與引擎載入不能證明客戶端畫面、音效或整條玩法。微醺預設不移動瞄準，舊 yaw 適配只由明確 opt-in 啟用，純相機 roll 仍未實作。機器完整原料與雪克杯支援的可堆疊資料已有來源修復；任意三份裝飾非堆疊原料仍完整拒絕。新 RGB 明暗、板面描邊及身體粒子需真人比較；穿牆輪廓、多行板面編輯器、掉落雪克杯展示上下文、reach／step-height／XP pickup／清除仇恨及部分原生效果語義仍有差距。T136／W113 最終 CI、原生、真人及 LIVE 結果各自待確切證據，現行擁有者規則及 LIVE 開發授權不變。

## 授權與歷史

酒館原作程式BSD-3-Clause、美術CC BY-NC-SA4.0，字型及其他素材各保留自己的聲明。見[CREDITS.md](CREDITS.md)、LICENSE-CODE、LICENSE-ASSETS。旧安装／下载说明移到[歷史封存](docs/archive/pre-reorganization-README.zh-TW.md)。bridge編輯開啟根config.json；見[工作流程](docs/BRIDGE-WORKFLOW.md)。
