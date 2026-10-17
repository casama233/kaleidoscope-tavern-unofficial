# T148：酒館與煙火共用 HUD 掛載

在 managed-server 的實際資源包順序中，酒館在煙火之上。兩包原先各自把圖形控制、工廠及不同的 root modifications 放在同一路徑 `ui/hud_screen.json`；酒館的原生 Actionbar 過濾亦漏掉煙火的格式封包。這讓上層 UI 檔的選擇可以漏掛另一包的圖形控制，或讓原生訊息框顯示煙火封包。本次以兩包相同的最小橋接檔及各自已登記的命名空間解除這項互相覆寫。

酒館圖形移至 `ui/kt_tavern_hud.json` 的 `kaleidoscope_tavern_hud` 命名空間；煙火使用自己的檔案與命名空間。橋接只在原生根控制追加兩個可選掛載，缺包時選擇有 type 的空面板。World Liquor 原有的命名空間、可選全域變數與效果圖示掛載保持不變。兩包使用相同的 Actionbar 葉節點過濾，隱藏酒館、煙火與既有 Java Saturation 的內部圖形封包，保留普通／拒絕訊息。

本次沒有改酒館的圖形、槽位／進度時序、效果快取、腳本封包或玩法。原生 HUD 的 type、controls、bindings 及其他 addon 的控制不被整套替換。既有作者工具和檢查改讀獨立檔案；原生根保留檢查追加對缺少其中一個掛載的失敗回歸。

針對性結構、原圖像素、封包過濾、作者工具及效果／時序測試已通過；完整 CI、存檔及 LIVE 部署由本次完整家族流程記錄。這些檢查不是 Minecraft UI renderer。Dot 仍須在實際 LIVE 食用、調酒、效果圖示與普通 Actionbar 並行時核對顯示；任意第三方完整替換 HUD 或同時寫入共享 Actionbar 的行為仍需實測，不能宣稱幾乎所有 addon 已全面相容。

原生根參照：[Mojang Bedrock 1.26.50.4 HUD](https://github.com/Mojang/bedrock-samples/blob/46ba6ea985fb5a92d79a9419198f10dda14c199d/resource_pack/ui/hud_screen.json)。自訂 UI 登記參照：[Microsoft ui_defs](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/jsonuireference/examples/jsonuicomponents/ui_defs?view=minecraft-bedrock-stable)。
