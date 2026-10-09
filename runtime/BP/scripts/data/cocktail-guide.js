/** Shared product information; source effects and current supported uses. */
import {COCKTAILS} from './mixology.js';

export const COCKTAIL_GUIDE_DETAILS={
  "kaleidoscope_tavern:high_heels": {
    "names": {
      "zh_CN": "高跟鞋",
      "zh_TW": "高跟鞋",
      "en_US": "High Heels"
    },
    "usage": {
      "zh_CN": "向前遇到一格高的台阶时，可在上方空间足够的情况下自动踏上。",
      "zh_TW": "向前遇到一格高的台階時，可在上方空間足夠的情況下自動踏上。",
      "en_US": "Step up a one-block obstacle while moving forward when there is enough clear space above."
    }
  },
  "kaleidoscope_tavern:long_reach": {
    "names": {
      "zh_CN": "长臂",
      "zh_TW": "長臂",
      "en_US": "Long Reach"
    },
    "usage": {
      "zh_CN": "可从更远处放置酒瓶、雪克杯或倒酒。",
      "zh_TW": "可從更遠處放置酒瓶、雪克杯或倒酒。",
      "en_US": "Place bottles and shakers, or pour a drink, from farther away."
    }
  },
  "kaleidoscope_tavern:ardent_heat": {
    "names": {
      "zh_CN": "醇热",
      "zh_TW": "醇熱",
      "en_US": "Ardent Heat"
    },
    "usage": {
      "zh_CN": "冲刺可撞碎石头、下界岩等方块，但会消耗体力、磨损护甲；没有护甲时会受伤。",
      "zh_TW": "衝刺可撞碎石頭、地獄岩等方塊，但會消耗體力、磨損護甲；沒有護甲時會受傷。",
      "en_US": "Sprint through blocks such as stone and netherrack at a stamina and armor cost; charging without armor causes damage."
    }
  },
  "kaleidoscope_tavern:zenith": {
    "names": {
      "zh_CN": "至高点",
      "zh_TW": "至高點",
      "en_US": "Zenith"
    },
    "usage": {
      "zh_CN": "身处地下时，传送到上方地面。",
      "zh_TW": "身處地下時，傳送到上方地面。",
      "en_US": "Teleport to the surface above you while underground."
    }
  },
  "kaleidoscope_tavern:grass_stealth": {
    "names": {
      "zh_CN": "穿草隐身",
      "zh_TW": "穿草隱身",
      "en_US": "Grass Stealth"
    },
    "usage": {
      "zh_CN": "潜行藏进草丛时获得隐身。已经锁定你的怪物仍可能继续追击。",
      "zh_TW": "潛行藏進草叢時獲得隱身。已經鎖定你的怪物仍可能繼續追擊。",
      "en_US": "Sneak into grass to become invisible. Enemies that already target you may continue to pursue you."
    }
  },
  "kaleidoscope_tavern:upside_down": {
    "names": {
      "zh_CN": "倒立",
      "zh_TW": "倒立",
      "en_US": "Upside Down"
    },
    "usage": {
      "zh_CN": "使周围生物上下颠倒，玩家除外。",
      "zh_TW": "使周圍生物上下顛倒，玩家除外。",
      "en_US": "Turns nearby mobs upside down, excluding players."
    }
  },
  "kaleidoscope_tavern:vision": {
    "names": {
      "zh_CN": "灵视",
      "zh_TW": "靈視",
      "en_US": "Spirit Vision"
    },
    "usage": {
      "zh_CN": "感知附近新出现的生物时有声音提示；本版没有穿墙轮廓。",
      "zh_TW": "感知附近新出現的生物時有聲音提示；本版沒有穿牆輪廓。",
      "en_US": "Sounds a cue when it senses newly nearby creatures. This version has no outlines through walls."
    }
  },
  "kaleidoscope_tavern:xp_drain": {
    "names": {
      "zh_CN": "经验汲取",
      "zh_TW": "經驗汲取",
      "en_US": "XP Drain"
    },
    "usage": {
      "zh_CN": "把周围经验球吸向自己，方便收集经验。",
      "zh_TW": "把周圍經驗球吸向自己，方便收集經驗。",
      "en_US": "Pulls nearby experience orbs toward you for easier collection."
    }
  },
  "kaleidoscope_tavern:slightly_tipsy": {
    "names": {
      "zh_CN": "微醺",
      "zh_TW": "微醺",
      "en_US": "Slightly Tipsy"
    },
    "usage": {
      "zh_CN": "饮用后视角会轻轻摇晃。",
      "zh_TW": "飲用後視角會輕輕搖晃。",
      "en_US": "Your view sways gently after drinking."
    }
  },
  "kaleidoscope_tavern:bloody_mary": {
    "names": {
      "zh_CN": "血腥玛丽",
      "zh_TW": "血腥瑪麗",
      "en_US": "Bloody Mary"
    },
    "usage": {
      "zh_CN": "击杀目标时恢复生命，恢复量随目标变化。",
      "zh_TW": "擊殺目標時恢復生命，恢復量隨目標變化。",
      "en_US": "Defeating a target restores health; the amount depends on the target."
    }
  },
  "kaleidoscope_tavern:tomb_raider": {
    "names": {
      "zh_CN": "摸金校尉",
      "zh_TW": "摸金校尉",
      "en_US": "Tomb Raider"
    },
    "usage": {
      "zh_CN": "原作中用于缴械；本版原版怪物的武器卸除仍未可用。",
      "zh_TW": "原作中用來繳械；本版原版怪物的武器卸除仍未可用。",
      "en_US": "An effect for disarming enemies in the original game. Disarming vanilla mobs is not available in this version."
    }
  },
  "kaleidoscope_tavern:shriek_attack": {
    "names": {
      "zh_CN": "尖啸攻击",
      "zh_TW": "尖嘯攻擊",
      "en_US": "Shriek Attack"
    },
    "usage": {
      "zh_CN": "向视线方向发出尖啸，伤害并击退路径上的目标。",
      "zh_TW": "向視線方向發出尖嘯，傷害並擊退路徑上的目標。",
      "en_US": "Send a sonic attack along your view direction, damaging and knocking back targets in its path."
    }
  }
};

export function cocktailGuideNotes(item,locale='en_US'){
 const effects=COCKTAILS[item]?.effects;
 if(!effects)return [];
 const prefix=locale==='en_US'?'Effect: ':locale==='zh_CN'?'效果：':'效果：';
 return effects.flatMap(effect=>{
  const details=COCKTAIL_GUIDE_DETAILS[effect.effect];if(!details)return [];
  const label=details.names[locale]??details.names.en_US;
  return [prefix+label+' — '+(details.usage[locale]??details.usage.en_US)];
 });
}
