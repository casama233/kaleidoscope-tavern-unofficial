# Verification classification findings

The following findings snapshot T126. T127 replaces the actual tautological/shaker generator-self-comparison case with shipped-selector boundary evaluation and one rejecting in-memory mutation; the other findings retain their original scope.

This audit did not run new suites, BDS, clients or implementation mutations. No tests were deleted. TEST-AUDIT.md is a file-level inventory; discovered case names are the declared behavior, not proof that every assertion has been exhaustively reviewed.

A: original Java/JDK oracle; A-source-expression: independently extracted JVM math; A-development: vectors on a development copy. B: executed production conservation/rollback with an independent invariant. C: a stated actual-engine scenario; a historical trace replay is not a new C run. D: paired actual-client evidence. Build/schema/reference/package checks are preconditions, not A–D completion.

Input/API fault injection is distinct from changing implementation code. Existing historical production reversion tests have their recorded scope. All newly added A/B/C tests in later phases require a discriminating implementation mutation; this report adds no test.

## 保留有效正式程式反事實檢查

Source: `tools/glassware/check-storage-counterfactual.py` lines 54–72.

暫換真router/aim舊實作，同一tests驗舊碼exit1且fail>0、新碼exit0，finally恢復；docs/STORAGE-AIM-ROOT-CAUSE-20260929.md76–89列已有red/green結果。

不因API doubles而刪除；仍只作B回歸，不稱新BDS／客戶端

## 推翻BDS仅载入假设

Source: `.github/workflows/validation.yml` lines 436–451.

native-persistence实跑tools/pickup/run_native_smoke.py；两次真实BDS存/重启，production NativeItemStorage载入、metadata与ledger退休检验。

保留有效C持久化；players=0/wholePack=false/client=false，不能稱整條玩家流程

## 永真局部斷言

Source: `tools/test_shaker_held_frames.py` lines 39–42.

sum([first and not active, not first, first and active])==1 对两个 Boolean恒为1；不访问shipped animate/Molang条件。

独立解释实际animate条件，故意改为双idle或missingactive确认失败；保留21–34角点验证

## 同一生成器产物自比

Source: `tools/test_shaker_held_frames.py` lines 35–38.

actual scripts.animate 与生成该字段的selectors()比较；两者同方向错误不被抓。

从原作use state与native映射抽独立状态表

## 共享被测core作expected

Source: `tools/mechanics/mechanics-regression.test.mjs` lines 43–43.

expected=advanceBarrel(...)，registered adapter亦调用同一core；能抓adapter wiring错误，但shared timer/quality错误可双侧通过。

独立Java unitTime/quality schedule向量，并保留adapter wiring用例

## pose helper共享oracle

Source: `tools/efficiency/efficiency.test.mjs` lines 31–37.

expected pose来自production cellarCabinetVisualPose/circularRackVisualPose；仅验证adapter传参和幂等，不独立验证Java pose。

独立Java pose constants/vectors + D

## 历史bytes当品質

Source: `tools/efficiency/preservation.test.mjs` lines 21–39.

source strings与历史projection相同；没有执行受保护transaction／tipsy／board行为。

保留必要完整性边界；从质量证据移出，以B/A取代功能保证

## wrapper描述不准

Source: `tools/check_release.py` lines 2–134.

docstring/print称静态only/no interaction，但33–37、55、129确实调用production模块的脚本fixture测试；不是BDS/真人但也不仅schema。

声明改为资源前置+脚本回归，分列每类结果，勿把assert数作验收

