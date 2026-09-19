# A5 實際狀態

## 本輪已完成

資源索引、11組選擇器、177外觀／10圖示解析、8個早期方塊明確 item_visual、bridge type修正、CLI入口、嚴格參數錯誤、Cookery本地檢查／綁定工具、重建後依賴恢復、來源JAR main/generated資源對照、資源引用驗證和正式版匯出阻擋。

## 本輪沒有增加

沒有新增模型、原圖、動畫或玩法。幾何87、外觀177、編輯檔179、原圖44。原有來源提交／模型／材質保持不變；前端檢視器沿用A4的檔案和畫面，沒有重新執行其瀏覽器測試。

## 不能標成通過

真正Cookery包未取得且未綁定；正式JAR未對照；Minecraft／bridge／Blockbench互動式載入、手持／掉落／GUI姿態、透明面效果、多人／Realms和所有玩法未驗收。所有資源仍是 CONVERTED_CANDIDATE。

`ASSET-COVERAGE.json`保留A4的缺口；新接口不會使未轉換模型變成已完成。

## 復查路徑

- `VALIDATION.json`：本輪重跑的原資源數值和引用检查。
- `INTERFACE-VALIDATION.json`：新接口和BP/RP連結。
- `TEST-RESULTS.json`：30 Python + 16 Node，另含TS編譯檢查。
- `A4-ASSET-REGRESSION.json`：模型／貼圖／來源未改動證據。
- `REBUILD-REGRESSION.json`：本輪完整重建的輸出對照。
- `VIEWER-BROWSER-TEST.json`：明確標示沒有重跑；原A4結果在history/A4。
