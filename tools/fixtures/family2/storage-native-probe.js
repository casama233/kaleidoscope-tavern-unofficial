// TEST COPY ONLY. Uses real native blocks/entities/ItemStacks. No fake player.
import {world,system,ItemStack,EnchantmentType} from '@minecraft/server';
import {stationContainer,retireEmptyStationContainer,inspectStationStorage,storageKey,STORAGE_OWNER,quarantineStation} from './family_station_storage.js';
import {occupiedGrillSlots} from './a2740_grill_state_adapter.js';
import {rackContainer,readRackItems,writeRackItems,readRackFilters,writeRackFilters} from './a2746_rack_state_adapter.js';
import {encodeRackStack,readRackPayloadItem} from './a2746_rack_item_codec.js';
const ROOT='family2_native_acceptance',G='kaleidoscope_grilling:grill',R='kaleidoscope_grilling:advanced_rack_block';
const d=()=>world.getDimension('overworld');
const pos=(x)=>({x,y:65,z:4});
const block=(x)=>d().getBlock(pos(x));
function assert(ok,message){if(!ok)throw Error(message)}
function emit(stage,facts){console.warn('[FAMILY2-STORAGE] '+JSON.stringify({stage,pass:true,players:world.getAllPlayers().length,...facts}))}
function run(f){try{assert(world.getAllPlayers().length===0,'Unexpected real player');f()}catch(e){console.error('[FAMILY2-STORAGE] '+JSON.stringify({pass:false,error:String(e),stack:e.stack}))}}
function setup(x,id){const p=pos(x);d().getBlock({...p,y:64}).setType('minecraft:stone');block(x).setType(id);return block(x)}
const snapshot=c=>Array.from({length:c.size},(_,i)=>encodeRackStack(c.getItem(i)));
function rejects(f,message){let rejected=false;try{f()}catch{rejected=true}assert(rejected,message)}
function tagged(id,amount=1){const s=new ItemStack(id,amount);s.nameTag='原生儲存 Native '+amount;s.setLore(['保存測試','metadata survives restart']);return s}
function phaseOne(){
 const g=setup(0,G),r=setup(4,R),gc=stationContainer(g),rc=rackContainer(r);
 assert(gc.size===3&&rc.size===9,'Wrong native inventory sizes');
 ['raw_beef_skewer','raw_fish_skewer','raw_lamb_skewer'].forEach((n,i)=>gc.setItem(i,tagged('kaleidoscope_grilling:'+n)));
 const sword=tagged('kaleidoscope_cookery:diamond_kitchen_knife');sword.getComponent('minecraft:durability').damage=37;
 sword.getComponent('minecraft:enchantable').addEnchantment({type:new EnchantmentType('unbreaking'),level:2});
 sword.setDynamicProperty('family2_native_metadata','測試');sword.setDynamicProperty('family2_vector',{x:1,y:2,z:3});
 sword.setCanDestroy(['minecraft:stone']);sword.setCanPlaceOn(['minecraft:dirt']);
 rc.setItem(8,sword);rc.setItem(0,tagged('kaleidoscope_grilling:empty_seasoning_bottle')); 
 const filters=Array(9).fill(null);filters[8]={kind:'tool',category:'exact',typeId:'kaleidoscope_cookery:diamond_kitchen_knife'};
 assert(writeRackFilters(r,filters),'Filters not written');
 assert(occupiedGrillSlots(g)===3,'Real grill adapter cannot see the backing items');
 const value={grill:snapshot(gc),rack:snapshot(rc),filters:readRackFilters(r),grillEntity:inspectStationStorage(g).entity,rackEntity:inspectStationStorage(r).entity};
 world.setDynamicProperty(ROOT,JSON.stringify(value));
 assert(JSON.stringify(value)===world.getDynamicProperty(ROOT),'Probe persistence marker failed');
 emit('first-save',{slots:[gc.size,rc.size],grillOccupied:3,rackOccupied:2,metadata:value.rack[8],entityCount:d().getEntities({families:['kg_storage_inventory']}).length});
}
function phaseTwo(){
 const old=JSON.parse(world.getDynamicProperty(ROOT)),g=block(0),r=block(4),gc=stationContainer(g),rc=rackContainer(r);
 assert(JSON.stringify(snapshot(gc))===JSON.stringify(old.grill),'Grill contents changed across restart');
 assert(JSON.stringify(snapshot(rc))===JSON.stringify(old.rack),'Rack metadata changed across restart');
 assert(JSON.stringify(readRackFilters(r))===JSON.stringify(old.filters),'Filters changed across restart');
 assert(inspectStationStorage(g).entity===old.grillEntity&&inspectStationStorage(r).entity===old.rackEntity,'Native inventory ID changed');
 assert(d().getEntities({families:['kg_storage_inventory']}).length===2,'Duplicate or extra helpers after restart');
 assert(occupiedGrillSlots(g)===3&&readRackItems(r)[8].typeId==='kaleidoscope_cookery:diamond_kitchen_knife','Actual adapters mismatch');
 emit('restart',{sameNativeIds:true,exactItemMetadata:true,entityCount:2});
 const target=setup(8,R),c=stationContainer(target),key=storageKey(target),ledger=world.getDynamicProperty(key);
 const record=JSON.parse(ledger),entity=world.getEntity(record.entity),owner=entity.getDynamicProperty(STORAGE_OWNER);
 c.setItem(8,new ItemStack('minecraft:iron_ingot',2));
 world.setDynamicProperty(key,'{');rejects(()=>stationContainer(target),'Corrupt ledger accepted');assert(world.getDynamicProperty(key)==='{','Corrupt ledger reset');world.setDynamicProperty(key,ledger);
 entity.setDynamicProperty(STORAGE_OWNER,JSON.stringify({...JSON.parse(owner),token:'wrong'}));rejects(()=>stationContainer(target),'Wrong owner accepted');entity.setDynamicProperty(STORAGE_OWNER,owner);
 rejects(()=>retireEmptyStationContainer(target),'Live station retired');
 target.setType('minecraft:air');rejects(()=>retireEmptyStationContainer(block(8)),'Nonempty inventory retired');assert(c.getItem(8).amount===2,'Failed retirement lost contents');
 c.setItem(8,undefined);assert(retireEmptyStationContainer(block(8)),'Empty retirement failed');assert(world.getDynamicProperty(key)===undefined,'Retired ledger remains');
 const missing=setup(12,R),mc=stationContainer(missing),mk=storageKey(missing),mr=world.getDynamicProperty(mk);
 mc.setItem(0,new ItemStack('minecraft:diamond',1));world.getEntity(JSON.parse(mr).entity).remove();
 const before=d().getEntities({families:['kg_storage_inventory']}).length;
 rejects(()=>stationContainer(missing),'Missing helper silently regenerated');assert(world.getDynamicProperty(mk)===mr,'Missing helper ledger overwritten');assert(d().getEntities({families:['kg_storage_inventory']}).length===before,'Missing helper replaced by empty one');
 const q=setup(16,R),qc=stationContainer(q);qc.setItem(1,new ItemStack('minecraft:emerald',1));quarantineStation(q,'native failure test');
 rejects(()=>stationContainer(q),'Quarantined inventory exposed');assert(qc.getItem(1).typeId==='minecraft:emerald','Quarantine destroyed contents');
 emit('failure-guards',{corruptLedgerRefused:true,wrongOwnerRefused:true,nonemptyRetirementRefused:true,missingHelperNotRecreated:true,quarantinedContentsPreserved:true,missingHelperWasDeliberatelyDestroyedInTest:true});
 // Real explosion event reaches the production break routes; no fabricated player event.
 const eg=setup(22,G),ec=stationContainer(eg);ec.setItem(0,new ItemStack('kaleidoscope_grilling:raw_beef_skewer',1));
 const er=setup(28,R),erc=stationContainer(er);erc.setItem(8,tagged('kaleidoscope_cookery:diamond_kitchen_knife'));
 const saved=encodeRackStack(erc.getItem(8));
 d().createExplosion({x:22.5,y:65.3,z:4.5},4,{breaksBlocks:true});d().createExplosion({x:28.5,y:65.3,z:4.5},4,{breaksBlocks:true});
 system.runTimeout(()=>run(()=>{
  assert(block(22).typeId==='minecraft:air'&&block(28).typeId==='minecraft:air','Explosion did not remove stations');
  const items=d().getEntities({type:'minecraft:item',location:{x:25.5,y:65,z:4.5},maxDistance:14}).map(e=>e.getComponent('minecraft:item')?.itemStack).filter(Boolean);
  const grillDrops=items.filter(s=>s.typeId===G),rackDrops=items.filter(s=>s.typeId==='kaleidoscope_grilling:advanced_rack');
  assert(grillDrops.length===1&&rackDrops.length===1,'Missing or duplicate station drops');
  assert(items.filter(s=>s.typeId==='kaleidoscope_grilling:raw_beef_skewer').reduce((n,s)=>n+s.amount,0)===1,'Grill drop conservation failed');
  assert(JSON.stringify(encodeRackStack(readRackPayloadItem(rackDrops[0]).items[8]))===JSON.stringify(saved),'Packed rack explosion metadata lost');
  assert(world.getDynamicProperty(storageKey(block(22)))===undefined&&world.getDynamicProperty(storageKey(block(28)))===undefined,'Explosion inventory retirement incomplete');
  emit('native-explosion',{singleStationDrops:true,grillItemsConserved:true,rackPackedMetadataConserved:true});
 }),20);
}
world.afterEvents.worldLoad.subscribe(()=>{
 system.run(()=>run(()=>{if(world.getDynamicProperty(ROOT)===undefined)d().runCommand('tickingarea add circle 12 65 4 3 family2_native')}));
 system.runTimeout(()=>run(()=>{if(world.getDynamicProperty(ROOT)===undefined)phaseOne();else phaseTwo()}),120);
});
