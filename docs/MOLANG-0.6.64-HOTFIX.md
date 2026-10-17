# 0.6.64 粒子 Molang 複合賦值修復

基準：`1547140897fa067ea60e990ecdd8d23a85fa6815`，`0.6.64-beta.1`。

## 問題與根因

使用者的原生客戶端日誌在糖、史萊姆球、馬鈴薯、鑽石、吧凳碎屑與多種香薰中回報 `binary Assignment '=' operator at end of expression`。共用生成器把 JavaScript/C 的 `+=`、`-=`、`*=` 寫入 Molang；初始化和逐幀補算路徑都受影響。

完整掃描確認 107 個粒子檔中，97 個檔案的 160 段表達式含 1,040 個複合賦值。改為顯式賦值，例如 `v.x=v.x+(dx);`、`v.dx=v.dx*(0.98);`。括號保留右側運算優先順序，沒有刪除粒子或降低粒子數量。逐 JSON 值比對確認除這項展開以外，所有欄位、常數、執行順序及貼圖引用均不變。

Molang 官方語法與普通賦值／loop 範例：
https://learn.microsoft.com/en-us/minecraft/creator/documents/molang/syntax-guide

## 修復與防回歸

- 修正四個共用運動／互動生成器，重新生成全部受影響資源，包括龍頭滴液與未出現在日誌中的回饋粒子。
- `molang_syntax.py` 遞迴檢查 JSON 內的 Molang 字串，包含 events、巢狀 pre_effect_expression、creation_expression、per_render_expression 及陣列欄位；略過單引號字串中的文字。
- 粒子生成器在寫檔前驗證；`check_release.py` 在打包檢查的早期階段直接攔截。特效 CI 另執行 10 項語法防回歸測試。
- 原有 JavaScript 數值測試會接受複合賦值，因此只能作數值／幀率獨立性驗證，不能代替 Molang 語法檢查。現在另設檢查，不刪除原有數值測試。
- `check_repair.py` 改為檢查相同算術的合法寫法；`launch-repair-reference.json` 只更新已審查資源的 after 雜湊及修復說明，原始 before／beforeProjected 不變。

## 本地驗證

- 對未修复的 0.6.64 粒子重新執行新檢查：退出碼 1，檢出全部 1,040 處，證明檢查能重現舊版問題。
- 修復後掃描：2,004 個 runtime JSON／2,506 段 Molang 候選字串，複合賦值 0。
- `python tools/effects/test_molang_syntax.py`：10/10。
- `node --experimental-vm-modules --test tools/effects/effects-regression.test.mjs tools/effects/interaction-regression.test.mjs`：106/106，無跳過。
- 四條完整資源重建路徑的既有位元組一致性測試通過。
- `python tools/check_release.py`：通過，2,004 JSON／930 geometries。
- `python tools/check_launch.py --java-source <pinned-java> --baseline <cedfaedf>`：通過，既有原始雜湊保留。
- `python tools/build_release.py`：通過；候選包 SHA-256 `22d9803787957b8512eefebf5193351f58c3872b57063ce31d23bb620aa230cb`。

這是針對已知錯誤的語法防回歸與數值／資源檢查，**不是完整 Molang 編譯器，也未聲稱原生客戶端載入、實際渲染或所有光影模式已通過**。未使用 SimulatedPlayer。原生客戶端仍需重新載入修復後資源，檢查內容日誌及實際粒子。

此 PR 不變更包 UUID、版本號、`player.json`、酒櫃／酒瓶資料、存檔或已發布 release。候選打包產物不是已發布的新版。
