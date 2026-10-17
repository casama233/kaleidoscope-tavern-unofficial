# Cookery 1.6.0 指南語系接收適配

T140／W117／G122 完整家族的原生接收檢查收到 227 條目與 31 分類，但作者 registry 以只允許小寫的 generic token 規則驗證 `zh_CN`、`zh_TW`、`en_US`，丟棄三語操作正文。原候選及失敗報告保持原樣，沒有部署該候選。

乾淨作者 1.6.0 原包及實際 begin／chunk／end handler 可重現。G123 保留 G122 已合併玩法，僅在指南 mechanics 語系迴圈引入既有 helper 的 `publicGuideLocale`，使用與作者 names／text 相同的標準 locale 規則；通用 source、revision 和 category token 驗證不變。相容 API 進至 0.2.10，descriptor、作者微型掛鉤及 copied helpers 成組組裝。

| 來源 | SHA256 |
|---|---|
| Cookery 1.6.0 archive | `da12fe6d39d7514aff1de3c963d69899324d771be5ca0fc3da1ccb759c7ad458` |
| 原 registry | `664964a32be1038d3bc9be3d9e0fb460d77b65aa20f2c78d5efb9d12099dbf07` |
| 登記適配 registry | `d531f1beb1d4860fcf2278b88f9f762c40ce6cb18404393bf547dea7b63b6ea2` |

G123 凍結來源 `632fbae02208e2752f3a977c3b7f7dd2176b9aa0`。T140／W117 的 runtime 與發佈身份完全不變；本 PR 僅同步家族鎖。保留 T140 PR306 成功 runtime CI，當前 metadata CI 分開執行；新完整家族候選仍須自己的 static、BDS、實際指南接收及 fresh 停服保存／准入／LIVE 邊界。

原包／適配回歸證明三語正文保留、無效語系及其他 token 仍被拒絕；不是真人閱讀或操作驗收。最終完整家族部署結果以其當次收據為準，`client=false`、`production_ready=false`。

作者回報草稿：[公開相容提案](https://github.com/casama233/kaleidoscope-grilling-unofficial/blob/632fbae02208e2752f3a977c3b7f7dd2176b9aa0/docs/COOKERY-FAMILY-API-PROPOSAL.md)。已核驗 [Loyallay 官方 Discord](https://discord.gg/ay5mqVuXdN) 與 [Cookery 留言入口](https://www.curseforge.com/minecraft-bedrock/addons/kaleidoscope-cookery-unofficial/comments)；目前沒有可發送的已登入介面，回報保持 **unsent**，不宣稱作者接受。原作者提供已驗證的標準語系保留能力時移除此掛鉤；每次新作者版重新審查，既有到期日不變。
