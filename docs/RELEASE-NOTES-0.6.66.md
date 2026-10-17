# 0.6.66 beta 1

修復 0.6.64 引入的原生內容日誌錯誤（PR #104）：共用粒子生成器把 JavaScript 的複合賦值 `+=`、`-=`、`*=` 寫進了 Molang 表達式，Molang 解析器不接受，導致初始化事件與逐幀運動載入失敗。

- 掃描 107 個粒子檔，共 **97 檔、160 段表達式、1,040 處**複合賦值；全部展開為普通賦值（保留運算順序、括號、常數、粒子數量、壽命、重力、速度、貼圖與幀率補算），不以停用粒子掩蓋錯誤。
- 修正 4 個共用生成來源並重新生成 97 個粒子檔；涵蓋糖、史萊姆球、馬鈴薯、鑽石、白色／紫色吧凳、各式香薰，以及其他同源碎屑、回饋粒子與龍頭滴液。
- 新增獨立詞法防回歸檢查 `tools/effects/check_molang.py`（遞迴涵蓋 JSON events、creation／per_render／pre_effect 表達式與陣列，忽略單引號文字），接入生成器寫檔前、`check_release.py` 與特效 CI。此檢查針對該類語法，**不是完整 Molang 編譯器**；原有 JavaScript 數值測試保留，但不再被當作 Molang 語法保證。

驗證：Molang 檢查 2,506 個字串、複合賦值 0；foundation 231/231、aim/glassware 46/46、tap 19/19、pickup 7/7＋283/283、mechanics 8/8、靜態檢查通過。原生 Molang 解析器與客戶端渲染驗收仍未執行（檢查工具自身聲明 `nativeParserTested: false`）。
