# 本輪格式核對來源

核對日期：2026-09-18。這些文件支援格式選擇，不代表引擎已跑過本專案。

- Mojang/Microsoft manifest reference：依賴使用目標pack的header UUID與其版本。
  https://learn.microsoft.com/en-us/minecraft/creator/reference/content/addonsreference/packmanifest?view=minecraft-bedrock-stable
- Microsoft item_visual reference：方塊物品外觀使用geometry與material_instances；這不等於Java display姿態已被套用。
  https://learn.microsoft.com/en-us/minecraft/creator/reference/content/blockreference/examples/blockcomponents/minecraftblock_item_visual?view=minecraft-bedrock-stable
- bridge project config：type是必填，Bedrock專案值為minecraftBedrock。
  https://bridge-core.app/guide/misc/project-config.html

資源來源提交與逐檔hash：`sources.lock.json`，仍為6b0d619145316492f055e03d70427107cd73efa8；無新增素材。Cookery前置是本專案產品要求，不能由這些文件推論其具公共腳本API。
