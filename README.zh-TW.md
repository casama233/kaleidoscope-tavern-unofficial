## Current maintained baseline: 0.6.128

# 森羅物語：酒館（非官方）

T128 已修復可安裝輸出的凍結身分檢查，以及手持雪克杯的名稱／資料保存與取消操作；[變更及驗收範圍](docs/RELEASE-NOTES-0.6.128.md)。[PR 處置索引](docs/audit/PR-DISPOSITIONS.md) 保留尚未完成的獨有工作。

Java酒館的基岩版移植，包含釀造、調酒、酒架／酒櫃、家具與獨立酒館指南。指南保留共用七入口；Cookery整合使用同一份內容。[English](README.md)。

## 現行來源與需求

- 版本及精確相依以 [baseline.json](baseline.json) 為準；更新見 [CHANGELOG.md](CHANGELOG.md)。
- 本輪公開家族配套為酒館 **0.6.128**、世界名酒 **0.1.105**、煙火 **2.8.117**；[家族鎖](family/upstream.lock.json)與固定 CI 來源一致，[當前索引](docs/audit/PR-DISPOSITIONS.md)集中六條未完成工作及既有問題報告。
- 基岩版1.26.50以上；目前引擎目標為BDS1.26.51.1。BP與RP兩側一起啟用。
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

來源一致與引擎載入不能證明客戶端畫面、音效或整條玩法。純相機roll未實作，現有可選yaw適配會影響瞄準；任意特調顏色陰影、全視角／手別／材質矩陣及部分原生效果仍未完成驗收。現行擁有者規則及LIVE開發授權不變，改制提案另待批准。

## 授權與歷史

酒館原作程式BSD-3-Clause、美術CC BY-NC-SA4.0，字型及其他素材各保留自己的聲明。見[CREDITS.md](CREDITS.md)、LICENSE-CODE、LICENSE-ASSETS。旧安装／下载说明移到[歷史封存](docs/archive/pre-reorganization-README.zh-TW.md)。bridge編輯開啟根config.json；見[工作流程](docs/BRIDGE-WORKFLOW.md)。
