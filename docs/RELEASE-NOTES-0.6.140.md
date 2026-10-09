# 0.6.140：板面換行、雪克杯手勢與配套生物類別

精確 predecessor 為已發布 T139
`ada02bfd5dd708d0d733ca7ad6593672ca3ad2f7`；配套 W117／G122。
三語七入口指南、Cookery 共用入口，以及原料保存、光效／重啟、
倒轉 Mob、確認重生錨與靜默操作均保留。

- **板面換行：** 先記錄當前空格再判斷溢出，消耗該分隔符，不回退更早空格；index 0 也可換行，長詞完整移至下一行。小板 70 units、明確換行縮排、尾段及 Word 對齊不變；黑字 cream outline、八向描邊、遠距 foreground 和板心 48 格 cull 保留，未改 RP。
- **雪克杯：** 原生 clone／雙向相容與可讀 metadata 核對延後扣料。只有證明不同才解除 owned 防重，扣料必須證明相同；讀取失敗與 foreign cancel 不放行。2 瓶點擊排隊後改為 3 瓶再正式點擊，舊手勢拒絕、新手勢加入 1 瓶；native／false／itemUse echo 及最後空手防誤拾取仍保留。
- **W117 類別：** 84 個原版 LivingEntity 對應與 Tavern projection 相同；無 mob family 的魚類進入既有 MultiJump、Tequila、instant 與 credit 路徑，排除僅有 health 的非生物。死亡不改類別，後續 mob credit 仍要求存活；傷害事件順序未改。

Tavern 原作分別核對 Forge 1.20.1
`c4ec1880bd44cf3139d3ba744ab30bb379cf1416`、NeoForge 1.21.1
`a1afba34981a00e89d57130d3dc8f1e64f1820a2` 的 `TextBlockEntityRender`。
換行順序由 Mojang 1.21.1 `StringSplitter`／`Font.split` bytecode 核實，
未宣稱執行字型 oracle。W 權威為 CF9066406／NeoForge 1.21.1／
World Liquor 1.1.11 的 `MultiJumpFallDamageMixin`、
`DamageEvents.onLivingDamagePre`、`DoubleDamageEffect.onLivingDamagePre`；
Forge／Neo 事件階段不合併宣稱。

定向結果：`tools/efficiency/board-rendering.test.mjs` 5 項及
`tools/check_board_layout.mjs` 通過；`tools/shaker-offhand.test.mjs`
最後 10 個 station witness 案例通過。交叉審查補出 index 0 與
2→3 fresh true 反例，後者先失敗後通過。W 的
`tests/kill-credit.test.mjs`／`tests/combat-source.test.mjs` 共 26 項、
獨立交叉回歸 8 項通過。這些是來源／API 回歸，不代替真正 Player 或渲染驗收。

新增 T140／W117 paired native **尚未執行**，包括無效果 cod fall
control／公開 effect bridge 下的 MultiJump 取消場景；最終 CI、
首次／保存／重啟和嚴格 recorder 以新實際證據為準，不改名沿用 T139。
彩字 per-viewer feet-versus-camera 16 格及第一人稱 spyglass、純 roll、
多行 editor、任意 NBT／三份任意裝飾非堆疊原料與其他既有差距未完成。
真人畫面／操作／音效、私人完整家族、fresh stopped-world 演練與 LIVE
讀回仍 pending；持續部署授權不變，`client=false`、
`production_ready=false`、`live_deployment=false`。
