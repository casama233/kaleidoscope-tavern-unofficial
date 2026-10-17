## 當前維護來源：0.6.173

**2026-10-17核對來源：[115942e5](https://github.com/casama233/kaleidoscope-tavern-unofficial/commit/115942e55e9946cfd257fbcdc41c849f75b77509)；公開來源配套T173／G150／W151。** 穩定作者身份／存檔適配與後續P48／private-integration窄修各自保留來源及整套驗收邊界。

**公開下載：[酒館v0.6.170](https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/tag/v0.6.170)**，配世界名酒0.1.148及可選G149來源檢查配套。G149公開包使用Cookery1.6.0；G150目前來源使用1.6.1。安裝時依選定版本的相依讀取。

**倉庫最後記錄的LIVE批次：T169／G144／W147／private-integration，部署於2026-10-15 22:40:27 HKT，下一來源批次開始時記錄核驗。** 本次文件核對沒有連線服務器。來源、下載及部署的詳細證據只維護在[家族現況與修復主線](family/BASELINE-STATUS.md)。

目前仍需完整家族同批准入、**全部物品Blockbench第一人稱／側面貼圖檢查**及具體玩法、聲畫驗收。T160側面、T167游標與T169圖形過期修補已保留；詳見[差距矩陣](docs/PARITY-MATRIX.md)和[玩家回饋](docs/BUGS.md)。`client=false`、`production_ready=false`、`pending_client_acceptance`。

T170／G149／W148依使用者已核准的來源／編輯器／CI／包證據作穩定通道發布，本次整理不新增該發布的真人門檻。[早期README完整記錄](https://github.com/casama233/kaleidoscope-tavern-unofficial/blob/115942e55e9946cfd257fbcdc41c849f75b77509/README.zh-TW.md)與逐版說明保留原範圍。

# 森羅物語：酒館（非官方）

Java酒館的基岩版移植，包含釀造、調酒、酒架／酒櫃、家具與獨立酒館指南。指南保留共用七入口；Cookery整合使用同一份內容。[English](README.md)。

## 現行來源與需求

- 版本及精確相依以 [baseline.json](baseline.json) 為準；更新見 [CHANGELOG.md](CHANGELOG.md)。
- 來源、公開下載、倉庫最後記錄的部署與驗收統一見[家族現況](family/BASELINE-STATUS.md)；[PR處置](docs/audit/PR-DISPOSITIONS.md)保留歷史來源。
- 基岩版1.26.50以上；目前引擎目標為BDS1.26.52.3。BP與RP兩側一起啟用。
- Cookery可選，家族目前核驗作者1.6.1；世界名酒須搭配其宣告的酒館版本。
- 升級前備份世界並移除重複舊包。私有料理整合是另一個識別明確的addon，不是私有酒館分支。

## 建置

現有檢查工具使用Python3.12+、Node22+及Pillow11.3.0。

```sh
python3 tools/build_release.py
```

打包器直接封装已提交runtime/BP、runtime/RP，輸出至dist/。無需私服目錄、舊產物或玩法補丁。生成器是明確的來源編輯工具，不是一般打包前置。

## 驗證與限制

本機只跑受影響的既有檢查，完整必要套件交canonical CI。[測試分類](docs/audit/TEST-AUDIT.md)分清Java真值、正式交易守恆／回滾、真引擎保存與建置前置；[還原度表](docs/PARITY-MATRIX.md)與[問題場景](docs/BUGS.md)維護實際狀態。

來源一致與引擎載入不能證明客戶端畫面、音效或整條玩法。機器數量、支援的可堆疊原料 metadata、RGB 原作 texel 明暗、板面描邊與光效所有權已有修補，實際材質仍待真人。純相機 roll、彩字逐觀看者 16 格腳位／相機判定與第一人稱望遠鏡、任意 NBT／三份任意裝飾非堆疊原料、穿牆輪廓、原生多行板面 editor、掉落展示及部分原生效果仍有差距；現有 yaw 適配須明確 opt-in。雙手、動畫、視角、輸入及材質需真人核對，既有 LIVE 開發授權不變。

## 授權與歷史

酒館原作程式BSD-3-Clause、美術CC BY-NC-SA4.0，字型及其他素材各保留自己的聲明。見[CREDITS.md](CREDITS.md)、LICENSE-CODE、LICENSE-ASSETS。舊安装／下载说明移到[歷史封存](docs/archive/pre-reorganization-README.zh-TW.md)。bridge編輯開啟根config.json；見[工作流程](docs/BRIDGE-WORKFLOW.md)。
