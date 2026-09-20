# Tavern 歷史快照

這個目錄保存 A17 與 C1～C5 的階段成果；**現行開發仍以倉庫根目錄的 C6 為準**。

為避免在 Git 歷史中重複五遍同一套大型 A17 模型／貼圖，C1～C5 的 `*-source-snapshot.zip` 是「程式歷史快照」：保留當時的 BP、腳本、tests、tools、SDK、docs、data/來源鎖、examples、compat，以及會影響行為的 RP 控制檔；重複的大型模型／貼圖／音訊仍以 A17 與現行 `art/` 為基線。

每個階段同時保留當時可直接安裝的 DEV `.mcaddon` 與可選 Demo `.mcpack`。這些是歷史測試包，不應與 C6 同時啟用。

## 階段索引

- **A17** — 資產完成基線：完整 VisualLab／PoseLab、來源 intake；目前 main/art 是後續共用的美術基線。
- **C1** — 獨立酒館指南／附屬 API 與首批壓榨、酒桶 runtime。
- **C2** — 種植、品質酒瓶與原生酒效。
- **C3** — 十二固定雞尾酒、雪克杯、特調與杯具流程。
- **C4** — 可攜雪克杯、PUT／手持動效與沉浸式流程。
- **C5** — 原生長按事件、原生藥水資料、首批專屬酒效。

## 驗證

- `CHECKSUMS.sha256`：本次進 Git 的所有歷史二進位／快照 SHA-256。
- `source-snapshots.json`：C1～C5 精簡快照相對於原完整 ZIP 的檔案數、大小與 SHA-256。
- 各 `*-source-snapshot.zip` 內含當時的 README 與 docs，可直接追溯每一階段的限制與測試結果。

## 不包含

- 不重複提交 C1～C5 完整 23～26MB ZIP 中完全相同的 A17 大型美術副本。
- 不把歷史 DEV 包當作目前發布版；它們僅用於回溯和對照。
- 不包含 Cookery 本體、原 Tavern JAR 或字型檔。
