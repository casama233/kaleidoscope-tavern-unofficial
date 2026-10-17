/** Native dedicated-server save/restart probe. No players, bots or SimulatedPlayer API.
 * The production shaker definition, identity helpers and ledger are copied unchanged.
 * The complete outer shaker is native; its ingredients are the existing plain
 * identity schema, not nested ItemStacks or arbitrary ingredient metadata.
 * Empty custom-component registration only permits instantiation: this does not
 * test player input, shaker gameplay callbacks, rendering or full Ardent Heat.
 */
import {world,system,ItemStack,ItemTypes,Potions,EnchantmentTypes} from '@minecraft/server';
import {NativeItemStorage,NATIVE_ITEM_ENTITY,nativeItemKey} from './core/native-item-storage.js';
import {canonical} from './core/util.js';
import {PORTABLE_DATA,encodePortable,decodePortable} from './core/immersion.js';
import {emptyShaker} from './core/mixology.js';
import {potionInput,restorePotion} from './bedrock/potions.js';
import {captureStackableIngredient,restoreStackableIngredient} from './core/ingredient-metadata.js';
const KEY='kt:pickup_smoke/native',POSITION={x:0,y:70,z:0};
const SHAKER='kaleidoscope_tavern:shaker',SHAKER_KEY='kt:pickup_smoke/shaker_carrier',SHAKER_POSITION={x:3,y:70,z:0};
const STAGE='kt:pickup_smoke/stage',EXPECTED='kt:pickup_smoke/expected',SHAKER_EXPECTED='kt:pickup_smoke/shaker_expected',POTIONS_EXPECTED='kt:pickup_smoke/potions_expected';
const storage=new NativeItemStorage({backend:world,findEntity:id=>world.getEntity(id),createEntity:(d,p)=>d.spawnEntity(NATIVE_ITEM_ENTITY,p),makeStack:(id,n)=>new ItemStack(id,n),token:()=>String(world.getAbsoluteTime())});
const check=(condition,message)=>{if(!condition)throw Error(message);};
let playerSessions=0;
world.afterEvents.playerSpawn.subscribe(()=>{playerSessions++;});
system.beforeEvents.startup.subscribe(event=>{
 event.itemComponentRegistry.registerCustomComponent('kaleidoscope_tavern:portable_shaker',{});
});
function shape(s){
 if(!s)return null;
 const potion=s.getComponent('minecraft:potion'),contents=s.getComponent('minecraft:inventory')?.container,rules=contents?.containerRules;
 return {type:s.typeId,amount:s.amount,weight:s.weight,localizationKey:s.localizationKey,name:s.nameTag,
  lore:s.getLore(),rawLore:s.getRawLore(),keepOnDeath:s.keepOnDeath,lockMode:s.lockMode,
  destroy:s.getCanDestroy(),place:s.getCanPlaceOn(),
  properties:s.getDynamicPropertyIds().sort().map(k=>[k,s.getDynamicProperty(k)]),
  damage:s.getComponent('minecraft:durability')?.damage,
  enchantments:s.getComponent('minecraft:enchantable')?.getEnchantments().map(e=>[e.type.id,e.level]).sort((a,b)=>a[0].localeCompare(b[0])),
  potion:potion?{effect:potion.potionEffectType.id,delivery:potion.potionDeliveryType.id}:undefined,
  inventory:contents?{size:contents.size,weight:contents.weight,containerRules:rules?{allowedItems:rules.allowedItems,bannedItems:rules.bannedItems,allowNestedStorageItems:rules.allowNestedStorageItems,weightLimit:rules.weightLimit??null}:null,items:Array.from({length:contents.size},(_,i)=>shape(contents.getItem(i)))}:undefined};
}
function save(plan){try{plan.apply();}catch(e){plan.rollback();throw e;}plan.finish();}
function namedPotion(effectId,index){
 const effect=Potions.getEffectType(effectId),delivery=Potions.getDeliveryType('Consume');check(effect&&delivery,'potion registry '+effectId);
 const potion=Potions.resolve(effect,delivery);check(potion.typeId==='minecraft:potion'&&potion.amount===1&&potion.maxAmount===1,'native non-stackable Consume potion');
 potion.nameTag='原生藥水 '+index;potion.setLore([{rawtext:[{text:'slot '+index+' '},{translate:potion.localizationKey.replace(/^%/,'')}]},{text:'foreign potion lore'}]);
 potion.setDynamicProperty('kt:payload','nested potion '+index);potion.keepOnDeath=index===1;
 return potion;
}
function preparedShaker(){
 check(ItemTypes.get(SHAKER),'production shaker definition missing from native ItemTypes');
 const original=new ItemStack(SHAKER,1);
 check(!original.hasComponent('minecraft:inventory'),'production carrier must not use the rejected nested inventory');
 original.nameTag='三份原料雪克杯';original.setLore([{rawtext:[{text:'原生保存 '},{text:'outer carrier'}]},{text:'foreign shaker lore'}]);
 original.setDynamicProperty('kt:payload','outer metadata');original.keepOnDeath=true;
 original.setCanDestroy(['minecraft:stone']);original.setCanPlaceOn(['minecraft:dirt']);
 const potions=['minecraft:healing','minecraft:swiftness','minecraft:poison'].map(id=>Potions.resolve(Potions.getEffectType(id),Potions.getDeliveryType('Consume')));
 const state={...emptyShaker(),revision:3,slots:potions.map(item=>potionInput(item))},potionsExpected=potions.map(shape);
 original.setDynamicProperty(PORTABLE_DATA,encodePortable(state,'native_carrier_smoke'));
 const decoded=decodePortable(original.getDynamicProperty(PORTABLE_DATA));
 check(decoded.state.slots.length===3&&canonical(decoded.state.slots.map(restorePotion).map(shape))===canonical(potionsExpected),'plain potion identity roundtrip failed before carrier storage');
 let decoratedRejected=false;try{potionInput(namedPotion('minecraft:healing',9));}catch(e){decoratedRejected=String(e.message??e).includes('POTION_METADATA_UNSUPPORTED');}
 check(decoratedRejected,'decorated potion must be rejected before conversion to plain identity');
 const expected=shape(original),copy=original.clone();
 check(canonical(shape(copy))===canonical(expected),'shaker clone did not retain all native fields');
 // The native carrier preserves its outer metadata and encoded plain schema.
 // No nested ingredient container is accessed or claimed.
 original.setDynamicProperty(PORTABLE_DATA,encodePortable(emptyShaker(),'mutated_source'));
 original.nameTag='mutated source shaker';original.setLore(['changed source']);original.setDynamicProperty('kt:payload','changed outer');original.keepOnDeath=false;
 check(canonical(shape(copy))===canonical(expected),'shaker clone aliases the source metadata or encoded identities');
 return {copy,expected,potionsExpected,decoratedRejected};
}
function adventureIngredientMetadata(){
 const make=(id,n)=>new ItemStack(id,n),original=make('minecraft:sugar',2);
 original.nameTag='Native Adventure ingredient';original.setLore([{text:'Retain the native block names'}]);
 original.setCanDestroy(['minecraft:stone']);original.setCanPlaceOn(['minecraft:dirt']);
 const nativeLists={canDestroy:original.getCanDestroy(),canPlaceOn:original.getCanPlaceOn()};
 const captured=captureStackableIngredient(original,make),key='kt:pickup_smoke/adventure_ingredient';
 // Native getters may return bare IDs and expand legacy block variants.
 // Require the actual nonempty native lists intact, including stone/dirt;
 // qualify only the membership assertion, never saved metadata or its order.
 const blockIds=values=>Array.isArray(values)?values.map(value=>value.includes(':')?value:'minecraft:'+value):values;
 check(blockIds(nativeLists.canDestroy)?.includes('minecraft:stone')&&blockIds(nativeLists.canPlaceOn)?.includes('minecraft:dirt'),'native Adventure fixture has no requested block permissions '+JSON.stringify(nativeLists));
 check(canonical(captured.canDestroy)===canonical(nativeLists.canDestroy)&&canonical(captured.canPlaceOn)===canonical(nativeLists.canPlaceOn),'native Adventure block lists were not captured intact '+JSON.stringify(captured));
 const previous=world.getDynamicProperty(key),restarting=world.getDynamicProperty(STAGE)===1;
 check(restarting?typeof previous==='string':previous===undefined,'native Adventure saved metadata missing or wrong phase');
 const saved=restarting?JSON.parse(previous):captured;
 check(canonical(saved)===canonical(captured),'native Adventure metadata changed across restart');
 const restored=restoreStackableIngredient(original.typeId,saved,make);
 check(original.isStackableWith(restored)&&restored.isStackableWith(original),'native Adventure ingredient equality failed');
 if(!restarting)world.setDynamicProperty(key,JSON.stringify(captured));
 return {type:original.typeId,canDestroy:captured.canDestroy,canPlaceOn:captured.canPlaceOn,nativeEquality:true,savedMetadata:restarting};
}
/** Underlying native command only. No fabricated player passed to effect code. */
async function nativeBlockDrops(d){
 const beforeRule=world.gameRules.doTileDrops,results=[];
 const rows=[['minecraft:stone','minecraft:cobblestone',8],['minecraft:deepslate','minecraft:cobbled_deepslate',12],['minecraft:netherrack','minecraft:netherrack',16]];
 const query={type:'minecraft:item',location:{x:7,y:300,z:7},volume:{x:11,y:6,z:3}};
 try{
  // Clearing natural terrain can leave bamboo falling into an open test area.
  // Build the floor, walls and ceiling before enabling any measured block drops.
  world.gameRules.doTileDrops=false;
  check(world.gameRules.doTileDrops===false,'native drop room preparation rule mismatch '+JSON.stringify({requestedRule:false,ruleReadback:world.gameRules.doTileDrops}));
  const shell=d.runCommand('fill 6 299 6 18 306 10 minecraft:bedrock');
  const interior=d.runCommand('fill 7 300 7 17 305 9 minecraft:air');
  check(shell.successCount>0&&interior.successCount>0,'native drop room preparation rejected '+JSON.stringify({shell:shell.successCount,interior:interior.successCount,ruleReadback:world.gameRules.doTileDrops}));
  await system.waitTicks(2);
  for(const enabled of [true,false]){
   world.gameRules.doTileDrops=enabled;
   for(const [type,drop,x]of rows){
    const position={x,y:300,z:8};
    for(const item of d.getEntities(query))item.remove();
    d.getBlock(position).setType(type);
    const result=d.runCommand(`setblock ${x} 300 8 minecraft:air destroy`),destroyed=d.getBlock(position).isAir;
    await system.waitTicks(2);
    const drops=d.getEntities(query),items=drops.map(e=>e.getComponent('minecraft:item')?.itemStack);
    const observation={block:type,position,doTileDrops:enabled,ruleReadback:world.gameRules.doTileDrops,successCount:result.successCount,destroyed,
     entityCount:drops.length,itemCount:items.reduce((n,s)=>n+(s?.amount??0),0),
     items:items.map((s,i)=>({type:s?.typeId??null,amount:s?.amount??null,entityId:drops[i].id,location:drops[i].location}))};
    const diagnostic=JSON.stringify({...observation,expectedDrop:enabled?{type:drop,amount:1}:null});
    check(result.successCount>0&&destroyed,'native destroy rejected '+diagnostic);
    check(observation.ruleReadback===enabled,'native doTileDrops rule changed '+diagnostic);
    check(items.every(Boolean),'native dropped item component missing '+diagnostic);
    check(enabled?items.length>0&&items.every(s=>s.typeId===drop)&&observation.itemCount===1:items.length===0,'native doTileDrops='+enabled+' mismatch '+diagnostic);
    results.push(observation);
    for(const item of drops)item.remove();
   }
  }
 }finally{world.gameRules.doTileDrops=beforeRule;}
 return results;
}
function noPlayers(){check(playerSessions===0&&world.getAllPlayers().length===0,'native probe requires zero player sessions');}
function retired(key,d,position){
 check(world.getDynamicProperty(nativeItemKey(key))===undefined,'ledger not retired '+key);
 check(storage.readAdopted({key,dimension:d,position})===undefined,'native-required marker not retired '+key);
 check(d.getEntities({type:NATIVE_ITEM_ENTITY,location:position,maxDistance:1.5}).length===0,'helper not retired '+key);
}
world.afterEvents.worldLoad.subscribe(()=>{
 const d=world.getDimension('overworld');
 try{d.runCommand('tickingarea add circle 0 70 0 2 kt_pickup_smoke');}catch{}
 system.runTimeout(async()=>{
  try{
   noPlayers();const adventureIngredient=adventureIngredientMetadata();
   if(world.getDynamicProperty(STAGE)!==1){
    const destruction=await nativeBlockDrops(d);
    // Keep the original sword/potion ledger regression alongside the new case.
    const sword=new ItemStack('minecraft:diamond_sword',1);sword.nameTag='原生保存測試';sword.setLore(['custom lore']);sword.setCanDestroy(['minecraft:stone']);sword.setCanPlaceOn(['minecraft:dirt']);sword.setDynamicProperty('kt:payload','exact');sword.getComponent('minecraft:durability').damage=17;sword.getComponent('minecraft:enchantable').addEnchantment({type:EnchantmentTypes.get('sharpness'),level:2});
    const potion=namedPotion('minecraft:healing',0);
    for(const [oldIds,nextIds,incoming]of [[[],[sword.typeId],sword],[[sword.typeId],[sword.typeId,potion.typeId],potion]])save(storage.plan({key:KEY,dimension:d,position:POSITION,oldIds,nextIds,incoming}));
    const shaker=preparedShaker();
    save(storage.plan({key:SHAKER_KEY,dimension:d,position:SHAKER_POSITION,oldIds:[],nextIds:[SHAKER],nextItems:[shaker.copy]}));
    // Native ledger must itself retain a copy, independent of the provided item.
    shaker.copy.nameTag='changed after native ledger write';shaker.copy.setDynamicProperty(PORTABLE_DATA,encodePortable(emptyShaker(),'mutated_after_write'));
    const adopted=storage.readAdopted({key:SHAKER_KEY,dimension:d,position:SHAKER_POSITION});
    check(canonical(shape(adopted.items[0]))===canonical(shaker.expected),'native ledger aliases the supplied shaker');
    world.setDynamicProperty(EXPECTED,canonical([shape(sword),shape(potion)]));world.setDynamicProperty(SHAKER_EXPECTED,canonical(shaker.expected));world.setDynamicProperty(POTIONS_EXPECTED,canonical(shaker.potionsExpected));
    noPlayers();world.setDynamicProperty(STAGE,1);
    console.warn('KT_PICKUP_SMOKE_STAGE1_OK '+JSON.stringify({items:[shape(sword),shape(potion)],shaker:shaker.expected,plainPotionIdentities:shaker.potionsExpected,decoratedPotionInputRejected:shaker.decoratedRejected,adventureIngredient,ingredientStorage:'encoded_plain_identity',nativeNestedIngredientStorage:false,destruction,records:[JSON.parse(world.getDynamicProperty(nativeItemKey(KEY))),JSON.parse(world.getDynamicProperty(nativeItemKey(SHAKER_KEY)))],playerSessions,players:world.getAllPlayers().length,portableShakerGameplayCallbacksTested:false,fullArdentEffectTested:false}));
   }else{
    const plan=storage.plan({key:KEY,dimension:d,position:POSITION,oldIds:['minecraft:diamond_sword','minecraft:potion'],nextIds:[],give:[{id:'minecraft:diamond_sword',count:1},{id:'minecraft:potion',count:1}]});
    const actual=plan.outputs.map(o=>shape(o.stack));check(canonical(actual)===world.getDynamicProperty(EXPECTED),'native metadata changed across server restart');
    const shakerPlan=storage.plan({key:SHAKER_KEY,dimension:d,position:SHAKER_POSITION,oldIds:[SHAKER],nextIds:[],give:[{id:SHAKER,count:1}]});
    check(shakerPlan.outputs.length===1&&shakerPlan.outputs[0].exact===true,'native shaker withdrawal must return its exact stack');
    const carrier=shakerPlan.outputs[0].stack,shaker=shape(carrier);check(canonical(shaker)===world.getDynamicProperty(SHAKER_EXPECTED),'outer shaker metadata changed across server restart');
    const carried=decodePortable(carrier.getDynamicProperty(PORTABLE_DATA)),restored=carried.state.slots.map(restorePotion).map(shape);
    check(carried.state.slots.length===3&&canonical(restored)===world.getDynamicProperty(POTIONS_EXPECTED),'plain potion identities changed across server restart');
    save(plan);save(shakerPlan);retired(KEY,d,POSITION);retired(SHAKER_KEY,d,SHAKER_POSITION);noPlayers();
    console.warn('KT_PICKUP_SMOKE_STAGE2_OK '+JSON.stringify({items:actual,shaker,plainPotionIdentities:restored,adventureIngredient,ingredientStorage:'encoded_plain_identity',nativeNestedIngredientStorage:false,retiredLedgers:[KEY,SHAKER_KEY],playerSessions,players:world.getAllPlayers().length,portableShakerGameplayCallbacksTested:false}));
   }
  }catch(e){console.error('KT_PICKUP_SMOKE_FAILED '+String(e.name??'Error')+': '+String(e.message??e)+'\n'+String(e.stack??''));}
 },80);
});
