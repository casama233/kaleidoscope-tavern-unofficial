# T144：板面輸入與文字定位

T143 的真人日誌指出四個新 edit_box 不接受 `modifications`，可見性條件未套用，同一段文字出現四個輸入框。T144 改用直接 `bindings`，保留釘選 Mojang 原生六條 root binding、文字與 placeholder 子控件、factory、提交及 dropdown；再追加互斥的三語 title＋field 條件。原生 enabled／focus／visible 來源經私有 alias 合成，避免讀取同名輸出形成自我依賴。外部表單維持原生100字，酒館 encoded 容量仍640／700／3000，RAW320／350／1500與保存防線不變。

真人亦確認黑板外出現反向字序。原小板的 Java 落筆平面正確，錯誤在將文字移到板心實體後的本地逆變換：東／西向採用了相反的 yaw 符號。改為正 entity yaw 的逆變換，保留四向板面、字型、黑色前景、發光外框、48／16距離與對齊。字形 signature61 讓已保存的舊字形在下次板面維護時重建；不遷移或重寫板面文字資料。

原生來源：[Mojang ui_common.json](https://github.com/Mojang/bedrock-samples/blob/46ba6ea985fb5a92d79a9419198f10dda14c199d/resource_pack/ui/ui_common.json)、[settings_common.json](https://github.com/Mojang/bedrock-samples/blob/46ba6ea985fb5a92d79a9419198f10dda14c199d/resource_pack/ui/settings_sections/settings_common.json)。既有 fixture 補齊 edit_box 的完整基底；回歸先拒絕新控制中未套用的 modifications，再核對原生 bindings與互斥條件。四向字形落點／完整矩形、字序及舊字形重建使用既有渲染檢查。multiline probe 同步修正此接線錯誤，仍是未驗收診斷，不進 LIVE。

七入口指南、全部配方、設備、原料及存檔功能保留。Grilling／World Liquor 只改現況文件後，部署工具可保守重用其未變 runtime 的已成功 CI：當前文件 PR 自己的必要檢查仍須成功，完整 runtime／baseline／工具／workflow 必須守恆，且只容許精確 README／BUGS／PARITY 路徑。任何玩法或工具差異都拒絕重用。

來源、CI、完整家族 static／BDS／fresh保存及實際部署結果統一在[當前基線](../family/BASELINE-STATUS.md)，不改寫歷史證據。真人須確認單一輸入框、長文字／兩個dropdown／提交／取消，以及文字留在板面且字序正確。正式多行、觸控／手把與完整真人驗收仍待完成。

`header.version: invalid string` 尚未定位包名或路徑；42個已部署包與五個原作者包的版本欄位均合法。Script API 相依的字串版本屬合法格式，不能據不完整日誌修改它們或宣稱此錯誤已修。
