# 原JAR對照結果：兩種「相同」不可混用

`release-comparison.json`執行的是原本工具的**SHA-256逐位元組**檢查。539份既有來源中，107份byte相同、其餘432份byte不同，所以`all_selected_resources_equal:false`是預期且真實的結果。

`source-intake/A16-vs-uploaded-JAR.json`則是另行完成的**模型資料／像素**檢查：那432份中，377份JSON解析内容相同，55份PNG解碼尺寸及RGBA像素相同，沒有發現缺失或不同模型／像素。排版與PNG壓縮封裝不一樣，不應誤說美術內容不同；也不應因此把byte hash改成相同。

這兩個檢查沒有相互取代。前者保留原資料來源身份，後者證明已收錄美術不必因這次NeoForge JAR接入而重做。新的1295份原件則按上傳JAR全部member hash獨立凍結。

上傳JAR是否與發布平台提供的檔案逐byte相同，並未核實發行方雜湊；它也不是先前的Forge/1.20.1整包。上述結論只覆蓋本次實際檢查的資源，不擴張到所有Java行為或渲染結果。
