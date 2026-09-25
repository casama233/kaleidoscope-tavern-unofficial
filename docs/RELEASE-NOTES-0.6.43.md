# 酒館 0.6.43-candidate.1 — 發射對照候選，微醺視覺仍未解決

本包是0.6.42之上的候選，保留其HUD隔離及材質引用檢查，不是已驗收的完整Java移植，不自動發布為正式／公開修復Release。

- 保留單體／傾斜酒架正確的Java出射口、方向和隨機速度公式；修正莫洛托夫錯播普通酒瓶發射聲、投射物10秒硬清除，以及飲品濺射瞬間強度／時間門檻。
- 莫洛托夫補原生SPEAR使用姿勢、明確眼高-0.1出生點及單一0.8功率基準／水阻力。最低0.5秒，鬆手投擲，長按更久不會更遠；不重複扣料／生成投射物。
- 碰撞事件合併、移除額外直擊燃燒及重複粒子，保留現有產火規則的未完整映射限制。
- 微醺僅補可靠性、有限重試和唯讀診斷；**Java相同的camera-only roll尚未恢復**。原有yaw適配仍未通過本機畫面驗收。

備份世界後更新本體BP/RP；Cookery1.0.6與既有UUID／ID不變。沒有新BDS、客戶端或模擬玩家测试；未宣稱手機動畫／實際射程／完整原作效果等價。詳細對照與未完成項目見`docs/LAUNCH-AUDIT-0.6.43.md`。

English: repair candidate, not a complete-parity release. Aligns native Molotov use animation, shooter anchor and explicit physics configuration; corrects rack splash/impact mismatches while preserving launch vectors. Tipsy changes only diagnose/retry the existing unverified yaw adapter. Exact additive gameplay-camera roll remains unresolved. Static/source/math checks are not device acceptance. No new BDS, client or simulated-player run.
