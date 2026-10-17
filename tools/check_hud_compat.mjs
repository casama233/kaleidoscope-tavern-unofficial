import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {HUD_PREFIX,GRAPHICAL_HUD_PREFIX,SHAKER_HUD_COLORS,slotToken,slotsPacket,progressPacket,hudSendDue} from '../runtime/BP/scripts/core/shaker-hud.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const bridge=JSON.parse(read('runtime/RP/ui/hud_screen.json'));
const hud=JSON.parse(read('runtime/RP/ui/kt_tavern_hud.json'));
const adapter=read('runtime/BP/scripts/bedrock/shaker-screen.js');
assert(!/updateSubtitle|ktmix:|textures\//.test(adapter),'HUD must not put resource paths in messages');
assert(adapter.includes('sendFormattingHud(player,raw)'));
assert(adapter.includes('setActionBar(raw)'));
assert(!('hud_title_text' in hud));
for(const key of ['hud_actionbar_text','hud_actionbar_text/actionbar_message'])
 assert.deepEqual(Object.keys(bridge[key]).sort(),['$kt_family_actionbar_text','visible']);
assert.equal(hud.namespace,'kaleidoscope_tavern_hud');
assert.equal(hud.root.type,'panel');
assert.equal(bridge.root_panel.modifications[0].operation,'insert_back');
assert.deepEqual(hud.root.controls[0],{'kt_mixology@kaleidoscope_tavern_hud.kt_mixology_factory':{}});
const raw=JSON.stringify(hud);
assert(!/#stored_text|#texture/.test(raw));
assert.equal(hud.kt_mixology_packet.$kt_text,'$actionbar_text');
assert.equal(hud.kt_mixology_factory.factory.name,'hud_actionbar_text_factory');
assert.equal(hud.kt_mixology_factory.factory.max_children_size,1);
let textures=0;
function walk(value){
 if(!value||typeof value!=='object')return;
 if('texture' in value){
  const p=value.texture;assert.equal(typeof p,'string');assert(p.startsWith('textures/ui/kt_mixology/'));
  assert(existsSync(new URL('../runtime/RP/'+p+'.png',import.meta.url)));textures++;
 }
 for(const v of Object.values(value))walk(v);
}
const {kt_effect_icons,...shakerHud}=hud;
walk(shakerHud);assert.equal(textures,53); // 51 fixed slot sprites + bar + cursor template
const controls=hud.kt_mixology_packet.controls;
// Maintained Forge ShakerOverlay.java c4ec1880: lines54/58 and79-95;
// NeoForge a1afba34: lines57/61 and82-98. Both draw BELOW the screen centre.
// https://github.com/KaleidoscopeMods/KaleidoscopeTavern/blob/c4ec1880bd44cf3139d3ba744ab30bb379cf1416/src/main/java/com/github/ysbbbbbb/kaleidoscopetavern/client/gui/overlay/ShakerOverlay.java
// anchor_from selects the parent point; anchor_to selects this control's point.
const points={top_left:[0,0],top_middle:[.5,0],left_middle:[0,.5],center:[.5,.5]};
function projectedBox(panel,parentBox){
 const from=points[panel.anchor_from],to=points[panel.anchor_to];
 assert(from&&to,'Expected source-backed parent/control anchors');
 let offset=panel.offset??[0,0];
 if(typeof offset==='string'){
  const animation=hud[offset.split('.').at(-1)];
  assert.equal(animation.anim_type,'offset');
  offset=panel[animation.from];
 }
 const [x,y,width,height]=parentBox,[w,h]=panel.size,[dx,dy]=offset;
 return [x+from[0]*width+dx-to[0]*w,y+from[1]*height+dy-to[1]*h,w,h];
}
const packet=hud.kt_mixology_packet;
assert(!('offset' in packet)&&!('$kt_graphical_offset|default' in packet));
assert(!packet.variables.some(row=>row.requires.includes('$touch')),'Touch must not add an unsupported downward displacement');
for(const [width,height] of [[320,180],[640,360],[426,240]]){
 const screen=[0,0,width,height],slotsPanel=controls[0].slots,progressPanel=controls[1].progress;
 const slotsBox=projectedBox(slotsPanel,screen),progressBox=projectedBox(progressPanel,screen);
 assert.deepEqual(slotsBox,[Math.floor(width/2)-28,Math.floor(height/2)+32,56,16]);
 assert.deepEqual(progressBox,[Math.floor(width/2)-91,Math.floor(height/2)+26,181,23]);
 for(let slot=0;slot<3;slot++){
  const instance=Object.values(slotsPanel.controls[slot*17+1])[0];
  assert.deepEqual(projectedBox({...hud.kt_mixology_slot,...instance},slotsBox),
                   [Math.floor(width/2)-28+slot*20,Math.floor(height/2)+32,16,16]);
 }
 const bar=progressPanel.controls[0].bar;
 assert.deepEqual(projectedBox(bar,progressBox),[Math.floor(width/2)-91,Math.floor(height/2)+32,181,17]);
 for(const tick of [0,1,74,111]){
  const cursor=Object.values(progressPanel.controls[tick+1])[0];
  const box=projectedBox({...hud.kt_mixology_cursor,...cursor},progressBox);
  assert.equal(box[1],Math.floor(height/2)+26);
  assert.deepEqual(box.slice(2),[11,13]);
  assert.equal(box[0],Math.floor(width/2)-91+Math.round(tick*1.5));
 }
 // Reject T164's top-anchored panel; y=32 is an offset from centre, not top.
 assert.notDeepEqual(projectedBox({...slotsPanel,anchor_from:'top_middle',anchor_to:'center',offset:[0,32]},screen),slotsBox);
}
// Java divides integer GUI dimensions; Bedrock centres may retain a half pixel.
// Keep that bounded platform difference explicit instead of asserting exact
// raster parity for odd viewports.
const oddScreen=[0,0,427,241],oddSlots=projectedBox(controls[0].slots,oddScreen);
const oddProgress=projectedBox(controls[1].progress,oddScreen);
for(const [actual,java] of [[oddSlots,[Math.floor(427/2)-28,Math.floor(241/2)+32,56,16]],
                          [oddProgress,[Math.floor(427/2)-91,Math.floor(241/2)+26,181,23]],
                          [projectedBox(controls[1].progress.controls[0].bar,oddProgress),[Math.floor(427/2)-91,Math.floor(241/2)+32,181,17]]]){
 assert.deepEqual(actual.slice(2),java.slice(2));
 for(const axis of [0,1])assert(Math.abs(actual[axis]-java[axis])<=.5,'Odd viewport differs by more than the known half-pixel centre rounding');
}
const slots=controls[0].slots.controls.filter(row=>Object.keys(row)[0].includes('@kaleidoscope_tavern_hud.kt_mixology_slot'));assert.equal(slots.length,51);
for(let i=0;i<3;i++)for(let c=0;c<17;c++)assert(JSON.stringify(slots[i*17+c]).includes(slotToken(i,c)));
const cursors=controls[1].progress.controls.filter(row=>Object.keys(row)[0].startsWith('cursor_'));assert.equal(cursors.length,112);
// Evaluate the shipped substring predicates. Complete semicolon tokens keep
// prefixed progress states distinct; formatting must not blank the cursor.
const containsPredicate=token=>`(not (($kt_text - '${token}') = $kt_text))`;
const predicateToken=predicate=>{
 const match=/^\(not \(\(\$kt_text - '([^']+)'\) = \$kt_text\)\)$/.exec(predicate);
 assert(match,'Expected a literal owned-token substring predicate');
 return match[1];
};
for(let n=0;n<112;n++){
 const cursor=Object.values(cursors[n])[0];
 assert.equal(cursor.visible,containsPredicate(progressPacket(n)));
}
const cursorTokens=cursors.map(row=>predicateToken(Object.values(row)[0].visible));
const shownCursors=text=>cursorTokens.flatMap((token,index)=>text.replaceAll(token,'')!==text?[index]:[]);
assert.equal(packet.visible,"(not (($kt_text - 'KT_HUD!') = $kt_text) and (($kt_text - 'KT_HUD!END;') = $kt_text))");
const packetVisible=text=>text.replaceAll('KT_HUD!','')!==text&&text.replaceAll('KT_HUD!END;','')===text;
// Project the actual shipped tree with and without creation-time pruning.
// This checks selected controls and output conservation, not engine allocation
// counts, frame times, or rendered-client acceptance.
const predicates=new Map();
function predicate(expression,text){
 if(expression===undefined)return true;
 if(!predicates.has(expression)){
  const fragments=[];
  let body=expression.replace(/\(\(\$kt_text - '([^']*)'\) = \$kt_text\)/g,(_,fragment)=>{
   fragments.push(fragment);return `values[${fragments.length-1}]`;
  }).replace(/\bnot\b/g,'!').replace(/\band\b/g,'&&');
  assert(/^[()\s!&\[\]0-9values]+$/.test(body),'Unexpected factory predicate');
  const evaluate=Function('values','return '+body);
  predicates.set(expression,text=>evaluate(fragments.map(fragment=>!text.includes(fragment))));
 }
 return predicates.get(expression)(text);
}
function projectedPacket(text,prune){
 const images=[],retained=[];
 function visit(control,path,parentVisible=true){
  if(prune&&control.ignored!==undefined&&predicate(control.ignored,text))return;
  retained.push(path);
  const visible=parentVisible&&predicate(control.visible,text);
  if(control.type==='image'&&visible)images.push(path);
  for(const row of control.controls??[])for(const [name,instance] of Object.entries(row)){
   const base=name.includes('@')?hud[name.split('@')[1].split('.').at(-1)]:{};
   visit({...base,...instance},path+'/'+name,visible);
  }
 }
 visit(packet,'packet');return {images,retained};
}
assert(!('ignored' in packet),'Keep the outer expiry instance alive');
for(const row of controls){
 const branch=Object.values(row)[0];assert.equal(branch.ignored,`(not ${branch.visible})`);
 for(const child of branch.controls){
  const image=Object.values(child)[0];assert.equal(image.ignored,`(not ${image.visible})`);
 }
}
assert(!JSON.stringify(hud.kt_effect_icons).includes('"ignored"'),'Persistent effect controls must keep receiving later title changes');
let pruningCases=0,maxSelectedControls=0;
function conservedProjection(text,expectedImages,maxControls){
 const before=projectedPacket(text,false),after=projectedPacket(text,true);
 assert.deepEqual(after.images,before.images,'Creation pruning changed visible output for '+text);
 assert.equal(after.images.length,expectedImages);
 assert(after.retained.length<=maxControls,'Unselected heavy branches survived for '+text);
 maxSelectedControls=Math.max(maxSelectedControls,after.retained.length);pruningCases++;
}
let formattedProgressCases=0;
for(const lead of ['','§r','§r§f','§a§r','§r§0§r§0']){
 for(let n=0;n<112;n++){
  const text=lead+progressPacket(n)+'§r';
  assert(packetVisible(text));assert.deepEqual(shownCursors(text),[n]);formattedProgressCases++;
  conservedProjection(text,2,4);
 }
 const end=lead+'KT_HUD!END;§r';
 assert(!packetVisible(end));assert.deepEqual(shownCursors(end),[]);
 conservedProjection(end,0,1);
}
for(const text of ['普通提示','§r其他模組提示','KG_HUD!END;',slotsPacket([null,null,null])])
 assert.deepEqual(shownCursors(text),[]);
assert.equal(progressPacket(-10),progressPacket(0));assert.equal(progressPacket(Infinity),progressPacket(0));
assert.equal(progressPacket(200),progressPacket(111));
const colors=SHAKER_HUD_COLORS;
let cases=0;
for(let a=0;a<17;a++)for(let b=0;b<17;b++)for(let c=0;c<17;c++){
 const indices=[a,b,c],packet=slotsPacket(indices.map(n=>n?{color:colors[n-1]}:null));
 assert.equal(packet,GRAPHICAL_HUD_PREFIX+'S:'+indices.map((n,i)=>slotToken(i,n)).join(''));
 assert.equal(packet.replace(/§[0-9a-fr]/g,''),packet);
 assert(!/textures\/|ktmix:/.test(packet));
 for(const lead of ['','§r','§r§f','§a§r','§r§0§r§0'])conservedProjection(lead+packet+'§r',3,5);
 cases++;
}
for(const text of ['', '普通提示', '§r其他模組提示', 'KG_HUD!F:661I:5a011;', 'KG_HUD!END;'])conservedProjection(text,0,1);
assert(hudSendDue(undefined,'active',0));assert(!hudSendDue({key:'active',tick:0},'active',9));
assert(hudSendDue({key:'active',tick:0},'active',10));
for(let tick=0;tick<256;tick++)assert(!hudSendDue({key:'active',tick:0},undefined,tick));
const hide=adapter.split('export function hideShakerHud')[1].split('\n}')[0];
assert(hide.includes('last.delete(player.id)'));
assert(!/setActionBar|setTitle/.test(hide),'Leaving a target must not clear a foreign Actionbar');
const clear=adapter.split('export function clearShakerPlayer')[1].split('\n}')[0];
assert(!/\bsend\(|setActionBar|setTitle/.test(clear));
const barrel=adapter.split('export function showBarrelHud')[1].split('\n}')[0];
assert(!barrel.includes('HUD_PREFIX'));
assert(barrel.includes("send(player,'barrel/'+JSON.stringify(rawtext),{rawtext})"));
assert(barrel.includes('if(!barrelHudEnabled(player))return;'));
assert(read('runtime/BP/scripts/bedrock/mixology.js').includes('clearShakerPlayer(playerId)'));
console.log(JSON.stringify({hudStaticChecks:'passed',slotCases:cases,progressStates:112,formattedProgressCases,pruningCases,packetDefinitionControls:167,maxSelectedControls,idleSamples:256,literalImageReferences:textures,clientTested:false}));

assert(!controls.some(c=>c.status),'Barrel text must use only the native actionbar, not an expiring duplicate label');
