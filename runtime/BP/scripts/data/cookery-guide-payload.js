// Player-facing Tavern chapter for Cookery Guidebook Extension API v1.
export const COOKERY_GUIDE_PAYLOAD={
  "api": 1,
  "id": "kaleidoscope_tavern:tavern",
  "version": "0.6.0",
  "order": 250,
  "icon": "textures/ui/guidebook_icons/kt_tavern",
  "titleKey": "title",
  "introKey": "intro",
  "allKey": "all",
  "selectKey": "select",
  "backKey": "back",
  "languageNoteKey": "language_note",
  "showAll": false,
  "showIds": false,
  "showKinds": false,
  "showCategoryOnEntry": false,
  "categories": [
    {
      "id": "brewing",
      "labelKey": "brewing",
      "fallback": "Brewing basics",
      "icon": "textures/kaleidoscope_tavern_jar/item/grape"
    },
    {
      "id": "mixology",
      "labelKey": "mixology",
      "fallback": "Mixology & effects",
      "icon": "textures/kaleidoscope_tavern_jar/item/shaker"
    },
    {
      "id": "tavern",
      "labelKey": "tavern",
      "fallback": "Tavern equipment",
      "icon": "textures/kaleidoscope_tavern_jar/item/holder"
    }
  ],
  "entries": [
    {
      "id": "kaleidoscope_tavern:guide_grapes",
      "category": "brewing",
      "icon": "textures/kaleidoscope_tavern_jar/item/grapevine",
      "kinds": [],
      "mechanics": [
        "在藤架上種植葡萄藤：下方的泥土、冰雪或地獄石類方塊分別培育普通、冰或金葡萄。",
        "藤蔓結果成熟後用剪刀採收；青提是採收副產物。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "在藤架上种植葡萄藤：下方的泥土、冰雪或下界岩类方块分别培育普通、冰或金葡萄。",
          "藤蔓结果成熟后用剪刀采收；青提是采收副产物。"
        ],
        "zh_TW": [
          "在藤架上種植葡萄藤：下方的泥土、冰雪或地獄石類方塊分別培育普通、冰或金葡萄。",
          "藤蔓結果成熟後用剪刀採收；青提是採收副產物。"
        ],
        "en_US": [
          "Plant grapevines on trellises above soil, ice or snow, or Nether stone for regular, ice, or gold grapes.",
          "Harvest ripe fruit with shears. Green grapes are an extra harvest, not another vine."
        ]
      }
    },
    {
      "id": "kaleidoscope_tavern:guide_pressing",
      "category": "brewing",
      "icon": "textures/kaleidoscope_tavern_jar/item/grape_bucket",
      "kinds": [],
      "mechanics": [
        "把水果放入壓榨桶並跳踩；每八次有效壓榨可得到一桶同種果汁。",
        "用空桶取出果汁，再倒入酒桶。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "把水果放入压榨桶并跳踩；每八次有效压榨可得到一桶同种果汁。",
          "用空桶取出果汁，再倒入酒桶。"
        ],
        "zh_TW": [
          "把水果放入壓榨桶並跳踩；每八次有效壓榨可得到一桶同種果汁。",
          "用空桶取出果汁，再倒入酒桶。"
        ],
        "en_US": [
          "Add fruit to the pressing tub and jump on it. Eight successful presses yield one bucket of that juice.",
          "Collect juice with an empty bucket and pour it into a barrel."
        ]
      }
    },
    {
      "id": "kaleidoscope_tavern:guide_barrel",
      "category": "brewing",
      "icon": "textures/kaleidoscope_tavern_jar/item/barrel",
      "kinds": [],
      "mechanics": [
        "搭好完整酒桶，倒入四桶同種果汁；需要配料的酒在裝滿後加入對應材料。",
        "潛行並空手關蓋開始熟成。酒會從品質 1 逐步升到品質 6。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "搭好完整酒桶，倒入四桶同种果汁；需要配料的酒在装满后加入对应材料。",
          "潜行并空手关盖开始熟成。酒会从品质 1 逐步升到品质 6。"
        ],
        "zh_TW": [
          "搭好完整酒桶，倒入四桶同種果汁；需要配料的酒在裝滿後加入對應材料。",
          "潛行並空手關蓋開始熟成。酒會從品質 1 逐步升到品質 6。"
        ],
        "en_US": [
          "Build a complete barrel and fill it with four buckets of one juice. Add the recipe ingredients after filling it.",
          "Sneak and close the lid with an empty hand to age the drink from quality 1 up to quality 6."
        ]
      }
    },
    {
      "id": "kaleidoscope_tavern:guide_tap",
      "category": "brewing",
      "icon": "textures/kaleidoscope_tavern_jar/item/tap",
      "kinds": [],
      "mechanics": [
        "在酒桶旁安裝酒嘴，手持空酒瓶對酒嘴使用即可裝酒。",
        "酒瓶保留取出時的品質；品質 1 也能飲用，但可能有負面效果。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "在酒桶旁安装酒嘴，手持空酒瓶对酒嘴使用即可装酒。",
          "酒瓶保留取出时的品质；品质 1 也能饮用，但可能有负面效果。"
        ],
        "zh_TW": [
          "在酒桶旁安裝酒嘴，手持空酒瓶對酒嘴使用即可裝酒。",
          "酒瓶保留取出時的品質；品質 1 也能飲用，但可能有負面效果。"
        ],
        "en_US": [
          "Attach a tap beside the barrel and use an empty bottle on it.",
          "The bottle keeps the current quality. Quality 1 is drinkable but can have adverse effects."
        ]
      }
    },
    {
      "id": "kaleidoscope_tavern:guide_bottle_display",
      "category": "brewing",
      "icon": "textures/kaleidoscope_tavern_jar/item/empty_bottle",
      "kinds": [],
      "mechanics": [
        "手持酒瓶對同種擺放的酒使用會先疊放；要新擺一瓶，潛行對方塊表面使用。普通使用仍會飲用。",
        "空手取回最後放入的一瓶；打破瓶堆可取回所有原本品質的酒。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "手持酒瓶对同种摆放的酒使用会先叠放；要新摆一瓶，潜行对方块表面使用。普通使用仍会饮用。",
          "空手取回最后放入的一瓶；打破瓶堆可取回所有原本品质的酒。"
        ],
        "zh_TW": [
          "手持酒瓶對同種擺放的酒使用會先疊放；要新擺一瓶，潛行對方塊表面使用。普通使用仍會飲用。",
          "空手取回最後放入的一瓶；打破瓶堆可取回所有原本品質的酒。"
        ],
        "en_US": [
          "Use a bottle on a display of the same drink to stack it. Sneak-use a block face to start a new display; normal use drinks it.",
          "Use an empty hand to recover the last bottle, or break the display to recover every bottle at its original quality."
        ]
      }
    },
    {
      "id": "kaleidoscope_tavern:guide_shaker",
      "category": "mixology",
      "icon": "textures/kaleidoscope_tavern_jar/item/shaker",
      "kinds": [],
      "mechanics": [
        "將雪克杯放在方塊表面；按配方把材料加入三個槽位，酒館基酒需品質 4 或以上。",
        "拿回裝料後的雪克杯，按住使用並在合適時機鬆開；有成品的雪克杯可把酒倒入已擺放的空杯。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "将雪克杯放在方块表面；按配方把材料加入三个槽位，酒馆基酒需品质 4 或以上。",
          "拿回装料后的雪克杯，按住使用并在合适时机松开；有成品的雪克杯可把酒倒入已摆放的空杯。"
        ],
        "zh_TW": [
          "將雪克杯放在方塊表面；按配方把材料加入三個槽位，酒館基酒需品質 4 或以上。",
          "拿回裝料後的雪克杯，按住使用並在合適時機鬆開；有成品的雪克杯可把酒倒入已擺放的空杯。"
        ],
        "en_US": [
          "Place the shaker on a block and add the recipe ingredients to its three slots. Tavern base drinks must be quality 4 or better.",
          "Take the loaded shaker, hold use, then release at the right time. Pour a finished drink into a placed empty glass."
        ]
      }
    },
    {
      "id": "kaleidoscope_tavern:guide_cocktails",
      "category": "mixology",
      "icon": "textures/kaleidoscope_tavern_jar/item/mojito",
      "kinds": [],
      "mechanics": [
        "固定雞尾酒需要對應的三槽材料與正確的搖勻時機；不匹配時可得到特調。",
        "裝有酒的杯子普通使用會飲用；潛行使用可擺放。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "固定鸡尾酒需要对应的三槽材料与正确的摇匀时机；不匹配时可得到特调。",
          "装有酒的杯子普通使用会饮用；潜行使用可摆放。"
        ],
        "zh_TW": [
          "固定雞尾酒需要對應的三槽材料與正確的搖勻時機；不匹配時可得到特調。",
          "裝有酒的杯子普通使用會飲用；潛行使用可擺放。"
        ],
        "en_US": [
          "A named cocktail needs the right three ingredients and shake timing. Other mixes can become a signature drink.",
          "Normal use drinks a filled glass; sneak-use places it."
        ]
      }
    },
    {
      "id": "kaleidoscope_tavern:guide_quality_effects",
      "category": "mixology",
      "icon": "textures/kaleidoscope_tavern_jar/item/wine",
      "kinds": [],
      "mechanics": [
        "酒的品質會改變飲用效果；熟成到更高品質通常需要更久。",
        "查看每款酒的說明選擇效果，低品質酒也可能帶來負面狀態。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "酒的品质会改变饮用效果；熟成到更高品质通常需要更久。",
          "查看每款酒的说明选择效果，低品质酒也可能带来负面状态。"
        ],
        "zh_TW": [
          "酒的品質會改變飲用效果；熟成到更高品質通常需要更久。",
          "查看每款酒的說明選擇效果，低品質酒也可能帶來負面狀態。"
        ],
        "en_US": [
          "Drink quality changes its effects; higher qualities generally take longer to age.",
          "Check each drink before serving. Lower-quality drinks may have adverse effects."
        ]
      }
    },
    {
      "id": "kaleidoscope_tavern:guide_racks",
      "category": "tavern",
      "icon": "textures/kaleidoscope_tavern_jar/item/holder",
      "kinds": [],
      "mechanics": [
        "酒架與酒櫃可存放酒瓶，取回時每瓶仍保留自己的品質。",
        "普通使用先操作酒架槽位；潛行並手持物品時可嘗試在旁邊擺放物品。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "酒架与酒柜可存放酒瓶，取回时每瓶仍保留自己的品质。",
          "普通使用先操作酒架槽位；潜行并手持物品时可尝试在旁边摆放物品。"
        ],
        "zh_TW": [
          "酒架與酒櫃可存放酒瓶，取回時每瓶仍保留自己的品質。",
          "普通使用先操作酒架槽位；潛行並手持物品時可嘗試在旁邊擺放物品。"
        ],
        "en_US": [
          "Store bottles on racks and in cabinets; each bottle keeps its own quality when retrieved.",
          "Normal use interacts with a rack slot. Sneak while holding an item to try placing it beside the rack."
        ]
      }
    },
    {
      "id": "kaleidoscope_tavern:guide_furniture",
      "category": "tavern",
      "icon": "textures/kt_runtime/icons/blue_bar_stool",
      "kinds": [],
      "mechanics": [
        "相鄰的沙發、桌子與吧台會自動連接。",
        "空手使用高腳凳可坐下；潛行離座。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "相邻的沙发、桌子与吧台会自动连接。",
          "空手使用高脚凳可坐下；潜行离座。"
        ],
        "zh_TW": [
          "相鄰的沙發、桌子與吧台會自動連接。",
          "空手使用高腳凳可坐下；潛行離座。"
        ],
        "en_US": [
          "Adjacent sofas, tables, and counters join automatically.",
          "Use a bar stool with an empty hand to sit, then sneak to stand up."
        ]
      }
    },
    {
      "id": "kaleidoscope_tavern:guide_lighting",
      "category": "tavern",
      "icon": "textures/kt_runtime/icons/string_lights_colorless",
      "kinds": [],
      "mechanics": [
        "彩燈可用染料更換顏色；同色重複使用不會消耗染料。",
        "吊燈佔上下兩格，拆除其中一部分會回收整盞燈。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "彩灯可用染料更换颜色；同色重复使用不会消耗染料。",
          "吊灯占上下两格，拆除其中一部分会回收整盏灯。"
        ],
        "zh_TW": [
          "彩燈可用染料更換顏色；同色重複使用不會消耗染料。",
          "吊燈佔上下兩格，拆除其中一部分會回收整盞燈。"
        ],
        "en_US": [
          "Use dye to recolor string lights; applying their current color does not consume dye.",
          "Pendant lamps occupy two blocks. Break either part to recover the whole lamp."
        ]
      }
    },
    {
      "id": "kaleidoscope_tavern:guide_art",
      "category": "tavern",
      "icon": "textures/kt_derived/a17/icon_tartaric_acid_painting",
      "kinds": [],
      "mechanics": [
        "掛畫可依所點表面安裝在牆面、地面或天花板。",
        "選擇想要的畫作，再對相應方塊表面使用。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "挂画可依所点表面安装在墙面、地面或天花板。",
          "选择想要的画作，再对相应方块表面使用。"
        ],
        "zh_TW": [
          "掛畫可依所點表面安裝在牆面、地面或天花板。",
          "選擇想要的畫作，再對相應方塊表面使用。"
        ],
        "en_US": [
          "Paintings can attach to a wall, floor, or ceiling.",
          "Select a painting and use it on the face where you want it to hang."
        ]
      }
    }
  ],
  "names": {
    "zh_CN": {
      "kaleidoscope_tavern:guide_grapes": "葡萄与藤架",
      "kaleidoscope_tavern:guide_pressing": "压榨果汁",
      "kaleidoscope_tavern:guide_barrel": "酒桶与熟成",
      "kaleidoscope_tavern:guide_tap": "酒嘴与取酒",
      "kaleidoscope_tavern:guide_bottle_display": "摆放酒瓶",
      "kaleidoscope_tavern:guide_shaker": "雪克杯",
      "kaleidoscope_tavern:guide_cocktails": "鸡尾酒与特调",
      "kaleidoscope_tavern:guide_quality_effects": "品质与酒效",
      "kaleidoscope_tavern:guide_racks": "酒架与酒柜",
      "kaleidoscope_tavern:guide_furniture": "家具与座位",
      "kaleidoscope_tavern:guide_lighting": "彩灯与吊灯",
      "kaleidoscope_tavern:guide_art": "挂画与装饰"
    },
    "zh_TW": {
      "kaleidoscope_tavern:guide_grapes": "葡萄與藤架",
      "kaleidoscope_tavern:guide_pressing": "壓榨果汁",
      "kaleidoscope_tavern:guide_barrel": "酒桶與熟成",
      "kaleidoscope_tavern:guide_tap": "酒嘴與取酒",
      "kaleidoscope_tavern:guide_bottle_display": "擺放酒瓶",
      "kaleidoscope_tavern:guide_shaker": "雪克杯",
      "kaleidoscope_tavern:guide_cocktails": "雞尾酒與特調",
      "kaleidoscope_tavern:guide_quality_effects": "品質與酒效",
      "kaleidoscope_tavern:guide_racks": "酒架與酒櫃",
      "kaleidoscope_tavern:guide_furniture": "家具與座位",
      "kaleidoscope_tavern:guide_lighting": "彩燈與吊燈",
      "kaleidoscope_tavern:guide_art": "掛畫與裝飾"
    },
    "en_US": {
      "kaleidoscope_tavern:guide_grapes": "Grapes & trellises",
      "kaleidoscope_tavern:guide_pressing": "Pressing juice",
      "kaleidoscope_tavern:guide_barrel": "Barrels & aging",
      "kaleidoscope_tavern:guide_tap": "Tap & bottling",
      "kaleidoscope_tavern:guide_bottle_display": "Bottle displays",
      "kaleidoscope_tavern:guide_shaker": "Shaker",
      "kaleidoscope_tavern:guide_cocktails": "Cocktails & signatures",
      "kaleidoscope_tavern:guide_quality_effects": "Quality & drink effects",
      "kaleidoscope_tavern:guide_racks": "Racks & cabinets",
      "kaleidoscope_tavern:guide_furniture": "Furniture & seating",
      "kaleidoscope_tavern:guide_lighting": "String & pendant lights",
      "kaleidoscope_tavern:guide_art": "Paintings & decor"
    }
  },
  "text": {
    "zh_CN": {
      "title": "森罗物语：酒馆",
      "intro": "从种葡萄、酿酒和调酒，到酒馆设备与装饰的玩法指南。",
      "all": "全部条目",
      "select": "选择一个主题。",
      "back": "返回",
      "language_note": "酒款品质、设备槽位和效果请按对应条目查看。",
      "brewing": "酿酒入门",
      "mixology": "调酒与酒效",
      "tavern": "酒馆设备"
    },
    "zh_TW": {
      "title": "森羅物語：酒館",
      "intro": "從種葡萄、釀酒和調酒，到酒館設備與裝飾的玩法指南。",
      "all": "全部條目",
      "select": "選擇一個主題。",
      "back": "返回",
      "language_note": "酒款品質、設備槽位和效果請按對應條目查看。",
      "brewing": "釀酒入門",
      "mixology": "調酒與酒效",
      "tavern": "酒館設備"
    },
    "en_US": {
      "title": "Kaleidoscope Tavern",
      "intro": "A guide to grapes, brewing, mixology, Tavern equipment and decor.",
      "all": "All entries",
      "select": "Choose a topic.",
      "back": "Back",
      "language_note": "See each entry for quality, slot and effect details.",
      "brewing": "Brewing basics",
      "mixology": "Mixology & effects",
      "tavern": "Tavern equipment"
    }
  }
};

const GUIDE_LOCALES=['zh_CN','zh_TW','en_US'];
// Replaced at package build from the existing Tavern/Cookery language files.
const GUIDE_ITEM_NAMES={};
const copy=v=>JSON.parse(JSON.stringify(v));
const firstText=(m,fallback)=>m?.zh_TW??m?.zh_CN??m?.en_US??Object.values(m??{})[0]??fallback;
function addLocalizedName(payload,id,map,fallback){
 for(const lc of GUIDE_LOCALES)payload.names[lc][id]=map?.[lc]??map?.en_US??map?.zh_TW??map?.zh_CN??fallback;
}
function recipeMechanics(recipe,lc='zh_TW'){
 const en=lc==='en_US',cn=lc==='zh_CN';
 const label=id=>GUIDE_ITEM_NAMES[lc]?.[id]??id;
 const alts=x=>(x??[]).map(slot=>[...new Set(slot.map(label))].join(' / ')).join(' + ')||'—';
 if(recipe.kind==='pressing')return [`${en?'Fruit':'水果'}：${(recipe.input??[]).map(label).join(' / ')}`,`→ ${label(recipe.fluid)} ${recipe.amount} mB`];
 if(recipe.kind==='shaker')return [`${en?'Three shaker slots':'雪克杯三槽'}：${alts(recipe.ingredients)}`,`→ ${label(recipe.output?.item??recipe.id)}`,`${en?'Serving glass':'接酒杯'}：${label(recipe.carrier??'kaleidoscope_tavern:empty_glassware')}`];
 const output=recipe.output?.item?label(recipe.output.item):recipe.output?.byQuality?.length?`${label(recipe.output.byQuality[0])} (Q1–Q6)`:recipe.id;
 return [`${label(recipe.fluid)} × 4000 mB`,`${en?'Barrel ingredients':'酒桶原料'}：${alts(recipe.ingredients)}`,`→ ${output}`,`${en?'Serving bottle':'接酒瓶'}：${label(recipe.carrier??'kaleidoscope_tavern:empty_bottle')}`];
}
/**
 * Project Tavern extension pages/auto-generated recipe pages into the one Cookery
 * family guide. The registry remains Tavern-owned because barrel/shaker semantics
 * are Tavern-specific; only player-facing navigation/rendering is delegated.
 */
export function buildCookeryGuidePayload(registry){
 const payload=copy(COOKERY_GUIDE_PAYLOAD);
 if(!registry)return payload;
 const sources=new Set((registry.list?.()??[]).map(x=>x.source));
 const pages=(registry.allPages?.()??[]).filter(x=>sources.has(x.source)&&x.source!=='kaleidoscope_tavern');
 const recipes=(registry.allRecipes?.()??[]).filter(x=>x.source==='kaleidoscope_tavern'||sources.has(x.source));
 if(recipes.some(x=>x.source==='kaleidoscope_tavern')){
  payload.categories.push({id:'recipes',labelKey:'recipes',fallback:'Drink recipes',icon:'textures/kaleidoscope_tavern_jar/item/barrel'});
  payload.text.zh_CN.recipes='酿酒与调酒配方';payload.text.zh_TW.recipes='釀酒與調酒配方';payload.text.en_US.recipes='Brewing & cocktail recipes';
 }
 if(pages.length||recipes.some(x=>x.source!=='kaleidoscope_tavern')){
  payload.categories.push({id:'extensions',labelKey:'extensions',fallback:'Tavern add-ons',icon:'textures/kaleidoscope_tavern_jar/item/empty_bottle'});
  payload.text.zh_CN.extensions='酒馆附属';payload.text.zh_TW.extensions='酒館附屬';payload.text.en_US.extensions='Tavern add-ons';
 }
 for(const page of pages){
  const primary=firstText(page.body,page.id),english=page.body?.en_US;
  const mechanics=[primary];if(english&&english!==primary)mechanics.push(english);
  const mechanicsByLocale=Object.fromEntries(GUIDE_LOCALES.map(lc=>[lc,[page.body?.[lc]??english??primary]]));
  payload.entries.push({id:page.id,category:'extensions',icon:page.icon??'textures/kaleidoscope_tavern_jar/item/empty_bottle',kinds:[],mechanics,mechanicsByLocale});
  addLocalizedName(payload,page.id,page.title,page.id);
 }
 for(const recipe of recipes){
  const mechanicsByLocale=Object.fromEntries(GUIDE_LOCALES.map(lc=>[lc,recipeMechanics(recipe,lc)]));
  payload.entries.push({id:recipe.id,category:recipe.source==='kaleidoscope_tavern'?'recipes':'extensions',icon:recipe.kind==='shaker'?'textures/kaleidoscope_tavern_jar/item/shaker':recipe.kind==='pressing'?'textures/kaleidoscope_tavern_jar/item/grape_bucket':'textures/kaleidoscope_tavern_jar/item/barrel',kinds:[],mechanics:mechanicsByLocale.zh_TW,mechanicsByLocale});
  addLocalizedName(payload,recipe.id,recipe.title,recipe.id);
 }
 return payload;
}
