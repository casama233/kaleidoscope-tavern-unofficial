# C5 調酒沉浸還原矩陣

所有Minecraft／手機／Realms／BDS實機驗收為NOT_RUN。

| 步驟 | C5交付 | 證據與未完成 |
|---|---|---|
| 原生開始 | use_modifiers start_using=always + itemStartUse | 官方文件支援此值/minformat1.26.30；本包1.26.50。未真的測一般工具能否進入use，不作平台保證 |
| 原生計時 | 不改原selected ItemStack；server session和剩餘useDuration差值相互驗證 | mock覆蓋所有窗口；超3tick差異取消，真實延遲/事件順序需測 |
| 停止 | release或stop皆可，單次結算；111tick保底後等鬆手 | 同一輸入不重複產出；未用food/shooter/throwable，未猜滑鼠狀態 |
| 相容路徑 | 使用者在獨立酒館指南明確選兩次使用 | 不把fallback測試寫成native通過 |
| 原PUT | .375秒/13key保持 | A17原件保持；helper事件已接，跨客戶端實際重播未測 |
| 手腕 | data/hand-calibration.json集中原C4候選 | **仍未精確實機校正**；profile不代表玩家骨架baseline實測 |
| 杯嘴 | root/kt_spout=-3.5,11,0，原杯身唇緣 | 所有原cube/UV不變；7個client keyframe、bind_to_actor=false，真實client locator跟隨未測 |
| 出液 | 客戶端杯嘴局部發射，杯位伺服器顏色接觸粒子 | 主流滴中性白，並非完整特調RGB連續流；不保證物理軌跡命中杯中心，移除C4眼睛偏移假起點 |
| 投料與藥水 | 身份/時長快照、來源PUT與返瓶 | 僅普通支持類型；不收未知meta |
| 特殊效果 | 血腥瑪麗規則＋XP/Zenith明示適配 | 9種類仍未實作；無原生buff圖示 |

## 可重現校正流程

原始模型、原PUT、源波形都不改。手腕調整僅改`data/hand-calibration.json`的first/third三軸position、rotation與scale，再執行build_runtime。杯嘴源局部點不要用玩家眼睛offset覆蓋。

用Steve/Alex、第一人稱/第三人稱/前視、不同FOV、左右視角、手機觸控逐項錄影。檢查hand_mount是否貼手、原杯蓋是否移動、相位重播、結束清理、出液是否從開口、另一玩家是否能看見。確認前不能將profile標成engine calibrated。

當前source lips數值是幾何量測；真實手腕精準位置需遊戲客戶端畫面，不由同一套mock自證。沒有另生成或偽裝Minecraft截圖。
