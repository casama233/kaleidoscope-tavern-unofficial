# T155／G133／W132：UI修補已部署，真人恢復待確認

[private deployment time] **[private deployment time]**，managed-server已部署Tavern0.6.155、Grilling2.8.133、WorldLiquor0.1.132、private-integration、Ribbits1.0.10037，完整42包，BDS1.26.52.3 RUNNING。`client=false`、`production_ready=false`、`pending_client_acceptance`。

## 修補與驗證界限

使用者回報進食、調酒圖形都沒有，原版與AMW正常。已確認調酒progress父面板仍檢查已移除的` / 111`文字及未宣告變數，會拒絕目前格式碼封包；已移除。兩套圖形改成常駐獨立面板，各自快取自己的通道，避免依賴零停留title建立factory與初始once快照。正常停止送自己的END；漏更新時酒館12 ticks／燒烤6 ticks送END，離線清除timer。既有queue路由、原版HUD、AMW掛載、Actionbar、玩法與存檔內容保留。

来源檢查覆蓋實際發行JSON的可見條件、初次／進度／停止、外來title交錯與期限替換。這些不是Bedrock renderer執行證據；進食缺失的引擎原因尚未由客戶端證實。調酒游標目前按server tick選位置，舊factory partial-tick動畫已移除，插值與完整Java聲畫仍待完成。真人先重連測試首次進食／調酒顯示、完成／取消／連續使用及AMW共存；[實測入口](../docs/HUD-COMPAT-CLIENT-HANDOFF-20261012.md)。

## Canonical來源與完整家族

| 來源 | 修補PR | 必要CI | 已部署commit |
| --- | --- | --- | --- |
| Tavern | [353](https://github.com/casama233/kaleidoscope-tavern-unofficial/pull/353) | [38370712725](https://github.com/casama233/kaleidoscope-tavern-unofficial/actions/runs/38370712725) | `6d6442286d3e0a907eade4ded9ca7c3f2b9a6959` |
| Grilling | [201](https://github.com/casama233/kaleidoscope-grilling-unofficial/pull/201) | [38371334606](https://github.com/casama233/kaleidoscope-grilling-unofficial/actions/runs/38371334606) | `abf6fb9fa4978f8149532c61ddfc85c1b4330117` |
| World Liquor | [116](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/pull/116) | [38370790823](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/actions/runs/38370790823) | `4d2945e43e7095ce3cefa7b9b3ea151e63e6f25e` |

三個PR必要CI實際成功，G的Sourcery skipped沒有當通過。私有来源仍`be7cf5287be8d6982052e409de6f9efc28d5cc0c`；P34及Ribbits10037輸出不變。canonical family_update完成static、一次停服備份、同一存檔副本first／restart、family_guard與BSM准入、安裝及逐檔／順序讀回。

兩次保存演練exit0／errors0，玩家記錄（數量未公開）及容器（數量未公開）保留；冰櫃樣本（數量未公開），不作非空投料驗收。首次319 warnings／283 watchdog，重啟382／350。LIVE poststart165 warnings／0 errors，watchdog138（9 Spike／129 Slowdown／0 HighMemory）；Ribbits252ms仍有啟動尖峰。不同窗口不能用來宣稱受控效能改善或watchdog全部解決。

## 公開下載與LIVE

2026-10-13 **17:08:50 HKT**，三個archive均以無token、無cookie、無代理的HTTP匿名下載；release repository、tag、publication commit、asset digest與大小核對。完整六個公開自有BP／RP共**9346檔**與本次准入收據及LIVE逐檔相等，沒有只比較manifest或抽样。公開移植與私有整合／第三方相容變體分開保存。

| 下載 | Archive SHA256 |
| --- | --- |
| [v0.6.155-beta.1](https://github.com/casama233/kaleidoscope-tavern-unofficial/releases/tag/v0.6.155-beta.1) | `d11b70f2ca98901311825094f14573339388c8eb9aa8cec887940789959de2a0` |
| [A2.8.133-beta.1](https://github.com/casama233/kaleidoscope-grilling-unofficial/releases/tag/A2.8.133-beta.1) | `cb5662c7b937c2a2730874808a3bd21d4c6b6151d664a5de7cb3546183d6a5e8` |
| [v0.1.132-preview.1](https://github.com/casama233/kaleidoscope-world-liquor-unofficial/releases/tag/v0.1.132-preview.1) | `6e77b6b07ef1628c68a8473c84c8c2de9593767707cdf3807f046035d3f2021c` |

本機證據ID：`private-operation-record`。Reviewed receipt SHA256 `9effa0755cdbf8183df25d14467083d9043f7cb8060b9af4a0df27e3a36b02a2`；raw `c665e062c5017e1c24362e76b1ba2ce43b78be8b8cd63569a6aaf857eb1d10d7`；public comparison `a65340c9de95368253eaccd1c669025d2418b1af458efb049a26f8d68f68a089`。部署／保存／讀回／watchdog／public comparison與原日誌各自保留，政策installed和deferred_client_acceptance綁同一reviewed SHA。

canonical清理退役前次六個生成根，觀察可用空間增加1,619,021,824 bytes；保留最新完整回退、來源與診斷。此頁只更新已完成部署事實，不改歷史收據或重新啟動遊戲。
