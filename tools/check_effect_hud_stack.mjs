/** Read-only audit of actual active addons. Routing handles are display adapters, not players. */
import assert from 'node:assert/strict';
import {readFileSync,existsSync,writeFileSync} from 'node:fs';
import vm from 'node:vm';
import {EFFECT_ICON_PREFIX,effectIconPacket} from '../runtime/BP/scripts/core/effect-icons.js';
import {EFFECT_ICONS} from '../runtime/BP/scripts/data/effect-icons.js';
const [inventoryPath,outputPath]=process.argv.slice(2);
if(!inventoryPath)throw Error('Usage: node tools/check_effect_hud_stack.mjs inventory.json [report.json]');
const inventory=JSON.parse(readFileSync(inventoryPath)),packs=inventory.packs;
const get=id=>{const pack=packs.find(p=>p.uuid===id);assert(pack,'Required deployed addon not inventoried: '+id);return pack;};
const queue=get('2d4fb75b-c854-460b-a2f5-b4639e11eaa6'),amw=get('994f73a2-05ec-41ce-876c-d388a526d9f5');
const read=(p,file)=>readFileSync(p.directory+'/'+file,'utf8');
const source=read(queue,'scripts/UI.js'),main=read(queue,'scripts/main.js');
assert(main.includes('handleUILoad')&&main.includes('ui_load_script'));
assert(source.includes('world.getEntity(data[0])')&&source.includes('s.message.substring(data[0].length + 1)'));
const output=[],routes=new Map(['route-a','route-b'].map(id=>[id,{id,onScreenDisplay:{setTitle:(packet,options)=>output.push({id,packet,options})}}]));
const context=vm.createContext({world:{getEntity:id=>routes.get(id)},system:{runInterval:fn=>context.interval=fn}});
vm.runInContext(source.replace(/^import[^\n]*\n/gm,'').replace(/export /g,'')+'\nthis.route=handleUILoad;',context);
const iconA=effectIconPacket({entries:[{id:'kaleidoscope_tavern:vision',ticks:400,amplifier:0}]}),iconB=effectIconPacket({entries:[{id:'kaleidoscope_world_liquor:multi_jump',ticks:200,amplifier:0}]});
const foreign='textures/ui/magic_menu/examplemagic_main';
context.route({id:'ui_load_script:magic_main',message:'route-a|'+foreign});
context.route({id:'ui_load_script:kt_effect_icons',message:'route-a|'+iconA});
context.route({id:'ui_load_script:kt_effect_icons',message:'route-b|'+iconB});
for(let n=0;n<14;n++)context.interval();
assert.equal(output.filter(p=>p.id==='route-a'&&p.packet===foreign).length,4,'Foreign queue work is retained');
assert.equal(output.filter(p=>p.id==='route-a'&&p.packet===iconA).length,4);
assert.equal(output.filter(p=>p.id==='route-b'&&p.packet===iconB).length,4);
for(const p of output.filter(p=>p.packet.startsWith(EFFECT_ICON_PREFIX))){assert.equal(p.packet.replace(/§[0-9a-fkr]/g,''),'');assert.equal(p.options.stayDuration,0);}
const amwUI=JSON.parse(read(amw,'ui/magic_hud_screen.json')),controls=amwUI.root_panel.controls[0].data_control_magic.controls;
const updates=[];
for(const c of controls){
 const data=Object.values(c)[0];for(const b of data.bindings??[]){
  if(b.target_property_name==='#visible'){
   const variable=/\$[a-z_0-9]+/.exec(b.source_property_name)?.[0];if(!variable)continue;
   const suffix=amwUI.root_panel.controls[0].data_control_magic[variable];assert(typeof suffix==='string');updates.push(suffix);
  }
 }
}
assert(updates.length>10);
for(const suffix of updates){assert(!iconA.includes(suffix)&&!iconB.includes(suffix)&&!EFFECT_ICON_PREFIX.includes(suffix),'Tavern packet must not update AMW caches');}
assert(!foreign.startsWith(EFFECT_ICON_PREFIX),'AMW cannot update Tavern cache');
const hud=JSON.parse(readFileSync(new URL('../runtime/RP/ui/hud_screen.json',import.meta.url),'utf8'));
assert(!('hud_title_text' in hud)&&!('mob_effects_renderer' in hud));
assert(hud.root_panel.modifications.every(m=>m.operation==='insert_back'));
const liquor=get('a610b357-ba70-5a2f-bca5-5a7a8a0fb2a8');
const missingWorldSprites=EFFECT_ICONS.filter(x=>x.id.startsWith('kaleidoscope_world_liquor:')&&!existsSync(liquor.directory+'/'+x.texture+'.png')).map(x=>x.id);
const report={schema:1,ok:missingWorldSprites.length===0,active_packs:packs.length,routing_targets:2,queue_replays:12,foreign_queue_work_preserved:true,visible_transport_glyphs:0,amw_cache_filters_checked:updates.length,actionbar_writes:0,native_effect_control_replacements:0,queue_adapter_verified:true,missing_world_sprites:missingWorldSprites,client:false,simulated_players:false,scope:'Static active-stack audit and real queue-code adapter execution; no rendered client claim.'};
if(outputPath)writeFileSync(outputPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
