"""Write current A17 coverage/hand-off from generated source maps. No network or game code."""
import csv,io,json,hashlib
from pathlib import Path
from interface_common import ROOT,read,dump

def write_docs():
    ready=read(ROOT/'docs/ART-READINESS.json');reg=read(ROOT/'interfaces/asset-registry.json');pose=read(ROOT/'interfaces/pose-candidates.json')
    fams=reg['families'];dump(ROOT/'docs/A17-FAMILY-COVERAGE.json',{'build':'A17','full_static_family_counts':ready['full_static_families'],'families':fams,'engine_accepted':False})
    allsrc=read(ROOT/'docs/A17-ALL-SOURCE-COVERAGE.json');lock=read(ROOT/'source-jar.lock.json')
    dump(ROOT/'docs/A17-SOURCE-MANIFEST.json',{'build':'A17','source_type':'user_supplied_jar','jar_sha256':ready['source_jar_sha256'],
      'jar_identity':'1.2.0-neoforge+mc1.21.1','publisher_checksum_verified':False,'namespace_resource_files':1295,
      'copied_original_pngs':305,'original_audio_files':6,'files':lock['asset_files'],
      'historical_Git_source_lock':'sources.lock.json','chalkboard_reference_source_lock':'neoforge-source.lock.json',
      'scope_note':'JAR members are independently hash-locked. Do not relabel them as historical Forge/Git bytes.'})
    cov=list(csv.DictReader((ROOT/'docs/ASSET-COVERAGE.csv').open(encoding='utf-8-sig')))
    updates={
      '11':('ALL_SIXTEEN_STOOL_COLORS_COMPLETE_STATIC','All sixteen original base+seat assemblies retained; table and ladder complete static sources. No seating.'),
      '12':('STATIC_LIGHT_AND_INCENSE_FAMILIES_COMPLETE','All17 independent string lights,3 pendant styles,8 incense kinds x2 static states. Native particle assets added; runtime emission/lighting require code.'),
      '13':('ALL_PAINTINGS_BOARDS_CHALK_STATIC_FAMILIES','14 painting originals retained;14 board kinds,13 floral upper pieces,2 original-size chalkboards converted. Source orientation contracts retained; automatic placement/text require code.'),
      '16':('USER_JAR_COMPARED_PUBLISHER_CHECKSUM_NOT_VERIFIED','539 previous locked resources compared:107 byte-identical,377 parsed JSON-identical,55 RGBA-identical,0 missing/different.1295 uploaded-JAR members hash-locked. Not a whole Forge release equivalence claim.'),
      '21':('SOURCE_ITEM_DISPLAY_DATA_COMPLETE_RUNTIME_PENDING',f'160 item source models:158 concrete(76 geometry,82 original sprites),2 templates. Optional PoseLab:{pose["geometry_files"]}geometry/{pose["appearance_bindings"]}appearances. Runtime GUI/hand coordinate acceptance and animated icons pending.'),
      '22':('DYNAMIC_RESOURCE_RIGS_BUILT_RUNTIME_PARITY_PENDING','16 native particle candidates,10 source animation schedules,6 audio clips/4events,12 liquid planes,1 signature tint rig,source hand-pose curves. Particle base physics,drip children,text,auto-trigger and game acceptance require code.'),
      '23':('ALL_UPLOADED_JAR_NAMESPACE_ASSETS_ACCOUNTED','All1295 members classified and preserved;305PNGs,790modelJSON,159blockstates. Four Java Ponder resources remain source scenes for guide adapter, not portable Bedrock structures.'),
      '55':('ALL_FOURTEEN_BOARD_STATIC_KINDS_AND_ROTATION_CONTRACT','Prior plain pieces retained;14 assembled kinds,13 floral upper pieces and224 top-rotation source entries. Native16-step art events,not automated placement or editing.'),
      '60':('SEVENTEEN_OF_SEVENTEEN_CONVERTED','A17 remaining9 exact JAR models and original PNGs complete17 independent designs; no recoloring. Face directions,UV,shape and per-element shade retained.')}
    for row in cov:
        ix=row.get('index',row.get('\ufeffindex',''))
        if ix in updates:row['status'],row['details']=updates[ix]
        row['engine_accepted']='False'
    for category,status,details in [
      ('Source concrete item art','ALL_158_MAPPED','76 item-side geometries plus82 original sprite items.2 abstract templates are not independently obtainables.'),
      ('Extra vanilla-carrier/molotov displays','SIX_CONVERTED','Original water,potion,honey,xp,dragon-breath and molotov display model bodies.'),
      ('Original sound assets','SIX_CLIPS_FOUR_EVENTS','OriginalOGG bytes preserved; events mapped; runtime triggers missing.'),
      ('Source particle assets','SIXTEEN_CANDIDATES','19 original particlePNGs preserved;2vanilla drip dependencies use nativeBedrockatlas,not pixel-identical cross-edition art. Runtime differences explicit.'),
      ('Original localization','FOUR_SOURCE_LOCALES_PRESERVED','Source en_US,zh_CN,ja_JP,ru_RU values retained alongside lablabels. Full zh_TW translation is not claimed.'),
      ('Java Ponder guides','SOURCE_ONLY_NEEDS_GUIDE_ADAPTER','4Java-specificscene/structure resources preserved but not functional BedrockGuidebook.'),
    ]:
        old=next((r for r in cov if r['category']==category),None)
        if old:old.update(status=status,details=details)
        else:cov.append({'index':str(len(cov)),'category':category,'status':status,'details':details,'engine_accepted':'False'})
    with (ROOT/'docs/ASSET-COVERAGE.csv').open('w',newline='',encoding='utf-8')as f:
        w=csv.DictWriter(f,fieldnames=['index','category','status','details','engine_accepted']);w.writeheader();w.writerows(cov)
    dump(ROOT/'docs/ASSET-COVERAGE.json',{'build':'A17','source_inventory_complete':True,'static_art_ready_for_code':True,'all_runtime_visuals_verified':False,'rows':cov})
    dump(ROOT/'docs/A17-RESOURCE-SUMMARY.json',{'ready':ready,'pose_overlay':{'geometry_files':pose['geometry_files'],'appearance_bindings':pose['appearance_bindings']},'source_disposition_counts':allsrc['status_counts'],'lab_blocks':len(list((ROOT/'VisualLab_BP/blocks').glob('*.json'))),'lab_entities':len(list((ROOT/'VisualLab_BP/entities').glob('*.json'))),'icons':len(reg['icons'])})
    # Source credit separation. Preserve prior credits above this current addendum.
    marker='\n## A17 uploaded JAR art baseline\n'
    old=(ROOT/'CREDITS.md').read_text().split(marker)[0]
    credit=old+marker+'''\nSource: user-supplied `kaleidoscopetavern-1.2.0-neoforge+mc1.21.1.jar`, SHA-256
`03f35e1e614953b22cd1f5e34345613f3a6a283bf1b1c99659b57d58970edeff`.
Original art: Kaleidoscope Official Production Team. Original images/audio and derived models/atlases retain LICENSE-ASSETS (CC BY-NC-SA 4.0). No author/Mojang endorsement.
All305 originalPNG and6 originalOGG files are preserved bytewise in a distinct namespace; historical Git-pinned files remain unmodified.
2vanillaJava drip sprite dependencies are NOT included in the mod. Their nativeBedrockatlas mapping is a declared cross-edition substitution, not exact original pixels. Reference: Mojang/bedrock-samples water_drip.json at46ba6ea985fb5a92d79a9419198f10dda14c199d. No Mojang atlas or font is redistributed by A17.
Chalkboard Java source references are separately pinned and model constants cross-checked to the uploaded JAR. The referenced1.21.1branch commit is not asserted to be the build commit of the entire JAR.
Source bytecode listings were produced by read-only javap; no JAR was executed, and no executable JAR or class files are bundled here.
'''
    (ROOT/'CREDITS.md').write_text(credit)
    for pack in ['RP','VisualLab_BP','extras/PoseLab_RP']:(ROOT/pack/'CREDITS.md').write_text(credit)
    readme=f'''# Tavern A17 — 完整原版來源、美術家族與程式接入基線

**原版 JAR 的來源盤點與主要靜態家族已收齊；A17 可以作為下一階段程式接入的資源基線。它不是已通過遊戲驗收的完整移植，更不是可玩的 Tavern。**

本批由使用者上傳的 NeoForge／MC1.21.1 版1.2.0取得原件，不再逐個顏色取件。所有1295份資源都有來源雜湊與處理記錄。圖片305張、模型JSON790份含父模板與旋轉引用，**不等於790件獨立物品**。

## 一次完成的靜態範圍

| 家族 | 現在的範圍 |
|---|---|
| 彩燈 | 17／17款；新增最後9款，各自原模型和原图，不是重染 |
| 高腳凳 | 16／16色；保留已有完整底座／座墊／靠背／扶手 |
| 告示牌 | 14／14類：素面＋13種花草；新增完整組合及13款上板分件 |
| 黑板 | 小、大兩種原作尺寸；Java骨架參數依來源重建 |
| 酒瓶／雞尾酒／畫 | 97個排列、14種雞尾酒、14幅畫，沿用已核對資源 |
| 補漏的瓶類 | 水瓶、藥水瓶、蜂蜜瓶、經驗瓶、龍息瓶、燃燒瓶六種展示模型 |
| 物品側美術 | 160個item來源：76個幾何、82個原作圖示、2個抽象模板；158個具體物品皆有對應 |

本輪新增120種外觀：9彩燈＋14完整告示牌＋13花草上板＋2黑板＋6瓶類＋76物品側模型。
累積**491種外觀、359份外觀幾何、另4份動態測試幾何，合计363份主RP幾何；493份.bbmodel**。
原版305張PNG全量獨立存放，舊155份Git來源原圖另行保留以便回歸，不把兩組相加當成460張不同原作美術。

## 動態美術已交付到哪一層

| 項目 | 已有資源／測試入口 | 程式階段仍須完成 |
|---|---|---|
| 動畫貼圖 | 全10個原作.mcmeta序列、原長條與拆幀；重複幀／速度／插值設定保留 | 動畫物品GUI仍以首幀為基礎，需專用渲染適配；引擎動畫驗收 |
| 粒子 | 16個Bedrock候選、19張原作粒子PNG、原作參數／運動步進 | 大型粒子繼承原版基類物理、發射頻率、落地水滴子粒子及Molang實測 |
| 音效 | 6份原OGG、4個sound event；原字幕鍵也記錄 | 在相應投料、取物、搖杯、效果事件觸發 |
| 液位 | 酒桶／壓榨桶×6果汁＝12個獨立液面測試實體；容量0時隱藏，0–满液位可調 | 附著正確機器座標，隨存檔／容量／拆除更新；倒酒液柱仍需渲染程式 |
| 特調顏色 | 玻璃與液體分離，26個指定染色面；獨立RGB與6幀UV動畫候選 | 配方決定顏色、狀態同步及引擎透明排序 |
| 搖杯姿態 | PUT骨架動畫、原第一／第三人稱曲線、純數學接口 | 使用時激活，實際手部／手臂／attachable綁定；沒有player.json覆寫 |
| 黑板文字／櫃內物品 | 原文字區域、角度、槽位錨點及物品模型對應 | 字體渲染、換行、雙面、UI與背包內容聯動，不是靜態模型能獨立完成 |

**兩項明確差異：** 原Java滴水／熔岩粒子的原生貼圖不在此mod JAR內，使用已核對的Bedrock原生atlas位置替代；這不是跨版本逐像素等價。若原版Minecraft基類未包含在JAR，大型粒子保留可輸入參數與檢查預設，不將預設值標成完全還原。

4份Java Ponder場景／結構原件保留供Guidebook適配，**沒有冒充可直接用的.mcstructure或Bedrock指南UI**。4份原語言en_US/zh_CN/ja_JP/ru_RU的值已保留；完整人工繁中翻譯不在此完成聲明內。

## 使用

- `Tavern-Assets-A17.zip`：完整累積專案、原件、模型、貼圖、測試、接口與離線檢視器。
- `Tavern-A17-VisualLab.mcaddon`：外觀實驗室BP/RP，不含釀造／戰鬥／背包腳本。
- `Tavern-A17-PoseLab-OPTIONAL.mcpack`：可選姿態候選，不預設加入主包。

A17包含A1–A16；**不要同時啟用舊VisualLab**。保持舊UUID及ID，新內容使用`kt_assets_a17`，manifest版本`[0,18,0]`。
沿用既定`1.26.50`格式與26.51驗收目標，不把它當成本輪查證的最新版本。Minecraft／bridge／Blockbench實際載入均尚未執行。

解壓後查看`previews/index.html`：491種外觀可搜尋、旋轉、逐幀。`previews/original-art-gallery.html`列出全部305張原圖。這些畫面是離線模型投影，不是Minecraft截圖。
bridge根目錄為`config.json`所在處，BP為`VisualLab_BP`，RP為`RP`。編輯模型在`editor/`；PoseLab目前{pose['geometry_files']}份幾何／{pose['appearance_bindings']}種外觀，**僅來源數值候選，手持基準仍須遊戲檢查**。

## 外觀實驗室指令（尚未實機驗收）

請使用新的測試世界，空出背包及周圍空間。以下兩個function只give物品：

```mcfunction
/function kt_a17/all_string_lights
/function kt_a17/bottle_display
```

以下function會在身旁**生成整排展示實體**，不是只give，不會自動清空建築：

```mcfunction
/function kt_a17/decorated_board
/function kt_a17/chalkboard
```

可只生成一個模型及旋轉它：

```mcfunction
/summon kt_assets_a17:sandwich_board_allium_assembled ~ ~ ~
/event entity @e[type=kt_assets_a17:sandwich_board_allium_assembled,r=5,c=1] kt_art:rotation_4
```

液位與特調測試實體是獨立渲染層，需要和容器組合，不能據此宣稱機器功能已完成：

```mcfunction
/summon kt_assets_a17:rig_liquid_pressing_tub_grape ~ ~ ~
/event entity @e[type=kt_assets_a17:rig_liquid_pressing_tub_grape,r=5,c=1] kt_art:level_4
/summon kt_assets_a17:rig_signature_color ~2 ~ ~
/event entity @e[type=kt_assets_a17:rig_signature_color,r=5,c=1] kt_art:color_red
```

`/function kt_a17/particles`在附近生成16個單次粒子樣本；`/function kt_a17/sounds`播放4個事件，可能重疊。更精細ID見`interfaces/*-art-map.json`。執行指令是主動改動測試世界，**不在此環境偷偷代你執行**。

## 程式準備

先讀`docs/CODE-HANDOFF.zh-TW.md`與`interfaces/runtime-visual-hooks.json`。
` sdk/visual-state.mjs `提供純函數：容量轉液位、原作動畫幀序、16方向角度、RGB檢查、搖杯曲線與小粒子步進。它不匯入Minecraft API，不改世界／背包。
資源SDK已同步全部17彩燈、16色高腳凳和新板類／黑板／物品模型的TypeScript型別，不再出現「JS可用但型別仍只認藍色」的舊缺口。

下一階段M0應先做**遊戲載入與持久化測試、Cookery真實依賴綁定、穩定的物品交换**；再接種植→壓榨→發酵→取酒。不要沿用最早v0.1會覆蓋整疊空桶的helper。

## 驗證與來源

完整結果見`docs/TEST-RESULTS.json`、`VALIDATION.json`、`INTERFACE-VALIDATION.json`、`VIEWER-BROWSER-TEST.json`、`REBUILD-REGRESSION.json`。
瀏覽器測試使用Chromium/Playwright在記憶體載入包內檢視器；不是下載後雙擊檔案／Minecraft／bridge／Blockbench驗收。

```text
python tools/project.py build --force
python tools/project.py test
python tools/render_a17_preview.py
python tools/test_viewer.py --chromium /path/to/chromium
python tools/audit_build.py --force
python tools/project.py package
```

建置只讀本地原件，不下載、執行JAR或改動原ZIP。先備份手改生成檔。包含所有原件與轉換來源，不包含字型、可執行JAR、class或Cookery本體。

uploaded JAR SHA256：`{ready['source_jar_sha256']}`。原版來源305張PNG和6個OGG逐位元組保存；539份歷史來源與上傳JAR比較沒有缺件或模型／像素差異。但**沒有核驗發行方官方雜湊，也不把NeoForge/1.21.1冒認成原先Forge/1.20.1整包完全相同**。

## 尚未解除的發布條件

完整來源／靜態美術資料已可凍結進入程式階段，但任意文字渲染、動態顯示適配、粒子繼承物理、動畫GUI、Cookery真實綁定、玩法與遊戲驗收仍未完成。`ART-READINESS.json`刻意保留`all_art_runtime_parity_verified:false`，production匯出仍禁止。

原作Kaleidoscope Official Production Team；素材及衍生物遵循`LICENSE-ASSETS`，工具及其他來源保留各自授權。歷史A1–A16文件為歷史記錄；當前範圍以本README與完整JAR來源覆蓋清單為準。
'''
    (ROOT/'README.zh-TW.md').write_text(readme,encoding='utf-8')
    (ROOT/'docs/STATUS.zh-TW.md').write_text('# A17 當前状态\n\n以 ../README.zh-TW.md、ART-READINESS.json、A17-ALL-SOURCE-COVERAGE.json 為準。\n\n所有上傳JAR原件已核對並分類，主要靜態家族與物品側美術完成資料轉換。渲染適配與引擎驗收仍未完成，不能將來源檔案數当作完整遊戲完成率。\n\n'+ '\n'.join('- '+x for x in ready['code_phase_visual_work'])+'\n',encoding='utf-8')
    print('A17 current documentation refreshed.')

if __name__=='__main__':write_docs()
