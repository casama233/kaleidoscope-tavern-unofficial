/** Shared product information; source effects and current supported uses. */
import {COCKTAILS} from './mixology.js';
import {cocktailDuration} from '../core/cocktail-tooltip.js';
import {effectLevel} from '../core/effect-bar.js';

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
      "zh_CN": "延长部分酒馆物品对方块的操作距离。",
      "zh_TW": "延長部分酒館物品對方塊的操作距離。",
      "en_US": "Extends the block-use reach of supported Tavern items."
    }
  },
  "kaleidoscope_tavern:ardent_heat": {
    "names": {
      "zh_CN": "醇热",
      "zh_TW": "醇熱",
      "en_US": "Ardent Heat"
    },
    "usage": {
      "zh_CN": "冲撞可撞碎前方指定方块，并消耗体力。护甲会磨损；没有护甲时会受伤。",
      "zh_TW": "衝撞可撞碎前方指定方塊，並消耗體力。護甲會磨損；沒有護甲時會受傷。",
      "en_US": "Charge through eligible blocks in front of you at an exhaustion cost. Armor wears down; charging without armor causes damage."
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
      "zh_CN": "此版本尚未提供可见的穿墙轮廓。",
      "zh_TW": "此版本尚未提供可見的穿牆輪廓。",
      "en_US": "Visible outlines through walls are not available in this version."
    }
  },
  "kaleidoscope_tavern:xp_drain": {
    "names": {
      "zh_CN": "经验汲取",
      "zh_TW": "經驗汲取",
      "en_US": "XP Drain"
    },
    "usage": {
      "zh_CN": "吸引周围经验球；拾取仍受原生拾取间隔影响。",
      "zh_TW": "吸引周圍經驗球；拾取仍受原生拾取間隔影響。",
      "en_US": "Pulls nearby experience orbs toward you; collection still follows the native pickup interval."
    }
  },
  "kaleidoscope_tavern:slightly_tipsy": {
    "names": {
      "zh_CN": "微醺",
      "zh_TW": "微醺",
      "en_US": "Slightly Tipsy"
    },
    "usage": {
      "zh_CN": "饮用后产生微醺。",
      "zh_TW": "飲用後產生微醺。",
      "en_US": "Drinking this cocktail makes you slightly tipsy."
    }
  },
  "kaleidoscope_tavern:bloody_mary": {
    "names": {
      "zh_CN": "血腥玛丽",
      "zh_TW": "血腥瑪麗",
      "en_US": "Bloody Mary"
    },
    "usage": {
      "zh_CN": "击杀目标时，按目标最大生命值的三分之一向下取整恢复生命。",
      "zh_TW": "擊殺目標時，按目標最大生命值的三分之一向下取整恢復生命。",
      "en_US": "On a credited kill, restores health equal to one third of the target's maximum health, rounded down."
    }
  },
  "kaleidoscope_tavern:tomb_raider": {
    "names": {
      "zh_CN": "摸金校尉",
      "zh_TW": "摸金校尉",
      "en_US": "Tomb Raider"
    },
    "usage": {
      "zh_CN": "攻击指定怪物时，有30%机会卸下其武器。掉落武器的剩余耐久为1，短时间后才可拾取。",
      "zh_TW": "攻擊指定怪物時，有30%機會卸下其武器。掉落武器的剩餘耐久為1，短時間後才可拾取。",
      "en_US": "Attacks against eligible mobs have a 30% chance to disarm them. The dropped weapon has one durability remaining and a short pickup delay."
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
 const instant=locale==='en_US'?'instant':locale==='zh_CN'?'立即触发':'立即觸發';
 return effects.flatMap(effect=>{
  const details=COCKTAIL_GUIDE_DETAILS[effect.effect];if(!details)return [];
  const label=details.names[locale]??details.names.en_US;
  const time=effect.duration>0?cocktailDuration(effect.duration):instant;
  return [prefix+label+effectLevel(effect.amplifier)+' ('+time+')',details.usage[locale]??details.usage.en_US];
 });
}
