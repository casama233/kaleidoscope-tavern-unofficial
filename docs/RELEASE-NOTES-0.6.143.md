# 0.6.143：板面輸入容量與家族最新版適配

本輪基於 canonical T142 `82beed2658530d6c34e16fd4c7a99efa81a21b6c`，
保留已發布的三語七入口、兩入口共用指南、四頁 AMW、所有既有玩法、
材質、光效所有權與靜默操作。新候選的凍結來源、配對版本、完整 CI、
原生家族與保存演練及 LIVE 部署結果按最終來源另行登記。

## 板面文字輸入

原生 server-form 單行欄位預設僅能編輯 100 字，與板面已有的
320／350／1500 字持久化容量不同。酒館板面改為精確限定的
640／700／3000 字輸入容量，容納換行及反斜線的雙字元跳脫。
保存時仍檢查原始文字長度、像素寬度與 8／11 行，超出仍拒絕保存；
既存文字不作遷移，也不重新解碼。

路由同時核對完整帶隱形格式標記的酒館 title 與第一欄標籤，涵蓋
en_US、zh_CN、zh_TW。所有分支沿用 Mojang 原單行 edit widget、
collection、textbox controller、placeholder、原生 disabled 狀態及
可見時內容 binding。未吻合的表單保留 100 字上限；form factory、
dropdown、submit 與既有 guide 圖片／動畫路由維持原值。

原生參照為 Mojang/bedrock-samples
`46ba6ea985fb5a92d79a9419198f10dda14c199d`，見既有 fixture。
source 回歸核對每個原生參數、三語 selector、近似 title／錯誤 field／
foreign form、disabled 與完整既存文字回傳。這些檢查不證明真人
client 的 sibling controller、鍵鼠／觸控／手柄焦點或實際輸入結果。
正式多行 editor 尚未實作；隔離 multiline probe 保留，不冒充已驗收。

## 剩餘差距與冗餘盤點

- 真實玩法缺口：任意三份裝飾非堆疊雪克杯原料、掉落物顯示上下文、
  彩字 16 格 camera-entity／camera-position 邊界及第一人稱望遠鏡条件。
- 平台適配待驗：純第一人稱 roll、穿牆輪廓、完整裝備／名字隱藏與
  清仇恨、全域 reach／step-height／XP pickup。穩定 API 沒有已核驗
  的對等入口，不能把 yaw、通用粒子或新版 preview target API 當作完成。
- 客戶端待驗：新板面輸入路由、指南動畫、材質／透明排序、模型、
  操作與各種輸入裝置；零玩家 BDS 或 SDK double 不代替真人。
- 歷史索引曾把已完成 T142 CI／原生／LIVE 寫成 pending；當前來源與
  有界部署結果由 [family baseline](../family/BASELINE-STATUS.md) 索引，
  舊 release／失敗證據保留原版本，不重新改標。

指南文字只有一份共享投影，Tavern／Cookery 入口與 W producer 各自
負責導航、host 接收及資料供給，不能刪成單入口。五語 fallback、
舊存檔讀取及 metadata-sensitive ownership guards 亦有不同責任。
本輪沒有發現可安全移除的死 runtime 模組；不靠刪 fallback／歷史
witness 減少檔案數。UI 的三個 capacity 分支只有容量及 selector 不同，
由同一產生器維護，未複製原生 controller 實作。

## 作者原包更新

原作者 Immersive Eating 1.1.0（CurseForge file 9104552）新增指南、
四款食物及相應動畫／音效，BP／RP UUID 均改變。家族鎖及受審身份
遷移須連同乾淨原包、作者 provenance 與已准入舊收據核對，不能
沿用 1.0.0 的 UUID／檔案或把完整作者脚本納入公開酒館來源。
實際整合與保存驗證仍以本輪最終家族候選為準。

## 凍結與封裝來源

T143 凍結來源 `956727d8ed71f4a766f8668b680d3e9720db53be`，
正式 archive 為 5,887,508 bytes，SHA256
`0931c09c25d25aca7a5c73e2769637566722a8414b12c8dd38c7d5a81a7b8e81`。
實際 packager 已核對完整 BP／RP 輸出與 manifest；配對／發布 metadata
後續調整不改 runtime bytes。完整 CI、原生首次／保存／重啟、完整家族、
存檔遷移及 LIVE 必須按這次最終配對取得自己的證據；封裝不是驗收。

RP manifest 的本次同步身份包含顯式空 `dependencies`，原本沒有該欄。
它不增加相依；嚴格歷史投影另追加精確前後像，在已核對版本後恢復
該欄的原始缺省形態。保留所有舊 witness／hash、凍結 runtime／claim；
非空相依、其他欄位漂移、錯誤版本與損壞歷史前像仍拒絕。

## 精確公開配對

五個 World Liquor CI checkout 固定 W120 最終來源
`5c09f0375e5ea2f7dbaf5b69d01bf8227e86816a`；W120 相依及 integration
固定 T143 凍結來源 `956727d8ed71f4a766f8668b680d3e9720db53be`。
家族鎖使用 G124 凍結 runtime `469441bc6556b5e91adedfd44876ac072572012a`
及 W120 實際 baseline 的 BP／RP trees；工具或發布 metadata 後續
修正不能自行授權不同 runtime。兩庫完整 CI 與完整家族結果仍待實際
執行，不沿用 T142／G123／W119 的收據或真人驗收。
