# HUD客戶端回饋與驗收邊界

最後部署為2026-10-14 21:41:21 HKT的T166／G142／W144／private-integration／Ribbits1.0.10037，42包。來源、CI、原生保存與正式公開下載核對見[現行基線](../family/BASELINE-STATUS.md)；實際回饋與對應修補集中在[BUGS.md](BUGS.md)。`client=false`、`production_ready=false`、`pending_client_acceptance`。

使用者已要求停止反覆畫面探針。掛載／快取指示、普通標題對照與人工封包探針均已停止；本頁不要求重連、重錄或再次回覆版本。沒有使用模擬玩家，也不以隔離世界成功代替LIVE畫面。未知客戶端堆疊或傳輸時序繼續標未知，不用原生HUD／AMW能顯示推論森羅也已恢復。

76196／76197及76210的森羅HUD缺失／原始KT碼是實際失敗；後續76211見圖形與原始碼並存，76212／76213見進食姿勢和串數下降。76251已見調酒色塊且未見內部碼，但使用者仍回報位置過高與進食條延遲；之後又回報雪克杯長按很久才顯示。有限正向觀察與失敗同時保留，不能改成完整驗收。

T165修正Java中央相對錨點，G141修正剩餘use ticks和同步首幀，T166／G142減少重複閒置解析與未用圖形處理。沒有新版實際端到端延遲／FPS證據。Poststart的214 warnings／0 errors、187 watchdog僅屬該次啟動窗口；取樣中的native API等待時間也不等於獨立CPU成本。

## 尚未取得當前候選真人證據的範圍

- 首次進食／調酒、完成／取消／換槽與快速重開；原作進度材質、圖示、自然消失、聲音及游標位置。
- 原生HUD、JavaSaturation、AMW既有29通道、酒館／世界名酒效果與普通Actionbar同時存在；不同GUI比例、輸入方式與資源包堆疊。
- Ribbits自然生成、connection及互動；沒有以人工connection或模擬玩家代替。

Dot早先取消保留物品、完成後退出、裝料／返瓶／產出的正向結果，以及兩次快開短空條，缺少可核對的候選與客戶端版本，保持原場景，不挪作T166驗收。調酒游標partial-tick插值及完整Java一比一仍未完成。

## 來源與相容邊界

現行調酒／進食圖形使用原生Actionbar factory及各實例捕獲的封包文字；效果圖示維持獨立title路由。Actionbar／title共享邊界、未協調第三方寫入與完整HUD覆蓋仍需實際相容證據。原生、AMW與Saturation既有控制保留的來源／BDS證據不能當所有裝置渲染通過。

本次Git狀態同步讀到的Java唯讀查核為2026-10-15 06:23:03 HKT，`all_reference_release_metadata_current=false`、`full_java_parity_verified=false`。料理作者新版UUID／API／保存適配及作者回饋送達狀態仍分開記錄；本次沒有更新作者包或遊戲runtime。
