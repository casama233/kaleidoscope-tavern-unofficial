// Generated from C3 locked source data.
export const MIXOLOGY_PAGES = [
  {
    "id": "kaleidoscope_tavern:mixology",
    "source": "kaleidoscope_tavern",
    "title": {
      "zh_TW": "雪克杯：三槽調酒",
      "zh_CN": "雪克杯：三槽调酒",
      "en_US": "Shaker: three-input mixing"
    },
    "body": {
      "zh_TW": "C3採桌上點擊式調酒，尚非原作手持長按。潛行手持雪克杯點完整頂面放置；每次倒入一瓶Q4–Q6基酒，立即返空瓶。三槽全滿，空手點一下開始，再點一下停止。<19 tick不製作；19–68神秘；69–88特調；89–98匹配固定配方，未匹配則特調；99以上神秘，111 tick自動停止。離開6格、死亡、切換維度或重載會取消尚未完成的計時，材料保留。成品手持空雞尾酒杯點雪克杯領取，也可空手點其水平相鄰的已放空杯倒入。退料先拿空酒瓶；不會把已返空瓶再送一次。藥水資料尚未適配，拒收而不扣料。",
      "zh_CN": "C3为桌上两次点击调酒，非手持长按。基酒需Q4–Q6，三槽各一瓶，投入立即返空瓶；持空酒瓶可退回原品质。空手开始/停止：<19不制作，19–68神秘，69–88特调，89–98固定配方（无匹配则特调），99以上神秘。111tick自动停止。药水暂不收取。",
      "en_US": "C3 uses a placed shaker with click-to-start/click-to-stop, not native held charging. Pour three Q4–Q6 drinks, one per slot; each immediately returns its bottle. Empty hand starts/stops. <19 ticks cancels; 19–68 mystery; 69–88 signature; 89–98 fixed recipe or signature fallback; >=99 mystery; auto-stop at 111. Leaving 6 blocks, dying, changing dimension or reload cancels unfinished timing without losing inputs. Serve with an empty glass in hand or click a horizontally adjacent placed empty glass. Unpour requires the returned container. Potion metadata is not adapted; potions are rejected."
    },
    "recipeIds": []
  },
  {
    "id": "kaleidoscope_tavern:cocktail_limits",
    "source": "kaleidoscope_tavern",
    "title": {
      "zh_TW": "特調、杯子與效果限制",
      "en_US": "Signature cups and effect limits"
    },
    "body": {
      "zh_TW": "特調保留三份原料品質、來源效果與平均RGB；同類效果秒數求和後乘1.2f截斷，強度和機率取最大。特調物品不可堆疊；擺放/取回/存檔保留資料，只對液體染色。手持/物品欄暫用原圖，不代表動態RGB在所有顯示情境已適配。十二款固定雞尾酒及神秘雞尾酒的專屬效果尚未實作，沒有用其他buff冒充；可製作、擺放、喝完返杯，但此時無專屬增益。特調中的原生效果可施加，自訂效果只記錄待移植。支撐消失暫保留可取回杯子，不生成掉落物。",
      "en_US": "Signature preserves three quality-specific ingredient snapshots, merged source effects and mean RGB. Duration sums are multiplied by Java float 1.2 then truncated; amplifier and probability use maxima. Signature items are non-stackable; storage/placement/retrieval preserve payload and only tint liquid. Held/GUI uses the source sprite (not dynamic RGB). All fixed cocktails and Mystery use Java-specific effects which remain unimplemented. Their crafting, serving, display and native empty-glass return are implemented; no substitute buffs. Native effects in Signature are applied. Unsupported custom effects are reported."
    },
    "recipeIds": []
  },
  {
    "id": "kaleidoscope_tavern:cocktail_effects/white_lady",
    "source": "kaleidoscope_tavern",
    "title": {
      "zh_TW": "調酒：白色佳人",
      "zh_CN": "調酒：白色佳人",
      "en_US": "Cocktail: White Lady"
    },
    "body": {
      "zh_TW": "kaleidoscope_tavern:high_heels: 3600s / amplifier 0 / 100% [未實作 / not implemented]",
      "zh_CN": "kaleidoscope_tavern:high_heels: 3600s / amplifier 0 / 100% [未實作 / not implemented]",
      "en_US": "kaleidoscope_tavern:high_heels: 3600s / amplifier 0 / 100% [未實作 / not implemented]"
    },
    "recipeIds": [
      "kaleidoscope_tavern:shaker/white_lady"
    ]
  },
  {
    "id": "kaleidoscope_tavern:cocktail_effects/emerald",
    "source": "kaleidoscope_tavern",
    "title": {
      "zh_TW": "調酒：翡翠",
      "zh_CN": "調酒：翡翠",
      "en_US": "Cocktail: Emerald"
    },
    "body": {
      "zh_TW": "kaleidoscope_tavern:long_reach: 2700s / amplifier 0 / 100% [未實作 / not implemented]",
      "zh_CN": "kaleidoscope_tavern:long_reach: 2700s / amplifier 0 / 100% [未實作 / not implemented]",
      "en_US": "kaleidoscope_tavern:long_reach: 2700s / amplifier 0 / 100% [未實作 / not implemented]"
    },
    "recipeIds": [
      "kaleidoscope_tavern:shaker/emerald"
    ]
  },
  {
    "id": "kaleidoscope_tavern:cocktail_effects/brass_heart",
    "source": "kaleidoscope_tavern",
    "title": {
      "zh_TW": "調酒：黃銅之心",
      "zh_CN": "調酒：黄铜心脏",
      "en_US": "Cocktail: Brass Heart"
    },
    "body": {
      "zh_TW": "kaleidoscope_tavern:ardent_heat: 300s / amplifier 0 / 100% [未實作 / not implemented]",
      "zh_CN": "kaleidoscope_tavern:ardent_heat: 300s / amplifier 0 / 100% [未實作 / not implemented]",
      "en_US": "kaleidoscope_tavern:ardent_heat: 300s / amplifier 0 / 100% [未實作 / not implemented]"
    },
    "recipeIds": [
      "kaleidoscope_tavern:shaker/brass_heart"
    ]
  },
  {
    "id": "kaleidoscope_tavern:cocktail_effects/godfather",
    "source": "kaleidoscope_tavern",
    "title": {
      "zh_TW": "調酒：教父",
      "zh_CN": "調酒：教父",
      "en_US": "Cocktail: Godfather"
    },
    "body": {
      "zh_TW": "kaleidoscope_tavern:zenith: 0s / amplifier 0 / 100% [未實作 / not implemented]",
      "zh_CN": "kaleidoscope_tavern:zenith: 0s / amplifier 0 / 100% [未實作 / not implemented]",
      "en_US": "kaleidoscope_tavern:zenith: 0s / amplifier 0 / 100% [未實作 / not implemented]"
    },
    "recipeIds": [
      "kaleidoscope_tavern:shaker/godfather"
    ]
  },
  {
    "id": "kaleidoscope_tavern:cocktail_effects/grasshopper",
    "source": "kaleidoscope_tavern",
    "title": {
      "zh_TW": "調酒：蚱蜢",
      "zh_CN": "調酒：绿色蚱蜢",
      "en_US": "Cocktail: Grasshopper"
    },
    "body": {
      "zh_TW": "kaleidoscope_tavern:grass_stealth: 900s / amplifier 0 / 100% [未實作 / not implemented]",
      "zh_CN": "kaleidoscope_tavern:grass_stealth: 900s / amplifier 0 / 100% [未實作 / not implemented]",
      "en_US": "kaleidoscope_tavern:grass_stealth: 900s / amplifier 0 / 100% [未實作 / not implemented]"
    },
    "recipeIds": [
      "kaleidoscope_tavern:shaker/grasshopper"
    ]
  },
  {
    "id": "kaleidoscope_tavern:cocktail_effects/screwdriver",
    "source": "kaleidoscope_tavern",
    "title": {
      "zh_TW": "調酒：螺絲起子",
      "zh_CN": "調酒：螺丝起子",
      "en_US": "Cocktail: Screwdriver"
    },
    "body": {
      "zh_TW": "kaleidoscope_tavern:upside_down: 0s / amplifier 0 / 100% [未實作 / not implemented]",
      "zh_CN": "kaleidoscope_tavern:upside_down: 0s / amplifier 0 / 100% [未實作 / not implemented]",
      "en_US": "kaleidoscope_tavern:upside_down: 0s / amplifier 0 / 100% [未實作 / not implemented]"
    },
    "recipeIds": [
      "kaleidoscope_tavern:shaker/screwdriver"
    ]
  },
  {
    "id": "kaleidoscope_tavern:cocktail_effects/mojito",
    "source": "kaleidoscope_tavern",
    "title": {
      "zh_TW": "調酒：莫希托",
      "zh_CN": "調酒：莫吉托",
      "en_US": "Cocktail: Mojito"
    },
    "body": {
      "zh_TW": "kaleidoscope_tavern:vision: 1800s / amplifier 0 / 100% [未實作 / not implemented]",
      "zh_CN": "kaleidoscope_tavern:vision: 1800s / amplifier 0 / 100% [未實作 / not implemented]",
      "en_US": "kaleidoscope_tavern:vision: 1800s / amplifier 0 / 100% [未實作 / not implemented]"
    },
    "recipeIds": [
      "kaleidoscope_tavern:shaker/mojito"
    ]
  },
  {
    "id": "kaleidoscope_tavern:cocktail_effects/allium_garden",
    "source": "kaleidoscope_tavern",
    "title": {
      "zh_TW": "調酒：蔥花園",
      "zh_CN": "調酒：绒球葱花园",
      "en_US": "Cocktail: Allium Garden"
    },
    "body": {
      "zh_TW": "kaleidoscope_tavern:xp_drain: 1800s / amplifier 0 / 100% [未實作 / not implemented]",
      "zh_CN": "kaleidoscope_tavern:xp_drain: 1800s / amplifier 0 / 100% [未實作 / not implemented]",
      "en_US": "kaleidoscope_tavern:xp_drain: 1800s / amplifier 0 / 100% [未實作 / not implemented]"
    },
    "recipeIds": [
      "kaleidoscope_tavern:shaker/allium_garden"
    ]
  },
  {
    "id": "kaleidoscope_tavern:cocktail_effects/depth_charge",
    "source": "kaleidoscope_tavern",
    "title": {
      "zh_TW": "調酒：深水炸彈",
      "zh_CN": "調酒：深水炸弹",
      "en_US": "Cocktail: Depth Charge"
    },
    "body": {
      "zh_TW": "kaleidoscope_tavern:ardent_heat: 300s / amplifier 0 / 100% [未實作 / not implemented]",
      "zh_CN": "kaleidoscope_tavern:ardent_heat: 300s / amplifier 0 / 100% [未實作 / not implemented]",
      "en_US": "kaleidoscope_tavern:ardent_heat: 300s / amplifier 0 / 100% [未實作 / not implemented]"
    },
    "recipeIds": [
      "kaleidoscope_tavern:shaker/depth_charge"
    ]
  },
  {
    "id": "kaleidoscope_tavern:cocktail_effects/nether_special",
    "source": "kaleidoscope_tavern",
    "title": {
      "zh_TW": "調酒：下界特調",
      "zh_CN": "調酒：下界特调",
      "en_US": "Cocktail: Nether Special"
    },
    "body": {
      "zh_TW": "kaleidoscope_tavern:tomb_raider: 90s / amplifier 0 / 100% [未實作 / not implemented]",
      "zh_CN": "kaleidoscope_tavern:tomb_raider: 90s / amplifier 0 / 100% [未實作 / not implemented]",
      "en_US": "kaleidoscope_tavern:tomb_raider: 90s / amplifier 0 / 100% [未實作 / not implemented]"
    },
    "recipeIds": [
      "kaleidoscope_tavern:shaker/nether_special"
    ]
  },
  {
    "id": "kaleidoscope_tavern:cocktail_effects/bloody_mary",
    "source": "kaleidoscope_tavern",
    "title": {
      "zh_TW": "調酒：血腥瑪麗",
      "zh_CN": "調酒：血腥玛丽",
      "en_US": "Cocktail: Bloody Mary"
    },
    "body": {
      "zh_TW": "kaleidoscope_tavern:bloody_mary: 1800s / amplifier 0 / 100% [未實作 / not implemented]",
      "zh_CN": "kaleidoscope_tavern:bloody_mary: 1800s / amplifier 0 / 100% [未實作 / not implemented]",
      "en_US": "kaleidoscope_tavern:bloody_mary: 1800s / amplifier 0 / 100% [未實作 / not implemented]"
    },
    "recipeIds": [
      "kaleidoscope_tavern:shaker/bloody_mary"
    ]
  },
  {
    "id": "kaleidoscope_tavern:cocktail_effects/sculk_special",
    "source": "kaleidoscope_tavern",
    "title": {
      "zh_TW": "調酒：幽匿特調",
      "zh_CN": "調酒：幽匿特调",
      "en_US": "Cocktail: Sculk Special"
    },
    "body": {
      "zh_TW": "kaleidoscope_tavern:shriek_attack: 0s / amplifier 0 / 100% [未實作 / not implemented]",
      "zh_CN": "kaleidoscope_tavern:shriek_attack: 0s / amplifier 0 / 100% [未實作 / not implemented]",
      "en_US": "kaleidoscope_tavern:shriek_attack: 0s / amplifier 0 / 100% [未實作 / not implemented]"
    },
    "recipeIds": [
      "kaleidoscope_tavern:shaker/sculk_special"
    ]
  },
  {
    "id": "kaleidoscope_tavern:cocktail_effects/mystery_cocktail",
    "source": "kaleidoscope_tavern",
    "title": {
      "zh_TW": "調酒：神秘雞尾酒",
      "zh_CN": "調酒：谜之鸡尾酒",
      "en_US": "Cocktail: Mystery Cocktail"
    },
    "body": {
      "zh_TW": "kaleidoscope_tavern:slightly_tipsy: 180s / amplifier 0 / 100% [未實作 / not implemented]",
      "zh_CN": "kaleidoscope_tavern:slightly_tipsy: 180s / amplifier 0 / 100% [未實作 / not implemented]",
      "en_US": "kaleidoscope_tavern:slightly_tipsy: 180s / amplifier 0 / 100% [未實作 / not implemented]"
    },
    "recipeIds": []
  }
];
