# 靈動視效：來源、成品與伺服器堆疊防回退

本文件處理的是更新後 PBR 宣告／相依／世界引用不一致，不是曝光、缺圖或 HUD 的萬用修復。2026-09-25 的原始伺服器紀錄原樣保存在 [history/VIBRANT-VISUALS-20260925.md](history/VIBRANT-VISUALS-20260925.md)。歷史「17/17 RP」與「7 處相依」不是本輪正式服檢查結果。

## 本輪定位與處理

酒館 main `b2c4a7d5c21376df2302725a05b1eb1c4ea10be3` 的 0.6.43 RP 已有 `pbr`，最低引擎 1.26.50；世界名酒 main `89511c3da4f49463e6ba9e3eb920b18904b51e20` 的 0.1.6 RP 也有 `pbr`，BP/RP 都明確依賴酒館 0.6.43。這兩個配套版本不需要為了本次工具修正再次升版，避免製造新的過期相依。

煙火現行測試分支 `4d02ce29331968fae73dd7c32841ac962c4ffbb5` 的 A2.7.67 canonical RP 確實缺少 `pbr`。只修伺服器安裝副本，下一次 BSM 更新仍會被原包覆蓋。煙火 PR #72 將宣告補進正式來源，BP/RP/modules/內部相依同步至 2.7.68，保留原 UUID、Cookery 1.0.6、API 與全部非 manifest 遊戲資源。

酒館新增 `tools/vibrant_audit.py` 與 `tools/check_vibrant_contract.py`。來源檢查已接入 check_release；即使單獨執行 build_release，也會先查來源，再打到暫存包，回讀 archive manifests 與來源逐份核對，通過後才取代輸出。煙火的 canonical verifier、獨立 package_current 與 Dash 成品也加上對應檢查。宣告或相依被匯出器覆寫時，不能僅憑來源檔通過便發布。

## 官方規則與本專案策略分開

Microsoft 的 Vibrant Visuals 資源包文件要求使用 `pbr` 宣告，PBR 的最低 `min_engine_version` 為 `[1,21,120]`；既有酒館與煙火的 `[1,26,50]` 已符合，不需要任意拉高其他包。`raytraced` 也可以啟用 Vibrant Visuals，但新包優先採跨平台的 `pbr`。

**「全部啟用 RP 都宣告 PBR」是歷史私服的嚴格整合策略，不是本文件能證明的所有舊資源包通用官方要求。** 堆疊稽核預設列出缺宣告警告；使用 `--require-all-pbr` 才將它視為阻擋項。宣告不會生成 MER／法線，不代表圖片、透明度或所有裝置已驗收，也不會替不支援的硬體增加支援。

依據：[Vibrant Visuals resource packs](https://learn.microsoft.com/en-us/minecraft/creator/documents/vibrantvisuals/vvresourcepacks?view=minecraft-bedrock-stable)、[manifest validation CHKMANIF134/135](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/mctoolsvalreference/chkmanif?view=minecraft-bedrock-stable)、[manifest dependency reference](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/addonsreference/packmanifest?view=minecraft-bedrock-stable)。

## 來源與下載包檢查

在倉庫根目錄執行：

```sh
python3 tools/check_vibrant_contract.py
python3 tools/vibrant_audit.py --pack runtime --engine 1.26.50
python3 tools/build_release.py
python3 tools/vibrant_audit.py --pack runtime --archive dist/Kaleidoscope_Tavern_Unofficial_0.6.43_beta1.mcaddon
```

`--pack` 可重複指定，檢查配套版本時請同時指定兩個 addon 的 runtime；不要指定含歷史備份的整個倉庫。Cookery 等未提供的外部依賴會列入 `unverified_external_dependencies`，不冒稱已驗證完整堆疊。支援 format_version 2 的數字三段 pack version；新格式或 prerelease 版本字串會明確拒絕，需人工審核擴充，不會猜測解析。

## BSM 更新後／啟服前的只讀檢查

對停止的伺服器目錄或一致的 staging 副本執行；不對正在更新的資料夾取得一致性保證：

```sh
python3 tools/vibrant_audit.py --server-root /path/to/staged-bds --engine 1.26.50 --require-all-pbr --report /path/to/reports/vibrant-preflight.json
```

`--world 世界資料夾名稱` 可明確指定；否則取 server.properties 的 level-name。檢查器只讀選定世界的 world_behavior_packs.json、world_resource_packs.json，根目錄及世界內的安裝 pack 目錄，並沿**精確 UUID＋版本**解析相依。找不到指定版本、同版本出現多份、兩個有效版本衝突、BP/RP 放錯清單、最低引擎不符都會失敗；不會挑最高安裝版蒙混過關，也不會把未啟用的舊包算進有效堆疊。Script API 的 module_name 不當成 pack UUID，版本不會被改寫。

本專案部署契約仍要求 server.properties 明確存在：

```properties
disable-client-vibrant-visuals=false
```

這是只讀稽核，除了使用者指定的報告輸出外不改任何檔案、不重啟服務、不刪舊包、不修改世界。**本次沒有接上你的 BSM 執行主機或安裝自動更新掛鉤。** 將上述指令放在「下載並完成私服適配之後、發布 staging／重啟之前」；非零退出碼就應阻止部署，保留原工作版本與完整備份。各 BSM 部署方式不同，不假設不存在的 hook 名稱。

## 發現問題後的安全修正順序

先核對來源版本、SHA256、目標 pack UUID 和前置 API。自有 addon 優先修 canonical source 並發布新包；第三方包的宣告修改必須先在私人副本確認相容與授權，保留原 capabilities，不納入酒館公開包。不要為消除一条警告便任意修改所有包的 min_engine_version 或 API 版本。

已確認相容的套件更新，才同步相依中的精確版本、world_behavior_packs.json、world_resource_packs.json；內容改變時遞增本地修改包的版本／modules，並更新所有已核對的入向依賴。只換目標數字不能证明新舊 API 相容。私服使用的 Cookery 1.0.7／不同 UUID 與 server-edition 適配應按既有遷移流程保留，不在本輪自動改回公版。

更新完成後再次檢查完整 staging，再讓客戶端重新下載。客戶端需在支援裝置上自行選擇靈動視效；BDS 啟動成功不能證明手機選项已解鎖，更不能證明魔法輪盤的缺圖已消失。

## 驗證邊界

倉庫 gate 覆蓋缺 PBR、最低引擎、過期相依、重複 UUID、錯誤資料型別、空掃描及外部依賴未提供的負向情境。來源／成品比較不改 runtime，保留既有遊戲與視覺檢查。本輪沒有執行 Minecraft 客戶端、BDS 或正式伺服器堆疊驗收；「來源已修」與「正式服所有包已修」是兩個不同結論。
