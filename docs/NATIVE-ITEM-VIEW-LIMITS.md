# 基岩穩定版物品視角：已支援與未解決的邊界

針對本家族目前使用的1.26.50+目標版本，以下是官方文件能支持的結論。
這份記錄不宣稱不存在任何引擎內部技巧；未文件化的行為需要隔離客戶端實驗，不能因JSON解析或BDS載入成功就算正式解決。

## 原生已支援

- 方塊物品使用 item_visual 指定與放置方塊不同的幾何與材質
- item_display_transforms 分別設定GUI、第一／第三人稱左右手、地面、展示框等視角的旋轉、位移、縮放
- 原版真正使用 shade:false 的面，可用獨立不受面向調光的材質保留意圖
- 一般物品圖示加上個別attachable，可保留圖示並在手持時使用3D模型

## 三個仍未解決的精確切換

1. 雪克杯：Java在GUI／展示框選擇平面圖示，在手持／地面選擇3D模型
   - 現有icon＋attachable保留GUI、展示框與手持路由，但地面仍不是來源的3D模型
   - 改成無icon的原生方塊模型，也會連GUI／展示框一起變成3D，不能冒稱等價修復
2. 烤串：Java執行期可用GUI圖示，同時在地面／展示框渲染3D
   - 公開穩定schema沒有按這些視角選擇不同幾何／圖示的欄位
3. gui_light:front：Java可以只在GUI採用前方照明
   - 基岩item_visual材質可與放置方塊分開，但沒有文件化的GUI專用材質／照明切換
   - 對所有物品視角一律關閉face_dimming，會同時改動手持／地面／展示框，並非等價實現

## 不應採用的未驗證捷徑

item_visual的geometry.bone_visibility文件限定使用query.block_state()。
query.is_in_ui出現在一般Molang查詢清單，不等於它已支援方塊物品骨骼切換；而且即使某客戶端實驗有效，也不能單靠它區分雪克杯的展示框與地面。
目前不引入全域player.json、原版掉落物實體覆蓋或替換掉落實體，避免破壞其他附加包與物品生命週期。

## 版本注意

- item_display_transforms的geometry格式為1.21.0，功能在穩定版1.21.30已推出；舊教學仍提實驗開關，不能當作現行要求
- item_visual在1.21.60轉為穩定功能
- 1.21.130開始，即使fit_to_frame:false也受GUI框尺寸限制
- 26.50修正GUI強制置中／忽略translation的問題；明確填入來源參數仍不等於客戶端像素驗收
- 方塊定義的format_version 1.26.20起，ambient_occlusion必須是0.0至10.0的數值；這是內容格式版本，並非公開發行版號。item_visual不支援texture variations

## 官方來源

- [Icon](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/itemreference/examples/itemcomponents/minecraft_icon?view=minecraft-bedrock-stable)
- [Attachable](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/attachablereference/examples/attachabledefinitions/attachable?view=minecraft-bedrock-stable)
- [Item visual及骨骼查詢限制](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/blockreference/examples/blockcomponents/minecraftblock_item_visual?view=minecraft-bedrock-stable)
- [幾何與視角schema](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/visualreference/geometry.v1.21.0?view=minecraft-bedrock-stable)
- [材質](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/blockreference/examples/blockcomponents/minecraftblock_material_instances?view=minecraft-bedrock-stable)
- [Java gui_light](https://feedback.minecraft.net/hc/en-us/articles/360038800232-Minecraft-Java-Edition-1-15-2)
- [1.21.30](https://feedback.minecraft.net/hc/en-us/articles/30220110283533-Minecraft-1-21-30-Bedrock)
- [1.21.60](https://feedback.minecraft.net/hc/en-us/articles/34034576387469-Minecraft-1-21-60-Bedrock)
- [1.21.130](https://learn.microsoft.com/en-us/minecraft/creator/documents/update1.21.130?view=minecraft-bedrock-stable)
- [26.50](https://feedback.minecraft.net/hc/en-us/articles/48826825649933-Minecraft-Bedrock-Edition-26-50-Changelog-Wilderness-Bound)
- [26.20](https://feedback.minecraft.net/hc/en-us/articles/45400537384333-Minecraft-Bedrock-Edition-26-20-Changelog)
