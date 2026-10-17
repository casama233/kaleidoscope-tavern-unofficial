# Tavern 歷史快照

這個目錄保存 **A17 與 C1～C5 的階段成果**；現行開發仍以倉庫根目錄的 **C6** 為準。

## 保存策略

為避免在 Git 歷史中重複五遍同一套大型 A17 模型／貼圖：

- **A17**：保留來源 intake、VisualLab 與代表性預覽。
- **C1～C5**：各有一份 `*-source-snapshot.zip`，保留當時的 BP、腳本、tests、tools、SDK、docs、data／來源鎖、examples、compat，以及會影響行為的 RP 控制檔。
- 重複的大型模型、貼圖與音訊仍以 A17／現行 `art/` 為共同基線。
- 舊 DEV `.mcaddon`／Demo `.mcpack` 屬生成交付包，根據倉庫政策**不直接提交到 Git**；它們的原始檔名、大小與 SHA-256 保存在 `artifact-catalog.json`，沒有假裝 bytes 已存在於倉庫。

## 階段索引

- **A17** — 美術／模型資產完成基線，包含彩燈、板類、酒瓶、動畫／粒子／液面接口等。
- **C1** — 獨立酒館指南、附屬 API、首批壓榨／酒桶 runtime。
- **C2** — 葡萄種植、品質酒瓶、原生酒效。
- **C3** — 十二固定雞尾酒、雪克杯、特調與杯具。
- **C4** — 可攜雪克杯、PUT／手持動效與沉浸式流程。
- **C5** — 原生長按事件、原生藥水資料、首批 Java 專屬酒效。
- **C6** — 現行主幹，不放在本目錄；直接看倉庫根目錄。

## 驗證文件

- `manifest.json`：只列 **Git 中實際存在**的歷史 payload。
- `CHECKSUMS.sha256`：只校驗 Git 中實際存在的二進位／快照。
- `artifact-catalog.json`：記錄未提交的歷史生成交付包之檔名、大小與 SHA-256。
- `source-snapshots.json`：C1～C5 精簡快照相對於原完整 ZIP 的檔案數、大小與 SHA-256。

各 `*-source-snapshot.zip` 內含該階段 README、docs 與測試／建置資料，可直接追溯當時的已完成功能、限制與驗證結果。

## 不包含

- 不重複提交 C1～C5 完整 23～26MB ZIP 中相同的 A17 大型美術副本。
- 不把歷史 DEV 包當作目前發布版。
- 不包含 Cookery 本體、原 Tavern JAR、字型檔或任何憑證／私密資料。
