# C3來源、API與明確適配差異

原始規則／配方來自使用者上傳`kaleidoscopetavern-1.2.0-neoforge+mc1.21.1.jar`，SHA-256 `03f35e1e614953b22cd1f5e34345613f3a6a283bf1b1c99659b57d58970edeff`。`data/upstream/c3/source.lock.json`逐件記錄JSON／tag／效果表及javap文本的SHA-256。本轮僅讀ZIP並使用javap反組譯類別，未啟動或執行模組。

源碼交叉參照固定到`KaleidoscopeMods/KaleidoscopeTavern`之`a1afba34981a00e89d57130d3dc8f1e64f1820a2`；不冒稱它是JAR精確建置提交：

- `item/ShakerItem.java`：0–18取消、19–68神秘、69–88特調、89–98固定或特調fallback、>=99神秘、超過110自動停止。
- `item/BottleBlockItem.java`：原作基酒>=4可調。
- `blockentity/mixology/ShakerBlockEntity.java`：三槽每槽1、投料立即返容器。
- `util/CocktailEffectHelper.java`：按品質收效果、同效果時長求和後乘1.2f再取int；實際程式對只有一條的group也乘1.2，沒有按註釋自加分支；amplifier/probability取最大。
- `util/ColorUtils.java`：三通道分別整數平均，ChatFormatting色值不是染料貼圖平均。

JAR的十二份固定雞尾酒效果與Mystery效果均為Java專屬。核心資料保留而不執行未知效果；特調內的原生effect用既有C2映射適配。醋雖有六品質飲用定義，但不是C3七組可調基酒tag中的成員。

## API核實入口（文件，不是實機驗收）

- https://learn.microsoft.com/en-us/minecraft/creator/reference/content/itemreference/examples/itemcomponents/minecraft_use_modifiers?view=minecraft-bedrock-stable
- https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/itemstack?view=minecraft-bedrock-stable
- https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entitydieafterevent?view=minecraft-bedrock-stable
- https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/worldafterevents?view=minecraft-bedrock-stable

`use_modifiers`不能被當成不帶food/shooter/throwable也能啟動原生充能使用的保證。本版先交付桌上點擊計時，不偽造可用的手持長按。特調資料只存在max_stack_size=1的物品；死亡事件使用deadEntity識別取消session。這些查閱不代表所有JSON、Molang、nativeconsume已在目標API2.7.0遊戲載入。

## 不是1:1的選擇

三槽資料仍用世界DP＋物品交易，不用未驗證的原生容器。為防止瓶子複製，退回已倒酒的完整基酒需消耗先前返還的空瓶。手持滿料雪克杯的拾取／投擲／原生手動畫未開啟。空杯既可手持領取，也可在桌上點相鄰空杯倒入；沒有假装是原作拿手持雪克杯倒入。

外部普通原料沒有容器／顏色／效果註冊接口，使用白色無效果快照，文檔明示；藥水拒收。只有本體既有杯模型可擺放。所有Native返杯都由food定義執行，mock不做此引擎動作。
