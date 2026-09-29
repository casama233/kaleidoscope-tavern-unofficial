/** Native dedicated-server save/restart probe. No players, bots or SimulatedPlayer API. */
import {world,system,ItemStack,Potions,EnchantmentTypes} from '@minecraft/server';
import {NativeItemStorage,NATIVE_ITEM_ENTITY,nativeItemKey} from './core/native-item-storage.js';
const KEY='kt:pickup_smoke/native',POSITION={x:0,y:70,z:0};
const storage=new NativeItemStorage({backend:world,findEntity:id=>world.getEntity(id),createEntity:(d,p)=>d.spawnEntity(NATIVE_ITEM_ENTITY,p),makeStack:(id,n)=>new ItemStack(id,n),token:()=>String(world.getAbsoluteTime())});
function shape(s){return {type:s.typeId,amount:s.amount,name:s.nameTag,lore:s.getLore(),destroy:s.getCanDestroy(),place:s.getCanPlaceOn(),properties:s.getDynamicPropertyIds().sort().map(k=>[k,s.getDynamicProperty(k)]),damage:s.getComponent('minecraft:durability')?.damage,enchantments:s.getComponent('minecraft:enchantable')?.getEnchantments().map(e=>[e.type.id,e.level]),potion:s.getComponent('minecraft:potion')?.potionEffectType.id};}
const check=(condition,message)=>{if(!condition)throw Error(message);};
world.afterEvents.worldLoad.subscribe(()=>{
 const d=world.getDimension('overworld');
 try{d.runCommand('tickingarea add circle 0 70 0 1 kt_pickup_smoke');}catch{}
 system.runTimeout(()=>{
  try{
   if(world.getDynamicProperty('kt:pickup_smoke/stage')!==1){
    const sword=new ItemStack('minecraft:diamond_sword',1);sword.nameTag='原生保存測試';sword.setLore(['custom lore']);sword.setCanDestroy(['minecraft:stone']);sword.setCanPlaceOn(['minecraft:dirt']);sword.setDynamicProperty('kt:payload','exact');sword.getComponent('minecraft:durability').damage=17;sword.getComponent('minecraft:enchantable').addEnchantment({type:EnchantmentTypes.get('sharpness'),level:2});
    const effect=Potions.getAllEffectTypes().find(x=>/healing/i.test(x.id)),delivery=Potions.getDeliveryType('Consume');check(effect&&delivery,'potion registry');const potion=Potions.resolve(effect,delivery);potion.nameTag='原生藥水';potion.setLore(['potion lore']);
    for(const [oldIds,nextIds,incoming]of [[[],[sword.typeId],sword],[[sword.typeId],[sword.typeId,potion.typeId],potion]]){const plan=storage.plan({key:KEY,dimension:d,position:POSITION,oldIds,nextIds,incoming});try{plan.apply();}catch(e){plan.rollback();throw e;}plan.finish();}
    world.setDynamicProperty('kt:pickup_smoke/expected',JSON.stringify([shape(sword),shape(potion)]));world.setDynamicProperty('kt:pickup_smoke/stage',1);
    console.warn('KT_PICKUP_SMOKE_STAGE1_OK '+JSON.stringify({items:[shape(sword),shape(potion)],record:JSON.parse(world.getDynamicProperty(nativeItemKey(KEY)))}));
   }else{
    const plan=storage.plan({key:KEY,dimension:d,position:POSITION,oldIds:['minecraft:diamond_sword','minecraft:potion'],nextIds:[],give:[{id:'minecraft:diamond_sword',count:1},{id:'minecraft:potion',count:1}]});
    const actual=plan.outputs.map(o=>shape(o.stack));check(JSON.stringify(actual)===world.getDynamicProperty('kt:pickup_smoke/expected'),'native metadata changed across server restart');
    plan.apply();plan.finish();check(world.getDynamicProperty(nativeItemKey(KEY))===undefined,'ledger not retired');check(d.getEntities({type:NATIVE_ITEM_ENTITY,location:POSITION,maxDistance:2}).length===0,'helper not retired');
    console.warn('KT_PICKUP_SMOKE_STAGE2_OK '+JSON.stringify({items:actual,players:world.getAllPlayers().length}));
   }
  }catch(e){console.error('KT_PICKUP_SMOKE_FAILED '+String(e.stack??e));}
 },80);
});
