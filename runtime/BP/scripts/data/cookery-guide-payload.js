import {consolidateGuide} from './guide-catalog.js';
// Tavern-owned chapter for the Cookery Guidebook Extension API v1.
import { EFFECT_PAGES } from "./effect-pages.js";
export const COOKERY_GUIDE_PAYLOAD={
  "api": 1,
  "id": "kaleidoscope_tavern:tavern",
  "version": "0.6.34",
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
      "id": "equipment",
      "labelKey": "equipment",
      "fallback": "Brewing Equipment",
      "icon": "textures/kaleidoscope_tavern_jar/item/barrel",
      "parent": ""
    },
    {
      "id": "barrel",
      "labelKey": "barrel",
      "fallback": "Barrel Brewing Encyclopedia",
      "icon": "textures/kaleidoscope_tavern_jar/item/barrel",
      "parent": ""
    },
    {
      "id": "cocktail",
      "labelKey": "cocktail",
      "fallback": "Mixology Encyclopedia",
      "icon": "textures/kaleidoscope_tavern_jar/item/shaker",
      "parent": ""
    },
    {
      "id": "storage",
      "labelKey": "storage",
      "fallback": "Storage and Utility",
      "icon": "textures/kaleidoscope_tavern_jar/item/holder",
      "parent": ""
    },
    {
      "id": "cultivation",
      "labelKey": "cultivation",
      "fallback": "Growing and Harvesting",
      "icon": "textures/kaleidoscope_tavern_jar/item/grapevine",
      "parent": ""
    },
    {
      "id": "decor",
      "labelKey": "decor",
      "fallback": "Decor and Ambience",
      "icon": "textures/kaleidoscope_tavern_jar/item/bell_pendant_lamp",
      "parent": ""
    },
    {
      "id": "gear",
      "labelKey": "gear",
      "fallback": "Brewing Equipment",
      "icon": "textures/kaleidoscope_tavern_jar/item/barrel",
      "parent": "equipment"
    },
    {
      "id": "mix_tools",
      "labelKey": "mix_tools",
      "fallback": "Mixology Equipment",
      "icon": "textures/kaleidoscope_tavern_jar/item/shaker",
      "parent": "equipment"
    },
    {
      "id": "press",
      "labelKey": "press",
      "fallback": "Fruit Pressing",
      "icon": "textures/kaleidoscope_tavern_jar/item/grape_bucket",
      "parent": "equipment"
    },
    {
      "id": "barrel_drinks",
      "labelKey": "barrel_drinks",
      "fallback": "Barrel Drinks and Recipes",
      "icon": "textures/kaleidoscope_tavern_jar/item/wine",
      "parent": "barrel"
    },
    {
      "id": "cocktail_recipes",
      "labelKey": "cocktail_recipes",
      "fallback": "Cocktail Recipes",
      "icon": "textures/kaleidoscope_tavern_jar/item/mojito",
      "parent": "cocktail"
    },
    {
      "id": "drink_effects",
      "labelKey": "drink_effects",
      "fallback": "Drink Quality Effects",
      "icon": "textures/kaleidoscope_tavern_jar/item/wine",
      "parent": "barrel"
    },
    {
      "id": "store",
      "labelKey": "store",
      "fallback": "Bottle Storage",
      "icon": "textures/kaleidoscope_tavern_jar/item/holder",
      "parent": "storage"
    },
    {
      "id": "serve",
      "labelKey": "serve",
      "fallback": "Serving and Displays",
      "icon": "textures/kaleidoscope_tavern_jar/item/empty_bottle",
      "parent": "storage"
    },
    {
      "id": "fruit",
      "labelKey": "fruit",
      "fallback": "Fruit Baskets, Fruit and Sources",
      "icon": "textures/kaleidoscope_tavern_jar/item/grape",
      "parent": "cultivation"
    },
    {
      "id": "press_recipes",
      "labelKey": "press_recipes",
      "fallback": "Juice Recipes",
      "icon": "textures/kaleidoscope_tavern_jar/item/grape_bucket",
      "parent": "cultivation"
    },
    {
      "id": "furniture",
      "labelKey": "furniture",
      "fallback": "Furniture and Seating",
      "icon": "textures/kt_runtime/icons/blue_bar_stool",
      "parent": "decor"
    },
    {
      "id": "lighting",
      "labelKey": "lighting",
      "fallback": "Lighting",
      "icon": "textures/kaleidoscope_tavern_jar/item/bell_pendant_lamp",
      "parent": "decor"
    },
    {
      "id": "incense",
      "labelKey": "incense",
      "fallback": "Incense",
      "icon": "textures/kaleidoscope_tavern_jar/item/sakura_incense",
      "parent": "decor"
    },
    {
      "id": "art",
      "labelKey": "art",
      "fallback": "Paintings",
      "icon": "textures/kt_derived/a17/icon_tartaric_acid_painting",
      "parent": "decor"
    },
    {
      "id": "ladder",
      "labelKey": "ladder",
      "fallback": "Stepladders",
      "icon": "textures/kaleidoscope_tavern_jar/item/stepladder",
      "parent": "storage"
    },
    {
      "id": "boards",
      "labelKey": "boards",
      "fallback": "Chalkboards and Sandwich Boards",
      "icon": "textures/kaleidoscope_tavern_jar/item/chalkboard",
      "parent": "decor"
    }
  ],
  "entries": [
    {
      "id": "kaleidoscope_tavern:guide_grapes",
      "category": "fruit",
      "icon": "textures/kaleidoscope_tavern_jar/item/grapevine",
      "kinds": [],
      "mechanics": [
        "把葡萄藤種在藤架上；作物種類由藤架正下方那一格方塊決定：泥土類長普通葡萄，冰、雪類長冰葡萄，下界岩、岩漿類長金葡萄。這裡的「下方」指藤架緊貼下方的方塊。",
        "普通葡萄藤可由原版藤蔓與甜莓合成；三株葡萄藤直排可合成八個藤架。骨粉可催長。成熟藤蔓會先向上、東、西、南、北尋找可用的裸藤架延伸；無處延伸時才在藤架正下方結果。",
        "果實成熟到第六階段可採收：用剪刀採下 3 個主果，另有 30% 機率多得 1–2 個青提；不用剪刀破壞成熟果實會得 1–2 個主果，並有 30% 機率得 1 個青提。剪刀修剪葡萄藤會移除藤蔓及下方果實，並回收藤架和藤蔓。",
        "蜂巢可為裸藤架上蠟以阻止藤蔓延伸；用斧頭除蠟。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "把葡萄藤种在藤架上；作物种类由藤架正下方那一格方块决定：泥土类长普通葡萄，冰、雪类长冰葡萄，下界岩、岩浆类长金葡萄。这里的“下方”指藤架紧贴下方的方块。",
          "普通葡萄藤可由原版藤蔓与甜莓合成；三株葡萄藤直排可合成八个藤架。骨粉可催长。成熟藤蔓会先向上、东、西、南、北寻找可用的裸藤架延伸；无处延伸时才在藤架正下方结果。",
          "果实成熟到第六阶段可采收：用剪刀采下 3 个主果，另有 30% 概率多得 1–2 个青提；不用剪刀破坏成熟果实会得 1–2 个主果，并有 30% 概率得 1 个青提。剪刀修剪葡萄藤会移除藤蔓及下方果实，并回收藤架和葡萄藤。",
          "蜂巢可为裸藤架上蜡以阻止藤蔓延伸；用斧头除蜡。",
          "森林中会自然生成野生葡萄藤；藤架可在浸水状态下种植并生长。"
        ],
        "zh_TW": [
          "把葡萄藤種在藤架上；作物種類由藤架正下方那一格方塊決定：泥土類長普通葡萄，冰、雪類長冰葡萄，下界岩、岩漿類長金葡萄。這裡的「下方」指藤架緊貼下方的方塊。",
          "普通葡萄藤可由原版藤蔓與甜莓合成；三株葡萄藤直排可合成八個藤架。骨粉可催長。成熟藤蔓會先向上、東、西、南、北尋找可用的裸藤架延伸；無處延伸時才在藤架正下方結果。",
          "果實成熟到第六階段可採收：用剪刀採下 3 個主果，另有 30% 機率多得 1–2 個青提；不用剪刀破壞成熟果實會得 1–2 個主果，並有 30% 機率得 1 個青提。剪刀修剪葡萄藤會移除藤蔓及下方果實，並回收藤架和藤蔓。",
          "蜂巢可為裸藤架上蠟以阻止藤蔓延伸；用斧頭除蠟。",
          "森林中會自然生成野生葡萄藤；藤架可在浸水狀態下栽種與生長。"
        ],
        "en_US": [
          "Plant a grapevine on a trellis. The block in the single cell directly beneath that trellis selects the crop: dirt-type blocks grow regular grapes, ice or snow blocks grow ice grapes, and Nether or magma blocks grow gold grapes.",
          "Craft a grapevine from a vanilla vine and sweet berries; place three vines vertically to craft eight trellises. Bone meal accelerates growth. Mature vines first spread to bare trellises above, east, west, south, then north; they fruit directly below only when no trellis is available.",
          "Fruit ripens at stage six. Shears harvest three main grapes and have a 30% chance for one or two extra green grapes. Breaking ripe fruit without shears yields one or two main grapes and has a 30% chance for one green grape. Shearing a vine removes its fruit and returns the trellis and vine.",
          "Honeycomb waxes a bare trellis to prevent vine spread; use an axe to remove the wax.",
          "Wild grapevines can generate naturally in forests; trellises can be planted and grow while waterlogged."
        ]
      }
    },
    {
      "id": "kaleidoscope_tavern:guide_bottle_display",
      "category": "serve",
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
      "id": "kaleidoscope_tavern:guide_cocktails",
      "category": "cocktail_recipes",
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
      "category": "drink_effects",
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
      "id": "kaleidoscope_tavern:white_bar_stool",
      "category": "furniture",
      "icon": "textures/kt_runtime/icons/white_bar_stool",
      "kinds": [],
      "mechanics": [
        "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
        "此彩色高腳凳可供一名玩家乘坐：空手點擊凳子坐下，潛行離座。破壞凳子取回家具；被乘坐時不能拆除。配方材料與數量列在「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "桌子与吧台会和相邻同类方块连接；沙发彼此连接。高脚凳与沙发可坐，空手互动乘坐、潜行离座；有人坐时家具不能拆除。破坏家具会回收物品。",
          "此彩色高脚凳可供一名玩家乘坐：空手点击凳子坐下，潜行离座。破坏凳子取回家具；有人乘坐时不能拆除。配方材料与数量列在“配方”栏。"
        ],
        "zh_TW": [
          "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
          "此彩色高腳凳可供一名玩家乘坐：空手點擊凳子坐下，潛行離座。破壞凳子取回家具；被乘坐時不能拆除。配方材料與數量列在「配方」欄。"
        ],
        "en_US": [
          "Tables and counters connect to adjacent blocks of the same kind; sofas join adjacent sofas. Stools and sofas seat players: use with an empty hand to sit, sneak to stand. Occupied seating cannot be removed; breaking furniture recovers the item.",
          "This colored bar stool seats one player. Use it with an empty hand to sit; sneak to stand. Break the stool to recover it; it cannot be removed while occupied. Ingredients and output are shown in Recipes."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:white_wool",
            "minecraft:chain",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:white_bar_stool"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:white_sofa",
      "category": "furniture",
      "icon": "textures/kt_runtime/icons/blue_bar_stool",
      "kinds": [],
      "mechanics": [
        "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
        "此彩色沙發會與相鄰沙發連接，提供可坐位置。空手點擊坐下，潛行離座；破壞有人乘坐的沙發時會讓乘客離座，再回收沙發，配方列在「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "桌子与吧台会和相邻同类方块连接；沙发彼此连接。高脚凳与沙发可坐，空手互动乘坐、潜行离座；有人坐时家具不能拆除。破坏家具会回收物品。",
          "此彩色沙发会与相邻沙发连接，提供可坐位置。空手点击坐下，潜行离座；破坏有人乘坐的沙发时会让乘客离座，再回收沙发，配方列在“配方”栏。"
        ],
        "zh_TW": [
          "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
          "此彩色沙發會與相鄰沙發連接，提供可坐位置。空手點擊坐下，潛行離座；破壞有人乘坐的沙發時會讓乘客離座，再回收沙發，配方列在「配方」欄。"
        ],
        "en_US": [
          "Tables and counters connect to adjacent blocks of the same kind; sofas join adjacent sofas. Stools and sofas seat players: use with an empty hand to sit, sneak to stand. Occupied seating cannot be removed; breaking furniture recovers the item.",
          "This colored sofa connects to adjacent sofas and provides seats. Use it with an empty hand to sit; sneak to stand. Breaking an occupied sofa ejects its riders and recovers the sofa; see Recipes for its ingredients."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:white_wool",
            "minecraft:white_wool",
            "minecraft:white_wool",
            "minecraft:white_wool",
            "minecraft:white_wool",
            "minecraft:iron_ingot",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:white_sofa"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:light_gray_bar_stool",
      "category": "furniture",
      "icon": "textures/kt_runtime/icons/light_gray_bar_stool",
      "kinds": [],
      "mechanics": [
        "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
        "此彩色高腳凳可供一名玩家乘坐：空手點擊凳子坐下，潛行離座。破壞凳子取回家具；被乘坐時不能拆除。配方材料與數量列在「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "桌子与吧台会和相邻同类方块连接；沙发彼此连接。高脚凳与沙发可坐，空手互动乘坐、潜行离座；有人坐时家具不能拆除。破坏家具会回收物品。",
          "此彩色高脚凳可供一名玩家乘坐：空手点击凳子坐下，潜行离座。破坏凳子取回家具；有人乘坐时不能拆除。配方材料与数量列在“配方”栏。"
        ],
        "zh_TW": [
          "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
          "此彩色高腳凳可供一名玩家乘坐：空手點擊凳子坐下，潛行離座。破壞凳子取回家具；被乘坐時不能拆除。配方材料與數量列在「配方」欄。"
        ],
        "en_US": [
          "Tables and counters connect to adjacent blocks of the same kind; sofas join adjacent sofas. Stools and sofas seat players: use with an empty hand to sit, sneak to stand. Occupied seating cannot be removed; breaking furniture recovers the item.",
          "This colored bar stool seats one player. Use it with an empty hand to sit; sneak to stand. Break the stool to recover it; it cannot be removed while occupied. Ingredients and output are shown in Recipes."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:light_gray_wool",
            "minecraft:chain",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:light_gray_bar_stool"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:light_gray_sofa",
      "category": "furniture",
      "icon": "textures/kt_runtime/icons/blue_bar_stool",
      "kinds": [],
      "mechanics": [
        "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
        "此彩色沙發會與相鄰沙發連接，提供可坐位置。空手點擊坐下，潛行離座；破壞有人乘坐的沙發時會讓乘客離座，再回收沙發，配方列在「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "桌子与吧台会和相邻同类方块连接；沙发彼此连接。高脚凳与沙发可坐，空手互动乘坐、潜行离座；有人坐时家具不能拆除。破坏家具会回收物品。",
          "此彩色沙发会与相邻沙发连接，提供可坐位置。空手点击坐下，潜行离座；破坏有人乘坐的沙发时会让乘客离座，再回收沙发，配方列在“配方”栏。"
        ],
        "zh_TW": [
          "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
          "此彩色沙發會與相鄰沙發連接，提供可坐位置。空手點擊坐下，潛行離座；破壞有人乘坐的沙發時會讓乘客離座，再回收沙發，配方列在「配方」欄。"
        ],
        "en_US": [
          "Tables and counters connect to adjacent blocks of the same kind; sofas join adjacent sofas. Stools and sofas seat players: use with an empty hand to sit, sneak to stand. Occupied seating cannot be removed; breaking furniture recovers the item.",
          "This colored sofa connects to adjacent sofas and provides seats. Use it with an empty hand to sit; sneak to stand. Breaking an occupied sofa ejects its riders and recovers the sofa; see Recipes for its ingredients."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:light_gray_wool",
            "minecraft:light_gray_wool",
            "minecraft:light_gray_wool",
            "minecraft:light_gray_wool",
            "minecraft:light_gray_wool",
            "minecraft:iron_ingot",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:light_gray_sofa"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:gray_bar_stool",
      "category": "furniture",
      "icon": "textures/kt_runtime/icons/gray_bar_stool",
      "kinds": [],
      "mechanics": [
        "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
        "此彩色高腳凳可供一名玩家乘坐：空手點擊凳子坐下，潛行離座。破壞凳子取回家具；被乘坐時不能拆除。配方材料與數量列在「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "桌子与吧台会和相邻同类方块连接；沙发彼此连接。高脚凳与沙发可坐，空手互动乘坐、潜行离座；有人坐时家具不能拆除。破坏家具会回收物品。",
          "此彩色高脚凳可供一名玩家乘坐：空手点击凳子坐下，潜行离座。破坏凳子取回家具；有人乘坐时不能拆除。配方材料与数量列在“配方”栏。"
        ],
        "zh_TW": [
          "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
          "此彩色高腳凳可供一名玩家乘坐：空手點擊凳子坐下，潛行離座。破壞凳子取回家具；被乘坐時不能拆除。配方材料與數量列在「配方」欄。"
        ],
        "en_US": [
          "Tables and counters connect to adjacent blocks of the same kind; sofas join adjacent sofas. Stools and sofas seat players: use with an empty hand to sit, sneak to stand. Occupied seating cannot be removed; breaking furniture recovers the item.",
          "This colored bar stool seats one player. Use it with an empty hand to sit; sneak to stand. Break the stool to recover it; it cannot be removed while occupied. Ingredients and output are shown in Recipes."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:gray_wool",
            "minecraft:chain",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:gray_bar_stool"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:gray_sofa",
      "category": "furniture",
      "icon": "textures/kt_runtime/icons/blue_bar_stool",
      "kinds": [],
      "mechanics": [
        "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
        "此彩色沙發會與相鄰沙發連接，提供可坐位置。空手點擊坐下，潛行離座；破壞有人乘坐的沙發時會讓乘客離座，再回收沙發，配方列在「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "桌子与吧台会和相邻同类方块连接；沙发彼此连接。高脚凳与沙发可坐，空手互动乘坐、潜行离座；有人坐时家具不能拆除。破坏家具会回收物品。",
          "此彩色沙发会与相邻沙发连接，提供可坐位置。空手点击坐下，潜行离座；破坏有人乘坐的沙发时会让乘客离座，再回收沙发，配方列在“配方”栏。"
        ],
        "zh_TW": [
          "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
          "此彩色沙發會與相鄰沙發連接，提供可坐位置。空手點擊坐下，潛行離座；破壞有人乘坐的沙發時會讓乘客離座，再回收沙發，配方列在「配方」欄。"
        ],
        "en_US": [
          "Tables and counters connect to adjacent blocks of the same kind; sofas join adjacent sofas. Stools and sofas seat players: use with an empty hand to sit, sneak to stand. Occupied seating cannot be removed; breaking furniture recovers the item.",
          "This colored sofa connects to adjacent sofas and provides seats. Use it with an empty hand to sit; sneak to stand. Breaking an occupied sofa ejects its riders and recovers the sofa; see Recipes for its ingredients."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:gray_wool",
            "minecraft:gray_wool",
            "minecraft:gray_wool",
            "minecraft:gray_wool",
            "minecraft:gray_wool",
            "minecraft:iron_ingot",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:gray_sofa"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:black_bar_stool",
      "category": "furniture",
      "icon": "textures/kt_runtime/icons/black_bar_stool",
      "kinds": [],
      "mechanics": [
        "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
        "此彩色高腳凳可供一名玩家乘坐：空手點擊凳子坐下，潛行離座。破壞凳子取回家具；被乘坐時不能拆除。配方材料與數量列在「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "桌子与吧台会和相邻同类方块连接；沙发彼此连接。高脚凳与沙发可坐，空手互动乘坐、潜行离座；有人坐时家具不能拆除。破坏家具会回收物品。",
          "此彩色高脚凳可供一名玩家乘坐：空手点击凳子坐下，潜行离座。破坏凳子取回家具；有人乘坐时不能拆除。配方材料与数量列在“配方”栏。"
        ],
        "zh_TW": [
          "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
          "此彩色高腳凳可供一名玩家乘坐：空手點擊凳子坐下，潛行離座。破壞凳子取回家具；被乘坐時不能拆除。配方材料與數量列在「配方」欄。"
        ],
        "en_US": [
          "Tables and counters connect to adjacent blocks of the same kind; sofas join adjacent sofas. Stools and sofas seat players: use with an empty hand to sit, sneak to stand. Occupied seating cannot be removed; breaking furniture recovers the item.",
          "This colored bar stool seats one player. Use it with an empty hand to sit; sneak to stand. Break the stool to recover it; it cannot be removed while occupied. Ingredients and output are shown in Recipes."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:black_wool",
            "minecraft:chain",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:black_bar_stool"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:black_sofa",
      "category": "furniture",
      "icon": "textures/kt_runtime/icons/blue_bar_stool",
      "kinds": [],
      "mechanics": [
        "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
        "此彩色沙發會與相鄰沙發連接，提供可坐位置。空手點擊坐下，潛行離座；破壞有人乘坐的沙發時會讓乘客離座，再回收沙發，配方列在「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "桌子与吧台会和相邻同类方块连接；沙发彼此连接。高脚凳与沙发可坐，空手互动乘坐、潜行离座；有人坐时家具不能拆除。破坏家具会回收物品。",
          "此彩色沙发会与相邻沙发连接，提供可坐位置。空手点击坐下，潜行离座；破坏有人乘坐的沙发时会让乘客离座，再回收沙发，配方列在“配方”栏。"
        ],
        "zh_TW": [
          "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
          "此彩色沙發會與相鄰沙發連接，提供可坐位置。空手點擊坐下，潛行離座；破壞有人乘坐的沙發時會讓乘客離座，再回收沙發，配方列在「配方」欄。"
        ],
        "en_US": [
          "Tables and counters connect to adjacent blocks of the same kind; sofas join adjacent sofas. Stools and sofas seat players: use with an empty hand to sit, sneak to stand. Occupied seating cannot be removed; breaking furniture recovers the item.",
          "This colored sofa connects to adjacent sofas and provides seats. Use it with an empty hand to sit; sneak to stand. Breaking an occupied sofa ejects its riders and recovers the sofa; see Recipes for its ingredients."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:black_wool",
            "minecraft:black_wool",
            "minecraft:black_wool",
            "minecraft:black_wool",
            "minecraft:black_wool",
            "minecraft:iron_ingot",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:black_sofa"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:brown_bar_stool",
      "category": "furniture",
      "icon": "textures/kt_runtime/icons/brown_bar_stool",
      "kinds": [],
      "mechanics": [
        "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
        "此彩色高腳凳可供一名玩家乘坐：空手點擊凳子坐下，潛行離座。破壞凳子取回家具；被乘坐時不能拆除。配方材料與數量列在「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "桌子与吧台会和相邻同类方块连接；沙发彼此连接。高脚凳与沙发可坐，空手互动乘坐、潜行离座；有人坐时家具不能拆除。破坏家具会回收物品。",
          "此彩色高脚凳可供一名玩家乘坐：空手点击凳子坐下，潜行离座。破坏凳子取回家具；有人乘坐时不能拆除。配方材料与数量列在“配方”栏。"
        ],
        "zh_TW": [
          "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
          "此彩色高腳凳可供一名玩家乘坐：空手點擊凳子坐下，潛行離座。破壞凳子取回家具；被乘坐時不能拆除。配方材料與數量列在「配方」欄。"
        ],
        "en_US": [
          "Tables and counters connect to adjacent blocks of the same kind; sofas join adjacent sofas. Stools and sofas seat players: use with an empty hand to sit, sneak to stand. Occupied seating cannot be removed; breaking furniture recovers the item.",
          "This colored bar stool seats one player. Use it with an empty hand to sit; sneak to stand. Break the stool to recover it; it cannot be removed while occupied. Ingredients and output are shown in Recipes."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:brown_wool",
            "minecraft:chain",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:brown_bar_stool"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:brown_sofa",
      "category": "furniture",
      "icon": "textures/kt_runtime/icons/blue_bar_stool",
      "kinds": [],
      "mechanics": [
        "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
        "此彩色沙發會與相鄰沙發連接，提供可坐位置。空手點擊坐下，潛行離座；破壞有人乘坐的沙發時會讓乘客離座，再回收沙發，配方列在「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "桌子与吧台会和相邻同类方块连接；沙发彼此连接。高脚凳与沙发可坐，空手互动乘坐、潜行离座；有人坐时家具不能拆除。破坏家具会回收物品。",
          "此彩色沙发会与相邻沙发连接，提供可坐位置。空手点击坐下，潜行离座；破坏有人乘坐的沙发时会让乘客离座，再回收沙发，配方列在“配方”栏。"
        ],
        "zh_TW": [
          "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
          "此彩色沙發會與相鄰沙發連接，提供可坐位置。空手點擊坐下，潛行離座；破壞有人乘坐的沙發時會讓乘客離座，再回收沙發，配方列在「配方」欄。"
        ],
        "en_US": [
          "Tables and counters connect to adjacent blocks of the same kind; sofas join adjacent sofas. Stools and sofas seat players: use with an empty hand to sit, sneak to stand. Occupied seating cannot be removed; breaking furniture recovers the item.",
          "This colored sofa connects to adjacent sofas and provides seats. Use it with an empty hand to sit; sneak to stand. Breaking an occupied sofa ejects its riders and recovers the sofa; see Recipes for its ingredients."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:brown_wool",
            "minecraft:brown_wool",
            "minecraft:brown_wool",
            "minecraft:brown_wool",
            "minecraft:brown_wool",
            "minecraft:iron_ingot",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:brown_sofa"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:red_bar_stool",
      "category": "furniture",
      "icon": "textures/kt_runtime/icons/red_bar_stool",
      "kinds": [],
      "mechanics": [
        "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
        "此彩色高腳凳可供一名玩家乘坐：空手點擊凳子坐下，潛行離座。破壞凳子取回家具；被乘坐時不能拆除。配方材料與數量列在「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "桌子与吧台会和相邻同类方块连接；沙发彼此连接。高脚凳与沙发可坐，空手互动乘坐、潜行离座；有人坐时家具不能拆除。破坏家具会回收物品。",
          "此彩色高脚凳可供一名玩家乘坐：空手点击凳子坐下，潜行离座。破坏凳子取回家具；有人乘坐时不能拆除。配方材料与数量列在“配方”栏。"
        ],
        "zh_TW": [
          "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
          "此彩色高腳凳可供一名玩家乘坐：空手點擊凳子坐下，潛行離座。破壞凳子取回家具；被乘坐時不能拆除。配方材料與數量列在「配方」欄。"
        ],
        "en_US": [
          "Tables and counters connect to adjacent blocks of the same kind; sofas join adjacent sofas. Stools and sofas seat players: use with an empty hand to sit, sneak to stand. Occupied seating cannot be removed; breaking furniture recovers the item.",
          "This colored bar stool seats one player. Use it with an empty hand to sit; sneak to stand. Break the stool to recover it; it cannot be removed while occupied. Ingredients and output are shown in Recipes."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:red_wool",
            "minecraft:chain",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:red_bar_stool"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:red_sofa",
      "category": "furniture",
      "icon": "textures/kt_runtime/icons/blue_bar_stool",
      "kinds": [],
      "mechanics": [
        "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
        "此彩色沙發會與相鄰沙發連接，提供可坐位置。空手點擊坐下，潛行離座；破壞有人乘坐的沙發時會讓乘客離座，再回收沙發，配方列在「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "桌子与吧台会和相邻同类方块连接；沙发彼此连接。高脚凳与沙发可坐，空手互动乘坐、潜行离座；有人坐时家具不能拆除。破坏家具会回收物品。",
          "此彩色沙发会与相邻沙发连接，提供可坐位置。空手点击坐下，潜行离座；破坏有人乘坐的沙发时会让乘客离座，再回收沙发，配方列在“配方”栏。"
        ],
        "zh_TW": [
          "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
          "此彩色沙發會與相鄰沙發連接，提供可坐位置。空手點擊坐下，潛行離座；破壞有人乘坐的沙發時會讓乘客離座，再回收沙發，配方列在「配方」欄。"
        ],
        "en_US": [
          "Tables and counters connect to adjacent blocks of the same kind; sofas join adjacent sofas. Stools and sofas seat players: use with an empty hand to sit, sneak to stand. Occupied seating cannot be removed; breaking furniture recovers the item.",
          "This colored sofa connects to adjacent sofas and provides seats. Use it with an empty hand to sit; sneak to stand. Breaking an occupied sofa ejects its riders and recovers the sofa; see Recipes for its ingredients."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:red_wool",
            "minecraft:red_wool",
            "minecraft:red_wool",
            "minecraft:red_wool",
            "minecraft:red_wool",
            "minecraft:iron_ingot",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:red_sofa"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:orange_bar_stool",
      "category": "furniture",
      "icon": "textures/kt_runtime/icons/orange_bar_stool",
      "kinds": [],
      "mechanics": [
        "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
        "此彩色高腳凳可供一名玩家乘坐：空手點擊凳子坐下，潛行離座。破壞凳子取回家具；被乘坐時不能拆除。配方材料與數量列在「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "桌子与吧台会和相邻同类方块连接；沙发彼此连接。高脚凳与沙发可坐，空手互动乘坐、潜行离座；有人坐时家具不能拆除。破坏家具会回收物品。",
          "此彩色高脚凳可供一名玩家乘坐：空手点击凳子坐下，潜行离座。破坏凳子取回家具；有人乘坐时不能拆除。配方材料与数量列在“配方”栏。"
        ],
        "zh_TW": [
          "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
          "此彩色高腳凳可供一名玩家乘坐：空手點擊凳子坐下，潛行離座。破壞凳子取回家具；被乘坐時不能拆除。配方材料與數量列在「配方」欄。"
        ],
        "en_US": [
          "Tables and counters connect to adjacent blocks of the same kind; sofas join adjacent sofas. Stools and sofas seat players: use with an empty hand to sit, sneak to stand. Occupied seating cannot be removed; breaking furniture recovers the item.",
          "This colored bar stool seats one player. Use it with an empty hand to sit; sneak to stand. Break the stool to recover it; it cannot be removed while occupied. Ingredients and output are shown in Recipes."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:orange_wool",
            "minecraft:chain",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:orange_bar_stool"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:orange_sofa",
      "category": "furniture",
      "icon": "textures/kt_runtime/icons/blue_bar_stool",
      "kinds": [],
      "mechanics": [
        "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
        "此彩色沙發會與相鄰沙發連接，提供可坐位置。空手點擊坐下，潛行離座；破壞有人乘坐的沙發時會讓乘客離座，再回收沙發，配方列在「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "桌子与吧台会和相邻同类方块连接；沙发彼此连接。高脚凳与沙发可坐，空手互动乘坐、潜行离座；有人坐时家具不能拆除。破坏家具会回收物品。",
          "此彩色沙发会与相邻沙发连接，提供可坐位置。空手点击坐下，潜行离座；破坏有人乘坐的沙发时会让乘客离座，再回收沙发，配方列在“配方”栏。"
        ],
        "zh_TW": [
          "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
          "此彩色沙發會與相鄰沙發連接，提供可坐位置。空手點擊坐下，潛行離座；破壞有人乘坐的沙發時會讓乘客離座，再回收沙發，配方列在「配方」欄。"
        ],
        "en_US": [
          "Tables and counters connect to adjacent blocks of the same kind; sofas join adjacent sofas. Stools and sofas seat players: use with an empty hand to sit, sneak to stand. Occupied seating cannot be removed; breaking furniture recovers the item.",
          "This colored sofa connects to adjacent sofas and provides seats. Use it with an empty hand to sit; sneak to stand. Breaking an occupied sofa ejects its riders and recovers the sofa; see Recipes for its ingredients."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:orange_wool",
            "minecraft:orange_wool",
            "minecraft:orange_wool",
            "minecraft:orange_wool",
            "minecraft:orange_wool",
            "minecraft:iron_ingot",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:orange_sofa"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:yellow_bar_stool",
      "category": "furniture",
      "icon": "textures/kt_runtime/icons/yellow_bar_stool",
      "kinds": [],
      "mechanics": [
        "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
        "此彩色高腳凳可供一名玩家乘坐：空手點擊凳子坐下，潛行離座。破壞凳子取回家具；被乘坐時不能拆除。配方材料與數量列在「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "桌子与吧台会和相邻同类方块连接；沙发彼此连接。高脚凳与沙发可坐，空手互动乘坐、潜行离座；有人坐时家具不能拆除。破坏家具会回收物品。",
          "此彩色高脚凳可供一名玩家乘坐：空手点击凳子坐下，潜行离座。破坏凳子取回家具；有人乘坐时不能拆除。配方材料与数量列在“配方”栏。"
        ],
        "zh_TW": [
          "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
          "此彩色高腳凳可供一名玩家乘坐：空手點擊凳子坐下，潛行離座。破壞凳子取回家具；被乘坐時不能拆除。配方材料與數量列在「配方」欄。"
        ],
        "en_US": [
          "Tables and counters connect to adjacent blocks of the same kind; sofas join adjacent sofas. Stools and sofas seat players: use with an empty hand to sit, sneak to stand. Occupied seating cannot be removed; breaking furniture recovers the item.",
          "This colored bar stool seats one player. Use it with an empty hand to sit; sneak to stand. Break the stool to recover it; it cannot be removed while occupied. Ingredients and output are shown in Recipes."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:yellow_wool",
            "minecraft:chain",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:yellow_bar_stool"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:yellow_sofa",
      "category": "furniture",
      "icon": "textures/kt_runtime/icons/blue_bar_stool",
      "kinds": [],
      "mechanics": [
        "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
        "此彩色沙發會與相鄰沙發連接，提供可坐位置。空手點擊坐下，潛行離座；破壞有人乘坐的沙發時會讓乘客離座，再回收沙發，配方列在「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "桌子与吧台会和相邻同类方块连接；沙发彼此连接。高脚凳与沙发可坐，空手互动乘坐、潜行离座；有人坐时家具不能拆除。破坏家具会回收物品。",
          "此彩色沙发会与相邻沙发连接，提供可坐位置。空手点击坐下，潜行离座；破坏有人乘坐的沙发时会让乘客离座，再回收沙发，配方列在“配方”栏。"
        ],
        "zh_TW": [
          "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
          "此彩色沙發會與相鄰沙發連接，提供可坐位置。空手點擊坐下，潛行離座；破壞有人乘坐的沙發時會讓乘客離座，再回收沙發，配方列在「配方」欄。"
        ],
        "en_US": [
          "Tables and counters connect to adjacent blocks of the same kind; sofas join adjacent sofas. Stools and sofas seat players: use with an empty hand to sit, sneak to stand. Occupied seating cannot be removed; breaking furniture recovers the item.",
          "This colored sofa connects to adjacent sofas and provides seats. Use it with an empty hand to sit; sneak to stand. Breaking an occupied sofa ejects its riders and recovers the sofa; see Recipes for its ingredients."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:yellow_wool",
            "minecraft:yellow_wool",
            "minecraft:yellow_wool",
            "minecraft:yellow_wool",
            "minecraft:yellow_wool",
            "minecraft:iron_ingot",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:yellow_sofa"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:lime_bar_stool",
      "category": "furniture",
      "icon": "textures/kt_runtime/icons/lime_bar_stool",
      "kinds": [],
      "mechanics": [
        "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
        "此彩色高腳凳可供一名玩家乘坐：空手點擊凳子坐下，潛行離座。破壞凳子取回家具；被乘坐時不能拆除。配方材料與數量列在「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "桌子与吧台会和相邻同类方块连接；沙发彼此连接。高脚凳与沙发可坐，空手互动乘坐、潜行离座；有人坐时家具不能拆除。破坏家具会回收物品。",
          "此彩色高脚凳可供一名玩家乘坐：空手点击凳子坐下，潜行离座。破坏凳子取回家具；有人乘坐时不能拆除。配方材料与数量列在“配方”栏。"
        ],
        "zh_TW": [
          "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
          "此彩色高腳凳可供一名玩家乘坐：空手點擊凳子坐下，潛行離座。破壞凳子取回家具；被乘坐時不能拆除。配方材料與數量列在「配方」欄。"
        ],
        "en_US": [
          "Tables and counters connect to adjacent blocks of the same kind; sofas join adjacent sofas. Stools and sofas seat players: use with an empty hand to sit, sneak to stand. Occupied seating cannot be removed; breaking furniture recovers the item.",
          "This colored bar stool seats one player. Use it with an empty hand to sit; sneak to stand. Break the stool to recover it; it cannot be removed while occupied. Ingredients and output are shown in Recipes."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:lime_wool",
            "minecraft:chain",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:lime_bar_stool"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:lime_sofa",
      "category": "furniture",
      "icon": "textures/kt_runtime/icons/blue_bar_stool",
      "kinds": [],
      "mechanics": [
        "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
        "此彩色沙發會與相鄰沙發連接，提供可坐位置。空手點擊坐下，潛行離座；破壞有人乘坐的沙發時會讓乘客離座，再回收沙發，配方列在「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "桌子与吧台会和相邻同类方块连接；沙发彼此连接。高脚凳与沙发可坐，空手互动乘坐、潜行离座；有人坐时家具不能拆除。破坏家具会回收物品。",
          "此彩色沙发会与相邻沙发连接，提供可坐位置。空手点击坐下，潜行离座；破坏有人乘坐的沙发时会让乘客离座，再回收沙发，配方列在“配方”栏。"
        ],
        "zh_TW": [
          "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
          "此彩色沙發會與相鄰沙發連接，提供可坐位置。空手點擊坐下，潛行離座；破壞有人乘坐的沙發時會讓乘客離座，再回收沙發，配方列在「配方」欄。"
        ],
        "en_US": [
          "Tables and counters connect to adjacent blocks of the same kind; sofas join adjacent sofas. Stools and sofas seat players: use with an empty hand to sit, sneak to stand. Occupied seating cannot be removed; breaking furniture recovers the item.",
          "This colored sofa connects to adjacent sofas and provides seats. Use it with an empty hand to sit; sneak to stand. Breaking an occupied sofa ejects its riders and recovers the sofa; see Recipes for its ingredients."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:lime_wool",
            "minecraft:lime_wool",
            "minecraft:lime_wool",
            "minecraft:lime_wool",
            "minecraft:lime_wool",
            "minecraft:iron_ingot",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:lime_sofa"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:green_bar_stool",
      "category": "furniture",
      "icon": "textures/kt_runtime/icons/green_bar_stool",
      "kinds": [],
      "mechanics": [
        "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
        "此彩色高腳凳可供一名玩家乘坐：空手點擊凳子坐下，潛行離座。破壞凳子取回家具；被乘坐時不能拆除。配方材料與數量列在「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "桌子与吧台会和相邻同类方块连接；沙发彼此连接。高脚凳与沙发可坐，空手互动乘坐、潜行离座；有人坐时家具不能拆除。破坏家具会回收物品。",
          "此彩色高脚凳可供一名玩家乘坐：空手点击凳子坐下，潜行离座。破坏凳子取回家具；有人乘坐时不能拆除。配方材料与数量列在“配方”栏。"
        ],
        "zh_TW": [
          "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
          "此彩色高腳凳可供一名玩家乘坐：空手點擊凳子坐下，潛行離座。破壞凳子取回家具；被乘坐時不能拆除。配方材料與數量列在「配方」欄。"
        ],
        "en_US": [
          "Tables and counters connect to adjacent blocks of the same kind; sofas join adjacent sofas. Stools and sofas seat players: use with an empty hand to sit, sneak to stand. Occupied seating cannot be removed; breaking furniture recovers the item.",
          "This colored bar stool seats one player. Use it with an empty hand to sit; sneak to stand. Break the stool to recover it; it cannot be removed while occupied. Ingredients and output are shown in Recipes."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:green_wool",
            "minecraft:chain",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:green_bar_stool"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:green_sofa",
      "category": "furniture",
      "icon": "textures/kt_runtime/icons/blue_bar_stool",
      "kinds": [],
      "mechanics": [
        "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
        "此彩色沙發會與相鄰沙發連接，提供可坐位置。空手點擊坐下，潛行離座；破壞有人乘坐的沙發時會讓乘客離座，再回收沙發，配方列在「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "桌子与吧台会和相邻同类方块连接；沙发彼此连接。高脚凳与沙发可坐，空手互动乘坐、潜行离座；有人坐时家具不能拆除。破坏家具会回收物品。",
          "此彩色沙发会与相邻沙发连接，提供可坐位置。空手点击坐下，潜行离座；破坏有人乘坐的沙发时会让乘客离座，再回收沙发，配方列在“配方”栏。"
        ],
        "zh_TW": [
          "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
          "此彩色沙發會與相鄰沙發連接，提供可坐位置。空手點擊坐下，潛行離座；破壞有人乘坐的沙發時會讓乘客離座，再回收沙發，配方列在「配方」欄。"
        ],
        "en_US": [
          "Tables and counters connect to adjacent blocks of the same kind; sofas join adjacent sofas. Stools and sofas seat players: use with an empty hand to sit, sneak to stand. Occupied seating cannot be removed; breaking furniture recovers the item.",
          "This colored sofa connects to adjacent sofas and provides seats. Use it with an empty hand to sit; sneak to stand. Breaking an occupied sofa ejects its riders and recovers the sofa; see Recipes for its ingredients."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:green_wool",
            "minecraft:green_wool",
            "minecraft:green_wool",
            "minecraft:green_wool",
            "minecraft:green_wool",
            "minecraft:iron_ingot",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:green_sofa"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:cyan_bar_stool",
      "category": "furniture",
      "icon": "textures/kt_runtime/icons/cyan_bar_stool",
      "kinds": [],
      "mechanics": [
        "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
        "此彩色高腳凳可供一名玩家乘坐：空手點擊凳子坐下，潛行離座。破壞凳子取回家具；被乘坐時不能拆除。配方材料與數量列在「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "桌子与吧台会和相邻同类方块连接；沙发彼此连接。高脚凳与沙发可坐，空手互动乘坐、潜行离座；有人坐时家具不能拆除。破坏家具会回收物品。",
          "此彩色高脚凳可供一名玩家乘坐：空手点击凳子坐下，潜行离座。破坏凳子取回家具；有人乘坐时不能拆除。配方材料与数量列在“配方”栏。"
        ],
        "zh_TW": [
          "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
          "此彩色高腳凳可供一名玩家乘坐：空手點擊凳子坐下，潛行離座。破壞凳子取回家具；被乘坐時不能拆除。配方材料與數量列在「配方」欄。"
        ],
        "en_US": [
          "Tables and counters connect to adjacent blocks of the same kind; sofas join adjacent sofas. Stools and sofas seat players: use with an empty hand to sit, sneak to stand. Occupied seating cannot be removed; breaking furniture recovers the item.",
          "This colored bar stool seats one player. Use it with an empty hand to sit; sneak to stand. Break the stool to recover it; it cannot be removed while occupied. Ingredients and output are shown in Recipes."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:cyan_wool",
            "minecraft:chain",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:cyan_bar_stool"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:cyan_sofa",
      "category": "furniture",
      "icon": "textures/kt_runtime/icons/blue_bar_stool",
      "kinds": [],
      "mechanics": [
        "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
        "此彩色沙發會與相鄰沙發連接，提供可坐位置。空手點擊坐下，潛行離座；破壞有人乘坐的沙發時會讓乘客離座，再回收沙發，配方列在「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "桌子与吧台会和相邻同类方块连接；沙发彼此连接。高脚凳与沙发可坐，空手互动乘坐、潜行离座；有人坐时家具不能拆除。破坏家具会回收物品。",
          "此彩色沙发会与相邻沙发连接，提供可坐位置。空手点击坐下，潜行离座；破坏有人乘坐的沙发时会让乘客离座，再回收沙发，配方列在“配方”栏。"
        ],
        "zh_TW": [
          "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
          "此彩色沙發會與相鄰沙發連接，提供可坐位置。空手點擊坐下，潛行離座；破壞有人乘坐的沙發時會讓乘客離座，再回收沙發，配方列在「配方」欄。"
        ],
        "en_US": [
          "Tables and counters connect to adjacent blocks of the same kind; sofas join adjacent sofas. Stools and sofas seat players: use with an empty hand to sit, sneak to stand. Occupied seating cannot be removed; breaking furniture recovers the item.",
          "This colored sofa connects to adjacent sofas and provides seats. Use it with an empty hand to sit; sneak to stand. Breaking an occupied sofa ejects its riders and recovers the sofa; see Recipes for its ingredients."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:cyan_wool",
            "minecraft:cyan_wool",
            "minecraft:cyan_wool",
            "minecraft:cyan_wool",
            "minecraft:cyan_wool",
            "minecraft:iron_ingot",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:cyan_sofa"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:light_blue_bar_stool",
      "category": "furniture",
      "icon": "textures/kt_runtime/icons/light_blue_bar_stool",
      "kinds": [],
      "mechanics": [
        "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
        "此彩色高腳凳可供一名玩家乘坐：空手點擊凳子坐下，潛行離座。破壞凳子取回家具；被乘坐時不能拆除。配方材料與數量列在「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "桌子与吧台会和相邻同类方块连接；沙发彼此连接。高脚凳与沙发可坐，空手互动乘坐、潜行离座；有人坐时家具不能拆除。破坏家具会回收物品。",
          "此彩色高脚凳可供一名玩家乘坐：空手点击凳子坐下，潜行离座。破坏凳子取回家具；有人乘坐时不能拆除。配方材料与数量列在“配方”栏。"
        ],
        "zh_TW": [
          "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
          "此彩色高腳凳可供一名玩家乘坐：空手點擊凳子坐下，潛行離座。破壞凳子取回家具；被乘坐時不能拆除。配方材料與數量列在「配方」欄。"
        ],
        "en_US": [
          "Tables and counters connect to adjacent blocks of the same kind; sofas join adjacent sofas. Stools and sofas seat players: use with an empty hand to sit, sneak to stand. Occupied seating cannot be removed; breaking furniture recovers the item.",
          "This colored bar stool seats one player. Use it with an empty hand to sit; sneak to stand. Break the stool to recover it; it cannot be removed while occupied. Ingredients and output are shown in Recipes."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:light_blue_wool",
            "minecraft:chain",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:light_blue_bar_stool"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:light_blue_sofa",
      "category": "furniture",
      "icon": "textures/kt_runtime/icons/blue_bar_stool",
      "kinds": [],
      "mechanics": [
        "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
        "此彩色沙發會與相鄰沙發連接，提供可坐位置。空手點擊坐下，潛行離座；破壞有人乘坐的沙發時會讓乘客離座，再回收沙發，配方列在「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "桌子与吧台会和相邻同类方块连接；沙发彼此连接。高脚凳与沙发可坐，空手互动乘坐、潜行离座；有人坐时家具不能拆除。破坏家具会回收物品。",
          "此彩色沙发会与相邻沙发连接，提供可坐位置。空手点击坐下，潜行离座；破坏有人乘坐的沙发时会让乘客离座，再回收沙发，配方列在“配方”栏。"
        ],
        "zh_TW": [
          "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
          "此彩色沙發會與相鄰沙發連接，提供可坐位置。空手點擊坐下，潛行離座；破壞有人乘坐的沙發時會讓乘客離座，再回收沙發，配方列在「配方」欄。"
        ],
        "en_US": [
          "Tables and counters connect to adjacent blocks of the same kind; sofas join adjacent sofas. Stools and sofas seat players: use with an empty hand to sit, sneak to stand. Occupied seating cannot be removed; breaking furniture recovers the item.",
          "This colored sofa connects to adjacent sofas and provides seats. Use it with an empty hand to sit; sneak to stand. Breaking an occupied sofa ejects its riders and recovers the sofa; see Recipes for its ingredients."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:light_blue_wool",
            "minecraft:light_blue_wool",
            "minecraft:light_blue_wool",
            "minecraft:light_blue_wool",
            "minecraft:light_blue_wool",
            "minecraft:iron_ingot",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:light_blue_sofa"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:blue_bar_stool",
      "category": "furniture",
      "icon": "textures/kt_runtime/icons/blue_bar_stool",
      "kinds": [],
      "mechanics": [
        "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
        "此彩色高腳凳可供一名玩家乘坐：空手點擊凳子坐下，潛行離座。破壞凳子取回家具；被乘坐時不能拆除。配方材料與數量列在「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "桌子与吧台会和相邻同类方块连接；沙发彼此连接。高脚凳与沙发可坐，空手互动乘坐、潜行离座；有人坐时家具不能拆除。破坏家具会回收物品。",
          "此彩色高脚凳可供一名玩家乘坐：空手点击凳子坐下，潜行离座。破坏凳子取回家具；有人乘坐时不能拆除。配方材料与数量列在“配方”栏。"
        ],
        "zh_TW": [
          "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
          "此彩色高腳凳可供一名玩家乘坐：空手點擊凳子坐下，潛行離座。破壞凳子取回家具；被乘坐時不能拆除。配方材料與數量列在「配方」欄。"
        ],
        "en_US": [
          "Tables and counters connect to adjacent blocks of the same kind; sofas join adjacent sofas. Stools and sofas seat players: use with an empty hand to sit, sneak to stand. Occupied seating cannot be removed; breaking furniture recovers the item.",
          "This colored bar stool seats one player. Use it with an empty hand to sit; sneak to stand. Break the stool to recover it; it cannot be removed while occupied. Ingredients and output are shown in Recipes."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:blue_wool",
            "minecraft:chain",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:blue_bar_stool"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:blue_sofa",
      "category": "furniture",
      "icon": "textures/kt_runtime/icons/blue_bar_stool",
      "kinds": [],
      "mechanics": [
        "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
        "此彩色沙發會與相鄰沙發連接，提供可坐位置。空手點擊坐下，潛行離座；破壞有人乘坐的沙發時會讓乘客離座，再回收沙發，配方列在「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "桌子与吧台会和相邻同类方块连接；沙发彼此连接。高脚凳与沙发可坐，空手互动乘坐、潜行离座；有人坐时家具不能拆除。破坏家具会回收物品。",
          "此彩色沙发会与相邻沙发连接，提供可坐位置。空手点击坐下，潜行离座；破坏有人乘坐的沙发时会让乘客离座，再回收沙发，配方列在“配方”栏。"
        ],
        "zh_TW": [
          "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
          "此彩色沙發會與相鄰沙發連接，提供可坐位置。空手點擊坐下，潛行離座；破壞有人乘坐的沙發時會讓乘客離座，再回收沙發，配方列在「配方」欄。"
        ],
        "en_US": [
          "Tables and counters connect to adjacent blocks of the same kind; sofas join adjacent sofas. Stools and sofas seat players: use with an empty hand to sit, sneak to stand. Occupied seating cannot be removed; breaking furniture recovers the item.",
          "This colored sofa connects to adjacent sofas and provides seats. Use it with an empty hand to sit; sneak to stand. Breaking an occupied sofa ejects its riders and recovers the sofa; see Recipes for its ingredients."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:blue_wool",
            "minecraft:blue_wool",
            "minecraft:blue_wool",
            "minecraft:blue_wool",
            "minecraft:blue_wool",
            "minecraft:iron_ingot",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:blue_sofa"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:purple_bar_stool",
      "category": "furniture",
      "icon": "textures/kt_runtime/icons/purple_bar_stool",
      "kinds": [],
      "mechanics": [
        "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
        "此彩色高腳凳可供一名玩家乘坐：空手點擊凳子坐下，潛行離座。破壞凳子取回家具；被乘坐時不能拆除。配方材料與數量列在「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "桌子与吧台会和相邻同类方块连接；沙发彼此连接。高脚凳与沙发可坐，空手互动乘坐、潜行离座；有人坐时家具不能拆除。破坏家具会回收物品。",
          "此彩色高脚凳可供一名玩家乘坐：空手点击凳子坐下，潜行离座。破坏凳子取回家具；有人乘坐时不能拆除。配方材料与数量列在“配方”栏。"
        ],
        "zh_TW": [
          "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
          "此彩色高腳凳可供一名玩家乘坐：空手點擊凳子坐下，潛行離座。破壞凳子取回家具；被乘坐時不能拆除。配方材料與數量列在「配方」欄。"
        ],
        "en_US": [
          "Tables and counters connect to adjacent blocks of the same kind; sofas join adjacent sofas. Stools and sofas seat players: use with an empty hand to sit, sneak to stand. Occupied seating cannot be removed; breaking furniture recovers the item.",
          "This colored bar stool seats one player. Use it with an empty hand to sit; sneak to stand. Break the stool to recover it; it cannot be removed while occupied. Ingredients and output are shown in Recipes."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:purple_wool",
            "minecraft:chain",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:purple_bar_stool"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:purple_sofa",
      "category": "furniture",
      "icon": "textures/kt_runtime/icons/blue_bar_stool",
      "kinds": [],
      "mechanics": [
        "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
        "此彩色沙發會與相鄰沙發連接，提供可坐位置。空手點擊坐下，潛行離座；破壞有人乘坐的沙發時會讓乘客離座，再回收沙發，配方列在「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "桌子与吧台会和相邻同类方块连接；沙发彼此连接。高脚凳与沙发可坐，空手互动乘坐、潜行离座；有人坐时家具不能拆除。破坏家具会回收物品。",
          "此彩色沙发会与相邻沙发连接，提供可坐位置。空手点击坐下，潜行离座；破坏有人乘坐的沙发时会让乘客离座，再回收沙发，配方列在“配方”栏。"
        ],
        "zh_TW": [
          "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
          "此彩色沙發會與相鄰沙發連接，提供可坐位置。空手點擊坐下，潛行離座；破壞有人乘坐的沙發時會讓乘客離座，再回收沙發，配方列在「配方」欄。"
        ],
        "en_US": [
          "Tables and counters connect to adjacent blocks of the same kind; sofas join adjacent sofas. Stools and sofas seat players: use with an empty hand to sit, sneak to stand. Occupied seating cannot be removed; breaking furniture recovers the item.",
          "This colored sofa connects to adjacent sofas and provides seats. Use it with an empty hand to sit; sneak to stand. Breaking an occupied sofa ejects its riders and recovers the sofa; see Recipes for its ingredients."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:purple_wool",
            "minecraft:purple_wool",
            "minecraft:purple_wool",
            "minecraft:purple_wool",
            "minecraft:purple_wool",
            "minecraft:iron_ingot",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:purple_sofa"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:magenta_bar_stool",
      "category": "furniture",
      "icon": "textures/kt_runtime/icons/magenta_bar_stool",
      "kinds": [],
      "mechanics": [
        "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
        "此彩色高腳凳可供一名玩家乘坐：空手點擊凳子坐下，潛行離座。破壞凳子取回家具；被乘坐時不能拆除。配方材料與數量列在「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "桌子与吧台会和相邻同类方块连接；沙发彼此连接。高脚凳与沙发可坐，空手互动乘坐、潜行离座；有人坐时家具不能拆除。破坏家具会回收物品。",
          "此彩色高脚凳可供一名玩家乘坐：空手点击凳子坐下，潜行离座。破坏凳子取回家具；有人乘坐时不能拆除。配方材料与数量列在“配方”栏。"
        ],
        "zh_TW": [
          "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
          "此彩色高腳凳可供一名玩家乘坐：空手點擊凳子坐下，潛行離座。破壞凳子取回家具；被乘坐時不能拆除。配方材料與數量列在「配方」欄。"
        ],
        "en_US": [
          "Tables and counters connect to adjacent blocks of the same kind; sofas join adjacent sofas. Stools and sofas seat players: use with an empty hand to sit, sneak to stand. Occupied seating cannot be removed; breaking furniture recovers the item.",
          "This colored bar stool seats one player. Use it with an empty hand to sit; sneak to stand. Break the stool to recover it; it cannot be removed while occupied. Ingredients and output are shown in Recipes."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:magenta_wool",
            "minecraft:chain",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:magenta_bar_stool"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:magenta_sofa",
      "category": "furniture",
      "icon": "textures/kt_runtime/icons/blue_bar_stool",
      "kinds": [],
      "mechanics": [
        "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
        "此彩色沙發會與相鄰沙發連接，提供可坐位置。空手點擊坐下，潛行離座；破壞有人乘坐的沙發時會讓乘客離座，再回收沙發，配方列在「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "桌子与吧台会和相邻同类方块连接；沙发彼此连接。高脚凳与沙发可坐，空手互动乘坐、潜行离座；有人坐时家具不能拆除。破坏家具会回收物品。",
          "此彩色沙发会与相邻沙发连接，提供可坐位置。空手点击坐下，潜行离座；破坏有人乘坐的沙发时会让乘客离座，再回收沙发，配方列在“配方”栏。"
        ],
        "zh_TW": [
          "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
          "此彩色沙發會與相鄰沙發連接，提供可坐位置。空手點擊坐下，潛行離座；破壞有人乘坐的沙發時會讓乘客離座，再回收沙發，配方列在「配方」欄。"
        ],
        "en_US": [
          "Tables and counters connect to adjacent blocks of the same kind; sofas join adjacent sofas. Stools and sofas seat players: use with an empty hand to sit, sneak to stand. Occupied seating cannot be removed; breaking furniture recovers the item.",
          "This colored sofa connects to adjacent sofas and provides seats. Use it with an empty hand to sit; sneak to stand. Breaking an occupied sofa ejects its riders and recovers the sofa; see Recipes for its ingredients."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:magenta_wool",
            "minecraft:magenta_wool",
            "minecraft:magenta_wool",
            "minecraft:magenta_wool",
            "minecraft:magenta_wool",
            "minecraft:iron_ingot",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:magenta_sofa"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:pink_bar_stool",
      "category": "furniture",
      "icon": "textures/kt_runtime/icons/pink_bar_stool",
      "kinds": [],
      "mechanics": [
        "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
        "此彩色高腳凳可供一名玩家乘坐：空手點擊凳子坐下，潛行離座。破壞凳子取回家具；被乘坐時不能拆除。配方材料與數量列在「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "桌子与吧台会和相邻同类方块连接；沙发彼此连接。高脚凳与沙发可坐，空手互动乘坐、潜行离座；有人坐时家具不能拆除。破坏家具会回收物品。",
          "此彩色高脚凳可供一名玩家乘坐：空手点击凳子坐下，潜行离座。破坏凳子取回家具；有人乘坐时不能拆除。配方材料与数量列在“配方”栏。"
        ],
        "zh_TW": [
          "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
          "此彩色高腳凳可供一名玩家乘坐：空手點擊凳子坐下，潛行離座。破壞凳子取回家具；被乘坐時不能拆除。配方材料與數量列在「配方」欄。"
        ],
        "en_US": [
          "Tables and counters connect to adjacent blocks of the same kind; sofas join adjacent sofas. Stools and sofas seat players: use with an empty hand to sit, sneak to stand. Occupied seating cannot be removed; breaking furniture recovers the item.",
          "This colored bar stool seats one player. Use it with an empty hand to sit; sneak to stand. Break the stool to recover it; it cannot be removed while occupied. Ingredients and output are shown in Recipes."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:pink_wool",
            "minecraft:chain",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:pink_bar_stool"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:pink_sofa",
      "category": "furniture",
      "icon": "textures/kt_runtime/icons/blue_bar_stool",
      "kinds": [],
      "mechanics": [
        "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
        "此彩色沙發會與相鄰沙發連接，提供可坐位置。空手點擊坐下，潛行離座；破壞有人乘坐的沙發時會讓乘客離座，再回收沙發，配方列在「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "桌子与吧台会和相邻同类方块连接；沙发彼此连接。高脚凳与沙发可坐，空手互动乘坐、潜行离座；有人坐时家具不能拆除。破坏家具会回收物品。",
          "此彩色沙发会与相邻沙发连接，提供可坐位置。空手点击坐下，潜行离座；破坏有人乘坐的沙发时会让乘客离座，再回收沙发，配方列在“配方”栏。"
        ],
        "zh_TW": [
          "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
          "此彩色沙發會與相鄰沙發連接，提供可坐位置。空手點擊坐下，潛行離座；破壞有人乘坐的沙發時會讓乘客離座，再回收沙發，配方列在「配方」欄。"
        ],
        "en_US": [
          "Tables and counters connect to adjacent blocks of the same kind; sofas join adjacent sofas. Stools and sofas seat players: use with an empty hand to sit, sneak to stand. Occupied seating cannot be removed; breaking furniture recovers the item.",
          "This colored sofa connects to adjacent sofas and provides seats. Use it with an empty hand to sit; sneak to stand. Breaking an occupied sofa ejects its riders and recovers the sofa; see Recipes for its ingredients."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:pink_wool",
            "minecraft:pink_wool",
            "minecraft:pink_wool",
            "minecraft:pink_wool",
            "minecraft:pink_wool",
            "minecraft:iron_ingot",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:pink_sofa"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:string_lights_colorless",
      "category": "lighting",
      "icon": "textures/kt_runtime/icons/string_lights_colorless",
      "kinds": [],
      "mechanics": [
        "串燈放置後可用染料改色；點擊燈具時同色染料不消耗，換色消耗一個。吊燈由上下兩格組成，破壞任一格會回收整組。",
        "將此色串燈放置於裝飾位置以照明；手持任一染料點擊可改成該染料顏色。同色染料不消耗，換色會消耗一個染料。破壞可取回串燈；合成材料列於「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "串灯放置后可用染料改色；点击灯具时同色染料不消耗，换色消耗一个。吊灯由上下两格组成，破坏任一格会回收整组。",
          "将此色串灯放置于装饰位置以照明；手持任一染料点击可改成该染料颜色。同色染料不消耗，换色会消耗一个染料。破坏可取回串灯；合成材料列于“配方”栏。"
        ],
        "zh_TW": [
          "串燈放置後可用染料改色；點擊燈具時同色染料不消耗，換色消耗一個。吊燈由上下兩格組成，破壞任一格會回收整組。",
          "將此色串燈放置於裝飾位置以照明；手持任一染料點擊可改成該染料顏色。同色染料不消耗，換色會消耗一個染料。破壞可取回串燈；合成材料列於「配方」欄。"
        ],
        "en_US": [
          "Use a dye on placed string lights to recolor them; matching dye is not consumed, while changing color consumes one. Pendant lamps occupy two vertical blocks, and breaking either block recovers the complete lamp.",
          "Place these colored string lights as decoration for illumination. Use a dye on them to recolor; matching dye is not consumed, while changing color consumes one dye. Break them to recover the lights. Crafting ingredients are listed in Recipes."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:chain",
            "minecraft:chain",
            "minecraft:chain",
            "minecraft:lantern",
            "minecraft:lantern",
            "minecraft:lantern"
          ],
          "count": 8,
          "time": 0,
          "result": "kaleidoscope_tavern:string_lights_colorless"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:string_lights_white",
      "category": "lighting",
      "icon": "textures/kt_runtime/icons/string_lights_white",
      "kinds": [],
      "mechanics": [
        "串燈放置後可用染料改色；點擊燈具時同色染料不消耗，換色消耗一個。吊燈由上下兩格組成，破壞任一格會回收整組。",
        "將此色串燈放置於裝飾位置以照明；手持任一染料點擊可改成該染料顏色。同色染料不消耗，換色會消耗一個染料。破壞可取回串燈；合成材料列於「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "串灯放置后可用染料改色；点击灯具时同色染料不消耗，换色消耗一个。吊灯由上下两格组成，破坏任一格会回收整组。",
          "将此色串灯放置于装饰位置以照明；手持任一染料点击可改成该染料颜色。同色染料不消耗，换色会消耗一个染料。破坏可取回串灯；合成材料列于“配方”栏。"
        ],
        "zh_TW": [
          "串燈放置後可用染料改色；點擊燈具時同色染料不消耗，換色消耗一個。吊燈由上下兩格組成，破壞任一格會回收整組。",
          "將此色串燈放置於裝飾位置以照明；手持任一染料點擊可改成該染料顏色。同色染料不消耗，換色會消耗一個染料。破壞可取回串燈；合成材料列於「配方」欄。"
        ],
        "en_US": [
          "Use a dye on placed string lights to recolor them; matching dye is not consumed, while changing color consumes one. Pendant lamps occupy two vertical blocks, and breaking either block recovers the complete lamp.",
          "Place these colored string lights as decoration for illumination. Use a dye on them to recolor; matching dye is not consumed, while changing color consumes one dye. Break them to recover the lights. Crafting ingredients are listed in Recipes."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:chain",
            "minecraft:chain",
            "minecraft:chain",
            "minecraft:lantern",
            "minecraft:lantern",
            "minecraft:lantern",
            "minecraft:white_dye",
            "minecraft:white_dye",
            "minecraft:white_dye"
          ],
          "count": 8,
          "time": 0,
          "result": "kaleidoscope_tavern:string_lights_white"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:string_lights_light_gray",
      "category": "lighting",
      "icon": "textures/kt_runtime/icons/string_lights_light_gray",
      "kinds": [],
      "mechanics": [
        "串燈放置後可用染料改色；點擊燈具時同色染料不消耗，換色消耗一個。吊燈由上下兩格組成，破壞任一格會回收整組。",
        "將此色串燈放置於裝飾位置以照明；手持任一染料點擊可改成該染料顏色。同色染料不消耗，換色會消耗一個染料。破壞可取回串燈；合成材料列於「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "串灯放置后可用染料改色；点击灯具时同色染料不消耗，换色消耗一个。吊灯由上下两格组成，破坏任一格会回收整组。",
          "将此色串灯放置于装饰位置以照明；手持任一染料点击可改成该染料颜色。同色染料不消耗，换色会消耗一个染料。破坏可取回串灯；合成材料列于“配方”栏。"
        ],
        "zh_TW": [
          "串燈放置後可用染料改色；點擊燈具時同色染料不消耗，換色消耗一個。吊燈由上下兩格組成，破壞任一格會回收整組。",
          "將此色串燈放置於裝飾位置以照明；手持任一染料點擊可改成該染料顏色。同色染料不消耗，換色會消耗一個染料。破壞可取回串燈；合成材料列於「配方」欄。"
        ],
        "en_US": [
          "Use a dye on placed string lights to recolor them; matching dye is not consumed, while changing color consumes one. Pendant lamps occupy two vertical blocks, and breaking either block recovers the complete lamp.",
          "Place these colored string lights as decoration for illumination. Use a dye on them to recolor; matching dye is not consumed, while changing color consumes one dye. Break them to recover the lights. Crafting ingredients are listed in Recipes."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:chain",
            "minecraft:chain",
            "minecraft:chain",
            "minecraft:lantern",
            "minecraft:lantern",
            "minecraft:lantern",
            "minecraft:light_gray_dye",
            "minecraft:light_gray_dye",
            "minecraft:light_gray_dye"
          ],
          "count": 8,
          "time": 0,
          "result": "kaleidoscope_tavern:string_lights_light_gray"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:string_lights_gray",
      "category": "lighting",
      "icon": "textures/kt_runtime/icons/string_lights_gray",
      "kinds": [],
      "mechanics": [
        "串燈放置後可用染料改色；點擊燈具時同色染料不消耗，換色消耗一個。吊燈由上下兩格組成，破壞任一格會回收整組。",
        "將此色串燈放置於裝飾位置以照明；手持任一染料點擊可改成該染料顏色。同色染料不消耗，換色會消耗一個染料。破壞可取回串燈；合成材料列於「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "串灯放置后可用染料改色；点击灯具时同色染料不消耗，换色消耗一个。吊灯由上下两格组成，破坏任一格会回收整组。",
          "将此色串灯放置于装饰位置以照明；手持任一染料点击可改成该染料颜色。同色染料不消耗，换色会消耗一个染料。破坏可取回串灯；合成材料列于“配方”栏。"
        ],
        "zh_TW": [
          "串燈放置後可用染料改色；點擊燈具時同色染料不消耗，換色消耗一個。吊燈由上下兩格組成，破壞任一格會回收整組。",
          "將此色串燈放置於裝飾位置以照明；手持任一染料點擊可改成該染料顏色。同色染料不消耗，換色會消耗一個染料。破壞可取回串燈；合成材料列於「配方」欄。"
        ],
        "en_US": [
          "Use a dye on placed string lights to recolor them; matching dye is not consumed, while changing color consumes one. Pendant lamps occupy two vertical blocks, and breaking either block recovers the complete lamp.",
          "Place these colored string lights as decoration for illumination. Use a dye on them to recolor; matching dye is not consumed, while changing color consumes one dye. Break them to recover the lights. Crafting ingredients are listed in Recipes."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:chain",
            "minecraft:chain",
            "minecraft:chain",
            "minecraft:lantern",
            "minecraft:lantern",
            "minecraft:lantern",
            "minecraft:gray_dye",
            "minecraft:gray_dye",
            "minecraft:gray_dye"
          ],
          "count": 8,
          "time": 0,
          "result": "kaleidoscope_tavern:string_lights_gray"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:string_lights_black",
      "category": "lighting",
      "icon": "textures/kt_runtime/icons/string_lights_black",
      "kinds": [],
      "mechanics": [
        "串燈放置後可用染料改色；點擊燈具時同色染料不消耗，換色消耗一個。吊燈由上下兩格組成，破壞任一格會回收整組。",
        "將此色串燈放置於裝飾位置以照明；手持任一染料點擊可改成該染料顏色。同色染料不消耗，換色會消耗一個染料。破壞可取回串燈；合成材料列於「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "串灯放置后可用染料改色；点击灯具时同色染料不消耗，换色消耗一个。吊灯由上下两格组成，破坏任一格会回收整组。",
          "将此色串灯放置于装饰位置以照明；手持任一染料点击可改成该染料颜色。同色染料不消耗，换色会消耗一个染料。破坏可取回串灯；合成材料列于“配方”栏。"
        ],
        "zh_TW": [
          "串燈放置後可用染料改色；點擊燈具時同色染料不消耗，換色消耗一個。吊燈由上下兩格組成，破壞任一格會回收整組。",
          "將此色串燈放置於裝飾位置以照明；手持任一染料點擊可改成該染料顏色。同色染料不消耗，換色會消耗一個染料。破壞可取回串燈；合成材料列於「配方」欄。"
        ],
        "en_US": [
          "Use a dye on placed string lights to recolor them; matching dye is not consumed, while changing color consumes one. Pendant lamps occupy two vertical blocks, and breaking either block recovers the complete lamp.",
          "Place these colored string lights as decoration for illumination. Use a dye on them to recolor; matching dye is not consumed, while changing color consumes one dye. Break them to recover the lights. Crafting ingredients are listed in Recipes."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:chain",
            "minecraft:chain",
            "minecraft:chain",
            "minecraft:lantern",
            "minecraft:lantern",
            "minecraft:lantern",
            "minecraft:black_dye",
            "minecraft:black_dye",
            "minecraft:black_dye"
          ],
          "count": 8,
          "time": 0,
          "result": "kaleidoscope_tavern:string_lights_black"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:string_lights_brown",
      "category": "lighting",
      "icon": "textures/kt_runtime/icons/string_lights_brown",
      "kinds": [],
      "mechanics": [
        "串燈放置後可用染料改色；點擊燈具時同色染料不消耗，換色消耗一個。吊燈由上下兩格組成，破壞任一格會回收整組。",
        "將此色串燈放置於裝飾位置以照明；手持任一染料點擊可改成該染料顏色。同色染料不消耗，換色會消耗一個染料。破壞可取回串燈；合成材料列於「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "串灯放置后可用染料改色；点击灯具时同色染料不消耗，换色消耗一个。吊灯由上下两格组成，破坏任一格会回收整组。",
          "将此色串灯放置于装饰位置以照明；手持任一染料点击可改成该染料颜色。同色染料不消耗，换色会消耗一个染料。破坏可取回串灯；合成材料列于“配方”栏。"
        ],
        "zh_TW": [
          "串燈放置後可用染料改色；點擊燈具時同色染料不消耗，換色消耗一個。吊燈由上下兩格組成，破壞任一格會回收整組。",
          "將此色串燈放置於裝飾位置以照明；手持任一染料點擊可改成該染料顏色。同色染料不消耗，換色會消耗一個染料。破壞可取回串燈；合成材料列於「配方」欄。"
        ],
        "en_US": [
          "Use a dye on placed string lights to recolor them; matching dye is not consumed, while changing color consumes one. Pendant lamps occupy two vertical blocks, and breaking either block recovers the complete lamp.",
          "Place these colored string lights as decoration for illumination. Use a dye on them to recolor; matching dye is not consumed, while changing color consumes one dye. Break them to recover the lights. Crafting ingredients are listed in Recipes."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:chain",
            "minecraft:chain",
            "minecraft:chain",
            "minecraft:lantern",
            "minecraft:lantern",
            "minecraft:lantern",
            "minecraft:brown_dye",
            "minecraft:brown_dye",
            "minecraft:brown_dye"
          ],
          "count": 8,
          "time": 0,
          "result": "kaleidoscope_tavern:string_lights_brown"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:string_lights_red",
      "category": "lighting",
      "icon": "textures/kt_runtime/icons/string_lights_red",
      "kinds": [],
      "mechanics": [
        "串燈放置後可用染料改色；點擊燈具時同色染料不消耗，換色消耗一個。吊燈由上下兩格組成，破壞任一格會回收整組。",
        "將此色串燈放置於裝飾位置以照明；手持任一染料點擊可改成該染料顏色。同色染料不消耗，換色會消耗一個染料。破壞可取回串燈；合成材料列於「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "串灯放置后可用染料改色；点击灯具时同色染料不消耗，换色消耗一个。吊灯由上下两格组成，破坏任一格会回收整组。",
          "将此色串灯放置于装饰位置以照明；手持任一染料点击可改成该染料颜色。同色染料不消耗，换色会消耗一个染料。破坏可取回串灯；合成材料列于“配方”栏。"
        ],
        "zh_TW": [
          "串燈放置後可用染料改色；點擊燈具時同色染料不消耗，換色消耗一個。吊燈由上下兩格組成，破壞任一格會回收整組。",
          "將此色串燈放置於裝飾位置以照明；手持任一染料點擊可改成該染料顏色。同色染料不消耗，換色會消耗一個染料。破壞可取回串燈；合成材料列於「配方」欄。"
        ],
        "en_US": [
          "Use a dye on placed string lights to recolor them; matching dye is not consumed, while changing color consumes one. Pendant lamps occupy two vertical blocks, and breaking either block recovers the complete lamp.",
          "Place these colored string lights as decoration for illumination. Use a dye on them to recolor; matching dye is not consumed, while changing color consumes one dye. Break them to recover the lights. Crafting ingredients are listed in Recipes."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:chain",
            "minecraft:chain",
            "minecraft:chain",
            "minecraft:lantern",
            "minecraft:lantern",
            "minecraft:lantern",
            "minecraft:red_dye",
            "minecraft:red_dye",
            "minecraft:red_dye"
          ],
          "count": 8,
          "time": 0,
          "result": "kaleidoscope_tavern:string_lights_red"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:string_lights_orange",
      "category": "lighting",
      "icon": "textures/kt_runtime/icons/string_lights_orange",
      "kinds": [],
      "mechanics": [
        "串燈放置後可用染料改色；點擊燈具時同色染料不消耗，換色消耗一個。吊燈由上下兩格組成，破壞任一格會回收整組。",
        "將此色串燈放置於裝飾位置以照明；手持任一染料點擊可改成該染料顏色。同色染料不消耗，換色會消耗一個染料。破壞可取回串燈；合成材料列於「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "串灯放置后可用染料改色；点击灯具时同色染料不消耗，换色消耗一个。吊灯由上下两格组成，破坏任一格会回收整组。",
          "将此色串灯放置于装饰位置以照明；手持任一染料点击可改成该染料颜色。同色染料不消耗，换色会消耗一个染料。破坏可取回串灯；合成材料列于“配方”栏。"
        ],
        "zh_TW": [
          "串燈放置後可用染料改色；點擊燈具時同色染料不消耗，換色消耗一個。吊燈由上下兩格組成，破壞任一格會回收整組。",
          "將此色串燈放置於裝飾位置以照明；手持任一染料點擊可改成該染料顏色。同色染料不消耗，換色會消耗一個染料。破壞可取回串燈；合成材料列於「配方」欄。"
        ],
        "en_US": [
          "Use a dye on placed string lights to recolor them; matching dye is not consumed, while changing color consumes one. Pendant lamps occupy two vertical blocks, and breaking either block recovers the complete lamp.",
          "Place these colored string lights as decoration for illumination. Use a dye on them to recolor; matching dye is not consumed, while changing color consumes one dye. Break them to recover the lights. Crafting ingredients are listed in Recipes."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:chain",
            "minecraft:chain",
            "minecraft:chain",
            "minecraft:lantern",
            "minecraft:lantern",
            "minecraft:lantern",
            "minecraft:orange_dye",
            "minecraft:orange_dye",
            "minecraft:orange_dye"
          ],
          "count": 8,
          "time": 0,
          "result": "kaleidoscope_tavern:string_lights_orange"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:string_lights_yellow",
      "category": "lighting",
      "icon": "textures/kt_runtime/icons/string_lights_yellow",
      "kinds": [],
      "mechanics": [
        "串燈放置後可用染料改色；點擊燈具時同色染料不消耗，換色消耗一個。吊燈由上下兩格組成，破壞任一格會回收整組。",
        "將此色串燈放置於裝飾位置以照明；手持任一染料點擊可改成該染料顏色。同色染料不消耗，換色會消耗一個染料。破壞可取回串燈；合成材料列於「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "串灯放置后可用染料改色；点击灯具时同色染料不消耗，换色消耗一个。吊灯由上下两格组成，破坏任一格会回收整组。",
          "将此色串灯放置于装饰位置以照明；手持任一染料点击可改成该染料颜色。同色染料不消耗，换色会消耗一个染料。破坏可取回串灯；合成材料列于“配方”栏。"
        ],
        "zh_TW": [
          "串燈放置後可用染料改色；點擊燈具時同色染料不消耗，換色消耗一個。吊燈由上下兩格組成，破壞任一格會回收整組。",
          "將此色串燈放置於裝飾位置以照明；手持任一染料點擊可改成該染料顏色。同色染料不消耗，換色會消耗一個染料。破壞可取回串燈；合成材料列於「配方」欄。"
        ],
        "en_US": [
          "Use a dye on placed string lights to recolor them; matching dye is not consumed, while changing color consumes one. Pendant lamps occupy two vertical blocks, and breaking either block recovers the complete lamp.",
          "Place these colored string lights as decoration for illumination. Use a dye on them to recolor; matching dye is not consumed, while changing color consumes one dye. Break them to recover the lights. Crafting ingredients are listed in Recipes."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:chain",
            "minecraft:chain",
            "minecraft:chain",
            "minecraft:lantern",
            "minecraft:lantern",
            "minecraft:lantern",
            "minecraft:yellow_dye",
            "minecraft:yellow_dye",
            "minecraft:yellow_dye"
          ],
          "count": 8,
          "time": 0,
          "result": "kaleidoscope_tavern:string_lights_yellow"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:string_lights_lime",
      "category": "lighting",
      "icon": "textures/kt_runtime/icons/string_lights_lime",
      "kinds": [],
      "mechanics": [
        "串燈放置後可用染料改色；點擊燈具時同色染料不消耗，換色消耗一個。吊燈由上下兩格組成，破壞任一格會回收整組。",
        "將此色串燈放置於裝飾位置以照明；手持任一染料點擊可改成該染料顏色。同色染料不消耗，換色會消耗一個染料。破壞可取回串燈；合成材料列於「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "串灯放置后可用染料改色；点击灯具时同色染料不消耗，换色消耗一个。吊灯由上下两格组成，破坏任一格会回收整组。",
          "将此色串灯放置于装饰位置以照明；手持任一染料点击可改成该染料颜色。同色染料不消耗，换色会消耗一个染料。破坏可取回串灯；合成材料列于“配方”栏。"
        ],
        "zh_TW": [
          "串燈放置後可用染料改色；點擊燈具時同色染料不消耗，換色消耗一個。吊燈由上下兩格組成，破壞任一格會回收整組。",
          "將此色串燈放置於裝飾位置以照明；手持任一染料點擊可改成該染料顏色。同色染料不消耗，換色會消耗一個染料。破壞可取回串燈；合成材料列於「配方」欄。"
        ],
        "en_US": [
          "Use a dye on placed string lights to recolor them; matching dye is not consumed, while changing color consumes one. Pendant lamps occupy two vertical blocks, and breaking either block recovers the complete lamp.",
          "Place these colored string lights as decoration for illumination. Use a dye on them to recolor; matching dye is not consumed, while changing color consumes one dye. Break them to recover the lights. Crafting ingredients are listed in Recipes."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:chain",
            "minecraft:chain",
            "minecraft:chain",
            "minecraft:lantern",
            "minecraft:lantern",
            "minecraft:lantern",
            "minecraft:lime_dye",
            "minecraft:lime_dye",
            "minecraft:lime_dye"
          ],
          "count": 8,
          "time": 0,
          "result": "kaleidoscope_tavern:string_lights_lime"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:string_lights_green",
      "category": "lighting",
      "icon": "textures/kt_runtime/icons/string_lights_green",
      "kinds": [],
      "mechanics": [
        "串燈放置後可用染料改色；點擊燈具時同色染料不消耗，換色消耗一個。吊燈由上下兩格組成，破壞任一格會回收整組。",
        "將此色串燈放置於裝飾位置以照明；手持任一染料點擊可改成該染料顏色。同色染料不消耗，換色會消耗一個染料。破壞可取回串燈；合成材料列於「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "串灯放置后可用染料改色；点击灯具时同色染料不消耗，换色消耗一个。吊灯由上下两格组成，破坏任一格会回收整组。",
          "将此色串灯放置于装饰位置以照明；手持任一染料点击可改成该染料颜色。同色染料不消耗，换色会消耗一个染料。破坏可取回串灯；合成材料列于“配方”栏。"
        ],
        "zh_TW": [
          "串燈放置後可用染料改色；點擊燈具時同色染料不消耗，換色消耗一個。吊燈由上下兩格組成，破壞任一格會回收整組。",
          "將此色串燈放置於裝飾位置以照明；手持任一染料點擊可改成該染料顏色。同色染料不消耗，換色會消耗一個染料。破壞可取回串燈；合成材料列於「配方」欄。"
        ],
        "en_US": [
          "Use a dye on placed string lights to recolor them; matching dye is not consumed, while changing color consumes one. Pendant lamps occupy two vertical blocks, and breaking either block recovers the complete lamp.",
          "Place these colored string lights as decoration for illumination. Use a dye on them to recolor; matching dye is not consumed, while changing color consumes one dye. Break them to recover the lights. Crafting ingredients are listed in Recipes."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:chain",
            "minecraft:chain",
            "minecraft:chain",
            "minecraft:lantern",
            "minecraft:lantern",
            "minecraft:lantern",
            "minecraft:green_dye",
            "minecraft:green_dye",
            "minecraft:green_dye"
          ],
          "count": 8,
          "time": 0,
          "result": "kaleidoscope_tavern:string_lights_green"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:string_lights_cyan",
      "category": "lighting",
      "icon": "textures/kt_runtime/icons/string_lights_cyan",
      "kinds": [],
      "mechanics": [
        "串燈放置後可用染料改色；點擊燈具時同色染料不消耗，換色消耗一個。吊燈由上下兩格組成，破壞任一格會回收整組。",
        "將此色串燈放置於裝飾位置以照明；手持任一染料點擊可改成該染料顏色。同色染料不消耗，換色會消耗一個染料。破壞可取回串燈；合成材料列於「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "串灯放置后可用染料改色；点击灯具时同色染料不消耗，换色消耗一个。吊灯由上下两格组成，破坏任一格会回收整组。",
          "将此色串灯放置于装饰位置以照明；手持任一染料点击可改成该染料颜色。同色染料不消耗，换色会消耗一个染料。破坏可取回串灯；合成材料列于“配方”栏。"
        ],
        "zh_TW": [
          "串燈放置後可用染料改色；點擊燈具時同色染料不消耗，換色消耗一個。吊燈由上下兩格組成，破壞任一格會回收整組。",
          "將此色串燈放置於裝飾位置以照明；手持任一染料點擊可改成該染料顏色。同色染料不消耗，換色會消耗一個染料。破壞可取回串燈；合成材料列於「配方」欄。"
        ],
        "en_US": [
          "Use a dye on placed string lights to recolor them; matching dye is not consumed, while changing color consumes one. Pendant lamps occupy two vertical blocks, and breaking either block recovers the complete lamp.",
          "Place these colored string lights as decoration for illumination. Use a dye on them to recolor; matching dye is not consumed, while changing color consumes one dye. Break them to recover the lights. Crafting ingredients are listed in Recipes."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:chain",
            "minecraft:chain",
            "minecraft:chain",
            "minecraft:lantern",
            "minecraft:lantern",
            "minecraft:lantern",
            "minecraft:cyan_dye",
            "minecraft:cyan_dye",
            "minecraft:cyan_dye"
          ],
          "count": 8,
          "time": 0,
          "result": "kaleidoscope_tavern:string_lights_cyan"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:string_lights_light_blue",
      "category": "lighting",
      "icon": "textures/kt_runtime/icons/string_lights_light_blue",
      "kinds": [],
      "mechanics": [
        "串燈放置後可用染料改色；點擊燈具時同色染料不消耗，換色消耗一個。吊燈由上下兩格組成，破壞任一格會回收整組。",
        "將此色串燈放置於裝飾位置以照明；手持任一染料點擊可改成該染料顏色。同色染料不消耗，換色會消耗一個染料。破壞可取回串燈；合成材料列於「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "串灯放置后可用染料改色；点击灯具时同色染料不消耗，换色消耗一个。吊灯由上下两格组成，破坏任一格会回收整组。",
          "将此色串灯放置于装饰位置以照明；手持任一染料点击可改成该染料颜色。同色染料不消耗，换色会消耗一个染料。破坏可取回串灯；合成材料列于“配方”栏。"
        ],
        "zh_TW": [
          "串燈放置後可用染料改色；點擊燈具時同色染料不消耗，換色消耗一個。吊燈由上下兩格組成，破壞任一格會回收整組。",
          "將此色串燈放置於裝飾位置以照明；手持任一染料點擊可改成該染料顏色。同色染料不消耗，換色會消耗一個染料。破壞可取回串燈；合成材料列於「配方」欄。"
        ],
        "en_US": [
          "Use a dye on placed string lights to recolor them; matching dye is not consumed, while changing color consumes one. Pendant lamps occupy two vertical blocks, and breaking either block recovers the complete lamp.",
          "Place these colored string lights as decoration for illumination. Use a dye on them to recolor; matching dye is not consumed, while changing color consumes one dye. Break them to recover the lights. Crafting ingredients are listed in Recipes."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:chain",
            "minecraft:chain",
            "minecraft:chain",
            "minecraft:lantern",
            "minecraft:lantern",
            "minecraft:lantern",
            "minecraft:light_blue_dye",
            "minecraft:light_blue_dye",
            "minecraft:light_blue_dye"
          ],
          "count": 8,
          "time": 0,
          "result": "kaleidoscope_tavern:string_lights_light_blue"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:string_lights_blue",
      "category": "lighting",
      "icon": "textures/kt_runtime/icons/string_lights_blue",
      "kinds": [],
      "mechanics": [
        "串燈放置後可用染料改色；點擊燈具時同色染料不消耗，換色消耗一個。吊燈由上下兩格組成，破壞任一格會回收整組。",
        "將此色串燈放置於裝飾位置以照明；手持任一染料點擊可改成該染料顏色。同色染料不消耗，換色會消耗一個染料。破壞可取回串燈；合成材料列於「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "串灯放置后可用染料改色；点击灯具时同色染料不消耗，换色消耗一个。吊灯由上下两格组成，破坏任一格会回收整组。",
          "将此色串灯放置于装饰位置以照明；手持任一染料点击可改成该染料颜色。同色染料不消耗，换色会消耗一个染料。破坏可取回串灯；合成材料列于“配方”栏。"
        ],
        "zh_TW": [
          "串燈放置後可用染料改色；點擊燈具時同色染料不消耗，換色消耗一個。吊燈由上下兩格組成，破壞任一格會回收整組。",
          "將此色串燈放置於裝飾位置以照明；手持任一染料點擊可改成該染料顏色。同色染料不消耗，換色會消耗一個染料。破壞可取回串燈；合成材料列於「配方」欄。"
        ],
        "en_US": [
          "Use a dye on placed string lights to recolor them; matching dye is not consumed, while changing color consumes one. Pendant lamps occupy two vertical blocks, and breaking either block recovers the complete lamp.",
          "Place these colored string lights as decoration for illumination. Use a dye on them to recolor; matching dye is not consumed, while changing color consumes one dye. Break them to recover the lights. Crafting ingredients are listed in Recipes."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:chain",
            "minecraft:chain",
            "minecraft:chain",
            "minecraft:lantern",
            "minecraft:lantern",
            "minecraft:lantern",
            "minecraft:blue_dye",
            "minecraft:blue_dye",
            "minecraft:blue_dye"
          ],
          "count": 8,
          "time": 0,
          "result": "kaleidoscope_tavern:string_lights_blue"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:string_lights_purple",
      "category": "lighting",
      "icon": "textures/kt_runtime/icons/string_lights_purple",
      "kinds": [],
      "mechanics": [
        "串燈放置後可用染料改色；點擊燈具時同色染料不消耗，換色消耗一個。吊燈由上下兩格組成，破壞任一格會回收整組。",
        "將此色串燈放置於裝飾位置以照明；手持任一染料點擊可改成該染料顏色。同色染料不消耗，換色會消耗一個染料。破壞可取回串燈；合成材料列於「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "串灯放置后可用染料改色；点击灯具时同色染料不消耗，换色消耗一个。吊灯由上下两格组成，破坏任一格会回收整组。",
          "将此色串灯放置于装饰位置以照明；手持任一染料点击可改成该染料颜色。同色染料不消耗，换色会消耗一个染料。破坏可取回串灯；合成材料列于“配方”栏。"
        ],
        "zh_TW": [
          "串燈放置後可用染料改色；點擊燈具時同色染料不消耗，換色消耗一個。吊燈由上下兩格組成，破壞任一格會回收整組。",
          "將此色串燈放置於裝飾位置以照明；手持任一染料點擊可改成該染料顏色。同色染料不消耗，換色會消耗一個染料。破壞可取回串燈；合成材料列於「配方」欄。"
        ],
        "en_US": [
          "Use a dye on placed string lights to recolor them; matching dye is not consumed, while changing color consumes one. Pendant lamps occupy two vertical blocks, and breaking either block recovers the complete lamp.",
          "Place these colored string lights as decoration for illumination. Use a dye on them to recolor; matching dye is not consumed, while changing color consumes one dye. Break them to recover the lights. Crafting ingredients are listed in Recipes."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:chain",
            "minecraft:chain",
            "minecraft:chain",
            "minecraft:lantern",
            "minecraft:lantern",
            "minecraft:lantern",
            "minecraft:purple_dye",
            "minecraft:purple_dye",
            "minecraft:purple_dye"
          ],
          "count": 8,
          "time": 0,
          "result": "kaleidoscope_tavern:string_lights_purple"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:string_lights_magenta",
      "category": "lighting",
      "icon": "textures/kt_runtime/icons/string_lights_magenta",
      "kinds": [],
      "mechanics": [
        "串燈放置後可用染料改色；點擊燈具時同色染料不消耗，換色消耗一個。吊燈由上下兩格組成，破壞任一格會回收整組。",
        "將此色串燈放置於裝飾位置以照明；手持任一染料點擊可改成該染料顏色。同色染料不消耗，換色會消耗一個染料。破壞可取回串燈；合成材料列於「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "串灯放置后可用染料改色；点击灯具时同色染料不消耗，换色消耗一个。吊灯由上下两格组成，破坏任一格会回收整组。",
          "将此色串灯放置于装饰位置以照明；手持任一染料点击可改成该染料颜色。同色染料不消耗，换色会消耗一个染料。破坏可取回串灯；合成材料列于“配方”栏。"
        ],
        "zh_TW": [
          "串燈放置後可用染料改色；點擊燈具時同色染料不消耗，換色消耗一個。吊燈由上下兩格組成，破壞任一格會回收整組。",
          "將此色串燈放置於裝飾位置以照明；手持任一染料點擊可改成該染料顏色。同色染料不消耗，換色會消耗一個染料。破壞可取回串燈；合成材料列於「配方」欄。"
        ],
        "en_US": [
          "Use a dye on placed string lights to recolor them; matching dye is not consumed, while changing color consumes one. Pendant lamps occupy two vertical blocks, and breaking either block recovers the complete lamp.",
          "Place these colored string lights as decoration for illumination. Use a dye on them to recolor; matching dye is not consumed, while changing color consumes one dye. Break them to recover the lights. Crafting ingredients are listed in Recipes."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:chain",
            "minecraft:chain",
            "minecraft:chain",
            "minecraft:lantern",
            "minecraft:lantern",
            "minecraft:lantern",
            "minecraft:magenta_dye",
            "minecraft:magenta_dye",
            "minecraft:magenta_dye"
          ],
          "count": 8,
          "time": 0,
          "result": "kaleidoscope_tavern:string_lights_magenta"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:string_lights_pink",
      "category": "lighting",
      "icon": "textures/kt_runtime/icons/string_lights_pink",
      "kinds": [],
      "mechanics": [
        "串燈放置後可用染料改色；點擊燈具時同色染料不消耗，換色消耗一個。吊燈由上下兩格組成，破壞任一格會回收整組。",
        "將此色串燈放置於裝飾位置以照明；手持任一染料點擊可改成該染料顏色。同色染料不消耗，換色會消耗一個染料。破壞可取回串燈；合成材料列於「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "串灯放置后可用染料改色；点击灯具时同色染料不消耗，换色消耗一个。吊灯由上下两格组成，破坏任一格会回收整组。",
          "将此色串灯放置于装饰位置以照明；手持任一染料点击可改成该染料颜色。同色染料不消耗，换色会消耗一个染料。破坏可取回串灯；合成材料列于“配方”栏。"
        ],
        "zh_TW": [
          "串燈放置後可用染料改色；點擊燈具時同色染料不消耗，換色消耗一個。吊燈由上下兩格組成，破壞任一格會回收整組。",
          "將此色串燈放置於裝飾位置以照明；手持任一染料點擊可改成該染料顏色。同色染料不消耗，換色會消耗一個染料。破壞可取回串燈；合成材料列於「配方」欄。"
        ],
        "en_US": [
          "Use a dye on placed string lights to recolor them; matching dye is not consumed, while changing color consumes one. Pendant lamps occupy two vertical blocks, and breaking either block recovers the complete lamp.",
          "Place these colored string lights as decoration for illumination. Use a dye on them to recolor; matching dye is not consumed, while changing color consumes one dye. Break them to recover the lights. Crafting ingredients are listed in Recipes."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:chain",
            "minecraft:chain",
            "minecraft:chain",
            "minecraft:lantern",
            "minecraft:lantern",
            "minecraft:lantern",
            "minecraft:pink_dye",
            "minecraft:pink_dye",
            "minecraft:pink_dye"
          ],
          "count": 8,
          "time": 0,
          "result": "kaleidoscope_tavern:string_lights_pink"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:bell_pendant_lamp",
      "category": "lighting",
      "icon": "textures/kaleidoscope_tavern_jar/item/bell_pendant_lamp",
      "kinds": [],
      "mechanics": [
        "串燈放置後可用染料改色；點擊燈具時同色染料不消耗，換色消耗一個。吊燈由上下兩格組成，破壞任一格會回收整組。",
        "此款吊燈由上下兩格組成，放置時會成對垂掛；破壞任一燈格會收回整組吊燈。配方顯示於「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "串灯放置后可用染料改色；点击灯具时同色染料不消耗，换色消耗一个。吊灯由上下两格组成，破坏任一格会回收整组。",
          "此款吊灯由上下两格组成，放置时会成对垂挂；破坏任一灯格会收回整组吊灯。配方显示于“配方”栏。"
        ],
        "zh_TW": [
          "串燈放置後可用染料改色；點擊燈具時同色染料不消耗，換色消耗一個。吊燈由上下兩格組成，破壞任一格會回收整組。",
          "此款吊燈由上下兩格組成，放置時會成對垂掛；破壞任一燈格會收回整組吊燈。配方顯示於「配方」欄。"
        ],
        "en_US": [
          "Use a dye on placed string lights to recolor them; matching dye is not consumed, while changing color consumes one. Pendant lamps occupy two vertical blocks, and breaking either block recovers the complete lamp.",
          "This pendant lamp occupies two vertical blocks. Breaking either lamp block recovers the complete lamp item. See Recipes for its ingredients."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:chain",
            "minecraft:chain",
            "minecraft:bell"
          ],
          "count": 8,
          "time": 0,
          "result": "kaleidoscope_tavern:bell_pendant_lamp"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:blue_pendant_lamp",
      "category": "lighting",
      "icon": "textures/kaleidoscope_tavern_jar/item/blue_pendant_lamp",
      "kinds": [],
      "mechanics": [
        "串燈放置後可用染料改色；點擊燈具時同色染料不消耗，換色消耗一個。吊燈由上下兩格組成，破壞任一格會回收整組。",
        "此款吊燈由上下兩格組成，放置時會成對垂掛；破壞任一燈格會收回整組吊燈。配方顯示於「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "串灯放置后可用染料改色；点击灯具时同色染料不消耗，换色消耗一个。吊灯由上下两格组成，破坏任一格会回收整组。",
          "此款吊灯由上下两格组成，放置时会成对垂挂；破坏任一灯格会收回整组吊灯。配方显示于“配方”栏。"
        ],
        "zh_TW": [
          "串燈放置後可用染料改色；點擊燈具時同色染料不消耗，換色消耗一個。吊燈由上下兩格組成，破壞任一格會回收整組。",
          "此款吊燈由上下兩格組成，放置時會成對垂掛；破壞任一燈格會收回整組吊燈。配方顯示於「配方」欄。"
        ],
        "en_US": [
          "Use a dye on placed string lights to recolor them; matching dye is not consumed, while changing color consumes one. Pendant lamps occupy two vertical blocks, and breaking either block recovers the complete lamp.",
          "This pendant lamp occupies two vertical blocks. Breaking either lamp block recovers the complete lamp item. See Recipes for its ingredients."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:chain",
            "minecraft:chain",
            "minecraft:soul_lantern"
          ],
          "count": 4,
          "time": 0,
          "result": "kaleidoscope_tavern:blue_pendant_lamp"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:yellow_pendant_lamp",
      "category": "lighting",
      "icon": "textures/kaleidoscope_tavern_jar/item/yellow_pendant_lamp",
      "kinds": [],
      "mechanics": [
        "串燈放置後可用染料改色；點擊燈具時同色染料不消耗，換色消耗一個。吊燈由上下兩格組成，破壞任一格會回收整組。",
        "此款吊燈由上下兩格組成，放置時會成對垂掛；破壞任一燈格會收回整組吊燈。配方顯示於「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "串灯放置后可用染料改色；点击灯具时同色染料不消耗，换色消耗一个。吊灯由上下两格组成，破坏任一格会回收整组。",
          "此款吊灯由上下两格组成，放置时会成对垂挂；破坏任一灯格会收回整组吊灯。配方显示于“配方”栏。"
        ],
        "zh_TW": [
          "串燈放置後可用染料改色；點擊燈具時同色染料不消耗，換色消耗一個。吊燈由上下兩格組成，破壞任一格會回收整組。",
          "此款吊燈由上下兩格組成，放置時會成對垂掛；破壞任一燈格會收回整組吊燈。配方顯示於「配方」欄。"
        ],
        "en_US": [
          "Use a dye on placed string lights to recolor them; matching dye is not consumed, while changing color consumes one. Pendant lamps occupy two vertical blocks, and breaking either block recovers the complete lamp.",
          "This pendant lamp occupies two vertical blocks. Breaking either lamp block recovers the complete lamp item. See Recipes for its ingredients."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:chain",
            "minecraft:chain",
            "minecraft:lantern"
          ],
          "count": 4,
          "time": 0,
          "result": "kaleidoscope_tavern:yellow_pendant_lamp"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:table",
      "category": "furniture",
      "icon": "textures/kaleidoscope_tavern_jar/block/table",
      "kinds": [],
      "mechanics": [
        "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
        "桌子可水平延伸並與相鄰桌子自動連接，作為吧台或擺設表面；對方塊表面放置。破壞單一桌面可取回桌子，鄰桌會重新整理連接。配方列於「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "桌子与吧台会和相邻同类方块连接；沙发彼此连接。高脚凳与沙发可坐，空手互动乘坐、潜行离座；有人坐时家具不能拆除。破坏家具会回收物品。",
          "桌子可水平延伸并与相邻桌子自动连接，作为吧台或摆设表面；对方块表面放置。破坏单个桌面可取回桌子，邻桌会重新整理连接。配方列于“配方”栏。"
        ],
        "zh_TW": [
          "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
          "桌子可水平延伸並與相鄰桌子自動連接，作為吧台或擺設表面；對方塊表面放置。破壞單一桌面可取回桌子，鄰桌會重新整理連接。配方列於「配方」欄。"
        ],
        "en_US": [
          "Tables and counters connect to adjacent blocks of the same kind; sofas join adjacent sofas. Stools and sofas seat players: use with an empty hand to sit, sneak to stand. Occupied seating cannot be removed; breaking furniture recovers the item.",
          "Place the table against a block face. Adjacent tables connect into a wider surface for a bar or display. Breaking one table block returns the table item and updates neighboring connections. See Recipes for ingredients."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:oak_planks",
            "minecraft:oak_planks",
            "minecraft:oak_planks",
            "minecraft:oak_fence",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:table"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:oak_planks",
            "minecraft:oak_planks",
            "minecraft:oak_planks",
            "minecraft:acacia_fence",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:table"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:oak_planks",
            "minecraft:oak_planks",
            "minecraft:oak_planks",
            "minecraft:bamboo_fence",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:table"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:oak_planks",
            "minecraft:oak_planks",
            "minecraft:oak_planks",
            "minecraft:birch_fence",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:table"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:oak_planks",
            "minecraft:oak_planks",
            "minecraft:oak_planks",
            "minecraft:cherry_fence",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:table"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:oak_planks",
            "minecraft:oak_planks",
            "minecraft:oak_planks",
            "minecraft:crimson_fence",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:table"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:oak_planks",
            "minecraft:oak_planks",
            "minecraft:oak_planks",
            "minecraft:dark_oak_fence",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:table"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:oak_planks",
            "minecraft:oak_planks",
            "minecraft:oak_planks",
            "minecraft:jungle_fence",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:table"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:oak_planks",
            "minecraft:oak_planks",
            "minecraft:oak_planks",
            "minecraft:mangrove_fence",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:table"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:oak_planks",
            "minecraft:oak_planks",
            "minecraft:oak_planks",
            "minecraft:nether_brick_fence",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:table"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:oak_planks",
            "minecraft:oak_planks",
            "minecraft:oak_planks",
            "minecraft:spruce_fence",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:table"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:oak_planks",
            "minecraft:oak_planks",
            "minecraft:oak_planks",
            "minecraft:warped_fence",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:table"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:bar_counter",
      "category": "furniture",
      "icon": "textures/kaleidoscope_tavern_jar/item/holder",
      "kinds": [],
      "mechanics": [
        "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
        "吧台可與相鄰吧台自動連接成長櫃檯；放置後作為裝飾與服務檯面。破壞單格可取回吧台，鄰格會更新連接。配方列於「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "桌子与吧台会和相邻同类方块连接；沙发彼此连接。高脚凳与沙发可坐，空手互动乘坐、潜行离座；有人坐时家具不能拆除。破坏家具会回收物品。",
          "吧台可与相邻吧台自动连接成长柜台；放置后作为装饰与服务台面。破坏单格可取回吧台，邻格会更新连接。配方列于“配方”栏。"
        ],
        "zh_TW": [
          "桌子與吧台會和相鄰同類區塊連接；沙發彼此連接。高腳凳與沙發可坐，空手互動乘坐、潛行離座；有人坐時家具不能拆除。破壞家具會回收物品。",
          "吧台可與相鄰吧台自動連接成長櫃檯；放置後作為裝飾與服務檯面。破壞單格可取回吧台，鄰格會更新連接。配方列於「配方」欄。"
        ],
        "en_US": [
          "Tables and counters connect to adjacent blocks of the same kind; sofas join adjacent sofas. Stools and sofas seat players: use with an empty hand to sit, sneak to stand. Occupied seating cannot be removed; breaking furniture recovers the item.",
          "Adjacent bar counters connect into a longer counter. Break an individual block to recover its counter item; neighboring counters update their connections. See Recipes for ingredients."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:gold_nugget",
            "minecraft:gold_nugget",
            "minecraft:gold_nugget",
            "minecraft:oak_planks",
            "minecraft:oak_planks",
            "minecraft:oak_planks",
            "minecraft:oak_planks",
            "minecraft:oak_planks",
            "minecraft:oak_planks"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:bar_counter"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:glassware_holder",
      "category": "store",
      "icon": "textures/kaleidoscope_tavern_jar/item/holder",
      "kinds": [],
      "mechanics": [
        "酒架與酒櫃可存放酒瓶，取回時每瓶仍保留自己的品質。",
        "普通使用先操作酒架槽位；潛行並手持物品時可嘗試在旁邊擺放物品。",
        "此架有四格，正面依左上、右上、左下、右下分區；手持空玻璃器皿點空槽放入，空手點有物品的同一格逐一取回。",
        "破壞玻璃器皿架會一併掉落架子與其中所有空玻璃器皿；這不是空手點擊回收。配方列在本條目「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "酒架与酒柜可存放酒瓶，取回时每瓶仍保留自己的品质。",
          "普通使用先操作酒架槽位；潜行并手持物品时可尝试在旁边摆放物品。",
          "此架有四格，正面按左上、右上、左下、右下分区；手持空玻璃器皿点击空槽放入，空手点击有物品的同一格逐一取回。",
          "破坏玻璃器皿架会一并掉落架子与其中所有空玻璃器皿；这不是空手点击回收。配方列在本条目“配方”栏。"
        ],
        "zh_TW": [
          "酒架與酒櫃可存放酒瓶，取回時每瓶仍保留自己的品質。",
          "普通使用先操作酒架槽位；潛行並手持物品時可嘗試在旁邊擺放物品。",
          "此架有四格，正面依左上、右上、左下、右下分區；手持空玻璃器皿點空槽放入，空手點有物品的同一格逐一取回。",
          "破壞玻璃器皿架會一併掉落架子與其中所有空玻璃器皿；這不是空手點擊回收。配方列在本條目「配方」欄。"
        ],
        "en_US": [
          "Store bottles on racks and in cabinets; each bottle keeps its own quality when retrieved.",
          "Normal use interacts with a rack slot. Sneak while holding an item to try placing it beside the rack.",
          "The holder has four face slots (top-left, top-right, bottom-left, bottom-right). Use an empty glassware item on an empty quadrant to insert it; use an empty hand on that same occupied quadrant to take one back.",
          "Breaking the holder returns the fixture and all stored empty glassware. Empty-hand use takes glassware; it does not recover the fixture. See this entry’s Recipes section."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:iron_nugget",
            "minecraft:iron_nugget",
            "minecraft:iron_nugget",
            "minecraft:chain",
            "minecraft:chain",
            "minecraft:chain",
            "minecraft:iron_nugget",
            "minecraft:iron_nugget",
            "minecraft:iron_nugget"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:glassware_holder"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:holder",
      "category": "store",
      "icon": "textures/kaleidoscope_tavern_jar/item/holder",
      "kinds": [],
      "mechanics": [
        "酒架與酒櫃可存放酒瓶，取回時每瓶仍保留自己的品質。",
        "普通使用先操作酒架槽位；潛行並手持物品時可嘗試在旁邊擺放物品。",
        "此瓶架只有一格；手持可收納的瓶子點架子放入，空手點架子取回瓶子。它可放空瓶與香檳、花香釀、蜂蜜酒、冰葡萄酒、光之新娘、梅酒、北極星甜白、紅皇后、櫻花酒、白蘇維濃乾白、雪莉、醋、威士忌、葡萄酒；其他酒款不相容。",
        "紅石訊號上升沿會把架上成酒隨機彈出；空瓶不會被射出。破壞瓶架會掉落瓶架及存放瓶子。配方列在本條目「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "酒架与酒柜可存放酒瓶，取回时每瓶仍保留自己的品质。",
          "普通使用先操作酒架槽位；潜行并手持物品时可尝试在旁边摆放物品。",
          "此瓶架只有一格；手持可收纳的瓶子点击架子放入，空手点击架子取回瓶子。它可放空瓶与香槟、花香酿、蜂蜜酒、冰葡萄酒、光之新娘、梅酒、北极星甜白、红皇后、樱花酒、白苏维浓干白、雪莉、醋、威士忌、葡萄酒；其他酒款不兼容。",
          "红石信号上升沿会把架上成酒随机弹出；空瓶不会被射出。破坏瓶架会掉落瓶架及存放瓶子。配方列在本条目“配方”栏。"
        ],
        "zh_TW": [
          "酒架與酒櫃可存放酒瓶，取回時每瓶仍保留自己的品質。",
          "普通使用先操作酒架槽位；潛行並手持物品時可嘗試在旁邊擺放物品。",
          "此瓶架只有一格；手持可收納的瓶子點架子放入，空手點架子取回瓶子。它可放空瓶與香檳、花香釀、蜂蜜酒、冰葡萄酒、光之新娘、梅酒、北極星甜白、紅皇后、櫻花酒、白蘇維濃乾白、雪莉、醋、威士忌、葡萄酒；其他酒款不相容。",
          "紅石訊號上升沿會把架上成酒隨機彈出；空瓶不會被射出。破壞瓶架會掉落瓶架及存放瓶子。配方列在本條目「配方」欄。"
        ],
        "en_US": [
          "Store bottles on racks and in cabinets; each bottle keeps its own quality when retrieved.",
          "Normal use interacts with a rack slot. Sneak while holding an item to try placing it beside the rack.",
          "This holder has one slot. Use a compatible bottle on it to insert, then use an empty hand to take it. It accepts empty bottles and Champagne, Glowflower Brew, Honey Wine, Ice Wine, Luminous Bride, Plum Wine, Polaris Sweet White, Red Queen, Sakura Wine, Sauvignon Blanc Dry White, Sherry, Vinegar, Whiskey, and Wine; other drinks are rejected.",
          "A redstone rising edge ejects the stored drink; an empty bottle is not launched. Breaking the fixture drops the holder and its bottle. See this entry’s Recipes section."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:chain",
            "minecraft:chain",
            "minecraft:iron_ingot",
            "minecraft:iron_ingot"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:holder"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:tilted_rack",
      "category": "store",
      "icon": "textures/kaleidoscope_tavern_jar/item/holder",
      "kinds": [],
      "mechanics": [
        "酒架與酒櫃可存放酒瓶，取回時每瓶仍保留自己的品質。",
        "普通使用先操作酒架槽位；潛行並手持物品時可嘗試在旁邊擺放物品。",
        "斜酒架有三格。手持可收納酒瓶點正面左、中、右三分區放入；空手點同一分區逐一取回。白瓶、酒瓶皆可，但白蘭地與佳釀紅酒瓶身不相容。",
        "紅石上升沿會隨機射出一瓶成酒；空瓶不會射出。破壞酒架會掉落酒架與全部瓶子。配方列在本條目「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "酒架与酒柜可存放酒瓶，取回时每瓶仍保留自己的品质。",
          "普通使用先操作酒架槽位；潜行并手持物品时可尝试在旁边摆放物品。",
          "斜酒架有三格。手持可收纳酒瓶点击正面左、中、右三区放入；空手点击同一区逐一取回。空瓶、酒瓶皆可，但白兰地与佳酿红酒瓶身不兼容。",
          "红石上升沿会随机射出一瓶成酒；空瓶不会射出。破坏酒架会掉落酒架与全部瓶子。配方列在本条目“配方”栏。"
        ],
        "zh_TW": [
          "酒架與酒櫃可存放酒瓶，取回時每瓶仍保留自己的品質。",
          "普通使用先操作酒架槽位；潛行並手持物品時可嘗試在旁邊擺放物品。",
          "斜酒架有三格。手持可收納酒瓶點正面左、中、右三分區放入；空手點同一分區逐一取回。白瓶、酒瓶皆可，但白蘭地與佳釀紅酒瓶身不相容。",
          "紅石上升沿會隨機射出一瓶成酒；空瓶不會射出。破壞酒架會掉落酒架與全部瓶子。配方列在本條目「配方」欄。"
        ],
        "en_US": [
          "Store bottles on racks and in cabinets; each bottle keeps its own quality when retrieved.",
          "Normal use interacts with a rack slot. Sneak while holding an item to try placing it beside the rack.",
          "The tilted rack has three slots. Use a storable bottle on the left, middle, or right third of its front to insert; use an empty hand on that same third to take one back. Empty bottles and drinks fit except Brandy and Carignan bottles.",
          "A redstone rising edge launches a random stored drink; an empty bottle is not launched. Breaking the rack drops the fixture and all bottles. See this entry’s Recipes section."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:iron_ingot",
            "minecraft:chain",
            "minecraft:iron_ingot",
            "minecraft:chain",
            "minecraft:iron_ingot"
          ],
          "count": 3,
          "time": 0,
          "result": "kaleidoscope_tavern:tilted_rack"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:circular_rack",
      "category": "store",
      "icon": "textures/kaleidoscope_tavern_jar/item/holder",
      "kinds": [],
      "mechanics": [
        "酒架與酒櫃可存放酒瓶，取回時每瓶仍保留自己的品質。",
        "普通使用先操作酒架槽位；潛行並手持物品時可嘗試在旁邊擺放物品。",
        "圓形酒架有六格，沿正面外圈按點擊位置選取最近的扇區；手持任一空瓶或酒瓶放入該格，空手點同一扇區逐一取回。",
        "紅石上升沿會隨機射出一瓶成酒；空瓶不會射出。破壞酒架會掉落酒架與全部瓶子。配方列在本條目「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "酒架与酒柜可存放酒瓶，取回时每瓶仍保留自己的品质。",
          "普通使用先操作酒架槽位；潜行并手持物品时可尝试在旁边摆放物品。",
          "圆形酒架有六格，沿正面外圈按点击位置选取最近的扇区；手持任一空瓶或酒瓶放入该格，空手点击同一扇区逐一取回。",
          "红石上升沿会随机射出一瓶成酒；空瓶不会射出。破坏酒架会掉落酒架与全部瓶子。配方列在本条目“配方”栏。"
        ],
        "zh_TW": [
          "酒架與酒櫃可存放酒瓶，取回時每瓶仍保留自己的品質。",
          "普通使用先操作酒架槽位；潛行並手持物品時可嘗試在旁邊擺放物品。",
          "圓形酒架有六格，沿正面外圈按點擊位置選取最近的扇區；手持任一空瓶或酒瓶放入該格，空手點同一扇區逐一取回。",
          "紅石上升沿會隨機射出一瓶成酒；空瓶不會射出。破壞酒架會掉落酒架與全部瓶子。配方列在本條目「配方」欄。"
        ],
        "en_US": [
          "Store bottles on racks and in cabinets; each bottle keeps its own quality when retrieved.",
          "Normal use interacts with a rack slot. Sneak while holding an item to try placing it beside the rack.",
          "The circular rack has six slots around its face. Click the nearest outer wedge while holding any empty bottle or drink to insert it; use an empty hand on that same wedge to take one back.",
          "A redstone rising edge launches a random stored drink; an empty bottle is not launched. Breaking the rack drops the fixture and every bottle. See this entry’s Recipes section."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:iron_ingot",
            "minecraft:end_rod",
            "minecraft:iron_ingot",
            "minecraft:iron_ingot",
            "minecraft:end_rod",
            "minecraft:iron_ingot",
            "minecraft:iron_ingot",
            "minecraft:end_rod",
            "minecraft:iron_ingot"
          ],
          "count": 2,
          "time": 0,
          "result": "kaleidoscope_tavern:circular_rack"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:cellar_cabinet",
      "category": "store",
      "icon": "textures/kaleidoscope_tavern_jar/item/holder",
      "kinds": [],
      "mechanics": [
        "酒架與酒櫃可存放酒瓶，取回時每瓶仍保留自己的品質。",
        "普通使用先操作酒架槽位；潛行並手持物品時可嘗試在旁邊擺放物品。",
        "酒窖柜正面有 3×3 共九格；只能点朝向正面的槽位。手持可收納瓶子放入指定格，空手点同格逐一取回。瓶架可收納的酒款限制也适用于此柜。",
        "紅石上升沿会随机射出一瓶成酒；空瓶不會射出。相鄰同朝向酒窖櫃可連成一排。破壞酒櫃會掉落櫃體與全部瓶子。配方列在本條目「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "酒架与酒柜可存放酒瓶，取回时每瓶仍保留自己的品质。",
          "普通使用先操作酒架槽位；潜行并手持物品时可尝试在旁边摆放物品。",
          "酒窖柜正面有 3×3 共九格；只能点击朝向正面的槽位。手持可收纳瓶子放入指定格，空手点击同格逐一取回。瓶架可收纳的酒款限制也适用于此柜。",
          "红石上升沿会随机射出一瓶成酒；空瓶不会射出。相邻同朝向酒窖柜可连成一排。破坏酒柜会掉落柜体与全部瓶子。配方列在本条目“配方”栏。"
        ],
        "zh_TW": [
          "酒架與酒櫃可存放酒瓶，取回時每瓶仍保留自己的品質。",
          "普通使用先操作酒架槽位；潛行並手持物品時可嘗試在旁邊擺放物品。",
          "酒窖柜正面有 3×3 共九格；只能点朝向正面的槽位。手持可收納瓶子放入指定格，空手点同格逐一取回。瓶架可收納的酒款限制也适用于此柜。",
          "紅石上升沿会随机射出一瓶成酒；空瓶不會射出。相鄰同朝向酒窖櫃可連成一排。破壞酒櫃會掉落櫃體與全部瓶子。配方列在本條目「配方」欄。"
        ],
        "en_US": [
          "Store bottles on racks and in cabinets; each bottle keeps its own quality when retrieved.",
          "Normal use interacts with a rack slot. Sneak while holding an item to try placing it beside the rack.",
          "The cellar cabinet has nine slots in a 3×3 front grid; click its facing front. Use a compatible bottle on a chosen slot to insert, then use an empty hand on that same slot to take one back. It has the same drink restrictions as the single bottle holder.",
          "A redstone rising edge launches a random stored drink; an empty bottle is not launched. Cabinets facing the same direction can join side by side. Breaking the cabinet drops it and all bottles. See this entry’s Recipes section."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "minecraft:trapdoor",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:cellar_cabinet"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "minecraft:acacia_trapdoor",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:cellar_cabinet"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "minecraft:bamboo_trapdoor",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:cellar_cabinet"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "minecraft:birch_trapdoor",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:cellar_cabinet"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "minecraft:cherry_trapdoor",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:cellar_cabinet"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "minecraft:copper_trapdoor",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:cellar_cabinet"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "minecraft:crimson_trapdoor",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:cellar_cabinet"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "minecraft:dark_oak_trapdoor",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:cellar_cabinet"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "minecraft:exposed_copper_trapdoor",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:cellar_cabinet"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "minecraft:iron_trapdoor",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:cellar_cabinet"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "minecraft:jungle_trapdoor",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:cellar_cabinet"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "minecraft:mangrove_trapdoor",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:cellar_cabinet"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "minecraft:oxidized_copper_trapdoor",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:cellar_cabinet"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "minecraft:spruce_trapdoor",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:cellar_cabinet"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "minecraft:warped_trapdoor",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:cellar_cabinet"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "minecraft:waxed_copper_trapdoor",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:cellar_cabinet"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "minecraft:waxed_exposed_copper_trapdoor",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:cellar_cabinet"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "minecraft:waxed_oxidized_copper_trapdoor",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:cellar_cabinet"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "minecraft:waxed_weathered_copper_trapdoor",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:cellar_cabinet"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "minecraft:weathered_copper_trapdoor",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:cellar_cabinet"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:bar_cabinet",
      "category": "store",
      "icon": "textures/kaleidoscope_tavern_jar/item/holder",
      "kinds": [],
      "mechanics": [
        "酒架與酒櫃可存放酒瓶，取回時每瓶仍保留自己的品質。",
        "普通使用先操作酒架槽位；潛行並手持物品時可嘗試在旁邊擺放物品。",
        "吧台櫃正面左右各一格；手持任一空瓶或酒瓶點空側放入，空手點該側逐一取回。白蘭地與佳釀紅酒是粗瓶，只能置中存一瓶；放入後不能再放第二瓶。",
        "此櫃沒有紅石彈射功能。破壞櫃體會掉落櫃子與全部瓶子。配方列在本條目「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "酒架与酒柜可存放酒瓶，取回时每瓶仍保留自己的品质。",
          "普通使用先操作酒架槽位；潜行并手持物品时可尝试在旁边摆放物品。",
          "吧台柜正面左右各一格；手持任一空瓶或酒瓶点击空侧放入，空手点击该侧逐一取回。白兰地与佳酿红酒是粗瓶，只能居中存一瓶；放入后不能再放第二瓶。",
          "此柜没有红石弹射功能。破坏柜体会掉落柜子与全部瓶子。配方列在本条目“配方”栏。"
        ],
        "zh_TW": [
          "酒架與酒櫃可存放酒瓶，取回時每瓶仍保留自己的品質。",
          "普通使用先操作酒架槽位；潛行並手持物品時可嘗試在旁邊擺放物品。",
          "吧台櫃正面左右各一格；手持任一空瓶或酒瓶點空側放入，空手點該側逐一取回。白蘭地與佳釀紅酒是粗瓶，只能置中存一瓶；放入後不能再放第二瓶。",
          "此櫃沒有紅石彈射功能。破壞櫃體會掉落櫃子與全部瓶子。配方列在本條目「配方」欄。"
        ],
        "en_US": [
          "Store bottles on racks and in cabinets; each bottle keeps its own quality when retrieved.",
          "Normal use interacts with a rack slot. Sneak while holding an item to try placing it beside the rack.",
          "The bar cabinet has left and right slots on its front. Use any empty bottle or drink on an empty side to insert; use an empty hand on that side to retrieve it. The wide Brandy and Carignan bottles use the center position and occupy the cabinet alone.",
          "This cabinet has no redstone ejection. Breaking it drops the cabinet and all bottles. See this entry’s Recipes section."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:bar_cabinet"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:glass_bar_cabinet",
      "category": "store",
      "icon": "textures/kaleidoscope_tavern_jar/item/holder",
      "kinds": [],
      "mechanics": [
        "酒架與酒櫃可存放酒瓶，取回時每瓶仍保留自己的品質。",
        "普通使用先操作酒架槽位；潛行並手持物品時可嘗試在旁邊擺放物品。",
        "玻璃吧台櫃正面左右各一格；手持任一空瓶或酒瓶點空側放入，空手點該側逐一取回。白蘭地與佳釀紅酒是粗瓶，只能置中存一瓶；放入後不能再放第二瓶。",
        "此櫃沒有紅石彈射功能。破壞櫃體會掉落櫃子與全部瓶子。配方列在本條目「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "酒架与酒柜可存放酒瓶，取回时每瓶仍保留自己的品质。",
          "普通使用先操作酒架槽位；潜行并手持物品时可尝试在旁边摆放物品。",
          "玻璃吧台柜正面左右各一格；手持任一空瓶或酒瓶点击空侧放入，空手点击该侧逐一取回。白兰地与佳酿红酒是粗瓶，只能居中存一瓶；放入后不能再放第二瓶。",
          "此柜没有红石弹射功能。破坏柜体会掉落柜子与全部瓶子。配方列在本条目“配方”栏。"
        ],
        "zh_TW": [
          "酒架與酒櫃可存放酒瓶，取回時每瓶仍保留自己的品質。",
          "普通使用先操作酒架槽位；潛行並手持物品時可嘗試在旁邊擺放物品。",
          "玻璃吧台櫃正面左右各一格；手持任一空瓶或酒瓶點空側放入，空手點該側逐一取回。白蘭地與佳釀紅酒是粗瓶，只能置中存一瓶；放入後不能再放第二瓶。",
          "此櫃沒有紅石彈射功能。破壞櫃體會掉落櫃子與全部瓶子。配方列在本條目「配方」欄。"
        ],
        "en_US": [
          "Store bottles on racks and in cabinets; each bottle keeps its own quality when retrieved.",
          "Normal use interacts with a rack slot. Sneak while holding an item to try placing it beside the rack.",
          "The glass bar cabinet has left and right slots on its front. Use any empty bottle or drink on an empty side to insert; use an empty hand on that side to retrieve it. The wide Brandy and Carignan bottles use the center position and occupy the cabinet alone.",
          "This cabinet has no redstone ejection. Breaking it drops the cabinet and all bottles. See this entry’s Recipes section."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "minecraft:glass_pane",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:glass_bar_cabinet"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "minecraft:black_stained_glass_pane",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:glass_bar_cabinet"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "minecraft:blue_stained_glass_pane",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:glass_bar_cabinet"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "minecraft:brown_stained_glass_pane",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:glass_bar_cabinet"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "minecraft:cyan_stained_glass_pane",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:glass_bar_cabinet"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "minecraft:gray_stained_glass_pane",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:glass_bar_cabinet"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "minecraft:green_stained_glass_pane",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:glass_bar_cabinet"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "minecraft:light_blue_stained_glass_pane",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:glass_bar_cabinet"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "minecraft:light_gray_stained_glass_pane",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:glass_bar_cabinet"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "minecraft:lime_stained_glass_pane",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:glass_bar_cabinet"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "minecraft:magenta_stained_glass_pane",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:glass_bar_cabinet"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "minecraft:orange_stained_glass_pane",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:glass_bar_cabinet"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "minecraft:pink_stained_glass_pane",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:glass_bar_cabinet"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "minecraft:purple_stained_glass_pane",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:glass_bar_cabinet"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "minecraft:red_stained_glass_pane",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:glass_bar_cabinet"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "minecraft:white_stained_glass_pane",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:glass_bar_cabinet"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "minecraft:yellow_stained_glass_pane",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine",
            "kaleidoscope_tavern:grapevine"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:glass_bar_cabinet"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:ysbb_painting",
      "category": "art",
      "icon": "textures/kt_derived/a17/icon_tartaric_acid_painting",
      "kinds": [],
      "mechanics": [
        "畫作可對牆面、地面或天花板放置，朝向依放置面與玩家朝向決定；破壞畫作會回收原畫作物品。各畫作的合成材料列在個別條目的「配方」欄。",
        "選取此畫作並對牆面、地面或天花板使用以懸掛；方向依放置面與玩家朝向決定。破壞畫作可取回同一畫作物品，合成材料列於「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "画作可对墙面、地面或天花板放置，朝向依放置面与玩家朝向决定；破坏画作会回收原画作物品。各画作的合成材料列在个别条目的“配方”栏。",
          "选取此画作并对墙面、地面或天花板使用以悬挂；方向依放置面与玩家朝向决定。破坏画作可取回同一画作物品，合成材料列于“配方”栏。"
        ],
        "zh_TW": [
          "畫作可對牆面、地面或天花板放置，朝向依放置面與玩家朝向決定；破壞畫作會回收原畫作物品。各畫作的合成材料列在個別條目的「配方」欄。",
          "選取此畫作並對牆面、地面或天花板使用以懸掛；方向依放置面與玩家朝向決定。破壞畫作可取回同一畫作物品，合成材料列於「配方」欄。"
        ],
        "en_US": [
          "Paintings can be placed on walls, floors, or ceilings; orientation follows the clicked face and player direction. Breaking a painting returns that specific painting item. Each painting’s ingredients appear in its own Recipes section.",
          "Use this painting on a wall, floor, or ceiling to place it; orientation follows the clicked face and player direction. Breaking it returns the same painting item. See Recipes for ingredients."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:item_frame",
            "minecraft:lime_dye"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:ysbb_painting"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:tartaric_acid_painting",
      "category": "art",
      "icon": "textures/kt_derived/a17/icon_tartaric_acid_painting",
      "kinds": [],
      "mechanics": [
        "畫作可對牆面、地面或天花板放置，朝向依放置面與玩家朝向決定；破壞畫作會回收原畫作物品。各畫作的合成材料列在個別條目的「配方」欄。",
        "選取此畫作並對牆面、地面或天花板使用以懸掛；方向依放置面與玩家朝向決定。破壞畫作可取回同一畫作物品，合成材料列於「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "画作可对墙面、地面或天花板放置，朝向依放置面与玩家朝向决定；破坏画作会回收原画作物品。各画作的合成材料列在个别条目的“配方”栏。",
          "选取此画作并对墙面、地面或天花板使用以悬挂；方向依放置面与玩家朝向决定。破坏画作可取回同一画作物品，合成材料列于“配方”栏。"
        ],
        "zh_TW": [
          "畫作可對牆面、地面或天花板放置，朝向依放置面與玩家朝向決定；破壞畫作會回收原畫作物品。各畫作的合成材料列在個別條目的「配方」欄。",
          "選取此畫作並對牆面、地面或天花板使用以懸掛；方向依放置面與玩家朝向決定。破壞畫作可取回同一畫作物品，合成材料列於「配方」欄。"
        ],
        "en_US": [
          "Paintings can be placed on walls, floors, or ceilings; orientation follows the clicked face and player direction. Breaking a painting returns that specific painting item. Each painting’s ingredients appear in its own Recipes section.",
          "Use this painting on a wall, floor, or ceiling to place it; orientation follows the clicked face and player direction. Breaking it returns the same painting item. See Recipes for ingredients."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:item_frame",
            "minecraft:light_blue_dye"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:tartaric_acid_painting"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:cr019_painting",
      "category": "art",
      "icon": "textures/kt_derived/a17/icon_tartaric_acid_painting",
      "kinds": [],
      "mechanics": [
        "畫作可對牆面、地面或天花板放置，朝向依放置面與玩家朝向決定；破壞畫作會回收原畫作物品。各畫作的合成材料列在個別條目的「配方」欄。",
        "選取此畫作並對牆面、地面或天花板使用以懸掛；方向依放置面與玩家朝向決定。破壞畫作可取回同一畫作物品，合成材料列於「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "画作可对墙面、地面或天花板放置，朝向依放置面与玩家朝向决定；破坏画作会回收原画作物品。各画作的合成材料列在个别条目的“配方”栏。",
          "选取此画作并对墙面、地面或天花板使用以悬挂；方向依放置面与玩家朝向决定。破坏画作可取回同一画作物品，合成材料列于“配方”栏。"
        ],
        "zh_TW": [
          "畫作可對牆面、地面或天花板放置，朝向依放置面與玩家朝向決定；破壞畫作會回收原畫作物品。各畫作的合成材料列在個別條目的「配方」欄。",
          "選取此畫作並對牆面、地面或天花板使用以懸掛；方向依放置面與玩家朝向決定。破壞畫作可取回同一畫作物品，合成材料列於「配方」欄。"
        ],
        "en_US": [
          "Paintings can be placed on walls, floors, or ceilings; orientation follows the clicked face and player direction. Breaking a painting returns that specific painting item. Each painting’s ingredients appear in its own Recipes section.",
          "Use this painting on a wall, floor, or ceiling to place it; orientation follows the clicked face and player direction. Breaking it returns the same painting item. See Recipes for ingredients."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:item_frame",
            "minecraft:red_dye"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:cr019_painting"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:unknown_painting",
      "category": "art",
      "icon": "textures/kt_derived/a17/icon_tartaric_acid_painting",
      "kinds": [],
      "mechanics": [
        "畫作可對牆面、地面或天花板放置，朝向依放置面與玩家朝向決定；破壞畫作會回收原畫作物品。各畫作的合成材料列在個別條目的「配方」欄。",
        "選取此畫作並對牆面、地面或天花板使用以懸掛；方向依放置面與玩家朝向決定。破壞畫作可取回同一畫作物品，合成材料列於「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "画作可对墙面、地面或天花板放置，朝向依放置面与玩家朝向决定；破坏画作会回收原画作物品。各画作的合成材料列在个别条目的“配方”栏。",
          "选取此画作并对墙面、地面或天花板使用以悬挂；方向依放置面与玩家朝向决定。破坏画作可取回同一画作物品，合成材料列于“配方”栏。"
        ],
        "zh_TW": [
          "畫作可對牆面、地面或天花板放置，朝向依放置面與玩家朝向決定；破壞畫作會回收原畫作物品。各畫作的合成材料列在個別條目的「配方」欄。",
          "選取此畫作並對牆面、地面或天花板使用以懸掛；方向依放置面與玩家朝向決定。破壞畫作可取回同一畫作物品，合成材料列於「配方」欄。"
        ],
        "en_US": [
          "Paintings can be placed on walls, floors, or ceilings; orientation follows the clicked face and player direction. Breaking a painting returns that specific painting item. Each painting’s ingredients appear in its own Recipes section.",
          "Use this painting on a wall, floor, or ceiling to place it; orientation follows the clicked face and player direction. Breaking it returns the same painting item. See Recipes for ingredients."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:item_frame",
            "minecraft:yellow_dye"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:unknown_painting"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:master_marisa_painting",
      "category": "art",
      "icon": "textures/kt_derived/a17/icon_tartaric_acid_painting",
      "kinds": [],
      "mechanics": [
        "畫作可對牆面、地面或天花板放置，朝向依放置面與玩家朝向決定；破壞畫作會回收原畫作物品。各畫作的合成材料列在個別條目的「配方」欄。",
        "選取此畫作並對牆面、地面或天花板使用以懸掛；方向依放置面與玩家朝向決定。破壞畫作可取回同一畫作物品，合成材料列於「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "画作可对墙面、地面或天花板放置，朝向依放置面与玩家朝向决定；破坏画作会回收原画作物品。各画作的合成材料列在个别条目的“配方”栏。",
          "选取此画作并对墙面、地面或天花板使用以悬挂；方向依放置面与玩家朝向决定。破坏画作可取回同一画作物品，合成材料列于“配方”栏。"
        ],
        "zh_TW": [
          "畫作可對牆面、地面或天花板放置，朝向依放置面與玩家朝向決定；破壞畫作會回收原畫作物品。各畫作的合成材料列在個別條目的「配方」欄。",
          "選取此畫作並對牆面、地面或天花板使用以懸掛；方向依放置面與玩家朝向決定。破壞畫作可取回同一畫作物品，合成材料列於「配方」欄。"
        ],
        "en_US": [
          "Paintings can be placed on walls, floors, or ceilings; orientation follows the clicked face and player direction. Breaking a painting returns that specific painting item. Each painting’s ingredients appear in its own Recipes section.",
          "Use this painting on a wall, floor, or ceiling to place it; orientation follows the clicked face and player direction. Breaking it returns the same painting item. See Recipes for ingredients."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:item_frame",
            "minecraft:purple_dye"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:master_marisa_painting"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:son_of_man_painting",
      "category": "art",
      "icon": "textures/kt_derived/a17/icon_tartaric_acid_painting",
      "kinds": [],
      "mechanics": [
        "畫作可對牆面、地面或天花板放置，朝向依放置面與玩家朝向決定；破壞畫作會回收原畫作物品。各畫作的合成材料列在個別條目的「配方」欄。",
        "選取此畫作並對牆面、地面或天花板使用以懸掛；方向依放置面與玩家朝向決定。破壞畫作可取回同一畫作物品，合成材料列於「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "画作可对墙面、地面或天花板放置，朝向依放置面与玩家朝向决定；破坏画作会回收原画作物品。各画作的合成材料列在个别条目的“配方”栏。",
          "选取此画作并对墙面、地面或天花板使用以悬挂；方向依放置面与玩家朝向决定。破坏画作可取回同一画作物品，合成材料列于“配方”栏。"
        ],
        "zh_TW": [
          "畫作可對牆面、地面或天花板放置，朝向依放置面與玩家朝向決定；破壞畫作會回收原畫作物品。各畫作的合成材料列在個別條目的「配方」欄。",
          "選取此畫作並對牆面、地面或天花板使用以懸掛；方向依放置面與玩家朝向決定。破壞畫作可取回同一畫作物品，合成材料列於「配方」欄。"
        ],
        "en_US": [
          "Paintings can be placed on walls, floors, or ceilings; orientation follows the clicked face and player direction. Breaking a painting returns that specific painting item. Each painting’s ingredients appear in its own Recipes section.",
          "Use this painting on a wall, floor, or ceiling to place it; orientation follows the clicked face and player direction. Breaking it returns the same painting item. See Recipes for ingredients."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:item_frame",
            "minecraft:apple"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:son_of_man_painting"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:david_painting",
      "category": "art",
      "icon": "textures/kt_derived/a17/icon_tartaric_acid_painting",
      "kinds": [],
      "mechanics": [
        "畫作可對牆面、地面或天花板放置，朝向依放置面與玩家朝向決定；破壞畫作會回收原畫作物品。各畫作的合成材料列在個別條目的「配方」欄。",
        "選取此畫作並對牆面、地面或天花板使用以懸掛；方向依放置面與玩家朝向決定。破壞畫作可取回同一畫作物品，合成材料列於「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "画作可对墙面、地面或天花板放置，朝向依放置面与玩家朝向决定；破坏画作会回收原画作物品。各画作的合成材料列在个别条目的“配方”栏。",
          "选取此画作并对墙面、地面或天花板使用以悬挂；方向依放置面与玩家朝向决定。破坏画作可取回同一画作物品，合成材料列于“配方”栏。"
        ],
        "zh_TW": [
          "畫作可對牆面、地面或天花板放置，朝向依放置面與玩家朝向決定；破壞畫作會回收原畫作物品。各畫作的合成材料列在個別條目的「配方」欄。",
          "選取此畫作並對牆面、地面或天花板使用以懸掛；方向依放置面與玩家朝向決定。破壞畫作可取回同一畫作物品，合成材料列於「配方」欄。"
        ],
        "en_US": [
          "Paintings can be placed on walls, floors, or ceilings; orientation follows the clicked face and player direction. Breaking a painting returns that specific painting item. Each painting’s ingredients appear in its own Recipes section.",
          "Use this painting on a wall, floor, or ceiling to place it; orientation follows the clicked face and player direction. Breaking it returns the same painting item. See Recipes for ingredients."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:item_frame",
            "minecraft:white_dye"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:david_painting"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:girl_with_pearl_earring_painting",
      "category": "art",
      "icon": "textures/kt_derived/a17/icon_tartaric_acid_painting",
      "kinds": [],
      "mechanics": [
        "畫作可對牆面、地面或天花板放置，朝向依放置面與玩家朝向決定；破壞畫作會回收原畫作物品。各畫作的合成材料列在個別條目的「配方」欄。",
        "選取此畫作並對牆面、地面或天花板使用以懸掛；方向依放置面與玩家朝向決定。破壞畫作可取回同一畫作物品，合成材料列於「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "画作可对墙面、地面或天花板放置，朝向依放置面与玩家朝向决定；破坏画作会回收原画作物品。各画作的合成材料列在个别条目的“配方”栏。",
          "选取此画作并对墙面、地面或天花板使用以悬挂；方向依放置面与玩家朝向决定。破坏画作可取回同一画作物品，合成材料列于“配方”栏。"
        ],
        "zh_TW": [
          "畫作可對牆面、地面或天花板放置，朝向依放置面與玩家朝向決定；破壞畫作會回收原畫作物品。各畫作的合成材料列在個別條目的「配方」欄。",
          "選取此畫作並對牆面、地面或天花板使用以懸掛；方向依放置面與玩家朝向決定。破壞畫作可取回同一畫作物品，合成材料列於「配方」欄。"
        ],
        "en_US": [
          "Paintings can be placed on walls, floors, or ceilings; orientation follows the clicked face and player direction. Breaking a painting returns that specific painting item. Each painting’s ingredients appear in its own Recipes section.",
          "Use this painting on a wall, floor, or ceiling to place it; orientation follows the clicked face and player direction. Breaking it returns the same painting item. See Recipes for ingredients."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:item_frame",
            "minecraft:ender_pearl"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:girl_with_pearl_earring_painting"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:starry_night_painting",
      "category": "art",
      "icon": "textures/kt_derived/a17/icon_tartaric_acid_painting",
      "kinds": [],
      "mechanics": [
        "畫作可對牆面、地面或天花板放置，朝向依放置面與玩家朝向決定；破壞畫作會回收原畫作物品。各畫作的合成材料列在個別條目的「配方」欄。",
        "選取此畫作並對牆面、地面或天花板使用以懸掛；方向依放置面與玩家朝向決定。破壞畫作可取回同一畫作物品，合成材料列於「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "画作可对墙面、地面或天花板放置，朝向依放置面与玩家朝向决定；破坏画作会回收原画作物品。各画作的合成材料列在个别条目的“配方”栏。",
          "选取此画作并对墙面、地面或天花板使用以悬挂；方向依放置面与玩家朝向决定。破坏画作可取回同一画作物品，合成材料列于“配方”栏。"
        ],
        "zh_TW": [
          "畫作可對牆面、地面或天花板放置，朝向依放置面與玩家朝向決定；破壞畫作會回收原畫作物品。各畫作的合成材料列在個別條目的「配方」欄。",
          "選取此畫作並對牆面、地面或天花板使用以懸掛；方向依放置面與玩家朝向決定。破壞畫作可取回同一畫作物品，合成材料列於「配方」欄。"
        ],
        "en_US": [
          "Paintings can be placed on walls, floors, or ceilings; orientation follows the clicked face and player direction. Breaking a painting returns that specific painting item. Each painting’s ingredients appear in its own Recipes section.",
          "Use this painting on a wall, floor, or ceiling to place it; orientation follows the clicked face and player direction. Breaking it returns the same painting item. See Recipes for ingredients."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:item_frame",
            "minecraft:echo_shard"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:starry_night_painting"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:van_gogh_self_portrait_painting",
      "category": "art",
      "icon": "textures/kt_derived/a17/icon_tartaric_acid_painting",
      "kinds": [],
      "mechanics": [
        "畫作可對牆面、地面或天花板放置，朝向依放置面與玩家朝向決定；破壞畫作會回收原畫作物品。各畫作的合成材料列在個別條目的「配方」欄。",
        "選取此畫作並對牆面、地面或天花板使用以懸掛；方向依放置面與玩家朝向決定。破壞畫作可取回同一畫作物品，合成材料列於「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "画作可对墙面、地面或天花板放置，朝向依放置面与玩家朝向决定；破坏画作会回收原画作物品。各画作的合成材料列在个别条目的“配方”栏。",
          "选取此画作并对墙面、地面或天花板使用以悬挂；方向依放置面与玩家朝向决定。破坏画作可取回同一画作物品，合成材料列于“配方”栏。"
        ],
        "zh_TW": [
          "畫作可對牆面、地面或天花板放置，朝向依放置面與玩家朝向決定；破壞畫作會回收原畫作物品。各畫作的合成材料列在個別條目的「配方」欄。",
          "選取此畫作並對牆面、地面或天花板使用以懸掛；方向依放置面與玩家朝向決定。破壞畫作可取回同一畫作物品，合成材料列於「配方」欄。"
        ],
        "en_US": [
          "Paintings can be placed on walls, floors, or ceilings; orientation follows the clicked face and player direction. Breaking a painting returns that specific painting item. Each painting’s ingredients appear in its own Recipes section.",
          "Use this painting on a wall, floor, or ceiling to place it; orientation follows the clicked face and player direction. Breaking it returns the same painting item. See Recipes for ingredients."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:item_frame",
            "minecraft:painting"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:van_gogh_self_portrait_painting"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:father_painting",
      "category": "art",
      "icon": "textures/kt_derived/a17/icon_tartaric_acid_painting",
      "kinds": [],
      "mechanics": [
        "畫作可對牆面、地面或天花板放置，朝向依放置面與玩家朝向決定；破壞畫作會回收原畫作物品。各畫作的合成材料列在個別條目的「配方」欄。",
        "選取此畫作並對牆面、地面或天花板使用以懸掛；方向依放置面與玩家朝向決定。破壞畫作可取回同一畫作物品，合成材料列於「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "画作可对墙面、地面或天花板放置，朝向依放置面与玩家朝向决定；破坏画作会回收原画作物品。各画作的合成材料列在个别条目的“配方”栏。",
          "选取此画作并对墙面、地面或天花板使用以悬挂；方向依放置面与玩家朝向决定。破坏画作可取回同一画作物品，合成材料列于“配方”栏。"
        ],
        "zh_TW": [
          "畫作可對牆面、地面或天花板放置，朝向依放置面與玩家朝向決定；破壞畫作會回收原畫作物品。各畫作的合成材料列在個別條目的「配方」欄。",
          "選取此畫作並對牆面、地面或天花板使用以懸掛；方向依放置面與玩家朝向決定。破壞畫作可取回同一畫作物品，合成材料列於「配方」欄。"
        ],
        "en_US": [
          "Paintings can be placed on walls, floors, or ceilings; orientation follows the clicked face and player direction. Breaking a painting returns that specific painting item. Each painting’s ingredients appear in its own Recipes section.",
          "Use this painting on a wall, floor, or ceiling to place it; orientation follows the clicked face and player direction. Breaking it returns the same painting item. See Recipes for ingredients."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:item_frame",
            "minecraft:iron_hoe"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:father_painting"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:great_wave_painting",
      "category": "art",
      "icon": "textures/kt_derived/a17/icon_tartaric_acid_painting",
      "kinds": [],
      "mechanics": [
        "畫作可對牆面、地面或天花板放置，朝向依放置面與玩家朝向決定；破壞畫作會回收原畫作物品。各畫作的合成材料列在個別條目的「配方」欄。",
        "選取此畫作並對牆面、地面或天花板使用以懸掛；方向依放置面與玩家朝向決定。破壞畫作可取回同一畫作物品，合成材料列於「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "画作可对墙面、地面或天花板放置，朝向依放置面与玩家朝向决定；破坏画作会回收原画作物品。各画作的合成材料列在个别条目的“配方”栏。",
          "选取此画作并对墙面、地面或天花板使用以悬挂；方向依放置面与玩家朝向决定。破坏画作可取回同一画作物品，合成材料列于“配方”栏。"
        ],
        "zh_TW": [
          "畫作可對牆面、地面或天花板放置，朝向依放置面與玩家朝向決定；破壞畫作會回收原畫作物品。各畫作的合成材料列在個別條目的「配方」欄。",
          "選取此畫作並對牆面、地面或天花板使用以懸掛；方向依放置面與玩家朝向決定。破壞畫作可取回同一畫作物品，合成材料列於「配方」欄。"
        ],
        "en_US": [
          "Paintings can be placed on walls, floors, or ceilings; orientation follows the clicked face and player direction. Breaking a painting returns that specific painting item. Each painting’s ingredients appear in its own Recipes section.",
          "Use this painting on a wall, floor, or ceiling to place it; orientation follows the clicked face and player direction. Breaking it returns the same painting item. See Recipes for ingredients."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:item_frame",
            "minecraft:bamboo_raft"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:great_wave_painting"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:mona_lisa_painting",
      "category": "art",
      "icon": "textures/kt_derived/a17/icon_tartaric_acid_painting",
      "kinds": [],
      "mechanics": [
        "畫作可對牆面、地面或天花板放置，朝向依放置面與玩家朝向決定；破壞畫作會回收原畫作物品。各畫作的合成材料列在個別條目的「配方」欄。",
        "選取此畫作並對牆面、地面或天花板使用以懸掛；方向依放置面與玩家朝向決定。破壞畫作可取回同一畫作物品，合成材料列於「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "画作可对墙面、地面或天花板放置，朝向依放置面与玩家朝向决定；破坏画作会回收原画作物品。各画作的合成材料列在个别条目的“配方”栏。",
          "选取此画作并对墙面、地面或天花板使用以悬挂；方向依放置面与玩家朝向决定。破坏画作可取回同一画作物品，合成材料列于“配方”栏。"
        ],
        "zh_TW": [
          "畫作可對牆面、地面或天花板放置，朝向依放置面與玩家朝向決定；破壞畫作會回收原畫作物品。各畫作的合成材料列在個別條目的「配方」欄。",
          "選取此畫作並對牆面、地面或天花板使用以懸掛；方向依放置面與玩家朝向決定。破壞畫作可取回同一畫作物品，合成材料列於「配方」欄。"
        ],
        "en_US": [
          "Paintings can be placed on walls, floors, or ceilings; orientation follows the clicked face and player direction. Breaking a painting returns that specific painting item. Each painting’s ingredients appear in its own Recipes section.",
          "Use this painting on a wall, floor, or ceiling to place it; orientation follows the clicked face and player direction. Breaking it returns the same painting item. See Recipes for ingredients."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:item_frame",
            "minecraft:diamond"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:mona_lisa_painting"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:mondrian_painting",
      "category": "art",
      "icon": "textures/kt_derived/a17/icon_tartaric_acid_painting",
      "kinds": [],
      "mechanics": [
        "畫作可對牆面、地面或天花板放置，朝向依放置面與玩家朝向決定；破壞畫作會回收原畫作物品。各畫作的合成材料列在個別條目的「配方」欄。",
        "選取此畫作並對牆面、地面或天花板使用以懸掛；方向依放置面與玩家朝向決定。破壞畫作可取回同一畫作物品，合成材料列於「配方」欄。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "画作可对墙面、地面或天花板放置，朝向依放置面与玩家朝向决定；破坏画作会回收原画作物品。各画作的合成材料列在个别条目的“配方”栏。",
          "选取此画作并对墙面、地面或天花板使用以悬挂；方向依放置面与玩家朝向决定。破坏画作可取回同一画作物品，合成材料列于“配方”栏。"
        ],
        "zh_TW": [
          "畫作可對牆面、地面或天花板放置，朝向依放置面與玩家朝向決定；破壞畫作會回收原畫作物品。各畫作的合成材料列在個別條目的「配方」欄。",
          "選取此畫作並對牆面、地面或天花板使用以懸掛；方向依放置面與玩家朝向決定。破壞畫作可取回同一畫作物品，合成材料列於「配方」欄。"
        ],
        "en_US": [
          "Paintings can be placed on walls, floors, or ceilings; orientation follows the clicked face and player direction. Breaking a painting returns that specific painting item. Each painting’s ingredients appear in its own Recipes section.",
          "Use this painting on a wall, floor, or ceiling to place it; orientation follows the clicked face and player direction. Breaking it returns the same painting item. See Recipes for ingredients."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:blue_dye",
            "minecraft:white_dye",
            "minecraft:item_frame",
            "minecraft:yellow_dye",
            "minecraft:red_dye"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:mondrian_painting"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:sakura_incense",
      "category": "incense",
      "icon": "textures/kaleidoscope_tavern_jar/item/sakura_incense",
      "kinds": [],
      "mechanics": [
        "工作台配方：墨囊八個圍住櫻花樹苗一個，可合成櫻花香薰。放置後空手點擊切換燃起／熄滅；紅石有訊號時燃起，訊號消失即熄滅。",
        "燃起時每 6 秒對周圍 32 格內的亡靈造成 1 點魔法傷害，並持續飄出香薰粒子。此版本不會轉化殭屍村民。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "工作台配方：墨囊八個围住樱花树苗一个，可合成樱花香薰。放置后空手点击切换燃起／熄灭；红石有信号时燃起，信号消失即熄灭。",
          "燃起时每 6 秒对周围 32 格内的亡灵造成 1 点魔法伤害，并持续飘出香薰粒子。此版本不会转化僵尸村民。"
        ],
        "zh_TW": [
          "工作台配方：墨囊八個圍住櫻花樹苗一個，可合成櫻花香薰。放置後空手點擊切換燃起／熄滅；紅石有訊號時燃起，訊號消失即熄滅。",
          "燃起時每 6 秒對周圍 32 格內的亡靈造成 1 點魔法傷害，並持續飄出香薰粒子。此版本不會轉化殭屍村民。"
        ],
        "en_US": [
          "Crafting recipe: surround one cherry sapling with eight ink sacs. Place the incense and use it with an empty hand to light or extinguish it; redstone power lights it and loss of power extinguishes it.",
          "While lit, it deals 1 magic damage to undead within 32 blocks every 6 seconds and emits incense particles. This version does not convert zombie villagers."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:cherry_sapling",
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:ink_sac"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:sakura_incense"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:pine_incense",
      "category": "incense",
      "icon": "textures/kaleidoscope_tavern_jar/item/pine_incense",
      "kinds": [],
      "mechanics": [
        "工作台配方：墨囊八個圍住雲杉樹苗一個，可合成松木香薰。放置後空手點擊切換燃起／熄滅；紅石有訊號時燃起，訊號消失即熄滅。",
        "燃起時每 6 秒對周圍 32 格內的亡靈造成 1 點魔法傷害，並持續飄出松香粒子。此版本不會轉化殭屍村民。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "工作台配方：墨囊八个围住云杉树苗一个，可合成松木香薰。放置后空手点击切换燃起／熄灭；红石有信号时燃起，信号消失即熄灭。",
          "燃起时每 6 秒对周围 32 格内的亡灵造成 1 点魔法伤害，并持续飘出松香粒子。此版本不会转化僵尸村民。"
        ],
        "zh_TW": [
          "工作台配方：墨囊八個圍住雲杉樹苗一個，可合成松木香薰。放置後空手點擊切換燃起／熄滅；紅石有訊號時燃起，訊號消失即熄滅。",
          "燃起時每 6 秒對周圍 32 格內的亡靈造成 1 點魔法傷害，並持續飄出松香粒子。此版本不會轉化殭屍村民。"
        ],
        "en_US": [
          "Crafting recipe: surround one spruce sapling with eight ink sacs. Use the placed incense with an empty hand to light or extinguish it; redstone power lights it and loss of power extinguishes it.",
          "When lit, it deals 1 magic damage to undead within 32 blocks every 6 seconds and emits pine incense particles. Zombie villager conversion is not implemented in this version."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:spruce_sapling",
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:ink_sac"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:pine_incense"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:ginkgo_incense",
      "category": "incense",
      "icon": "textures/kaleidoscope_tavern_jar/item/ginkgo_incense",
      "kinds": [],
      "mechanics": [
        "工作台配方：墨囊八個圍住黃色染料一個，可合成銀杏香薰。放置後空手點擊切換燃起／熄滅；紅石有訊號時燃起，訊號消失即熄滅。",
        "燃起時每 6 秒對周圍 32 格內的亡靈造成 1 點魔法傷害並持續飄出銀杏粒子；殭屍村民轉化目前未提供。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "工作台配方：墨囊八个围住黄色染料一个，可合成银杏香薰。放置后空手点击切换燃起／熄灭；红石有信号时燃起，信号消失即熄灭。",
          "燃起时每 6 秒对周围 32 格内的亡灵造成 1 点魔法伤害并持续飘出银杏粒子；僵尸村民转化目前未提供。"
        ],
        "zh_TW": [
          "工作台配方：墨囊八個圍住黃色染料一個，可合成銀杏香薰。放置後空手點擊切換燃起／熄滅；紅石有訊號時燃起，訊號消失即熄滅。",
          "燃起時每 6 秒對周圍 32 格內的亡靈造成 1 點魔法傷害並持續飄出銀杏粒子；殭屍村民轉化目前未提供。"
        ],
        "en_US": [
          "Crafting recipe: surround one yellow dye with eight ink sacs. Use the placed incense with an empty hand to toggle it; redstone power lights it and loss of power extinguishes it.",
          "Lit incense deals 1 magic damage to undead within 32 blocks every 6 seconds and emits ginkgo particles. Zombie villager conversion is not available."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:yellow_dye",
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:ink_sac"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:ginkgo_incense"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:spore_incense",
      "category": "incense",
      "icon": "textures/kaleidoscope_tavern_jar/item/spore_incense",
      "kinds": [],
      "mechanics": [
        "工作台配方：墨囊八個圍住孢子花一個，可合成孢子香薰。放置後空手點擊切換燃起／熄滅；紅石有訊號時燃起，訊號消失即熄滅。",
        "燃起時每 6 秒對周圍 32 格內的亡靈造成 1 點魔法傷害並飄出孢子粒子；此版本不會轉化殭屍村民。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "工作台配方：墨囊八个围住孢子花一个，可合成孢子香薰。放置后空手点击切换燃起／熄灭；红石有信号时燃起，信号消失即熄灭。",
          "燃起时每 6 秒对周围 32 格内的亡灵造成 1 点魔法伤害并飘出孢子粒子；此版本不会转化僵尸村民。"
        ],
        "zh_TW": [
          "工作台配方：墨囊八個圍住孢子花一個，可合成孢子香薰。放置後空手點擊切換燃起／熄滅；紅石有訊號時燃起，訊號消失即熄滅。",
          "燃起時每 6 秒對周圍 32 格內的亡靈造成 1 點魔法傷害並飄出孢子粒子；此版本不會轉化殭屍村民。"
        ],
        "en_US": [
          "Crafting recipe: surround one spore blossom with eight ink sacs. Use the placed incense with an empty hand to toggle it; redstone power lights it and loss of power extinguishes it.",
          "Lit incense deals 1 magic damage to undead within 32 blocks every 6 seconds and emits spore particles. This version does not convert zombie villagers."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:spore_blossom",
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:ink_sac"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:spore_incense"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:catnip_incense",
      "category": "incense",
      "icon": "textures/kaleidoscope_tavern_jar/item/catnip_incense",
      "kinds": [],
      "mechanics": [
        "工作台配方：墨囊八個圍住繡球花（Allium）一個，可合成荊芥香薰。放置後空手點擊切換燃起／熄滅；紅石有訊號時燃起，訊號消失即熄滅。",
        "燃起時每 6 秒對周圍 32 格內的亡靈造成 1 點魔法傷害並持續飄出荊芥香薰粒子；殭屍村民不會轉化。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "工作台配方：墨囊八个围住绒球葱（Allium）一个，可合成荆芥香薰。放置后空手点击切换燃起／熄灭；红石有信号时燃起，信号消失即熄灭。",
          "燃起时每 6 秒对周围 32 格内的亡灵造成 1 点魔法伤害并持续飘出荆芥香薰粒子；僵尸村民不会转化。"
        ],
        "zh_TW": [
          "工作台配方：墨囊八個圍住繡球花（Allium）一個，可合成荊芥香薰。放置後空手點擊切換燃起／熄滅；紅石有訊號時燃起，訊號消失即熄滅。",
          "燃起時每 6 秒對周圍 32 格內的亡靈造成 1 點魔法傷害並持續飄出荊芥香薰粒子；殭屍村民不會轉化。"
        ],
        "en_US": [
          "Crafting recipe: surround one allium with eight ink sacs. Use the placed incense with an empty hand to toggle it; redstone power lights it and loss of power extinguishes it.",
          "When lit, it deals 1 magic damage to undead within 32 blocks every 6 seconds and emits catnip incense particles. It does not convert zombie villagers."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:allium",
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:ink_sac"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:catnip_incense"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:snow_incense",
      "category": "incense",
      "icon": "textures/kaleidoscope_tavern_jar/item/snow_incense",
      "kinds": [],
      "mechanics": [
        "工作台配方：墨囊八個圍住雪球一個，可合成雪香薰。放置後空手點擊切換燃起／熄滅；紅石有訊號時燃起，訊號消失即熄滅。",
        "燃起時每 6 秒對周圍 32 格內的亡靈造成 1 點魔法傷害並飄出雪香薰粒子；殭屍村民轉化目前未提供。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "工作台配方：墨囊八个围住雪球一个，可合成雪香薰。放置后空手点击切换燃起／熄灭；红石有信号时燃起，信号消失即熄灭。",
          "燃起时每 6 秒对周围 32 格内的亡灵造成 1 点魔法伤害并飘出雪香薰粒子；僵尸村民转化目前未提供。"
        ],
        "zh_TW": [
          "工作台配方：墨囊八個圍住雪球一個，可合成雪香薰。放置後空手點擊切換燃起／熄滅；紅石有訊號時燃起，訊號消失即熄滅。",
          "燃起時每 6 秒對周圍 32 格內的亡靈造成 1 點魔法傷害並飄出雪香薰粒子；殭屍村民轉化目前未提供。"
        ],
        "en_US": [
          "Crafting recipe: surround one snowball with eight ink sacs. Use the placed incense with an empty hand to toggle it; redstone power lights it and loss of power extinguishes it.",
          "When lit, it deals 1 magic damage to undead within 32 blocks every 6 seconds and emits snow incense particles. Zombie villager conversion is not implemented."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:snowball",
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:ink_sac"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:snow_incense"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:butterfly_incense",
      "category": "incense",
      "icon": "textures/kaleidoscope_tavern_jar/item/butterfly_incense",
      "kinds": [],
      "mechanics": [
        "工作台配方：墨囊八個圍住瓶子草一株，可合成蝴蝶香薰。放置後空手點擊切換燃起／熄滅；紅石有訊號時燃起，訊號消失即熄滅。",
        "燃起時每 6 秒對周圍 32 格內的亡靈造成 1 點魔法傷害並持續飄出蝴蝶粒子；此版本不轉化殭屍村民。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "工作台配方：墨囊八个围住瓶子草一株，可合成蝴蝶香薰。放置后空手点击切换燃起／熄灭；红石有信号时燃起，信号消失即熄灭。",
          "燃起时每 6 秒对周围 32 格内的亡灵造成 1 点魔法伤害并持续飘出蝴蝶粒子；此版本不转化僵尸村民。"
        ],
        "zh_TW": [
          "工作台配方：墨囊八個圍住瓶子草一株，可合成蝴蝶香薰。放置後空手點擊切換燃起／熄滅；紅石有訊號時燃起，訊號消失即熄滅。",
          "燃起時每 6 秒對周圍 32 格內的亡靈造成 1 點魔法傷害並持續飄出蝴蝶粒子；此版本不轉化殭屍村民。"
        ],
        "en_US": [
          "Crafting recipe: surround one pitcher plant with eight ink sacs. Use the placed incense with an empty hand to toggle it; redstone power lights it and loss of power extinguishes it.",
          "Lit incense deals 1 magic damage to undead within 32 blocks every 6 seconds and emits butterfly particles. It does not convert zombie villagers."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:pitcher_plant",
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:ink_sac"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:butterfly_incense"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:firefly_incense",
      "category": "incense",
      "icon": "textures/kaleidoscope_tavern_jar/item/firefly_incense",
      "kinds": [],
      "mechanics": [
        "工作台配方：墨囊八個圍住螢石粉一份，可合成螢火蟲香薰。放置後空手點擊切換燃起／熄滅；紅石有訊號時燃起，訊號消失即熄滅。",
        "燃起時每 6 秒對周圍 32 格內的亡靈造成 1 點魔法傷害並持續飄出螢火粒子；殭屍村民轉化目前未提供。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "工作台配方：墨囊八个围住荧石粉一份，可合成萤火虫香薰。放置后空手点击切换燃起／熄灭；红石有信号时燃起，信号消失即熄灭。",
          "燃起时每 6 秒对周围 32 格内的亡灵造成 1 点魔法伤害并持续飘出萤火粒子；僵尸村民转化目前未提供。"
        ],
        "zh_TW": [
          "工作台配方：墨囊八個圍住螢石粉一份，可合成螢火蟲香薰。放置後空手點擊切換燃起／熄滅；紅石有訊號時燃起，訊號消失即熄滅。",
          "燃起時每 6 秒對周圍 32 格內的亡靈造成 1 點魔法傷害並持續飄出螢火粒子；殭屍村民轉化目前未提供。"
        ],
        "en_US": [
          "Crafting recipe: surround one glowstone dust with eight ink sacs. Use the placed incense with an empty hand to toggle it; redstone power lights it and loss of power extinguishes it.",
          "Lit incense deals 1 magic damage to undead within 32 blocks every 6 seconds and emits firefly particles. Zombie villager conversion is not available."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:glowstone_dust",
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:ink_sac"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:firefly_incense"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:barrel",
      "category": "gear",
      "icon": "textures/kaleidoscope_tavern_jar/item/barrel",
      "kinds": [],
      "mechanics": [
        "以果汁桶將單一種類果汁注入酒桶，最多四桶（4,000 mB）；加入酒方原料後蓋上桶蓋，以空手開關熟成。不同材料槽建議放相同數量；開啟／熟成會消耗所有原料，多出的材料也不會留下。品質最高為 6。拆除酒桶任何部分都會拆下整組；先取出酒液與成品，否則液體會流失。",
        "酒桶核心與桶身的完整結構、裝液、熟成及拆除規則見「酒桶與熟成」條目。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "用果汁桶向酒桶注入单一种类果汁，最多四桶（4,000 mB）；加入配方原料后盖上桶盖，空手开关熟成。不同材料槽建议放相同数量；开始熟成会消耗全部原料，多出的材料也不会留下。最高品质为 6。拆除酒桶任一部分都会拆下整组；先取出酒液与成品，否则液体会流失。",
          "酒桶核心与桶身的完整结构、装液、熟成及拆除规则见“酒桶与熟成”条目。"
        ],
        "zh_TW": [
          "以果汁桶將單一種類果汁注入酒桶，最多四桶（4,000 mB）；加入酒方原料後蓋上桶蓋，以空手開關熟成。不同材料槽建議放相同數量；開啟／熟成會消耗所有原料，多出的材料也不會留下。品質最高為 6。拆除酒桶任何部分都會拆下整組；先取出酒液與成品，否則液體會流失。",
          "酒桶核心與桶身的完整結構、裝液、熟成及拆除規則見「酒桶與熟成」條目。"
        ],
        "en_US": [
          "Use a juice bucket to fill the barrel with one kind of juice, up to four buckets (4,000 mB). Add the recipe ingredients and use the lid with an empty hand to start or stop aging. Keep ingredient slot counts equal where possible: starting aging consumes all loaded ingredients, including extras. Quality caps at 6. Breaking any barrel part dismantles the whole barrel; remove the liquid and finished drink first or the liquid is lost.",
          "See “Barrels & aging” for the complete barrel structure, filling, aging, and dismantling rules."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:barrel",
            "minecraft:barrel",
            "minecraft:barrel",
            "minecraft:barrel",
            "minecraft:barrel",
            "minecraft:barrel",
            "minecraft:barrel",
            "minecraft:barrel",
            "minecraft:barrel"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:barrel"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:tap",
      "category": "serve",
      "icon": "textures/kaleidoscope_tavern_jar/item/tap",
      "kinds": [],
      "mechanics": [
        "確認酒桶已完成熟成且酒嘴裝在桶身；酒嘴只會在有可裝瓶的成品時出酒。",
        "把一個空酒瓶方塊放在酒嘴正下方，再空手點酒嘴開啟。等待 30 tick（約 1.5 秒），下方空瓶會變成該桶目前品質的成酒；取走酒瓶即可。",
        "酒嘴開啟時可再空手點擊關閉；紅石上升沿也可開啟。拆酒桶前先取走液體、配料和成酒，拆任一桶身部件都會拆掉整桶，桶內液體不會保留。",
        "酒嘴取酒流程見「酒嘴與取酒」條目：空酒瓶方塊須放在酒嘴正下方，空手開啟後等待 30 tick。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "确认酒桶已完成熟成且酒嘴装在桶身；酒嘴只会在有可装瓶的成品时出酒。",
          "把一个空酒瓶方块放在酒嘴正下方，再空手点酒嘴开启。等待 30 tick（约 1.5 秒），下方空瓶会变成该桶当前品质的成酒；取走酒瓶即可。",
          "酒嘴开启时可再空手点击关闭；红石上升沿也可开启。拆酒桶前先取走液体、配料和成酒，拆任一桶身部件都会拆掉整桶，桶内液体不会保留。",
          "酒嘴取酒流程见“酒嘴与取酒”条目：空酒瓶方块须放在酒嘴正下方，空手开启后等待 30 tick。"
        ],
        "zh_TW": [
          "確認酒桶已完成熟成且酒嘴裝在桶身；酒嘴只會在有可裝瓶的成品時出酒。",
          "把一個空酒瓶方塊放在酒嘴正下方，再空手點酒嘴開啟。等待 30 tick（約 1.5 秒），下方空瓶會變成該桶目前品質的成酒；取走酒瓶即可。",
          "酒嘴開啟時可再空手點擊關閉；紅石上升沿也可開啟。拆酒桶前先取走液體、配料和成酒，拆任一桶身部件都會拆掉整桶，桶內液體不會保留。",
          "酒嘴取酒流程見「酒嘴與取酒」條目：空酒瓶方塊須放在酒嘴正下方，空手開啟後等待 30 tick。"
        ],
        "en_US": [
          "Install the tap on a completed barrel; it dispenses only when a finished drink is available.",
          "Place an empty bottle block directly below the tap, then use the tap with an empty hand. After 30 ticks (about 1.5 seconds), the bottle becomes the drink at the barrel’s current quality; take the filled bottle.",
          "Use the tap again with an empty hand to close it; a redstone rising edge can open it too. Empty the barrel before dismantling: breaking any barrel part dismantles the whole barrel and its liquid is lost.",
          "See “Tap & bottling”: place an empty bottle block directly below the tap, use it with an empty hand, and wait 30 ticks."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:lever",
            "minecraft:hopper"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:tap"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:pressing_tub",
      "category": "press",
      "icon": "textures/kaleidoscope_tavern_jar/item/grape_bucket",
      "kinds": [],
      "mechanics": [
        "果盆只有一個原料槽，可投入同種物品堆（配方外物品也能先放入）；只接受六種配方水果榨汁。玩家或其他活物落在盆上，每次成功踩踏壓榨 125 mB，八次取得一桶。",
        "錯誤物品踩踏時彈出；果汁滿 1,000 mB 後不再消耗水果。破壞果盆會掉落果盆及槽內原料，剩餘果汁不保留。",
        "果盆有一個原料槽；水果種類、踩踏、錯料彈出、滿液與拆除規則見「壓榨果汁」條目。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "果盆只有一个原料槽，可投入同种物品堆（配方外物品也能先放入）；只接受六种配方水果榨汁。玩家或其他活物落在盆上，每次成功踩踏压榨 125 mB，八次取得一桶。",
          "错误物品踩踏时弹出；果汁满 1,000 mB 后不再消耗水果。破坏果盆会掉落果盆及槽内原料，剩余果汁不保留。",
          "果盆有一个原料槽；水果种类、踩踏、错料弹出、满液与拆除规则见“压榨果汁”条目。"
        ],
        "zh_TW": [
          "果盆只有一個原料槽，可投入同種物品堆（配方外物品也能先放入）；只接受六種配方水果榨汁。玩家或其他活物落在盆上，每次成功踩踏壓榨 125 mB，八次取得一桶。",
          "錯誤物品踩踏時彈出；果汁滿 1,000 mB 後不再消耗水果。破壞果盆會掉落果盆及槽內原料，剩餘果汁不保留。",
          "果盆有一個原料槽；水果種類、踩踏、錯料彈出、滿液與拆除規則見「壓榨果汁」條目。"
        ],
        "en_US": [
          "The fruit basin has one slot and accepts a stack of any one ordinary item; recipe fruits press into juice, while other items are ejected when pressed. A player or any living entity landing on it presses 125 mB per successful step; eight presses fill a bucket.",
          "At 1,000 mB the basin stops consuming fruit. Breaking it drops the basin and stored ingredients, but loses remaining juice.",
          "The fruit basin has one ingredient slot. See “Pressing juice” for fruit types, pressing, rejected items, full capacity, and dismantling."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:barrel"
          ],
          "count": 2,
          "time": 0,
          "result": "kaleidoscope_tavern:pressing_tub"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:shaker",
      "category": "mix_tools",
      "icon": "textures/kaleidoscope_tavern_jar/item/shaker",
      "kinds": [],
      "mechanics": [
        "把雪克杯放在方塊表面，依個別雞尾酒條目依序將三種材料放進空槽；作為基酒的酒款須達品質 4。",
        "空手拿起裝料的雪克杯，按住使用開始搖酒，依提示在正確時機放開；其他時機會調出特調或神秘雞尾酒。",
        "放置空玻璃杯後，手持雪克杯對空杯倒入成品；潛行使用可取消搖酒。",
        "雪克杯調酒順序與每款雞尾酒配方見「雞尾酒配方」分條。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "把雪克杯放在方块表面，按各鸡尾酒条目所列顺序将三种材料放入空槽；作为基酒的酒款须达品质 4。",
          "空手拿起装料的雪克杯，按住使用开始摇酒，依提示在正确时机松开；其他时机会调出特调或神秘鸡尾酒。",
          "放置空玻璃杯后，手持雪克杯对空杯倒入成品；潜行使用可取消摇酒。",
          "雪克杯调酒顺序与每款鸡尾酒配方见“鸡尾酒配方”分条。"
        ],
        "zh_TW": [
          "把雪克杯放在方塊表面，依個別雞尾酒條目依序將三種材料放進空槽；作為基酒的酒款須達品質 4。",
          "空手拿起裝料的雪克杯，按住使用開始搖酒，依提示在正確時機放開；其他時機會調出特調或神秘雞尾酒。",
          "放置空玻璃杯後，手持雪克杯對空杯倒入成品；潛行使用可取消搖酒。",
          "雪克杯調酒順序與每款雞尾酒配方見「雞尾酒配方」分條。"
        ],
        "en_US": [
          "Place the shaker on a block and add the three ingredients in the order shown by each cocktail entry. Tavern drinks used as a base must be quality 4 or higher.",
          "Use an empty hand to pick up the loaded shaker, hold use to shake, and release at the prompt for the named cocktail; other timings produce signature or mystery cocktails.",
          "Place an empty glass, then use the held shaker on it to pour. Sneak-use cancels a shake.",
          "See the individual “Cocktail recipes” entries for shaker order and each drink’s ingredients."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:iron_ingot",
            "minecraft:bucket"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:shaker"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:empty_glassware",
      "category": "serve",
      "icon": "textures/kaleidoscope_tavern_jar/item/empty_glassware",
      "kinds": [],
      "mechanics": [
        "空玻璃器皿可用於展示；使用玻璃器皿架存放與取回方式見該架條目。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "空玻璃器皿可用于展示；使用玻璃器皿架存放与取回方式见该架条目。"
        ],
        "zh_TW": [
          "空玻璃器皿可用於展示；使用玻璃器皿架存放與取回方式見該架條目。"
        ],
        "en_US": [
          "Empty glassware can be displayed; see the glassware holder entry for storage and retrieval."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:glass_pane",
            "minecraft:glass_pane",
            "minecraft:glass_pane"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:empty_glassware"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:stepladder",
      "category": "ladder",
      "icon": "textures/kaleidoscope_tavern_jar/item/stepladder",
      "kinds": [],
      "mechanics": [
        "工作台用六個原版梯子合成一座人字梯；放置時會一次架起上下兩格，方向隨玩家朝向。",
        "靠近梯身時按跳躍可向上攀、按潛行可向下攀；破壞任一半會連動拆除整座並掉落一座人字梯。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "工作台用六个原版梯子合成一座人字梯；放置时会一次架起上下两格，方向随玩家朝向。",
          "靠近梯身时按跳跃可向上攀、按潜行可向下攀；破坏任一半会联动拆除整座并掉落一座人字梯。"
        ],
        "zh_TW": [
          "工作台用六個原版梯子合成一座人字梯；放置時會一次架起上下兩格，方向隨玩家朝向。",
          "靠近梯身時按跳躍可向上攀、按潛行可向下攀；破壞任一半會連動拆除整座並掉落一座人字梯。"
        ],
        "en_US": [
          "Craft one stepladder from six vanilla ladders. Placing it creates both vertical halves at once and faces the player.",
          "While next to the ladder, jump to climb up and sneak to climb down. Breaking either half removes the complete ladder and drops one stepladder."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:ladder",
            "minecraft:ladder",
            "minecraft:ladder",
            "minecraft:ladder",
            "minecraft:ladder",
            "minecraft:ladder"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:stepladder"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:chalkboard",
      "category": "boards",
      "icon": "textures/kaleidoscope_tavern_jar/item/chalkboard",
      "kinds": [],
      "mechanics": [
        "黑板配方與三塊合併方式見「黑板」條目；立式告示牌配方及各花飾款見下方個別條目。放置後互動輸入文字，單黑板最多 350 字、合併黑板 1,500 字、立式告示牌 320 字。",
        "手持染料可改文字顏色；螢光墨囊開啟螢光文字、墨囊關閉螢光；手持蜂巢蜜蠟封後不可再改文字或樣式。牌面文字由 Noto 字形圖集直接繪出；超出字圖集的字元會顯示方框。",
        "工作台配方見本條目。放置黑板可直接編輯文字；同方向相鄰放置三塊單黑板時會合併成寬黑板，文字編輯位置在中央。破壞任一塊會拆除整組。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "黑板配方与三块合并方式见“黑板”条目；立式告示牌配方及各花饰款见下方单独条目。放置后互动输入文字，单块黑板最多 350 字、合并黑板 1,500 字、立式告示牌 320 字。",
          "手持染料可改文字颜色；荧光墨囊开启荧光文字、墨囊关闭荧光；手持蜂脾封蜡后不可再改文字或样式。牌面文字由 Noto 字形图集直接绘出；字图集不支持的字符会显示方框。",
          "工作台配方见本条目。放置黑板可直接编辑文字；同方向相邻放置三块单黑板时会合并成宽黑板，文字编辑位置在中央。破坏任一块会拆除整组。"
        ],
        "zh_TW": [
          "黑板配方與三塊合併方式見「黑板」條目；立式告示牌配方及各花飾款見下方個別條目。放置後互動輸入文字，單黑板最多 350 字、合併黑板 1,500 字、立式告示牌 320 字。",
          "手持染料可改文字顏色；螢光墨囊開啟螢光文字、墨囊關閉螢光；手持蜂巢蜜蠟封後不可再改文字或樣式。牌面文字由 Noto 字形圖集直接繪出；超出字圖集的字元會顯示方框。",
          "工作台配方見本條目。放置黑板可直接編輯文字；同方向相鄰放置三塊單黑板時會合併成寬黑板，文字編輯位置在中央。破壞任一塊會拆除整組。"
        ],
        "en_US": [
          "See the Chalkboard entry for its recipe and three-panel merge. Recipes for sandwich boards and each flower style have separate entries below. Interact with a placed board to enter text: 350 characters on a small chalkboard, 1,500 on a wide board, and 320 on a sandwich board.",
          "Use a dye to change text color; glow ink enables glowing text, ink disables it, and honeycomb wax locks text and style edits. Text is drawn on the board face with the included Noto font; unsupported characters appear as a square.",
          "See this entry’s crafting recipe. Place a chalkboard and interact to edit its text. Three adjacent single boards with the same facing merge into one wide board, edited at the center. Breaking any panel removes the whole assembly."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:oak_sign",
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:ink_sac",
            "minecraft:ink_sac"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:chalkboard"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:base_sandwich_board",
      "category": "boards",
      "icon": "textures/kt_derived/a17/item_display_base_sandwich_board",
      "kinds": [],
      "mechanics": [
        "黑板配方與三塊合併方式見「黑板」條目；立式告示牌配方及各花飾款見下方個別條目。放置後互動輸入文字，單黑板最多 350 字、合併黑板 1,500 字、立式告示牌 320 字。",
        "手持染料可改文字顏色；螢光墨囊開啟螢光文字、墨囊關閉螢光；手持蜂巢蜜蠟封後不可再改文字或樣式。牌面文字由 Noto 字形圖集直接繪出；超出字圖集的字元會顯示方框。",
        "配方卡顯示素面告示牌的工作台配方。放置會佔兩格高度並依 16 個方向之一面向；互動可編輯牌面。持可種植花朵互動會改成相應花飾款，並保留原文字。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "黑板配方与三块合并方式见“黑板”条目；立式告示牌配方及各花饰款见下方单独条目。放置后互动输入文字，单块黑板最多 350 字、合并黑板 1,500 字、立式告示牌 320 字。",
          "手持染料可改文字颜色；荧光墨囊开启荧光文字、墨囊关闭荧光；手持蜂脾封蜡后不可再改文字或样式。牌面文字由 Noto 字形图集直接绘出；字图集不支持的字符会显示方框。",
          "配方卡显示素面告示牌的工作台配方。放置会占两格高度并按 16 个方向之一朝向；互动可编辑牌面。持可种植花朵互动会改为相应花饰款，并保留原文字。"
        ],
        "zh_TW": [
          "黑板配方與三塊合併方式見「黑板」條目；立式告示牌配方及各花飾款見下方個別條目。放置後互動輸入文字，單黑板最多 350 字、合併黑板 1,500 字、立式告示牌 320 字。",
          "手持染料可改文字顏色；螢光墨囊開啟螢光文字、墨囊關閉螢光；手持蜂巢蜜蠟封後不可再改文字或樣式。牌面文字由 Noto 字形圖集直接繪出；超出字圖集的字元會顯示方框。",
          "配方卡顯示素面告示牌的工作台配方。放置會佔兩格高度並依 16 個方向之一面向；互動可編輯牌面。持可種植花朵互動會改成相應花飾款，並保留原文字。"
        ],
        "en_US": [
          "See the Chalkboard entry for its recipe and three-panel merge. Recipes for sandwich boards and each flower style have separate entries below. Interact with a placed board to enter text: 350 characters on a small chalkboard, 1,500 on a wide board, and 320 on a sandwich board.",
          "Use a dye to change text color; glow ink enables glowing text, ink disables it, and honeycomb wax locks text and style edits. Text is drawn on the board face with the included Noto font; unsupported characters appear as a square.",
          "The recipe card shows the crafting recipe. Placement occupies two vertical blocks and faces one of 16 directions. Interact to edit the sign. Use a supported flower to change its decoration while keeping the text."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "minecraft:ink_sac",
            "minecraft:oak_slab"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:base_sandwich_board"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:grass_sandwich_board",
      "category": "boards",
      "icon": "textures/kt_derived/a17/item_display_grass_sandwich_board",
      "kinds": [],
      "mechanics": [
        "黑板配方與三塊合併方式見「黑板」條目；立式告示牌配方及各花飾款見下方個別條目。放置後互動輸入文字，單黑板最多 350 字、合併黑板 1,500 字、立式告示牌 320 字。",
        "手持染料可改文字顏色；螢光墨囊開啟螢光文字、墨囊關閉螢光；手持蜂巢蜜蠟封後不可再改文字或樣式。牌面文字由 Noto 字形圖集直接繪出；超出字圖集的字元會顯示方框。",
        "用草方塊互動可把其他立式告示牌改成草飾款；配方卡列出本款合成方式。轉換會保留文字；放置佔兩格高度，互動可編輯牌面。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "黑板配方与三块合并方式见“黑板”条目；立式告示牌配方及各花饰款见下方单独条目。放置后互动输入文字，单块黑板最多 350 字、合并黑板 1,500 字、立式告示牌 320 字。",
          "手持染料可改文字颜色；荧光墨囊开启荧光文字、墨囊关闭荧光；手持蜂脾封蜡后不可再改文字或样式。牌面文字由 Noto 字形图集直接绘出；字图集不支持的字符会显示方框。",
          "配方卡列出本款工作台配方；用对应花朵互动可把其他立式告示牌改成此花饰款，消耗一份花朵并保留原文字。放置占两格高度，互动可编辑牌面。"
        ],
        "zh_TW": [
          "黑板配方與三塊合併方式見「黑板」條目；立式告示牌配方及各花飾款見下方個別條目。放置後互動輸入文字，單黑板最多 350 字、合併黑板 1,500 字、立式告示牌 320 字。",
          "手持染料可改文字顏色；螢光墨囊開啟螢光文字、墨囊關閉螢光；手持蜂巢蜜蠟封後不可再改文字或樣式。牌面文字由 Noto 字形圖集直接繪出；超出字圖集的字元會顯示方框。",
          "用草方塊互動可把其他立式告示牌改成草飾款；配方卡列出本款合成方式。轉換會保留文字；放置佔兩格高度，互動可編輯牌面。"
        ],
        "en_US": [
          "See the Chalkboard entry for its recipe and three-panel merge. Recipes for sandwich boards and each flower style have separate entries below. Interact with a placed board to enter text: 350 characters on a small chalkboard, 1,500 on a wide board, and 320 on a sandwich board.",
          "Use a dye to change text color; glow ink enables glowing text, ink disables it, and honeycomb wax locks text and style edits. Text is drawn on the board face with the included Noto font; unsupported characters appear as a square.",
          "Use a grass block on a sandwich board to change it to this style. Its crafting recipe appears in the recipe card. Changing style preserves text; placement is two blocks high and interaction edits the sign."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:base_sandwich_board",
            "minecraft:grass"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:grass_sandwich_board"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:allium_sandwich_board",
      "category": "boards",
      "icon": "textures/kt_derived/a17/item_display_allium_sandwich_board",
      "kinds": [],
      "mechanics": [
        "黑板配方與三塊合併方式見「黑板」條目；立式告示牌配方及各花飾款見下方個別條目。放置後互動輸入文字，單黑板最多 350 字、合併黑板 1,500 字、立式告示牌 320 字。",
        "手持染料可改文字顏色；螢光墨囊開啟螢光文字、墨囊關閉螢光；手持蜂巢蜜蠟封後不可再改文字或樣式。牌面文字由 Noto 字形圖集直接繪出；超出字圖集的字元會顯示方框。",
        "配方卡列出本款工作台配方；以對應花朵互動可把其他立式告示牌改成此花飾款，消耗一份花朵並保留原文字。放置佔兩格高度，互動可編輯牌面。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "黑板配方与三块合并方式见“黑板”条目；立式告示牌配方及各花饰款见下方单独条目。放置后互动输入文字，单块黑板最多 350 字、合并黑板 1,500 字、立式告示牌 320 字。",
          "手持染料可改文字颜色；荧光墨囊开启荧光文字、墨囊关闭荧光；手持蜂脾封蜡后不可再改文字或样式。牌面文字由 Noto 字形图集直接绘出；字图集不支持的字符会显示方框。",
          "配方卡列出本款工作台配方；用对应花朵互动可把其他立式告示牌改成此花饰款，消耗一份花朵并保留原文字。放置占两格高度，互动可编辑牌面。"
        ],
        "zh_TW": [
          "黑板配方與三塊合併方式見「黑板」條目；立式告示牌配方及各花飾款見下方個別條目。放置後互動輸入文字，單黑板最多 350 字、合併黑板 1,500 字、立式告示牌 320 字。",
          "手持染料可改文字顏色；螢光墨囊開啟螢光文字、墨囊關閉螢光；手持蜂巢蜜蠟封後不可再改文字或樣式。牌面文字由 Noto 字形圖集直接繪出；超出字圖集的字元會顯示方框。",
          "配方卡列出本款工作台配方；以對應花朵互動可把其他立式告示牌改成此花飾款，消耗一份花朵並保留原文字。放置佔兩格高度，互動可編輯牌面。"
        ],
        "en_US": [
          "See the Chalkboard entry for its recipe and three-panel merge. Recipes for sandwich boards and each flower style have separate entries below. Interact with a placed board to enter text: 350 characters on a small chalkboard, 1,500 on a wide board, and 320 on a sandwich board.",
          "Use a dye to change text color; glow ink enables glowing text, ink disables it, and honeycomb wax locks text and style edits. Text is drawn on the board face with the included Noto font; unsupported characters appear as a square.",
          "The recipe card shows this style’s crafting recipe. Use allium on a sandwich board to change it to this flower style; one flower is consumed and existing text is kept. Placement is two blocks high; interact to edit."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:base_sandwich_board",
            "minecraft:allium"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:allium_sandwich_board"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:azure_bluet_sandwich_board",
      "category": "boards",
      "icon": "textures/kt_derived/a17/item_display_azure_bluet_sandwich_board",
      "kinds": [],
      "mechanics": [
        "黑板配方與三塊合併方式見「黑板」條目；立式告示牌配方及各花飾款見下方個別條目。放置後互動輸入文字，單黑板最多 350 字、合併黑板 1,500 字、立式告示牌 320 字。",
        "手持染料可改文字顏色；螢光墨囊開啟螢光文字、墨囊關閉螢光；手持蜂巢蜜蠟封後不可再改文字或樣式。牌面文字由 Noto 字形圖集直接繪出；超出字圖集的字元會顯示方框。",
        "配方卡列出本款工作台配方；以對應花朵互動可把其他立式告示牌改成此花飾款，消耗一份花朵並保留原文字。放置佔兩格高度，互動可編輯牌面。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "黑板配方与三块合并方式见“黑板”条目；立式告示牌配方及各花饰款见下方单独条目。放置后互动输入文字，单块黑板最多 350 字、合并黑板 1,500 字、立式告示牌 320 字。",
          "手持染料可改文字颜色；荧光墨囊开启荧光文字、墨囊关闭荧光；手持蜂脾封蜡后不可再改文字或样式。牌面文字由 Noto 字形图集直接绘出；字图集不支持的字符会显示方框。",
          "配方卡列出本款工作台配方；用对应花朵互动可把其他立式告示牌改成此花饰款，消耗一份花朵并保留原文字。放置占两格高度，互动可编辑牌面。"
        ],
        "zh_TW": [
          "黑板配方與三塊合併方式見「黑板」條目；立式告示牌配方及各花飾款見下方個別條目。放置後互動輸入文字，單黑板最多 350 字、合併黑板 1,500 字、立式告示牌 320 字。",
          "手持染料可改文字顏色；螢光墨囊開啟螢光文字、墨囊關閉螢光；手持蜂巢蜜蠟封後不可再改文字或樣式。牌面文字由 Noto 字形圖集直接繪出；超出字圖集的字元會顯示方框。",
          "配方卡列出本款工作台配方；以對應花朵互動可把其他立式告示牌改成此花飾款，消耗一份花朵並保留原文字。放置佔兩格高度，互動可編輯牌面。"
        ],
        "en_US": [
          "See the Chalkboard entry for its recipe and three-panel merge. Recipes for sandwich boards and each flower style have separate entries below. Interact with a placed board to enter text: 350 characters on a small chalkboard, 1,500 on a wide board, and 320 on a sandwich board.",
          "Use a dye to change text color; glow ink enables glowing text, ink disables it, and honeycomb wax locks text and style edits. Text is drawn on the board face with the included Noto font; unsupported characters appear as a square.",
          "The recipe card shows this style’s crafting recipe. Use azure bluet on a sandwich board to change it to this flower style; one flower is consumed and existing text is kept. Placement is two blocks high; interact to edit."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:base_sandwich_board",
            "minecraft:azure_bluet"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:azure_bluet_sandwich_board"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:base_sandwich_board",
            "minecraft:lily_of_the_valley"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:azure_bluet_sandwich_board"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:base_sandwich_board",
            "minecraft:oxeye_daisy"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:azure_bluet_sandwich_board"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:cornflower_sandwich_board",
      "category": "boards",
      "icon": "textures/kt_derived/a17/item_display_cornflower_sandwich_board",
      "kinds": [],
      "mechanics": [
        "黑板配方與三塊合併方式見「黑板」條目；立式告示牌配方及各花飾款見下方個別條目。放置後互動輸入文字，單黑板最多 350 字、合併黑板 1,500 字、立式告示牌 320 字。",
        "手持染料可改文字顏色；螢光墨囊開啟螢光文字、墨囊關閉螢光；手持蜂巢蜜蠟封後不可再改文字或樣式。牌面文字由 Noto 字形圖集直接繪出；超出字圖集的字元會顯示方框。",
        "配方卡列出本款工作台配方；以對應花朵互動可把其他立式告示牌改成此花飾款，消耗一份花朵並保留原文字。放置佔兩格高度，互動可編輯牌面。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "黑板配方与三块合并方式见“黑板”条目；立式告示牌配方及各花饰款见下方单独条目。放置后互动输入文字，单块黑板最多 350 字、合并黑板 1,500 字、立式告示牌 320 字。",
          "手持染料可改文字颜色；荧光墨囊开启荧光文字、墨囊关闭荧光；手持蜂脾封蜡后不可再改文字或样式。牌面文字由 Noto 字形图集直接绘出；字图集不支持的字符会显示方框。",
          "配方卡列出本款工作台配方；用对应花朵互动可把其他立式告示牌改成此花饰款，消耗一份花朵并保留原文字。放置占两格高度，互动可编辑牌面。"
        ],
        "zh_TW": [
          "黑板配方與三塊合併方式見「黑板」條目；立式告示牌配方及各花飾款見下方個別條目。放置後互動輸入文字，單黑板最多 350 字、合併黑板 1,500 字、立式告示牌 320 字。",
          "手持染料可改文字顏色；螢光墨囊開啟螢光文字、墨囊關閉螢光；手持蜂巢蜜蠟封後不可再改文字或樣式。牌面文字由 Noto 字形圖集直接繪出；超出字圖集的字元會顯示方框。",
          "配方卡列出本款工作台配方；以對應花朵互動可把其他立式告示牌改成此花飾款，消耗一份花朵並保留原文字。放置佔兩格高度，互動可編輯牌面。"
        ],
        "en_US": [
          "See the Chalkboard entry for its recipe and three-panel merge. Recipes for sandwich boards and each flower style have separate entries below. Interact with a placed board to enter text: 350 characters on a small chalkboard, 1,500 on a wide board, and 320 on a sandwich board.",
          "Use a dye to change text color; glow ink enables glowing text, ink disables it, and honeycomb wax locks text and style edits. Text is drawn on the board face with the included Noto font; unsupported characters appear as a square.",
          "The recipe card shows this style’s crafting recipe. Use cornflower on a sandwich board to change it to this flower style; one flower is consumed and existing text is kept. Placement is two blocks high; interact to edit."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:base_sandwich_board",
            "minecraft:cornflower"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:cornflower_sandwich_board"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:orchid_sandwich_board",
      "category": "boards",
      "icon": "textures/kt_derived/a17/item_display_orchid_sandwich_board",
      "kinds": [],
      "mechanics": [
        "黑板配方與三塊合併方式見「黑板」條目；立式告示牌配方及各花飾款見下方個別條目。放置後互動輸入文字，單黑板最多 350 字、合併黑板 1,500 字、立式告示牌 320 字。",
        "手持染料可改文字顏色；螢光墨囊開啟螢光文字、墨囊關閉螢光；手持蜂巢蜜蠟封後不可再改文字或樣式。牌面文字由 Noto 字形圖集直接繪出；超出字圖集的字元會顯示方框。",
        "配方卡列出本款工作台配方；以對應花朵互動可把其他立式告示牌改成此花飾款，消耗一份花朵並保留原文字。放置佔兩格高度，互動可編輯牌面。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "黑板配方与三块合并方式见“黑板”条目；立式告示牌配方及各花饰款见下方单独条目。放置后互动输入文字，单块黑板最多 350 字、合并黑板 1,500 字、立式告示牌 320 字。",
          "手持染料可改文字颜色；荧光墨囊开启荧光文字、墨囊关闭荧光；手持蜂脾封蜡后不可再改文字或样式。牌面文字由 Noto 字形图集直接绘出；字图集不支持的字符会显示方框。",
          "配方卡列出本款工作台配方；用对应花朵互动可把其他立式告示牌改成此花饰款，消耗一份花朵并保留原文字。放置占两格高度，互动可编辑牌面。"
        ],
        "zh_TW": [
          "黑板配方與三塊合併方式見「黑板」條目；立式告示牌配方及各花飾款見下方個別條目。放置後互動輸入文字，單黑板最多 350 字、合併黑板 1,500 字、立式告示牌 320 字。",
          "手持染料可改文字顏色；螢光墨囊開啟螢光文字、墨囊關閉螢光；手持蜂巢蜜蠟封後不可再改文字或樣式。牌面文字由 Noto 字形圖集直接繪出；超出字圖集的字元會顯示方框。",
          "配方卡列出本款工作台配方；以對應花朵互動可把其他立式告示牌改成此花飾款，消耗一份花朵並保留原文字。放置佔兩格高度，互動可編輯牌面。"
        ],
        "en_US": [
          "See the Chalkboard entry for its recipe and three-panel merge. Recipes for sandwich boards and each flower style have separate entries below. Interact with a placed board to enter text: 350 characters on a small chalkboard, 1,500 on a wide board, and 320 on a sandwich board.",
          "Use a dye to change text color; glow ink enables glowing text, ink disables it, and honeycomb wax locks text and style edits. Text is drawn on the board face with the included Noto font; unsupported characters appear as a square.",
          "The recipe card shows this style’s crafting recipe. Use blue orchid on a sandwich board to change it to this flower style; one flower is consumed and existing text is kept. Placement is two blocks high; interact to edit."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:base_sandwich_board",
            "minecraft:blue_orchid"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:orchid_sandwich_board"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:peony_sandwich_board",
      "category": "boards",
      "icon": "textures/kt_derived/a17/item_display_peony_sandwich_board",
      "kinds": [],
      "mechanics": [
        "黑板配方與三塊合併方式見「黑板」條目；立式告示牌配方及各花飾款見下方個別條目。放置後互動輸入文字，單黑板最多 350 字、合併黑板 1,500 字、立式告示牌 320 字。",
        "手持染料可改文字顏色；螢光墨囊開啟螢光文字、墨囊關閉螢光；手持蜂巢蜜蠟封後不可再改文字或樣式。牌面文字由 Noto 字形圖集直接繪出；超出字圖集的字元會顯示方框。",
        "配方卡列出本款工作台配方；以對應花朵互動可把其他立式告示牌改成此花飾款，消耗一份花朵並保留原文字。放置佔兩格高度，互動可編輯牌面。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "黑板配方与三块合并方式见“黑板”条目；立式告示牌配方及各花饰款见下方单独条目。放置后互动输入文字，单块黑板最多 350 字、合并黑板 1,500 字、立式告示牌 320 字。",
          "手持染料可改文字颜色；荧光墨囊开启荧光文字、墨囊关闭荧光；手持蜂脾封蜡后不可再改文字或样式。牌面文字由 Noto 字形图集直接绘出；字图集不支持的字符会显示方框。",
          "配方卡列出本款工作台配方；用对应花朵互动可把其他立式告示牌改成此花饰款，消耗一份花朵并保留原文字。放置占两格高度，互动可编辑牌面。"
        ],
        "zh_TW": [
          "黑板配方與三塊合併方式見「黑板」條目；立式告示牌配方及各花飾款見下方個別條目。放置後互動輸入文字，單黑板最多 350 字、合併黑板 1,500 字、立式告示牌 320 字。",
          "手持染料可改文字顏色；螢光墨囊開啟螢光文字、墨囊關閉螢光；手持蜂巢蜜蠟封後不可再改文字或樣式。牌面文字由 Noto 字形圖集直接繪出；超出字圖集的字元會顯示方框。",
          "配方卡列出本款工作台配方；以對應花朵互動可把其他立式告示牌改成此花飾款，消耗一份花朵並保留原文字。放置佔兩格高度，互動可編輯牌面。"
        ],
        "en_US": [
          "See the Chalkboard entry for its recipe and three-panel merge. Recipes for sandwich boards and each flower style have separate entries below. Interact with a placed board to enter text: 350 characters on a small chalkboard, 1,500 on a wide board, and 320 on a sandwich board.",
          "Use a dye to change text color; glow ink enables glowing text, ink disables it, and honeycomb wax locks text and style edits. Text is drawn on the board face with the included Noto font; unsupported characters appear as a square.",
          "The recipe card shows this style’s crafting recipe. Use peony on a sandwich board to change it to this flower style; one flower is consumed and existing text is kept. Placement is two blocks high; interact to edit."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:base_sandwich_board",
            "minecraft:lilac"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:peony_sandwich_board"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:base_sandwich_board",
            "minecraft:peony"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:peony_sandwich_board"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:pink_petals_sandwich_board",
      "category": "boards",
      "icon": "textures/kt_derived/a17/item_display_pink_petals_sandwich_board",
      "kinds": [],
      "mechanics": [
        "黑板配方與三塊合併方式見「黑板」條目；立式告示牌配方及各花飾款見下方個別條目。放置後互動輸入文字，單黑板最多 350 字、合併黑板 1,500 字、立式告示牌 320 字。",
        "手持染料可改文字顏色；螢光墨囊開啟螢光文字、墨囊關閉螢光；手持蜂巢蜜蠟封後不可再改文字或樣式。牌面文字由 Noto 字形圖集直接繪出；超出字圖集的字元會顯示方框。",
        "配方卡列出本款工作台配方；以對應花朵互動可把其他立式告示牌改成此花飾款，消耗一份花朵並保留原文字。放置佔兩格高度，互動可編輯牌面。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "黑板配方与三块合并方式见“黑板”条目；立式告示牌配方及各花饰款见下方单独条目。放置后互动输入文字，单块黑板最多 350 字、合并黑板 1,500 字、立式告示牌 320 字。",
          "手持染料可改文字颜色；荧光墨囊开启荧光文字、墨囊关闭荧光；手持蜂脾封蜡后不可再改文字或样式。牌面文字由 Noto 字形图集直接绘出；字图集不支持的字符会显示方框。",
          "配方卡列出本款工作台配方；用对应花朵互动可把其他立式告示牌改成此花饰款，消耗一份花朵并保留原文字。放置占两格高度，互动可编辑牌面。"
        ],
        "zh_TW": [
          "黑板配方與三塊合併方式見「黑板」條目；立式告示牌配方及各花飾款見下方個別條目。放置後互動輸入文字，單黑板最多 350 字、合併黑板 1,500 字、立式告示牌 320 字。",
          "手持染料可改文字顏色；螢光墨囊開啟螢光文字、墨囊關閉螢光；手持蜂巢蜜蠟封後不可再改文字或樣式。牌面文字由 Noto 字形圖集直接繪出；超出字圖集的字元會顯示方框。",
          "配方卡列出本款工作台配方；以對應花朵互動可把其他立式告示牌改成此花飾款，消耗一份花朵並保留原文字。放置佔兩格高度，互動可編輯牌面。"
        ],
        "en_US": [
          "See the Chalkboard entry for its recipe and three-panel merge. Recipes for sandwich boards and each flower style have separate entries below. Interact with a placed board to enter text: 350 characters on a small chalkboard, 1,500 on a wide board, and 320 on a sandwich board.",
          "Use a dye to change text color; glow ink enables glowing text, ink disables it, and honeycomb wax locks text and style edits. Text is drawn on the board face with the included Noto font; unsupported characters appear as a square.",
          "The recipe card shows this style’s crafting recipe. Use pink petals on a sandwich board to change it to this flower style; one flower is consumed and existing text is kept. Placement is two blocks high; interact to edit."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:base_sandwich_board",
            "minecraft:pink_petals"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:pink_petals_sandwich_board"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:pitcher_plant_sandwich_board",
      "category": "boards",
      "icon": "textures/kt_derived/a17/item_display_pitcher_plant_sandwich_board",
      "kinds": [],
      "mechanics": [
        "黑板配方與三塊合併方式見「黑板」條目；立式告示牌配方及各花飾款見下方個別條目。放置後互動輸入文字，單黑板最多 350 字、合併黑板 1,500 字、立式告示牌 320 字。",
        "手持染料可改文字顏色；螢光墨囊開啟螢光文字、墨囊關閉螢光；手持蜂巢蜜蠟封後不可再改文字或樣式。牌面文字由 Noto 字形圖集直接繪出；超出字圖集的字元會顯示方框。",
        "配方卡列出本款工作台配方；以對應花朵互動可把其他立式告示牌改成此花飾款，消耗一份花朵並保留原文字。放置佔兩格高度，互動可編輯牌面。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "黑板配方与三块合并方式见“黑板”条目；立式告示牌配方及各花饰款见下方单独条目。放置后互动输入文字，单块黑板最多 350 字、合并黑板 1,500 字、立式告示牌 320 字。",
          "手持染料可改文字颜色；荧光墨囊开启荧光文字、墨囊关闭荧光；手持蜂脾封蜡后不可再改文字或样式。牌面文字由 Noto 字形图集直接绘出；字图集不支持的字符会显示方框。",
          "配方卡列出本款工作台配方；用对应花朵互动可把其他立式告示牌改成此花饰款，消耗一份花朵并保留原文字。放置占两格高度，互动可编辑牌面。"
        ],
        "zh_TW": [
          "黑板配方與三塊合併方式見「黑板」條目；立式告示牌配方及各花飾款見下方個別條目。放置後互動輸入文字，單黑板最多 350 字、合併黑板 1,500 字、立式告示牌 320 字。",
          "手持染料可改文字顏色；螢光墨囊開啟螢光文字、墨囊關閉螢光；手持蜂巢蜜蠟封後不可再改文字或樣式。牌面文字由 Noto 字形圖集直接繪出；超出字圖集的字元會顯示方框。",
          "配方卡列出本款工作台配方；以對應花朵互動可把其他立式告示牌改成此花飾款，消耗一份花朵並保留原文字。放置佔兩格高度，互動可編輯牌面。"
        ],
        "en_US": [
          "See the Chalkboard entry for its recipe and three-panel merge. Recipes for sandwich boards and each flower style have separate entries below. Interact with a placed board to enter text: 350 characters on a small chalkboard, 1,500 on a wide board, and 320 on a sandwich board.",
          "Use a dye to change text color; glow ink enables glowing text, ink disables it, and honeycomb wax locks text and style edits. Text is drawn on the board face with the included Noto font; unsupported characters appear as a square.",
          "The recipe card shows this style’s crafting recipe. Use pitcher plant on a sandwich board to change it to this flower style; one flower is consumed and existing text is kept. Placement is two blocks high; interact to edit."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:base_sandwich_board",
            "minecraft:pitcher_plant"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:pitcher_plant_sandwich_board"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:poppy_sandwich_board",
      "category": "boards",
      "icon": "textures/kt_derived/a17/item_display_poppy_sandwich_board",
      "kinds": [],
      "mechanics": [
        "黑板配方與三塊合併方式見「黑板」條目；立式告示牌配方及各花飾款見下方個別條目。放置後互動輸入文字，單黑板最多 350 字、合併黑板 1,500 字、立式告示牌 320 字。",
        "手持染料可改文字顏色；螢光墨囊開啟螢光文字、墨囊關閉螢光；手持蜂巢蜜蠟封後不可再改文字或樣式。牌面文字由 Noto 字形圖集直接繪出；超出字圖集的字元會顯示方框。",
        "配方卡列出本款工作台配方；以對應花朵互動可把其他立式告示牌改成此花飾款，消耗一份花朵並保留原文字。放置佔兩格高度，互動可編輯牌面。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "黑板配方与三块合并方式见“黑板”条目；立式告示牌配方及各花饰款见下方单独条目。放置后互动输入文字，单块黑板最多 350 字、合并黑板 1,500 字、立式告示牌 320 字。",
          "手持染料可改文字颜色；荧光墨囊开启荧光文字、墨囊关闭荧光；手持蜂脾封蜡后不可再改文字或样式。牌面文字由 Noto 字形图集直接绘出；字图集不支持的字符会显示方框。",
          "配方卡列出本款工作台配方；用对应花朵互动可把其他立式告示牌改成此花饰款，消耗一份花朵并保留原文字。放置占两格高度，互动可编辑牌面。"
        ],
        "zh_TW": [
          "黑板配方與三塊合併方式見「黑板」條目；立式告示牌配方及各花飾款見下方個別條目。放置後互動輸入文字，單黑板最多 350 字、合併黑板 1,500 字、立式告示牌 320 字。",
          "手持染料可改文字顏色；螢光墨囊開啟螢光文字、墨囊關閉螢光；手持蜂巢蜜蠟封後不可再改文字或樣式。牌面文字由 Noto 字形圖集直接繪出；超出字圖集的字元會顯示方框。",
          "配方卡列出本款工作台配方；以對應花朵互動可把其他立式告示牌改成此花飾款，消耗一份花朵並保留原文字。放置佔兩格高度，互動可編輯牌面。"
        ],
        "en_US": [
          "See the Chalkboard entry for its recipe and three-panel merge. Recipes for sandwich boards and each flower style have separate entries below. Interact with a placed board to enter text: 350 characters on a small chalkboard, 1,500 on a wide board, and 320 on a sandwich board.",
          "Use a dye to change text color; glow ink enables glowing text, ink disables it, and honeycomb wax locks text and style edits. Text is drawn on the board face with the included Noto font; unsupported characters appear as a square.",
          "The recipe card shows this style’s crafting recipe. Use poppy on a sandwich board to change it to this flower style; one flower is consumed and existing text is kept. Placement is two blocks high; interact to edit."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:base_sandwich_board",
            "minecraft:poppy"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:poppy_sandwich_board"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:base_sandwich_board",
            "minecraft:rose_bush"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:poppy_sandwich_board"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:sunflower_sandwich_board",
      "category": "boards",
      "icon": "textures/kt_derived/a17/item_display_sunflower_sandwich_board",
      "kinds": [],
      "mechanics": [
        "黑板配方與三塊合併方式見「黑板」條目；立式告示牌配方及各花飾款見下方個別條目。放置後互動輸入文字，單黑板最多 350 字、合併黑板 1,500 字、立式告示牌 320 字。",
        "手持染料可改文字顏色；螢光墨囊開啟螢光文字、墨囊關閉螢光；手持蜂巢蜜蠟封後不可再改文字或樣式。牌面文字由 Noto 字形圖集直接繪出；超出字圖集的字元會顯示方框。",
        "配方卡列出本款工作台配方；以對應花朵互動可把其他立式告示牌改成此花飾款，消耗一份花朵並保留原文字。放置佔兩格高度，互動可編輯牌面。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "黑板配方与三块合并方式见“黑板”条目；立式告示牌配方及各花饰款见下方单独条目。放置后互动输入文字，单块黑板最多 350 字、合并黑板 1,500 字、立式告示牌 320 字。",
          "手持染料可改文字颜色；荧光墨囊开启荧光文字、墨囊关闭荧光；手持蜂脾封蜡后不可再改文字或样式。牌面文字由 Noto 字形图集直接绘出；字图集不支持的字符会显示方框。",
          "配方卡列出本款工作台配方；用对应花朵互动可把其他立式告示牌改成此花饰款，消耗一份花朵并保留原文字。放置占两格高度，互动可编辑牌面。"
        ],
        "zh_TW": [
          "黑板配方與三塊合併方式見「黑板」條目；立式告示牌配方及各花飾款見下方個別條目。放置後互動輸入文字，單黑板最多 350 字、合併黑板 1,500 字、立式告示牌 320 字。",
          "手持染料可改文字顏色；螢光墨囊開啟螢光文字、墨囊關閉螢光；手持蜂巢蜜蠟封後不可再改文字或樣式。牌面文字由 Noto 字形圖集直接繪出；超出字圖集的字元會顯示方框。",
          "配方卡列出本款工作台配方；以對應花朵互動可把其他立式告示牌改成此花飾款，消耗一份花朵並保留原文字。放置佔兩格高度，互動可編輯牌面。"
        ],
        "en_US": [
          "See the Chalkboard entry for its recipe and three-panel merge. Recipes for sandwich boards and each flower style have separate entries below. Interact with a placed board to enter text: 350 characters on a small chalkboard, 1,500 on a wide board, and 320 on a sandwich board.",
          "Use a dye to change text color; glow ink enables glowing text, ink disables it, and honeycomb wax locks text and style edits. Text is drawn on the board face with the included Noto font; unsupported characters appear as a square.",
          "The recipe card shows this style’s crafting recipe. Use sunflower on a sandwich board to change it to this flower style; one flower is consumed and existing text is kept. Placement is two blocks high; interact to edit."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:base_sandwich_board",
            "minecraft:dandelion"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:sunflower_sandwich_board"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:base_sandwich_board",
            "minecraft:sunflower"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:sunflower_sandwich_board"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:torchflower_sandwich_board",
      "category": "boards",
      "icon": "textures/kt_derived/a17/item_display_torchflower_sandwich_board",
      "kinds": [],
      "mechanics": [
        "黑板配方與三塊合併方式見「黑板」條目；立式告示牌配方及各花飾款見下方個別條目。放置後互動輸入文字，單黑板最多 350 字、合併黑板 1,500 字、立式告示牌 320 字。",
        "手持染料可改文字顏色；螢光墨囊開啟螢光文字、墨囊關閉螢光；手持蜂巢蜜蠟封後不可再改文字或樣式。牌面文字由 Noto 字形圖集直接繪出；超出字圖集的字元會顯示方框。",
        "配方卡列出本款工作台配方；以對應花朵互動可把其他立式告示牌改成此花飾款，消耗一份花朵並保留原文字。放置佔兩格高度，互動可編輯牌面。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "黑板配方与三块合并方式见“黑板”条目；立式告示牌配方及各花饰款见下方单独条目。放置后互动输入文字，单块黑板最多 350 字、合并黑板 1,500 字、立式告示牌 320 字。",
          "手持染料可改文字颜色；荧光墨囊开启荧光文字、墨囊关闭荧光；手持蜂脾封蜡后不可再改文字或样式。牌面文字由 Noto 字形图集直接绘出；字图集不支持的字符会显示方框。",
          "配方卡列出本款工作台配方；用对应花朵互动可把其他立式告示牌改成此花饰款，消耗一份花朵并保留原文字。放置占两格高度，互动可编辑牌面。"
        ],
        "zh_TW": [
          "黑板配方與三塊合併方式見「黑板」條目；立式告示牌配方及各花飾款見下方個別條目。放置後互動輸入文字，單黑板最多 350 字、合併黑板 1,500 字、立式告示牌 320 字。",
          "手持染料可改文字顏色；螢光墨囊開啟螢光文字、墨囊關閉螢光；手持蜂巢蜜蠟封後不可再改文字或樣式。牌面文字由 Noto 字形圖集直接繪出；超出字圖集的字元會顯示方框。",
          "配方卡列出本款工作台配方；以對應花朵互動可把其他立式告示牌改成此花飾款，消耗一份花朵並保留原文字。放置佔兩格高度，互動可編輯牌面。"
        ],
        "en_US": [
          "See the Chalkboard entry for its recipe and three-panel merge. Recipes for sandwich boards and each flower style have separate entries below. Interact with a placed board to enter text: 350 characters on a small chalkboard, 1,500 on a wide board, and 320 on a sandwich board.",
          "Use a dye to change text color; glow ink enables glowing text, ink disables it, and honeycomb wax locks text and style edits. Text is drawn on the board face with the included Noto font; unsupported characters appear as a square.",
          "The recipe card shows this style’s crafting recipe. Use torchflower on a sandwich board to change it to this flower style; one flower is consumed and existing text is kept. Placement is two blocks high; interact to edit."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:base_sandwich_board",
            "minecraft:torchflower"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:torchflower_sandwich_board"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:tulip_sandwich_board",
      "category": "boards",
      "icon": "textures/kt_derived/a17/item_display_tulip_sandwich_board",
      "kinds": [],
      "mechanics": [
        "黑板配方與三塊合併方式見「黑板」條目；立式告示牌配方及各花飾款見下方個別條目。放置後互動輸入文字，單黑板最多 350 字、合併黑板 1,500 字、立式告示牌 320 字。",
        "手持染料可改文字顏色；螢光墨囊開啟螢光文字、墨囊關閉螢光；手持蜂巢蜜蠟封後不可再改文字或樣式。牌面文字由 Noto 字形圖集直接繪出；超出字圖集的字元會顯示方框。",
        "配方卡列出本款工作台配方；以對應花朵互動可把其他立式告示牌改成此花飾款，消耗一份花朵並保留原文字。放置佔兩格高度，互動可編輯牌面。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "黑板配方与三块合并方式见“黑板”条目；立式告示牌配方及各花饰款见下方单独条目。放置后互动输入文字，单块黑板最多 350 字、合并黑板 1,500 字、立式告示牌 320 字。",
          "手持染料可改文字颜色；荧光墨囊开启荧光文字、墨囊关闭荧光；手持蜂脾封蜡后不可再改文字或样式。牌面文字由 Noto 字形图集直接绘出；字图集不支持的字符会显示方框。",
          "配方卡列出本款工作台配方；用对应花朵互动可把其他立式告示牌改成此花饰款，消耗一份花朵并保留原文字。放置占两格高度，互动可编辑牌面。"
        ],
        "zh_TW": [
          "黑板配方與三塊合併方式見「黑板」條目；立式告示牌配方及各花飾款見下方個別條目。放置後互動輸入文字，單黑板最多 350 字、合併黑板 1,500 字、立式告示牌 320 字。",
          "手持染料可改文字顏色；螢光墨囊開啟螢光文字、墨囊關閉螢光；手持蜂巢蜜蠟封後不可再改文字或樣式。牌面文字由 Noto 字形圖集直接繪出；超出字圖集的字元會顯示方框。",
          "配方卡列出本款工作台配方；以對應花朵互動可把其他立式告示牌改成此花飾款，消耗一份花朵並保留原文字。放置佔兩格高度，互動可編輯牌面。"
        ],
        "en_US": [
          "See the Chalkboard entry for its recipe and three-panel merge. Recipes for sandwich boards and each flower style have separate entries below. Interact with a placed board to enter text: 350 characters on a small chalkboard, 1,500 on a wide board, and 320 on a sandwich board.",
          "Use a dye to change text color; glow ink enables glowing text, ink disables it, and honeycomb wax locks text and style edits. Text is drawn on the board face with the included Noto font; unsupported characters appear as a square.",
          "The recipe card shows this style’s crafting recipe. Use red tulip on a sandwich board to change it to this flower style; one flower is consumed and existing text is kept. Placement is two blocks high; interact to edit."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:base_sandwich_board",
            "minecraft:orange_tulip"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:tulip_sandwich_board"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:base_sandwich_board",
            "minecraft:pink_tulip"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:tulip_sandwich_board"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:base_sandwich_board",
            "minecraft:red_tulip"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:tulip_sandwich_board"
        },
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:base_sandwich_board",
            "minecraft:white_tulip"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:tulip_sandwich_board"
        }
      ]
    },
    {
      "id": "kaleidoscope_tavern:wither_rose_sandwich_board",
      "category": "boards",
      "icon": "textures/kt_derived/a17/item_display_wither_rose_sandwich_board",
      "kinds": [],
      "mechanics": [
        "黑板配方與三塊合併方式見「黑板」條目；立式告示牌配方及各花飾款見下方個別條目。放置後互動輸入文字，單黑板最多 350 字、合併黑板 1,500 字、立式告示牌 320 字。",
        "手持染料可改文字顏色；螢光墨囊開啟螢光文字、墨囊關閉螢光；手持蜂巢蜜蠟封後不可再改文字或樣式。牌面文字由 Noto 字形圖集直接繪出；超出字圖集的字元會顯示方框。",
        "配方卡列出本款工作台配方；以對應花朵互動可把其他立式告示牌改成此花飾款，消耗一份花朵並保留原文字。放置佔兩格高度，互動可編輯牌面。"
      ],
      "mechanicsByLocale": {
        "zh_CN": [
          "黑板配方与三块合并方式见“黑板”条目；立式告示牌配方及各花饰款见下方单独条目。放置后互动输入文字，单块黑板最多 350 字、合并黑板 1,500 字、立式告示牌 320 字。",
          "手持染料可改文字颜色；荧光墨囊开启荧光文字、墨囊关闭荧光；手持蜂脾封蜡后不可再改文字或样式。牌面文字由 Noto 字形图集直接绘出；字图集不支持的字符会显示方框。",
          "配方卡列出本款工作台配方；用对应花朵互动可把其他立式告示牌改成此花饰款，消耗一份花朵并保留原文字。放置占两格高度，互动可编辑牌面。"
        ],
        "zh_TW": [
          "黑板配方與三塊合併方式見「黑板」條目；立式告示牌配方及各花飾款見下方個別條目。放置後互動輸入文字，單黑板最多 350 字、合併黑板 1,500 字、立式告示牌 320 字。",
          "手持染料可改文字顏色；螢光墨囊開啟螢光文字、墨囊關閉螢光；手持蜂巢蜜蠟封後不可再改文字或樣式。牌面文字由 Noto 字形圖集直接繪出；超出字圖集的字元會顯示方框。",
          "配方卡列出本款工作台配方；以對應花朵互動可把其他立式告示牌改成此花飾款，消耗一份花朵並保留原文字。放置佔兩格高度，互動可編輯牌面。"
        ],
        "en_US": [
          "See the Chalkboard entry for its recipe and three-panel merge. Recipes for sandwich boards and each flower style have separate entries below. Interact with a placed board to enter text: 350 characters on a small chalkboard, 1,500 on a wide board, and 320 on a sandwich board.",
          "Use a dye to change text color; glow ink enables glowing text, ink disables it, and honeycomb wax locks text and style edits. Text is drawn on the board face with the included Noto font; unsupported characters appear as a square.",
          "The recipe card shows this style’s crafting recipe. Use wither rose on a sandwich board to change it to this flower style; one flower is consumed and existing text is kept. Placement is two blocks high; interact to edit."
        ]
      },
      "recipes": [
        {
          "method": "Crafting Table",
          "ingredients": [
            "kaleidoscope_tavern:base_sandwich_board",
            "minecraft:wither_rose"
          ],
          "count": 1,
          "time": 0,
          "result": "kaleidoscope_tavern:wither_rose_sandwich_board"
        }
      ]
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
      "kaleidoscope_tavern:guide_art": "挂画与装饰",
      "kaleidoscope_tavern:guide_board_text": "黑板文字与款式",
      "kaleidoscope_tavern:chalkboard": "黑板",
      "kaleidoscope_tavern:base_sandwich_board": "素面立式告示牌",
      "kaleidoscope_tavern:grass_sandwich_board": "草饰立式告示牌",
      "kaleidoscope_tavern:allium_sandwich_board": "紫色绒球葱饰立式告示牌",
      "kaleidoscope_tavern:azure_bluet_sandwich_board": "蓝眼草饰立式告示牌",
      "kaleidoscope_tavern:cornflower_sandwich_board": "矢车菊饰立式告示牌",
      "kaleidoscope_tavern:orchid_sandwich_board": "蓝色蝴蝶兰饰立式告示牌",
      "kaleidoscope_tavern:peony_sandwich_board": "牡丹饰立式告示牌",
      "kaleidoscope_tavern:pink_petals_sandwich_board": "樱花花瓣饰立式告示牌",
      "kaleidoscope_tavern:pitcher_plant_sandwich_board": "瓶子草饰立式告示牌",
      "kaleidoscope_tavern:poppy_sandwich_board": "虞美人饰立式告示牌",
      "kaleidoscope_tavern:sunflower_sandwich_board": "向日葵饰立式告示牌",
      "kaleidoscope_tavern:torchflower_sandwich_board": "火炬花饰立式告示牌",
      "kaleidoscope_tavern:tulip_sandwich_board": "郁金香饰立式告示牌",
      "kaleidoscope_tavern:wither_rose_sandwich_board": "凋零玫瑰饰立式告示牌",
      "kaleidoscope_tavern:white_bar_stool": "白色高脚凳",
      "kaleidoscope_tavern:white_sofa": "白色沙发",
      "kaleidoscope_tavern:light_gray_bar_stool": "淡灰色高脚凳",
      "kaleidoscope_tavern:light_gray_sofa": "淡灰色沙发",
      "kaleidoscope_tavern:gray_bar_stool": "灰色高脚凳",
      "kaleidoscope_tavern:gray_sofa": "灰色沙发",
      "kaleidoscope_tavern:black_bar_stool": "黑色高脚凳",
      "kaleidoscope_tavern:black_sofa": "黑色沙发",
      "kaleidoscope_tavern:brown_bar_stool": "棕色高脚凳",
      "kaleidoscope_tavern:brown_sofa": "棕色沙发",
      "kaleidoscope_tavern:red_bar_stool": "红色高脚凳",
      "kaleidoscope_tavern:red_sofa": "红色沙发",
      "kaleidoscope_tavern:orange_bar_stool": "橙色高脚凳",
      "kaleidoscope_tavern:orange_sofa": "橙色沙发",
      "kaleidoscope_tavern:yellow_bar_stool": "黄色高脚凳",
      "kaleidoscope_tavern:yellow_sofa": "黄色沙发",
      "kaleidoscope_tavern:lime_bar_stool": "黄绿色高脚凳",
      "kaleidoscope_tavern:lime_sofa": "黄绿色沙发",
      "kaleidoscope_tavern:green_bar_stool": "绿色高脚凳",
      "kaleidoscope_tavern:green_sofa": "绿色沙发",
      "kaleidoscope_tavern:cyan_bar_stool": "青色高脚凳",
      "kaleidoscope_tavern:cyan_sofa": "青色沙发",
      "kaleidoscope_tavern:light_blue_bar_stool": "淡蓝色高脚凳",
      "kaleidoscope_tavern:light_blue_sofa": "淡蓝色沙发",
      "kaleidoscope_tavern:blue_bar_stool": "蓝色高脚凳",
      "kaleidoscope_tavern:blue_sofa": "蓝色沙发",
      "kaleidoscope_tavern:purple_bar_stool": "紫色高脚凳",
      "kaleidoscope_tavern:purple_sofa": "紫色沙发",
      "kaleidoscope_tavern:magenta_bar_stool": "品红色高脚凳",
      "kaleidoscope_tavern:magenta_sofa": "品红色沙发",
      "kaleidoscope_tavern:pink_bar_stool": "粉红色高脚凳",
      "kaleidoscope_tavern:pink_sofa": "粉红色沙发",
      "kaleidoscope_tavern:string_lights_colorless": "小灯串（无色）",
      "kaleidoscope_tavern:string_lights_white": "小灯串（白色）",
      "kaleidoscope_tavern:string_lights_light_gray": "小灯串（淡灰色）",
      "kaleidoscope_tavern:string_lights_gray": "小灯串（灰色）",
      "kaleidoscope_tavern:string_lights_black": "小灯串（黑色）",
      "kaleidoscope_tavern:string_lights_brown": "小灯串（棕色）",
      "kaleidoscope_tavern:string_lights_red": "小灯串（红色）",
      "kaleidoscope_tavern:string_lights_orange": "小灯串（橙色）",
      "kaleidoscope_tavern:string_lights_yellow": "小灯串（黄色）",
      "kaleidoscope_tavern:string_lights_lime": "小灯串（黄绿色）",
      "kaleidoscope_tavern:string_lights_green": "小灯串（绿色）",
      "kaleidoscope_tavern:string_lights_cyan": "小灯串（青色）",
      "kaleidoscope_tavern:string_lights_light_blue": "小灯串（淡蓝色）",
      "kaleidoscope_tavern:string_lights_blue": "小灯串（蓝色）",
      "kaleidoscope_tavern:string_lights_purple": "小灯串（紫色）",
      "kaleidoscope_tavern:string_lights_magenta": "小灯串（品红色）",
      "kaleidoscope_tavern:string_lights_pink": "小灯串（粉色）",
      "kaleidoscope_tavern:bell_pendant_lamp": "铃铛垂灯",
      "kaleidoscope_tavern:blue_pendant_lamp": "蓝色垂灯",
      "kaleidoscope_tavern:yellow_pendant_lamp": "黄色垂灯",
      "kaleidoscope_tavern:table": "桌子",
      "kaleidoscope_tavern:bar_counter": "吧台",
      "kaleidoscope_tavern:glassware_holder": "酒杯架",
      "kaleidoscope_tavern:holder": "单体酒架",
      "kaleidoscope_tavern:tilted_rack": "倾斜酒架",
      "kaleidoscope_tavern:circular_rack": "圆周酒架",
      "kaleidoscope_tavern:cellar_cabinet": "窖藏酒柜",
      "kaleidoscope_tavern:bar_cabinet": "酒柜",
      "kaleidoscope_tavern:glass_bar_cabinet": "酒柜（玻璃窗）",
      "kaleidoscope_tavern:ysbb_painting": "挂画・药水棒冰",
      "kaleidoscope_tavern:tartaric_acid_painting": "挂画・酒石酸菌",
      "kaleidoscope_tavern:cr019_painting": "挂画・CR019",
      "kaleidoscope_tavern:unknown_painting": "挂画・Unknown",
      "kaleidoscope_tavern:master_marisa_painting": "挂画・摸里傻",
      "kaleidoscope_tavern:son_of_man_painting": "挂画・人类之子",
      "kaleidoscope_tavern:david_painting": "挂画・大卫",
      "kaleidoscope_tavern:girl_with_pearl_earring_painting": "挂画・戴珍珠耳环的少女",
      "kaleidoscope_tavern:starry_night_painting": "挂画・星夜",
      "kaleidoscope_tavern:van_gogh_self_portrait_painting": "挂画・梵高自画像",
      "kaleidoscope_tavern:father_painting": "挂画・父亲",
      "kaleidoscope_tavern:great_wave_painting": "挂画・神奈川冲浪里",
      "kaleidoscope_tavern:mona_lisa_painting": "挂画・蒙娜丽莎",
      "kaleidoscope_tavern:mondrian_painting": "挂画・蒙德里安",
      "kaleidoscope_tavern:sakura_incense": "樱花香薰",
      "kaleidoscope_tavern:pine_incense": "松木香薰",
      "kaleidoscope_tavern:ginkgo_incense": "银杏香薰",
      "kaleidoscope_tavern:spore_incense": "孢子香薰",
      "kaleidoscope_tavern:catnip_incense": "荆芥香薰",
      "kaleidoscope_tavern:snow_incense": "雪香薰",
      "kaleidoscope_tavern:butterfly_incense": "蝴蝶香薰",
      "kaleidoscope_tavern:firefly_incense": "萤火虫香薰",
      "kaleidoscope_tavern:barrel": "酒桶",
      "kaleidoscope_tavern:tap": "龙头",
      "kaleidoscope_tavern:pressing_tub": "果盆",
      "kaleidoscope_tavern:shaker": "雪克杯",
      "kaleidoscope_tavern:empty_glassware": "空酒杯",
      "kaleidoscope_tavern:stepladder": "人字梯"
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
      "kaleidoscope_tavern:guide_art": "掛畫與裝飾",
      "kaleidoscope_tavern:guide_board_text": "黑板文字與款式",
      "kaleidoscope_tavern:chalkboard": "黑板",
      "kaleidoscope_tavern:base_sandwich_board": "素面立式告示牌",
      "kaleidoscope_tavern:grass_sandwich_board": "草飾立式告示牌",
      "kaleidoscope_tavern:allium_sandwich_board": "紫色絨球蔥飾立式告示牌",
      "kaleidoscope_tavern:azure_bluet_sandwich_board": "藍眼草飾立式告示牌",
      "kaleidoscope_tavern:cornflower_sandwich_board": "矢車菊飾立式告示牌",
      "kaleidoscope_tavern:orchid_sandwich_board": "藍色蝴蝶蘭飾立式告示牌",
      "kaleidoscope_tavern:peony_sandwich_board": "牡丹飾立式告示牌",
      "kaleidoscope_tavern:pink_petals_sandwich_board": "櫻花花瓣飾立式告示牌",
      "kaleidoscope_tavern:pitcher_plant_sandwich_board": "瓶子草飾立式告示牌",
      "kaleidoscope_tavern:poppy_sandwich_board": "虞美人飾立式告示牌",
      "kaleidoscope_tavern:sunflower_sandwich_board": "向日葵飾立式告示牌",
      "kaleidoscope_tavern:torchflower_sandwich_board": "火炬花飾立式告示牌",
      "kaleidoscope_tavern:tulip_sandwich_board": "鬱金香飾立式告示牌",
      "kaleidoscope_tavern:wither_rose_sandwich_board": "凋零玫瑰飾立式告示牌",
      "kaleidoscope_tavern:white_bar_stool": "白色高腳凳",
      "kaleidoscope_tavern:white_sofa": "白色沙发",
      "kaleidoscope_tavern:light_gray_bar_stool": "淺灰色高腳凳",
      "kaleidoscope_tavern:light_gray_sofa": "淡灰色沙发",
      "kaleidoscope_tavern:gray_bar_stool": "灰色高腳凳",
      "kaleidoscope_tavern:gray_sofa": "灰色沙发",
      "kaleidoscope_tavern:black_bar_stool": "黑色高腳凳",
      "kaleidoscope_tavern:black_sofa": "黑色沙发",
      "kaleidoscope_tavern:brown_bar_stool": "棕色高腳凳",
      "kaleidoscope_tavern:brown_sofa": "棕色沙发",
      "kaleidoscope_tavern:red_bar_stool": "紅色高腳凳",
      "kaleidoscope_tavern:red_sofa": "红色沙发",
      "kaleidoscope_tavern:orange_bar_stool": "橙色高腳凳",
      "kaleidoscope_tavern:orange_sofa": "橙色沙发",
      "kaleidoscope_tavern:yellow_bar_stool": "黃色高腳凳",
      "kaleidoscope_tavern:yellow_sofa": "黄色沙发",
      "kaleidoscope_tavern:lime_bar_stool": "淺綠色高腳凳",
      "kaleidoscope_tavern:lime_sofa": "黄绿色沙发",
      "kaleidoscope_tavern:green_bar_stool": "綠色高腳凳",
      "kaleidoscope_tavern:green_sofa": "绿色沙发",
      "kaleidoscope_tavern:cyan_bar_stool": "青色高腳凳",
      "kaleidoscope_tavern:cyan_sofa": "青色沙发",
      "kaleidoscope_tavern:light_blue_bar_stool": "淺藍色高腳凳",
      "kaleidoscope_tavern:light_blue_sofa": "淡蓝色沙发",
      "kaleidoscope_tavern:blue_bar_stool": "藍色高腳凳",
      "kaleidoscope_tavern:blue_sofa": "蓝色沙发",
      "kaleidoscope_tavern:purple_bar_stool": "紫色高腳凳",
      "kaleidoscope_tavern:purple_sofa": "紫色沙发",
      "kaleidoscope_tavern:magenta_bar_stool": "洋紅色高腳凳",
      "kaleidoscope_tavern:magenta_sofa": "品红色沙发",
      "kaleidoscope_tavern:pink_bar_stool": "粉紅色高腳凳",
      "kaleidoscope_tavern:pink_sofa": "粉红色沙发",
      "kaleidoscope_tavern:string_lights_colorless": "無色彩燈",
      "kaleidoscope_tavern:string_lights_white": "白色彩燈",
      "kaleidoscope_tavern:string_lights_light_gray": "淺灰色彩燈",
      "kaleidoscope_tavern:string_lights_gray": "灰色彩燈",
      "kaleidoscope_tavern:string_lights_black": "黑色彩燈",
      "kaleidoscope_tavern:string_lights_brown": "棕色彩燈",
      "kaleidoscope_tavern:string_lights_red": "紅色彩燈",
      "kaleidoscope_tavern:string_lights_orange": "橙色彩燈",
      "kaleidoscope_tavern:string_lights_yellow": "黃色彩燈",
      "kaleidoscope_tavern:string_lights_lime": "淺綠色彩燈",
      "kaleidoscope_tavern:string_lights_green": "綠色彩燈",
      "kaleidoscope_tavern:string_lights_cyan": "青色彩燈",
      "kaleidoscope_tavern:string_lights_light_blue": "淺藍色彩燈",
      "kaleidoscope_tavern:string_lights_blue": "藍色彩燈",
      "kaleidoscope_tavern:string_lights_purple": "紫色彩燈",
      "kaleidoscope_tavern:string_lights_magenta": "洋紅色彩燈",
      "kaleidoscope_tavern:string_lights_pink": "粉紅色彩燈",
      "kaleidoscope_tavern:bell_pendant_lamp": "铃铛垂灯",
      "kaleidoscope_tavern:blue_pendant_lamp": "蓝色垂灯",
      "kaleidoscope_tavern:yellow_pendant_lamp": "黄色垂灯",
      "kaleidoscope_tavern:table": "桌子",
      "kaleidoscope_tavern:bar_counter": "吧台",
      "kaleidoscope_tavern:glassware_holder": "酒杯架",
      "kaleidoscope_tavern:holder": "单体酒架",
      "kaleidoscope_tavern:tilted_rack": "倾斜酒架",
      "kaleidoscope_tavern:circular_rack": "圆周酒架",
      "kaleidoscope_tavern:cellar_cabinet": "窖藏酒柜",
      "kaleidoscope_tavern:bar_cabinet": "酒柜",
      "kaleidoscope_tavern:glass_bar_cabinet": "酒柜（玻璃窗）",
      "kaleidoscope_tavern:ysbb_painting": "掛畫・藥水棒冰",
      "kaleidoscope_tavern:tartaric_acid_painting": "掛畫・酒石酸菌",
      "kaleidoscope_tavern:cr019_painting": "掛畫・CR019",
      "kaleidoscope_tavern:unknown_painting": "掛畫・Unknown",
      "kaleidoscope_tavern:master_marisa_painting": "掛畫・摸里傻",
      "kaleidoscope_tavern:son_of_man_painting": "掛畫・人類之子",
      "kaleidoscope_tavern:david_painting": "掛畫・大衛",
      "kaleidoscope_tavern:girl_with_pearl_earring_painting": "掛畫・戴珍珠耳環的少女",
      "kaleidoscope_tavern:starry_night_painting": "掛畫・星夜",
      "kaleidoscope_tavern:van_gogh_self_portrait_painting": "掛畫・梵谷自畫像",
      "kaleidoscope_tavern:father_painting": "掛畫・父親",
      "kaleidoscope_tavern:great_wave_painting": "掛畫・神奈川沖浪裏",
      "kaleidoscope_tavern:mona_lisa_painting": "掛畫・蒙娜麗莎",
      "kaleidoscope_tavern:mondrian_painting": "掛畫・蒙德里安",
      "kaleidoscope_tavern:sakura_incense": "櫻花香薰",
      "kaleidoscope_tavern:pine_incense": "松木香薰",
      "kaleidoscope_tavern:ginkgo_incense": "銀杏香薰",
      "kaleidoscope_tavern:spore_incense": "孢子香薰",
      "kaleidoscope_tavern:catnip_incense": "荊芥香薰",
      "kaleidoscope_tavern:snow_incense": "雪香薰",
      "kaleidoscope_tavern:butterfly_incense": "蝶蝶香薰",
      "kaleidoscope_tavern:firefly_incense": "螢火香薰",
      "kaleidoscope_tavern:barrel": "酒桶",
      "kaleidoscope_tavern:tap": "酒嘴",
      "kaleidoscope_tavern:pressing_tub": "壓榨桶",
      "kaleidoscope_tavern:shaker": "雪克杯",
      "kaleidoscope_tavern:empty_glassware": "空雞尾酒杯",
      "kaleidoscope_tavern:stepladder": "人字梯"
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
      "kaleidoscope_tavern:guide_art": "Paintings & decor",
      "kaleidoscope_tavern:guide_board_text": "Board Text and Styles",
      "kaleidoscope_tavern:chalkboard": "Chalkboard",
      "kaleidoscope_tavern:base_sandwich_board": "Plain Sandwich Board",
      "kaleidoscope_tavern:grass_sandwich_board": "Grass Sandwich Board",
      "kaleidoscope_tavern:allium_sandwich_board": "Allium Sandwich Board",
      "kaleidoscope_tavern:azure_bluet_sandwich_board": "Azure Bluet Sandwich Board",
      "kaleidoscope_tavern:cornflower_sandwich_board": "Cornflower Sandwich Board",
      "kaleidoscope_tavern:orchid_sandwich_board": "Orchid Sandwich Board",
      "kaleidoscope_tavern:peony_sandwich_board": "Peony Sandwich Board",
      "kaleidoscope_tavern:pink_petals_sandwich_board": "Pink Petals Sandwich Board",
      "kaleidoscope_tavern:pitcher_plant_sandwich_board": "Pitcher Plant Sandwich Board",
      "kaleidoscope_tavern:poppy_sandwich_board": "Poppy Sandwich Board",
      "kaleidoscope_tavern:sunflower_sandwich_board": "Sunflower Sandwich Board",
      "kaleidoscope_tavern:torchflower_sandwich_board": "Torchflower Sandwich Board",
      "kaleidoscope_tavern:tulip_sandwich_board": "Tulip Sandwich Board",
      "kaleidoscope_tavern:wither_rose_sandwich_board": "Wither Rose Sandwich Board",
      "kaleidoscope_tavern:white_bar_stool": "White Bar Stool",
      "kaleidoscope_tavern:white_sofa": "White Sofa",
      "kaleidoscope_tavern:light_gray_bar_stool": "Light Gray Bar Stool",
      "kaleidoscope_tavern:light_gray_sofa": "Light Gray Sofa",
      "kaleidoscope_tavern:gray_bar_stool": "Gray Bar Stool",
      "kaleidoscope_tavern:gray_sofa": "Gray Sofa",
      "kaleidoscope_tavern:black_bar_stool": "Black Bar Stool",
      "kaleidoscope_tavern:black_sofa": "Black Sofa",
      "kaleidoscope_tavern:brown_bar_stool": "Brown Bar Stool",
      "kaleidoscope_tavern:brown_sofa": "Brown Sofa",
      "kaleidoscope_tavern:red_bar_stool": "Red Bar Stool",
      "kaleidoscope_tavern:red_sofa": "Red Sofa",
      "kaleidoscope_tavern:orange_bar_stool": "Orange Bar Stool",
      "kaleidoscope_tavern:orange_sofa": "Orange Sofa",
      "kaleidoscope_tavern:yellow_bar_stool": "Yellow Bar Stool",
      "kaleidoscope_tavern:yellow_sofa": "Yellow Sofa",
      "kaleidoscope_tavern:lime_bar_stool": "Lime Bar Stool",
      "kaleidoscope_tavern:lime_sofa": "Lime Sofa",
      "kaleidoscope_tavern:green_bar_stool": "Green Bar Stool",
      "kaleidoscope_tavern:green_sofa": "Green Sofa",
      "kaleidoscope_tavern:cyan_bar_stool": "Cyan Bar Stool",
      "kaleidoscope_tavern:cyan_sofa": "Cyan Sofa",
      "kaleidoscope_tavern:light_blue_bar_stool": "Light Blue Bar Stool",
      "kaleidoscope_tavern:light_blue_sofa": "Light Blue Sofa",
      "kaleidoscope_tavern:blue_bar_stool": "Blue Bar Stool",
      "kaleidoscope_tavern:blue_sofa": "Blue Sofa",
      "kaleidoscope_tavern:purple_bar_stool": "Purple Bar Stool",
      "kaleidoscope_tavern:purple_sofa": "Purple Sofa",
      "kaleidoscope_tavern:magenta_bar_stool": "Magenta Bar Stool",
      "kaleidoscope_tavern:magenta_sofa": "Magenta Sofa",
      "kaleidoscope_tavern:pink_bar_stool": "Pink Bar Stool",
      "kaleidoscope_tavern:pink_sofa": "Pink Sofa",
      "kaleidoscope_tavern:string_lights_colorless": "String Lights (Colorless)",
      "kaleidoscope_tavern:string_lights_white": "String Lights (White)",
      "kaleidoscope_tavern:string_lights_light_gray": "String Lights (Light Gray)",
      "kaleidoscope_tavern:string_lights_gray": "String Lights (Gray)",
      "kaleidoscope_tavern:string_lights_black": "String Lights (Black)",
      "kaleidoscope_tavern:string_lights_brown": "String Lights (Brown)",
      "kaleidoscope_tavern:string_lights_red": "String Lights (Red)",
      "kaleidoscope_tavern:string_lights_orange": "String Lights (Orange)",
      "kaleidoscope_tavern:string_lights_yellow": "String Lights (Yellow)",
      "kaleidoscope_tavern:string_lights_lime": "String Lights (Lime)",
      "kaleidoscope_tavern:string_lights_green": "String Lights (Green)",
      "kaleidoscope_tavern:string_lights_cyan": "String Lights (Cyan)",
      "kaleidoscope_tavern:string_lights_light_blue": "String Lights (Light Blue)",
      "kaleidoscope_tavern:string_lights_blue": "String Lights (Blue)",
      "kaleidoscope_tavern:string_lights_purple": "String Lights (Purple)",
      "kaleidoscope_tavern:string_lights_magenta": "String Lights (Magenta)",
      "kaleidoscope_tavern:string_lights_pink": "String Lights (Pink)",
      "kaleidoscope_tavern:bell_pendant_lamp": "Bell Pendant Lamp",
      "kaleidoscope_tavern:blue_pendant_lamp": "Blue Pendant Lamp",
      "kaleidoscope_tavern:yellow_pendant_lamp": "Yellow Pendant Lamp",
      "kaleidoscope_tavern:table": "Table",
      "kaleidoscope_tavern:bar_counter": "Bar Counter",
      "kaleidoscope_tavern:glassware_holder": "Glassware Holder",
      "kaleidoscope_tavern:holder": "Bottle Holder",
      "kaleidoscope_tavern:tilted_rack": "Tilted Rack",
      "kaleidoscope_tavern:circular_rack": "Circular Rack",
      "kaleidoscope_tavern:cellar_cabinet": "Cellar Cabinet",
      "kaleidoscope_tavern:bar_cabinet": "Bar Cabinet",
      "kaleidoscope_tavern:glass_bar_cabinet": "Glass Bar Cabinet",
      "kaleidoscope_tavern:ysbb_painting": "Painting · YSBB",
      "kaleidoscope_tavern:tartaric_acid_painting": "Painting · Tartaric Acid",
      "kaleidoscope_tavern:cr019_painting": "Painting · CR019",
      "kaleidoscope_tavern:unknown_painting": "Painting · Unknown",
      "kaleidoscope_tavern:master_marisa_painting": "Painting · Master Marisa",
      "kaleidoscope_tavern:son_of_man_painting": "Painting · Son of Man",
      "kaleidoscope_tavern:david_painting": "Painting · David",
      "kaleidoscope_tavern:girl_with_pearl_earring_painting": "Painting · Girl with a Pearl Earring",
      "kaleidoscope_tavern:starry_night_painting": "Painting · Starry Night",
      "kaleidoscope_tavern:van_gogh_self_portrait_painting": "Painting · Van Gogh Self-Portrait",
      "kaleidoscope_tavern:father_painting": "Painting · Father",
      "kaleidoscope_tavern:great_wave_painting": "Painting · The Great Wave off Kanagawa",
      "kaleidoscope_tavern:mona_lisa_painting": "Painting · Mona Lisa",
      "kaleidoscope_tavern:mondrian_painting": "Painting · Mondrian",
      "kaleidoscope_tavern:sakura_incense": "Sakura Incense",
      "kaleidoscope_tavern:pine_incense": "Pine Incense",
      "kaleidoscope_tavern:ginkgo_incense": "Ginkgo Incense",
      "kaleidoscope_tavern:spore_incense": "Spore Incense",
      "kaleidoscope_tavern:catnip_incense": "Catnip Incense",
      "kaleidoscope_tavern:snow_incense": "Snow Incense",
      "kaleidoscope_tavern:butterfly_incense": "Butterfly Incense",
      "kaleidoscope_tavern:firefly_incense": "Firefly Incense",
      "kaleidoscope_tavern:barrel": "Barrel",
      "kaleidoscope_tavern:tap": "Tap",
      "kaleidoscope_tavern:pressing_tub": "Pressing Tub",
      "kaleidoscope_tavern:shaker": "Shaker",
      "kaleidoscope_tavern:empty_glassware": "Empty Glassware",
      "kaleidoscope_tavern:stepladder": "Stepladder"
    }
  },
  "text": {
    "zh_CN": {
      "title": "森罗物语：酒馆",
      "intro": "按分类查阅酒馆设备、酿酒配方、鸡尾酒、水果处理、收纳与装饰。选择条目可查看操作方式与配方。",
      "all": "全部条目",
      "select": "选择要查阅的项目。",
      "back": "返回",
      "language_note": "每种酒、鸡尾酒和家具都有独立条目。",
      "brewing": "酿酒入门",
      "mixology": "调酒与酒效",
      "tavern": "酒馆设备",
      "equipment": "酿造设备",
      "barrel": "酒桶酿酒百科",
      "cocktail": "调酒百科",
      "storage": "收纳与实用",
      "cultivation": "种植与收获",
      "decor": "装饰与氛围",
      "gear": "酿造设备",
      "mix_tools": "调酒设备",
      "press": "压榨桶与榨汁",
      "barrel_drinks": "酒桶酒款与配方",
      "cocktail_recipes": "鸡尾酒配方",
      "drink_effects": "各酒款品质效果",
      "store": "酒瓶收纳",
      "serve": "取酒与摆瓶",
      "fruit": "果盆、水果与来源",
      "press_recipes": "果汁配方",
      "furniture": "家具与座位",
      "lighting": "灯饰",
      "incense": "香薰",
      "art": "挂画",
      "ladder": "人字梯",
      "boards": "黑板与立式告示牌"
    },
    "zh_TW": {
      "title": "森羅物語：酒館",
      "intro": "依分類查閱酒館設備、釀酒配方、雞尾酒、果實處理、收納與裝飾。選擇條目可查看操作方式與配方。",
      "all": "全部條目",
      "select": "選擇要查閱的項目。",
      "back": "返回",
      "language_note": "個別酒款、雞尾酒與家具都有獨立條目。",
      "brewing": "釀酒入門",
      "mixology": "調酒與酒效",
      "tavern": "酒館設備",
      "equipment": "釀造設備",
      "barrel": "酒桶釀造百科",
      "cocktail": "調酒百科",
      "storage": "收納與實用",
      "cultivation": "種植與收穫",
      "decor": "裝飾與氛圍",
      "gear": "釀造設備",
      "mix_tools": "調酒設備",
      "press": "壓榨桶與榨汁",
      "barrel_drinks": "酒桶酒款與配方",
      "cocktail_recipes": "雞尾酒配方",
      "drink_effects": "各酒款品質效果",
      "store": "酒瓶收納",
      "serve": "取酒與擺瓶",
      "fruit": "果盆、水果與來源",
      "press_recipes": "果汁配方",
      "furniture": "家具與座位",
      "lighting": "燈飾",
      "incense": "香薰",
      "art": "掛畫",
      "ladder": "人字梯",
      "boards": "黑板與立式告示牌"
    },
    "en_US": {
      "title": "Kaleidoscope Tavern",
      "intro": "Browse tavern equipment, barrel drinks, cocktails, fruit processing, storage and decor by category. Open an entry for its steps and recipe.",
      "all": "All entries",
      "select": "Choose an entry.",
      "back": "Back",
      "language_note": "Each drink, cocktail and furniture piece has its own entry.",
      "brewing": "Brewing basics",
      "mixology": "Mixology & effects",
      "tavern": "Tavern equipment",
      "equipment": "Brewing Equipment",
      "barrel": "Barrel Brewing Encyclopedia",
      "cocktail": "Mixology Encyclopedia",
      "storage": "Storage and Utility",
      "cultivation": "Growing and Harvesting",
      "decor": "Decor and Ambience",
      "gear": "Brewing Equipment",
      "mix_tools": "Mixology Equipment",
      "press": "Fruit Pressing",
      "barrel_drinks": "Barrel Drinks and Recipes",
      "cocktail_recipes": "Cocktail Recipes",
      "drink_effects": "Drink Quality Effects",
      "store": "Bottle Storage",
      "serve": "Serving and Displays",
      "fruit": "Fruit Baskets, Fruit and Sources",
      "press_recipes": "Juice Recipes",
      "furniture": "Furniture and Seating",
      "lighting": "Lighting",
      "incense": "Incense",
      "art": "Paintings",
      "ladder": "Stepladders",
      "boards": "Chalkboards and Sandwich Boards"
    }
  }
};
const GUIDE_LOCALES=['zh_CN','zh_TW','en_US'];
// Replaced at package build from the existing Tavern/Cookery language files.
const GUIDE_ITEM_NAMES={"zh_CN":{"minecraft:apple":"苹果","minecraft:bell":"钟","minecraft:blaze_powder":"烈焰粉","minecraft:bucket":"空桶","minecraft:diamond":"钻石","minecraft:glow_ink_sac":"荧光墨囊","minecraft:end_rod":"末地烛","minecraft:ender_pearl":"末影珍珠","minecraft:glass_bottle":"玻璃瓶","minecraft:gold_nugget":"金粒","minecraft:iron_nugget":"铁粒","minecraft:iron_hoe":"铁锄","minecraft:honeycomb":"蜜脾","minecraft:iron_ingot":"铁锭","minecraft:painting":"画","minecraft:potato":"马铃薯","minecraft:redstone":"红石粉","minecraft:snowball":"雪球","minecraft:sugar":"糖","minecraft:gunpowder":"火药","minecraft:wheat":"小麦","minecraft:glowstone_dust":"荧石粉","minecraft:sweet_berries":"甜莓","minecraft:mangrove_fence":"红树木栅栏","minecraft:mangrove_trapdoor":"红树木活板门","minecraft:echo_shard":"回响碎片","minecraft:bamboo_fence":"竹制栅栏","minecraft:bamboo_trapdoor":"竹制活板门","minecraft:cherry_fence":"樱花木栅栏","minecraft:cherry_sapling":"樱花树苗","minecraft:cherry_trapdoor":"樱花木活板门","minecraft:pink_petals":"粉红色花瓣","minecraft:spore_blossom":"孢子花","minecraft:glow_berries":"螢光莓","minecraft:crimson_trapdoor":"绯红木活板门","minecraft:warped_trapdoor":"诡异木活板门","minecraft:crimson_fence":"绯红木栅栏","minecraft:warped_fence":"诡异木栅栏","minecraft:chain":"锁链","minecraft:wither_rose":"凋零玫瑰","minecraft:grass":"草方块","minecraft:hopper":"漏斗","minecraft:ice":"冰","minecraft:packed_ice":"浮冰","minecraft:blue_ice":"蓝冰","minecraft:iron_trapdoor":"铁活板门","minecraft:ladder":"梯子","minecraft:lava":"熔岩","minecraft:lever":"拉杆","minecraft:nether_brick_fence":"下界砖栅栏","minecraft:glass_pane":"玻璃板","minecraft:trapdoor":"橡木活板门","minecraft:acacia_trapdoor":"金合欢木活板门","minecraft:birch_trapdoor":"白桦木活板门","minecraft:dark_oak_trapdoor":"深色橡木活板门","minecraft:jungle_trapdoor":"丛林木活板门","minecraft:spruce_trapdoor":"云杉木活板门","minecraft:vine":"藤蔓","minecraft:water":"水","minecraft:lantern":"灯","minecraft:soul_lantern":"灵魂灯","minecraft:barrel":"木桶","minecraft:pitcher_plant":"猪笼草","minecraft:torchflower":"火把花","minecraft:copper_trapdoor":"铜活板门","minecraft:exposed_copper_trapdoor":"斑驳铜活板门","minecraft:oxidized_copper_trapdoor":"氧化铜活板门","minecraft:waxed_copper_trapdoor":"涂蜡铜活板门","minecraft:waxed_exposed_copper_trapdoor":"涂蜡斑驳铜活板门","minecraft:waxed_oxidized_copper_trapdoor":"涂蜡氧化铜活板门","minecraft:waxed_weathered_copper_trapdoor":"涂蜡风化铜活板门","minecraft:weathered_copper_trapdoor":"风化铜活板门","minecraft:sugar_cane":"甘蔗","minecraft:potion":"药水","kaleidoscope_cookery:apple_platter":"苹果拼盘","kaleidoscope_cookery:bamboo_tube_rice":"竹筒饭","kaleidoscope_cookery:baozi":"包子","kaleidoscope_cookery:baozi_plate":"一盘包子","kaleidoscope_cookery:barley_tea":"大麦茶","kaleidoscope_cookery:beef_meatball_soup":"牛丸汤","kaleidoscope_cookery:beef_noodle":"牛肉面","kaleidoscope_cookery:berry_platter":"浆果拼盘","kaleidoscope_cookery:biluochun":"碧螺春","kaleidoscope_cookery:blaze_lamb_chop":"烈焰羊排","kaleidoscope_cookery:borscht":"罗宋汤","kaleidoscope_cookery:braised_beef":"红烧牛肉","kaleidoscope_cookery:braised_beef_rice_bowl":"红烧牛肉盖饭","kaleidoscope_cookery:braised_beef_with_potatoes":"土豆炖牛肉","kaleidoscope_cookery:braised_pork_ribs":"红烧排骨","kaleidoscope_cookery:brown_mushroom_pot_soup":"棕蘑菇瓦罐汤","kaleidoscope_cookery:buddha_jumps_over_the_wall":"佛跳墙","kaleidoscope_cookery:candied_potato":"拔丝土豆","kaleidoscope_cookery:caterpillar":"猪儿虫","kaleidoscope_cookery:chair_acacia":"金合欢木椅子","kaleidoscope_cookery:chair_bamboo":"竹椅子","kaleidoscope_cookery:chair_birch":"白桦木椅子","kaleidoscope_cookery:chair_cherry":"樱花木椅子","kaleidoscope_cookery:chair_crimson":"绯红木椅子","kaleidoscope_cookery:chair_dark_oak":"深色橡木椅子","kaleidoscope_cookery:chair_jungle":"丛林木椅子","kaleidoscope_cookery:chair_mangrove":"红树木椅子","kaleidoscope_cookery:chair_oak":"橡木椅子","kaleidoscope_cookery:chair_spruce":"云杉木椅子","kaleidoscope_cookery:chair_warped":"诡异木椅子","kaleidoscope_cookery:chicken_and_mushroom_stew":"小鸡炖蘑菇","kaleidoscope_cookery:chili_seed":"辣椒种子","kaleidoscope_cookery:chili_ristra":"辣椒串串","kaleidoscope_cookery:chopping_board":"菜板","kaleidoscope_cookery:chorus_fried_egg":"荷包紫颂烧","kaleidoscope_cookery:chorus_fruit_platter":"紫颂果拼盘","kaleidoscope_cookery:cold_cut_ham_slices":"冷切火腿片","kaleidoscope_cookery:cold_roasted_meat":"冷肉炙","kaleidoscope_cookery:cold_style_sashimi":"寒带风味刺身","kaleidoscope_cookery:cook_stool_acacia":"金合欢木厨娘凳","kaleidoscope_cookery:cook_stool_bamboo":"竹厨娘凳","kaleidoscope_cookery:cook_stool_birch":"白桦木厨娘凳","kaleidoscope_cookery:cook_stool_cherry":"樱花木厨娘凳","kaleidoscope_cookery:cook_stool_crimson":"绯红木厨娘凳","kaleidoscope_cookery:cook_stool_dark_oak":"深色橡木厨娘凳","kaleidoscope_cookery:cook_stool_jungle":"丛林木厨娘凳","kaleidoscope_cookery:cook_stool_mangrove":"红树木厨娘凳","kaleidoscope_cookery:cook_stool_oak":"橡木厨娘凳","kaleidoscope_cookery:cook_stool_spruce":"云杉木厨娘凳","kaleidoscope_cookery:cook_stool_warped":"诡异木厨娘凳","kaleidoscope_cookery:cooked_cow_offal":"熟牛杂","kaleidoscope_cookery:cooked_cut_small_meats":"熟切制小肉","kaleidoscope_cookery:cooked_lamb_chops":"熟羊排","kaleidoscope_cookery:cooked_meatball":"熟丸子","kaleidoscope_cookery:cooked_pork_belly":"熟五花肉","kaleidoscope_cookery:cooked_rice":"米饭","kaleidoscope_cookery:crimson_fungus_pot_soup":"绯红菌瓦罐汤","kaleidoscope_cookery:crystal_lamb_chop":"水晶羊排","kaleidoscope_cookery:dark_cuisine":"黑暗料理","kaleidoscope_cookery:desert_style_sashimi":"沙漠风味刺身","kaleidoscope_cookery:diamond_kitchen_knife":"钻石菜刀","kaleidoscope_cookery:dongpo_pork":"东坡肉","kaleidoscope_cookery:donkey_burger":"驴肉火烧","kaleidoscope_cookery:dough_drop_soup":"疙瘩汤","kaleidoscope_cookery:dumpling":"饺子","kaleidoscope_cookery:egg_fried_rice":"蛋炒饭","kaleidoscope_cookery:empty_cup":"空茶杯","kaleidoscope_cookery:enamel_basin":"搪瓷盆子","kaleidoscope_cookery:end_style_sashimi":"末地风味刺身","kaleidoscope_cookery:farmer_boots":"农夫靴子","kaleidoscope_cookery:farmer_chest_plate":"农夫工装背带裤","kaleidoscope_cookery:farmer_leggings":"农夫工作裤","kaleidoscope_cookery:fearsome_thick_soup":"恐惧浓汤","kaleidoscope_cookery:fish_flavored_shredded_pork":"鱼香肉丝","kaleidoscope_cookery:fish_flavored_shredded_pork_rice_bowl":"鱼香肉丝盖饭","kaleidoscope_cookery:flour":"面粉","kaleidoscope_cookery:flower_tea":"花茶","kaleidoscope_cookery:fondant_pie":"翻糖派","kaleidoscope_cookery:fondant_spider_eye":"翻糖蛛眼","kaleidoscope_cookery:four_joy_meatball_soup":"四喜丸子汤","kaleidoscope_cookery:fried_caterpillar":"油炸猪儿虫","kaleidoscope_cookery:fried_egg":"煎蛋","kaleidoscope_cookery:fried_spring_roll":"炸春卷","kaleidoscope_cookery:frost_lamb_chop":"凛冬羊排","kaleidoscope_cookery:fruit_basket":"果篮","kaleidoscope_cookery:gold_kitchen_knife":"金菜刀","kaleidoscope_cookery:golden_salad":"黄金沙拉","kaleidoscope_cookery:green_chili":"青辣椒","kaleidoscope_cookery:hot_dry_noodles":"热干面","kaleidoscope_cookery:hui_noodle":"羊肉烩面","kaleidoscope_cookery:iron_kitchen_knife":"铁菜刀","kaleidoscope_cookery:kitchen_shovel":"锅铲","kaleidoscope_cookery:kitchen_shovel_has_oil":"锅铲(蘸油)","kaleidoscope_cookery:kitchenware_racks":"厨具架","kaleidoscope_cookery:laba_congee":"腊八粥","kaleidoscope_cookery:lamb_and_radish_soup":"萝卜羊肉汤","kaleidoscope_cookery:lettuce":"生菜","kaleidoscope_cookery:lettuce_seed":"生菜种子","kaleidoscope_cookery:mantou":"馒头","kaleidoscope_cookery:meat_pie":"馅饼","kaleidoscope_cookery:millstone":"石磨","kaleidoscope_cookery:nether_style_sashimi":"下界风味刺身","kaleidoscope_cookery:netherite_kitchen_knife":"下界合金菜刀","kaleidoscope_cookery:numbing_spicy_chicken":"椒麻鸡","kaleidoscope_cookery:oil":"油脂","kaleidoscope_cookery:oil_block":"油脂块","kaleidoscope_cookery:oil_pot":"油壶","kaleidoscope_cookery:oil_splashed_fish":"油泼鱼","kaleidoscope_cookery:oolong":"乌龙茶","kaleidoscope_cookery:pan_seared_knight_steak":"香煎骑士牛排","kaleidoscope_cookery:pork_bone_soup":"大骨汤","kaleidoscope_cookery:pot":"炒锅","kaleidoscope_cookery:pufferfish_soup":"河豚汤","kaleidoscope_cookery:qingtuan":"青团","kaleidoscope_cookery:qingtuan_plate":"一盘青团","kaleidoscope_cookery:raw_bamboo_tube_rice":"生竹筒饭","kaleidoscope_cookery:raw_cow_offal":"生牛杂","kaleidoscope_cookery:raw_cut_small_meats":"生切制小肉","kaleidoscope_cookery:raw_dough":"生面团","kaleidoscope_cookery:raw_lamb_chops":"生羊排","kaleidoscope_cookery:raw_meatball":"生丸子","kaleidoscope_cookery:raw_noodles":"生面条","kaleidoscope_cookery:raw_pork_belly":"生五花肉","kaleidoscope_cookery:raw_zongzi":"生粽子","kaleidoscope_cookery:red_chili":"红辣椒","kaleidoscope_cookery:red_mushroom_pot_soup":"红蘑菇瓦罐汤","kaleidoscope_cookery:rice":"稻米","kaleidoscope_cookery:rice_panicle":"稻穗","kaleidoscope_cookery:sakura_fubuki":"樱吹雪","kaleidoscope_cookery:samsa":"烤包子","kaleidoscope_cookery:sashimi":"刺身","kaleidoscope_cookery:scarecrow":"稻草人","kaleidoscope_cookery:scramble_egg_with_tomatoes":"番茄炒蛋","kaleidoscope_cookery:scramble_egg_with_tomatoes_rice_bowl":"番茄炒蛋盖饭","kaleidoscope_cookery:seafood_miso_soup":"海鲜味噌汤","kaleidoscope_cookery:shawarma_spit":"旋风烤肉塔","kaleidoscope_cookery:shengjian_mantou":"水煎包","kaleidoscope_cookery:shengjian_mantou_plate":"一盘水煎包","kaleidoscope_cookery:sickle":"镰刀","kaleidoscope_cookery:slime_ball_meal":"黏液饭","kaleidoscope_cookery:spicy_blood_stew":"毛血旺","kaleidoscope_cookery:spicy_chicken":"辣子鸡","kaleidoscope_cookery:spicy_rabbit_head":"麻辣兔头","kaleidoscope_cookery:stargazy_pie":"仰望星空派","kaleidoscope_cookery:steamer":"蒸笼","kaleidoscope_cookery:sticky_candy":"牛皮糖","kaleidoscope_cookery:sticky_candy_plate":"一盘牛皮糖","kaleidoscope_cookery:sticky_rice_cake":"糍粑","kaleidoscope_cookery:sticky_rice_cake_plate":"一盘糍粑","kaleidoscope_cookery:stir_fried_pork_with_peppers":"青椒炒肉","kaleidoscope_cookery:stir_fried_pork_with_peppers_rice_bowl":"青椒炒肉盖饭","kaleidoscope_cookery:stockpot":"汤锅","kaleidoscope_cookery:stockpot_lid":"汤锅盖","kaleidoscope_cookery:stove":"炉灶","kaleidoscope_cookery:straw_block":"稻草捆","kaleidoscope_cookery:straw_hat":"草帽","kaleidoscope_cookery:straw_hat_flower":"花饰草帽","kaleidoscope_cookery:strung_mushrooms":"蘑菇串串","kaleidoscope_cookery:stuffed_dough_food":"裹馅面食","kaleidoscope_cookery:stuffed_tiger_skin_pepper":"虎皮青椒酿肉","kaleidoscope_cookery:suspicious_stir_fry":"谜之炒菜","kaleidoscope_cookery:sweet_and_sour_ender_pearls":"荷包紫颂烧","kaleidoscope_cookery:sweet_and_sour_pork":"糖醋里脊","kaleidoscope_cookery:sweet_and_sour_pork_rice_bowl":"糖醋里脊盖饭","kaleidoscope_cookery:table_acacia":"金合欢木餐桌","kaleidoscope_cookery:table_bamboo":"竹餐桌","kaleidoscope_cookery:table_birch":"白桦木餐桌","kaleidoscope_cookery:table_cherry":"樱花木餐桌","kaleidoscope_cookery:table_crimson":"绯红木餐桌","kaleidoscope_cookery:table_dark_oak":"深色橡木餐桌","kaleidoscope_cookery:table_jungle":"丛林木餐桌","kaleidoscope_cookery:table_mangrove":"红树木餐桌","kaleidoscope_cookery:table_oak":"橡木餐桌","kaleidoscope_cookery:table_spruce":"云杉木餐桌","kaleidoscope_cookery:table_warped":"诡异木餐桌","kaleidoscope_cookery:teapot":"Teapot","kaleidoscope_cookery:tieguanyin":"铁观音","kaleidoscope_cookery:tomato":"番茄","kaleidoscope_cookery:tomato_seed":"番茄种子","kaleidoscope_cookery:tomato_platter":"番茄拼盘","kaleidoscope_cookery:transmutation_lunch_bag":"嬗变饭袋","kaleidoscope_cookery:trash_can":"垃圾桶","kaleidoscope_cookery:tundra_style_sashimi":"苔原风味刺身","kaleidoscope_cookery:udon_noodle":"乌冬面","kaleidoscope_cookery:warped_fungus_pot_soup":"诡异菌瓦罐汤","kaleidoscope_cookery:watermelon_platter":"西瓜拼盘","kaleidoscope_cookery:wild_mushroom_rabbit_soup":"野菌兔肉汤","kaleidoscope_cookery:wild_rice":"野生稻米","kaleidoscope_cookery:zongzi":"熟粽子","kaleidoscope_cookery:zongzi_plate":"一盘粽子","kaleidoscope_cookery:oil_pot_filled":"装满的油壶","kaleidoscope_cookery:raw_donkey_meat":"生驴肉","kaleidoscope_cookery:cooked_donkey_meat":"熟驴肉","kaleidoscope_cookery:donkey_soup":"驴肉汤","kaleidoscope_cookery:braised_fish_rice_bowl":"红烧鱼盖饭","kaleidoscope_cookery:spicy_chicken_rice_bowl":"辣子鸡盖饭","kaleidoscope_cookery:delicious_egg_fried_rice":"美味蛋炒饭","kaleidoscope_cookery:suspicious_stir_fry_rice_bowl":"谜之炒菜盖饭","kaleidoscope_cookery:country_style_mixed_vegetables":"田园杂蔬","kaleidoscope_cookery:yakitori":"烧鸟串","kaleidoscope_cookery:braised_fish":"红烧鱼","kaleidoscope_cookery:tomato_beef_brisket_soup":"番茄牛腩汤","kaleidoscope_cookery:stir_fried_beef_offal":"爆炒牛杂","kaleidoscope_cookery:stir_fried_beef_offal_rice_bowl":"爆炒牛杂盖饭","kaleidoscope_cookery:fruit_platter":"浆果拼盘","kaleidoscope_cookery:stockpot_lid_visual":"汤锅盖","kaleidoscope_cookery:scarecrow_lantern_light":"灯笼稻草人","kaleidoscope_cookery:scarecrow_soul_lantern_light":"灵魂灯笼稻草人","kaleidoscope_cookery:guidebook":"Guidebook","kaleidoscope_cookery:master_recipe_page":"Master Recipe Page","kaleidoscope_cookery:rack_trident_display_item":"Rack Trident Display Item","kaleidoscope_cookery:recipe_page_beef_noodle":"Recipe Page Beef Noodle","kaleidoscope_cookery:recipe_page_blaze_lamb_chop":"Recipe Page Blaze Lamb Chop","kaleidoscope_cookery:recipe_page_borscht":"Recipe Page Borscht","kaleidoscope_cookery:recipe_page_braised_beef":"Recipe Page Braised Beef","kaleidoscope_cookery:recipe_page_brown_mushroom_pot_soup":"Recipe Page Brown Mushroom Pot Soup","kaleidoscope_cookery:recipe_page_buddha_jumps_over_the_wall":"Recipe Page Buddha Jumps Over The Wall","kaleidoscope_cookery:recipe_page_candied_potato":"Recipe Page Candied Potato","kaleidoscope_cookery:recipe_page_chorus_fried_egg":"Recipe Page Chorus Fried Egg","kaleidoscope_cookery:recipe_page_crimson_fungus_pot_soup":"Recipe Page Crimson Fungus Pot Soup","kaleidoscope_cookery:recipe_page_crystal_lamb_chop":"Recipe Page Crystal Lamb Chop","kaleidoscope_cookery:recipe_page_dongpo_pork":"Recipe Page Dongpo Pork","kaleidoscope_cookery:recipe_page_donkey_burger":"Recipe Page Donkey Burger","kaleidoscope_cookery:recipe_page_dumpling":"Recipe Page Dumpling","kaleidoscope_cookery:recipe_page_fearsome_thick_soup":"Recipe Page Fearsome Thick Soup","kaleidoscope_cookery:recipe_page_fish_flavored_shredded_pork":"Recipe Page Fish Flavored Shredded Pork","kaleidoscope_cookery:recipe_page_fondant_pie":"Recipe Page Fondant Pie","kaleidoscope_cookery:recipe_page_fondant_spider_eye":"Recipe Page Fondant Spider Eye","kaleidoscope_cookery:recipe_page_four_joy_meatball_soup":"Recipe Page Four Joy Meatball Soup","kaleidoscope_cookery:recipe_page_fried_caterpillar":"Recipe Page Fried Caterpillar","kaleidoscope_cookery:recipe_page_fried_egg":"Recipe Page Fried Egg","kaleidoscope_cookery:recipe_page_fried_spring_roll":"Recipe Page Fried Spring Roll","kaleidoscope_cookery:recipe_page_frost_lamb_chop":"Recipe Page Frost Lamb Chop","kaleidoscope_cookery:recipe_page_hot_dry_noodles":"Recipe Page Hot Dry Noodles","kaleidoscope_cookery:recipe_page_hui_noodle":"Recipe Page Hui Noodle","kaleidoscope_cookery:recipe_page_laba_congee":"Recipe Page Laba Congee","kaleidoscope_cookery:recipe_page_lamb_and_radish_soup":"Recipe Page Lamb And Radish Soup","kaleidoscope_cookery:recipe_page_meat_pie":"Recipe Page Meat Pie","kaleidoscope_cookery:recipe_page_numbing_spicy_chicken":"Recipe Page Numbing Spicy Chicken","kaleidoscope_cookery:recipe_page_pan_seared_knight_steak":"Recipe Page Pan Seared Knight Steak","kaleidoscope_cookery:recipe_page_pufferfish_soup":"Recipe Page Pufferfish Soup","kaleidoscope_cookery:recipe_page_red_mushroom_pot_soup":"Recipe Page Red Mushroom Pot Soup","kaleidoscope_cookery:recipe_page_seafood_miso_soup":"Recipe Page Seafood Miso Soup","kaleidoscope_cookery:recipe_page_shengjian_mantou":"Recipe Page Shengjian Mantou","kaleidoscope_cookery:recipe_page_slime_ball_meal":"Recipe Page Slime Ball Meal","kaleidoscope_cookery:recipe_page_spicy_blood_stew":"Recipe Page Spicy Blood Stew","kaleidoscope_cookery:recipe_page_spicy_chicken":"Recipe Page Spicy Chicken","kaleidoscope_cookery:recipe_page_spicy_rabbit_head":"Recipe Page Spicy Rabbit Head","kaleidoscope_cookery:recipe_page_stargazy_pie":"Recipe Page Stargazy Pie","kaleidoscope_cookery:recipe_page_sticky_candy":"Recipe Page Sticky Candy","kaleidoscope_cookery:recipe_page_sticky_rice_cake":"Recipe Page Sticky Rice Cake","kaleidoscope_cookery:recipe_page_stir_fried_pork_with_peppers":"Recipe Page Stir Fried Pork With Peppers","kaleidoscope_cookery:recipe_page_stuffed_tiger_skin_pepper":"Recipe Page Stuffed Tiger Skin Pepper","kaleidoscope_cookery:recipe_page_sweet_and_sour_ender_pearls":"Recipe Page Sweet And Sour Ender Pearls","kaleidoscope_cookery:recipe_page_sweet_and_sour_pork":"Recipe Page Sweet And Sour Pork","kaleidoscope_cookery:recipe_page_udon_noodle":"Recipe Page Udon Noodle","kaleidoscope_cookery:recipe_page_warped_fungus_pot_soup":"Recipe Page Warped Fungus Pot Soup","kaleidoscope_cookery:recipe_page_wild_mushroom_rabbit_soup":"Recipe Page Wild Mushroom Rabbit Soup","kaleidoscope_cookery:recipe_page_zongzi":"Recipe Page Zongzi","kt_assets_a1:pressing_tub":"压榨桶","kt_assets_a1:pressing_tub_tilt":"倾斜压榨桶","kt_assets_a1:tap_closed":"龙頭・关閉","kt_assets_a1:tap_open":"龙頭・开啟","kt_assets_a1:wine_1":"葡萄酒・1 瓶","kt_assets_a1:wine_2":"葡萄酒・2 瓶","kt_assets_a1:wine_3":"葡萄酒・3 瓶","kt_assets_a1:wine_4":"葡萄酒・4 瓶","kt_assets_a1:grape":"葡萄","kt_assets_a2:trellis_single":"藤架・直立","kt_assets_a2:trellis_east_west":"藤架・东西横桿","kt_assets_a2:trellis_north_south":"藤架・南北横桿","kt_assets_a2:trellis_cross_east_west":"藤架・东西十字","kt_assets_a2:trellis_cross_north_south":"藤架・南北十字","kt_assets_a2:trellis_cross_up_down":"藤架・水平十字","kt_assets_a2:trellis_six_direction":"藤架・六向连接","kt_assets_a2:grapevine_stage0":"普通葡萄藤・阶段 0","kt_assets_a2:grapevine_stage1":"普通葡萄藤・阶段 1","kt_assets_a2:grapevine_stage2":"普通葡萄藤・阶段 2","kt_assets_a2:grapevine_stage3":"普通葡萄藤・阶段 3","kt_assets_a2:grape_crop_stage0":"普通葡萄果实・阶段 0","kt_assets_a2:grape_crop_stage1":"普通葡萄果实・阶段 1","kt_assets_a2:grape_crop_stage2":"普通葡萄果实・阶段 2","kt_assets_a2:grape_crop_stage3":"普通葡萄果实・阶段 3","kt_assets_a2:grape_crop_stage4":"普通葡萄果实・阶段 4","kt_assets_a2:grape_crop_stage5":"普通葡萄果实・阶段 5","kt_assets_a2:ice_grape_crop_stage0":"冰葡萄果实・阶段 0","kt_assets_a2:ice_grape_crop_stage1":"冰葡萄果实・阶段 1","kt_assets_a2:ice_grape_crop_stage2":"冰葡萄果实・阶段 2","kt_assets_a2:ice_grape_crop_stage3":"冰葡萄果实・阶段 3","kt_assets_a2:ice_grape_crop_stage4":"冰葡萄果实・阶段 4","kt_assets_a2:ice_grape_crop_stage5":"冰葡萄果实・阶段 5","kt_assets_a2:gold_grape_crop_stage0":"金葡萄果实・阶段 0","kt_assets_a2:gold_grape_crop_stage1":"金葡萄果实・阶段 1","kt_assets_a2:gold_grape_crop_stage2":"金葡萄果实・阶段 2","kt_assets_a2:gold_grape_crop_stage3":"金葡萄果实・阶段 3","kt_assets_a2:gold_grape_crop_stage4":"金葡萄果实・阶段 4","kt_assets_a2:gold_grape_crop_stage5":"金葡萄果实・阶段 5","kt_assets_a2:ice_grape":"冰葡萄","kt_assets_a2:gold_grape":"金葡萄","kt_assets_a2:green_grape":"青提葡萄","kt_assets_a2:grape_bucket":"葡萄汁桶","kt_assets_a2:ice_grape_bucket":"冰葡萄汁桶","kt_assets_a2:gold_grape_bucket":"金葡萄汁桶","kt_assets_a2:green_grape_bucket":"青提葡萄汁桶","kt_assets_a2:sweet_berries_bucket":"甜浆果汁桶","kt_assets_a2:glow_berries_bucket":"发光浆果汁桶","kt_assets_a3:grapevine_east_west":"普通葡萄藤・东西横向","kt_assets_a3:grapevine_north_south":"普通葡萄藤・南北横向","kt_assets_a3:grapevine_cross_east_west":"普通葡萄藤・东西十字","kt_assets_a3:grapevine_cross_north_south":"普通葡萄藤・南北十字","kt_assets_a3:grapevine_cross_up_down":"普通葡萄藤・水平十字","kt_assets_a3:grapevine_six_direction":"普通葡萄藤・六向连接","kt_assets_a3:ice_grapevine_stage0":"冰葡萄藤・阶段 0","kt_assets_a3:ice_grapevine_stage1":"冰葡萄藤・阶段 1","kt_assets_a3:ice_grapevine_stage2":"冰葡萄藤・阶段 2","kt_assets_a3:ice_grapevine_stage3":"冰葡萄藤・阶段 3","kt_assets_a3:ice_grapevine_east_west":"冰葡萄藤・东西横向","kt_assets_a3:ice_grapevine_north_south":"冰葡萄藤・南北横向","kt_assets_a3:ice_grapevine_cross_east_west":"冰葡萄藤・东西十字","kt_assets_a3:ice_grapevine_cross_north_south":"冰葡萄藤・南北十字","kt_assets_a3:ice_grapevine_cross_up_down":"冰葡萄藤・水平十字","kt_assets_a3:ice_grapevine_six_direction":"冰葡萄藤・六向连接","kt_assets_a3:gold_grapevine_stage0":"金葡萄藤・阶段 0","kt_assets_a3:gold_grapevine_stage1":"金葡萄藤・阶段 1","kt_assets_a3:gold_grapevine_stage2":"金葡萄藤・阶段 2","kt_assets_a3:gold_grapevine_stage3":"金葡萄藤・阶段 3","kt_assets_a3:gold_grapevine_east_west":"金葡萄藤・东西横向","kt_assets_a3:gold_grapevine_north_south":"金葡萄藤・南北横向","kt_assets_a3:gold_grapevine_cross_east_west":"金葡萄藤・东西十字","kt_assets_a3:gold_grapevine_cross_north_south":"金葡萄藤・南北十字","kt_assets_a3:gold_grapevine_cross_up_down":"金葡萄藤・水平十字","kt_assets_a3:gold_grapevine_six_direction":"金葡萄藤・六向连接","kt_assets_a3:wild_grapevine":"野生葡萄藤・末梢","kt_assets_a3:wild_grapevine_plant":"野生葡萄藤・中段","kt_assets_a3:empty_bottle_faces":"空酒瓶・保留内侧面","kt_assets_a4:champagne_1":"香槟・1 瓶","kt_assets_a4:champagne_2":"香槟・2 瓶","kt_assets_a4:champagne_3":"香槟・3 瓶","kt_assets_a4:champagne_4":"香槟・4 瓶","kt_assets_a4:honey_wine_1":"蜂蜜葡萄酒・1 瓶","kt_assets_a4:honey_wine_2":"蜂蜜葡萄酒・2 瓶","kt_assets_a4:honey_wine_3":"蜂蜜葡萄酒・3 瓶","kt_assets_a4:honey_wine_4":"蜂蜜葡萄酒・4 瓶","kt_assets_a4:ice_wine_1":"冰葡萄酒・1 瓶","kt_assets_a4:ice_wine_2":"冰葡萄酒・2 瓶","kt_assets_a4:ice_wine_3":"冰葡萄酒・3 瓶","kt_assets_a4:ice_wine_4":"冰葡萄酒・4 瓶","kt_assets_a4:sofa_white_single":"白色沙發・单座","kt_assets_a4:sofa_orange_single":"橙色沙發・单座","kt_assets_a4:sofa_magenta_single":"洋红色沙發・单座","kt_assets_a4:sofa_light_blue_single":"浅蓝色沙發・单座","kt_assets_a4:sofa_yellow_single":"黄色沙發・单座","kt_assets_a4:sofa_lime_single":"浅绿色沙發・单座","kt_assets_a4:sofa_pink_single":"粉红色沙發・单座","kt_assets_a4:sofa_gray_single":"灰色沙發・单座","kt_assets_a4:sofa_light_gray_single":"浅灰色沙發・单座","kt_assets_a4:sofa_cyan_single":"青色沙發・单座","kt_assets_a4:sofa_purple_single":"紫色沙發・单座","kt_assets_a4:sofa_blue_single":"蓝色沙發・单座","kt_assets_a4:sofa_brown_single":"棕色沙發・单座","kt_assets_a4:sofa_green_single":"绿色沙發・单座","kt_assets_a4:sofa_red_single":"红色沙發・单座","kt_assets_a4:sofa_black_single":"黑色沙發・单座","kt_assets_a4:sofa_white_left":"白色沙發・左端","kt_assets_a4:sofa_orange_left":"橙色沙發・左端","kt_assets_a4:sofa_magenta_left":"洋红色沙發・左端","kt_assets_a4:sofa_light_blue_left":"浅蓝色沙發・左端","kt_assets_a4:sofa_yellow_left":"黄色沙發・左端","kt_assets_a4:sofa_lime_left":"浅绿色沙發・左端","kt_assets_a4:sofa_pink_left":"粉红色沙發・左端","kt_assets_a4:sofa_gray_left":"灰色沙發・左端","kt_assets_a4:sofa_light_gray_left":"浅灰色沙發・左端","kt_assets_a4:sofa_cyan_left":"青色沙發・左端","kt_assets_a4:sofa_purple_left":"紫色沙發・左端","kt_assets_a4:sofa_blue_left":"蓝色沙發・左端","kt_assets_a4:sofa_brown_left":"棕色沙發・左端","kt_assets_a4:sofa_green_left":"绿色沙發・左端","kt_assets_a4:sofa_red_left":"红色沙發・左端","kt_assets_a4:sofa_black_left":"黑色沙發・左端","kt_assets_a4:sofa_white_middle":"白色沙發・中段","kt_assets_a4:sofa_orange_middle":"橙色沙發・中段","kt_assets_a4:sofa_magenta_middle":"洋红色沙發・中段","kt_assets_a4:sofa_light_blue_middle":"浅蓝色沙發・中段","kt_assets_a4:sofa_yellow_middle":"黄色沙發・中段","kt_assets_a4:sofa_lime_middle":"浅绿色沙發・中段","kt_assets_a4:sofa_pink_middle":"粉红色沙發・中段","kt_assets_a4:sofa_gray_middle":"灰色沙發・中段","kt_assets_a4:sofa_light_gray_middle":"浅灰色沙發・中段","kt_assets_a4:sofa_cyan_middle":"青色沙發・中段","kt_assets_a4:sofa_purple_middle":"紫色沙發・中段","kt_assets_a4:sofa_blue_middle":"蓝色沙發・中段","kt_assets_a4:sofa_brown_middle":"棕色沙發・中段","kt_assets_a4:sofa_green_middle":"绿色沙發・中段","kt_assets_a4:sofa_red_middle":"红色沙發・中段","kt_assets_a4:sofa_black_middle":"黑色沙發・中段","kt_assets_a4:sofa_white_right":"白色沙發・右端","kt_assets_a4:sofa_orange_right":"橙色沙發・右端","kt_assets_a4:sofa_magenta_right":"洋红色沙發・右端","kt_assets_a4:sofa_light_blue_right":"浅蓝色沙發・右端","kt_assets_a4:sofa_yellow_right":"黄色沙發・右端","kt_assets_a4:sofa_lime_right":"浅绿色沙發・右端","kt_assets_a4:sofa_pink_right":"粉红色沙發・右端","kt_assets_a4:sofa_gray_right":"灰色沙發・右端","kt_assets_a4:sofa_light_gray_right":"浅灰色沙發・右端","kt_assets_a4:sofa_cyan_right":"青色沙發・右端","kt_assets_a4:sofa_purple_right":"紫色沙發・右端","kt_assets_a4:sofa_blue_right":"蓝色沙發・右端","kt_assets_a4:sofa_brown_right":"棕色沙發・右端","kt_assets_a4:sofa_green_right":"绿色沙發・右端","kt_assets_a4:sofa_red_right":"红色沙發・右端","kt_assets_a4:sofa_black_right":"黑色沙發・右端","kt_assets_a4:sofa_white_left_corner":"白色沙發・左转角","kt_assets_a4:sofa_orange_left_corner":"橙色沙發・左转角","kt_assets_a4:sofa_magenta_left_corner":"洋红色沙發・左转角","kt_assets_a4:sofa_light_blue_left_corner":"浅蓝色沙發・左转角","kt_assets_a4:sofa_yellow_left_corner":"黄色沙發・左转角","kt_assets_a4:sofa_lime_left_corner":"浅绿色沙發・左转角","kt_assets_a4:sofa_pink_left_corner":"粉红色沙發・左转角","kt_assets_a4:sofa_gray_left_corner":"灰色沙發・左转角","kt_assets_a4:sofa_light_gray_left_corner":"浅灰色沙發・左转角","kt_assets_a4:sofa_cyan_left_corner":"青色沙發・左转角","kt_assets_a4:sofa_purple_left_corner":"紫色沙發・左转角","kt_assets_a4:sofa_blue_left_corner":"蓝色沙發・左转角","kt_assets_a4:sofa_brown_left_corner":"棕色沙發・左转角","kt_assets_a4:sofa_green_left_corner":"绿色沙發・左转角","kt_assets_a4:sofa_red_left_corner":"红色沙發・左转角","kt_assets_a4:sofa_black_left_corner":"黑色沙發・左转角","kt_assets_a4:sofa_white_right_corner":"白色沙發・右转角","kt_assets_a4:sofa_orange_right_corner":"橙色沙發・右转角","kt_assets_a4:sofa_magenta_right_corner":"洋红色沙發・右转角","kt_assets_a4:sofa_light_blue_right_corner":"浅蓝色沙發・右转角","kt_assets_a4:sofa_yellow_right_corner":"黄色沙發・右转角","kt_assets_a4:sofa_lime_right_corner":"浅绿色沙發・右转角","kt_assets_a4:sofa_pink_right_corner":"粉红色沙發・右转角","kt_assets_a4:sofa_gray_right_corner":"灰色沙發・右转角","kt_assets_a4:sofa_light_gray_right_corner":"浅灰色沙發・右转角","kt_assets_a4:sofa_cyan_right_corner":"青色沙發・右转角","kt_assets_a4:sofa_purple_right_corner":"紫色沙發・右转角","kt_assets_a4:sofa_blue_right_corner":"蓝色沙發・右转角","kt_assets_a4:sofa_brown_right_corner":"棕色沙發・右转角","kt_assets_a4:sofa_green_right_corner":"绿色沙發・右转角","kt_assets_a4:sofa_red_right_corner":"红色沙發・右转角","kt_assets_a4:sofa_black_right_corner":"黑色沙發・右转角","kt_assets_a4:emerald":"翡翠鸡尾酒・玻璃材質候選","kt_assets_a6:bar_cabinet_single":"酒柜・单体","kt_assets_a6:bar_cabinet_left":"酒柜・左端","kt_assets_a6:bar_cabinet_middle":"酒柜・中段","kt_assets_a6:bar_cabinet_right":"酒柜・右端","kt_assets_a6:glass_bar_cabinet_single":"玻璃酒柜・单体","kt_assets_a6:glass_bar_cabinet_left":"玻璃酒柜・左端","kt_assets_a6:glass_bar_cabinet_middle":"玻璃酒柜・中段","kt_assets_a6:glass_bar_cabinet_right":"玻璃酒柜・右端","kt_assets_a6:cellar_cabinet_single":"酒窖柜・单体","kt_assets_a6:cellar_cabinet_left":"酒窖柜・左端","kt_assets_a6:cellar_cabinet_middle":"酒窖柜・中段","kt_assets_a6:cellar_cabinet_right":"酒窖柜・右端","kt_assets_a6:tilted_rack":"倾斜酒架","kt_assets_a6:circular_rack":"圆形酒架","kt_assets_a6:glassware_holder":"吊挂杯架","kt_assets_a6:vodka_1":"伏特加・1 瓶","kt_assets_a6:vodka_2":"伏特加・2 瓶","kt_assets_a6:vodka_3":"伏特加・3 瓶","kt_assets_a6:vodka_4":"伏特加・4 瓶","kt_assets_a7:rum_1":"朗姆酒・1 瓶","kt_assets_a7:rum_2":"朗姆酒・2 瓶","kt_assets_a7:rum_3":"朗姆酒・3 瓶","kt_assets_a7:rum_4":"朗姆酒・4 瓶","kt_assets_a7:sherry_1":"雪莉・1 瓶","kt_assets_a7:sherry_2":"雪莉・2 瓶","kt_assets_a7:sherry_3":"雪莉・3 瓶","kt_assets_a7:sherry_4":"雪莉・4 瓶","kt_assets_a7:red_queen_1":"红皇后・1 瓶","kt_assets_a7:red_queen_2":"红皇后・2 瓶","kt_assets_a7:red_queen_3":"红皇后・3 瓶","kt_assets_a7:red_queen_4":"红皇后・4 瓶","kt_assets_a7:vinegar_1":"醋・1 瓶","kt_assets_a7:vinegar_2":"醋・2 瓶","kt_assets_a7:vinegar_3":"醋・3 瓶","kt_assets_a7:vinegar_4":"醋・4 瓶","kt_assets_a7:whiskey_1":"威士忌・1 瓶","kt_assets_a7:whiskey_2":"威士忌・2 瓶","kt_assets_a7:whiskey_3":"威士忌・3 瓶","kt_assets_a7:whiskey_4":"威士忌・4 瓶","kt_assets_a7:miners_star_1":"矿工之星・1 瓶","kt_assets_a7:miners_star_2":"矿工之星・2 瓶","kt_assets_a7:miners_star_3":"矿工之星・3 瓶","kt_assets_a7:miners_star_4":"矿工之星・4 瓶","kt_assets_a7:sauvignon_blanc_dry_white_1":"长相思干白・1 瓶","kt_assets_a7:sauvignon_blanc_dry_white_2":"长相思干白・2 瓶","kt_assets_a7:sauvignon_blanc_dry_white_3":"长相思干白・3 瓶","kt_assets_a7:sauvignon_blanc_dry_white_4":"长相思干白・4 瓶","kt_assets_a7:sweet_berry_wine_1":"甜莓酒・1 瓶","kt_assets_a7:sweet_berry_wine_2":"甜莓酒・2 瓶","kt_assets_a7:sweet_berry_wine_3":"甜莓酒・3 瓶","kt_assets_a7:sweet_berry_wine_4":"甜莓酒・4 瓶","kt_assets_a7:sakura_wine_1":"樱花酒・1 瓶","kt_assets_a7:sakura_wine_2":"樱花酒・2 瓶","kt_assets_a7:sakura_wine_3":"樱花酒・3 瓶","kt_assets_a7:sakura_wine_4":"樱花酒・4 瓶","kt_assets_a7:empty_glassware":"空鸡尾酒杯","kt_assets_a7:screwdriver":"螺丝起子鸡尾酒","kt_assets_a8:depth_charge":"深水炸彈","kt_assets_a8:mojito":"莫希托","kt_assets_a8:signature_cocktail":"特調（原始未染色）","kt_assets_a8:mystery_cocktail":"神秘雞尾酒","kt_assets_a8:shaker":"雪克杯","kt_assets_a8:glowflower_brew_1":"螢花釀 1 瓶","kt_assets_a8:glowflower_brew_2":"螢花釀 2 瓶","kt_assets_a8:glowflower_brew_3":"螢花釀 3 瓶","kt_assets_a8:glowflower_brew_4":"螢花釀 4 瓶","kt_assets_a8:luminous_bride_1":"流明新娘 1 瓶","kt_assets_a8:luminous_bride_2":"流明新娘 2 瓶","kt_assets_a8:luminous_bride_3":"流明新娘 3 瓶","kt_assets_a8:luminous_bride_4":"流明新娘 4 瓶","kt_assets_a9:brandy_1":"白蘭地・1 瓶","kt_assets_a9:brandy_2":"白蘭地・2 瓶","kt_assets_a9:brandy_3":"白蘭地・3 瓶","kt_assets_a9:carignan_1":"佳麗釀・1 瓶","kt_assets_a9:carignan_2":"佳麗釀・2 瓶","kt_assets_a9:carignan_3":"佳麗釀・3 瓶","kt_assets_a9:madame_shexiang_1":"麝香夫人・1 瓶","kt_assets_a9:madame_shexiang_2":"麝香夫人・2 瓶","kt_assets_a9:madame_shexiang_3":"麝香夫人・3 瓶","kt_assets_a9:madame_shexiang_4":"麝香夫人・4 瓶","kt_assets_a9:mother_snow_1":"Mother Snow・1 瓶","kt_assets_a9:mother_snow_2":"Mother Snow・2 瓶","kt_assets_a9:mother_snow_3":"Mother Snow・3 瓶","kt_assets_a9:mother_snow_4":"Mother Snow・4 瓶","kt_assets_a9:plum_wine_1":"梅酒・1 瓶","kt_assets_a9:plum_wine_2":"梅酒・2 瓶","kt_assets_a9:plum_wine_3":"梅酒・3 瓶","kt_assets_a9:plum_wine_4":"梅酒・4 瓶","kt_assets_a9:polaris_sweet_white_1":"北極星甜白・1 瓶","kt_assets_a9:polaris_sweet_white_2":"北極星甜白・2 瓶","kt_assets_a9:polaris_sweet_white_3":"北極星甜白・3 瓶","kt_assets_a9:polaris_sweet_white_4":"北極星甜白・4 瓶","kt_assets_a9:riesling_dry_white_1":"雷司令干白・1 瓶","kt_assets_a9:riesling_dry_white_2":"雷司令干白・2 瓶","kt_assets_a9:riesling_dry_white_3":"雷司令干白・3 瓶","kt_assets_a9:riesling_dry_white_4":"雷司令干白・4 瓶","kt_assets_a9:sunset_glow_1":"落日餘暉・1 瓶","kt_assets_a9:sunset_glow_2":"落日餘暉・2 瓶","kt_assets_a9:sunset_glow_3":"落日餘暉・3 瓶","kt_assets_a9:watermelon_juice_1":"西瓜汁・1 瓶","kt_assets_a9:watermelon_juice_2":"西瓜汁・2 瓶","kt_assets_a9:watermelon_juice_3":"西瓜汁・3 瓶","kt_assets_a9:watermelon_juice_4":"西瓜汁・4 瓶","kt_assets_a9:white_lady":"白色佳人鸡尾酒","kt_assets_a10:allium_garden":"葱花园","kt_assets_a10:bloody_mary":"血腥玛丽","kt_assets_a10:brass_heart":"黄铜之心","kt_assets_a10:godfather":"教父","kt_assets_a10:grasshopper":"蚱蜢","kt_assets_a10:nether_special":"下界特调","kt_assets_a10:sculk_special":"幽匿特调","kt_assets_a10:bar_counter_single":"吧台・单体","kt_assets_a10:bar_counter_left":"吧台・左端","kt_assets_a10:bar_counter_middle":"吧台・中段","kt_assets_a10:bar_counter_right":"吧台・右端","kt_assets_a10:bar_counter_left_corner":"吧台・左转角","kt_assets_a10:bar_counter_right_corner":"吧台・右转角","kt_assets_a10:holder":"酒瓶展示座","kt_assets_a12:table_single":"酒館桌・单桌","kt_assets_a12:table_left":"酒館桌・左端","kt_assets_a12:table_middle":"酒館桌・中段","kt_assets_a12:table_right":"酒館桌・右端","kt_assets_a12:table_left_rot":"酒館桌・旋转左端","kt_assets_a12:table_middle_rot":"酒館桌・旋转中段","kt_assets_a12:table_right_rot":"酒館桌・旋转右端","kt_assets_a12:bell_pendant_lamp_bottom":"铃形吊灯・下段","kt_assets_a12:bell_pendant_lamp_top":"铃形吊灯・上段","kt_assets_a12:blue_pendant_lamp_bottom":"蓝色吊灯・下段","kt_assets_a12:blue_pendant_lamp_top":"蓝色吊灯・上段","kt_assets_a12:yellow_pendant_lamp_bottom":"黄色吊灯・下段","kt_assets_a12:yellow_pendant_lamp_top":"黄色吊灯・上段","kt_assets_a12:stepladder_bottom":"人字梯・下段","kt_assets_a12:stepladder_top":"人字梯・上段","kt_assets_a12:sandwich_board_bottom":"素面告示牌・下座","kt_assets_a13:sakura_incense_closed":"樱花香薰・关闭","kt_assets_a13:sakura_incense_open":"樱花香薰・开启","kt_assets_a13:pine_incense_closed":"松木香薰・关闭","kt_assets_a13:pine_incense_open":"松木香薰・开启","kt_assets_a13:ginkgo_incense_closed":"银杏香薰・关闭","kt_assets_a13:ginkgo_incense_open":"银杏香薰・开启","kt_assets_a13:spore_incense_closed":"孢子香薰・关闭","kt_assets_a13:spore_incense_open":"孢子香薰・开启","kt_assets_a13:catnip_incense_closed":"猫薄荷香薰・关闭","kt_assets_a13:catnip_incense_open":"猫薄荷香薰・开启","kt_assets_a13:snow_incense_closed":"雪香薰・关闭","kt_assets_a13:snow_incense_open":"雪香薰・开启","kt_assets_a13:butterfly_incense_closed":"蝴蝶香薰・关闭","kt_assets_a13:butterfly_incense_open":"蝴蝶香薰・开启","kt_assets_a13:firefly_incense_closed":"萤火虫香薰・关闭","kt_assets_a13:firefly_incense_open":"萤火虫香薰・开启","kt_assets_a13:painting_mondrian":"画作・蒙德里安","kt_assets_a13:painting_great_wave":"画作・神奈川沖浪裏","kt_assets_a13:painting_mona_lisa":"画作・蒙娜丽莎","kt_assets_a13:painting_cr019":"画作・CR019","kt_assets_a13:painting_david":"画作・大卫","kt_assets_a14:painting_father":"画作・父亲","kt_assets_a14:painting_girl_with_pearl_earring":"画作・戴珍珠耳环的少女","kt_assets_a14:painting_master_marisa":"画作・魔理沙","kt_assets_a14:painting_son_of_man":"画作・人子","kt_assets_a14:painting_starry_night":"画作・星夜","kt_assets_a14:painting_van_gogh_self_portrait":"画作・梵谷自画像","kt_assets_a14:painting_ysbb":"画作・YSBB","kt_assets_a14:painting_tartaric_acid":"画作・Tartaric Acid","kt_assets_a14:painting_unknown":"画作・Unknown","kt_assets_a14:string_lights_blue":"蓝色彩灯","kt_assets_a15:string_lights_red":"红色彩灯","kt_assets_a15:string_lights_white":"白色彩灯","kt_assets_a15:string_lights_black":"黑色彩灯","kt_assets_a16:string_lights_colorless":"無色彩灯","kt_assets_a16:string_lights_brown":"棕色彩灯","kt_assets_a16:string_lights_cyan":"青色彩灯","kt_assets_a16:string_lights_gray":"灰色彩灯","kt_assets_a17:string_lights_green":"綠色彩燈","kt_assets_a17:string_lights_light_blue":"淺藍色彩燈","kt_assets_a17:string_lights_light_gray":"淺灰色彩燈","kt_assets_a17:string_lights_lime":"淺綠色彩燈","kt_assets_a17:string_lights_magenta":"洋紅色彩燈","kt_assets_a17:string_lights_orange":"橙色彩燈","kt_assets_a17:string_lights_pink":"粉紅色彩燈","kt_assets_a17:string_lights_purple":"紫色彩燈","kt_assets_a17:string_lights_yellow":"黃色彩燈","kt_assets_a17:molotov":"燃燒瓶・展示","kt_assets_a17:water_bottle":"水瓶・展示","kt_assets_a17:potion_bottle":"藥水瓶・展示","kt_assets_a17:honey_bottle":"蜂蜜瓶・展示","kt_assets_a17:xp_bottle":"經驗瓶・展示","kt_assets_a17:dragon_breath_bottle":"龍息瓶・展示","kt_assets_a17:sourceicon_allium_garden":"allium garden","kt_assets_a17:item_display_allium_sandwich_board":"物品姿態・allium_sandwich_board","kt_assets_a17:item_display_azure_bluet_sandwich_board":"物品姿態・azure_bluet_sandwich_board","kt_assets_a17:item_display_bar_cabinet":"物品姿態・bar_cabinet","kt_assets_a17:item_display_bar_counter":"物品姿態・bar_counter","kt_assets_a17:item_display_barrel":"物品姿態・barrel","kt_assets_a17:item_display_base_sandwich_board":"物品姿態・base_sandwich_board","kt_assets_a17:sourceicon_bell_pendant_lamp":"bell pendant lamp","kt_assets_a17:item_display_black_bar_stool":"物品姿態・black_bar_stool","kt_assets_a17:item_display_black_sofa":"物品姿態・black_sofa","kt_assets_a17:sourceicon_bloody_mary":"bloody mary","kt_assets_a17:item_display_blue_bar_stool":"物品姿態・blue_bar_stool","kt_assets_a17:sourceicon_blue_pendant_lamp":"blue pendant lamp","kt_assets_a17:item_display_blue_sofa":"物品姿態・blue_sofa","kt_assets_a17:sourceicon_brandy":"brandy","kt_assets_a17:sourceicon_brass_heart":"brass heart","kt_assets_a17:item_display_brown_bar_stool":"物品姿態・brown_bar_stool","kt_assets_a17:item_display_brown_sofa":"物品姿態・brown_sofa","kt_assets_a17:sourceicon_butterfly_incense":"butterfly incense","kt_assets_a17:sourceicon_carignan":"carignan","kt_assets_a17:sourceicon_catnip_incense":"catnip incense","kt_assets_a17:item_display_cellar_cabinet":"物品姿態・cellar_cabinet","kt_assets_a17:sourceicon_chalkboard":"chalkboard","kt_assets_a17:sourceicon_champagne":"champagne","kt_assets_a17:item_display_circular_rack":"物品姿態・circular_rack","kt_assets_a17:item_display_cornflower_sandwich_board":"物品姿態・cornflower_sandwich_board","kt_assets_a17:sourceicon_cr019_painting":"cr019 painting","kt_assets_a17:item_display_cyan_bar_stool":"物品姿態・cyan_bar_stool","kt_assets_a17:item_display_cyan_sofa":"物品姿態・cyan_sofa","kt_assets_a17:sourceicon_david_painting":"david painting","kt_assets_a17:sourceicon_depth_charge":"depth charge","kt_assets_a17:sourceicon_emerald":"emerald","kt_assets_a17:sourceicon_empty_bottle":"empty bottle","kt_assets_a17:sourceicon_empty_glassware":"empty glassware","kt_assets_a17:sourceicon_father_painting":"father painting","kt_assets_a17:sourceicon_firefly_incense":"firefly incense","kt_assets_a17:sourceicon_ginkgo_incense":"ginkgo incense","kt_assets_a17:sourceicon_girl_with_pearl_earring_painting":"girl with pearl earring painting","kt_assets_a17:item_display_glass_bar_cabinet":"物品姿態・glass_bar_cabinet","kt_assets_a17:item_display_glassware_holder":"物品姿態・glassware_holder","kt_assets_a17:sourceicon_glow_berries_bucket":"glow berries bucket","kt_assets_a17:sourceicon_glowflower_brew":"glowflower brew","kt_assets_a17:sourceicon_godfather":"godfather","kt_assets_a17:sourceicon_gold_grape":"gold grape","kt_assets_a17:sourceicon_gold_grape_bucket":"gold grape bucket","kt_assets_a17:sourceicon_grape":"grape","kt_assets_a17:sourceicon_grape_bucket":"grape bucket","kt_assets_a17:sourceicon_grapevine":"grapevine","kt_assets_a17:item_display_grass_sandwich_board":"物品姿態・grass_sandwich_board","kt_assets_a17:sourceicon_grasshopper":"grasshopper","kt_assets_a17:item_display_gray_bar_stool":"物品姿態・gray_bar_stool","kt_assets_a17:item_display_gray_sofa":"物品姿態・gray_sofa","kt_assets_a17:sourceicon_great_wave_painting":"great wave painting","kt_assets_a17:item_display_green_bar_stool":"物品姿態・green_bar_stool","kt_assets_a17:sourceicon_green_grape":"green grape","kt_assets_a17:sourceicon_green_grape_bucket":"green grape bucket","kt_assets_a17:item_display_green_sofa":"物品姿態・green_sofa","kt_assets_a17:sourceicon_holder":"holder","kt_assets_a17:sourceicon_honey_wine":"honey wine","kt_assets_a17:sourceicon_ice_grape":"ice grape","kt_assets_a17:sourceicon_ice_grape_bucket":"ice grape bucket","kt_assets_a17:sourceicon_ice_wine":"ice wine","kt_assets_a17:item_display_light_blue_bar_stool":"物品姿態・light_blue_bar_stool","kt_assets_a17:item_display_light_blue_sofa":"物品姿態・light_blue_sofa","kt_assets_a17:item_display_light_gray_bar_stool":"物品姿態・light_gray_bar_stool","kt_assets_a17:item_display_light_gray_sofa":"物品姿態・light_gray_sofa","kt_assets_a17:item_display_lime_bar_stool":"物品姿態・lime_bar_stool","kt_assets_a17:item_display_lime_sofa":"物品姿態・lime_sofa","kt_assets_a17:sourceicon_luminous_bride":"luminous bride","kt_assets_a17:sourceicon_madame_shexiang":"madame shexiang","kt_assets_a17:item_display_magenta_bar_stool":"物品姿態・magenta_bar_stool","kt_assets_a17:item_display_magenta_sofa":"物品姿態・magenta_sofa","kt_assets_a17:sourceicon_master_marisa_painting":"master marisa painting","kt_assets_a17:sourceicon_miners_star":"miners star","kt_assets_a17:sourceicon_mojito":"mojito","kt_assets_a17:sourceicon_molotov":"molotov","kt_assets_a17:sourceicon_mona_lisa_painting":"mona lisa painting","kt_assets_a17:sourceicon_mondrian_painting":"mondrian painting","kt_assets_a17:sourceicon_mother_snow":"mother snow","kt_assets_a17:sourceicon_mystery_cocktail":"mystery cocktail","kt_assets_a17:sourceicon_nether_special":"nether special","kt_assets_a17:item_display_orange_bar_stool":"物品姿態・orange_bar_stool","kt_assets_a17:item_display_orange_sofa":"物品姿態・orange_sofa","kt_assets_a17:item_display_orchid_sandwich_board":"物品姿態・orchid_sandwich_board","kt_assets_a17:item_display_peony_sandwich_board":"物品姿態・peony_sandwich_board","kt_assets_a17:sourceicon_pine_incense":"pine incense","kt_assets_a17:item_display_pink_bar_stool":"物品姿態・pink_bar_stool","kt_assets_a17:item_display_pink_petals_sandwich_board":"物品姿態・pink_petals_sandwich_board","kt_assets_a17:item_display_pink_sofa":"物品姿態・pink_sofa","kt_assets_a17:item_display_pitcher_plant_sandwich_board":"物品姿態・pitcher_plant_sandwich_board","kt_assets_a17:sourceicon_plum_wine":"plum wine","kt_assets_a17:sourceicon_polaris_sweet_white":"polaris sweet white","kt_assets_a17:item_display_poppy_sandwich_board":"物品姿態・poppy_sandwich_board","kt_assets_a17:item_display_pressing_tub":"物品姿態・pressing_tub","kt_assets_a17:item_display_purple_bar_stool":"物品姿態・purple_bar_stool","kt_assets_a17:item_display_purple_sofa":"物品姿態・purple_sofa","kt_assets_a17:item_display_red_bar_stool":"物品姿態・red_bar_stool","kt_assets_a17:sourceicon_red_queen":"red queen","kt_assets_a17:item_display_red_sofa":"物品姿態・red_sofa","kt_assets_a17:sourceicon_riesling_dry_white":"riesling dry white","kt_assets_a17:sourceicon_rum":"rum","kt_assets_a17:sourceicon_sakura_incense":"sakura incense","kt_assets_a17:sourceicon_sakura_wine":"sakura wine","kt_assets_a17:sourceicon_sauvignon_blanc_dry_white":"sauvignon blanc dry white","kt_assets_a17:sourceicon_screwdriver":"screwdriver","kt_assets_a17:sourceicon_sculk_special":"sculk special","kt_assets_a17:item_display_shaker":"物品姿態・shaker","kt_assets_a17:item_display_shaker_3d":"物品姿態・shaker_3d","kt_assets_a17:sourceicon_sherry":"sherry","kt_assets_a17:sourceicon_signature_cocktail":"signature cocktail","kt_assets_a17:sourceicon_snow_incense":"snow incense","kt_assets_a17:sourceicon_son_of_man_painting":"son of man painting","kt_assets_a17:sourceicon_spore_incense":"spore incense","kt_assets_a17:sourceicon_starry_night_painting":"starry night painting","kt_assets_a17:sourceicon_stepladder":"stepladder","kt_assets_a17:item_display_string_lights_black":"物品姿態・string_lights_black","kt_assets_a17:item_display_string_lights_blue":"物品姿態・string_lights_blue","kt_assets_a17:item_display_string_lights_brown":"物品姿態・string_lights_brown","kt_assets_a17:item_display_string_lights_colorless":"物品姿態・string_lights_colorless","kt_assets_a17:item_display_string_lights_cyan":"物品姿態・string_lights_cyan","kt_assets_a17:item_display_string_lights_gray":"物品姿態・string_lights_gray","kt_assets_a17:item_display_string_lights_green":"物品姿態・string_lights_green","kt_assets_a17:item_display_string_lights_light_blue":"物品姿態・string_lights_light_blue","kt_assets_a17:item_display_string_lights_light_gray":"物品姿態・string_lights_light_gray","kt_assets_a17:item_display_string_lights_lime":"物品姿態・string_lights_lime","kt_assets_a17:item_display_string_lights_magenta":"物品姿態・string_lights_magenta","kt_assets_a17:item_display_string_lights_orange":"物品姿態・string_lights_orange","kt_assets_a17:item_display_string_lights_pink":"物品姿態・string_lights_pink","kt_assets_a17:item_display_string_lights_purple":"物品姿態・string_lights_purple","kt_assets_a17:item_display_string_lights_red":"物品姿態・string_lights_red","kt_assets_a17:item_display_string_lights_white":"物品姿態・string_lights_white","kt_assets_a17:item_display_string_lights_yellow":"物品姿態・string_lights_yellow","kt_assets_a17:item_display_sunflower_sandwich_board":"物品姿態・sunflower_sandwich_board","kt_assets_a17:sourceicon_sunset_glow":"sunset glow","kt_assets_a17:sourceicon_sweet_berries_bucket":"sweet berries bucket","kt_assets_a17:sourceicon_sweet_berry_wine":"sweet berry wine","kt_assets_a17:item_display_table":"物品姿態・table","kt_assets_a17:sourceicon_tap":"tap","kt_assets_a17:sourceicon_tartaric_acid_painting":"tartaric acid painting","kt_assets_a17:item_display_tilted_rack":"物品姿態・tilted_rack","kt_assets_a17:item_display_torchflower_sandwich_board":"物品姿態・torchflower_sandwich_board","kt_assets_a17:item_display_trellis":"物品姿態・trellis","kt_assets_a17:item_display_tulip_sandwich_board":"物品姿態・tulip_sandwich_board","kt_assets_a17:sourceicon_unknown_painting":"unknown painting","kt_assets_a17:sourceicon_van_gogh_self_portrait_painting":"van gogh self portrait painting","kt_assets_a17:sourceicon_vinegar":"vinegar","kt_assets_a17:sourceicon_vodka":"vodka","kt_assets_a17:sourceicon_watermelon_juice":"watermelon juice","kt_assets_a17:sourceicon_whiskey":"whiskey","kt_assets_a17:item_display_white_bar_stool":"物品姿態・white_bar_stool","kt_assets_a17:sourceicon_white_lady":"white lady","kt_assets_a17:item_display_white_sofa":"物品姿態・white_sofa","kt_assets_a17:sourceicon_wine":"wine","kt_assets_a17:item_display_wither_rose_sandwich_board":"物品姿態・wither_rose_sandwich_board","kt_assets_a17:item_display_yellow_bar_stool":"物品姿態・yellow_bar_stool","kt_assets_a17:sourceicon_yellow_pendant_lamp":"yellow pendant lamp","kt_assets_a17:item_display_yellow_sofa":"物品姿態・yellow_sofa","kt_assets_a17:sourceicon_ysbb_painting":"ysbb painting","kaleidoscope_tavern:allium_garden":"绒球葱花园","kaleidoscope_tavern:bar_cabinet":"酒柜","kaleidoscope_tavern:bar_counter":"吧台","kaleidoscope_tavern:barrel":"酒桶","kaleidoscope_tavern:bell_pendant_lamp":"铃铛垂灯","kaleidoscope_tavern:black_bar_stool":"黑色高脚凳","kaleidoscope_tavern:black_sofa":"黑色沙发","kaleidoscope_tavern:bloody_mary":"血腥玛丽","kaleidoscope_tavern:blue_bar_stool":"蓝色高脚凳","kaleidoscope_tavern:blue_pendant_lamp":"蓝色垂灯","kaleidoscope_tavern:blue_sofa":"蓝色沙发","kaleidoscope_tavern:brandy":"白兰地","kaleidoscope_tavern:brandy_q1":"白兰地","kaleidoscope_tavern:brandy_q2":"白兰地","kaleidoscope_tavern:brandy_q3":"白兰地","kaleidoscope_tavern:brandy_q4":"白兰地","kaleidoscope_tavern:brandy_q5":"白兰地","kaleidoscope_tavern:brandy_q6":"白兰地","kaleidoscope_tavern:brass_heart":"黄铜心脏","kaleidoscope_tavern:brown_bar_stool":"棕色高脚凳","kaleidoscope_tavern:brown_sofa":"棕色沙发","kaleidoscope_tavern:butterfly_incense":"蝴蝶香薰","kaleidoscope_tavern:carignan":"佳丽私酿","kaleidoscope_tavern:carignan_q1":"佳丽私酿","kaleidoscope_tavern:carignan_q2":"佳丽私酿","kaleidoscope_tavern:carignan_q3":"佳丽私酿","kaleidoscope_tavern:carignan_q4":"佳丽私酿","kaleidoscope_tavern:carignan_q5":"佳丽私酿","kaleidoscope_tavern:carignan_q6":"佳丽私酿","kaleidoscope_tavern:catnip_incense":"荆芥香薰","kaleidoscope_tavern:cellar_cabinet":"窖藏酒柜","kaleidoscope_tavern:chalkboard":"黑板","kaleidoscope_tavern:champagne":"香槟","kaleidoscope_tavern:champagne_q1":"香槟","kaleidoscope_tavern:champagne_q2":"香槟","kaleidoscope_tavern:champagne_q3":"香槟","kaleidoscope_tavern:champagne_q4":"香槟","kaleidoscope_tavern:champagne_q5":"香槟","kaleidoscope_tavern:champagne_q6":"香槟","kaleidoscope_tavern:circular_rack":"圆周酒架","kaleidoscope_tavern:cyan_bar_stool":"青色高脚凳","kaleidoscope_tavern:cyan_sofa":"青色沙发","kaleidoscope_tavern:depth_charge":"深水炸弹","kaleidoscope_tavern:dragon_breath_bottle":"龙息瓶","kaleidoscope_tavern:emerald":"翡翠","kaleidoscope_tavern:empty_bottle":"空瓶子","kaleidoscope_tavern:empty_glassware":"空酒杯","kaleidoscope_tavern:firefly_incense":"萤火虫香薰","kaleidoscope_tavern:ginkgo_incense":"银杏香薰","kaleidoscope_tavern:glass_bar_cabinet":"酒柜（玻璃窗）","kaleidoscope_tavern:glassware_holder":"酒杯架","kaleidoscope_tavern:glow_berries_bucket":"发光浆果桶","kaleidoscope_tavern:glow_berries_juice":"发光浆果汁","kaleidoscope_tavern:glowflower_brew":"萤花酿","kaleidoscope_tavern:glowflower_brew_q1":"萤花酿","kaleidoscope_tavern:glowflower_brew_q2":"萤花酿","kaleidoscope_tavern:glowflower_brew_q3":"萤花酿","kaleidoscope_tavern:glowflower_brew_q4":"萤花酿","kaleidoscope_tavern:glowflower_brew_q5":"萤花酿","kaleidoscope_tavern:glowflower_brew_q6":"萤花酿","kaleidoscope_tavern:godfather":"教父","kaleidoscope_tavern:gold_grape":"黄金葡萄","kaleidoscope_tavern:gold_grape_bucket":"黄金葡萄桶","kaleidoscope_tavern:gold_grape_crop":"黄金葡萄","kaleidoscope_tavern:gold_grape_juice":"黄金葡萄汁","kaleidoscope_tavern:gold_grapevine_trellis":"黄金葡萄藤架","kaleidoscope_tavern:grape":"葡萄","kaleidoscope_tavern:grape_bucket":"葡萄桶","kaleidoscope_tavern:grape_crop":"葡萄","kaleidoscope_tavern:grape_juice":"葡萄汁","kaleidoscope_tavern:grapevine":"葡萄藤","kaleidoscope_tavern:grapevine_trellis":"葡萄藤架","kaleidoscope_tavern:grasshopper":"绿色蚱蜢","kaleidoscope_tavern:gray_bar_stool":"灰色高脚凳","kaleidoscope_tavern:gray_sofa":"灰色沙发","kaleidoscope_tavern:green_bar_stool":"绿色高脚凳","kaleidoscope_tavern:green_grape":"青提葡萄","kaleidoscope_tavern:green_grape_bucket":"青提葡萄桶","kaleidoscope_tavern:green_grape_juice":"青提葡萄汁","kaleidoscope_tavern:green_sofa":"绿色沙发","kaleidoscope_tavern:guidebook":"旧版酒馆指南","kaleidoscope_tavern:holder":"单体酒架","kaleidoscope_tavern:honey_bottle":"蜂蜜瓶","kaleidoscope_tavern:honey_wine":"蜂蜜葡萄酒","kaleidoscope_tavern:honey_wine_q1":"蜂蜜葡萄酒","kaleidoscope_tavern:honey_wine_q2":"蜂蜜葡萄酒","kaleidoscope_tavern:honey_wine_q3":"蜂蜜葡萄酒","kaleidoscope_tavern:honey_wine_q4":"蜂蜜葡萄酒","kaleidoscope_tavern:honey_wine_q5":"蜂蜜葡萄酒","kaleidoscope_tavern:honey_wine_q6":"蜂蜜葡萄酒","kaleidoscope_tavern:ice_grape":"冰葡萄","kaleidoscope_tavern:ice_grape_bucket":"冰葡萄桶","kaleidoscope_tavern:ice_grape_crop":"冰葡萄","kaleidoscope_tavern:ice_grape_juice":"冰葡萄汁","kaleidoscope_tavern:ice_grapevine_trellis":"冰葡萄藤架","kaleidoscope_tavern:ice_wine":"冰葡萄酒","kaleidoscope_tavern:ice_wine_q1":"冰葡萄酒","kaleidoscope_tavern:ice_wine_q2":"冰葡萄酒","kaleidoscope_tavern:ice_wine_q3":"冰葡萄酒","kaleidoscope_tavern:ice_wine_q4":"冰葡萄酒","kaleidoscope_tavern:ice_wine_q5":"冰葡萄酒","kaleidoscope_tavern:ice_wine_q6":"冰葡萄酒","kaleidoscope_tavern:light_blue_bar_stool":"淡蓝色高脚凳","kaleidoscope_tavern:light_blue_sofa":"淡蓝色沙发","kaleidoscope_tavern:light_gray_bar_stool":"淡灰色高脚凳","kaleidoscope_tavern:light_gray_sofa":"淡灰色沙发","kaleidoscope_tavern:lime_bar_stool":"黄绿色高脚凳","kaleidoscope_tavern:lime_sofa":"黄绿色沙发","kaleidoscope_tavern:luminous_bride":"夜光新娘","kaleidoscope_tavern:luminous_bride_q1":"夜光新娘","kaleidoscope_tavern:luminous_bride_q2":"夜光新娘","kaleidoscope_tavern:luminous_bride_q3":"夜光新娘","kaleidoscope_tavern:luminous_bride_q4":"夜光新娘","kaleidoscope_tavern:luminous_bride_q5":"夜光新娘","kaleidoscope_tavern:luminous_bride_q6":"夜光新娘","kaleidoscope_tavern:madame_shexiang":"奢香夫人","kaleidoscope_tavern:madame_shexiang_q1":"奢香夫人","kaleidoscope_tavern:madame_shexiang_q2":"奢香夫人","kaleidoscope_tavern:madame_shexiang_q3":"奢香夫人","kaleidoscope_tavern:madame_shexiang_q4":"奢香夫人","kaleidoscope_tavern:madame_shexiang_q5":"奢香夫人","kaleidoscope_tavern:madame_shexiang_q6":"奢香夫人","kaleidoscope_tavern:magenta_bar_stool":"品红色高脚凳","kaleidoscope_tavern:magenta_sofa":"品红色沙发","kaleidoscope_tavern:miners_star":"矿工之星","kaleidoscope_tavern:miners_star_q1":"矿工之星","kaleidoscope_tavern:miners_star_q2":"矿工之星","kaleidoscope_tavern:miners_star_q3":"矿工之星","kaleidoscope_tavern:miners_star_q4":"矿工之星","kaleidoscope_tavern:miners_star_q5":"矿工之星","kaleidoscope_tavern:miners_star_q6":"矿工之星","kaleidoscope_tavern:mojito":"莫吉托","kaleidoscope_tavern:molotov":"莫洛托夫鸡尾酒","kaleidoscope_tavern:mother_snow":"雪婆婆","kaleidoscope_tavern:mother_snow_q1":"雪婆婆","kaleidoscope_tavern:mother_snow_q2":"雪婆婆","kaleidoscope_tavern:mother_snow_q3":"雪婆婆","kaleidoscope_tavern:mother_snow_q4":"雪婆婆","kaleidoscope_tavern:mother_snow_q5":"雪婆婆","kaleidoscope_tavern:mother_snow_q6":"雪婆婆","kaleidoscope_tavern:mystery_cocktail":"谜之鸡尾酒","kaleidoscope_tavern:nether_special":"下界特调","kaleidoscope_tavern:orange_bar_stool":"橙色高脚凳","kaleidoscope_tavern:orange_sofa":"橙色沙发","kaleidoscope_tavern:painting":"挂画","kaleidoscope_tavern:pine_incense":"松木香薰","kaleidoscope_tavern:pink_bar_stool":"粉红色高脚凳","kaleidoscope_tavern:pink_sofa":"粉红色沙发","kaleidoscope_tavern:plum_wine":"梅酒","kaleidoscope_tavern:plum_wine_q1":"梅酒","kaleidoscope_tavern:plum_wine_q2":"梅酒","kaleidoscope_tavern:plum_wine_q3":"梅酒","kaleidoscope_tavern:plum_wine_q4":"梅酒","kaleidoscope_tavern:plum_wine_q5":"梅酒","kaleidoscope_tavern:plum_wine_q6":"梅酒","kaleidoscope_tavern:polaris_sweet_white":"北极星甜白","kaleidoscope_tavern:polaris_sweet_white_q1":"北极星甜白","kaleidoscope_tavern:polaris_sweet_white_q2":"北极星甜白","kaleidoscope_tavern:polaris_sweet_white_q3":"北极星甜白","kaleidoscope_tavern:polaris_sweet_white_q4":"北极星甜白","kaleidoscope_tavern:polaris_sweet_white_q5":"北极星甜白","kaleidoscope_tavern:polaris_sweet_white_q6":"北极星甜白","kaleidoscope_tavern:potion_bottle":"药水瓶","kaleidoscope_tavern:pressing_tub":"果盆","kaleidoscope_tavern:purple_bar_stool":"紫色高脚凳","kaleidoscope_tavern:purple_sofa":"紫色沙发","kaleidoscope_tavern:recipe_book":"旧版酒馆配方书","kaleidoscope_tavern:red_bar_stool":"红色高脚凳","kaleidoscope_tavern:red_queen":"红皇后","kaleidoscope_tavern:red_queen_q1":"红皇后","kaleidoscope_tavern:red_queen_q2":"红皇后","kaleidoscope_tavern:red_queen_q3":"红皇后","kaleidoscope_tavern:red_queen_q4":"红皇后","kaleidoscope_tavern:red_queen_q5":"红皇后","kaleidoscope_tavern:red_queen_q6":"红皇后","kaleidoscope_tavern:red_sofa":"红色沙发","kaleidoscope_tavern:riesling_dry_white":"雷司令干白","kaleidoscope_tavern:riesling_dry_white_q1":"雷司令干白","kaleidoscope_tavern:riesling_dry_white_q2":"雷司令干白","kaleidoscope_tavern:riesling_dry_white_q3":"雷司令干白","kaleidoscope_tavern:riesling_dry_white_q4":"雷司令干白","kaleidoscope_tavern:riesling_dry_white_q5":"雷司令干白","kaleidoscope_tavern:riesling_dry_white_q6":"雷司令干白","kaleidoscope_tavern:rum":"朗姆酒","kaleidoscope_tavern:rum_q1":"朗姆酒","kaleidoscope_tavern:rum_q2":"朗姆酒","kaleidoscope_tavern:rum_q3":"朗姆酒","kaleidoscope_tavern:rum_q4":"朗姆酒","kaleidoscope_tavern:rum_q5":"朗姆酒","kaleidoscope_tavern:rum_q6":"朗姆酒","kaleidoscope_tavern:sakura_incense":"樱花香薰","kaleidoscope_tavern:sakura_wine":"樱花葡萄酒","kaleidoscope_tavern:sakura_wine_q1":"樱花葡萄酒","kaleidoscope_tavern:sakura_wine_q2":"樱花葡萄酒","kaleidoscope_tavern:sakura_wine_q3":"樱花葡萄酒","kaleidoscope_tavern:sakura_wine_q4":"樱花葡萄酒","kaleidoscope_tavern:sakura_wine_q5":"樱花葡萄酒","kaleidoscope_tavern:sakura_wine_q6":"樱花葡萄酒","kaleidoscope_tavern:sandwich_board":"展板","kaleidoscope_tavern:sauvignon_blanc_dry_white":"长相思干白","kaleidoscope_tavern:sauvignon_blanc_dry_white_q1":"长相思干白","kaleidoscope_tavern:sauvignon_blanc_dry_white_q2":"长相思干白","kaleidoscope_tavern:sauvignon_blanc_dry_white_q3":"长相思干白","kaleidoscope_tavern:sauvignon_blanc_dry_white_q4":"长相思干白","kaleidoscope_tavern:sauvignon_blanc_dry_white_q5":"长相思干白","kaleidoscope_tavern:sauvignon_blanc_dry_white_q6":"长相思干白","kaleidoscope_tavern:screwdriver":"螺丝起子","kaleidoscope_tavern:sculk_special":"幽匿特调","kaleidoscope_tavern:shaker":"雪克杯","kaleidoscope_tavern:sherry":"雪莉","kaleidoscope_tavern:sherry_q1":"雪莉","kaleidoscope_tavern:sherry_q2":"雪莉","kaleidoscope_tavern:sherry_q3":"雪莉","kaleidoscope_tavern:sherry_q4":"雪莉","kaleidoscope_tavern:sherry_q5":"雪莉","kaleidoscope_tavern:sherry_q6":"雪莉","kaleidoscope_tavern:signature_cocktail":"特调鸡尾酒","kaleidoscope_tavern:snow_incense":"雪香薰","kaleidoscope_tavern:spore_incense":"孢子香薰","kaleidoscope_tavern:stepladder":"人字梯","kaleidoscope_tavern:string_lights_black":"小灯串（黑色）","kaleidoscope_tavern:string_lights_blue":"小灯串（蓝色）","kaleidoscope_tavern:string_lights_brown":"小灯串（棕色）","kaleidoscope_tavern:string_lights_colorless":"小灯串（无色）","kaleidoscope_tavern:string_lights_cyan":"小灯串（青色）","kaleidoscope_tavern:string_lights_gray":"小灯串（灰色）","kaleidoscope_tavern:string_lights_green":"小灯串（绿色）","kaleidoscope_tavern:string_lights_light_blue":"小灯串（淡蓝色）","kaleidoscope_tavern:string_lights_light_gray":"小灯串（淡灰色）","kaleidoscope_tavern:string_lights_lime":"小灯串（黄绿色）","kaleidoscope_tavern:string_lights_magenta":"小灯串（品红色）","kaleidoscope_tavern:string_lights_orange":"小灯串（橙色）","kaleidoscope_tavern:string_lights_pink":"小灯串（粉色）","kaleidoscope_tavern:string_lights_purple":"小灯串（紫色）","kaleidoscope_tavern:string_lights_red":"小灯串（红色）","kaleidoscope_tavern:string_lights_white":"小灯串（白色）","kaleidoscope_tavern:string_lights_yellow":"小灯串（黄色）","kaleidoscope_tavern:sunset_glow":"落日余晖","kaleidoscope_tavern:sunset_glow_q1":"落日余晖","kaleidoscope_tavern:sunset_glow_q2":"落日余晖","kaleidoscope_tavern:sunset_glow_q3":"落日余晖","kaleidoscope_tavern:sunset_glow_q4":"落日余晖","kaleidoscope_tavern:sunset_glow_q5":"落日余晖","kaleidoscope_tavern:sunset_glow_q6":"落日余晖","kaleidoscope_tavern:sweet_berries_bucket":"甜浆果桶","kaleidoscope_tavern:sweet_berries_juice":"甜浆果汁","kaleidoscope_tavern:sweet_berry_wine":"甜浆果酒","kaleidoscope_tavern:sweet_berry_wine_q1":"甜浆果酒","kaleidoscope_tavern:sweet_berry_wine_q2":"甜浆果酒","kaleidoscope_tavern:sweet_berry_wine_q3":"甜浆果酒","kaleidoscope_tavern:sweet_berry_wine_q4":"甜浆果酒","kaleidoscope_tavern:sweet_berry_wine_q5":"甜浆果酒","kaleidoscope_tavern:sweet_berry_wine_q6":"甜浆果酒","kaleidoscope_tavern:table":"桌子","kaleidoscope_tavern:tap":"龙头","kaleidoscope_tavern:tilted_rack":"倾斜酒架","kaleidoscope_tavern:trellis":"藤架","kaleidoscope_tavern:vinegar":"醋","kaleidoscope_tavern:vinegar_q1":"醋","kaleidoscope_tavern:vinegar_q2":"醋","kaleidoscope_tavern:vinegar_q3":"醋","kaleidoscope_tavern:vinegar_q4":"醋","kaleidoscope_tavern:vinegar_q5":"醋","kaleidoscope_tavern:vinegar_q6":"醋","kaleidoscope_tavern:vodka":"伏特加","kaleidoscope_tavern:vodka_q1":"伏特加","kaleidoscope_tavern:vodka_q2":"伏特加","kaleidoscope_tavern:vodka_q3":"伏特加","kaleidoscope_tavern:vodka_q4":"伏特加","kaleidoscope_tavern:vodka_q5":"伏特加","kaleidoscope_tavern:vodka_q6":"伏特加","kaleidoscope_tavern:water_bottle":"水瓶","kaleidoscope_tavern:watermelon_juice":"西瓜汁","kaleidoscope_tavern:whiskey":"威士忌","kaleidoscope_tavern:whiskey_q1":"威士忌","kaleidoscope_tavern:whiskey_q2":"威士忌","kaleidoscope_tavern:whiskey_q3":"威士忌","kaleidoscope_tavern:whiskey_q4":"威士忌","kaleidoscope_tavern:whiskey_q5":"威士忌","kaleidoscope_tavern:whiskey_q6":"威士忌","kaleidoscope_tavern:white_bar_stool":"白色高脚凳","kaleidoscope_tavern:white_lady":"白色佳人","kaleidoscope_tavern:white_sofa":"白色沙发","kaleidoscope_tavern:wild_grapevine":"野生葡萄藤","kaleidoscope_tavern:wild_grapevine_plant":"野生葡萄藤","kaleidoscope_tavern:wine":"葡萄酒","kaleidoscope_tavern:wine_q1":"葡萄酒","kaleidoscope_tavern:wine_q2":"葡萄酒","kaleidoscope_tavern:wine_q3":"葡萄酒","kaleidoscope_tavern:wine_q4":"葡萄酒","kaleidoscope_tavern:wine_q5":"葡萄酒","kaleidoscope_tavern:wine_q6":"葡萄酒","kaleidoscope_tavern:xp_bottle":"附魔之瓶","kaleidoscope_tavern:yellow_bar_stool":"黄色高脚凳","kaleidoscope_tavern:yellow_pendant_lamp":"黄色垂灯","kaleidoscope_tavern:yellow_sofa":"黄色沙发","kaleidoscope_tavern:bottle_brandy":"Brandy・酒瓶陳列","kaleidoscope_tavern:bottle_carignan":"Carignan・酒瓶陳列","kaleidoscope_tavern:bottle_champagne":"Champagne・酒瓶陳列","kaleidoscope_tavern:bottle_glowflower_brew":"Glowflower Brew・酒瓶陳列","kaleidoscope_tavern:bottle_honey_wine":"Honey Wine・酒瓶陳列","kaleidoscope_tavern:bottle_ice_wine":"Ice Wine・酒瓶陳列","kaleidoscope_tavern:bottle_luminous_bride":"Luminous Bride・酒瓶陳列","kaleidoscope_tavern:bottle_madame_shexiang":"Madame Shexiang・酒瓶陳列","kaleidoscope_tavern:bottle_miners_star":"Miners Star・酒瓶陳列","kaleidoscope_tavern:bottle_mother_snow":"Mother Snow・酒瓶陳列","kaleidoscope_tavern:bottle_plum_wine":"Plum Wine・酒瓶陳列","kaleidoscope_tavern:bottle_polaris_sweet_white":"Polaris Sweet White・酒瓶陳列","kaleidoscope_tavern:bottle_red_queen":"Red Queen・酒瓶陳列","kaleidoscope_tavern:bottle_riesling_dry_white":"Riesling Dry White・酒瓶陳列","kaleidoscope_tavern:bottle_rum":"Rum・酒瓶陳列","kaleidoscope_tavern:bottle_sakura_wine":"Sakura Wine・酒瓶陳列","kaleidoscope_tavern:bottle_sauvignon_blanc_dry_white":"Sauvignon Blanc Dry White・酒瓶陳列","kaleidoscope_tavern:bottle_sherry":"Sherry・酒瓶陳列","kaleidoscope_tavern:bottle_sunset_glow":"Sunset Glow・酒瓶陳列","kaleidoscope_tavern:bottle_sweet_berry_wine":"Sweet Berry Wine・酒瓶陳列","kaleidoscope_tavern:bottle_vinegar":"Vinegar・酒瓶陳列","kaleidoscope_tavern:bottle_vodka":"Vodka・酒瓶陳列","kaleidoscope_tavern:bottle_whiskey":"Whiskey・酒瓶陳列","kaleidoscope_tavern:bottle_wine":"Wine・酒瓶陳列","kaleidoscope_tavern:bottle_watermelon_juice":"西瓜汁・酒瓶陳列","kaleidoscope_tavern:shaker_station":"雪克杯","kaleidoscope_tavern:cup_empty_glassware":"空酒杯","kaleidoscope_tavern:cup_white_lady":"白色佳人","kaleidoscope_tavern:cup_emerald":"翡翠","kaleidoscope_tavern:cup_brass_heart":"黄铜心脏","kaleidoscope_tavern:cup_godfather":"教父","kaleidoscope_tavern:cup_grasshopper":"绿色蚱蜢","kaleidoscope_tavern:cup_screwdriver":"螺丝起子","kaleidoscope_tavern:cup_mojito":"莫吉托","kaleidoscope_tavern:cup_allium_garden":"绒球葱花园","kaleidoscope_tavern:cup_depth_charge":"深水炸弹","kaleidoscope_tavern:cup_nether_special":"下界特调","kaleidoscope_tavern:cup_bloody_mary":"血腥玛丽","kaleidoscope_tavern:cup_sculk_special":"幽匿特调","kaleidoscope_tavern:cup_signature_cocktail":"特调鸡尾酒","kaleidoscope_tavern:cup_mystery_cocktail":"谜之鸡尾酒","kaleidoscope_tavern:stool_white":"白色高脚凳","kaleidoscope_tavern:stool_light_gray":"浅灰色高脚凳","kaleidoscope_tavern:stool_gray":"灰色高脚凳","kaleidoscope_tavern:stool_black":"黑色高脚凳","kaleidoscope_tavern:stool_brown":"棕色高脚凳","kaleidoscope_tavern:stool_red":"红色高脚凳","kaleidoscope_tavern:stool_orange":"橙色高脚凳","kaleidoscope_tavern:stool_yellow":"黄色高脚凳","kaleidoscope_tavern:stool_lime":"浅绿色高脚凳","kaleidoscope_tavern:stool_green":"绿色高脚凳","kaleidoscope_tavern:stool_cyan":"青色高脚凳","kaleidoscope_tavern:stool_light_blue":"浅蓝色高脚凳","kaleidoscope_tavern:stool_blue":"蓝色高脚凳","kaleidoscope_tavern:stool_purple":"紫色高脚凳","kaleidoscope_tavern:stool_magenta":"洋红色高脚凳","kaleidoscope_tavern:stool_pink":"粉红色高脚凳","kaleidoscope_tavern:light_colorless":"无色彩灯","kaleidoscope_tavern:light_white":"白色彩灯","kaleidoscope_tavern:light_light_gray":"浅灰色彩灯","kaleidoscope_tavern:light_gray":"灰色彩灯","kaleidoscope_tavern:light_black":"黑色彩灯","kaleidoscope_tavern:light_brown":"棕色彩灯","kaleidoscope_tavern:light_red":"红色彩灯","kaleidoscope_tavern:light_orange":"橙色彩灯","kaleidoscope_tavern:light_yellow":"黄色彩灯","kaleidoscope_tavern:light_lime":"浅绿色彩灯","kaleidoscope_tavern:light_green":"绿色彩灯","kaleidoscope_tavern:light_cyan":"青色彩灯","kaleidoscope_tavern:light_light_blue":"浅蓝色彩灯","kaleidoscope_tavern:light_blue":"蓝色彩灯","kaleidoscope_tavern:light_purple":"紫色彩灯","kaleidoscope_tavern:light_magenta":"洋红色彩灯","kaleidoscope_tavern:light_pink":"粉红色彩灯","kaleidoscope_tavern:ysbb_painting":"挂画・药水棒冰","kaleidoscope_tavern:tartaric_acid_painting":"挂画・酒石酸菌","kaleidoscope_tavern:cr019_painting":"挂画・CR019","kaleidoscope_tavern:unknown_painting":"挂画・Unknown","kaleidoscope_tavern:master_marisa_painting":"挂画・摸里傻","kaleidoscope_tavern:son_of_man_painting":"挂画・人类之子","kaleidoscope_tavern:david_painting":"挂画・大卫","kaleidoscope_tavern:girl_with_pearl_earring_painting":"挂画・戴珍珠耳环的少女","kaleidoscope_tavern:starry_night_painting":"挂画・星夜","kaleidoscope_tavern:van_gogh_self_portrait_painting":"挂画・梵高自画像","kaleidoscope_tavern:father_painting":"挂画・父亲","kaleidoscope_tavern:great_wave_painting":"挂画・神奈川冲浪里","kaleidoscope_tavern:mona_lisa_painting":"挂画・蒙娜丽莎","kaleidoscope_tavern:mondrian_painting":"挂画・蒙德里安","kaleidoscope_tavern:base_sandwich_board":"素面立式告示牌","kaleidoscope_tavern:grass_sandwich_board":"草饰立式告示牌","kaleidoscope_tavern:allium_sandwich_board":"紫色绒球葱饰立式告示牌","kaleidoscope_tavern:azure_bluet_sandwich_board":"蓝眼草饰立式告示牌","kaleidoscope_tavern:cornflower_sandwich_board":"矢车菊饰立式告示牌","kaleidoscope_tavern:orchid_sandwich_board":"蓝色蝴蝶兰饰立式告示牌","kaleidoscope_tavern:peony_sandwich_board":"牡丹饰立式告示牌","kaleidoscope_tavern:pink_petals_sandwich_board":"樱花花瓣饰立式告示牌","kaleidoscope_tavern:pitcher_plant_sandwich_board":"瓶子草饰立式告示牌","kaleidoscope_tavern:poppy_sandwich_board":"虞美人饰立式告示牌","kaleidoscope_tavern:sunflower_sandwich_board":"向日葵饰立式告示牌","kaleidoscope_tavern:torchflower_sandwich_board":"火炬花饰立式告示牌","kaleidoscope_tavern:tulip_sandwich_board":"郁金香饰立式告示牌","kaleidoscope_tavern:wither_rose_sandwich_board":"凋零玫瑰饰立式告示牌"},"zh_TW":{"minecraft:apple":"蘋果","minecraft:bell":"鐘","minecraft:blaze_powder":"烈焰粉","minecraft:bucket":"空桶","minecraft:diamond":"鑽石","minecraft:glow_ink_sac":"發光墨囊","minecraft:end_rod":"終界燭","minecraft:ender_pearl":"終界珍珠","minecraft:glass_bottle":"玻璃瓶","minecraft:gold_nugget":"金粒","minecraft:iron_nugget":"鐵粒","minecraft:iron_hoe":"鐵鋤","minecraft:honeycomb":"蜂巢","minecraft:iron_ingot":"鐵錠","minecraft:painting":"圖畫","minecraft:potato":"馬鈴薯","minecraft:redstone":"紅石塵","minecraft:snowball":"雪球","minecraft:sugar":"糖","minecraft:gunpowder":"火藥","minecraft:wheat":"作物","minecraft:glowstone_dust":"螢石粉","minecraft:sweet_berries":"甜莓","minecraft:mangrove_fence":"紅樹林柵欄","minecraft:mangrove_trapdoor":"紅樹林地板門","minecraft:echo_shard":"回聲碎片","minecraft:bamboo_fence":"竹子柵欄","minecraft:bamboo_trapdoor":"竹子地板門","minecraft:cherry_fence":"櫻花木柵欄","minecraft:cherry_sapling":"櫻花樹苗","minecraft:cherry_trapdoor":"櫻花木地板門","minecraft:pink_petals":"粉紅色花瓣","minecraft:spore_blossom":"孢子花","minecraft:glow_berries":"螢光莓","minecraft:crimson_trapdoor":"緋紅蕈木地板門","minecraft:warped_trapdoor":"扭曲蕈木地板門","minecraft:crimson_fence":"緋紅蕈木柵欄","minecraft:warped_fence":"扭曲蕈木柵欄","minecraft:chain":"鎖鏈","minecraft:wither_rose":"凋零玫瑰","minecraft:grass":"青草方塊","minecraft:hopper":"漏斗","minecraft:ice":"冰塊","minecraft:packed_ice":"冰磚","minecraft:blue_ice":"藍冰","minecraft:iron_trapdoor":"鐵地板門","minecraft:ladder":"梯子","minecraft:lava":"熔岩","minecraft:lever":"拉桿","minecraft:nether_brick_fence":"地獄磚柵欄","minecraft:glass_pane":"玻璃片","minecraft:trapdoor":"橡木地板門","minecraft:acacia_trapdoor":"相思木地板門","minecraft:birch_trapdoor":"樺木地板門","minecraft:dark_oak_trapdoor":"黑橡木地板門","minecraft:jungle_trapdoor":"叢林地板門","minecraft:spruce_trapdoor":"杉木地板門","minecraft:vine":"藤蔓","minecraft:water":"水","minecraft:lantern":"燈籠","minecraft:soul_lantern":"靈魂燈籠","minecraft:barrel":"木桶","minecraft:pitcher_plant":"豬籠草","minecraft:torchflower":"火炬花","minecraft:copper_trapdoor":"銅製地板門","minecraft:exposed_copper_trapdoor":"外露的銅地板門","minecraft:oxidized_copper_trapdoor":"氧化的銅地板門","minecraft:waxed_copper_trapdoor":"上蠟的銅地板門","minecraft:waxed_exposed_copper_trapdoor":"上蠟的外露銅地板門","minecraft:waxed_oxidized_copper_trapdoor":"上蠟的氧化銅地板門","minecraft:waxed_weathered_copper_trapdoor":"上蠟的風化銅地板門","minecraft:weathered_copper_trapdoor":"風化的銅地板門","minecraft:sugar_cane":"甘蔗","minecraft:potion":"藥水","kaleidoscope_cookery:apple_platter":"蘋果 拼盤","kaleidoscope_cookery:bamboo_tube_rice":"Bamboo Tube 米飯","kaleidoscope_cookery:baozi":"Baozi","kaleidoscope_cookery:baozi_plate":"一盤 Baozi","kaleidoscope_cookery:barley_tea":"Barley 茶","kaleidoscope_cookery:beef_meatball_soup":"牛肉 肉ball 湯","kaleidoscope_cookery:beef_noodle":"牛肉 麵","kaleidoscope_cookery:berry_platter":"莓果 拼盤","kaleidoscope_cookery:biluochun":"Biluochun","kaleidoscope_cookery:blaze_lamb_chop":"Blaze 羊肉 Chop","kaleidoscope_cookery:borscht":"Borscht","kaleidoscope_cookery:braised_beef":"紅燒 牛肉","kaleidoscope_cookery:braised_beef_rice_bowl":"紅燒 牛肉 on 米飯","kaleidoscope_cookery:braised_beef_with_potatoes":"紅燒 牛肉 with 馬鈴薯","kaleidoscope_cookery:braised_pork_ribs":"紅燒 豬肉 Ribs","kaleidoscope_cookery:brown_mushroom_pot_soup":"Brown 蘑菇 Pot 湯","kaleidoscope_cookery:buddha_jumps_over_the_wall":"Buddha Jumps Over the Wall","kaleidoscope_cookery:candied_potato":"Candied 馬鈴薯","kaleidoscope_cookery:caterpillar":"Caterpillar","kaleidoscope_cookery:chair_acacia":"Acacia 椅子","kaleidoscope_cookery:chair_bamboo":"Bamboo 椅子","kaleidoscope_cookery:chair_birch":"Birch 椅子","kaleidoscope_cookery:chair_cherry":"Cherry 椅子","kaleidoscope_cookery:chair_crimson":"Crimson 椅子","kaleidoscope_cookery:chair_dark_oak":"Dark Oak 椅子","kaleidoscope_cookery:chair_jungle":"Jungle 椅子","kaleidoscope_cookery:chair_mangrove":"Mangrove 椅子","kaleidoscope_cookery:chair_oak":"Oak 椅子","kaleidoscope_cookery:chair_spruce":"Spruce 椅子","kaleidoscope_cookery:chair_warped":"Warped 椅子","kaleidoscope_cookery:chicken_and_mushroom_stew":"雞肉 and 蘑菇 Stew","kaleidoscope_cookery:chili_seed":"辣椒 種子","kaleidoscope_cookery:chili_ristra":"辣椒串","kaleidoscope_cookery:chopping_board":"砧板","kaleidoscope_cookery:chorus_fried_egg":"Chorus 炸 蛋","kaleidoscope_cookery:chorus_fruit_platter":"Chorus 水果 拼盤","kaleidoscope_cookery:cold_cut_ham_slices":"Cold Cut Ham Slices","kaleidoscope_cookery:cold_roasted_meat":"Cold Roasted 肉","kaleidoscope_cookery:cold_style_sashimi":"Frost Style Sashimi","kaleidoscope_cookery:cook_stool_acacia":"Acacia 廚師凳","kaleidoscope_cookery:cook_stool_bamboo":"Bamboo 廚師凳","kaleidoscope_cookery:cook_stool_birch":"Birch 廚師凳","kaleidoscope_cookery:cook_stool_cherry":"Cherry 廚師凳","kaleidoscope_cookery:cook_stool_crimson":"Crimson 廚師凳","kaleidoscope_cookery:cook_stool_dark_oak":"Dark Oak 廚師凳","kaleidoscope_cookery:cook_stool_jungle":"Jungle 廚師凳","kaleidoscope_cookery:cook_stool_mangrove":"Mangrove 廚師凳","kaleidoscope_cookery:cook_stool_oak":"Oak 廚師凳","kaleidoscope_cookery:cook_stool_spruce":"Spruce 廚師凳","kaleidoscope_cookery:cook_stool_warped":"Warped 廚師凳","kaleidoscope_cookery:cooked_cow_offal":"熟 Cow Offal","kaleidoscope_cookery:cooked_cut_small_meats":"熟 肉 Cuts","kaleidoscope_cookery:cooked_lamb_chops":"熟 羊肉 Chops","kaleidoscope_cookery:cooked_meatball":"熟 肉ball","kaleidoscope_cookery:cooked_pork_belly":"熟 豬肉 Belly","kaleidoscope_cookery:cooked_rice":"熟 米飯","kaleidoscope_cookery:crimson_fungus_pot_soup":"Crimson Fungus Pot 湯","kaleidoscope_cookery:crystal_lamb_chop":"Crystal 羊肉 Chop","kaleidoscope_cookery:dark_cuisine":"Dark Cuisine","kaleidoscope_cookery:desert_style_sashimi":"Desert Style Sashimi","kaleidoscope_cookery:diamond_kitchen_knife":"Diamond 菜刀","kaleidoscope_cookery:dongpo_pork":"Dongpo 豬肉","kaleidoscope_cookery:donkey_burger":"Donkey Burger","kaleidoscope_cookery:dough_drop_soup":"Dough Drop 湯","kaleidoscope_cookery:dumpling":"Dumpling","kaleidoscope_cookery:egg_fried_rice":"蛋 炸 米飯","kaleidoscope_cookery:empty_cup":"空茶杯","kaleidoscope_cookery:enamel_basin":"油壺","kaleidoscope_cookery:end_style_sashimi":"End Style Sashimi","kaleidoscope_cookery:farmer_boots":"Farmer's Boots","kaleidoscope_cookery:farmer_chest_plate":"Farmer's Overalls","kaleidoscope_cookery:farmer_leggings":"Farmer's Work Pants","kaleidoscope_cookery:fearsome_thick_soup":"Fearsome Thick 湯","kaleidoscope_cookery:fish_flavored_shredded_pork":"魚 Flavored Shredded 豬肉","kaleidoscope_cookery:fish_flavored_shredded_pork_rice_bowl":"魚 Flavored Shredded 豬肉 on 米飯","kaleidoscope_cookery:flour":"Flour","kaleidoscope_cookery:flower_tea":"Flower 茶","kaleidoscope_cookery:fondant_pie":"Fondant Pie","kaleidoscope_cookery:fondant_spider_eye":"Fondant Spider Eye","kaleidoscope_cookery:four_joy_meatball_soup":"Four Joy 肉ball 湯","kaleidoscope_cookery:fried_caterpillar":"炸 Caterpillar","kaleidoscope_cookery:fried_egg":"炸 蛋","kaleidoscope_cookery:fried_spring_roll":"炸 Spring Roll","kaleidoscope_cookery:frost_lamb_chop":"Frost 羊肉 Chop","kaleidoscope_cookery:fruit_basket":"果籃","kaleidoscope_cookery:gold_kitchen_knife":"Gold 菜刀","kaleidoscope_cookery:golden_salad":"Golden Salad","kaleidoscope_cookery:green_chili":"Green 辣椒","kaleidoscope_cookery:hot_dry_noodles":"Hot Dry 麵","kaleidoscope_cookery:hui_noodle":"羊肉 Hui 麵","kaleidoscope_cookery:iron_kitchen_knife":"Iron 菜刀","kaleidoscope_cookery:kitchen_shovel":"鍋鏟","kaleidoscope_cookery:kitchen_shovel_has_oil":"鍋鏟 (油脂ed)","kaleidoscope_cookery:kitchenware_racks":"廚具架","kaleidoscope_cookery:laba_congee":"Laba Congee","kaleidoscope_cookery:lamb_and_radish_soup":"Mutton and Radish 湯","kaleidoscope_cookery:lettuce":"生菜","kaleidoscope_cookery:lettuce_seed":"生菜 種子","kaleidoscope_cookery:mantou":"Mantou","kaleidoscope_cookery:meat_pie":"肉 Pie","kaleidoscope_cookery:millstone":"石磨","kaleidoscope_cookery:nether_style_sashimi":"Nether Style Sashimi","kaleidoscope_cookery:netherite_kitchen_knife":"Netherite 菜刀","kaleidoscope_cookery:numbing_spicy_chicken":"Numbing 香辣 雞肉","kaleidoscope_cookery:oil":"油脂","kaleidoscope_cookery:oil_block":"油脂方塊","kaleidoscope_cookery:oil_pot":"油罐","kaleidoscope_cookery:oil_splashed_fish":"油脂-Splashed 魚","kaleidoscope_cookery:oolong":"Oolong","kaleidoscope_cookery:pan_seared_knight_steak":"Pan-Seared Knight Steak","kaleidoscope_cookery:pork_bone_soup":"豬肉 Bone 湯","kaleidoscope_cookery:pot":"炒鍋","kaleidoscope_cookery:pufferfish_soup":"Pufferfish 湯","kaleidoscope_cookery:qingtuan":"Qingtuan","kaleidoscope_cookery:qingtuan_plate":"一盤 Qingtuan","kaleidoscope_cookery:raw_bamboo_tube_rice":"生 Bamboo Tube 米飯","kaleidoscope_cookery:raw_cow_offal":"生 Cow Offal","kaleidoscope_cookery:raw_cut_small_meats":"生 肉 Cuts","kaleidoscope_cookery:raw_dough":"生 Dough","kaleidoscope_cookery:raw_lamb_chops":"生 羊肉 Chops","kaleidoscope_cookery:raw_meatball":"生 肉ball","kaleidoscope_cookery:raw_noodles":"生 麵","kaleidoscope_cookery:raw_pork_belly":"生 豬肉 Belly","kaleidoscope_cookery:raw_zongzi":"生 Zongzi","kaleidoscope_cookery:red_chili":"Red 辣椒","kaleidoscope_cookery:red_mushroom_pot_soup":"Red 蘑菇 Pot 湯","kaleidoscope_cookery:rice":"米飯 種子","kaleidoscope_cookery:rice_panicle":"米飯 Panicle","kaleidoscope_cookery:sakura_fubuki":"Sakura Fubuki","kaleidoscope_cookery:samsa":"Samsa","kaleidoscope_cookery:sashimi":"Sashimi","kaleidoscope_cookery:scarecrow":"稻草人","kaleidoscope_cookery:scramble_egg_with_tomatoes":"Scramble 蛋 with 番茄es","kaleidoscope_cookery:scramble_egg_with_tomatoes_rice_bowl":"Scramble 蛋 with 番茄es on 米飯","kaleidoscope_cookery:seafood_miso_soup":"Seafood Miso 湯","kaleidoscope_cookery:shawarma_spit":"Shawarma Spit","kaleidoscope_cookery:shengjian_mantou":"Shengjian Mantou","kaleidoscope_cookery:shengjian_mantou_plate":"一盤 Shengjian Mantou","kaleidoscope_cookery:sickle":"Sickle","kaleidoscope_cookery:slime_ball_meal":"Slime Ball Meal","kaleidoscope_cookery:spicy_blood_stew":"香辣 Blood Stew","kaleidoscope_cookery:spicy_chicken":"香辣 雞肉","kaleidoscope_cookery:spicy_rabbit_head":"香辣 Rabbit Head","kaleidoscope_cookery:stargazy_pie":"Stargazy Pie","kaleidoscope_cookery:steamer":"蒸籠","kaleidoscope_cookery:sticky_candy":"Sticky Candy","kaleidoscope_cookery:sticky_candy_plate":"一盤 Sticky Candy","kaleidoscope_cookery:sticky_rice_cake":"Sticky 米飯 Cake","kaleidoscope_cookery:sticky_rice_cake_plate":"一盤 Sticky 米飯 Cakes","kaleidoscope_cookery:stir_fried_pork_with_peppers":"Stir-fried 豬肉 with Peppers","kaleidoscope_cookery:stir_fried_pork_with_peppers_rice_bowl":"Stir-fried 豬肉 with Peppers on 米飯","kaleidoscope_cookery:stockpot":"湯鍋","kaleidoscope_cookery:stockpot_lid":"湯鍋蓋","kaleidoscope_cookery:stove":"爐灶","kaleidoscope_cookery:straw_block":"稻草捆","kaleidoscope_cookery:straw_hat":"草帽","kaleidoscope_cookery:straw_hat_flower":"花飾草帽","kaleidoscope_cookery:strung_mushrooms":"蘑菇串","kaleidoscope_cookery:stuffed_dough_food":"Stuffed Dough","kaleidoscope_cookery:stuffed_tiger_skin_pepper":"Stuffed Tiger Skin Pepper","kaleidoscope_cookery:suspicious_stir_fry":"Suspicious Stir-Fry","kaleidoscope_cookery:sweet_and_sour_ender_pearls":"糖醋 Ender Pearls","kaleidoscope_cookery:sweet_and_sour_pork":"糖醋 豬肉","kaleidoscope_cookery:sweet_and_sour_pork_rice_bowl":"糖醋 豬肉 on 米飯","kaleidoscope_cookery:table_acacia":"Acacia 餐桌","kaleidoscope_cookery:table_bamboo":"Bamboo 餐桌","kaleidoscope_cookery:table_birch":"Birch 餐桌","kaleidoscope_cookery:table_cherry":"Cherry 餐桌","kaleidoscope_cookery:table_crimson":"Crimson 餐桌","kaleidoscope_cookery:table_dark_oak":"Dark Oak 餐桌","kaleidoscope_cookery:table_jungle":"Jungle 餐桌","kaleidoscope_cookery:table_mangrove":"Mangrove 餐桌","kaleidoscope_cookery:table_oak":"Oak 餐桌","kaleidoscope_cookery:table_spruce":"Spruce 餐桌","kaleidoscope_cookery:table_warped":"Warped 餐桌","kaleidoscope_cookery:teapot":"Teapot","kaleidoscope_cookery:tieguanyin":"Tieguanyin","kaleidoscope_cookery:tomato":"番茄","kaleidoscope_cookery:tomato_seed":"番茄 種子","kaleidoscope_cookery:tomato_platter":"番茄 拼盤","kaleidoscope_cookery:transmutation_lunch_bag":"Transmutation Lunch Bag","kaleidoscope_cookery:trash_can":"垃圾桶","kaleidoscope_cookery:tundra_style_sashimi":"Tundra Style Sashimi","kaleidoscope_cookery:udon_noodle":"Udon 麵","kaleidoscope_cookery:warped_fungus_pot_soup":"Warped Fungus Pot 湯","kaleidoscope_cookery:watermelon_platter":"西瓜 拼盤","kaleidoscope_cookery:wild_mushroom_rabbit_soup":"Wild 蘑菇 Rabbit 湯","kaleidoscope_cookery:wild_rice":"Wild 米飯 種子","kaleidoscope_cookery:zongzi":"熟 Zongzi","kaleidoscope_cookery:zongzi_plate":"一盤 Zongzi","kaleidoscope_cookery:oil_pot_filled":"裝滿的油罐","kaleidoscope_cookery:raw_donkey_meat":"生 Donkey 肉","kaleidoscope_cookery:cooked_donkey_meat":"熟 Donkey 肉","kaleidoscope_cookery:donkey_soup":"Donkey 肉 湯","kaleidoscope_cookery:braised_fish_rice_bowl":"紅燒 魚 米飯 Bowl","kaleidoscope_cookery:spicy_chicken_rice_bowl":"香辣 雞肉 米飯 Bowl","kaleidoscope_cookery:delicious_egg_fried_rice":"Delicious 蛋 炸 米飯","kaleidoscope_cookery:suspicious_stir_fry_rice_bowl":"Suspicious 米飯 Bowl","kaleidoscope_cookery:country_style_mixed_vegetables":"Garden Mixed Vegetables","kaleidoscope_cookery:yakitori":"Yakitori","kaleidoscope_cookery:braised_fish":"紅燒 魚","kaleidoscope_cookery:tomato_beef_brisket_soup":"番茄 牛肉 Brisket 湯","kaleidoscope_cookery:stir_fried_beef_offal":"Stir-fried Cow Offal","kaleidoscope_cookery:stir_fried_beef_offal_rice_bowl":"Stir-fried Cow Offal 米飯 Bowl","kaleidoscope_cookery:fruit_platter":"水果 拼盤","kaleidoscope_cookery:stockpot_lid_visual":"湯鍋蓋","kaleidoscope_cookery:scarecrow_lantern_light":"稻草人","kaleidoscope_cookery:scarecrow_soul_lantern_light":"稻草人","kaleidoscope_cookery:guidebook":"Guidebook","kaleidoscope_cookery:master_recipe_page":"Master Recipe Page","kaleidoscope_cookery:rack_trident_display_item":"Rack Trident Display Item","kaleidoscope_cookery:recipe_page_beef_noodle":"Recipe Page Beef Noodle","kaleidoscope_cookery:recipe_page_blaze_lamb_chop":"Recipe Page Blaze Lamb Chop","kaleidoscope_cookery:recipe_page_borscht":"Recipe Page Borscht","kaleidoscope_cookery:recipe_page_braised_beef":"Recipe Page Braised Beef","kaleidoscope_cookery:recipe_page_brown_mushroom_pot_soup":"Recipe Page Brown Mushroom Pot Soup","kaleidoscope_cookery:recipe_page_buddha_jumps_over_the_wall":"Recipe Page Buddha Jumps Over The Wall","kaleidoscope_cookery:recipe_page_candied_potato":"Recipe Page Candied Potato","kaleidoscope_cookery:recipe_page_chorus_fried_egg":"Recipe Page Chorus Fried Egg","kaleidoscope_cookery:recipe_page_crimson_fungus_pot_soup":"Recipe Page Crimson Fungus Pot Soup","kaleidoscope_cookery:recipe_page_crystal_lamb_chop":"Recipe Page Crystal Lamb Chop","kaleidoscope_cookery:recipe_page_dongpo_pork":"Recipe Page Dongpo Pork","kaleidoscope_cookery:recipe_page_donkey_burger":"Recipe Page Donkey Burger","kaleidoscope_cookery:recipe_page_dumpling":"Recipe Page Dumpling","kaleidoscope_cookery:recipe_page_fearsome_thick_soup":"Recipe Page Fearsome Thick Soup","kaleidoscope_cookery:recipe_page_fish_flavored_shredded_pork":"Recipe Page Fish Flavored Shredded Pork","kaleidoscope_cookery:recipe_page_fondant_pie":"Recipe Page Fondant Pie","kaleidoscope_cookery:recipe_page_fondant_spider_eye":"Recipe Page Fondant Spider Eye","kaleidoscope_cookery:recipe_page_four_joy_meatball_soup":"Recipe Page Four Joy Meatball Soup","kaleidoscope_cookery:recipe_page_fried_caterpillar":"Recipe Page Fried Caterpillar","kaleidoscope_cookery:recipe_page_fried_egg":"Recipe Page Fried Egg","kaleidoscope_cookery:recipe_page_fried_spring_roll":"Recipe Page Fried Spring Roll","kaleidoscope_cookery:recipe_page_frost_lamb_chop":"Recipe Page Frost Lamb Chop","kaleidoscope_cookery:recipe_page_hot_dry_noodles":"Recipe Page Hot Dry Noodles","kaleidoscope_cookery:recipe_page_hui_noodle":"Recipe Page Hui Noodle","kaleidoscope_cookery:recipe_page_laba_congee":"Recipe Page Laba Congee","kaleidoscope_cookery:recipe_page_lamb_and_radish_soup":"Recipe Page Lamb And Radish Soup","kaleidoscope_cookery:recipe_page_meat_pie":"Recipe Page Meat Pie","kaleidoscope_cookery:recipe_page_numbing_spicy_chicken":"Recipe Page Numbing Spicy Chicken","kaleidoscope_cookery:recipe_page_pan_seared_knight_steak":"Recipe Page Pan Seared Knight Steak","kaleidoscope_cookery:recipe_page_pufferfish_soup":"Recipe Page Pufferfish Soup","kaleidoscope_cookery:recipe_page_red_mushroom_pot_soup":"Recipe Page Red Mushroom Pot Soup","kaleidoscope_cookery:recipe_page_seafood_miso_soup":"Recipe Page Seafood Miso Soup","kaleidoscope_cookery:recipe_page_shengjian_mantou":"Recipe Page Shengjian Mantou","kaleidoscope_cookery:recipe_page_slime_ball_meal":"Recipe Page Slime Ball Meal","kaleidoscope_cookery:recipe_page_spicy_blood_stew":"Recipe Page Spicy Blood Stew","kaleidoscope_cookery:recipe_page_spicy_chicken":"Recipe Page Spicy Chicken","kaleidoscope_cookery:recipe_page_spicy_rabbit_head":"Recipe Page Spicy Rabbit Head","kaleidoscope_cookery:recipe_page_stargazy_pie":"Recipe Page Stargazy Pie","kaleidoscope_cookery:recipe_page_sticky_candy":"Recipe Page Sticky Candy","kaleidoscope_cookery:recipe_page_sticky_rice_cake":"Recipe Page Sticky Rice Cake","kaleidoscope_cookery:recipe_page_stir_fried_pork_with_peppers":"Recipe Page Stir Fried Pork With Peppers","kaleidoscope_cookery:recipe_page_stuffed_tiger_skin_pepper":"Recipe Page Stuffed Tiger Skin Pepper","kaleidoscope_cookery:recipe_page_sweet_and_sour_ender_pearls":"Recipe Page Sweet And Sour Ender Pearls","kaleidoscope_cookery:recipe_page_sweet_and_sour_pork":"Recipe Page Sweet And Sour Pork","kaleidoscope_cookery:recipe_page_udon_noodle":"Recipe Page Udon Noodle","kaleidoscope_cookery:recipe_page_warped_fungus_pot_soup":"Recipe Page Warped Fungus Pot Soup","kaleidoscope_cookery:recipe_page_wild_mushroom_rabbit_soup":"Recipe Page Wild Mushroom Rabbit Soup","kaleidoscope_cookery:recipe_page_zongzi":"Recipe Page Zongzi","kt_assets_a1:pressing_tub":"壓榨桶","kt_assets_a1:pressing_tub_tilt":"傾斜壓榨桶","kt_assets_a1:tap_closed":"龍頭・關閉","kt_assets_a1:tap_open":"龍頭・開啟","kt_assets_a1:wine_1":"葡萄酒・1 瓶","kt_assets_a1:wine_2":"葡萄酒・2 瓶","kt_assets_a1:wine_3":"葡萄酒・3 瓶","kt_assets_a1:wine_4":"葡萄酒・4 瓶","kt_assets_a1:grape":"葡萄","kt_assets_a2:trellis_single":"藤架・直立","kt_assets_a2:trellis_east_west":"藤架・東西橫桿","kt_assets_a2:trellis_north_south":"藤架・南北橫桿","kt_assets_a2:trellis_cross_east_west":"藤架・東西十字","kt_assets_a2:trellis_cross_north_south":"藤架・南北十字","kt_assets_a2:trellis_cross_up_down":"藤架・水平十字","kt_assets_a2:trellis_six_direction":"藤架・六向連接","kt_assets_a2:grapevine_stage0":"普通葡萄藤・階段 0","kt_assets_a2:grapevine_stage1":"普通葡萄藤・階段 1","kt_assets_a2:grapevine_stage2":"普通葡萄藤・階段 2","kt_assets_a2:grapevine_stage3":"普通葡萄藤・階段 3","kt_assets_a2:grape_crop_stage0":"普通葡萄果實・階段 0","kt_assets_a2:grape_crop_stage1":"普通葡萄果實・階段 1","kt_assets_a2:grape_crop_stage2":"普通葡萄果實・階段 2","kt_assets_a2:grape_crop_stage3":"普通葡萄果實・階段 3","kt_assets_a2:grape_crop_stage4":"普通葡萄果實・階段 4","kt_assets_a2:grape_crop_stage5":"普通葡萄果實・階段 5","kt_assets_a2:ice_grape_crop_stage0":"冰葡萄果實・階段 0","kt_assets_a2:ice_grape_crop_stage1":"冰葡萄果實・階段 1","kt_assets_a2:ice_grape_crop_stage2":"冰葡萄果實・階段 2","kt_assets_a2:ice_grape_crop_stage3":"冰葡萄果實・階段 3","kt_assets_a2:ice_grape_crop_stage4":"冰葡萄果實・階段 4","kt_assets_a2:ice_grape_crop_stage5":"冰葡萄果實・階段 5","kt_assets_a2:gold_grape_crop_stage0":"金葡萄果實・階段 0","kt_assets_a2:gold_grape_crop_stage1":"金葡萄果實・階段 1","kt_assets_a2:gold_grape_crop_stage2":"金葡萄果實・階段 2","kt_assets_a2:gold_grape_crop_stage3":"金葡萄果實・階段 3","kt_assets_a2:gold_grape_crop_stage4":"金葡萄果實・階段 4","kt_assets_a2:gold_grape_crop_stage5":"金葡萄果實・階段 5","kt_assets_a2:ice_grape":"冰葡萄","kt_assets_a2:gold_grape":"金葡萄","kt_assets_a2:green_grape":"青提葡萄","kt_assets_a2:grape_bucket":"葡萄汁桶","kt_assets_a2:ice_grape_bucket":"冰葡萄汁桶","kt_assets_a2:gold_grape_bucket":"金葡萄汁桶","kt_assets_a2:green_grape_bucket":"青提葡萄汁桶","kt_assets_a2:sweet_berries_bucket":"甜莓果汁桶","kt_assets_a2:glow_berries_bucket":"螢光莓果汁桶","kt_assets_a3:grapevine_east_west":"普通葡萄藤・東西橫向","kt_assets_a3:grapevine_north_south":"普通葡萄藤・南北橫向","kt_assets_a3:grapevine_cross_east_west":"普通葡萄藤・東西十字","kt_assets_a3:grapevine_cross_north_south":"普通葡萄藤・南北十字","kt_assets_a3:grapevine_cross_up_down":"普通葡萄藤・水平十字","kt_assets_a3:grapevine_six_direction":"普通葡萄藤・六向連接","kt_assets_a3:ice_grapevine_stage0":"冰葡萄藤・階段 0","kt_assets_a3:ice_grapevine_stage1":"冰葡萄藤・階段 1","kt_assets_a3:ice_grapevine_stage2":"冰葡萄藤・階段 2","kt_assets_a3:ice_grapevine_stage3":"冰葡萄藤・階段 3","kt_assets_a3:ice_grapevine_east_west":"冰葡萄藤・東西橫向","kt_assets_a3:ice_grapevine_north_south":"冰葡萄藤・南北橫向","kt_assets_a3:ice_grapevine_cross_east_west":"冰葡萄藤・東西十字","kt_assets_a3:ice_grapevine_cross_north_south":"冰葡萄藤・南北十字","kt_assets_a3:ice_grapevine_cross_up_down":"冰葡萄藤・水平十字","kt_assets_a3:ice_grapevine_six_direction":"冰葡萄藤・六向連接","kt_assets_a3:gold_grapevine_stage0":"金葡萄藤・階段 0","kt_assets_a3:gold_grapevine_stage1":"金葡萄藤・階段 1","kt_assets_a3:gold_grapevine_stage2":"金葡萄藤・階段 2","kt_assets_a3:gold_grapevine_stage3":"金葡萄藤・階段 3","kt_assets_a3:gold_grapevine_east_west":"金葡萄藤・東西橫向","kt_assets_a3:gold_grapevine_north_south":"金葡萄藤・南北橫向","kt_assets_a3:gold_grapevine_cross_east_west":"金葡萄藤・東西十字","kt_assets_a3:gold_grapevine_cross_north_south":"金葡萄藤・南北十字","kt_assets_a3:gold_grapevine_cross_up_down":"金葡萄藤・水平十字","kt_assets_a3:gold_grapevine_six_direction":"金葡萄藤・六向連接","kt_assets_a3:wild_grapevine":"野生葡萄藤・末梢","kt_assets_a3:wild_grapevine_plant":"野生葡萄藤・中段","kt_assets_a3:empty_bottle_faces":"空酒瓶・保留內側面","kt_assets_a4:champagne_1":"香檳・1 瓶","kt_assets_a4:champagne_2":"香檳・2 瓶","kt_assets_a4:champagne_3":"香檳・3 瓶","kt_assets_a4:champagne_4":"香檳・4 瓶","kt_assets_a4:honey_wine_1":"蜂蜜葡萄酒・1 瓶","kt_assets_a4:honey_wine_2":"蜂蜜葡萄酒・2 瓶","kt_assets_a4:honey_wine_3":"蜂蜜葡萄酒・3 瓶","kt_assets_a4:honey_wine_4":"蜂蜜葡萄酒・4 瓶","kt_assets_a4:ice_wine_1":"冰葡萄酒・1 瓶","kt_assets_a4:ice_wine_2":"冰葡萄酒・2 瓶","kt_assets_a4:ice_wine_3":"冰葡萄酒・3 瓶","kt_assets_a4:ice_wine_4":"冰葡萄酒・4 瓶","kt_assets_a4:sofa_white_single":"白色沙發・單座","kt_assets_a4:sofa_orange_single":"橙色沙發・單座","kt_assets_a4:sofa_magenta_single":"洋紅色沙發・單座","kt_assets_a4:sofa_light_blue_single":"淺藍色沙發・單座","kt_assets_a4:sofa_yellow_single":"黃色沙發・單座","kt_assets_a4:sofa_lime_single":"淺綠色沙發・單座","kt_assets_a4:sofa_pink_single":"粉紅色沙發・單座","kt_assets_a4:sofa_gray_single":"灰色沙發・單座","kt_assets_a4:sofa_light_gray_single":"淺灰色沙發・單座","kt_assets_a4:sofa_cyan_single":"青色沙發・單座","kt_assets_a4:sofa_purple_single":"紫色沙發・單座","kt_assets_a4:sofa_blue_single":"藍色沙發・單座","kt_assets_a4:sofa_brown_single":"棕色沙發・單座","kt_assets_a4:sofa_green_single":"綠色沙發・單座","kt_assets_a4:sofa_red_single":"紅色沙發・單座","kt_assets_a4:sofa_black_single":"黑色沙發・單座","kt_assets_a4:sofa_white_left":"白色沙發・左端","kt_assets_a4:sofa_orange_left":"橙色沙發・左端","kt_assets_a4:sofa_magenta_left":"洋紅色沙發・左端","kt_assets_a4:sofa_light_blue_left":"淺藍色沙發・左端","kt_assets_a4:sofa_yellow_left":"黃色沙發・左端","kt_assets_a4:sofa_lime_left":"淺綠色沙發・左端","kt_assets_a4:sofa_pink_left":"粉紅色沙發・左端","kt_assets_a4:sofa_gray_left":"灰色沙發・左端","kt_assets_a4:sofa_light_gray_left":"淺灰色沙發・左端","kt_assets_a4:sofa_cyan_left":"青色沙發・左端","kt_assets_a4:sofa_purple_left":"紫色沙發・左端","kt_assets_a4:sofa_blue_left":"藍色沙發・左端","kt_assets_a4:sofa_brown_left":"棕色沙發・左端","kt_assets_a4:sofa_green_left":"綠色沙發・左端","kt_assets_a4:sofa_red_left":"紅色沙發・左端","kt_assets_a4:sofa_black_left":"黑色沙發・左端","kt_assets_a4:sofa_white_middle":"白色沙發・中段","kt_assets_a4:sofa_orange_middle":"橙色沙發・中段","kt_assets_a4:sofa_magenta_middle":"洋紅色沙發・中段","kt_assets_a4:sofa_light_blue_middle":"淺藍色沙發・中段","kt_assets_a4:sofa_yellow_middle":"黃色沙發・中段","kt_assets_a4:sofa_lime_middle":"淺綠色沙發・中段","kt_assets_a4:sofa_pink_middle":"粉紅色沙發・中段","kt_assets_a4:sofa_gray_middle":"灰色沙發・中段","kt_assets_a4:sofa_light_gray_middle":"淺灰色沙發・中段","kt_assets_a4:sofa_cyan_middle":"青色沙發・中段","kt_assets_a4:sofa_purple_middle":"紫色沙發・中段","kt_assets_a4:sofa_blue_middle":"藍色沙發・中段","kt_assets_a4:sofa_brown_middle":"棕色沙發・中段","kt_assets_a4:sofa_green_middle":"綠色沙發・中段","kt_assets_a4:sofa_red_middle":"紅色沙發・中段","kt_assets_a4:sofa_black_middle":"黑色沙發・中段","kt_assets_a4:sofa_white_right":"白色沙發・右端","kt_assets_a4:sofa_orange_right":"橙色沙發・右端","kt_assets_a4:sofa_magenta_right":"洋紅色沙發・右端","kt_assets_a4:sofa_light_blue_right":"淺藍色沙發・右端","kt_assets_a4:sofa_yellow_right":"黃色沙發・右端","kt_assets_a4:sofa_lime_right":"淺綠色沙發・右端","kt_assets_a4:sofa_pink_right":"粉紅色沙發・右端","kt_assets_a4:sofa_gray_right":"灰色沙發・右端","kt_assets_a4:sofa_light_gray_right":"淺灰色沙發・右端","kt_assets_a4:sofa_cyan_right":"青色沙發・右端","kt_assets_a4:sofa_purple_right":"紫色沙發・右端","kt_assets_a4:sofa_blue_right":"藍色沙發・右端","kt_assets_a4:sofa_brown_right":"棕色沙發・右端","kt_assets_a4:sofa_green_right":"綠色沙發・右端","kt_assets_a4:sofa_red_right":"紅色沙發・右端","kt_assets_a4:sofa_black_right":"黑色沙發・右端","kt_assets_a4:sofa_white_left_corner":"白色沙發・左轉角","kt_assets_a4:sofa_orange_left_corner":"橙色沙發・左轉角","kt_assets_a4:sofa_magenta_left_corner":"洋紅色沙發・左轉角","kt_assets_a4:sofa_light_blue_left_corner":"淺藍色沙發・左轉角","kt_assets_a4:sofa_yellow_left_corner":"黃色沙發・左轉角","kt_assets_a4:sofa_lime_left_corner":"淺綠色沙發・左轉角","kt_assets_a4:sofa_pink_left_corner":"粉紅色沙發・左轉角","kt_assets_a4:sofa_gray_left_corner":"灰色沙發・左轉角","kt_assets_a4:sofa_light_gray_left_corner":"淺灰色沙發・左轉角","kt_assets_a4:sofa_cyan_left_corner":"青色沙發・左轉角","kt_assets_a4:sofa_purple_left_corner":"紫色沙發・左轉角","kt_assets_a4:sofa_blue_left_corner":"藍色沙發・左轉角","kt_assets_a4:sofa_brown_left_corner":"棕色沙發・左轉角","kt_assets_a4:sofa_green_left_corner":"綠色沙發・左轉角","kt_assets_a4:sofa_red_left_corner":"紅色沙發・左轉角","kt_assets_a4:sofa_black_left_corner":"黑色沙發・左轉角","kt_assets_a4:sofa_white_right_corner":"白色沙發・右轉角","kt_assets_a4:sofa_orange_right_corner":"橙色沙發・右轉角","kt_assets_a4:sofa_magenta_right_corner":"洋紅色沙發・右轉角","kt_assets_a4:sofa_light_blue_right_corner":"淺藍色沙發・右轉角","kt_assets_a4:sofa_yellow_right_corner":"黃色沙發・右轉角","kt_assets_a4:sofa_lime_right_corner":"淺綠色沙發・右轉角","kt_assets_a4:sofa_pink_right_corner":"粉紅色沙發・右轉角","kt_assets_a4:sofa_gray_right_corner":"灰色沙發・右轉角","kt_assets_a4:sofa_light_gray_right_corner":"淺灰色沙發・右轉角","kt_assets_a4:sofa_cyan_right_corner":"青色沙發・右轉角","kt_assets_a4:sofa_purple_right_corner":"紫色沙發・右轉角","kt_assets_a4:sofa_blue_right_corner":"藍色沙發・右轉角","kt_assets_a4:sofa_brown_right_corner":"棕色沙發・右轉角","kt_assets_a4:sofa_green_right_corner":"綠色沙發・右轉角","kt_assets_a4:sofa_red_right_corner":"紅色沙發・右轉角","kt_assets_a4:sofa_black_right_corner":"黑色沙發・右轉角","kt_assets_a4:emerald":"翡翠雞尾酒・玻璃材質候選","kt_assets_a6:bar_cabinet_single":"酒櫃・單體","kt_assets_a6:bar_cabinet_left":"酒櫃・左端","kt_assets_a6:bar_cabinet_middle":"酒櫃・中段","kt_assets_a6:bar_cabinet_right":"酒櫃・右端","kt_assets_a6:glass_bar_cabinet_single":"玻璃酒櫃・單體","kt_assets_a6:glass_bar_cabinet_left":"玻璃酒櫃・左端","kt_assets_a6:glass_bar_cabinet_middle":"玻璃酒櫃・中段","kt_assets_a6:glass_bar_cabinet_right":"玻璃酒櫃・右端","kt_assets_a6:cellar_cabinet_single":"酒窖櫃・單體","kt_assets_a6:cellar_cabinet_left":"酒窖櫃・左端","kt_assets_a6:cellar_cabinet_middle":"酒窖櫃・中段","kt_assets_a6:cellar_cabinet_right":"酒窖櫃・右端","kt_assets_a6:tilted_rack":"傾斜酒架","kt_assets_a6:circular_rack":"圓形酒架","kt_assets_a6:glassware_holder":"吊掛杯架","kt_assets_a6:vodka_1":"伏特加・1 瓶","kt_assets_a6:vodka_2":"伏特加・2 瓶","kt_assets_a6:vodka_3":"伏特加・3 瓶","kt_assets_a6:vodka_4":"伏特加・4 瓶","kt_assets_a7:rum_1":"朗姆酒・1 瓶","kt_assets_a7:rum_2":"朗姆酒・2 瓶","kt_assets_a7:rum_3":"朗姆酒・3 瓶","kt_assets_a7:rum_4":"朗姆酒・4 瓶","kt_assets_a7:sherry_1":"雪莉・1 瓶","kt_assets_a7:sherry_2":"雪莉・2 瓶","kt_assets_a7:sherry_3":"雪莉・3 瓶","kt_assets_a7:sherry_4":"雪莉・4 瓶","kt_assets_a7:red_queen_1":"紅皇后・1 瓶","kt_assets_a7:red_queen_2":"紅皇后・2 瓶","kt_assets_a7:red_queen_3":"紅皇后・3 瓶","kt_assets_a7:red_queen_4":"紅皇后・4 瓶","kt_assets_a7:vinegar_1":"醋・1 瓶","kt_assets_a7:vinegar_2":"醋・2 瓶","kt_assets_a7:vinegar_3":"醋・3 瓶","kt_assets_a7:vinegar_4":"醋・4 瓶","kt_assets_a7:whiskey_1":"威士忌・1 瓶","kt_assets_a7:whiskey_2":"威士忌・2 瓶","kt_assets_a7:whiskey_3":"威士忌・3 瓶","kt_assets_a7:whiskey_4":"威士忌・4 瓶","kt_assets_a7:miners_star_1":"礦工之星・1 瓶","kt_assets_a7:miners_star_2":"礦工之星・2 瓶","kt_assets_a7:miners_star_3":"礦工之星・3 瓶","kt_assets_a7:miners_star_4":"礦工之星・4 瓶","kt_assets_a7:sauvignon_blanc_dry_white_1":"長相思乾白・1 瓶","kt_assets_a7:sauvignon_blanc_dry_white_2":"長相思乾白・2 瓶","kt_assets_a7:sauvignon_blanc_dry_white_3":"長相思乾白・3 瓶","kt_assets_a7:sauvignon_blanc_dry_white_4":"長相思乾白・4 瓶","kt_assets_a7:sweet_berry_wine_1":"甜莓酒・1 瓶","kt_assets_a7:sweet_berry_wine_2":"甜莓酒・2 瓶","kt_assets_a7:sweet_berry_wine_3":"甜莓酒・3 瓶","kt_assets_a7:sweet_berry_wine_4":"甜莓酒・4 瓶","kt_assets_a7:sakura_wine_1":"櫻花酒・1 瓶","kt_assets_a7:sakura_wine_2":"櫻花酒・2 瓶","kt_assets_a7:sakura_wine_3":"櫻花酒・3 瓶","kt_assets_a7:sakura_wine_4":"櫻花酒・4 瓶","kt_assets_a7:empty_glassware":"空雞尾酒杯","kt_assets_a7:screwdriver":"螺絲起子雞尾酒","kt_assets_a8:depth_charge":"深水炸彈","kt_assets_a8:mojito":"莫希托","kt_assets_a8:signature_cocktail":"特調（原始未染色）","kt_assets_a8:mystery_cocktail":"神秘雞尾酒","kt_assets_a8:shaker":"雪克杯","kt_assets_a8:glowflower_brew_1":"螢花釀 1 瓶","kt_assets_a8:glowflower_brew_2":"螢花釀 2 瓶","kt_assets_a8:glowflower_brew_3":"螢花釀 3 瓶","kt_assets_a8:glowflower_brew_4":"螢花釀 4 瓶","kt_assets_a8:luminous_bride_1":"流明新娘 1 瓶","kt_assets_a8:luminous_bride_2":"流明新娘 2 瓶","kt_assets_a8:luminous_bride_3":"流明新娘 3 瓶","kt_assets_a8:luminous_bride_4":"流明新娘 4 瓶","kt_assets_a9:brandy_1":"白蘭地・1 瓶","kt_assets_a9:brandy_2":"白蘭地・2 瓶","kt_assets_a9:brandy_3":"白蘭地・3 瓶","kt_assets_a9:carignan_1":"佳麗釀・1 瓶","kt_assets_a9:carignan_2":"佳麗釀・2 瓶","kt_assets_a9:carignan_3":"佳麗釀・3 瓶","kt_assets_a9:madame_shexiang_1":"麝香夫人・1 瓶","kt_assets_a9:madame_shexiang_2":"麝香夫人・2 瓶","kt_assets_a9:madame_shexiang_3":"麝香夫人・3 瓶","kt_assets_a9:madame_shexiang_4":"麝香夫人・4 瓶","kt_assets_a9:mother_snow_1":"Mother Snow・1 瓶","kt_assets_a9:mother_snow_2":"Mother Snow・2 瓶","kt_assets_a9:mother_snow_3":"Mother Snow・3 瓶","kt_assets_a9:mother_snow_4":"Mother Snow・4 瓶","kt_assets_a9:plum_wine_1":"梅酒・1 瓶","kt_assets_a9:plum_wine_2":"梅酒・2 瓶","kt_assets_a9:plum_wine_3":"梅酒・3 瓶","kt_assets_a9:plum_wine_4":"梅酒・4 瓶","kt_assets_a9:polaris_sweet_white_1":"北極星甜白・1 瓶","kt_assets_a9:polaris_sweet_white_2":"北極星甜白・2 瓶","kt_assets_a9:polaris_sweet_white_3":"北極星甜白・3 瓶","kt_assets_a9:polaris_sweet_white_4":"北極星甜白・4 瓶","kt_assets_a9:riesling_dry_white_1":"雷司令乾白・1 瓶","kt_assets_a9:riesling_dry_white_2":"雷司令乾白・2 瓶","kt_assets_a9:riesling_dry_white_3":"雷司令乾白・3 瓶","kt_assets_a9:riesling_dry_white_4":"雷司令乾白・4 瓶","kt_assets_a9:sunset_glow_1":"落日餘暉・1 瓶","kt_assets_a9:sunset_glow_2":"落日餘暉・2 瓶","kt_assets_a9:sunset_glow_3":"落日餘暉・3 瓶","kt_assets_a9:watermelon_juice_1":"西瓜汁・1 瓶","kt_assets_a9:watermelon_juice_2":"西瓜汁・2 瓶","kt_assets_a9:watermelon_juice_3":"西瓜汁・3 瓶","kt_assets_a9:watermelon_juice_4":"西瓜汁・4 瓶","kt_assets_a9:white_lady":"白色佳人雞尾酒","kt_assets_a10:allium_garden":"蔥花園","kt_assets_a10:bloody_mary":"血腥瑪麗","kt_assets_a10:brass_heart":"黃銅之心","kt_assets_a10:godfather":"教父","kt_assets_a10:grasshopper":"蚱蜢","kt_assets_a10:nether_special":"下界特調","kt_assets_a10:sculk_special":"幽匿特調","kt_assets_a10:bar_counter_single":"吧檯・單體","kt_assets_a10:bar_counter_left":"吧檯・左端","kt_assets_a10:bar_counter_middle":"吧檯・中段","kt_assets_a10:bar_counter_right":"吧檯・右端","kt_assets_a10:bar_counter_left_corner":"吧檯・左轉角","kt_assets_a10:bar_counter_right_corner":"吧檯・右轉角","kt_assets_a10:holder":"酒瓶展示座","kt_assets_a12:table_single":"酒館桌・單桌","kt_assets_a12:table_left":"酒館桌・左端","kt_assets_a12:table_middle":"酒館桌・中段","kt_assets_a12:table_right":"酒館桌・右端","kt_assets_a12:table_left_rot":"酒館桌・旋轉左端","kt_assets_a12:table_middle_rot":"酒館桌・旋轉中段","kt_assets_a12:table_right_rot":"酒館桌・旋轉右端","kt_assets_a12:bell_pendant_lamp_bottom":"鈴形吊燈・下段","kt_assets_a12:bell_pendant_lamp_top":"鈴形吊燈・上段","kt_assets_a12:blue_pendant_lamp_bottom":"藍色吊燈・下段","kt_assets_a12:blue_pendant_lamp_top":"藍色吊燈・上段","kt_assets_a12:yellow_pendant_lamp_bottom":"黃色吊燈・下段","kt_assets_a12:yellow_pendant_lamp_top":"黃色吊燈・上段","kt_assets_a12:stepladder_bottom":"人字梯・下段","kt_assets_a12:stepladder_top":"人字梯・上段","kt_assets_a12:sandwich_board_bottom":"素面告示牌・下座","kt_assets_a13:sakura_incense_closed":"櫻花香薰・關閉","kt_assets_a13:sakura_incense_open":"櫻花香薰・開啟","kt_assets_a13:pine_incense_closed":"松木香薰・關閉","kt_assets_a13:pine_incense_open":"松木香薰・開啟","kt_assets_a13:ginkgo_incense_closed":"銀杏香薰・關閉","kt_assets_a13:ginkgo_incense_open":"銀杏香薰・開啟","kt_assets_a13:spore_incense_closed":"孢子香薰・關閉","kt_assets_a13:spore_incense_open":"孢子香薰・開啟","kt_assets_a13:catnip_incense_closed":"貓薄荷香薰・關閉","kt_assets_a13:catnip_incense_open":"貓薄荷香薰・開啟","kt_assets_a13:snow_incense_closed":"雪香薰・關閉","kt_assets_a13:snow_incense_open":"雪香薰・開啟","kt_assets_a13:butterfly_incense_closed":"蝴蝶香薰・關閉","kt_assets_a13:butterfly_incense_open":"蝴蝶香薰・開啟","kt_assets_a13:firefly_incense_closed":"螢火蟲香薰・關閉","kt_assets_a13:firefly_incense_open":"螢火蟲香薰・開啟","kt_assets_a13:painting_mondrian":"畫作・蒙德里安","kt_assets_a13:painting_great_wave":"畫作・神奈川沖浪裏","kt_assets_a13:painting_mona_lisa":"畫作・蒙娜麗莎","kt_assets_a13:painting_cr019":"畫作・CR019","kt_assets_a13:painting_david":"畫作・大衛","kt_assets_a14:painting_father":"畫作・父親","kt_assets_a14:painting_girl_with_pearl_earring":"畫作・戴珍珠耳環的少女","kt_assets_a14:painting_master_marisa":"畫作・魔理沙","kt_assets_a14:painting_son_of_man":"畫作・人子","kt_assets_a14:painting_starry_night":"畫作・星夜","kt_assets_a14:painting_van_gogh_self_portrait":"畫作・梵谷自畫像","kt_assets_a14:painting_ysbb":"畫作・YSBB","kt_assets_a14:painting_tartaric_acid":"畫作・Tartaric Acid","kt_assets_a14:painting_unknown":"畫作・Unknown","kt_assets_a14:string_lights_blue":"藍色彩燈","kt_assets_a15:string_lights_red":"紅色彩燈","kt_assets_a15:string_lights_white":"白色彩燈","kt_assets_a15:string_lights_black":"黑色彩燈","kt_assets_a16:string_lights_colorless":"無色彩燈","kt_assets_a16:string_lights_brown":"棕色彩燈","kt_assets_a16:string_lights_cyan":"青色彩燈","kt_assets_a16:string_lights_gray":"灰色彩燈","kt_assets_a17:string_lights_green":"綠色彩燈","kt_assets_a17:string_lights_light_blue":"淺藍色彩燈","kt_assets_a17:string_lights_light_gray":"淺灰色彩燈","kt_assets_a17:string_lights_lime":"淺綠色彩燈","kt_assets_a17:string_lights_magenta":"洋紅色彩燈","kt_assets_a17:string_lights_orange":"橙色彩燈","kt_assets_a17:string_lights_pink":"粉紅色彩燈","kt_assets_a17:string_lights_purple":"紫色彩燈","kt_assets_a17:string_lights_yellow":"黃色彩燈","kt_assets_a17:molotov":"燃燒瓶・展示","kt_assets_a17:water_bottle":"水瓶・展示","kt_assets_a17:potion_bottle":"藥水瓶・展示","kt_assets_a17:honey_bottle":"蜂蜜瓶・展示","kt_assets_a17:xp_bottle":"經驗瓶・展示","kt_assets_a17:dragon_breath_bottle":"龍息瓶・展示","kt_assets_a17:sourceicon_allium_garden":"allium garden","kt_assets_a17:item_display_allium_sandwich_board":"物品姿態・allium_sandwich_board","kt_assets_a17:item_display_azure_bluet_sandwich_board":"物品姿態・azure_bluet_sandwich_board","kt_assets_a17:item_display_bar_cabinet":"物品姿態・bar_cabinet","kt_assets_a17:item_display_bar_counter":"物品姿態・bar_counter","kt_assets_a17:item_display_barrel":"物品姿態・barrel","kt_assets_a17:item_display_base_sandwich_board":"物品姿態・base_sandwich_board","kt_assets_a17:sourceicon_bell_pendant_lamp":"bell pendant lamp","kt_assets_a17:item_display_black_bar_stool":"物品姿態・black_bar_stool","kt_assets_a17:item_display_black_sofa":"物品姿態・black_sofa","kt_assets_a17:sourceicon_bloody_mary":"bloody mary","kt_assets_a17:item_display_blue_bar_stool":"物品姿態・blue_bar_stool","kt_assets_a17:sourceicon_blue_pendant_lamp":"blue pendant lamp","kt_assets_a17:item_display_blue_sofa":"物品姿態・blue_sofa","kt_assets_a17:sourceicon_brandy":"brandy","kt_assets_a17:sourceicon_brass_heart":"brass heart","kt_assets_a17:item_display_brown_bar_stool":"物品姿態・brown_bar_stool","kt_assets_a17:item_display_brown_sofa":"物品姿態・brown_sofa","kt_assets_a17:sourceicon_butterfly_incense":"butterfly incense","kt_assets_a17:sourceicon_carignan":"carignan","kt_assets_a17:sourceicon_catnip_incense":"catnip incense","kt_assets_a17:item_display_cellar_cabinet":"物品姿態・cellar_cabinet","kt_assets_a17:sourceicon_chalkboard":"chalkboard","kt_assets_a17:sourceicon_champagne":"champagne","kt_assets_a17:item_display_circular_rack":"物品姿態・circular_rack","kt_assets_a17:item_display_cornflower_sandwich_board":"物品姿態・cornflower_sandwich_board","kt_assets_a17:sourceicon_cr019_painting":"cr019 painting","kt_assets_a17:item_display_cyan_bar_stool":"物品姿態・cyan_bar_stool","kt_assets_a17:item_display_cyan_sofa":"物品姿態・cyan_sofa","kt_assets_a17:sourceicon_david_painting":"david painting","kt_assets_a17:sourceicon_depth_charge":"depth charge","kt_assets_a17:sourceicon_emerald":"emerald","kt_assets_a17:sourceicon_empty_bottle":"empty bottle","kt_assets_a17:sourceicon_empty_glassware":"empty glassware","kt_assets_a17:sourceicon_father_painting":"father painting","kt_assets_a17:sourceicon_firefly_incense":"firefly incense","kt_assets_a17:sourceicon_ginkgo_incense":"ginkgo incense","kt_assets_a17:sourceicon_girl_with_pearl_earring_painting":"girl with pearl earring painting","kt_assets_a17:item_display_glass_bar_cabinet":"物品姿態・glass_bar_cabinet","kt_assets_a17:item_display_glassware_holder":"物品姿態・glassware_holder","kt_assets_a17:sourceicon_glow_berries_bucket":"glow berries bucket","kt_assets_a17:sourceicon_glowflower_brew":"glowflower brew","kt_assets_a17:sourceicon_godfather":"godfather","kt_assets_a17:sourceicon_gold_grape":"gold grape","kt_assets_a17:sourceicon_gold_grape_bucket":"gold grape bucket","kt_assets_a17:sourceicon_grape":"grape","kt_assets_a17:sourceicon_grape_bucket":"grape bucket","kt_assets_a17:sourceicon_grapevine":"grapevine","kt_assets_a17:item_display_grass_sandwich_board":"物品姿態・grass_sandwich_board","kt_assets_a17:sourceicon_grasshopper":"grasshopper","kt_assets_a17:item_display_gray_bar_stool":"物品姿態・gray_bar_stool","kt_assets_a17:item_display_gray_sofa":"物品姿態・gray_sofa","kt_assets_a17:sourceicon_great_wave_painting":"great wave painting","kt_assets_a17:item_display_green_bar_stool":"物品姿態・green_bar_stool","kt_assets_a17:sourceicon_green_grape":"green grape","kt_assets_a17:sourceicon_green_grape_bucket":"green grape bucket","kt_assets_a17:item_display_green_sofa":"物品姿態・green_sofa","kt_assets_a17:sourceicon_holder":"holder","kt_assets_a17:sourceicon_honey_wine":"honey wine","kt_assets_a17:sourceicon_ice_grape":"ice grape","kt_assets_a17:sourceicon_ice_grape_bucket":"ice grape bucket","kt_assets_a17:sourceicon_ice_wine":"ice wine","kt_assets_a17:item_display_light_blue_bar_stool":"物品姿態・light_blue_bar_stool","kt_assets_a17:item_display_light_blue_sofa":"物品姿態・light_blue_sofa","kt_assets_a17:item_display_light_gray_bar_stool":"物品姿態・light_gray_bar_stool","kt_assets_a17:item_display_light_gray_sofa":"物品姿態・light_gray_sofa","kt_assets_a17:item_display_lime_bar_stool":"物品姿態・lime_bar_stool","kt_assets_a17:item_display_lime_sofa":"物品姿態・lime_sofa","kt_assets_a17:sourceicon_luminous_bride":"luminous bride","kt_assets_a17:sourceicon_madame_shexiang":"madame shexiang","kt_assets_a17:item_display_magenta_bar_stool":"物品姿態・magenta_bar_stool","kt_assets_a17:item_display_magenta_sofa":"物品姿態・magenta_sofa","kt_assets_a17:sourceicon_master_marisa_painting":"master marisa painting","kt_assets_a17:sourceicon_miners_star":"miners star","kt_assets_a17:sourceicon_mojito":"mojito","kt_assets_a17:sourceicon_molotov":"molotov","kt_assets_a17:sourceicon_mona_lisa_painting":"mona lisa painting","kt_assets_a17:sourceicon_mondrian_painting":"mondrian painting","kt_assets_a17:sourceicon_mother_snow":"mother snow","kt_assets_a17:sourceicon_mystery_cocktail":"mystery cocktail","kt_assets_a17:sourceicon_nether_special":"nether special","kt_assets_a17:item_display_orange_bar_stool":"物品姿態・orange_bar_stool","kt_assets_a17:item_display_orange_sofa":"物品姿態・orange_sofa","kt_assets_a17:item_display_orchid_sandwich_board":"物品姿態・orchid_sandwich_board","kt_assets_a17:item_display_peony_sandwich_board":"物品姿態・peony_sandwich_board","kt_assets_a17:sourceicon_pine_incense":"pine incense","kt_assets_a17:item_display_pink_bar_stool":"物品姿態・pink_bar_stool","kt_assets_a17:item_display_pink_petals_sandwich_board":"物品姿態・pink_petals_sandwich_board","kt_assets_a17:item_display_pink_sofa":"物品姿態・pink_sofa","kt_assets_a17:item_display_pitcher_plant_sandwich_board":"物品姿態・pitcher_plant_sandwich_board","kt_assets_a17:sourceicon_plum_wine":"plum wine","kt_assets_a17:sourceicon_polaris_sweet_white":"polaris sweet white","kt_assets_a17:item_display_poppy_sandwich_board":"物品姿態・poppy_sandwich_board","kt_assets_a17:item_display_pressing_tub":"物品姿態・pressing_tub","kt_assets_a17:item_display_purple_bar_stool":"物品姿態・purple_bar_stool","kt_assets_a17:item_display_purple_sofa":"物品姿態・purple_sofa","kt_assets_a17:item_display_red_bar_stool":"物品姿態・red_bar_stool","kt_assets_a17:sourceicon_red_queen":"red queen","kt_assets_a17:item_display_red_sofa":"物品姿態・red_sofa","kt_assets_a17:sourceicon_riesling_dry_white":"riesling dry white","kt_assets_a17:sourceicon_rum":"rum","kt_assets_a17:sourceicon_sakura_incense":"sakura incense","kt_assets_a17:sourceicon_sakura_wine":"sakura wine","kt_assets_a17:sourceicon_sauvignon_blanc_dry_white":"sauvignon blanc dry white","kt_assets_a17:sourceicon_screwdriver":"screwdriver","kt_assets_a17:sourceicon_sculk_special":"sculk special","kt_assets_a17:item_display_shaker":"物品姿態・shaker","kt_assets_a17:item_display_shaker_3d":"物品姿態・shaker_3d","kt_assets_a17:sourceicon_sherry":"sherry","kt_assets_a17:sourceicon_signature_cocktail":"signature cocktail","kt_assets_a17:sourceicon_snow_incense":"snow incense","kt_assets_a17:sourceicon_son_of_man_painting":"son of man painting","kt_assets_a17:sourceicon_spore_incense":"spore incense","kt_assets_a17:sourceicon_starry_night_painting":"starry night painting","kt_assets_a17:sourceicon_stepladder":"stepladder","kt_assets_a17:item_display_string_lights_black":"物品姿態・string_lights_black","kt_assets_a17:item_display_string_lights_blue":"物品姿態・string_lights_blue","kt_assets_a17:item_display_string_lights_brown":"物品姿態・string_lights_brown","kt_assets_a17:item_display_string_lights_colorless":"物品姿態・string_lights_colorless","kt_assets_a17:item_display_string_lights_cyan":"物品姿態・string_lights_cyan","kt_assets_a17:item_display_string_lights_gray":"物品姿態・string_lights_gray","kt_assets_a17:item_display_string_lights_green":"物品姿態・string_lights_green","kt_assets_a17:item_display_string_lights_light_blue":"物品姿態・string_lights_light_blue","kt_assets_a17:item_display_string_lights_light_gray":"物品姿態・string_lights_light_gray","kt_assets_a17:item_display_string_lights_lime":"物品姿態・string_lights_lime","kt_assets_a17:item_display_string_lights_magenta":"物品姿態・string_lights_magenta","kt_assets_a17:item_display_string_lights_orange":"物品姿態・string_lights_orange","kt_assets_a17:item_display_string_lights_pink":"物品姿態・string_lights_pink","kt_assets_a17:item_display_string_lights_purple":"物品姿態・string_lights_purple","kt_assets_a17:item_display_string_lights_red":"物品姿態・string_lights_red","kt_assets_a17:item_display_string_lights_white":"物品姿態・string_lights_white","kt_assets_a17:item_display_string_lights_yellow":"物品姿態・string_lights_yellow","kt_assets_a17:item_display_sunflower_sandwich_board":"物品姿態・sunflower_sandwich_board","kt_assets_a17:sourceicon_sunset_glow":"sunset glow","kt_assets_a17:sourceicon_sweet_berries_bucket":"sweet berries bucket","kt_assets_a17:sourceicon_sweet_berry_wine":"sweet berry wine","kt_assets_a17:item_display_table":"物品姿態・table","kt_assets_a17:sourceicon_tap":"tap","kt_assets_a17:sourceicon_tartaric_acid_painting":"tartaric acid painting","kt_assets_a17:item_display_tilted_rack":"物品姿態・tilted_rack","kt_assets_a17:item_display_torchflower_sandwich_board":"物品姿態・torchflower_sandwich_board","kt_assets_a17:item_display_trellis":"物品姿態・trellis","kt_assets_a17:item_display_tulip_sandwich_board":"物品姿態・tulip_sandwich_board","kt_assets_a17:sourceicon_unknown_painting":"unknown painting","kt_assets_a17:sourceicon_van_gogh_self_portrait_painting":"van gogh self portrait painting","kt_assets_a17:sourceicon_vinegar":"vinegar","kt_assets_a17:sourceicon_vodka":"vodka","kt_assets_a17:sourceicon_watermelon_juice":"watermelon juice","kt_assets_a17:sourceicon_whiskey":"whiskey","kt_assets_a17:item_display_white_bar_stool":"物品姿態・white_bar_stool","kt_assets_a17:sourceicon_white_lady":"white lady","kt_assets_a17:item_display_white_sofa":"物品姿態・white_sofa","kt_assets_a17:sourceicon_wine":"wine","kt_assets_a17:item_display_wither_rose_sandwich_board":"物品姿態・wither_rose_sandwich_board","kt_assets_a17:item_display_yellow_bar_stool":"物品姿態・yellow_bar_stool","kt_assets_a17:sourceicon_yellow_pendant_lamp":"yellow pendant lamp","kt_assets_a17:item_display_yellow_sofa":"物品姿態・yellow_sofa","kt_assets_a17:sourceicon_ysbb_painting":"ysbb painting","kaleidoscope_tavern:bar_cabinet":"酒柜","kaleidoscope_tavern:bar_counter":"吧台","kaleidoscope_tavern:barrel":"酒桶","kaleidoscope_tavern:black_sofa":"黑色沙发","kaleidoscope_tavern:blue_sofa":"蓝色沙发","kaleidoscope_tavern:brandy":"白蘭地","kaleidoscope_tavern:brandy_q1":"白蘭地","kaleidoscope_tavern:brandy_q2":"白蘭地","kaleidoscope_tavern:brandy_q3":"白蘭地","kaleidoscope_tavern:brandy_q4":"白蘭地","kaleidoscope_tavern:brandy_q5":"白蘭地","kaleidoscope_tavern:brandy_q6":"白蘭地","kaleidoscope_tavern:brown_sofa":"棕色沙发","kaleidoscope_tavern:butterfly_incense":"蝶蝶香薰","kaleidoscope_tavern:carignan":"佳麗釀","kaleidoscope_tavern:carignan_q1":"佳麗釀","kaleidoscope_tavern:carignan_q2":"佳麗釀","kaleidoscope_tavern:carignan_q3":"佳麗釀","kaleidoscope_tavern:carignan_q4":"佳麗釀","kaleidoscope_tavern:carignan_q5":"佳麗釀","kaleidoscope_tavern:carignan_q6":"佳麗釀","kaleidoscope_tavern:catnip_incense":"荊芥香薰","kaleidoscope_tavern:cellar_cabinet":"窖藏酒柜","kaleidoscope_tavern:chalkboard":"黑板","kaleidoscope_tavern:champagne":"香檳","kaleidoscope_tavern:champagne_q1":"香檳","kaleidoscope_tavern:champagne_q2":"香檳","kaleidoscope_tavern:champagne_q3":"香檳","kaleidoscope_tavern:champagne_q4":"香檳","kaleidoscope_tavern:champagne_q5":"香檳","kaleidoscope_tavern:champagne_q6":"香檳","kaleidoscope_tavern:circular_rack":"圆周酒架","kaleidoscope_tavern:cyan_sofa":"青色沙发","kaleidoscope_tavern:dragon_breath_bottle":"龙息瓶","kaleidoscope_tavern:empty_bottle":"空酒瓶","kaleidoscope_tavern:firefly_incense":"螢火香薰","kaleidoscope_tavern:ginkgo_incense":"銀杏香薰","kaleidoscope_tavern:glass_bar_cabinet":"酒柜（玻璃窗）","kaleidoscope_tavern:glassware_holder":"酒杯架","kaleidoscope_tavern:glow_berries_bucket":"发光浆果桶","kaleidoscope_tavern:glow_berries_juice":"螢光莓汁","kaleidoscope_tavern:glowflower_brew":"螢花釀","kaleidoscope_tavern:glowflower_brew_q1":"螢花釀","kaleidoscope_tavern:glowflower_brew_q2":"螢花釀","kaleidoscope_tavern:glowflower_brew_q3":"螢花釀","kaleidoscope_tavern:glowflower_brew_q4":"螢花釀","kaleidoscope_tavern:glowflower_brew_q5":"螢花釀","kaleidoscope_tavern:glowflower_brew_q6":"螢花釀","kaleidoscope_tavern:gold_grape":"金葡萄","kaleidoscope_tavern:gold_grape_bucket":"黄金葡萄桶","kaleidoscope_tavern:gold_grape_crop":"黄金葡萄","kaleidoscope_tavern:gold_grape_juice":"金葡萄汁","kaleidoscope_tavern:gold_grapevine_trellis":"黄金葡萄藤架","kaleidoscope_tavern:grape":"葡萄","kaleidoscope_tavern:grape_bucket":"葡萄桶","kaleidoscope_tavern:grape_crop":"葡萄","kaleidoscope_tavern:grape_juice":"葡萄汁","kaleidoscope_tavern:grapevine":"葡萄藤","kaleidoscope_tavern:grapevine_trellis":"葡萄藤架","kaleidoscope_tavern:gray_sofa":"灰色沙发","kaleidoscope_tavern:green_grape":"青提","kaleidoscope_tavern:green_grape_bucket":"青提葡萄桶","kaleidoscope_tavern:green_grape_juice":"青提葡萄汁","kaleidoscope_tavern:green_sofa":"绿色沙发","kaleidoscope_tavern:guidebook":"舊版酒館指南","kaleidoscope_tavern:holder":"单体酒架","kaleidoscope_tavern:honey_bottle":"蜂蜜瓶","kaleidoscope_tavern:honey_wine":"蜂蜜葡萄酒","kaleidoscope_tavern:honey_wine_q1":"蜂蜜葡萄酒","kaleidoscope_tavern:honey_wine_q2":"蜂蜜葡萄酒","kaleidoscope_tavern:honey_wine_q3":"蜂蜜葡萄酒","kaleidoscope_tavern:honey_wine_q4":"蜂蜜葡萄酒","kaleidoscope_tavern:honey_wine_q5":"蜂蜜葡萄酒","kaleidoscope_tavern:honey_wine_q6":"蜂蜜葡萄酒","kaleidoscope_tavern:ice_grape":"冰葡萄","kaleidoscope_tavern:ice_grape_bucket":"冰葡萄桶","kaleidoscope_tavern:ice_grape_crop":"冰葡萄","kaleidoscope_tavern:ice_grape_juice":"冰葡萄汁","kaleidoscope_tavern:ice_grapevine_trellis":"冰葡萄藤架","kaleidoscope_tavern:ice_wine":"冰葡萄酒","kaleidoscope_tavern:ice_wine_q1":"冰葡萄酒","kaleidoscope_tavern:ice_wine_q2":"冰葡萄酒","kaleidoscope_tavern:ice_wine_q3":"冰葡萄酒","kaleidoscope_tavern:ice_wine_q4":"冰葡萄酒","kaleidoscope_tavern:ice_wine_q5":"冰葡萄酒","kaleidoscope_tavern:ice_wine_q6":"冰葡萄酒","kaleidoscope_tavern:light_blue_sofa":"淡蓝色沙发","kaleidoscope_tavern:light_gray_sofa":"淡灰色沙发","kaleidoscope_tavern:lime_sofa":"黄绿色沙发","kaleidoscope_tavern:luminous_bride":"流明新娘","kaleidoscope_tavern:luminous_bride_q1":"流明新娘","kaleidoscope_tavern:luminous_bride_q2":"流明新娘","kaleidoscope_tavern:luminous_bride_q3":"流明新娘","kaleidoscope_tavern:luminous_bride_q4":"流明新娘","kaleidoscope_tavern:luminous_bride_q5":"流明新娘","kaleidoscope_tavern:luminous_bride_q6":"流明新娘","kaleidoscope_tavern:madame_shexiang":"麝香夫人","kaleidoscope_tavern:madame_shexiang_q1":"麝香夫人","kaleidoscope_tavern:madame_shexiang_q2":"麝香夫人","kaleidoscope_tavern:madame_shexiang_q3":"麝香夫人","kaleidoscope_tavern:madame_shexiang_q4":"麝香夫人","kaleidoscope_tavern:madame_shexiang_q5":"麝香夫人","kaleidoscope_tavern:madame_shexiang_q6":"麝香夫人","kaleidoscope_tavern:magenta_sofa":"品红色沙发","kaleidoscope_tavern:miners_star":"礦工之星","kaleidoscope_tavern:miners_star_q1":"礦工之星","kaleidoscope_tavern:miners_star_q2":"礦工之星","kaleidoscope_tavern:miners_star_q3":"礦工之星","kaleidoscope_tavern:miners_star_q4":"礦工之星","kaleidoscope_tavern:miners_star_q5":"礦工之星","kaleidoscope_tavern:miners_star_q6":"礦工之星","kaleidoscope_tavern:molotov":"莫洛托夫雞尾酒","kaleidoscope_tavern:mother_snow":"雪之母","kaleidoscope_tavern:mother_snow_q1":"雪之母","kaleidoscope_tavern:mother_snow_q2":"雪之母","kaleidoscope_tavern:mother_snow_q3":"雪之母","kaleidoscope_tavern:mother_snow_q4":"雪之母","kaleidoscope_tavern:mother_snow_q5":"雪之母","kaleidoscope_tavern:mother_snow_q6":"雪之母","kaleidoscope_tavern:orange_sofa":"橙色沙发","kaleidoscope_tavern:painting":"挂画","kaleidoscope_tavern:pine_incense":"松木香薰","kaleidoscope_tavern:pink_sofa":"粉红色沙发","kaleidoscope_tavern:plum_wine":"梅酒","kaleidoscope_tavern:plum_wine_q1":"梅酒","kaleidoscope_tavern:plum_wine_q2":"梅酒","kaleidoscope_tavern:plum_wine_q3":"梅酒","kaleidoscope_tavern:plum_wine_q4":"梅酒","kaleidoscope_tavern:plum_wine_q5":"梅酒","kaleidoscope_tavern:plum_wine_q6":"梅酒","kaleidoscope_tavern:polaris_sweet_white":"北極星甜白","kaleidoscope_tavern:polaris_sweet_white_q1":"北極星甜白","kaleidoscope_tavern:polaris_sweet_white_q2":"北極星甜白","kaleidoscope_tavern:polaris_sweet_white_q3":"北極星甜白","kaleidoscope_tavern:polaris_sweet_white_q4":"北極星甜白","kaleidoscope_tavern:polaris_sweet_white_q5":"北極星甜白","kaleidoscope_tavern:polaris_sweet_white_q6":"北極星甜白","kaleidoscope_tavern:potion_bottle":"药水瓶","kaleidoscope_tavern:pressing_tub":"壓榨桶","kaleidoscope_tavern:purple_sofa":"紫色沙发","kaleidoscope_tavern:recipe_book":"舊版酒館配方書","kaleidoscope_tavern:red_queen":"紅皇后","kaleidoscope_tavern:red_queen_q1":"紅皇后","kaleidoscope_tavern:red_queen_q2":"紅皇后","kaleidoscope_tavern:red_queen_q3":"紅皇后","kaleidoscope_tavern:red_queen_q4":"紅皇后","kaleidoscope_tavern:red_queen_q5":"紅皇后","kaleidoscope_tavern:red_queen_q6":"紅皇后","kaleidoscope_tavern:red_sofa":"红色沙发","kaleidoscope_tavern:riesling_dry_white":"雷司令乾白","kaleidoscope_tavern:riesling_dry_white_q1":"雷司令乾白","kaleidoscope_tavern:riesling_dry_white_q2":"雷司令乾白","kaleidoscope_tavern:riesling_dry_white_q3":"雷司令乾白","kaleidoscope_tavern:riesling_dry_white_q4":"雷司令乾白","kaleidoscope_tavern:riesling_dry_white_q5":"雷司令乾白","kaleidoscope_tavern:riesling_dry_white_q6":"雷司令乾白","kaleidoscope_tavern:rum":"朗姆酒","kaleidoscope_tavern:rum_q1":"朗姆酒","kaleidoscope_tavern:rum_q2":"朗姆酒","kaleidoscope_tavern:rum_q3":"朗姆酒","kaleidoscope_tavern:rum_q4":"朗姆酒","kaleidoscope_tavern:rum_q5":"朗姆酒","kaleidoscope_tavern:rum_q6":"朗姆酒","kaleidoscope_tavern:sakura_incense":"櫻花香薰","kaleidoscope_tavern:sakura_wine":"櫻花酒","kaleidoscope_tavern:sakura_wine_q1":"櫻花酒","kaleidoscope_tavern:sakura_wine_q2":"櫻花酒","kaleidoscope_tavern:sakura_wine_q3":"櫻花酒","kaleidoscope_tavern:sakura_wine_q4":"櫻花酒","kaleidoscope_tavern:sakura_wine_q5":"櫻花酒","kaleidoscope_tavern:sakura_wine_q6":"櫻花酒","kaleidoscope_tavern:sandwich_board":"展板","kaleidoscope_tavern:sauvignon_blanc_dry_white":"長相思乾白","kaleidoscope_tavern:sauvignon_blanc_dry_white_q1":"長相思乾白","kaleidoscope_tavern:sauvignon_blanc_dry_white_q2":"長相思乾白","kaleidoscope_tavern:sauvignon_blanc_dry_white_q3":"長相思乾白","kaleidoscope_tavern:sauvignon_blanc_dry_white_q4":"長相思乾白","kaleidoscope_tavern:sauvignon_blanc_dry_white_q5":"長相思乾白","kaleidoscope_tavern:sauvignon_blanc_dry_white_q6":"長相思乾白","kaleidoscope_tavern:sherry":"雪莉","kaleidoscope_tavern:sherry_q1":"雪莉","kaleidoscope_tavern:sherry_q2":"雪莉","kaleidoscope_tavern:sherry_q3":"雪莉","kaleidoscope_tavern:sherry_q4":"雪莉","kaleidoscope_tavern:sherry_q5":"雪莉","kaleidoscope_tavern:sherry_q6":"雪莉","kaleidoscope_tavern:snow_incense":"雪香薰","kaleidoscope_tavern:spore_incense":"孢子香薰","kaleidoscope_tavern:stepladder":"人字梯","kaleidoscope_tavern:sunset_glow":"落日餘暉","kaleidoscope_tavern:sunset_glow_q1":"落日餘暉","kaleidoscope_tavern:sunset_glow_q2":"落日餘暉","kaleidoscope_tavern:sunset_glow_q3":"落日餘暉","kaleidoscope_tavern:sunset_glow_q4":"落日餘暉","kaleidoscope_tavern:sunset_glow_q5":"落日餘暉","kaleidoscope_tavern:sunset_glow_q6":"落日餘暉","kaleidoscope_tavern:sweet_berries_bucket":"甜浆果桶","kaleidoscope_tavern:sweet_berries_juice":"甜莓汁","kaleidoscope_tavern:sweet_berry_wine":"甜莓酒","kaleidoscope_tavern:sweet_berry_wine_q1":"甜莓酒","kaleidoscope_tavern:sweet_berry_wine_q2":"甜莓酒","kaleidoscope_tavern:sweet_berry_wine_q3":"甜莓酒","kaleidoscope_tavern:sweet_berry_wine_q4":"甜莓酒","kaleidoscope_tavern:sweet_berry_wine_q5":"甜莓酒","kaleidoscope_tavern:sweet_berry_wine_q6":"甜莓酒","kaleidoscope_tavern:table":"桌子","kaleidoscope_tavern:tap":"酒嘴","kaleidoscope_tavern:tilted_rack":"倾斜酒架","kaleidoscope_tavern:trellis":"葡萄藤架","kaleidoscope_tavern:vinegar":"醋","kaleidoscope_tavern:vinegar_q1":"醋","kaleidoscope_tavern:vinegar_q2":"醋","kaleidoscope_tavern:vinegar_q3":"醋","kaleidoscope_tavern:vinegar_q4":"醋","kaleidoscope_tavern:vinegar_q5":"醋","kaleidoscope_tavern:vinegar_q6":"醋","kaleidoscope_tavern:vodka":"伏特加","kaleidoscope_tavern:vodka_q1":"伏特加","kaleidoscope_tavern:vodka_q2":"伏特加","kaleidoscope_tavern:vodka_q3":"伏特加","kaleidoscope_tavern:vodka_q4":"伏特加","kaleidoscope_tavern:vodka_q5":"伏特加","kaleidoscope_tavern:vodka_q6":"伏特加","kaleidoscope_tavern:water_bottle":"水瓶","kaleidoscope_tavern:whiskey":"威士忌","kaleidoscope_tavern:whiskey_q1":"威士忌","kaleidoscope_tavern:whiskey_q2":"威士忌","kaleidoscope_tavern:whiskey_q3":"威士忌","kaleidoscope_tavern:whiskey_q4":"威士忌","kaleidoscope_tavern:whiskey_q5":"威士忌","kaleidoscope_tavern:whiskey_q6":"威士忌","kaleidoscope_tavern:white_sofa":"白色沙发","kaleidoscope_tavern:wild_grapevine":"野生葡萄藤","kaleidoscope_tavern:wild_grapevine_plant":"野生葡萄藤","kaleidoscope_tavern:wine":"葡萄酒","kaleidoscope_tavern:wine_q1":"葡萄酒","kaleidoscope_tavern:wine_q2":"葡萄酒","kaleidoscope_tavern:wine_q3":"葡萄酒","kaleidoscope_tavern:wine_q4":"葡萄酒","kaleidoscope_tavern:wine_q5":"葡萄酒","kaleidoscope_tavern:wine_q6":"葡萄酒","kaleidoscope_tavern:xp_bottle":"附魔之瓶","kaleidoscope_tavern:yellow_sofa":"黄色沙发","kaleidoscope_tavern:allium_garden":"蔥花園","kaleidoscope_tavern:black_bar_stool":"黑色高腳凳","kaleidoscope_tavern:bloody_mary":"血腥瑪麗","kaleidoscope_tavern:blue_bar_stool":"藍色高腳凳","kaleidoscope_tavern:brass_heart":"黃銅之心","kaleidoscope_tavern:brown_bar_stool":"棕色高腳凳","kaleidoscope_tavern:cyan_bar_stool":"青色高腳凳","kaleidoscope_tavern:depth_charge":"深水炸彈","kaleidoscope_tavern:emerald":"翡翠","kaleidoscope_tavern:empty_glassware":"空雞尾酒杯","kaleidoscope_tavern:godfather":"教父","kaleidoscope_tavern:grasshopper":"蚱蜢","kaleidoscope_tavern:gray_bar_stool":"灰色高腳凳","kaleidoscope_tavern:green_bar_stool":"綠色高腳凳","kaleidoscope_tavern:light_blue_bar_stool":"淺藍色高腳凳","kaleidoscope_tavern:light_gray_bar_stool":"淺灰色高腳凳","kaleidoscope_tavern:lime_bar_stool":"淺綠色高腳凳","kaleidoscope_tavern:magenta_bar_stool":"洋紅色高腳凳","kaleidoscope_tavern:mojito":"莫希托","kaleidoscope_tavern:mystery_cocktail":"神秘雞尾酒","kaleidoscope_tavern:nether_special":"下界特調","kaleidoscope_tavern:orange_bar_stool":"橙色高腳凳","kaleidoscope_tavern:pink_bar_stool":"粉紅色高腳凳","kaleidoscope_tavern:purple_bar_stool":"紫色高腳凳","kaleidoscope_tavern:red_bar_stool":"紅色高腳凳","kaleidoscope_tavern:screwdriver":"螺絲起子","kaleidoscope_tavern:sculk_special":"幽匿特調","kaleidoscope_tavern:shaker":"雪克杯","kaleidoscope_tavern:signature_cocktail":"特調雞尾酒","kaleidoscope_tavern:string_lights_black":"黑色彩燈","kaleidoscope_tavern:string_lights_blue":"藍色彩燈","kaleidoscope_tavern:string_lights_brown":"棕色彩燈","kaleidoscope_tavern:string_lights_colorless":"無色彩燈","kaleidoscope_tavern:string_lights_cyan":"青色彩燈","kaleidoscope_tavern:string_lights_gray":"灰色彩燈","kaleidoscope_tavern:string_lights_green":"綠色彩燈","kaleidoscope_tavern:string_lights_light_blue":"淺藍色彩燈","kaleidoscope_tavern:string_lights_light_gray":"淺灰色彩燈","kaleidoscope_tavern:string_lights_lime":"淺綠色彩燈","kaleidoscope_tavern:string_lights_magenta":"洋紅色彩燈","kaleidoscope_tavern:string_lights_orange":"橙色彩燈","kaleidoscope_tavern:string_lights_pink":"粉紅色彩燈","kaleidoscope_tavern:string_lights_purple":"紫色彩燈","kaleidoscope_tavern:string_lights_red":"紅色彩燈","kaleidoscope_tavern:string_lights_white":"白色彩燈","kaleidoscope_tavern:string_lights_yellow":"黃色彩燈","kaleidoscope_tavern:watermelon_juice":"西瓜汁","kaleidoscope_tavern:white_bar_stool":"白色高腳凳","kaleidoscope_tavern:white_lady":"白色佳人","kaleidoscope_tavern:yellow_bar_stool":"黃色高腳凳","kaleidoscope_tavern:bottle_brandy":"Brandy・酒瓶陳列","kaleidoscope_tavern:bottle_carignan":"Carignan・酒瓶陳列","kaleidoscope_tavern:bottle_champagne":"Champagne・酒瓶陳列","kaleidoscope_tavern:bottle_glowflower_brew":"Glowflower Brew・酒瓶陳列","kaleidoscope_tavern:bottle_honey_wine":"Honey Wine・酒瓶陳列","kaleidoscope_tavern:bottle_ice_wine":"Ice Wine・酒瓶陳列","kaleidoscope_tavern:bottle_luminous_bride":"Luminous Bride・酒瓶陳列","kaleidoscope_tavern:bottle_madame_shexiang":"Madame Shexiang・酒瓶陳列","kaleidoscope_tavern:bottle_miners_star":"Miners Star・酒瓶陳列","kaleidoscope_tavern:bottle_mother_snow":"Mother Snow・酒瓶陳列","kaleidoscope_tavern:bottle_plum_wine":"Plum Wine・酒瓶陳列","kaleidoscope_tavern:bottle_polaris_sweet_white":"Polaris Sweet White・酒瓶陳列","kaleidoscope_tavern:bottle_red_queen":"Red Queen・酒瓶陳列","kaleidoscope_tavern:bottle_riesling_dry_white":"Riesling Dry White・酒瓶陳列","kaleidoscope_tavern:bottle_rum":"Rum・酒瓶陳列","kaleidoscope_tavern:bottle_sakura_wine":"Sakura Wine・酒瓶陳列","kaleidoscope_tavern:bottle_sauvignon_blanc_dry_white":"Sauvignon Blanc Dry White・酒瓶陳列","kaleidoscope_tavern:bottle_sherry":"Sherry・酒瓶陳列","kaleidoscope_tavern:bottle_sunset_glow":"Sunset Glow・酒瓶陳列","kaleidoscope_tavern:bottle_sweet_berry_wine":"Sweet Berry Wine・酒瓶陳列","kaleidoscope_tavern:bottle_vinegar":"Vinegar・酒瓶陳列","kaleidoscope_tavern:bottle_vodka":"Vodka・酒瓶陳列","kaleidoscope_tavern:bottle_whiskey":"Whiskey・酒瓶陳列","kaleidoscope_tavern:bottle_wine":"Wine・酒瓶陳列","kaleidoscope_tavern:bottle_watermelon_juice":"西瓜汁・酒瓶陳列","kaleidoscope_tavern:shaker_station":"雪克杯","kaleidoscope_tavern:cup_empty_glassware":"空雞尾酒杯","kaleidoscope_tavern:cup_white_lady":"白色佳人","kaleidoscope_tavern:cup_emerald":"翡翠","kaleidoscope_tavern:cup_brass_heart":"黃銅之心","kaleidoscope_tavern:cup_godfather":"教父","kaleidoscope_tavern:cup_grasshopper":"蚱蜢","kaleidoscope_tavern:cup_screwdriver":"螺絲起子","kaleidoscope_tavern:cup_mojito":"莫希托","kaleidoscope_tavern:cup_allium_garden":"蔥花園","kaleidoscope_tavern:cup_depth_charge":"深水炸彈","kaleidoscope_tavern:cup_nether_special":"下界特調","kaleidoscope_tavern:cup_bloody_mary":"血腥瑪麗","kaleidoscope_tavern:cup_sculk_special":"幽匿特調","kaleidoscope_tavern:cup_signature_cocktail":"特調雞尾酒","kaleidoscope_tavern:cup_mystery_cocktail":"神秘雞尾酒","kaleidoscope_tavern:stool_white":"白色高腳凳","kaleidoscope_tavern:stool_light_gray":"淺灰色高腳凳","kaleidoscope_tavern:stool_gray":"灰色高腳凳","kaleidoscope_tavern:stool_black":"黑色高腳凳","kaleidoscope_tavern:stool_brown":"棕色高腳凳","kaleidoscope_tavern:stool_red":"紅色高腳凳","kaleidoscope_tavern:stool_orange":"橙色高腳凳","kaleidoscope_tavern:stool_yellow":"黃色高腳凳","kaleidoscope_tavern:stool_lime":"淺綠色高腳凳","kaleidoscope_tavern:stool_green":"綠色高腳凳","kaleidoscope_tavern:stool_cyan":"青色高腳凳","kaleidoscope_tavern:stool_light_blue":"淺藍色高腳凳","kaleidoscope_tavern:stool_blue":"藍色高腳凳","kaleidoscope_tavern:stool_purple":"紫色高腳凳","kaleidoscope_tavern:stool_magenta":"洋紅色高腳凳","kaleidoscope_tavern:stool_pink":"粉紅色高腳凳","kaleidoscope_tavern:light_colorless":"無色彩燈","kaleidoscope_tavern:light_white":"白色彩燈","kaleidoscope_tavern:light_light_gray":"淺灰色彩燈","kaleidoscope_tavern:light_gray":"灰色彩燈","kaleidoscope_tavern:light_black":"黑色彩燈","kaleidoscope_tavern:light_brown":"棕色彩燈","kaleidoscope_tavern:light_red":"紅色彩燈","kaleidoscope_tavern:light_orange":"橙色彩燈","kaleidoscope_tavern:light_yellow":"黃色彩燈","kaleidoscope_tavern:light_lime":"淺綠色彩燈","kaleidoscope_tavern:light_green":"綠色彩燈","kaleidoscope_tavern:light_cyan":"青色彩燈","kaleidoscope_tavern:light_light_blue":"淺藍色彩燈","kaleidoscope_tavern:light_blue":"藍色彩燈","kaleidoscope_tavern:light_purple":"紫色彩燈","kaleidoscope_tavern:light_magenta":"洋紅色彩燈","kaleidoscope_tavern:light_pink":"粉紅色彩燈","kaleidoscope_tavern:bell_pendant_lamp":"铃铛垂灯","kaleidoscope_tavern:blue_pendant_lamp":"蓝色垂灯","kaleidoscope_tavern:yellow_pendant_lamp":"黄色垂灯","kaleidoscope_tavern:ysbb_painting":"掛畫・藥水棒冰","kaleidoscope_tavern:tartaric_acid_painting":"掛畫・酒石酸菌","kaleidoscope_tavern:cr019_painting":"掛畫・CR019","kaleidoscope_tavern:unknown_painting":"掛畫・Unknown","kaleidoscope_tavern:master_marisa_painting":"掛畫・摸里傻","kaleidoscope_tavern:son_of_man_painting":"掛畫・人類之子","kaleidoscope_tavern:david_painting":"掛畫・大衛","kaleidoscope_tavern:girl_with_pearl_earring_painting":"掛畫・戴珍珠耳環的少女","kaleidoscope_tavern:starry_night_painting":"掛畫・星夜","kaleidoscope_tavern:van_gogh_self_portrait_painting":"掛畫・梵谷自畫像","kaleidoscope_tavern:father_painting":"掛畫・父親","kaleidoscope_tavern:great_wave_painting":"掛畫・神奈川沖浪裏","kaleidoscope_tavern:mona_lisa_painting":"掛畫・蒙娜麗莎","kaleidoscope_tavern:mondrian_painting":"掛畫・蒙德里安","kaleidoscope_tavern:base_sandwich_board":"素面立式告示牌","kaleidoscope_tavern:grass_sandwich_board":"草飾立式告示牌","kaleidoscope_tavern:allium_sandwich_board":"紫色絨球蔥飾立式告示牌","kaleidoscope_tavern:azure_bluet_sandwich_board":"藍眼草飾立式告示牌","kaleidoscope_tavern:cornflower_sandwich_board":"矢車菊飾立式告示牌","kaleidoscope_tavern:orchid_sandwich_board":"藍色蝴蝶蘭飾立式告示牌","kaleidoscope_tavern:peony_sandwich_board":"牡丹飾立式告示牌","kaleidoscope_tavern:pink_petals_sandwich_board":"櫻花花瓣飾立式告示牌","kaleidoscope_tavern:pitcher_plant_sandwich_board":"瓶子草飾立式告示牌","kaleidoscope_tavern:poppy_sandwich_board":"虞美人飾立式告示牌","kaleidoscope_tavern:sunflower_sandwich_board":"向日葵飾立式告示牌","kaleidoscope_tavern:torchflower_sandwich_board":"火炬花飾立式告示牌","kaleidoscope_tavern:tulip_sandwich_board":"鬱金香飾立式告示牌","kaleidoscope_tavern:wither_rose_sandwich_board":"凋零玫瑰飾立式告示牌"},"en_US":{"minecraft:apple":"Apple","minecraft:bell":"Bell","minecraft:blaze_powder":"Blaze Powder","minecraft:bucket":"Bucket","minecraft:diamond":"Diamond","minecraft:glow_ink_sac":"Glow Ink Sac","minecraft:end_rod":"End Rod","minecraft:ender_pearl":"Ender Pearl","minecraft:glass_bottle":"Glass Bottle","minecraft:gold_nugget":"Gold Nugget","minecraft:iron_nugget":"Iron Nugget","minecraft:iron_hoe":"Iron Hoe","minecraft:honeycomb":"Honeycomb","minecraft:iron_ingot":"Iron Ingot","minecraft:painting":"Painting","minecraft:potato":"Potato","minecraft:redstone":"Redstone Dust","minecraft:snowball":"Snowball","minecraft:sugar":"Sugar","minecraft:gunpowder":"Gunpowder","minecraft:wheat":"Crops","minecraft:glowstone_dust":"Glowstone Dust","minecraft:sweet_berries":"Sweet Berries","minecraft:mangrove_fence":"Mangrove Fence","minecraft:mangrove_trapdoor":"Mangrove Trapdoor","minecraft:echo_shard":"Echo Shard","minecraft:bamboo_fence":"Bamboo Fence","minecraft:bamboo_trapdoor":"Bamboo Trapdoor","minecraft:cherry_fence":"Cherry Fence","minecraft:cherry_sapling":"Cherry Sapling","minecraft:cherry_trapdoor":"Cherry Trapdoor","minecraft:pink_petals":"Pink Petals","minecraft:spore_blossom":"Spore Blossom","minecraft:glow_berries":"Glow Berries","minecraft:crimson_trapdoor":"Crimson Trapdoor","minecraft:warped_trapdoor":"Warped Trapdoor","minecraft:crimson_fence":"Crimson Fence","minecraft:warped_fence":"Warped Fence","minecraft:chain":"Chain","minecraft:wither_rose":"Wither Rose","minecraft:grass":"Grass Block","minecraft:hopper":"Hopper","minecraft:ice":"Ice","minecraft:packed_ice":"Packed Ice","minecraft:blue_ice":"Blue Ice","minecraft:iron_trapdoor":"Iron Trapdoor","minecraft:ladder":"Ladder","minecraft:lava":"Lava","minecraft:lever":"Lever","minecraft:nether_brick_fence":"Nether Brick Fence","minecraft:glass_pane":"Glass Pane","minecraft:trapdoor":"Oak Trapdoor","minecraft:acacia_trapdoor":"Acacia Trapdoor","minecraft:birch_trapdoor":"Birch Trapdoor","minecraft:dark_oak_trapdoor":"Dark Oak Trapdoor","minecraft:jungle_trapdoor":"Jungle Trapdoor","minecraft:spruce_trapdoor":"Spruce Trapdoor","minecraft:vine":"Vines","minecraft:water":"Water","minecraft:lantern":"Lantern","minecraft:soul_lantern":"Soul Lantern","minecraft:barrel":"Barrel","minecraft:pitcher_plant":"Pitcher Plant","minecraft:torchflower":"Torchflower","minecraft:copper_trapdoor":"Copper Trapdoor","minecraft:exposed_copper_trapdoor":"Exposed Copper Trapdoor","minecraft:oxidized_copper_trapdoor":"Oxidized Copper Trapdoor","minecraft:waxed_copper_trapdoor":"Waxed Copper Trapdoor","minecraft:waxed_exposed_copper_trapdoor":"Waxed Exposed Copper Trapdoor","minecraft:waxed_oxidized_copper_trapdoor":"Waxed Oxidized Copper Trapdoor","minecraft:waxed_weathered_copper_trapdoor":"Waxed Weathered Copper Trapdoor","minecraft:weathered_copper_trapdoor":"Weathered Copper Trapdoor","minecraft:sugar_cane":"Sugar Cane","minecraft:potion":"Potion","kaleidoscope_cookery:apple_platter":"Apple Platter","kaleidoscope_cookery:bamboo_tube_rice":"Bamboo Tube Rice","kaleidoscope_cookery:baozi":"Baozi","kaleidoscope_cookery:baozi_plate":"Plate of Baozi","kaleidoscope_cookery:barley_tea":"Barley Tea","kaleidoscope_cookery:beef_meatball_soup":"Beef Meatball Soup","kaleidoscope_cookery:beef_noodle":"Beef Noodle","kaleidoscope_cookery:berry_platter":"Berry Platter","kaleidoscope_cookery:biluochun":"Biluochun","kaleidoscope_cookery:blaze_lamb_chop":"Blaze Lamb Chop","kaleidoscope_cookery:borscht":"Borscht","kaleidoscope_cookery:braised_beef":"Braised Beef","kaleidoscope_cookery:braised_beef_rice_bowl":"Braised Beef on Rice","kaleidoscope_cookery:braised_beef_with_potatoes":"Braised Beef with Potatoes","kaleidoscope_cookery:braised_pork_ribs":"Braised Pork Ribs","kaleidoscope_cookery:brown_mushroom_pot_soup":"Brown Mushroom Pot Soup","kaleidoscope_cookery:buddha_jumps_over_the_wall":"Buddha Jumps Over the Wall","kaleidoscope_cookery:candied_potato":"Candied Potatoes","kaleidoscope_cookery:caterpillar":"Caterpillar","kaleidoscope_cookery:chair_acacia":"Acacia Chair","kaleidoscope_cookery:chair_bamboo":"Bamboo Chair","kaleidoscope_cookery:chair_birch":"Birch Chair","kaleidoscope_cookery:chair_cherry":"Cherry Chair","kaleidoscope_cookery:chair_crimson":"Crimson Chair","kaleidoscope_cookery:chair_dark_oak":"Dark Oak Chair","kaleidoscope_cookery:chair_jungle":"Jungle Chair","kaleidoscope_cookery:chair_mangrove":"Mangrove Chair","kaleidoscope_cookery:chair_oak":"Oak Chair","kaleidoscope_cookery:chair_spruce":"Spruce Chair","kaleidoscope_cookery:chair_warped":"Warped Chair","kaleidoscope_cookery:chicken_and_mushroom_stew":"Chicken and Mushroom Stew","kaleidoscope_cookery:chili_seed":"Chili Seed","kaleidoscope_cookery:chili_ristra":"Chili Ristra","kaleidoscope_cookery:chopping_board":"Chopping Board","kaleidoscope_cookery:chorus_fried_egg":"Chorus Fried Egg","kaleidoscope_cookery:chorus_fruit_platter":"Chorus Fruit Platter","kaleidoscope_cookery:cold_cut_ham_slices":"Cold Cut Ham Slices","kaleidoscope_cookery:cold_roasted_meat":"Cold Roasted Meat","kaleidoscope_cookery:cold_style_sashimi":"Frost Style Sashimi","kaleidoscope_cookery:cook_stool_acacia":"Acacia Cook's Stool","kaleidoscope_cookery:cook_stool_bamboo":"Bamboo Cook's Stool","kaleidoscope_cookery:cook_stool_birch":"Birch Cook's Stool","kaleidoscope_cookery:cook_stool_cherry":"Cherry Cook's Stool","kaleidoscope_cookery:cook_stool_crimson":"Crimson Cook's Stool","kaleidoscope_cookery:cook_stool_dark_oak":"Dark Oak Cook's Stool","kaleidoscope_cookery:cook_stool_jungle":"Jungle Cook's Stool","kaleidoscope_cookery:cook_stool_mangrove":"Mangrove Cook's Stool","kaleidoscope_cookery:cook_stool_oak":"Oak Cook's Stool","kaleidoscope_cookery:cook_stool_spruce":"Spruce Cook's Stool","kaleidoscope_cookery:cook_stool_warped":"Warped Cook's Stool","kaleidoscope_cookery:cooked_cow_offal":"Cooked Cow Offal","kaleidoscope_cookery:cooked_cut_small_meats":"Cooked Meat Cuts","kaleidoscope_cookery:cooked_lamb_chops":"Cooked Lamb Chops","kaleidoscope_cookery:cooked_meatball":"Cooked Meatball","kaleidoscope_cookery:cooked_pork_belly":"Cooked Pork Belly","kaleidoscope_cookery:cooked_rice":"Cooked Rice","kaleidoscope_cookery:crimson_fungus_pot_soup":"Crimson Fungus Pot Soup","kaleidoscope_cookery:crystal_lamb_chop":"Crystal Lamb Chop","kaleidoscope_cookery:dark_cuisine":"Dark Cuisine","kaleidoscope_cookery:desert_style_sashimi":"Desert Style Sashimi","kaleidoscope_cookery:diamond_kitchen_knife":"Diamond Kitchen Knife","kaleidoscope_cookery:dongpo_pork":"Dongpo Pork","kaleidoscope_cookery:donkey_burger":"Donkey Burger","kaleidoscope_cookery:dough_drop_soup":"Dough Drop Soup","kaleidoscope_cookery:dumpling":"Dumpling","kaleidoscope_cookery:egg_fried_rice":"Egg Fried Rice","kaleidoscope_cookery:empty_cup":"Empty Teacup","kaleidoscope_cookery:enamel_basin":"Grease Crock","kaleidoscope_cookery:end_style_sashimi":"End Style Sashimi","kaleidoscope_cookery:farmer_boots":"Farmer's Boots","kaleidoscope_cookery:farmer_chest_plate":"Farmer's Overalls","kaleidoscope_cookery:farmer_leggings":"Farmer's Work Pants","kaleidoscope_cookery:fearsome_thick_soup":"Fearsome Thick Soup","kaleidoscope_cookery:fish_flavored_shredded_pork":"Fish Flavored Shredded Pork","kaleidoscope_cookery:fish_flavored_shredded_pork_rice_bowl":"Fish Flavored Shredded Pork on Rice","kaleidoscope_cookery:flour":"Flour","kaleidoscope_cookery:flower_tea":"Flower Tea","kaleidoscope_cookery:fondant_pie":"Fondant Pie","kaleidoscope_cookery:fondant_spider_eye":"Fondant Spider Eye","kaleidoscope_cookery:four_joy_meatball_soup":"Four Joy Meatball Soup","kaleidoscope_cookery:fried_caterpillar":"Fried Caterpillar","kaleidoscope_cookery:fried_egg":"Fried Egg","kaleidoscope_cookery:fried_spring_roll":"Fried Spring Roll","kaleidoscope_cookery:frost_lamb_chop":"Frost Lamb Chop","kaleidoscope_cookery:fruit_basket":"Fruit Basket","kaleidoscope_cookery:gold_kitchen_knife":"Gold Kitchen Knife","kaleidoscope_cookery:golden_salad":"Golden Salad","kaleidoscope_cookery:green_chili":"Green Chili","kaleidoscope_cookery:hot_dry_noodles":"Hot Dry Noodles","kaleidoscope_cookery:hui_noodle":"Lamb Hui Noodles","kaleidoscope_cookery:iron_kitchen_knife":"Iron Kitchen Knife","kaleidoscope_cookery:kitchen_shovel":"Kitchen Shovel","kaleidoscope_cookery:kitchen_shovel_has_oil":"Kitchen Shovel (Oiled)","kaleidoscope_cookery:kitchenware_racks":"Kitchenware Racks","kaleidoscope_cookery:laba_congee":"Laba Congee","kaleidoscope_cookery:lamb_and_radish_soup":"Mutton and Radish Soup","kaleidoscope_cookery:lettuce":"Lettuce","kaleidoscope_cookery:lettuce_seed":"Lettuce Seed","kaleidoscope_cookery:mantou":"Mantou","kaleidoscope_cookery:meat_pie":"Meat Pie","kaleidoscope_cookery:millstone":"Millstone","kaleidoscope_cookery:nether_style_sashimi":"Nether Style Sashimi","kaleidoscope_cookery:netherite_kitchen_knife":"Netherite Kitchen Knife","kaleidoscope_cookery:numbing_spicy_chicken":"Numbing Spicy Chicken","kaleidoscope_cookery:oil":"Oil","kaleidoscope_cookery:oil_block":"Oil Block","kaleidoscope_cookery:oil_pot":"Oil Can","kaleidoscope_cookery:oil_splashed_fish":"Oil-Splashed Fish","kaleidoscope_cookery:oolong":"Oolong","kaleidoscope_cookery:pan_seared_knight_steak":"Pan-Seared Knight Steak","kaleidoscope_cookery:pork_bone_soup":"Pork Bone Soup","kaleidoscope_cookery:pot":"Wok","kaleidoscope_cookery:pufferfish_soup":"Pufferfish Soup","kaleidoscope_cookery:qingtuan":"Qingtuan","kaleidoscope_cookery:qingtuan_plate":"Plate of Qingtuan","kaleidoscope_cookery:raw_bamboo_tube_rice":"Raw Bamboo Tube Rice","kaleidoscope_cookery:raw_cow_offal":"Raw Cow Offal","kaleidoscope_cookery:raw_cut_small_meats":"Raw Meat Cuts","kaleidoscope_cookery:raw_dough":"Raw Dough","kaleidoscope_cookery:raw_lamb_chops":"Raw Lamb Chops","kaleidoscope_cookery:raw_meatball":"Raw Meatball","kaleidoscope_cookery:raw_noodles":"Raw Noodles","kaleidoscope_cookery:raw_pork_belly":"Raw Pork Belly","kaleidoscope_cookery:raw_zongzi":"Raw Zongzi","kaleidoscope_cookery:red_chili":"Red Chili","kaleidoscope_cookery:red_mushroom_pot_soup":"Red Mushroom Pot Soup","kaleidoscope_cookery:rice":"Rice Seed","kaleidoscope_cookery:rice_panicle":"Rice Panicle","kaleidoscope_cookery:sakura_fubuki":"Sakura Fubuki","kaleidoscope_cookery:samsa":"Samsa","kaleidoscope_cookery:sashimi":"Sashimi","kaleidoscope_cookery:scarecrow":"Scarecrow","kaleidoscope_cookery:scramble_egg_with_tomatoes":"Scramble Egg with Tomatoes","kaleidoscope_cookery:scramble_egg_with_tomatoes_rice_bowl":"Scramble Egg with Tomatoes on Rice","kaleidoscope_cookery:seafood_miso_soup":"Seafood Miso Soup","kaleidoscope_cookery:shawarma_spit":"Shawarma Spit","kaleidoscope_cookery:shengjian_mantou":"Shengjian Mantou","kaleidoscope_cookery:shengjian_mantou_plate":"Plate of Shengjian Mantou","kaleidoscope_cookery:sickle":"Sickle","kaleidoscope_cookery:slime_ball_meal":"Slime Ball Meal","kaleidoscope_cookery:spicy_blood_stew":"Spicy Blood Stew","kaleidoscope_cookery:spicy_chicken":"Spicy Chicken","kaleidoscope_cookery:spicy_rabbit_head":"Spicy Rabbit Head","kaleidoscope_cookery:stargazy_pie":"Stargazy Pie","kaleidoscope_cookery:steamer":"Steamer","kaleidoscope_cookery:sticky_candy":"Sticky Candy","kaleidoscope_cookery:sticky_candy_plate":"Plate of Sticky Candy","kaleidoscope_cookery:sticky_rice_cake":"Sticky Rice Cake","kaleidoscope_cookery:sticky_rice_cake_plate":"Plate of Sticky Rice Cakes","kaleidoscope_cookery:stir_fried_pork_with_peppers":"Stir-fried Pork with Peppers","kaleidoscope_cookery:stir_fried_pork_with_peppers_rice_bowl":"Stir-fried Pork with Peppers on Rice","kaleidoscope_cookery:stockpot":"Stockpot","kaleidoscope_cookery:stockpot_lid":"Stockpot Lid","kaleidoscope_cookery:stove":"Stove","kaleidoscope_cookery:straw_block":"Straw Bale","kaleidoscope_cookery:straw_hat":"Straw Hat","kaleidoscope_cookery:straw_hat_flower":"Flowery Straw Hat","kaleidoscope_cookery:strung_mushrooms":"Strung Mushrooms","kaleidoscope_cookery:stuffed_dough_food":"Stuffed Dough","kaleidoscope_cookery:stuffed_tiger_skin_pepper":"Stuffed Tiger Skin Pepper","kaleidoscope_cookery:suspicious_stir_fry":"Suspicious Stir-Fry","kaleidoscope_cookery:sweet_and_sour_ender_pearls":"Sweet and Sour Ender Pearls","kaleidoscope_cookery:sweet_and_sour_pork":"Sweet and Sour Pork","kaleidoscope_cookery:sweet_and_sour_pork_rice_bowl":"Sweet and Sour Pork on Rice","kaleidoscope_cookery:table_acacia":"Acacia Table","kaleidoscope_cookery:table_bamboo":"Bamboo Table","kaleidoscope_cookery:table_birch":"Birch Table","kaleidoscope_cookery:table_cherry":"Cherry Table","kaleidoscope_cookery:table_crimson":"Crimson Table","kaleidoscope_cookery:table_dark_oak":"Dark Oak Table","kaleidoscope_cookery:table_jungle":"Jungle Table","kaleidoscope_cookery:table_mangrove":"Mangrove Table","kaleidoscope_cookery:table_oak":"Oak Table","kaleidoscope_cookery:table_spruce":"Spruce Table","kaleidoscope_cookery:table_warped":"Warped Table","kaleidoscope_cookery:teapot":"Teapot","kaleidoscope_cookery:tieguanyin":"Tieguanyin","kaleidoscope_cookery:tomato":"Tomato","kaleidoscope_cookery:tomato_seed":"Tomato Seed","kaleidoscope_cookery:tomato_platter":"Tomato Platter","kaleidoscope_cookery:transmutation_lunch_bag":"Transmutation Lunch Bag","kaleidoscope_cookery:trash_can":"Trash Can","kaleidoscope_cookery:tundra_style_sashimi":"Tundra Style Sashimi","kaleidoscope_cookery:udon_noodle":"Udon Noodle","kaleidoscope_cookery:warped_fungus_pot_soup":"Warped Fungus Pot Soup","kaleidoscope_cookery:watermelon_platter":"Watermelon Platter","kaleidoscope_cookery:wild_mushroom_rabbit_soup":"Wild Mushroom Rabbit Soup","kaleidoscope_cookery:wild_rice":"Wild Rice Seed","kaleidoscope_cookery:zongzi":"Cooked Zongzi","kaleidoscope_cookery:zongzi_plate":"Plate of Zongzi","kaleidoscope_cookery:oil_pot_filled":"Filled Oil Can","kaleidoscope_cookery:raw_donkey_meat":"Raw Donkey Meat","kaleidoscope_cookery:cooked_donkey_meat":"Cooked Donkey Meat","kaleidoscope_cookery:donkey_soup":"Donkey Meat Soup","kaleidoscope_cookery:braised_fish_rice_bowl":"Braised Fish Rice Bowl","kaleidoscope_cookery:spicy_chicken_rice_bowl":"Spicy Chicken Rice Bowl","kaleidoscope_cookery:delicious_egg_fried_rice":"Delicious Egg Fried Rice","kaleidoscope_cookery:suspicious_stir_fry_rice_bowl":"Suspicious Rice Bowl","kaleidoscope_cookery:country_style_mixed_vegetables":"Garden Mixed Vegetables","kaleidoscope_cookery:yakitori":"Yakitori","kaleidoscope_cookery:braised_fish":"Braised Fish","kaleidoscope_cookery:tomato_beef_brisket_soup":"Tomato Beef Brisket Soup","kaleidoscope_cookery:stir_fried_beef_offal":"Stir-fried Cow Offal","kaleidoscope_cookery:stir_fried_beef_offal_rice_bowl":"Stir-fried Cow Offal Rice Bowl","kaleidoscope_cookery:fruit_platter":"Fruit Platter","kaleidoscope_cookery:stockpot_lid_visual":"Stockpot Lid","kaleidoscope_cookery:scarecrow_lantern_light":"Scarecrow","kaleidoscope_cookery:scarecrow_soul_lantern_light":"Scarecrow","kaleidoscope_cookery:guidebook":"Guidebook","kaleidoscope_cookery:master_recipe_page":"Master Recipe Page","kaleidoscope_cookery:rack_trident_display_item":"Rack Trident Display Item","kaleidoscope_cookery:recipe_page_beef_noodle":"Recipe Page Beef Noodle","kaleidoscope_cookery:recipe_page_blaze_lamb_chop":"Recipe Page Blaze Lamb Chop","kaleidoscope_cookery:recipe_page_borscht":"Recipe Page Borscht","kaleidoscope_cookery:recipe_page_braised_beef":"Recipe Page Braised Beef","kaleidoscope_cookery:recipe_page_brown_mushroom_pot_soup":"Recipe Page Brown Mushroom Pot Soup","kaleidoscope_cookery:recipe_page_buddha_jumps_over_the_wall":"Recipe Page Buddha Jumps Over The Wall","kaleidoscope_cookery:recipe_page_candied_potato":"Recipe Page Candied Potato","kaleidoscope_cookery:recipe_page_chorus_fried_egg":"Recipe Page Chorus Fried Egg","kaleidoscope_cookery:recipe_page_crimson_fungus_pot_soup":"Recipe Page Crimson Fungus Pot Soup","kaleidoscope_cookery:recipe_page_crystal_lamb_chop":"Recipe Page Crystal Lamb Chop","kaleidoscope_cookery:recipe_page_dongpo_pork":"Recipe Page Dongpo Pork","kaleidoscope_cookery:recipe_page_donkey_burger":"Recipe Page Donkey Burger","kaleidoscope_cookery:recipe_page_dumpling":"Recipe Page Dumpling","kaleidoscope_cookery:recipe_page_fearsome_thick_soup":"Recipe Page Fearsome Thick Soup","kaleidoscope_cookery:recipe_page_fish_flavored_shredded_pork":"Recipe Page Fish Flavored Shredded Pork","kaleidoscope_cookery:recipe_page_fondant_pie":"Recipe Page Fondant Pie","kaleidoscope_cookery:recipe_page_fondant_spider_eye":"Recipe Page Fondant Spider Eye","kaleidoscope_cookery:recipe_page_four_joy_meatball_soup":"Recipe Page Four Joy Meatball Soup","kaleidoscope_cookery:recipe_page_fried_caterpillar":"Recipe Page Fried Caterpillar","kaleidoscope_cookery:recipe_page_fried_egg":"Recipe Page Fried Egg","kaleidoscope_cookery:recipe_page_fried_spring_roll":"Recipe Page Fried Spring Roll","kaleidoscope_cookery:recipe_page_frost_lamb_chop":"Recipe Page Frost Lamb Chop","kaleidoscope_cookery:recipe_page_hot_dry_noodles":"Recipe Page Hot Dry Noodles","kaleidoscope_cookery:recipe_page_hui_noodle":"Recipe Page Hui Noodle","kaleidoscope_cookery:recipe_page_laba_congee":"Recipe Page Laba Congee","kaleidoscope_cookery:recipe_page_lamb_and_radish_soup":"Recipe Page Lamb And Radish Soup","kaleidoscope_cookery:recipe_page_meat_pie":"Recipe Page Meat Pie","kaleidoscope_cookery:recipe_page_numbing_spicy_chicken":"Recipe Page Numbing Spicy Chicken","kaleidoscope_cookery:recipe_page_pan_seared_knight_steak":"Recipe Page Pan Seared Knight Steak","kaleidoscope_cookery:recipe_page_pufferfish_soup":"Recipe Page Pufferfish Soup","kaleidoscope_cookery:recipe_page_red_mushroom_pot_soup":"Recipe Page Red Mushroom Pot Soup","kaleidoscope_cookery:recipe_page_seafood_miso_soup":"Recipe Page Seafood Miso Soup","kaleidoscope_cookery:recipe_page_shengjian_mantou":"Recipe Page Shengjian Mantou","kaleidoscope_cookery:recipe_page_slime_ball_meal":"Recipe Page Slime Ball Meal","kaleidoscope_cookery:recipe_page_spicy_blood_stew":"Recipe Page Spicy Blood Stew","kaleidoscope_cookery:recipe_page_spicy_chicken":"Recipe Page Spicy Chicken","kaleidoscope_cookery:recipe_page_spicy_rabbit_head":"Recipe Page Spicy Rabbit Head","kaleidoscope_cookery:recipe_page_stargazy_pie":"Recipe Page Stargazy Pie","kaleidoscope_cookery:recipe_page_sticky_candy":"Recipe Page Sticky Candy","kaleidoscope_cookery:recipe_page_sticky_rice_cake":"Recipe Page Sticky Rice Cake","kaleidoscope_cookery:recipe_page_stir_fried_pork_with_peppers":"Recipe Page Stir Fried Pork With Peppers","kaleidoscope_cookery:recipe_page_stuffed_tiger_skin_pepper":"Recipe Page Stuffed Tiger Skin Pepper","kaleidoscope_cookery:recipe_page_sweet_and_sour_ender_pearls":"Recipe Page Sweet And Sour Ender Pearls","kaleidoscope_cookery:recipe_page_sweet_and_sour_pork":"Recipe Page Sweet And Sour Pork","kaleidoscope_cookery:recipe_page_udon_noodle":"Recipe Page Udon Noodle","kaleidoscope_cookery:recipe_page_warped_fungus_pot_soup":"Recipe Page Warped Fungus Pot Soup","kaleidoscope_cookery:recipe_page_wild_mushroom_rabbit_soup":"Recipe Page Wild Mushroom Rabbit Soup","kaleidoscope_cookery:recipe_page_zongzi":"Recipe Page Zongzi","kt_assets_a1:pressing_tub":"Pressing Tub","kt_assets_a1:pressing_tub_tilt":"Tilted Pressing Tub","kt_assets_a1:tap_closed":"Closed Tap","kt_assets_a1:tap_open":"Open Tap","kt_assets_a1:wine_1":"Wine | 1 bottles","kt_assets_a1:wine_2":"Wine | 2 bottles","kt_assets_a1:wine_3":"Wine | 3 bottles","kt_assets_a1:wine_4":"Wine | 4 bottles","kt_assets_a1:grape":"Grape","kt_assets_a2:trellis_single":"Trellis | single","kt_assets_a2:trellis_east_west":"Trellis | east_west","kt_assets_a2:trellis_north_south":"Trellis | north_south","kt_assets_a2:trellis_cross_east_west":"Trellis | cross_east_west","kt_assets_a2:trellis_cross_north_south":"Trellis | cross_north_south","kt_assets_a2:trellis_cross_up_down":"Trellis | cross_up_down","kt_assets_a2:trellis_six_direction":"Trellis | six_direction","kt_assets_a2:grapevine_stage0":"Grapevine | stage 0","kt_assets_a2:grapevine_stage1":"Grapevine | stage 1","kt_assets_a2:grapevine_stage2":"Grapevine | stage 2","kt_assets_a2:grapevine_stage3":"Grapevine | stage 3","kt_assets_a2:grape_crop_stage0":"grape_crop | stage 0","kt_assets_a2:grape_crop_stage1":"grape_crop | stage 1","kt_assets_a2:grape_crop_stage2":"grape_crop | stage 2","kt_assets_a2:grape_crop_stage3":"grape_crop | stage 3","kt_assets_a2:grape_crop_stage4":"grape_crop | stage 4","kt_assets_a2:grape_crop_stage5":"grape_crop | stage 5","kt_assets_a2:ice_grape_crop_stage0":"ice_grape_crop | stage 0","kt_assets_a2:ice_grape_crop_stage1":"ice_grape_crop | stage 1","kt_assets_a2:ice_grape_crop_stage2":"ice_grape_crop | stage 2","kt_assets_a2:ice_grape_crop_stage3":"ice_grape_crop | stage 3","kt_assets_a2:ice_grape_crop_stage4":"ice_grape_crop | stage 4","kt_assets_a2:ice_grape_crop_stage5":"ice_grape_crop | stage 5","kt_assets_a2:gold_grape_crop_stage0":"gold_grape_crop | stage 0","kt_assets_a2:gold_grape_crop_stage1":"gold_grape_crop | stage 1","kt_assets_a2:gold_grape_crop_stage2":"gold_grape_crop | stage 2","kt_assets_a2:gold_grape_crop_stage3":"gold_grape_crop | stage 3","kt_assets_a2:gold_grape_crop_stage4":"gold_grape_crop | stage 4","kt_assets_a2:gold_grape_crop_stage5":"gold_grape_crop | stage 5","kt_assets_a2:ice_grape":"Ice Grape","kt_assets_a2:gold_grape":"Gold Grape","kt_assets_a2:green_grape":"Green Grape","kt_assets_a2:grape_bucket":"Grape Juice Bucket","kt_assets_a2:ice_grape_bucket":"Ice Grape Juice Bucket","kt_assets_a2:gold_grape_bucket":"Gold Grape Juice Bucket","kt_assets_a2:green_grape_bucket":"Green Grape Juice Bucket","kt_assets_a2:sweet_berries_bucket":"Sweet Berries Juice Bucket","kt_assets_a2:glow_berries_bucket":"Glow Berries Juice Bucket","kt_assets_a3:grapevine_east_west":"grapevine | east_west","kt_assets_a3:grapevine_north_south":"grapevine | north_south","kt_assets_a3:grapevine_cross_east_west":"grapevine | cross_east_west","kt_assets_a3:grapevine_cross_north_south":"grapevine | cross_north_south","kt_assets_a3:grapevine_cross_up_down":"grapevine | cross_up_down","kt_assets_a3:grapevine_six_direction":"grapevine | six_direction","kt_assets_a3:ice_grapevine_stage0":"ice_grapevine | stage 0","kt_assets_a3:ice_grapevine_stage1":"ice_grapevine | stage 1","kt_assets_a3:ice_grapevine_stage2":"ice_grapevine | stage 2","kt_assets_a3:ice_grapevine_stage3":"ice_grapevine | stage 3","kt_assets_a3:ice_grapevine_east_west":"ice_grapevine | east_west","kt_assets_a3:ice_grapevine_north_south":"ice_grapevine | north_south","kt_assets_a3:ice_grapevine_cross_east_west":"ice_grapevine | cross_east_west","kt_assets_a3:ice_grapevine_cross_north_south":"ice_grapevine | cross_north_south","kt_assets_a3:ice_grapevine_cross_up_down":"ice_grapevine | cross_up_down","kt_assets_a3:ice_grapevine_six_direction":"ice_grapevine | six_direction","kt_assets_a3:gold_grapevine_stage0":"gold_grapevine | stage 0","kt_assets_a3:gold_grapevine_stage1":"gold_grapevine | stage 1","kt_assets_a3:gold_grapevine_stage2":"gold_grapevine | stage 2","kt_assets_a3:gold_grapevine_stage3":"gold_grapevine | stage 3","kt_assets_a3:gold_grapevine_east_west":"gold_grapevine | east_west","kt_assets_a3:gold_grapevine_north_south":"gold_grapevine | north_south","kt_assets_a3:gold_grapevine_cross_east_west":"gold_grapevine | cross_east_west","kt_assets_a3:gold_grapevine_cross_north_south":"gold_grapevine | cross_north_south","kt_assets_a3:gold_grapevine_cross_up_down":"gold_grapevine | cross_up_down","kt_assets_a3:gold_grapevine_six_direction":"gold_grapevine | six_direction","kt_assets_a3:wild_grapevine":"wild_grapevine","kt_assets_a3:wild_grapevine_plant":"wild_grapevine_plant","kt_assets_a3:empty_bottle_faces":"Empty Bottle | preserved inner faces","kt_assets_a4:champagne_1":"champagne | 1 bottles","kt_assets_a4:champagne_2":"champagne | 2 bottles","kt_assets_a4:champagne_3":"champagne | 3 bottles","kt_assets_a4:champagne_4":"champagne | 4 bottles","kt_assets_a4:honey_wine_1":"honey_wine | 1 bottles","kt_assets_a4:honey_wine_2":"honey_wine | 2 bottles","kt_assets_a4:honey_wine_3":"honey_wine | 3 bottles","kt_assets_a4:honey_wine_4":"honey_wine | 4 bottles","kt_assets_a4:ice_wine_1":"ice_wine | 1 bottles","kt_assets_a4:ice_wine_2":"ice_wine | 2 bottles","kt_assets_a4:ice_wine_3":"ice_wine | 3 bottles","kt_assets_a4:ice_wine_4":"ice_wine | 4 bottles","kt_assets_a4:sofa_white_single":"Sofa | white | single","kt_assets_a4:sofa_orange_single":"Sofa | orange | single","kt_assets_a4:sofa_magenta_single":"Sofa | magenta | single","kt_assets_a4:sofa_light_blue_single":"Sofa | light_blue | single","kt_assets_a4:sofa_yellow_single":"Sofa | yellow | single","kt_assets_a4:sofa_lime_single":"Sofa | lime | single","kt_assets_a4:sofa_pink_single":"Sofa | pink | single","kt_assets_a4:sofa_gray_single":"Sofa | gray | single","kt_assets_a4:sofa_light_gray_single":"Sofa | light_gray | single","kt_assets_a4:sofa_cyan_single":"Sofa | cyan | single","kt_assets_a4:sofa_purple_single":"Sofa | purple | single","kt_assets_a4:sofa_blue_single":"Sofa | blue | single","kt_assets_a4:sofa_brown_single":"Sofa | brown | single","kt_assets_a4:sofa_green_single":"Sofa | green | single","kt_assets_a4:sofa_red_single":"Sofa | red | single","kt_assets_a4:sofa_black_single":"Sofa | black | single","kt_assets_a4:sofa_white_left":"Sofa | white | left","kt_assets_a4:sofa_orange_left":"Sofa | orange | left","kt_assets_a4:sofa_magenta_left":"Sofa | magenta | left","kt_assets_a4:sofa_light_blue_left":"Sofa | light_blue | left","kt_assets_a4:sofa_yellow_left":"Sofa | yellow | left","kt_assets_a4:sofa_lime_left":"Sofa | lime | left","kt_assets_a4:sofa_pink_left":"Sofa | pink | left","kt_assets_a4:sofa_gray_left":"Sofa | gray | left","kt_assets_a4:sofa_light_gray_left":"Sofa | light_gray | left","kt_assets_a4:sofa_cyan_left":"Sofa | cyan | left","kt_assets_a4:sofa_purple_left":"Sofa | purple | left","kt_assets_a4:sofa_blue_left":"Sofa | blue | left","kt_assets_a4:sofa_brown_left":"Sofa | brown | left","kt_assets_a4:sofa_green_left":"Sofa | green | left","kt_assets_a4:sofa_red_left":"Sofa | red | left","kt_assets_a4:sofa_black_left":"Sofa | black | left","kt_assets_a4:sofa_white_middle":"Sofa | white | middle","kt_assets_a4:sofa_orange_middle":"Sofa | orange | middle","kt_assets_a4:sofa_magenta_middle":"Sofa | magenta | middle","kt_assets_a4:sofa_light_blue_middle":"Sofa | light_blue | middle","kt_assets_a4:sofa_yellow_middle":"Sofa | yellow | middle","kt_assets_a4:sofa_lime_middle":"Sofa | lime | middle","kt_assets_a4:sofa_pink_middle":"Sofa | pink | middle","kt_assets_a4:sofa_gray_middle":"Sofa | gray | middle","kt_assets_a4:sofa_light_gray_middle":"Sofa | light_gray | middle","kt_assets_a4:sofa_cyan_middle":"Sofa | cyan | middle","kt_assets_a4:sofa_purple_middle":"Sofa | purple | middle","kt_assets_a4:sofa_blue_middle":"Sofa | blue | middle","kt_assets_a4:sofa_brown_middle":"Sofa | brown | middle","kt_assets_a4:sofa_green_middle":"Sofa | green | middle","kt_assets_a4:sofa_red_middle":"Sofa | red | middle","kt_assets_a4:sofa_black_middle":"Sofa | black | middle","kt_assets_a4:sofa_white_right":"Sofa | white | right","kt_assets_a4:sofa_orange_right":"Sofa | orange | right","kt_assets_a4:sofa_magenta_right":"Sofa | magenta | right","kt_assets_a4:sofa_light_blue_right":"Sofa | light_blue | right","kt_assets_a4:sofa_yellow_right":"Sofa | yellow | right","kt_assets_a4:sofa_lime_right":"Sofa | lime | right","kt_assets_a4:sofa_pink_right":"Sofa | pink | right","kt_assets_a4:sofa_gray_right":"Sofa | gray | right","kt_assets_a4:sofa_light_gray_right":"Sofa | light_gray | right","kt_assets_a4:sofa_cyan_right":"Sofa | cyan | right","kt_assets_a4:sofa_purple_right":"Sofa | purple | right","kt_assets_a4:sofa_blue_right":"Sofa | blue | right","kt_assets_a4:sofa_brown_right":"Sofa | brown | right","kt_assets_a4:sofa_green_right":"Sofa | green | right","kt_assets_a4:sofa_red_right":"Sofa | red | right","kt_assets_a4:sofa_black_right":"Sofa | black | right","kt_assets_a4:sofa_white_left_corner":"Sofa | white | left_corner","kt_assets_a4:sofa_orange_left_corner":"Sofa | orange | left_corner","kt_assets_a4:sofa_magenta_left_corner":"Sofa | magenta | left_corner","kt_assets_a4:sofa_light_blue_left_corner":"Sofa | light_blue | left_corner","kt_assets_a4:sofa_yellow_left_corner":"Sofa | yellow | left_corner","kt_assets_a4:sofa_lime_left_corner":"Sofa | lime | left_corner","kt_assets_a4:sofa_pink_left_corner":"Sofa | pink | left_corner","kt_assets_a4:sofa_gray_left_corner":"Sofa | gray | left_corner","kt_assets_a4:sofa_light_gray_left_corner":"Sofa | light_gray | left_corner","kt_assets_a4:sofa_cyan_left_corner":"Sofa | cyan | left_corner","kt_assets_a4:sofa_purple_left_corner":"Sofa | purple | left_corner","kt_assets_a4:sofa_blue_left_corner":"Sofa | blue | left_corner","kt_assets_a4:sofa_brown_left_corner":"Sofa | brown | left_corner","kt_assets_a4:sofa_green_left_corner":"Sofa | green | left_corner","kt_assets_a4:sofa_red_left_corner":"Sofa | red | left_corner","kt_assets_a4:sofa_black_left_corner":"Sofa | black | left_corner","kt_assets_a4:sofa_white_right_corner":"Sofa | white | right_corner","kt_assets_a4:sofa_orange_right_corner":"Sofa | orange | right_corner","kt_assets_a4:sofa_magenta_right_corner":"Sofa | magenta | right_corner","kt_assets_a4:sofa_light_blue_right_corner":"Sofa | light_blue | right_corner","kt_assets_a4:sofa_yellow_right_corner":"Sofa | yellow | right_corner","kt_assets_a4:sofa_lime_right_corner":"Sofa | lime | right_corner","kt_assets_a4:sofa_pink_right_corner":"Sofa | pink | right_corner","kt_assets_a4:sofa_gray_right_corner":"Sofa | gray | right_corner","kt_assets_a4:sofa_light_gray_right_corner":"Sofa | light_gray | right_corner","kt_assets_a4:sofa_cyan_right_corner":"Sofa | cyan | right_corner","kt_assets_a4:sofa_purple_right_corner":"Sofa | purple | right_corner","kt_assets_a4:sofa_blue_right_corner":"Sofa | blue | right_corner","kt_assets_a4:sofa_brown_right_corner":"Sofa | brown | right_corner","kt_assets_a4:sofa_green_right_corner":"Sofa | green | right_corner","kt_assets_a4:sofa_red_right_corner":"Sofa | red | right_corner","kt_assets_a4:sofa_black_right_corner":"Sofa | black | right_corner","kt_assets_a4:emerald":"Emerald Cocktail | translucent candidate","kt_assets_a6:bar_cabinet_single":"bar_cabinet | single","kt_assets_a6:bar_cabinet_left":"bar_cabinet | left","kt_assets_a6:bar_cabinet_middle":"bar_cabinet | middle","kt_assets_a6:bar_cabinet_right":"bar_cabinet | right","kt_assets_a6:glass_bar_cabinet_single":"glass_bar_cabinet | single","kt_assets_a6:glass_bar_cabinet_left":"glass_bar_cabinet | left","kt_assets_a6:glass_bar_cabinet_middle":"glass_bar_cabinet | middle","kt_assets_a6:glass_bar_cabinet_right":"glass_bar_cabinet | right","kt_assets_a6:cellar_cabinet_single":"cellar_cabinet | single","kt_assets_a6:cellar_cabinet_left":"cellar_cabinet | left","kt_assets_a6:cellar_cabinet_middle":"cellar_cabinet | middle","kt_assets_a6:cellar_cabinet_right":"cellar_cabinet | right","kt_assets_a6:tilted_rack":"tilted_rack","kt_assets_a6:circular_rack":"circular_rack","kt_assets_a6:glassware_holder":"glassware_holder","kt_assets_a6:vodka_1":"Vodka | 1 bottles","kt_assets_a6:vodka_2":"Vodka | 2 bottles","kt_assets_a6:vodka_3":"Vodka | 3 bottles","kt_assets_a6:vodka_4":"Vodka | 4 bottles","kt_assets_a7:rum_1":"rum | 1 bottles","kt_assets_a7:rum_2":"rum | 2 bottles","kt_assets_a7:rum_3":"rum | 3 bottles","kt_assets_a7:rum_4":"rum | 4 bottles","kt_assets_a7:sherry_1":"sherry | 1 bottles","kt_assets_a7:sherry_2":"sherry | 2 bottles","kt_assets_a7:sherry_3":"sherry | 3 bottles","kt_assets_a7:sherry_4":"sherry | 4 bottles","kt_assets_a7:red_queen_1":"red_queen | 1 bottles","kt_assets_a7:red_queen_2":"red_queen | 2 bottles","kt_assets_a7:red_queen_3":"red_queen | 3 bottles","kt_assets_a7:red_queen_4":"red_queen | 4 bottles","kt_assets_a7:vinegar_1":"vinegar | 1 bottles","kt_assets_a7:vinegar_2":"vinegar | 2 bottles","kt_assets_a7:vinegar_3":"vinegar | 3 bottles","kt_assets_a7:vinegar_4":"vinegar | 4 bottles","kt_assets_a7:whiskey_1":"whiskey | 1 bottles","kt_assets_a7:whiskey_2":"whiskey | 2 bottles","kt_assets_a7:whiskey_3":"whiskey | 3 bottles","kt_assets_a7:whiskey_4":"whiskey | 4 bottles","kt_assets_a7:miners_star_1":"miners_star | 1 bottles","kt_assets_a7:miners_star_2":"miners_star | 2 bottles","kt_assets_a7:miners_star_3":"miners_star | 3 bottles","kt_assets_a7:miners_star_4":"miners_star | 4 bottles","kt_assets_a7:sauvignon_blanc_dry_white_1":"sauvignon_blanc_dry_white | 1 bottles","kt_assets_a7:sauvignon_blanc_dry_white_2":"sauvignon_blanc_dry_white | 2 bottles","kt_assets_a7:sauvignon_blanc_dry_white_3":"sauvignon_blanc_dry_white | 3 bottles","kt_assets_a7:sauvignon_blanc_dry_white_4":"sauvignon_blanc_dry_white | 4 bottles","kt_assets_a7:sweet_berry_wine_1":"sweet_berry_wine | 1 bottles","kt_assets_a7:sweet_berry_wine_2":"sweet_berry_wine | 2 bottles","kt_assets_a7:sweet_berry_wine_3":"sweet_berry_wine | 3 bottles","kt_assets_a7:sweet_berry_wine_4":"sweet_berry_wine | 4 bottles","kt_assets_a7:sakura_wine_1":"sakura_wine | 1 bottles","kt_assets_a7:sakura_wine_2":"sakura_wine | 2 bottles","kt_assets_a7:sakura_wine_3":"sakura_wine | 3 bottles","kt_assets_a7:sakura_wine_4":"sakura_wine | 4 bottles","kt_assets_a7:empty_glassware":"Empty cocktail glass","kt_assets_a7:screwdriver":"Screwdriver","kt_assets_a8:depth_charge":"depth_charge","kt_assets_a8:mojito":"mojito","kt_assets_a8:signature_cocktail":"signature_cocktail","kt_assets_a8:mystery_cocktail":"mystery_cocktail","kt_assets_a8:shaker":"shaker","kt_assets_a8:glowflower_brew_1":"glowflower_brew_1","kt_assets_a8:glowflower_brew_2":"glowflower_brew_2","kt_assets_a8:glowflower_brew_3":"glowflower_brew_3","kt_assets_a8:glowflower_brew_4":"glowflower_brew_4","kt_assets_a8:luminous_bride_1":"luminous_bride_1","kt_assets_a8:luminous_bride_2":"luminous_bride_2","kt_assets_a8:luminous_bride_3":"luminous_bride_3","kt_assets_a8:luminous_bride_4":"luminous_bride_4","kt_assets_a9:brandy_1":"brandy | 1 bottles","kt_assets_a9:brandy_2":"brandy | 2 bottles","kt_assets_a9:brandy_3":"brandy | 3 bottles","kt_assets_a9:carignan_1":"carignan | 1 bottles","kt_assets_a9:carignan_2":"carignan | 2 bottles","kt_assets_a9:carignan_3":"carignan | 3 bottles","kt_assets_a9:madame_shexiang_1":"madame_shexiang | 1 bottles","kt_assets_a9:madame_shexiang_2":"madame_shexiang | 2 bottles","kt_assets_a9:madame_shexiang_3":"madame_shexiang | 3 bottles","kt_assets_a9:madame_shexiang_4":"madame_shexiang | 4 bottles","kt_assets_a9:mother_snow_1":"mother_snow | 1 bottles","kt_assets_a9:mother_snow_2":"mother_snow | 2 bottles","kt_assets_a9:mother_snow_3":"mother_snow | 3 bottles","kt_assets_a9:mother_snow_4":"mother_snow | 4 bottles","kt_assets_a9:plum_wine_1":"plum_wine | 1 bottles","kt_assets_a9:plum_wine_2":"plum_wine | 2 bottles","kt_assets_a9:plum_wine_3":"plum_wine | 3 bottles","kt_assets_a9:plum_wine_4":"plum_wine | 4 bottles","kt_assets_a9:polaris_sweet_white_1":"polaris_sweet_white | 1 bottles","kt_assets_a9:polaris_sweet_white_2":"polaris_sweet_white | 2 bottles","kt_assets_a9:polaris_sweet_white_3":"polaris_sweet_white | 3 bottles","kt_assets_a9:polaris_sweet_white_4":"polaris_sweet_white | 4 bottles","kt_assets_a9:riesling_dry_white_1":"riesling_dry_white | 1 bottles","kt_assets_a9:riesling_dry_white_2":"riesling_dry_white | 2 bottles","kt_assets_a9:riesling_dry_white_3":"riesling_dry_white | 3 bottles","kt_assets_a9:riesling_dry_white_4":"riesling_dry_white | 4 bottles","kt_assets_a9:sunset_glow_1":"sunset_glow | 1 bottles","kt_assets_a9:sunset_glow_2":"sunset_glow | 2 bottles","kt_assets_a9:sunset_glow_3":"sunset_glow | 3 bottles","kt_assets_a9:watermelon_juice_1":"watermelon_juice | 1 bottles","kt_assets_a9:watermelon_juice_2":"watermelon_juice | 2 bottles","kt_assets_a9:watermelon_juice_3":"watermelon_juice | 3 bottles","kt_assets_a9:watermelon_juice_4":"watermelon_juice | 4 bottles","kt_assets_a9:white_lady":"White Lady","kt_assets_a10:allium_garden":"Allium Garden","kt_assets_a10:bloody_mary":"Bloody Mary","kt_assets_a10:brass_heart":"Brass Heart","kt_assets_a10:godfather":"Godfather","kt_assets_a10:grasshopper":"Grasshopper","kt_assets_a10:nether_special":"Nether Special","kt_assets_a10:sculk_special":"Sculk Special","kt_assets_a10:bar_counter_single":"Bar Counter | single","kt_assets_a10:bar_counter_left":"Bar Counter | left","kt_assets_a10:bar_counter_middle":"Bar Counter | middle","kt_assets_a10:bar_counter_right":"Bar Counter | right","kt_assets_a10:bar_counter_left_corner":"Bar Counter | left_corner","kt_assets_a10:bar_counter_right_corner":"Bar Counter | right_corner","kt_assets_a10:holder":"Bottle Holder","kt_assets_a12:table_single":"Tavern Table | single","kt_assets_a12:table_left":"Tavern Table | left","kt_assets_a12:table_middle":"Tavern Table | middle","kt_assets_a12:table_right":"Tavern Table | right","kt_assets_a12:table_left_rot":"Tavern Table | left_rot","kt_assets_a12:table_middle_rot":"Tavern Table | middle_rot","kt_assets_a12:table_right_rot":"Tavern Table | right_rot","kt_assets_a12:bell_pendant_lamp_bottom":"Bell Pendant Lamp | bottom","kt_assets_a12:bell_pendant_lamp_top":"Bell Pendant Lamp | top","kt_assets_a12:blue_pendant_lamp_bottom":"Blue Pendant Lamp | bottom","kt_assets_a12:blue_pendant_lamp_top":"Blue Pendant Lamp | top","kt_assets_a12:yellow_pendant_lamp_bottom":"Yellow Pendant Lamp | bottom","kt_assets_a12:yellow_pendant_lamp_top":"Yellow Pendant Lamp | top","kt_assets_a12:stepladder_bottom":"Stepladder | bottom","kt_assets_a12:stepladder_top":"Stepladder | top","kt_assets_a12:sandwich_board_bottom":"Plain Sandwich Board | bottom","kt_assets_a13:sakura_incense_closed":"Sakura Incense | closed","kt_assets_a13:sakura_incense_open":"Sakura Incense | open","kt_assets_a13:pine_incense_closed":"Pine Incense | closed","kt_assets_a13:pine_incense_open":"Pine Incense | open","kt_assets_a13:ginkgo_incense_closed":"Ginkgo Incense | closed","kt_assets_a13:ginkgo_incense_open":"Ginkgo Incense | open","kt_assets_a13:spore_incense_closed":"Spore Incense | closed","kt_assets_a13:spore_incense_open":"Spore Incense | open","kt_assets_a13:catnip_incense_closed":"Catnip Incense | closed","kt_assets_a13:catnip_incense_open":"Catnip Incense | open","kt_assets_a13:snow_incense_closed":"Snow Incense | closed","kt_assets_a13:snow_incense_open":"Snow Incense | open","kt_assets_a13:butterfly_incense_closed":"Butterfly Incense | closed","kt_assets_a13:butterfly_incense_open":"Butterfly Incense | open","kt_assets_a13:firefly_incense_closed":"Firefly Incense | closed","kt_assets_a13:firefly_incense_open":"Firefly Incense | open","kt_assets_a13:painting_mondrian":"Painting | mondrian","kt_assets_a13:painting_great_wave":"Painting | great_wave","kt_assets_a13:painting_mona_lisa":"Painting | mona_lisa","kt_assets_a13:painting_cr019":"Painting | cr019","kt_assets_a13:painting_david":"Painting | david","kt_assets_a14:painting_father":"Painting | father","kt_assets_a14:painting_girl_with_pearl_earring":"Painting | girl_with_pearl_earring","kt_assets_a14:painting_master_marisa":"Painting | master_marisa","kt_assets_a14:painting_son_of_man":"Painting | son_of_man","kt_assets_a14:painting_starry_night":"Painting | starry_night","kt_assets_a14:painting_van_gogh_self_portrait":"Painting | van_gogh_self_portrait","kt_assets_a14:painting_ysbb":"Painting | ysbb","kt_assets_a14:painting_tartaric_acid":"Painting | tartaric_acid","kt_assets_a14:painting_unknown":"Painting | unknown","kt_assets_a14:string_lights_blue":"Blue String Lights","kt_assets_a15:string_lights_red":"red String Lights","kt_assets_a15:string_lights_white":"white String Lights","kt_assets_a15:string_lights_black":"black String Lights","kt_assets_a16:string_lights_colorless":"colorless String Lights","kt_assets_a16:string_lights_brown":"brown String Lights","kt_assets_a16:string_lights_cyan":"cyan String Lights","kt_assets_a16:string_lights_gray":"gray String Lights","kt_assets_a17:string_lights_green":"String Lights Green","kt_assets_a17:string_lights_light_blue":"String Lights Light Blue","kt_assets_a17:string_lights_light_gray":"String Lights Light Gray","kt_assets_a17:string_lights_lime":"String Lights Lime","kt_assets_a17:string_lights_magenta":"String Lights Magenta","kt_assets_a17:string_lights_orange":"String Lights Orange","kt_assets_a17:string_lights_pink":"String Lights Pink","kt_assets_a17:string_lights_purple":"String Lights Purple","kt_assets_a17:string_lights_yellow":"String Lights Yellow","kt_assets_a17:molotov":"Molotov","kt_assets_a17:water_bottle":"Water Bottle","kt_assets_a17:potion_bottle":"Potion Bottle","kt_assets_a17:honey_bottle":"Honey Bottle","kt_assets_a17:xp_bottle":"Xp Bottle","kt_assets_a17:dragon_breath_bottle":"Dragon Breath Bottle","kt_assets_a17:sourceicon_allium_garden":"allium garden","kt_assets_a17:item_display_allium_sandwich_board":"Item Display Allium Sandwich Board","kt_assets_a17:item_display_azure_bluet_sandwich_board":"Item Display Azure Bluet Sandwich Board","kt_assets_a17:item_display_bar_cabinet":"Item Display Bar Cabinet","kt_assets_a17:item_display_bar_counter":"Item Display Bar Counter","kt_assets_a17:item_display_barrel":"Item Display Barrel","kt_assets_a17:item_display_base_sandwich_board":"Item Display Base Sandwich Board","kt_assets_a17:sourceicon_bell_pendant_lamp":"bell pendant lamp","kt_assets_a17:item_display_black_bar_stool":"Item Display Black Bar Stool","kt_assets_a17:item_display_black_sofa":"Item Display Black Sofa","kt_assets_a17:sourceicon_bloody_mary":"bloody mary","kt_assets_a17:item_display_blue_bar_stool":"Item Display Blue Bar Stool","kt_assets_a17:sourceicon_blue_pendant_lamp":"blue pendant lamp","kt_assets_a17:item_display_blue_sofa":"Item Display Blue Sofa","kt_assets_a17:sourceicon_brandy":"brandy","kt_assets_a17:sourceicon_brass_heart":"brass heart","kt_assets_a17:item_display_brown_bar_stool":"Item Display Brown Bar Stool","kt_assets_a17:item_display_brown_sofa":"Item Display Brown Sofa","kt_assets_a17:sourceicon_butterfly_incense":"butterfly incense","kt_assets_a17:sourceicon_carignan":"carignan","kt_assets_a17:sourceicon_catnip_incense":"catnip incense","kt_assets_a17:item_display_cellar_cabinet":"Item Display Cellar Cabinet","kt_assets_a17:sourceicon_chalkboard":"chalkboard","kt_assets_a17:sourceicon_champagne":"champagne","kt_assets_a17:item_display_circular_rack":"Item Display Circular Rack","kt_assets_a17:item_display_cornflower_sandwich_board":"Item Display Cornflower Sandwich Board","kt_assets_a17:sourceicon_cr019_painting":"cr019 painting","kt_assets_a17:item_display_cyan_bar_stool":"Item Display Cyan Bar Stool","kt_assets_a17:item_display_cyan_sofa":"Item Display Cyan Sofa","kt_assets_a17:sourceicon_david_painting":"david painting","kt_assets_a17:sourceicon_depth_charge":"depth charge","kt_assets_a17:sourceicon_emerald":"emerald","kt_assets_a17:sourceicon_empty_bottle":"empty bottle","kt_assets_a17:sourceicon_empty_glassware":"empty glassware","kt_assets_a17:sourceicon_father_painting":"father painting","kt_assets_a17:sourceicon_firefly_incense":"firefly incense","kt_assets_a17:sourceicon_ginkgo_incense":"ginkgo incense","kt_assets_a17:sourceicon_girl_with_pearl_earring_painting":"girl with pearl earring painting","kt_assets_a17:item_display_glass_bar_cabinet":"Item Display Glass Bar Cabinet","kt_assets_a17:item_display_glassware_holder":"Item Display Glassware Holder","kt_assets_a17:sourceicon_glow_berries_bucket":"glow berries bucket","kt_assets_a17:sourceicon_glowflower_brew":"glowflower brew","kt_assets_a17:sourceicon_godfather":"godfather","kt_assets_a17:sourceicon_gold_grape":"gold grape","kt_assets_a17:sourceicon_gold_grape_bucket":"gold grape bucket","kt_assets_a17:sourceicon_grape":"grape","kt_assets_a17:sourceicon_grape_bucket":"grape bucket","kt_assets_a17:sourceicon_grapevine":"grapevine","kt_assets_a17:item_display_grass_sandwich_board":"Item Display Grass Sandwich Board","kt_assets_a17:sourceicon_grasshopper":"grasshopper","kt_assets_a17:item_display_gray_bar_stool":"Item Display Gray Bar Stool","kt_assets_a17:item_display_gray_sofa":"Item Display Gray Sofa","kt_assets_a17:sourceicon_great_wave_painting":"great wave painting","kt_assets_a17:item_display_green_bar_stool":"Item Display Green Bar Stool","kt_assets_a17:sourceicon_green_grape":"green grape","kt_assets_a17:sourceicon_green_grape_bucket":"green grape bucket","kt_assets_a17:item_display_green_sofa":"Item Display Green Sofa","kt_assets_a17:sourceicon_holder":"holder","kt_assets_a17:sourceicon_honey_wine":"honey wine","kt_assets_a17:sourceicon_ice_grape":"ice grape","kt_assets_a17:sourceicon_ice_grape_bucket":"ice grape bucket","kt_assets_a17:sourceicon_ice_wine":"ice wine","kt_assets_a17:item_display_light_blue_bar_stool":"Item Display Light Blue Bar Stool","kt_assets_a17:item_display_light_blue_sofa":"Item Display Light Blue Sofa","kt_assets_a17:item_display_light_gray_bar_stool":"Item Display Light Gray Bar Stool","kt_assets_a17:item_display_light_gray_sofa":"Item Display Light Gray Sofa","kt_assets_a17:item_display_lime_bar_stool":"Item Display Lime Bar Stool","kt_assets_a17:item_display_lime_sofa":"Item Display Lime Sofa","kt_assets_a17:sourceicon_luminous_bride":"luminous bride","kt_assets_a17:sourceicon_madame_shexiang":"madame shexiang","kt_assets_a17:item_display_magenta_bar_stool":"Item Display Magenta Bar Stool","kt_assets_a17:item_display_magenta_sofa":"Item Display Magenta Sofa","kt_assets_a17:sourceicon_master_marisa_painting":"master marisa painting","kt_assets_a17:sourceicon_miners_star":"miners star","kt_assets_a17:sourceicon_mojito":"mojito","kt_assets_a17:sourceicon_molotov":"molotov","kt_assets_a17:sourceicon_mona_lisa_painting":"mona lisa painting","kt_assets_a17:sourceicon_mondrian_painting":"mondrian painting","kt_assets_a17:sourceicon_mother_snow":"mother snow","kt_assets_a17:sourceicon_mystery_cocktail":"mystery cocktail","kt_assets_a17:sourceicon_nether_special":"nether special","kt_assets_a17:item_display_orange_bar_stool":"Item Display Orange Bar Stool","kt_assets_a17:item_display_orange_sofa":"Item Display Orange Sofa","kt_assets_a17:item_display_orchid_sandwich_board":"Item Display Orchid Sandwich Board","kt_assets_a17:item_display_peony_sandwich_board":"Item Display Peony Sandwich Board","kt_assets_a17:sourceicon_pine_incense":"pine incense","kt_assets_a17:item_display_pink_bar_stool":"Item Display Pink Bar Stool","kt_assets_a17:item_display_pink_petals_sandwich_board":"Item Display Pink Petals Sandwich Board","kt_assets_a17:item_display_pink_sofa":"Item Display Pink Sofa","kt_assets_a17:item_display_pitcher_plant_sandwich_board":"Item Display Pitcher Plant Sandwich Board","kt_assets_a17:sourceicon_plum_wine":"plum wine","kt_assets_a17:sourceicon_polaris_sweet_white":"polaris sweet white","kt_assets_a17:item_display_poppy_sandwich_board":"Item Display Poppy Sandwich Board","kt_assets_a17:item_display_pressing_tub":"Item Display Pressing Tub","kt_assets_a17:item_display_purple_bar_stool":"Item Display Purple Bar Stool","kt_assets_a17:item_display_purple_sofa":"Item Display Purple Sofa","kt_assets_a17:item_display_red_bar_stool":"Item Display Red Bar Stool","kt_assets_a17:sourceicon_red_queen":"red queen","kt_assets_a17:item_display_red_sofa":"Item Display Red Sofa","kt_assets_a17:sourceicon_riesling_dry_white":"riesling dry white","kt_assets_a17:sourceicon_rum":"rum","kt_assets_a17:sourceicon_sakura_incense":"sakura incense","kt_assets_a17:sourceicon_sakura_wine":"sakura wine","kt_assets_a17:sourceicon_sauvignon_blanc_dry_white":"sauvignon blanc dry white","kt_assets_a17:sourceicon_screwdriver":"screwdriver","kt_assets_a17:sourceicon_sculk_special":"sculk special","kt_assets_a17:item_display_shaker":"Item Display Shaker","kt_assets_a17:item_display_shaker_3d":"Item Display Shaker 3D","kt_assets_a17:sourceicon_sherry":"sherry","kt_assets_a17:sourceicon_signature_cocktail":"signature cocktail","kt_assets_a17:sourceicon_snow_incense":"snow incense","kt_assets_a17:sourceicon_son_of_man_painting":"son of man painting","kt_assets_a17:sourceicon_spore_incense":"spore incense","kt_assets_a17:sourceicon_starry_night_painting":"starry night painting","kt_assets_a17:sourceicon_stepladder":"stepladder","kt_assets_a17:item_display_string_lights_black":"Item Display String Lights Black","kt_assets_a17:item_display_string_lights_blue":"Item Display String Lights Blue","kt_assets_a17:item_display_string_lights_brown":"Item Display String Lights Brown","kt_assets_a17:item_display_string_lights_colorless":"Item Display String Lights Colorless","kt_assets_a17:item_display_string_lights_cyan":"Item Display String Lights Cyan","kt_assets_a17:item_display_string_lights_gray":"Item Display String Lights Gray","kt_assets_a17:item_display_string_lights_green":"Item Display String Lights Green","kt_assets_a17:item_display_string_lights_light_blue":"Item Display String Lights Light Blue","kt_assets_a17:item_display_string_lights_light_gray":"Item Display String Lights Light Gray","kt_assets_a17:item_display_string_lights_lime":"Item Display String Lights Lime","kt_assets_a17:item_display_string_lights_magenta":"Item Display String Lights Magenta","kt_assets_a17:item_display_string_lights_orange":"Item Display String Lights Orange","kt_assets_a17:item_display_string_lights_pink":"Item Display String Lights Pink","kt_assets_a17:item_display_string_lights_purple":"Item Display String Lights Purple","kt_assets_a17:item_display_string_lights_red":"Item Display String Lights Red","kt_assets_a17:item_display_string_lights_white":"Item Display String Lights White","kt_assets_a17:item_display_string_lights_yellow":"Item Display String Lights Yellow","kt_assets_a17:item_display_sunflower_sandwich_board":"Item Display Sunflower Sandwich Board","kt_assets_a17:sourceicon_sunset_glow":"sunset glow","kt_assets_a17:sourceicon_sweet_berries_bucket":"sweet berries bucket","kt_assets_a17:sourceicon_sweet_berry_wine":"sweet berry wine","kt_assets_a17:item_display_table":"Item Display Table","kt_assets_a17:sourceicon_tap":"tap","kt_assets_a17:sourceicon_tartaric_acid_painting":"tartaric acid painting","kt_assets_a17:item_display_tilted_rack":"Item Display Tilted Rack","kt_assets_a17:item_display_torchflower_sandwich_board":"Item Display Torchflower Sandwich Board","kt_assets_a17:item_display_trellis":"Item Display Trellis","kt_assets_a17:item_display_tulip_sandwich_board":"Item Display Tulip Sandwich Board","kt_assets_a17:sourceicon_unknown_painting":"unknown painting","kt_assets_a17:sourceicon_van_gogh_self_portrait_painting":"van gogh self portrait painting","kt_assets_a17:sourceicon_vinegar":"vinegar","kt_assets_a17:sourceicon_vodka":"vodka","kt_assets_a17:sourceicon_watermelon_juice":"watermelon juice","kt_assets_a17:sourceicon_whiskey":"whiskey","kt_assets_a17:item_display_white_bar_stool":"Item Display White Bar Stool","kt_assets_a17:sourceicon_white_lady":"white lady","kt_assets_a17:item_display_white_sofa":"Item Display White Sofa","kt_assets_a17:sourceicon_wine":"wine","kt_assets_a17:item_display_wither_rose_sandwich_board":"Item Display Wither Rose Sandwich Board","kt_assets_a17:item_display_yellow_bar_stool":"Item Display Yellow Bar Stool","kt_assets_a17:sourceicon_yellow_pendant_lamp":"yellow pendant lamp","kt_assets_a17:item_display_yellow_sofa":"Item Display Yellow Sofa","kt_assets_a17:sourceicon_ysbb_painting":"ysbb painting","kaleidoscope_tavern:allium_garden":"Allium Garden","kaleidoscope_tavern:bar_cabinet":"Bar Cabinet","kaleidoscope_tavern:bar_counter":"Bar Counter","kaleidoscope_tavern:barrel":"Barrel","kaleidoscope_tavern:bell_pendant_lamp":"Bell Pendant Lamp","kaleidoscope_tavern:black_bar_stool":"Black Bar Stool","kaleidoscope_tavern:black_sofa":"Black Sofa","kaleidoscope_tavern:bloody_mary":"Bloody Mary","kaleidoscope_tavern:blue_bar_stool":"Blue Bar Stool","kaleidoscope_tavern:blue_pendant_lamp":"Blue Pendant Lamp","kaleidoscope_tavern:blue_sofa":"Blue Sofa","kaleidoscope_tavern:brandy":"Brandy","kaleidoscope_tavern:brandy_q1":"Brandy","kaleidoscope_tavern:brandy_q2":"Brandy","kaleidoscope_tavern:brandy_q3":"Brandy","kaleidoscope_tavern:brandy_q4":"Brandy","kaleidoscope_tavern:brandy_q5":"Brandy","kaleidoscope_tavern:brandy_q6":"Brandy","kaleidoscope_tavern:brass_heart":"Brass Heart","kaleidoscope_tavern:brown_bar_stool":"Brown Bar Stool","kaleidoscope_tavern:brown_sofa":"Brown Sofa","kaleidoscope_tavern:butterfly_incense":"Butterfly Incense","kaleidoscope_tavern:carignan":"Carignan","kaleidoscope_tavern:carignan_q1":"Carignan","kaleidoscope_tavern:carignan_q2":"Carignan","kaleidoscope_tavern:carignan_q3":"Carignan","kaleidoscope_tavern:carignan_q4":"Carignan","kaleidoscope_tavern:carignan_q5":"Carignan","kaleidoscope_tavern:carignan_q6":"Carignan","kaleidoscope_tavern:catnip_incense":"Catnip Incense","kaleidoscope_tavern:cellar_cabinet":"Cellar Cabinet","kaleidoscope_tavern:chalkboard":"Chalkboard","kaleidoscope_tavern:champagne":"Champagne","kaleidoscope_tavern:champagne_q1":"Champagne","kaleidoscope_tavern:champagne_q2":"Champagne","kaleidoscope_tavern:champagne_q3":"Champagne","kaleidoscope_tavern:champagne_q4":"Champagne","kaleidoscope_tavern:champagne_q5":"Champagne","kaleidoscope_tavern:champagne_q6":"Champagne","kaleidoscope_tavern:circular_rack":"Circular Rack","kaleidoscope_tavern:cyan_bar_stool":"Cyan Bar Stool","kaleidoscope_tavern:cyan_sofa":"Cyan Sofa","kaleidoscope_tavern:depth_charge":"Depth Charge","kaleidoscope_tavern:dragon_breath_bottle":"Dragon Breath Bottle","kaleidoscope_tavern:emerald":"Emerald","kaleidoscope_tavern:empty_bottle":"Empty Bottle","kaleidoscope_tavern:empty_glassware":"Empty Glassware","kaleidoscope_tavern:firefly_incense":"Firefly Incense","kaleidoscope_tavern:ginkgo_incense":"Ginkgo Incense","kaleidoscope_tavern:glass_bar_cabinet":"Glass Bar Cabinet","kaleidoscope_tavern:glassware_holder":"Glassware Holder","kaleidoscope_tavern:glow_berries_bucket":"Glow Berries Bucket","kaleidoscope_tavern:glow_berries_juice":"Glow Berries Juice","kaleidoscope_tavern:glowflower_brew":"Glowflower Brew","kaleidoscope_tavern:glowflower_brew_q1":"Glowflower Brew","kaleidoscope_tavern:glowflower_brew_q2":"Glowflower Brew","kaleidoscope_tavern:glowflower_brew_q3":"Glowflower Brew","kaleidoscope_tavern:glowflower_brew_q4":"Glowflower Brew","kaleidoscope_tavern:glowflower_brew_q5":"Glowflower Brew","kaleidoscope_tavern:glowflower_brew_q6":"Glowflower Brew","kaleidoscope_tavern:godfather":"Godfather","kaleidoscope_tavern:gold_grape":"Gold Grape","kaleidoscope_tavern:gold_grape_bucket":"Gold Grape Bucket","kaleidoscope_tavern:gold_grape_crop":"Gold Grape","kaleidoscope_tavern:gold_grape_juice":"Gold Grape Juice","kaleidoscope_tavern:gold_grapevine_trellis":"Gold Grapevine Trellis","kaleidoscope_tavern:grape":"Grape","kaleidoscope_tavern:grape_bucket":"Grape Bucket","kaleidoscope_tavern:grape_crop":"Grape","kaleidoscope_tavern:grape_juice":"Grape Juice","kaleidoscope_tavern:grapevine":"Grapevine","kaleidoscope_tavern:grapevine_trellis":"Grapevine Trellis","kaleidoscope_tavern:grasshopper":"Grasshopper","kaleidoscope_tavern:gray_bar_stool":"Gray Bar Stool","kaleidoscope_tavern:gray_sofa":"Gray Sofa","kaleidoscope_tavern:green_bar_stool":"Green Bar Stool","kaleidoscope_tavern:green_grape":"Green Grape","kaleidoscope_tavern:green_grape_bucket":"Green Grape Bucket","kaleidoscope_tavern:green_grape_juice":"Green Grape Juice","kaleidoscope_tavern:green_sofa":"Green Sofa","kaleidoscope_tavern:guidebook":"Legacy Tavern Guide","kaleidoscope_tavern:holder":"Bottle Holder","kaleidoscope_tavern:honey_bottle":"Honey Bottle","kaleidoscope_tavern:honey_wine":"Honey Wine","kaleidoscope_tavern:honey_wine_q1":"Honey Wine","kaleidoscope_tavern:honey_wine_q2":"Honey Wine","kaleidoscope_tavern:honey_wine_q3":"Honey Wine","kaleidoscope_tavern:honey_wine_q4":"Honey Wine","kaleidoscope_tavern:honey_wine_q5":"Honey Wine","kaleidoscope_tavern:honey_wine_q6":"Honey Wine","kaleidoscope_tavern:ice_grape":"Ice Grape","kaleidoscope_tavern:ice_grape_bucket":"Ice Grape Bucket","kaleidoscope_tavern:ice_grape_crop":"Ice Grape","kaleidoscope_tavern:ice_grape_juice":"Ice Grape Juice","kaleidoscope_tavern:ice_grapevine_trellis":"Ice Grapevine Trellis","kaleidoscope_tavern:ice_wine":"Ice Wine","kaleidoscope_tavern:ice_wine_q1":"Ice Wine","kaleidoscope_tavern:ice_wine_q2":"Ice Wine","kaleidoscope_tavern:ice_wine_q3":"Ice Wine","kaleidoscope_tavern:ice_wine_q4":"Ice Wine","kaleidoscope_tavern:ice_wine_q5":"Ice Wine","kaleidoscope_tavern:ice_wine_q6":"Ice Wine","kaleidoscope_tavern:light_blue_bar_stool":"Light Blue Bar Stool","kaleidoscope_tavern:light_blue_sofa":"Light Blue Sofa","kaleidoscope_tavern:light_gray_bar_stool":"Light Gray Bar Stool","kaleidoscope_tavern:light_gray_sofa":"Light Gray Sofa","kaleidoscope_tavern:lime_bar_stool":"Lime Bar Stool","kaleidoscope_tavern:lime_sofa":"Lime Sofa","kaleidoscope_tavern:luminous_bride":"Luminous Bride","kaleidoscope_tavern:luminous_bride_q1":"Luminous Bride","kaleidoscope_tavern:luminous_bride_q2":"Luminous Bride","kaleidoscope_tavern:luminous_bride_q3":"Luminous Bride","kaleidoscope_tavern:luminous_bride_q4":"Luminous Bride","kaleidoscope_tavern:luminous_bride_q5":"Luminous Bride","kaleidoscope_tavern:luminous_bride_q6":"Luminous Bride","kaleidoscope_tavern:madame_shexiang":"Madame Shexiang","kaleidoscope_tavern:madame_shexiang_q1":"Madame Shexiang","kaleidoscope_tavern:madame_shexiang_q2":"Madame Shexiang","kaleidoscope_tavern:madame_shexiang_q3":"Madame Shexiang","kaleidoscope_tavern:madame_shexiang_q4":"Madame Shexiang","kaleidoscope_tavern:madame_shexiang_q5":"Madame Shexiang","kaleidoscope_tavern:madame_shexiang_q6":"Madame Shexiang","kaleidoscope_tavern:magenta_bar_stool":"Magenta Bar Stool","kaleidoscope_tavern:magenta_sofa":"Magenta Sofa","kaleidoscope_tavern:miners_star":"Miner's Star","kaleidoscope_tavern:miners_star_q1":"Miner's Star","kaleidoscope_tavern:miners_star_q2":"Miner's Star","kaleidoscope_tavern:miners_star_q3":"Miner's Star","kaleidoscope_tavern:miners_star_q4":"Miner's Star","kaleidoscope_tavern:miners_star_q5":"Miner's Star","kaleidoscope_tavern:miners_star_q6":"Miner's Star","kaleidoscope_tavern:mojito":"Mojito","kaleidoscope_tavern:molotov":"Molotov Cocktail","kaleidoscope_tavern:mother_snow":"Mother Snow","kaleidoscope_tavern:mother_snow_q1":"Mother Snow","kaleidoscope_tavern:mother_snow_q2":"Mother Snow","kaleidoscope_tavern:mother_snow_q3":"Mother Snow","kaleidoscope_tavern:mother_snow_q4":"Mother Snow","kaleidoscope_tavern:mother_snow_q5":"Mother Snow","kaleidoscope_tavern:mother_snow_q6":"Mother Snow","kaleidoscope_tavern:mystery_cocktail":"Mystery Cocktail","kaleidoscope_tavern:nether_special":"Nether Special","kaleidoscope_tavern:orange_bar_stool":"Orange Bar Stool","kaleidoscope_tavern:orange_sofa":"Orange Sofa","kaleidoscope_tavern:painting":"Painting","kaleidoscope_tavern:pine_incense":"Pine Incense","kaleidoscope_tavern:pink_bar_stool":"Pink Bar Stool","kaleidoscope_tavern:pink_sofa":"Pink Sofa","kaleidoscope_tavern:plum_wine":"Plum Wine","kaleidoscope_tavern:plum_wine_q1":"Plum Wine","kaleidoscope_tavern:plum_wine_q2":"Plum Wine","kaleidoscope_tavern:plum_wine_q3":"Plum Wine","kaleidoscope_tavern:plum_wine_q4":"Plum Wine","kaleidoscope_tavern:plum_wine_q5":"Plum Wine","kaleidoscope_tavern:plum_wine_q6":"Plum Wine","kaleidoscope_tavern:polaris_sweet_white":"Polaris Sweet White","kaleidoscope_tavern:polaris_sweet_white_q1":"Polaris Sweet White","kaleidoscope_tavern:polaris_sweet_white_q2":"Polaris Sweet White","kaleidoscope_tavern:polaris_sweet_white_q3":"Polaris Sweet White","kaleidoscope_tavern:polaris_sweet_white_q4":"Polaris Sweet White","kaleidoscope_tavern:polaris_sweet_white_q5":"Polaris Sweet White","kaleidoscope_tavern:polaris_sweet_white_q6":"Polaris Sweet White","kaleidoscope_tavern:potion_bottle":"Potion Bottle","kaleidoscope_tavern:pressing_tub":"Pressing Tub","kaleidoscope_tavern:purple_bar_stool":"Purple Bar Stool","kaleidoscope_tavern:purple_sofa":"Purple Sofa","kaleidoscope_tavern:recipe_book":"Legacy Tavern Recipe Book","kaleidoscope_tavern:red_bar_stool":"Red Bar Stool","kaleidoscope_tavern:red_queen":"Red Queen","kaleidoscope_tavern:red_queen_q1":"Red Queen","kaleidoscope_tavern:red_queen_q2":"Red Queen","kaleidoscope_tavern:red_queen_q3":"Red Queen","kaleidoscope_tavern:red_queen_q4":"Red Queen","kaleidoscope_tavern:red_queen_q5":"Red Queen","kaleidoscope_tavern:red_queen_q6":"Red Queen","kaleidoscope_tavern:red_sofa":"Red Sofa","kaleidoscope_tavern:riesling_dry_white":"Riesling Dry White","kaleidoscope_tavern:riesling_dry_white_q1":"Riesling Dry White","kaleidoscope_tavern:riesling_dry_white_q2":"Riesling Dry White","kaleidoscope_tavern:riesling_dry_white_q3":"Riesling Dry White","kaleidoscope_tavern:riesling_dry_white_q4":"Riesling Dry White","kaleidoscope_tavern:riesling_dry_white_q5":"Riesling Dry White","kaleidoscope_tavern:riesling_dry_white_q6":"Riesling Dry White","kaleidoscope_tavern:rum":"Rum","kaleidoscope_tavern:rum_q1":"Rum","kaleidoscope_tavern:rum_q2":"Rum","kaleidoscope_tavern:rum_q3":"Rum","kaleidoscope_tavern:rum_q4":"Rum","kaleidoscope_tavern:rum_q5":"Rum","kaleidoscope_tavern:rum_q6":"Rum","kaleidoscope_tavern:sakura_incense":"Sakura Incense","kaleidoscope_tavern:sakura_wine":"Sakura Wine","kaleidoscope_tavern:sakura_wine_q1":"Sakura Wine","kaleidoscope_tavern:sakura_wine_q2":"Sakura Wine","kaleidoscope_tavern:sakura_wine_q3":"Sakura Wine","kaleidoscope_tavern:sakura_wine_q4":"Sakura Wine","kaleidoscope_tavern:sakura_wine_q5":"Sakura Wine","kaleidoscope_tavern:sakura_wine_q6":"Sakura Wine","kaleidoscope_tavern:sandwich_board":"Sandwich Board","kaleidoscope_tavern:sauvignon_blanc_dry_white":"Sauvignon Blanc Dry White","kaleidoscope_tavern:sauvignon_blanc_dry_white_q1":"Sauvignon Blanc Dry White","kaleidoscope_tavern:sauvignon_blanc_dry_white_q2":"Sauvignon Blanc Dry White","kaleidoscope_tavern:sauvignon_blanc_dry_white_q3":"Sauvignon Blanc Dry White","kaleidoscope_tavern:sauvignon_blanc_dry_white_q4":"Sauvignon Blanc Dry White","kaleidoscope_tavern:sauvignon_blanc_dry_white_q5":"Sauvignon Blanc Dry White","kaleidoscope_tavern:sauvignon_blanc_dry_white_q6":"Sauvignon Blanc Dry White","kaleidoscope_tavern:screwdriver":"Screwdriver","kaleidoscope_tavern:sculk_special":"Sculk Special","kaleidoscope_tavern:shaker":"Shaker","kaleidoscope_tavern:sherry":"Sherry","kaleidoscope_tavern:sherry_q1":"Sherry","kaleidoscope_tavern:sherry_q2":"Sherry","kaleidoscope_tavern:sherry_q3":"Sherry","kaleidoscope_tavern:sherry_q4":"Sherry","kaleidoscope_tavern:sherry_q5":"Sherry","kaleidoscope_tavern:sherry_q6":"Sherry","kaleidoscope_tavern:signature_cocktail":"Signature Cocktail","kaleidoscope_tavern:snow_incense":"Snow Incense","kaleidoscope_tavern:spore_incense":"Spore Incense","kaleidoscope_tavern:stepladder":"Stepladder","kaleidoscope_tavern:string_lights_black":"String Lights (Black)","kaleidoscope_tavern:string_lights_blue":"String Lights (Blue)","kaleidoscope_tavern:string_lights_brown":"String Lights (Brown)","kaleidoscope_tavern:string_lights_colorless":"String Lights (Colorless)","kaleidoscope_tavern:string_lights_cyan":"String Lights (Cyan)","kaleidoscope_tavern:string_lights_gray":"String Lights (Gray)","kaleidoscope_tavern:string_lights_green":"String Lights (Green)","kaleidoscope_tavern:string_lights_light_blue":"String Lights (Light Blue)","kaleidoscope_tavern:string_lights_light_gray":"String Lights (Light Gray)","kaleidoscope_tavern:string_lights_lime":"String Lights (Lime)","kaleidoscope_tavern:string_lights_magenta":"String Lights (Magenta)","kaleidoscope_tavern:string_lights_orange":"String Lights (Orange)","kaleidoscope_tavern:string_lights_pink":"String Lights (Pink)","kaleidoscope_tavern:string_lights_purple":"String Lights (Purple)","kaleidoscope_tavern:string_lights_red":"String Lights (Red)","kaleidoscope_tavern:string_lights_white":"String Lights (White)","kaleidoscope_tavern:string_lights_yellow":"String Lights (Yellow)","kaleidoscope_tavern:sunset_glow":"Sunset Glow","kaleidoscope_tavern:sunset_glow_q1":"Sunset Glow","kaleidoscope_tavern:sunset_glow_q2":"Sunset Glow","kaleidoscope_tavern:sunset_glow_q3":"Sunset Glow","kaleidoscope_tavern:sunset_glow_q4":"Sunset Glow","kaleidoscope_tavern:sunset_glow_q5":"Sunset Glow","kaleidoscope_tavern:sunset_glow_q6":"Sunset Glow","kaleidoscope_tavern:sweet_berries_bucket":"Sweet Berries Bucket","kaleidoscope_tavern:sweet_berries_juice":"Sweet Berries Juice","kaleidoscope_tavern:sweet_berry_wine":"Sweet Berry Wine","kaleidoscope_tavern:sweet_berry_wine_q1":"Sweet Berry Wine","kaleidoscope_tavern:sweet_berry_wine_q2":"Sweet Berry Wine","kaleidoscope_tavern:sweet_berry_wine_q3":"Sweet Berry Wine","kaleidoscope_tavern:sweet_berry_wine_q4":"Sweet Berry Wine","kaleidoscope_tavern:sweet_berry_wine_q5":"Sweet Berry Wine","kaleidoscope_tavern:sweet_berry_wine_q6":"Sweet Berry Wine","kaleidoscope_tavern:table":"Table","kaleidoscope_tavern:tap":"Tap","kaleidoscope_tavern:tilted_rack":"Tilted Rack","kaleidoscope_tavern:trellis":"Trellis","kaleidoscope_tavern:vinegar":"Vinegar","kaleidoscope_tavern:vinegar_q1":"Vinegar","kaleidoscope_tavern:vinegar_q2":"Vinegar","kaleidoscope_tavern:vinegar_q3":"Vinegar","kaleidoscope_tavern:vinegar_q4":"Vinegar","kaleidoscope_tavern:vinegar_q5":"Vinegar","kaleidoscope_tavern:vinegar_q6":"Vinegar","kaleidoscope_tavern:vodka":"Vodka","kaleidoscope_tavern:vodka_q1":"Vodka","kaleidoscope_tavern:vodka_q2":"Vodka","kaleidoscope_tavern:vodka_q3":"Vodka","kaleidoscope_tavern:vodka_q4":"Vodka","kaleidoscope_tavern:vodka_q5":"Vodka","kaleidoscope_tavern:vodka_q6":"Vodka","kaleidoscope_tavern:water_bottle":"Water Bottle","kaleidoscope_tavern:watermelon_juice":"Watermelon Juice","kaleidoscope_tavern:whiskey":"Whiskey","kaleidoscope_tavern:whiskey_q1":"Whiskey","kaleidoscope_tavern:whiskey_q2":"Whiskey","kaleidoscope_tavern:whiskey_q3":"Whiskey","kaleidoscope_tavern:whiskey_q4":"Whiskey","kaleidoscope_tavern:whiskey_q5":"Whiskey","kaleidoscope_tavern:whiskey_q6":"Whiskey","kaleidoscope_tavern:white_bar_stool":"White Bar Stool","kaleidoscope_tavern:white_lady":"White Lady","kaleidoscope_tavern:white_sofa":"White Sofa","kaleidoscope_tavern:wild_grapevine":"Wild Grapevine","kaleidoscope_tavern:wild_grapevine_plant":"Wild Grapevine","kaleidoscope_tavern:wine":"Wine","kaleidoscope_tavern:wine_q1":"Wine","kaleidoscope_tavern:wine_q2":"Wine","kaleidoscope_tavern:wine_q3":"Wine","kaleidoscope_tavern:wine_q4":"Wine","kaleidoscope_tavern:wine_q5":"Wine","kaleidoscope_tavern:wine_q6":"Wine","kaleidoscope_tavern:xp_bottle":"Bottle o' Enchanting","kaleidoscope_tavern:yellow_bar_stool":"Yellow Bar Stool","kaleidoscope_tavern:yellow_pendant_lamp":"Yellow Pendant Lamp","kaleidoscope_tavern:yellow_sofa":"Yellow Sofa","kaleidoscope_tavern:bottle_brandy":"Brandy bottles","kaleidoscope_tavern:bottle_carignan":"Carignan bottles","kaleidoscope_tavern:bottle_champagne":"Champagne bottles","kaleidoscope_tavern:bottle_glowflower_brew":"Glowflower Brew bottles","kaleidoscope_tavern:bottle_honey_wine":"Honey Wine bottles","kaleidoscope_tavern:bottle_ice_wine":"Ice Wine bottles","kaleidoscope_tavern:bottle_luminous_bride":"Luminous Bride bottles","kaleidoscope_tavern:bottle_madame_shexiang":"Madame Shexiang bottles","kaleidoscope_tavern:bottle_miners_star":"Miners Star bottles","kaleidoscope_tavern:bottle_mother_snow":"Mother Snow bottles","kaleidoscope_tavern:bottle_plum_wine":"Plum Wine bottles","kaleidoscope_tavern:bottle_polaris_sweet_white":"Polaris Sweet White bottles","kaleidoscope_tavern:bottle_red_queen":"Red Queen bottles","kaleidoscope_tavern:bottle_riesling_dry_white":"Riesling Dry White bottles","kaleidoscope_tavern:bottle_rum":"Rum bottles","kaleidoscope_tavern:bottle_sakura_wine":"Sakura Wine bottles","kaleidoscope_tavern:bottle_sauvignon_blanc_dry_white":"Sauvignon Blanc Dry White bottles","kaleidoscope_tavern:bottle_sherry":"Sherry bottles","kaleidoscope_tavern:bottle_sunset_glow":"Sunset Glow bottles","kaleidoscope_tavern:bottle_sweet_berry_wine":"Sweet Berry Wine bottles","kaleidoscope_tavern:bottle_vinegar":"Vinegar bottles","kaleidoscope_tavern:bottle_vodka":"Vodka bottles","kaleidoscope_tavern:bottle_whiskey":"Whiskey bottles","kaleidoscope_tavern:bottle_wine":"Wine bottles","kaleidoscope_tavern:bottle_watermelon_juice":"Watermelon Juice bottles","kaleidoscope_tavern:shaker_station":"Shaker","kaleidoscope_tavern:cup_empty_glassware":"Empty Glassware","kaleidoscope_tavern:cup_white_lady":"White Lady","kaleidoscope_tavern:cup_emerald":"Emerald","kaleidoscope_tavern:cup_brass_heart":"Brass Heart","kaleidoscope_tavern:cup_godfather":"Godfather","kaleidoscope_tavern:cup_grasshopper":"Grasshopper","kaleidoscope_tavern:cup_screwdriver":"Screwdriver","kaleidoscope_tavern:cup_mojito":"Mojito","kaleidoscope_tavern:cup_allium_garden":"Allium Garden","kaleidoscope_tavern:cup_depth_charge":"Depth Charge","kaleidoscope_tavern:cup_nether_special":"Nether Special","kaleidoscope_tavern:cup_bloody_mary":"Bloody Mary","kaleidoscope_tavern:cup_sculk_special":"Sculk Special","kaleidoscope_tavern:cup_signature_cocktail":"Signature Cocktail","kaleidoscope_tavern:cup_mystery_cocktail":"Mystery Cocktail","kaleidoscope_tavern:stool_white":"White Bar Stool","kaleidoscope_tavern:stool_light_gray":"Light Gray Bar Stool","kaleidoscope_tavern:stool_gray":"Gray Bar Stool","kaleidoscope_tavern:stool_black":"Black Bar Stool","kaleidoscope_tavern:stool_brown":"Brown Bar Stool","kaleidoscope_tavern:stool_red":"Red Bar Stool","kaleidoscope_tavern:stool_orange":"Orange Bar Stool","kaleidoscope_tavern:stool_yellow":"Yellow Bar Stool","kaleidoscope_tavern:stool_lime":"Lime Bar Stool","kaleidoscope_tavern:stool_green":"Green Bar Stool","kaleidoscope_tavern:stool_cyan":"Cyan Bar Stool","kaleidoscope_tavern:stool_light_blue":"Light Blue Bar Stool","kaleidoscope_tavern:stool_blue":"Blue Bar Stool","kaleidoscope_tavern:stool_purple":"Purple Bar Stool","kaleidoscope_tavern:stool_magenta":"Magenta Bar Stool","kaleidoscope_tavern:stool_pink":"Pink Bar Stool","kaleidoscope_tavern:light_colorless":"Colorless String Lights","kaleidoscope_tavern:light_white":"White String Lights","kaleidoscope_tavern:light_light_gray":"Light Gray String Lights","kaleidoscope_tavern:light_gray":"Gray String Lights","kaleidoscope_tavern:light_black":"Black String Lights","kaleidoscope_tavern:light_brown":"Brown String Lights","kaleidoscope_tavern:light_red":"Red String Lights","kaleidoscope_tavern:light_orange":"Orange String Lights","kaleidoscope_tavern:light_yellow":"Yellow String Lights","kaleidoscope_tavern:light_lime":"Lime String Lights","kaleidoscope_tavern:light_green":"Green String Lights","kaleidoscope_tavern:light_cyan":"Cyan String Lights","kaleidoscope_tavern:light_light_blue":"Light Blue String Lights","kaleidoscope_tavern:light_blue":"Blue String Lights","kaleidoscope_tavern:light_purple":"Purple String Lights","kaleidoscope_tavern:light_magenta":"Magenta String Lights","kaleidoscope_tavern:light_pink":"Pink String Lights","kaleidoscope_tavern:ysbb_painting":"Painting · YSBB","kaleidoscope_tavern:tartaric_acid_painting":"Painting · Tartaric Acid","kaleidoscope_tavern:cr019_painting":"Painting · CR019","kaleidoscope_tavern:unknown_painting":"Painting · Unknown","kaleidoscope_tavern:master_marisa_painting":"Painting · Master Marisa","kaleidoscope_tavern:son_of_man_painting":"Painting · Son of Man","kaleidoscope_tavern:david_painting":"Painting · David","kaleidoscope_tavern:girl_with_pearl_earring_painting":"Painting · Girl with a Pearl Earring","kaleidoscope_tavern:starry_night_painting":"Painting · Starry Night","kaleidoscope_tavern:van_gogh_self_portrait_painting":"Painting · Van Gogh Self-Portrait","kaleidoscope_tavern:father_painting":"Painting · Father","kaleidoscope_tavern:great_wave_painting":"Painting · The Great Wave off Kanagawa","kaleidoscope_tavern:mona_lisa_painting":"Painting · Mona Lisa","kaleidoscope_tavern:mondrian_painting":"Painting · Mondrian","kaleidoscope_tavern:base_sandwich_board":"Plain Sandwich Board","kaleidoscope_tavern:grass_sandwich_board":"Grass Sandwich Board","kaleidoscope_tavern:allium_sandwich_board":"Allium Sandwich Board","kaleidoscope_tavern:azure_bluet_sandwich_board":"Azure Bluet Sandwich Board","kaleidoscope_tavern:cornflower_sandwich_board":"Cornflower Sandwich Board","kaleidoscope_tavern:orchid_sandwich_board":"Orchid Sandwich Board","kaleidoscope_tavern:peony_sandwich_board":"Peony Sandwich Board","kaleidoscope_tavern:pink_petals_sandwich_board":"Pink Petals Sandwich Board","kaleidoscope_tavern:pitcher_plant_sandwich_board":"Pitcher Plant Sandwich Board","kaleidoscope_tavern:poppy_sandwich_board":"Poppy Sandwich Board","kaleidoscope_tavern:sunflower_sandwich_board":"Sunflower Sandwich Board","kaleidoscope_tavern:torchflower_sandwich_board":"Torchflower Sandwich Board","kaleidoscope_tavern:tulip_sandwich_board":"Tulip Sandwich Board","kaleidoscope_tavern:wither_rose_sandwich_board":"Wither Rose Sandwich Board"}};
const GUIDE_ITEM_ICONS={"kaleidoscope_tavern:allium_garden":"textures/kaleidoscope_tavern_jar/item/allium_garden","kaleidoscope_tavern:allium_sandwich_board":"textures/kt_derived/a17/item_display_allium_sandwich_board","kaleidoscope_tavern:azure_bluet_sandwich_board":"textures/kt_derived/a17/item_display_azure_bluet_sandwich_board","kaleidoscope_tavern:barrel":"textures/kaleidoscope_tavern_jar/item/barrel","kaleidoscope_tavern:base_sandwich_board":"textures/kt_derived/a17/item_display_base_sandwich_board","kaleidoscope_tavern:black_bar_stool":"textures/kt_runtime/icons/black_bar_stool","kaleidoscope_tavern:bloody_mary":"textures/kaleidoscope_tavern_jar/item/bloody_mary","kaleidoscope_tavern:blue_bar_stool":"textures/kt_runtime/icons/blue_bar_stool","kaleidoscope_tavern:brandy_q1":"textures/kaleidoscope_tavern_jar/item/brandy","kaleidoscope_tavern:brandy_q2":"textures/kaleidoscope_tavern_jar/item/brandy","kaleidoscope_tavern:brandy_q3":"textures/kaleidoscope_tavern_jar/item/brandy","kaleidoscope_tavern:brandy_q4":"textures/kaleidoscope_tavern_jar/item/brandy","kaleidoscope_tavern:brandy_q5":"textures/kaleidoscope_tavern_jar/item/brandy","kaleidoscope_tavern:brandy_q6":"textures/kaleidoscope_tavern_jar/item/brandy","kaleidoscope_tavern:brass_heart":"textures/kaleidoscope_tavern_jar/item/brass_heart","kaleidoscope_tavern:brown_bar_stool":"textures/kt_runtime/icons/brown_bar_stool","kaleidoscope_tavern:butterfly_incense":"textures/kaleidoscope_tavern_jar/item/butterfly_incense","kaleidoscope_tavern:carignan_q1":"textures/kaleidoscope_tavern_jar/item/carignan","kaleidoscope_tavern:carignan_q2":"textures/kaleidoscope_tavern_jar/item/carignan","kaleidoscope_tavern:carignan_q3":"textures/kaleidoscope_tavern_jar/item/carignan","kaleidoscope_tavern:carignan_q4":"textures/kaleidoscope_tavern_jar/item/carignan","kaleidoscope_tavern:carignan_q5":"textures/kaleidoscope_tavern_jar/item/carignan","kaleidoscope_tavern:carignan_q6":"textures/kaleidoscope_tavern_jar/item/carignan","kaleidoscope_tavern:catnip_incense":"textures/kaleidoscope_tavern_jar/item/catnip_incense","kaleidoscope_tavern:chalkboard":"textures/kaleidoscope_tavern_jar/item/chalkboard","kaleidoscope_tavern:champagne_q1":"textures/kaleidoscope_tavern_jar/item/champagne","kaleidoscope_tavern:champagne_q2":"textures/kaleidoscope_tavern_jar/item/champagne","kaleidoscope_tavern:champagne_q3":"textures/kaleidoscope_tavern_jar/item/champagne","kaleidoscope_tavern:champagne_q4":"textures/kaleidoscope_tavern_jar/item/champagne","kaleidoscope_tavern:champagne_q5":"textures/kaleidoscope_tavern_jar/item/champagne","kaleidoscope_tavern:champagne_q6":"textures/kaleidoscope_tavern_jar/item/champagne","kaleidoscope_tavern:cornflower_sandwich_board":"textures/kt_derived/a17/item_display_cornflower_sandwich_board","kaleidoscope_tavern:cyan_bar_stool":"textures/kt_runtime/icons/cyan_bar_stool","kaleidoscope_tavern:depth_charge":"textures/kaleidoscope_tavern_jar/item/depth_charge","kaleidoscope_tavern:emerald":"textures/kaleidoscope_tavern_jar/item/emerald","kaleidoscope_tavern:empty_bottle":"textures/kaleidoscope_tavern_jar/item/empty_bottle","kaleidoscope_tavern:empty_glassware":"textures/kaleidoscope_tavern_jar/item/empty_glassware","kaleidoscope_tavern:firefly_incense":"textures/kaleidoscope_tavern_jar/item/firefly_incense","kaleidoscope_tavern:ginkgo_incense":"textures/kaleidoscope_tavern_jar/item/ginkgo_incense","kaleidoscope_tavern:glow_berries_bucket":"textures/kaleidoscope_tavern_jar/item/glow_berries_bucket","kaleidoscope_tavern:glowflower_brew_q1":"textures/kaleidoscope_tavern_jar/item/glowflower_brew","kaleidoscope_tavern:glowflower_brew_q2":"textures/kaleidoscope_tavern_jar/item/glowflower_brew","kaleidoscope_tavern:glowflower_brew_q3":"textures/kaleidoscope_tavern_jar/item/glowflower_brew","kaleidoscope_tavern:glowflower_brew_q4":"textures/kaleidoscope_tavern_jar/item/glowflower_brew","kaleidoscope_tavern:glowflower_brew_q5":"textures/kaleidoscope_tavern_jar/item/glowflower_brew","kaleidoscope_tavern:glowflower_brew_q6":"textures/kaleidoscope_tavern_jar/item/glowflower_brew","kaleidoscope_tavern:godfather":"textures/kaleidoscope_tavern_jar/item/godfather","kaleidoscope_tavern:gold_grape":"textures/kaleidoscope_tavern_jar/item/gold_grape","kaleidoscope_tavern:gold_grape_bucket":"textures/kaleidoscope_tavern_jar/item/gold_grape_bucket","kaleidoscope_tavern:grape":"textures/kaleidoscope_tavern_jar/item/grape","kaleidoscope_tavern:grape_bucket":"textures/kaleidoscope_tavern_jar/item/grape_bucket","kaleidoscope_tavern:grapevine":"textures/kaleidoscope_tavern_jar/item/grapevine","kaleidoscope_tavern:grass_sandwich_board":"textures/kt_derived/a17/item_display_grass_sandwich_board","kaleidoscope_tavern:grasshopper":"textures/kaleidoscope_tavern_jar/item/grasshopper","kaleidoscope_tavern:gray_bar_stool":"textures/kt_runtime/icons/gray_bar_stool","kaleidoscope_tavern:green_bar_stool":"textures/kt_runtime/icons/green_bar_stool","kaleidoscope_tavern:green_grape":"textures/kaleidoscope_tavern_jar/item/green_grape","kaleidoscope_tavern:green_grape_bucket":"textures/kaleidoscope_tavern_jar/item/green_grape_bucket","kaleidoscope_tavern:honey_wine_q1":"textures/kaleidoscope_tavern_jar/item/honey_wine","kaleidoscope_tavern:honey_wine_q2":"textures/kaleidoscope_tavern_jar/item/honey_wine","kaleidoscope_tavern:honey_wine_q3":"textures/kaleidoscope_tavern_jar/item/honey_wine","kaleidoscope_tavern:honey_wine_q4":"textures/kaleidoscope_tavern_jar/item/honey_wine","kaleidoscope_tavern:honey_wine_q5":"textures/kaleidoscope_tavern_jar/item/honey_wine","kaleidoscope_tavern:honey_wine_q6":"textures/kaleidoscope_tavern_jar/item/honey_wine","kaleidoscope_tavern:ice_grape":"textures/kt_derived/a17/icon_ice_grape","kaleidoscope_tavern:ice_grape_bucket":"textures/kaleidoscope_tavern_jar/item/ice_grape_bucket","kaleidoscope_tavern:ice_wine_q1":"textures/kaleidoscope_tavern_jar/item/ice_wine","kaleidoscope_tavern:ice_wine_q2":"textures/kaleidoscope_tavern_jar/item/ice_wine","kaleidoscope_tavern:ice_wine_q3":"textures/kaleidoscope_tavern_jar/item/ice_wine","kaleidoscope_tavern:ice_wine_q4":"textures/kaleidoscope_tavern_jar/item/ice_wine","kaleidoscope_tavern:ice_wine_q5":"textures/kaleidoscope_tavern_jar/item/ice_wine","kaleidoscope_tavern:ice_wine_q6":"textures/kaleidoscope_tavern_jar/item/ice_wine","kaleidoscope_tavern:light_blue_bar_stool":"textures/kt_runtime/icons/light_blue_bar_stool","kaleidoscope_tavern:light_gray_bar_stool":"textures/kt_runtime/icons/light_gray_bar_stool","kaleidoscope_tavern:lime_bar_stool":"textures/kt_runtime/icons/lime_bar_stool","kaleidoscope_tavern:luminous_bride_q1":"textures/kaleidoscope_tavern_jar/item/luminous_bride","kaleidoscope_tavern:luminous_bride_q2":"textures/kaleidoscope_tavern_jar/item/luminous_bride","kaleidoscope_tavern:luminous_bride_q3":"textures/kaleidoscope_tavern_jar/item/luminous_bride","kaleidoscope_tavern:luminous_bride_q4":"textures/kaleidoscope_tavern_jar/item/luminous_bride","kaleidoscope_tavern:luminous_bride_q5":"textures/kaleidoscope_tavern_jar/item/luminous_bride","kaleidoscope_tavern:luminous_bride_q6":"textures/kaleidoscope_tavern_jar/item/luminous_bride","kaleidoscope_tavern:madame_shexiang_q1":"textures/kaleidoscope_tavern_jar/item/madame_shexiang","kaleidoscope_tavern:madame_shexiang_q2":"textures/kaleidoscope_tavern_jar/item/madame_shexiang","kaleidoscope_tavern:madame_shexiang_q3":"textures/kaleidoscope_tavern_jar/item/madame_shexiang","kaleidoscope_tavern:madame_shexiang_q4":"textures/kaleidoscope_tavern_jar/item/madame_shexiang","kaleidoscope_tavern:madame_shexiang_q5":"textures/kaleidoscope_tavern_jar/item/madame_shexiang","kaleidoscope_tavern:madame_shexiang_q6":"textures/kaleidoscope_tavern_jar/item/madame_shexiang","kaleidoscope_tavern:magenta_bar_stool":"textures/kt_runtime/icons/magenta_bar_stool","kaleidoscope_tavern:miners_star_q1":"textures/kaleidoscope_tavern_jar/item/miners_star","kaleidoscope_tavern:miners_star_q2":"textures/kaleidoscope_tavern_jar/item/miners_star","kaleidoscope_tavern:miners_star_q3":"textures/kaleidoscope_tavern_jar/item/miners_star","kaleidoscope_tavern:miners_star_q4":"textures/kaleidoscope_tavern_jar/item/miners_star","kaleidoscope_tavern:miners_star_q5":"textures/kaleidoscope_tavern_jar/item/miners_star","kaleidoscope_tavern:miners_star_q6":"textures/kaleidoscope_tavern_jar/item/miners_star","kaleidoscope_tavern:mojito":"textures/kaleidoscope_tavern_jar/item/mojito","kaleidoscope_tavern:molotov":"textures/kaleidoscope_tavern_jar/item/molotov","kaleidoscope_tavern:mother_snow_q1":"textures/kaleidoscope_tavern_jar/item/mother_snow","kaleidoscope_tavern:mother_snow_q2":"textures/kaleidoscope_tavern_jar/item/mother_snow","kaleidoscope_tavern:mother_snow_q3":"textures/kaleidoscope_tavern_jar/item/mother_snow","kaleidoscope_tavern:mother_snow_q4":"textures/kaleidoscope_tavern_jar/item/mother_snow","kaleidoscope_tavern:mother_snow_q5":"textures/kaleidoscope_tavern_jar/item/mother_snow","kaleidoscope_tavern:mother_snow_q6":"textures/kaleidoscope_tavern_jar/item/mother_snow","kaleidoscope_tavern:mystery_cocktail":"textures/kaleidoscope_tavern_jar/item/mystery_cocktail","kaleidoscope_tavern:nether_special":"textures/kaleidoscope_tavern_jar/item/nether_special","kaleidoscope_tavern:orange_bar_stool":"textures/kt_runtime/icons/orange_bar_stool","kaleidoscope_tavern:orchid_sandwich_board":"textures/kt_derived/a17/item_display_orchid_sandwich_board","kaleidoscope_tavern:peony_sandwich_board":"textures/kt_derived/a17/item_display_peony_sandwich_board","kaleidoscope_tavern:pine_incense":"textures/kaleidoscope_tavern_jar/item/pine_incense","kaleidoscope_tavern:pink_bar_stool":"textures/kt_runtime/icons/pink_bar_stool","kaleidoscope_tavern:pink_petals_sandwich_board":"textures/kt_derived/a17/item_display_pink_petals_sandwich_board","kaleidoscope_tavern:pitcher_plant_sandwich_board":"textures/kt_derived/a17/item_display_pitcher_plant_sandwich_board","kaleidoscope_tavern:plum_wine_q1":"textures/kaleidoscope_tavern_jar/item/plum_wine","kaleidoscope_tavern:plum_wine_q2":"textures/kaleidoscope_tavern_jar/item/plum_wine","kaleidoscope_tavern:plum_wine_q3":"textures/kaleidoscope_tavern_jar/item/plum_wine","kaleidoscope_tavern:plum_wine_q4":"textures/kaleidoscope_tavern_jar/item/plum_wine","kaleidoscope_tavern:plum_wine_q5":"textures/kaleidoscope_tavern_jar/item/plum_wine","kaleidoscope_tavern:plum_wine_q6":"textures/kaleidoscope_tavern_jar/item/plum_wine","kaleidoscope_tavern:polaris_sweet_white_q1":"textures/kaleidoscope_tavern_jar/item/polaris_sweet_white","kaleidoscope_tavern:polaris_sweet_white_q2":"textures/kaleidoscope_tavern_jar/item/polaris_sweet_white","kaleidoscope_tavern:polaris_sweet_white_q3":"textures/kaleidoscope_tavern_jar/item/polaris_sweet_white","kaleidoscope_tavern:polaris_sweet_white_q4":"textures/kaleidoscope_tavern_jar/item/polaris_sweet_white","kaleidoscope_tavern:polaris_sweet_white_q5":"textures/kaleidoscope_tavern_jar/item/polaris_sweet_white","kaleidoscope_tavern:polaris_sweet_white_q6":"textures/kaleidoscope_tavern_jar/item/polaris_sweet_white","kaleidoscope_tavern:poppy_sandwich_board":"textures/kt_derived/a17/item_display_poppy_sandwich_board","kaleidoscope_tavern:purple_bar_stool":"textures/kt_runtime/icons/purple_bar_stool","kaleidoscope_tavern:red_bar_stool":"textures/kt_runtime/icons/red_bar_stool","kaleidoscope_tavern:red_queen_q1":"textures/kaleidoscope_tavern_jar/item/red_queen","kaleidoscope_tavern:red_queen_q2":"textures/kaleidoscope_tavern_jar/item/red_queen","kaleidoscope_tavern:red_queen_q3":"textures/kaleidoscope_tavern_jar/item/red_queen","kaleidoscope_tavern:red_queen_q4":"textures/kaleidoscope_tavern_jar/item/red_queen","kaleidoscope_tavern:red_queen_q5":"textures/kaleidoscope_tavern_jar/item/red_queen","kaleidoscope_tavern:red_queen_q6":"textures/kaleidoscope_tavern_jar/item/red_queen","kaleidoscope_tavern:riesling_dry_white_q1":"textures/kaleidoscope_tavern_jar/item/riesling_dry_white","kaleidoscope_tavern:riesling_dry_white_q2":"textures/kaleidoscope_tavern_jar/item/riesling_dry_white","kaleidoscope_tavern:riesling_dry_white_q3":"textures/kaleidoscope_tavern_jar/item/riesling_dry_white","kaleidoscope_tavern:riesling_dry_white_q4":"textures/kaleidoscope_tavern_jar/item/riesling_dry_white","kaleidoscope_tavern:riesling_dry_white_q5":"textures/kaleidoscope_tavern_jar/item/riesling_dry_white","kaleidoscope_tavern:riesling_dry_white_q6":"textures/kaleidoscope_tavern_jar/item/riesling_dry_white","kaleidoscope_tavern:rum_q1":"textures/kaleidoscope_tavern_jar/item/rum","kaleidoscope_tavern:rum_q2":"textures/kaleidoscope_tavern_jar/item/rum","kaleidoscope_tavern:rum_q3":"textures/kaleidoscope_tavern_jar/item/rum","kaleidoscope_tavern:rum_q4":"textures/kaleidoscope_tavern_jar/item/rum","kaleidoscope_tavern:rum_q5":"textures/kaleidoscope_tavern_jar/item/rum","kaleidoscope_tavern:rum_q6":"textures/kaleidoscope_tavern_jar/item/rum","kaleidoscope_tavern:sakura_incense":"textures/kaleidoscope_tavern_jar/item/sakura_incense","kaleidoscope_tavern:sakura_wine_q1":"textures/kaleidoscope_tavern_jar/item/sakura_wine","kaleidoscope_tavern:sakura_wine_q2":"textures/kaleidoscope_tavern_jar/item/sakura_wine","kaleidoscope_tavern:sakura_wine_q3":"textures/kaleidoscope_tavern_jar/item/sakura_wine","kaleidoscope_tavern:sakura_wine_q4":"textures/kaleidoscope_tavern_jar/item/sakura_wine","kaleidoscope_tavern:sakura_wine_q5":"textures/kaleidoscope_tavern_jar/item/sakura_wine","kaleidoscope_tavern:sakura_wine_q6":"textures/kaleidoscope_tavern_jar/item/sakura_wine","kaleidoscope_tavern:sauvignon_blanc_dry_white_q1":"textures/kaleidoscope_tavern_jar/item/sauvignon_blanc_dry_white","kaleidoscope_tavern:sauvignon_blanc_dry_white_q2":"textures/kaleidoscope_tavern_jar/item/sauvignon_blanc_dry_white","kaleidoscope_tavern:sauvignon_blanc_dry_white_q3":"textures/kaleidoscope_tavern_jar/item/sauvignon_blanc_dry_white","kaleidoscope_tavern:sauvignon_blanc_dry_white_q4":"textures/kaleidoscope_tavern_jar/item/sauvignon_blanc_dry_white","kaleidoscope_tavern:sauvignon_blanc_dry_white_q5":"textures/kaleidoscope_tavern_jar/item/sauvignon_blanc_dry_white","kaleidoscope_tavern:sauvignon_blanc_dry_white_q6":"textures/kaleidoscope_tavern_jar/item/sauvignon_blanc_dry_white","kaleidoscope_tavern:screwdriver":"textures/kaleidoscope_tavern_jar/item/screwdriver","kaleidoscope_tavern:sculk_special":"textures/kaleidoscope_tavern_jar/item/sculk_special","kaleidoscope_tavern:shaker":"textures/kaleidoscope_tavern_jar/item/shaker","kaleidoscope_tavern:shaker_active":"textures/kaleidoscope_tavern_jar/item/shaker","kaleidoscope_tavern:shaker_pouring":"textures/kaleidoscope_tavern_jar/item/shaker","kaleidoscope_tavern:sherry_q1":"textures/kaleidoscope_tavern_jar/item/sherry","kaleidoscope_tavern:sherry_q2":"textures/kaleidoscope_tavern_jar/item/sherry","kaleidoscope_tavern:sherry_q3":"textures/kaleidoscope_tavern_jar/item/sherry","kaleidoscope_tavern:sherry_q4":"textures/kaleidoscope_tavern_jar/item/sherry","kaleidoscope_tavern:sherry_q5":"textures/kaleidoscope_tavern_jar/item/sherry","kaleidoscope_tavern:sherry_q6":"textures/kaleidoscope_tavern_jar/item/sherry","kaleidoscope_tavern:snow_incense":"textures/kaleidoscope_tavern_jar/item/snow_incense","kaleidoscope_tavern:spore_incense":"textures/kaleidoscope_tavern_jar/item/spore_incense","kaleidoscope_tavern:stepladder":"textures/kaleidoscope_tavern_jar/item/stepladder","kaleidoscope_tavern:string_lights_black":"textures/kt_runtime/icons/string_lights_black","kaleidoscope_tavern:string_lights_blue":"textures/kt_runtime/icons/string_lights_blue","kaleidoscope_tavern:string_lights_brown":"textures/kt_runtime/icons/string_lights_brown","kaleidoscope_tavern:string_lights_colorless":"textures/kt_runtime/icons/string_lights_colorless","kaleidoscope_tavern:string_lights_cyan":"textures/kt_runtime/icons/string_lights_cyan","kaleidoscope_tavern:string_lights_gray":"textures/kt_runtime/icons/string_lights_gray","kaleidoscope_tavern:string_lights_green":"textures/kt_runtime/icons/string_lights_green","kaleidoscope_tavern:string_lights_light_blue":"textures/kt_runtime/icons/string_lights_light_blue","kaleidoscope_tavern:string_lights_light_gray":"textures/kt_runtime/icons/string_lights_light_gray","kaleidoscope_tavern:string_lights_lime":"textures/kt_runtime/icons/string_lights_lime","kaleidoscope_tavern:string_lights_magenta":"textures/kt_runtime/icons/string_lights_magenta","kaleidoscope_tavern:string_lights_orange":"textures/kt_runtime/icons/string_lights_orange","kaleidoscope_tavern:string_lights_pink":"textures/kt_runtime/icons/string_lights_pink","kaleidoscope_tavern:string_lights_purple":"textures/kt_runtime/icons/string_lights_purple","kaleidoscope_tavern:string_lights_red":"textures/kt_runtime/icons/string_lights_red","kaleidoscope_tavern:string_lights_white":"textures/kt_runtime/icons/string_lights_white","kaleidoscope_tavern:string_lights_yellow":"textures/kt_runtime/icons/string_lights_yellow","kaleidoscope_tavern:sunflower_sandwich_board":"textures/kt_derived/a17/item_display_sunflower_sandwich_board","kaleidoscope_tavern:sunset_glow_q1":"textures/kaleidoscope_tavern_jar/item/sunset_glow","kaleidoscope_tavern:sunset_glow_q2":"textures/kaleidoscope_tavern_jar/item/sunset_glow","kaleidoscope_tavern:sunset_glow_q3":"textures/kaleidoscope_tavern_jar/item/sunset_glow","kaleidoscope_tavern:sunset_glow_q4":"textures/kaleidoscope_tavern_jar/item/sunset_glow","kaleidoscope_tavern:sunset_glow_q5":"textures/kaleidoscope_tavern_jar/item/sunset_glow","kaleidoscope_tavern:sunset_glow_q6":"textures/kaleidoscope_tavern_jar/item/sunset_glow","kaleidoscope_tavern:sweet_berries_bucket":"textures/kaleidoscope_tavern_jar/item/sweet_berries_bucket","kaleidoscope_tavern:sweet_berry_wine_q1":"textures/kaleidoscope_tavern_jar/item/sweet_berry_wine","kaleidoscope_tavern:sweet_berry_wine_q2":"textures/kaleidoscope_tavern_jar/item/sweet_berry_wine","kaleidoscope_tavern:sweet_berry_wine_q3":"textures/kaleidoscope_tavern_jar/item/sweet_berry_wine","kaleidoscope_tavern:sweet_berry_wine_q4":"textures/kaleidoscope_tavern_jar/item/sweet_berry_wine","kaleidoscope_tavern:sweet_berry_wine_q5":"textures/kaleidoscope_tavern_jar/item/sweet_berry_wine","kaleidoscope_tavern:sweet_berry_wine_q6":"textures/kaleidoscope_tavern_jar/item/sweet_berry_wine","kaleidoscope_tavern:torchflower_sandwich_board":"textures/kt_derived/a17/item_display_torchflower_sandwich_board","kaleidoscope_tavern:tulip_sandwich_board":"textures/kt_derived/a17/item_display_tulip_sandwich_board","kaleidoscope_tavern:vinegar_q1":"textures/kaleidoscope_tavern_jar/item/vinegar","kaleidoscope_tavern:vinegar_q2":"textures/kaleidoscope_tavern_jar/item/vinegar","kaleidoscope_tavern:vinegar_q3":"textures/kaleidoscope_tavern_jar/item/vinegar","kaleidoscope_tavern:vinegar_q4":"textures/kaleidoscope_tavern_jar/item/vinegar","kaleidoscope_tavern:vinegar_q5":"textures/kaleidoscope_tavern_jar/item/vinegar","kaleidoscope_tavern:vinegar_q6":"textures/kaleidoscope_tavern_jar/item/vinegar","kaleidoscope_tavern:vodka_q1":"textures/kaleidoscope_tavern_jar/item/vodka","kaleidoscope_tavern:vodka_q2":"textures/kaleidoscope_tavern_jar/item/vodka","kaleidoscope_tavern:vodka_q3":"textures/kaleidoscope_tavern_jar/item/vodka","kaleidoscope_tavern:vodka_q4":"textures/kaleidoscope_tavern_jar/item/vodka","kaleidoscope_tavern:vodka_q5":"textures/kaleidoscope_tavern_jar/item/vodka","kaleidoscope_tavern:vodka_q6":"textures/kaleidoscope_tavern_jar/item/vodka","kaleidoscope_tavern:watermelon_juice":"textures/kaleidoscope_tavern_jar/item/watermelon_juice","kaleidoscope_tavern:whiskey_q1":"textures/kaleidoscope_tavern_jar/item/whiskey","kaleidoscope_tavern:whiskey_q2":"textures/kaleidoscope_tavern_jar/item/whiskey","kaleidoscope_tavern:whiskey_q3":"textures/kaleidoscope_tavern_jar/item/whiskey","kaleidoscope_tavern:whiskey_q4":"textures/kaleidoscope_tavern_jar/item/whiskey","kaleidoscope_tavern:whiskey_q5":"textures/kaleidoscope_tavern_jar/item/whiskey","kaleidoscope_tavern:whiskey_q6":"textures/kaleidoscope_tavern_jar/item/whiskey","kaleidoscope_tavern:white_bar_stool":"textures/kt_runtime/icons/white_bar_stool","kaleidoscope_tavern:white_lady":"textures/kaleidoscope_tavern_jar/item/white_lady","kaleidoscope_tavern:wine_q1":"textures/kaleidoscope_tavern_jar/item/wine","kaleidoscope_tavern:wine_q2":"textures/kaleidoscope_tavern_jar/item/wine","kaleidoscope_tavern:wine_q3":"textures/kaleidoscope_tavern_jar/item/wine","kaleidoscope_tavern:wine_q4":"textures/kaleidoscope_tavern_jar/item/wine","kaleidoscope_tavern:wine_q5":"textures/kaleidoscope_tavern_jar/item/wine","kaleidoscope_tavern:wine_q6":"textures/kaleidoscope_tavern_jar/item/wine","kaleidoscope_tavern:wither_rose_sandwich_board":"textures/kt_derived/a17/item_display_wither_rose_sandwich_board","kaleidoscope_tavern:yellow_bar_stool":"textures/kt_runtime/icons/yellow_bar_stool"};
const copy=v=>JSON.parse(JSON.stringify(v));
const firstText=(m,fallback)=>m?.zh_TW??m?.zh_CN??m?.en_US??Object.values(m??{})[0]??fallback;
function guideItemIcon(id,fallback){
 if(typeof id!=='string')return fallback;
 const exact=GUIDE_ITEM_ICONS[id];if(exact)return exact;
 const base=id.replace(/_q[1-6]$/,'');return GUIDE_ITEM_ICONS[base]??fallback;
}
function addLocalizedName(payload,id,map,fallback){
 for(const lc of GUIDE_LOCALES)payload.names[lc][id]=map?.[lc]??map?.en_US??map?.zh_TW??map?.zh_CN??fallback;
}
function recipeMechanics(recipe,lc='zh_TW'){
 const en=lc==='en_US',cn=lc==='zh_CN';
 const label=id=>GUIDE_ITEM_NAMES[lc]?.[id]??id;
 const alts=x=>(x??[]).map(slot=>{
  const groups=new Map();
  for(const id of new Set(slot)){const m=/^(.*)_q([1-6])$/.exec(id);if(!m){groups.set(id,[id]);continue;}const rec=groups.get(m[1])??[];rec.push(Number(m[2]));groups.set(m[1],rec);}
  return [...groups].map(([id,qualities])=>qualities.length>1?`${label(id)} (${en?'Quality':cn?'品质':'品質'} ${Math.min(...qualities)}–${Math.max(...qualities)})`:label(id)).join(' / ');
 }).join(' + ')||'—';
 if(recipe.kind==='pressing')return [`${en?'Fruit':'水果'}：${(recipe.input??[]).map(label).join(' / ')}`,`→ ${label(recipe.fluid)} ${recipe.amount} mB`];
 if(recipe.kind==='shaker')return [`${en?'Three shaker slots':'雪克杯三槽'}：${alts(recipe.ingredients)}`,`→ ${label(recipe.output?.item??recipe.id)}`,`${en?'Serving glass':'接酒杯'}：${label(recipe.carrier??'kaleidoscope_tavern:empty_glassware')}`];
 const output=recipe.output?.item?label(recipe.output.item):recipe.output?.byQuality?.length?`${label(recipe.output.byQuality[0])} (${en?'Quality':cn?'品质':'品質'} 1–6)`:recipe.id;
 return [`${label(recipe.fluid)} × 4000 mB`,`${en?'Barrel ingredients':'酒桶原料'}：${alts(recipe.ingredients)}`,`→ ${output}`,`${en?'Serving bottle':'接酒瓶'}：${label(recipe.carrier??'kaleidoscope_tavern:empty_bottle')}`];
}
/**
 * Project Tavern extension pages/auto-generated recipe pages into the one Cookery
 * family guide. The registry remains Tavern-owned because barrel/shaker semantics
 * are Tavern-specific; only player-facing navigation/rendering is delegated.
 */
export function buildCookeryGuidePayload(registry){
 const payload=copy(COOKERY_GUIDE_PAYLOAD);
 for(const entry of payload.entries){
  if(typeof entry.mechanics==='string')entry.mechanics=[entry.mechanics];
  if(!Array.isArray(entry.mechanics))entry.mechanics=[];
  const localized=entry.mechanicsByLocale&&typeof entry.mechanicsByLocale==='object'?entry.mechanicsByLocale:{};
  entry.mechanicsByLocale=Object.fromEntries(GUIDE_LOCALES.map(lc=>{
   const value=localized[lc];
   return [lc,Array.isArray(value)?value.filter(x=>typeof x==='string'&&x):typeof value==='string'&&value?[value]:entry.mechanics];
  }));
 }
 if(!registry)return consolidateGuide(payload);
 const sources=new Set((registry.list?.()??[]).map(x=>x.source));
 const pages=(registry.allPages?.()??[]).filter(x=>sources.has(x.source)&&x.source!=='kaleidoscope_tavern');
 const recipes=(registry.allRecipes?.()??[]).filter(x=>x.source==='kaleidoscope_tavern'||sources.has(x.source));
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
 for(const page of EFFECT_PAGES){
  const mechanicsByLocale=Object.fromEntries(GUIDE_LOCALES.map(lc=>{
   let body=String(page.body?.[lc]??page.body?.en_US??'');
   const names=lc==='en_US'?{
    'minecraft:nausea':'Nausea','minecraft:instant_health':'Instant Health','minecraft:resistance':'Resistance','minecraft:fire_resistance':'Fire Resistance','minecraft:regeneration':'Regeneration','minecraft:night_vision':'Night Vision','minecraft:slow_falling':'Slow Falling','minecraft:jump_boost':'Jump Boost','minecraft:strength':'Strength','minecraft:speed':'Speed','minecraft:water_breathing':'Water Breathing','minecraft:weakness':'Weakness','minecraft:poison':'Poison','minecraft:wither':'Wither','minecraft:blindness':'Blindness','minecraft:bad_omen':'Bad Omen','minecraft:mining_fatigue':'Mining Fatigue','minecraft:haste':'Haste','kaleidoscope_tavern:slightly_tipsy':'Slightly Tipsy','kaleidoscope_tavern:grass_stealth':'Grass Stealth','kaleidoscope_tavern:long_reach':'Long Reach','kaleidoscope_tavern:high_heels':'High Heels','kaleidoscope_tavern:vision':'Spirit Vision','kaleidoscope_tavern:bloody_mary':'Bloody Mary'
   }:lc==='zh_CN'?{'minecraft:nausea':'恶心','minecraft:instant_health':'瞬间治疗','minecraft:resistance':'抗性','minecraft:fire_resistance':'抗火','minecraft:regeneration':'生命恢复','minecraft:night_vision':'夜视','minecraft:slow_falling':'缓降','minecraft:jump_boost':'跳跃提升','minecraft:strength':'力量','minecraft:speed':'速度','minecraft:water_breathing':'水下呼吸','minecraft:weakness':'虚弱','minecraft:poison':'中毒','minecraft:wither':'凋零','minecraft:blindness':'失明','minecraft:bad_omen':'不祥之兆','minecraft:mining_fatigue':'挖掘疲劳','minecraft:haste':'急迫','kaleidoscope_tavern:slightly_tipsy':'微醺','kaleidoscope_tavern:grass_stealth':'草丛隐匿','kaleidoscope_tavern:long_reach':'延伸触及','kaleidoscope_tavern:high_heels':'高跟鞋','kaleidoscope_tavern:vision':'灵视','kaleidoscope_tavern:bloody_mary':'血腥玛丽'}:{'minecraft:nausea':'噁心','minecraft:instant_health':'瞬間治療','minecraft:resistance':'抗性','minecraft:fire_resistance':'抗火','minecraft:regeneration':'生命恢復','minecraft:night_vision':'夜視','minecraft:slow_falling':'緩降','minecraft:jump_boost':'跳躍提升','minecraft:strength':'力量','minecraft:speed':'速度','minecraft:water_breathing':'水下呼吸','minecraft:weakness':'虛弱','minecraft:poison':'中毒','minecraft:wither':'凋零','minecraft:blindness':'失明','minecraft:bad_omen':'不祥之兆','minecraft:mining_fatigue':'挖掘疲勞','minecraft:haste':'急迫','kaleidoscope_tavern:slightly_tipsy':'微醺','kaleidoscope_tavern:grass_stealth':'草叢隱匿','kaleidoscope_tavern:long_reach':'延伸觸及','kaleidoscope_tavern:high_heels':'高跟鞋','kaleidoscope_tavern:vision':'靈視','kaleidoscope_tavern:bloody_mary':'血腥瑪麗'};
   body=body.replace(/\b(kaleidoscope_tavern|minecraft):([a-z0-9_]+)/g,(id,ns,key)=>names[id]??key.split('_').map(w=>w[0].toUpperCase()+w.slice(1)).join(' '));
   body=body.replace(/(Slightly Tipsy|Grass Stealth|Long Reach)(?= Lv)/g,'$1 (not available in this version)');
   body=body.replace(/(微醺|草叢隱匿|延伸觸及|草丛隐匿|延伸触及)(?= Lv)/g,'$1（本版本目前不提供此效果）');
   body=body.replace(/\s*\[(?:(?:待移植|not implemented)|已實作\s*\/\s*implemented)\]/g,'');
   body=body.replace(/\bQ([1-6]):/g,lc==='en_US'?'Quality $1:':lc==='zh_CN'?'品质$1：':'品質$1：');
   body=body.replace(/\sLv([0-9]+)/g,lc==='en_US'?' Level $1':lc==='zh_CN'?' 等级$1':' 等級$1');
   body=body.replace(/, ([0-9.]+)s, ([0-9.]+)%/g,lc==='en_US'?', $1s, $2% chance':lc==='zh_CN'?'，$1秒，概率$2%':'，$1秒，機率$2%');
   const rows=body.split('\n').filter(Boolean);
   if(rows.length&&/Each entry rolls independently|效果依每次飲用獨立抽選/.test(rows[0]))rows[0]=lc==='en_US'?'The listed effects may apply independently when you drink this beverage.':lc==='zh_CN'?'饮用时可能会各自附加以下效果。':'飲用時可能會各自附加以下效果。';
   return [lc,rows.slice(0,8)];
  }));
  const linkedRecipe=recipes.find(recipe=>recipe.id===page.recipeIds?.[0]);
  const linkedItem=linkedRecipe?.output?.byQuality?.[0]??linkedRecipe?.output?.item??`kaleidoscope_tavern:${page.id.split('/').pop()}_q1`;
  payload.entries.push({id:page.id,category:'drink_effects',icon:guideItemIcon(linkedItem,'textures/kaleidoscope_tavern_jar/item/wine'),kinds:[],mechanics:mechanicsByLocale.zh_TW,mechanicsByLocale});
  addLocalizedName(payload,page.id,page.title,page.id);
 }
 for(const recipe of recipes){
  const mechanicsByLocale=Object.fromEntries(GUIDE_LOCALES.map(lc=>[lc,recipeMechanics(recipe,lc)]));
  const category=recipe.source!=='kaleidoscope_tavern'?'extensions':recipe.kind==='shaker'?'cocktail_recipes':recipe.kind==='pressing'?'press_recipes':'barrel_drinks';
  const outputItem=recipe.kind==='shaker'?recipe.output?.item:recipe.kind==='pressing'?`kaleidoscope_tavern:${recipe.id.split('/').pop()}`:recipe.output?.byQuality?.[0]??recipe.output?.item;
  const fallback=recipe.kind==='shaker'?'textures/kaleidoscope_tavern_jar/item/shaker':recipe.kind==='pressing'?'textures/kaleidoscope_tavern_jar/item/grape_bucket':'textures/kaleidoscope_tavern_jar/item/barrel';
  payload.entries.push({id:recipe.id,category,icon:guideItemIcon(outputItem,fallback),kinds:[],mechanics:mechanicsByLocale.zh_TW,mechanicsByLocale});
  addLocalizedName(payload,recipe.id,recipe.title,recipe.id);
 }
 for(const entry of payload.entries){
  if(!entry?.id)continue;
  if(typeof entry.mechanics==='string')entry.mechanics=[entry.mechanics];
  if(!Array.isArray(entry.mechanics))entry.mechanics=[];
  const localized=entry.mechanicsByLocale&&typeof entry.mechanicsByLocale==='object'?entry.mechanicsByLocale:{};
  entry.mechanicsByLocale=Object.fromEntries(GUIDE_LOCALES.map(lc=>{
   const value=localized[lc];
   return [lc,Array.isArray(value)?value.filter(x=>typeof x==='string'&&x):typeof value==='string'&&value?[value]:entry.mechanics];
  }));
  for(const lc of GUIDE_LOCALES){
   if(payload.names[lc]?.[entry.id])continue;
   const friendly=GUIDE_ITEM_NAMES[lc]?.[entry.id]??GUIDE_ITEM_NAMES.en_US?.[entry.id];
   if(friendly)payload.names[lc][entry.id]=friendly;
  }
 }
 return consolidateGuide(payload,recipes,EFFECT_PAGES,{names:GUIDE_ITEM_NAMES,icons:GUIDE_ITEM_ICONS});
}
