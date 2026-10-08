/** Real ItemStack/container and placed PUT recovery observer, without players.
 * Imported only by the disposable run_living_effects.py host overlay.
 */
import {world,system,ItemStack,ItemLockMode,BlockPermutation} from '@minecraft/server';
import {runtimeRegistry} from './main.js';
import {migrateShakerSlot} from './bedrock/mixology.js';
import {emptyShaker} from './core/mixology.js';
import {SHAKER_ID,ACTIVE_SHAKER,POURING_SHAKER,PORTABLE_DATA,encodePortable} from './core/immersion.js';
import {canonical} from './core/util.js';

const pause=ticks=>new Promise(resolve=>system.runTimeout(resolve,ticks));
const out=(kind,data)=>console.log('[LIVING_EFFECT_QA] '+JSON.stringify({kind,...data}));
const check=(ok,message)=>{if(!ok)throw Error(message);};
// This paired probe is deliberately pinned to the W108 checkout used by CI.
const ADDON_SOURCE='kaleidoscope_world_liquor',ADDON_VERSION='0.1.108';
function addonRegistration(){
 const row=runtimeRegistry()?.list().find(entry=>entry.source===ADDON_SOURCE);
 check(row,'real World Liquor addon registration absent');
 check(row.version===ADDON_VERSION,'World Liquor descriptor version mismatch: '+row.version);
 return row;
}
let playerSessions=0;world.afterEvents.playerSpawn.subscribe(()=>{playerSessions++;out('failure',{error:'player session is forbidden'});});
function observed(item){
 return canonical({name:item.nameTag,lore:item.getRawLore(),destroy:item.getCanDestroy(),place:item.getCanPlaceOn(),
  keep:item.keepOnDeath,lock:item.lockMode,properties:Object.fromEntries(item.getDynamicPropertyIds().map(id=>[id,item.getDynamicProperty(id)]))});
}
world.afterEvents.worldLoad.subscribe(()=>system.runTimeout(async()=>{try{
 const d=world.getDimension('overworld');d.runCommand('tickingarea add circle 0 300 0 2 migration_qa true');
 let loaded=false;for(let i=0;i<60&&!loaded;i++){await pause(5);try{loaded=!!d.getBlock({x:0,y:300,z:0});}catch{}}
 check(loaded,'chunks did not load');
 const phase=world.getDynamicProperty('qa:migration_phase')==='saved'?'restart':'first',block=d.getBlock({x:0,y:300,z:0});
 // Like the living-effects observer, wait for the real host/addon handshake;
 // merely listing both packs in the world does not prove script registration.
 for(let i=0;i<60&&!runtimeRegistry()?.list().some(row=>row.source===ADDON_SOURCE);i++)await pause(5);
 out('case',{mode:'addon_registration',phase,...addonRegistration()});
 if(phase==='first')block.setType('minecraft:chest');
 const container=block.getComponent('minecraft:inventory').container;
 if(phase==='first'){
  for(const [index,type]of [ACTIVE_SHAKER,POURING_SHAKER].entries()){
   const item=new ItemStack(type);item.nameTag='Saved native shaker '+index;
   item.setLore([{text:'Personal note'},{rawtext:[{text:'§b'},{translate:'item.kaleidoscope_tavern:shaker.name'}]}]);
   item.setDynamicProperty(PORTABLE_DATA,encodePortable(emptyShaker(),'native-migration-'+index));
   // These namespace examples are all in the HOST BP UUID scope. This probe
   // does not claim visibility/preservation of another pack's private data.
   for(const [id,value]of Object.entries({label:'owner',number:7.5,flag:true,position:{x:1.25,y:-2,z:3.5}}))item.setDynamicProperty('migration_metadata:'+id,value);
   item.setCanDestroy(['minecraft:stone','minecraft:dirt']);item.setCanPlaceOn(['minecraft:glass']);
   item.keepOnDeath=true;item.lockMode=index?ItemLockMode.slot:ItemLockMode.inventory;
   container.setItem(index,item);const before=observed(container.getItem(index));
   check(migrateShakerSlot(container,index),'legacy slot was not migrated');
   const actual=container.getItem(index);check(actual.typeId===SHAKER_ID&&actual.amount===1,'canonical item identity mismatch');
   check(observed(actual)===before,'native metadata changed across ID migration');
   check(migrateShakerSlot(container,index)===false,'migration was not idempotent');
   world.setDynamicProperty('qa:migration_expected_'+index,before);
   out('case',{mode:'native-cross-id',source:type,target:actual.typeId,lock:actual.lockMode,adventureLists:actual.getCanDestroy().length+actual.getCanPlaceOn().length,rawLore:true,hostScopeDynamicTypes:4});
  }
 }else{
  for(let index=0;index<2;index++){
   const item=container.getItem(index);check(item.typeId===SHAKER_ID&&item.amount===1,'saved identity mismatch');
   check(observed(item)===world.getDynamicProperty('qa:migration_expected_'+index),'saved metadata mismatch');
   check(migrateShakerSlot(container,index)===false,'saved migration rewrote a current item');
   out('case',{mode:'saved-metadata',slot:index,lock:item.lockMode});
  }
 }
 const station=d.getBlock({x:4,y:300,z:0}),put='kaleidoscope_tavern:put_visual';
 for(let attempt=0;attempt<2;attempt++){
  station.setPermutation(BlockPermutation.resolve('kaleidoscope_tavern:shaker_station',{'kaleidoscope_tavern:facing':0,[put]:1}));
  await pause(18);check(station.permutation.getState(put)===0,'stale PUT did not recover/rearm');
 }
 out('case',{mode:'native-put-recovery',phase,activations:2,idleCallbacksMeasured:false});
 if(phase==='first')world.setDynamicProperty('qa:migration_phase','saved');
 check(playerSessions===0&&world.getAllPlayers().length===0,'player sessions occurred');
 out('done',{phase,players:0,playerSessions:0,client:false,crossPackPrivateData:false,addon_registration:addonRegistration()});
}catch(error){out('failure',{error:String(error),stack:error.stack});}},100));
