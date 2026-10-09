## 當前維護基線：0.6.140

T140／W117 修正板面溢出／行首空格換行、雪克杯延後扣料的原生 metadata 核對與數量改變後的新點擊，配套修正 W 對無 `mob` family 原版生物的類別判定。三語指南、七入口、Cookery 共用入口與既有修補完整保留，配套 G122。[本版說明](docs/RELEASE-NOTES-0.6.140.md)分列來源與定向回歸；新增配套原生、真人、私人完整家族與 LIVE 驗證仍 pending。

# 森羅物語：酒館（非官方）

T136 全面重修三語指南，保留完整製作方法，獨立書與可選料理入口共用顯示；[指南修訂](docs/RELEASE-NOTES-0.6.136.md)。[T139](docs/RELEASE-NOTES-0.6.139.md) 整合原料、光效、倒轉 Mob 與沉浸修補，並通過其固定配套的原生場景；T140 保留該已發布基線，新候選仍另做配套驗證。

T132 統一濺射瞬時效果與來源免疫，修復雪克杯回呼誤操作／失敗重試及保存回滾、感知類別和查詢順序，補上指南逐格動畫、板面反斜線保存及較短 HUD 尾巴；[變更及驗收範圍](docs/RELEASE-NOTES-0.6.132.md)。[PR 處置索引](docs/audit/PR-DISPOSITIONS.md) 保留尚未完成的工作及先前證據。

Java酒館的基岩版移植，包含釀造、調酒、酒架／酒櫃、家具與獨立酒館指南。指南保留共用七入口；Cookery整合使用同一份內容。[English](README.md)。

## 現行來源與需求

- 版本及精確相依以 [baseline.json](baseline.json) 為準；更新見 [CHANGELOG.md](CHANGELOG.md)。
- 本輪公開家族候選為酒館 **0.6.140**、世界名酒 **0.1.117**、煙火 **2.8.122**；精確內容由[家族鎖](family/upstream.lock.json)與固定 CI 提交決定，[當前索引](docs/audit/PR-DISPOSITIONS.md)集中未完成工作及既有問題報告。
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

來源一致與引擎載入不能證明客戶端畫面、音效或整條玩法。機器數量、支援的可堆疊原料 metadata、RGB 原作 texel 明暗、板面描邊與光效所有權已有修補；材質實際顯示仍待真人。純相機 roll 未實作，現有 yaw 適配須明確 opt-in；彩字 16 格的逐觀看者腳位／相機判定、第一人稱望遠鏡、任意 NBT／三份任意裝飾非堆疊原料、穿牆輪廓、原生多行板面編輯器、掉落雪克杯展示及部分原生效果仍有差距。新增的雙手／動畫物品與全視角、輸入、材質矩陣需真人核對。現行擁有者規則及 LIVE 開發授權不變。

## 授權與歷史

酒館原作程式BSD-3-Clause、美術CC BY-NC-SA4.0，字型及其他素材各保留自己的聲明。見[CREDITS.md](CREDITS.md)、LICENSE-CODE、LICENSE-ASSETS。旧安装／下载说明移到[歷史封存](docs/archive/pre-reorganization-README.zh-TW.md)。bridge編輯開啟根config.json；見[工作流程](docs/BRIDGE-WORKFLOW.md)。
