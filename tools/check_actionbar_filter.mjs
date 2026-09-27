import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {slotsPacket,progressPacket,HUD_PREFIX} from '../runtime/BP/scripts/core/shaker-hud.js';
const ui=JSON.parse(readFileSync(new URL('../runtime/RP/ui/hud_screen.json',import.meta.url),'utf8'));
const expected="((($kt_actionbar_text - '§r[KT] 1:§') = $kt_actionbar_text) and (($kt_actionbar_text - '§r[KT] §b') = $kt_actionbar_text) and (not (('%.4s' * $kt_actionbar_text) = '!js.')))";
assert.equal(ui.namespace,'hud');
assert(ui.kt_mixology_factory && ui.root_panel, 'Graphical HUD must remain installed');
for(const key of ['hud_actionbar_text','hud_actionbar_text/actionbar_message']){assert.equal(ui[key].visible,expected);assert.equal(ui[key].$kt_actionbar_text,'$actionbar_text');}
// Model the same text predicates used by the two native controls.
const visible=s=>!(s.includes('§r[KT] 1:§')||s.includes('§r[KT] §b')||s.slice(0,4)==='!js.');
const colors=[null,0xff55ff,0x5555ff,0xffaa00,0x55ff55,0xffff55,0xff5555,0xffffff];
let slots=0;
for(const a of colors)for(const b of colors)for(const c of colors){assert(!visible(slotsPacket([a,b,c].map(color=>color===null?null:{color}))));slots++;}
for(let n=0;n<=111;n++)assert(!visible(progressPacket(n)));
for(const s of ['','普通提示','§a酒桶 品質 1',HUD_PREFIX+'材料不足',HUD_PREFIX+'Need three ingredients','其他模組提示'])assert(visible(s));
assert(!visible('!js.10'));
console.log(JSON.stringify({slotCases:slots,progressCases:112,messagePreservation:true,clientRenderingTested:false}));
