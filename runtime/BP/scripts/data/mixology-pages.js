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
      "zh_TW": "C5：桌上投三份Q4以上基酒或支援的原生藥水。潛行空手拿起整杯；手持按住使用，鬆手完成，111tick自動结算。潛行取消。不要連點當成長按。若平台未觸發原生事件，在酒館指南選擇相容兩次點擊模式。完成後對已放空杯倒酒，12tick後才提交。原作PUT及杯嘴locator已綁定；手腕/窄臂/觸控仍需引擎驗收。藥水保留effect/delivery身份，退料交回原版玻璃瓶。",
      "zh_CN": "C5：桌上投料，潜行空手拿起；按住使用、松手完成，111tick自动结算；潜行取消。原生输入未触发时可在独立指南明确切换两次点击兼容模式。药水按原生身份保存，退料需玻璃瓶。手腕、触控与真实引擎动画仍需验收。",
      "en_US": "C5: load on table, pick up, HOLD use and RELEASE to finish. Sneak cancels; 111-tick watchdog. Explicit two-click fallback is available in this independent guide if native events do not fire. Native potion identity/duration are preserved, withdraw with a vanilla glass bottle. Spout locator is geometry-bound; wrist/skin/mobile calibration awaits real-engine testing."
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
      "zh_TW": "特調保留每份品質/藥水身份對應效果，合併同類時長×Java float1.2後截斷，强度與機率取最大；物品不可堆疊，擺放取回不丟資料。C5已實作血腥瑪麗擊殺回血；經驗汲取及Zenith為明示適配。C6另已接入聲波、倒立、靈視、摸金校尉、醇熱與高跟鞋適配；尚餘3項Java專屬效果未實作。原生飲用返杯及玻璃透明排序尚需實機測試。",
      "en_US": "Signature preserves per-input effect snapshots, integer mean RGB and Java float1.2 duration merge. C5 implements Bloody Mary kill healing; XP Drain and Zenith are explicit adapters. C6 also enables Shriek, Upside Down, Vision, Tomb Raider, Ardent Heat and High Heels adapters; three Java-only effects remain inactive. Native empty-glass return and transparent rendering need engine tests."
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
      "zh_TW": "kaleidoscope_tavern:high_heels: 3600s / amplifier 0 / 100% [C6 高跟鞋一格自動跨步適配已接入；碰撞/手機待實機]",
      "zh_CN": "kaleidoscope_tavern:high_heels: 3600s / amplifier 0 / 100% [C6 高跟鞋一格自动跨步适配已接入；碰撞/手机待实机]",
      "en_US": "kaleidoscope_tavern:high_heels: 3600s / amplifier 0 / 100% [C6 High Heels one-block auto-step adapter implemented; collision/mobile engine test pending]"
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
      "zh_TW": "kaleidoscope_tavern:long_reach: 2700s / amplifier 0 / 100% [未實作]",
      "zh_CN": "kaleidoscope_tavern:long_reach: 2700s / amplifier 0 / 100% [未實作]",
      "en_US": "kaleidoscope_tavern:long_reach: 2700s / amplifier 0 / 100% [not implemented]"
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
      "zh_TW": "kaleidoscope_tavern:ardent_heat: 300s / amplifier 0 / 100% [C6 醇熱衝撞適配已接入；掉落／飢餓待實機]",
      "zh_CN": "kaleidoscope_tavern:ardent_heat: 300s / amplifier 0 / 100% [C6 醇热冲撞适配已接入；掉落/饥饿待实机]",
      "en_US": "kaleidoscope_tavern:ardent_heat: 300s / amplifier 0 / 100% [C6 Ardent Heat sprint-break adapter implemented; loot/hunger engine test pending]"
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
      "zh_TW": "kaleidoscope_tavern:zenith: 0s / amplifier 0 / 100% [安全頂面傳送適配]",
      "zh_CN": "kaleidoscope_tavern:zenith: 0s / amplifier 0 / 100% [安全頂面傳送適配]",
      "en_US": "kaleidoscope_tavern:zenith: 0s / amplifier 0 / 100% [safe-surface teleport adapter]"
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
      "zh_TW": "kaleidoscope_tavern:grass_stealth: 900s / amplifier 0 / 100% [未實作]",
      "zh_CN": "kaleidoscope_tavern:grass_stealth: 900s / amplifier 0 / 100% [未實作]",
      "en_US": "kaleidoscope_tavern:grass_stealth: 900s / amplifier 0 / 100% [not implemented]"
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
      "zh_TW": "kaleidoscope_tavern:upside_down: 0s / amplifier 0 / 100% [C6 Grumm 倒立適配已接入；名稱牌待實機]",
      "zh_CN": "kaleidoscope_tavern:upside_down: 0s / amplifier 0 / 100% [C6 Grumm 倒立适配已接入；名称牌待实机]",
      "en_US": "kaleidoscope_tavern:upside_down: 0s / amplifier 0 / 100% [C6 Grumm adapter implemented; nameplate engine test pending]"
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
      "zh_TW": "kaleidoscope_tavern:vision: 1800s / amplifier 0 / 100% [C6 靈視發光適配已接入；引擎驗收待執行]",
      "zh_CN": "kaleidoscope_tavern:vision: 1800s / amplifier 0 / 100% [C6 灵视发光适配已接入；引擎验收待执行]",
      "en_US": "kaleidoscope_tavern:vision: 1800s / amplifier 0 / 100% [C6 Vision glowing adapter implemented; engine test pending]"
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
      "zh_TW": "kaleidoscope_tavern:xp_drain: 1800s / amplifier 0 / 100% [牽引適配／冷卻未還原]",
      "zh_CN": "kaleidoscope_tavern:xp_drain: 1800s / amplifier 0 / 100% [牽引適配／冷卻未還原]",
      "en_US": "kaleidoscope_tavern:xp_drain: 1800s / amplifier 0 / 100% [attraction adapter / cooldown not ported]"
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
      "zh_TW": "kaleidoscope_tavern:ardent_heat: 300s / amplifier 0 / 100% [C6 醇熱衝撞適配已接入；掉落／飢餓待實機]",
      "zh_CN": "kaleidoscope_tavern:ardent_heat: 300s / amplifier 0 / 100% [C6 醇热冲撞适配已接入；掉落/饥饿待实机]",
      "en_US": "kaleidoscope_tavern:ardent_heat: 300s / amplifier 0 / 100% [C6 Ardent Heat sprint-break adapter implemented; loot/hunger engine test pending]"
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
      "zh_TW": "kaleidoscope_tavern:tomb_raider: 90s / amplifier 0 / 100% [C6 摸金校尉卸裝適配已接入；致死時序待實機]",
      "zh_CN": "kaleidoscope_tavern:tomb_raider: 90s / amplifier 0 / 100% [C6 摸金校尉卸装适配已接入；致死时序待实机]",
      "en_US": "kaleidoscope_tavern:tomb_raider: 90s / amplifier 0 / 100% [C6 Tomb Raider disarm adapter implemented; lethal-hit engine timing pending]"
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
      "zh_TW": "kaleidoscope_tavern:bloody_mary: 1800s / amplifier 0 / 100% [擊殺回血已實作]",
      "zh_CN": "kaleidoscope_tavern:bloody_mary: 1800s / amplifier 0 / 100% [擊殺回血已實作]",
      "en_US": "kaleidoscope_tavern:bloody_mary: 1800s / amplifier 0 / 100% [kill-heal implemented]"
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
      "zh_TW": "kaleidoscope_tavern:shriek_attack: 0s / amplifier 0 / 100% [聲波 PvE 適配已接入]",
      "zh_CN": "kaleidoscope_tavern:shriek_attack: 0s / amplifier 0 / 100% [聲波 PvE 適配已接入]",
      "en_US": "kaleidoscope_tavern:shriek_attack: 0s / amplifier 0 / 100% [sonic PvE adapter implemented]"
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
      "zh_TW": "kaleidoscope_tavern:slightly_tipsy: 180s / amplifier 0 / 100% [未實作]",
      "zh_CN": "kaleidoscope_tavern:slightly_tipsy: 180s / amplifier 0 / 100% [未實作]",
      "en_US": "kaleidoscope_tavern:slightly_tipsy: 180s / amplifier 0 / 100% [not implemented]"
    },
    "recipeIds": []
  },
  {
    "id": "kaleidoscope_tavern:c5_potions",
    "title": {
      "zh_TW": "原生藥水與退料",
      "en_US": "Native potion round-trips"
    },
    "body": {
      "zh_TW": "飲用/噴濺/滯留藥水使用minecraft:potion元件讀取，並以Potions.resolve還原effectId與deliveryId。支援清單外、命名、附魔或額外DP的藥水拒收；不是用普通水瓶代替。顏色按原作特調白色規則；效果使用實際藥水種類/原生durationTicks及明確強度表。Java來源只讀customEffects的行為與此不同，本版刻意使標準基礎藥水有效；不聲稱逐行等價。",
      "en_US": "Potions use native component identity and Potions.resolve for lossless return. Unknown or customized stacks are rejected. Effects use the recognized vanilla type, native duration and explicit amplifiers. This intentionally includes standard base potion effects, unlike the source helper that only iterates customEffects."
    }
  },
  {
    "id": "kaleidoscope_tavern:c5_effects",
    "title": {
      "zh_TW": "專屬酒效 C6",
      "zh_CN": "专属酒效 C6",
      "en_US": "C6 custom effects"
    },
    "body": {
      "zh_TW": "血腥瑪麗：持有效狀態擊殺，回復floor(目標最大生命/3)，最多自身生命上限。經驗汲取：每5tick牽引8格範圍經驗球，保留原球及原生拾取；未移植Java拾取冷卻歸零。Zenith：可用時傳送至同柱安全頂面並飢餓600tick，沒有破壞方塊；不同於Java精確高度圖/落距重置。持續效果以酒館自己的玩家DP保存，離線暫停，牛奶及死亡清除。僅玩家，不冒充原生狀態圖示；其餘3種原作效果仍未實作。\nC6更新：幽匿特調聲波、倒立、靈視、摸金校尉、醇熱與高跟鞋適配已接入，其他3種效果仍待實作。",
      "en_US": "Bloody Mary: kill heal floor(victim max health/3), capped. XP Drain: 5-tick orb attraction adapter; original XP values and native pickup are retained. Zenith: safe topmost-column teleport + 600-tick hunger, not exact Java heightmap/fall reset. Timed status persists in Tavern-owned player DP, pauses offline, clears on milk/death. Players only; no fake native status icons. Other 3 source custom effects remain unimplemented.\nC6: Shriek Attack PvE, Upside Down, Vision, Tomb Raider, Ardent Heat and High Heels adapters are now enabled. Three other types remain pending."
    }
  },
  {
    "id": "kaleidoscope_tavern:c6_furniture",
    "title": {
      "zh_TW": "酒館家具、單瓶架與三槽斜酒架",
      "zh_CN": "酒馆家具、单瓶架与三槽斜酒架",
      "en_US": "Tavern furniture, Holder and three-slot Tilted Rack"
    },
    "body": {
      "zh_TW": "家具線已包含16色高腳凳、16色沙發、桌子、吧台、17款彩燈、4槽Glassware Holder、單瓶Holder、3款雙格吊燈與Batch 12三槽Tilted Rack。Tilted Rack完全復用品質瓶資料契約：world DP保存3個獨立精確*_q1..q6 ID，可混放不同瓶型；點擊位置依Java getLocalX規則隨朝向切成左／中／右三槽。來源blocklist只拒絕brandy與carignan，因此empty_bottle加22種品質飲品base可用；雞尾酒與Molotov不納入。每個有內容槽最多1個無碰撞visual helper，直接引用25種既有來源單瓶geometry/texture，按Java renderer scale0.9、X +22.5°與三個槽位位置適配。方向碰撞與輸出3個酒架的來源配方已還原。Java紅石上升沿隨機彈射飲品／Molotov仍不做，避免projectile路徑硬近似。實機瓶子位置、多人重連與觸控仍待驗收。",
      "zh_CN": "家具线已包含高脚凳、沙发、桌子、吧台、彩灯、4槽杯架、单瓶Holder、3款双格吊灯与Batch 12三槽Tilted Rack。Tilted Rack用world DP保存3个独立精确*_q1..q6 ID，可混放不同瓶型；点击按Java getLocalX随朝向切成左/中/右三槽。来源blocklist只拒绝brandy与carignan，empty_bottle加22种品质饮品base可用。每槽最多1个无碰撞visual helper，复用25种来源瓶型。Java红石弹射仍不做。实机多人/触控仍待验收。",
      "en_US": "The furniture line now includes stools, sofas, table, bar counter, 17 string lights, four-slot Glassware Holder, single Bottle Holder, three two-block Pendant Lamps, and Batch 12 three-slot Tilted Rack. Tilted Rack reuses exact-quality storage: world DP keeps three independent *_q1..q6 IDs and slots may hold different bottle bases. Java getLocalX is preserved for facing-aware left/middle/right hit selection. Only brandy and carignan are source-blocklisted, so empty_bottle plus 22 quality-drink bases are accepted; cocktails and excluded Molotov are not. Each occupied slot has at most one collisionless helper reusing one of 25 source bottle geometries/textures, adapted from Java scale .9, X +22.5° and slot positions. Directional collision and source recipe output 3 are preserved. Java redstone projectile ejection remains deliberately NOT_ADAPTED; real-client multiplayer/touch placement remains NOT_RUN."
    }
  },
  {
    "id": "kaleidoscope_tavern:c6_sonic",
    "title": {
      "zh_TW": "幽匿特調：聲波規則與差異",
      "en_US": "Sculk Special: sonic rules and limits"
    },
    "body": {
      "zh_TW": "飲用完成時沿視線發射32格声波；傷害採目前生命×Java float1.2，判定半徑為1格加目標半寬。命中後追加水平0.63、垂直0.28速度；每2格一個原生聲波粒子。採原生sonicBoom傷害，不直接覆寫目標HP。明示安全適配：不傷害玩家，不打自己的視覺helper；單次最多256個命中目標，無敵/保護拒傷時也不擊退。也可能命中動物與寵物，請勿對準它們測試。不檢查牆遮擋，與原作穿牆聲波相同；沒有爆炸/破壞方塊。新效果不重扣第二杯，回杯仍由原生food完成。以上仍未在遊戲驗收。",
      "en_US": "On completed drinking, a 32-block view ray deals current health × Java float1.2; hit radius is 1 + half target width. Adds horizontal .63 / vertical .28 impulse, with 16 native sonic particles. Uses native sonicBoom damage, never overwrites target HP. Explicit PvE-only adaptation: all players and Tavern helpers excluded; at most 256 hit targets; rejected damage has no knockback. May also hit animals and pets. Passes walls as the source does. No block destruction or second cup consumption. Engine testing is still required."
    }
  }
];
