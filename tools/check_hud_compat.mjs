import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {HUD_PREFIX,slotToken,slotsPacket,progressPacket,hudSendDue} from '../runtime/BP/scripts/core/shaker-hud.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const hud=JSON.parse(read('runtime/RP/ui/hud_screen.json'));
const adapter=read('runtime/BP/scripts/bedrock/shaker-screen.js');
assert(!/setTitle|updateSubtitle|ktmix:|textures\//.test(adapter),'HUD must not write a title or a resource path');
assert(adapter.includes('setActionBar(raw)'));
assert(!('hud_title_text' in hud));assert(!('hud_actionbar_text' in hud));
assert.deepEqual(Object.keys(hud.root_panel),['modifications']);
assert.equal(hud.root_panel.modifications[0].operation,'insert_back');
assert.equal(hud.kt_mixology_factory.factory.name,'hud_actionbar_text_factory');
assert.equal(hud.kt_mixology_expire.duration,0.6);
assert.equal(hud.kt_mixology_expire.destroy_at_end,'kt_mixology_packet');
const raw=JSON.stringify(hud);
assert(!/#stored_text|visibility_changed|#hud_title_text_string|#texture/.test(raw));
let textures=0;
function walk(value){
 if(!value||typeof value!=='object')return;
 if('texture' in value){
  const p=value.texture;assert.equal(typeof p,'string');assert(p.startsWith('textures/ui/kt_mixology/'));
  assert(existsSync(new URL('../runtime/RP/'+p+'.png',import.meta.url)));textures++;
 }
 for(const v of Object.values(value))walk(v);
}
walk(hud);assert.equal(textures,26); // 24 fixed slot sprites + bar + cursor template
const controls=hud.kt_mixology_packet.controls;
const slots=controls[0].slots.controls;assert.equal(slots.length,24);
for(let i=0;i<3;i++)for(let c=0;c<8;c++)assert(JSON.stringify(slots[i*8+c]).includes(slotToken(i,c)));
const cursors=controls[1].progress.controls.slice(1);assert.equal(cursors.length,112);
for(let n=0;n<112;n++){
 const cursor=Object.values(cursors[n])[0];assert.equal(cursor.visible,`($kt_text = '${progressPacket(n)}')`);
}
assert.equal(progressPacket(-10),progressPacket(0));assert.equal(progressPacket(Infinity),progressPacket(0));
assert.equal(progressPacket(200),progressPacket(111));
const colors=[0xff55ff,0x5555ff,0xffaa00,0x55ff55,0xffff55,0xff5555,0xffffff];
let cases=0;
for(let a=0;a<8;a++)for(let b=0;b<8;b++)for(let c=0;c<8;c++){
 const indices=[a,b,c],packet=slotsPacket(indices.map(n=>n?{color:colors[n-1]}:null));
 assert.equal(packet,HUD_PREFIX+indices.map((n,i)=>slotToken(i,n)).join('  '));
 assert(!/textures\/|ktmix:/.test(packet));cases++;
}
assert(hudSendDue(undefined,'active',0));assert(!hudSendDue({key:'active',tick:0},'active',9));
assert(hudSendDue({key:'active',tick:0},'active',10));
for(let tick=0;tick<256;tick++)assert(!hudSendDue({key:'active',tick:0},undefined,tick));
for(const name of ['hideShakerHud','clearShakerPlayer']){
 const body=adapter.split(`export function ${name}`)[1].split('\n}')[0];
 assert(!/\bsend\(|setActionBar|setTitle/.test(body));
}
assert(read('runtime/BP/scripts/bedrock/mixology.js').includes('clearShakerPlayer(playerId)'));
console.log(JSON.stringify({hudStaticChecks:'passed',slotCases:cases,progressStates:112,idleSamples:256,literalImageReferences:textures,clientTested:false}));
