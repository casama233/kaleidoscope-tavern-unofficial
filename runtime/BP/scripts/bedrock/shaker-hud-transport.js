import {createGraphicalActionbarTransport} from '../core/graphical-actionbar-transport.js';
import {GRAPHICAL_HUD_PREFIX,validShakerHudPacket} from '../core/shaker-hud.js';
const transport=createGraphicalActionbarTransport({prefix:GRAPHICAL_HUD_PREFIX,validatePacket:validShakerHudPacket,maxLength:60});
export const sendFormattingHud=(player,packet)=>transport.send(player,packet);
export const forgetFormattingHud=id=>transport.forget(id);
