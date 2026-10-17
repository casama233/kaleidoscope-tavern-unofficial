import {world,system,ItemStack,EnchantmentTypes} from '@minecraft/server';
import {NativeItemStorage,NATIVE_ITEM_ENTITY,NATIVE_STORAGE_OWNER,nativeItemKey} from './core/native-item-storage.js';
import {reanchorNativeStorageEntity,installNativeStoragePinning} from './bedrock/native-storage-pinning.js';
const KEY='kt:cellar_cabinet/overworld/0_66_0',POS={x:0,y:66,z:0},BLOCK='kaleidoscope_tavern:cellar_cabinet';
const STAGE='probe:reanchor_stage',EXPECTED='probe:reanchor_expected',TOKEN='kaleidoscope_tavern:storage_token';
const storage=new NativeItemStorage({backend:world,findEntity:id=>world.getEntity(id),createEntity:(d,p)=>d.spawnEntity(NATIVE_ITEM_ENTITY,p),makeStack:(id,n)=>new ItemStack(id,n),token:()=> 'synthetic-native-reanchor-token'});
const emit=row=>console.warn('[REANCHOR_QA] '+JSON.stringify(row));
const assert=(value,msg)=>{if(!value)throw Error(msg);};
function shape(item){return !item?null:{type:item.typeId,amount:item.amount,name:item.nameTag,lore:item.getLore(),destroy:item.getCanDestroy(),place:item.getCanPlaceOn(),dp:item.getDynamicPropertyIds().sort().map(k=>[k,item.getDynamicProperty(k)]),damage:item.getComponent('minecraft:durability')?.damage,enchantments:item.getComponent('minecraft:enchantable')?.getEnchantments().map(x=>[x.type.id,x.level]).sort()};}
function snapshot(entity){const c=entity.getComponent('minecraft:inventory').container;return JSON.stringify({record:world.getDynamicProperty(nativeItemKey(KEY)),required:world.getDynamicProperty('kt:native_required/'+KEY),owner:entity.getDynamicProperty(NATIVE_STORAGE_OWNER),token:entity.getDynamicProperty(TOKEN),items:Array.from({length:9},(_,i)=>shape(c.getItem(i)))});}
function displace(entity){
 const d=entity.dimension,target={x:.5,y:512,z:.5};
 try{entity.teleport(target,{dimension:d,keepVelocity:true});}catch{entity.addTag('native_reanchor_probe');d.runCommand('tp @e[type=kaleidoscope_tavern:stored_items,tag=native_reanchor_probe] 0.5 512 0.5');}
 assert(entity.location.y===512,'Native displacement to synthetic Y512 failed');
}
function recovery(entity){return reanchorNativeStorageEntity(entity,{storage,targetWorld:world});}
function refused(entity,code){const at={...entity.location},before=snapshot(entity);let error;try{recovery(entity);}catch(e){error=e;}
 assert(error?.code===code,'Unexpected refusal: '+String(error));assert(snapshot(entity)===before,'Refusal altered inventory or ledger');assert(JSON.stringify(entity.location)===JSON.stringify(at),'Refusal moved carrier');
}
function fail(e){emit({kind:'failure',name:e.name,message:String(e)+': '+String(e.message??''),stack:String(e.stack??''),players:world.getAllPlayers().length});}
world.afterEvents.worldLoad.subscribe(()=>{
 const dimension=world.getDimension('overworld');
 system.runTimeout(()=>{
  try{
   if(world.getDynamicProperty(STAGE)!==1){
    const block=dimension.getBlock(POS);assert(block,'Owner block chunk unavailable');block.setType(BLOCK);
    let ids=[];
    for(let i=0;i<9;i++){
     const item=new ItemStack('minecraft:diamond_sword',1);item.nameTag='Original native slot '+i;item.setLore(['opaque native lore '+i]);item.setDynamicProperty('probe:opaque',JSON.stringify({serial:i,foreign:['retained']}));item.setCanDestroy(['minecraft:stone']);item.setCanPlaceOn(['minecraft:dirt']);
     if(i===0){item.getComponent('minecraft:durability').damage=17;item.getComponent('minecraft:enchantable').addEnchantment({type:EnchantmentTypes.get('sharpness'),level:2});}
     const next=[...ids,item.typeId],plan=storage.plan({key:KEY,dimension,position:POS,oldIds:ids,nextIds:next,incoming:item});plan.apply();plan.finish();ids=next;
    }
    const record=JSON.parse(world.getDynamicProperty(nativeItemKey(KEY))),entity=world.getEntity(record.entity);assert(entity?.isValid,'Native actor not found');
    const original=snapshot(entity);entity.applyImpulse({x:.1,y:.2,z:.3});const velocityBefore={...entity.getVelocity()};displace(entity);assert(recovery(entity).status==='REANCHORED','Valid recovery did not succeed');assert(snapshot(entity)===original,'Original nine metadata stacks changed');assert(Math.abs(entity.getVelocity().x)+Math.abs(entity.getVelocity().y)+Math.abs(entity.getVelocity().z)<1e-6,'Recovery velocity retained');emit({kind:'case',name:'445.5 displacement and original nine metadata stacks',ok:true,velocityBefore,velocityAfter:{...entity.getVelocity()}});
    displace(entity);const token=entity.getDynamicProperty(TOKEN);entity.setDynamicProperty(TOKEN,'foreign-token');refused(entity,'NATIVE_STORAGE_WRONG_OWNER');entity.setDynamicProperty(TOKEN,token);recovery(entity);emit({kind:'case',name:'foreign token refuses movement and preserves data',ok:true});
    displace(entity);const c=entity.getComponent('minecraft:inventory').container,stack=c.getItem(1);c.setItem(1,undefined);refused(entity,'NATIVE_STORAGE_CONTENT_MISMATCH');c.setItem(1,stack);recovery(entity);emit({kind:'case',name:'one missing original slot refuses movement and preserves data',ok:true});
    displace(entity);block.setType('minecraft:air');refused(entity,'NATIVE_STORAGE_OWNER_BLOCK');block.setType(BLOCK);recovery(entity);emit({kind:'case',name:'missing owner block refuses movement and preserves data',ok:true});
    assert(snapshot(entity)===original,'Fixture restoration altered original metadata');world.setDynamicProperty(EXPECTED,original);world.setDynamicProperty(STAGE,1);displace(entity);
    emit({kind:'done',phase:'first',cases:4,players:world.getAllPlayers().length,persisted_displacement:entity.location.y===512});
   }else{
    const record=JSON.parse(world.getDynamicProperty(nativeItemKey(KEY))),entity=world.getEntity(record.entity);assert(entity?.isValid,'Restart native actor unavailable');assert(entity.location.y===512,'First phase displaced actor was not saved');assert(snapshot(entity)===world.getDynamicProperty(EXPECTED),'Metadata changed before restart recovery');
    installNativeStoragePinning(()=>undefined,{storage});let moved;
    try{storage.readAdopted({key:KEY,dimension,position:POS});}catch(e){moved=e;}
    assert(moved?.code==='NATIVE_STORAGE_MOVED','Strict read did not reject displaced actor');assert(entity.location.y===512,'Read path wrote before queued callback');
    system.runTimeout(()=>{try{const after=storage.readAdopted({key:KEY,dimension,position:POS});assert(after.entity.id===entity.id,'Recovery recreated actor');assert(snapshot(entity)===world.getDynamicProperty(EXPECTED),'Restart recovery modified nine original stacks or ledger');emit({kind:'case',name:'saved displaced actor queues after work and keeps metadata',ok:true});emit({kind:'done',phase:'restart',cases:1,players:world.getAllPlayers().length,original_actor_retained:true});}catch(e){fail(e);}},40);
   }
  }catch(e){fail(e);}
 },80);
});
