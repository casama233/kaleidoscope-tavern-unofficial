# 0.6.141：保留四頁指南並修復板面與雪克杯手勢

精確 predecessor 為已發布主線
`79e2ad0fb9f5a59f93be41aee002ddf2a809d71b`，配套 W118／G122。
完整承接 T140 的 Kirsch、Kriek、酸櫻桃與酸櫻桃汁桶四頁 AMW 指南，
保留三語七入口、兩個指南共用投影、分類與品質 4 門檻；原登記資料、
配方及包身份不改。T139 以前的保存、光效／重啟及靜默操作修補保留。

- **板面：** 當前空格先記錄再判斷溢出，消耗該分隔符，不回退較早空格；index 0 也可換行，完整長詞移至下一行。小板 70 units、明確換行及 Word 對齊不變；保留黑字 cream outline、八向描邊、遠距 foreground 和板心 48 格 cull。
- **雪克杯：** 短交易以原生 clone／雙向相容及可讀 metadata 核對，扣料必須證明同一份來源，只有已證明不同才解除 owned 防重。2 瓶點擊排隊後改為 3 瓶再正式點擊，舊手勢拒絕、新手勢只加入 1 瓶；native／false／itemUse echo、最後空手防誤拾取及 foreign cancel 保留。
- **W118 生物類別：** 84 個原版 LivingEntity 對應與 Tavern projection 一致，無 mob family 的魚類進入既有 MultiJump／Tequila／instant／credit 路徑，排除僅有 health 的非生物。死亡不改類別，後續 mob credit 仍要求存活。

板面來源分列 Forge `c4ec1880`、NeoForge `a1afba34` 的
`TextBlockEntityRender`，空格順序另核 Mojang 1.21.1 `StringSplitter`
bytecode；未執行字型 oracle。W 的效果權威為 CF9066406、NeoForge
1.21.1 World Liquor 1.1.11，Forge／Neo 事件階段不合併宣稱。

功能及相關測試檔承接已審查 T
`67822848d85240640867f10d3bd6fc613262a8d1` 與 W
`0c311dab5b1488add7f8118bb0dca7d8302acd62` 的相同修補。來源回歸證據保留：板面
`board-rendering.test.mjs` 5 項與 layout 檢查、最後 10 個 shaker
station witness 案例、W kill-credit／combat-source 26 項及獨立
8 項交叉回歸。交叉審查補出 index 0 與 2→3 fresh true 反例。
這是相同檔案的來源／API 證據，不宣稱本次重跑整批。

舊分支的 T140／W117 修補試驗及 native first 21／restart 22 成功保留
原身份；不覆寫主線已發布 T140 note／history，也不改名為本版證據。
新 T141／W118 paired native **pending**，完整 CI 另跑；實際結果由
本候選的首次／保存／重啟與嚴格 recorder 證據補入。

彩字 per-viewer feet-versus-camera 16 格／第一人稱 spyglass、純 roll、
多行 editor、任意 NBT／三份任意裝飾非堆疊原料及其他既有差距未完成。
真人畫面／操作／音效、私人完整家族、fresh stopped-world 演練與 LIVE
讀回仍 pending；持續部署授權不變。`client=false`、
`production_ready=false`、`live_deployment=false`。
