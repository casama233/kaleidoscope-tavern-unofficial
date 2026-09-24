# 0.6.34-beta.1 — Client feedback fixes / 實機回饋修正

Requires Minecraft Bedrock 26.50+ and [Kaleidoscope Cookery (Unofficial) 1.0.6](https://www.curseforge.com/minecraft-bedrock/addons/kaleidoscope-cookery-unofficial). Enable Tavern BP/RP above Cookery.

- **發光**：補接 243 處 Java `shade:false` 材質；為現有發光燈具、杯架、燃燒瓶及發光莓果汁建立 28 張 PBR 自發光遮罩。串燈 15、吊燈下半部 13、圓形酒架 14、懸掛杯架 8、燃燒瓶 14 的照明值經對照保留。普通酒瓶在 Java 沒有方塊照明，不任意加亮。
- **畫框**：修正牆面／天花板掛畫四個側面的 UV，避免取到透明的貼圖外緣。
- **文字置中**：字形模型原點與排版起點統一，修正黑板、展板的共同水平偏移；舊文字會自動重建。
- **指南圖標**：140 個條目逐項綁定自己的 Java 物品圖或模型生成圖，並保留來源對照；修正吧檯、沙發、桌子等錯配，分類圖標也同步。
- **閃爍**：單瓶架、傾斜酒架及高腳凳改為單面裁切，讓原作薄片的正反面各自只在正面可見。
- **莫洛托夫**：修正使用時間短於最低蓄力時間；補回五種酒架／酒櫃的存放、模型與紅石燃燒彈發射，支援手持擺放。它是不可飲用的燃燒彈，對空按住至少半秒後鬆手投擲。製作、熔岩鍋取瓶和使用說明合併於其圖鑑條目。

English: restores Java unshaded materials and localized PBR emission; fixes painting edge UVs, board glyph origins, all 140 guide-entry icons, and thin-support face culling. Molotovs now have a usable draw duration, rack/cabinet storage and incendiary launch dispatch, placement, and complete guide instructions. They are thrown incendiaries, not beverages.

驗證：靜態資源、腳本、圖標與儲存索引檢查，加上 BDS 實際載入。未執行模擬玩家互動；手機上薄片裁切、文字置中、投擲操作與 PBR 畫面仍需實機確認。

Verification covers static resources, scripts, exact icon bindings, storage renderer indices and real BDS startup. No simulated player interactions were run. Mobile rendering and controls remain client-validation targets.
