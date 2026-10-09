# 沉浸進食 1.1.0 適配

2026-10-09 官方 CF9104552／project1697816，作者 Loyallay（125441763），原包 SHA256 `81575e63b40e2db4f58f0ab37b2aaa1854ff6ad564ba15e0acefa1f63c2f2fbf`。官方下載長度與 SHA1 已核對；原包留在本機證據，不將作者完整腳本搬進公開倉庫。

## 審查結果

- BP／RP 都換作者 UUID，模組版本及雙向相依為 1.1.0；`@minecraft/server` 仍為 2.7.0，最低引擎仍 1.26.1。使用完整原包，沒有覆寫 manifest 偽裝更新。
- 新增佛跳牆、花茶、櫻吹雪、毛血旺的食物呈現，更新手部動畫／第一人稱 player 配置及原音效，新增分段音效、指南章節與每玩家音效設定。原有食物 ID 保留。
- 原指南使用 Cookery 既有公開登記協議；不新增酒館七入口內的重複頁或第二套酒館 UI。Cookery 標準 locale 正文修補仍由已登記的 Grilling helper 組裝，不能靠翻譯偷偷改玩法。
- 私有料理來源沒有舊沉浸進食 UUID／版本硬相依；不因第三方更新重製私有整合。完整家族的 RP 優先順序、第三方 player 控制器及其他指南章節仍交當次 static／BDS 相容檢查與真人畫面驗收。

## UUID 與保存

[canonical 遷移宣告](identity-migrations/immersive-eating-100-to-110.json)逐側綁定舊 manifest、兩版官方 archive／file ID 與新作者 UUID。只遷移原 BP dynamic-property owner，RP 不擁有保存資料；其他包、actor／玩家資料及容器內容保持。

工具由 Cookery 單一 project 的硬編碼改為核對 canonical 鎖中唯一作者 project、完整新 pair／archive／file ID，以及兩側原作者 provenance；不放寬到任意 UUID 替換。遷移只在本次正常停服備份的隔離副本演練，首次／重啟均通過才採用。原始停服 DB 與可回退版本保留；不得直接將舊 UUID 換成新 UUID 後照舊啟服。

新世界、保存演練及 LIVE 收據以本次完整家族候選為準，見 [當前基線](BASELINE-STATUS.md)。真人進食、第一人稱手部、音效啟停與設定保存仍 pending；載入成功不等於渲染／操作或 Java 一比一。
