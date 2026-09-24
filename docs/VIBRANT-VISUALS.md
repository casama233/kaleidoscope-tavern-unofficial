# 靈動視效

酒館資源包宣告 `capabilities: ["pbr"]`；最低引擎版本為 1.26.50。特調酒的混色圖集使用非金屬表面設定，原有透明像素和 RGB 混色不變。

專用伺服器應明確設定：

```properties
disable-client-vibrant-visuals=false
```

必須檢查整個已啟用資源包堆疊，而不只是酒館。整合部署會補齊缺少的 PBR 相容宣告及最低版本，遞增被修改的資源包版本並同步依賴／世界引用，讓客戶端重新下載。第三方相容修改只保存在伺服器整合包，不納入酒館公開包的資源內容。

這些設定解除伺服器／資源包宣告的限制；不會強迫玩家使用該模式，也不會替不支援的裝置增加硬體支援。未提供專用 PBR 貼圖的第三方素材仍使用引擎的預設表面。其他包更新後應重新檢查宣告，避免更新覆寫整合修改。

重新進服下載資源後，在支援的客戶端選擇靈動視效；若客戶端不允許遊戲中切換，需回主選單選擇再進服。BDS 沒有客戶端渲染器，無法以啟動成功證明手機選項已可點選。

依據：[Microsoft 的靈動視效資源包規則](https://learn.microsoft.com/en-us/minecraft/creator/documents/vibrantvisuals/vvresourcepacks?view=minecraft-bedrock-stable)。
