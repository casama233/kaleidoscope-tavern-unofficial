import {applyCustomEffect as applyLegacy} from './custom-effects.js';
import {applyC7Effect} from './effects-c7.js';
export function applyCustomEffect(player,row){return applyLegacy(player,row)||applyC7Effect(player,row);}
