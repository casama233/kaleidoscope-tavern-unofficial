/** Isolated native BDS fixture only. Never add this import to live runtime. */
import {world,system,ItemStack,ItemTypes,BlockPermutation} from '@minecraft/server';
import {ExtensionRegistry} from './core/registry.js';
import {SHAKER_RECIPES} from './data/mixology.js';
import {FLUIDS} from './data/fluids.js';
import {emptyShaker,addInput,inputSnapshot,finishShake} from './core/mixology.js';
import {configureBottleCategories,qualityBottleLore,isLegacyManagedQualityBottleLore,normalizeBottleStack} from './core/quality-tooltip.js';
import {isPlainIngredient} from './core/inventory.js';
import {PORTABLE_DATA,encodePortable,decodePortable} from './core/immersion.js';
const N='future_mixology_probe:',TAG='kaleidoscope_tavern:cocktail_ingredient_';
const check=(value,message)=>{if(!value)throw Error(message);};
system.runTimeout(()=>{try{
 const dimension=world.getDimension('overworld');
 dimension.runCommand('tickingarea add circle 0 100 0 1 universal_mixology_probe');
 system.runTimeout(()=>{try{
  const r=new ExtensionRegistry({recipes:SHAKER_RECIPES,fluids:FLUIDS,itemExists:item=>!!ItemTypes.get(item),itemTags:item=>new ItemStack(item).getTags()});
  check(new ItemStack(N+'native_red').hasTag(TAG+'red'),'actual native tag');
  r.install({api:1,source:'future_mixology_probe',version:'1.0.0',shakerInputs:[{item:N+'rgb_blue',color:0x5555ff}],itemTagChanges:[{item:N+'bottle_q6',add:[TAG+'blue'],remove:[TAG+'red']}],recipes:[{id:N+'mix',kind:'shaker',ingredients:[{tag:TAG+'red'},{tag:TAG+'blue'},{item:'minecraft:sugar'}],output:{item:'kaleidoscope_tavern:bloody_mary'}}],content:[{kind:'bottle',base:N+'bottle',block:N+'bottle_block',items:Array.from({length:6},(_,index)=>N+'bottle_q'+(index+1)),maxCount:4,visualKind:1999,color:'blue',effects:Array.from({length:6},()=>[])}]});
  for(const quality of [1,2,3]){let rejected=false;try{inputSnapshot(N+'bottle_q'+quality,r);}catch(error){rejected=error.code==='QUALITY_TOO_LOW';}check(rejected,'native quality '+quality);}
  for(const quality of [4,5,6])check(inputSnapshot(N+'bottle_q'+quality,r).color===0x5555ff,'derived native bottle '+quality);
  const restoreCategories=configureBottleCategories(item=>r.ingredientColor(item),item=>r.previousIngredientColors(item));
  const oldBottle=new ItemStack(N+'bottle_q6');oldBottle.setLore(qualityBottleLore(oldBottle,false,true,false,()=>({ingredientColor:TAG+'red',color:0xff5555,colorIgnored:false,translationKey:'color.kaleidoscope_tavern.red'})));
  check(isLegacyManagedQualityBottleLore(oldBottle)&&isPlainIngredient(oldBottle,id=>new ItemStack(id)),'native old colour lore accepted');
  check(normalizeBottleStack(oldBottle).getRawLore().some(line=>JSON.stringify(line).includes('color.kaleidoscope_tavern.blue')),'native colour lore migration');
  oldBottle.setLore([...oldBottle.getRawLore(),'Player custom lore']);check(!isPlainIngredient(oldBottle,id=>new ItemStack(id)),'native custom lore protected');restoreCategories();
  const inputs=[N+'native_red',N+'rgb_blue','minecraft:sugar'];
  let checks=0;for(const values of [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]]){check(r.findShaker(values.map(index=>({item:inputs[index]})))?.id===N+'mix','native order');checks++;}
  let state=emptyShaker();for(const item of inputs)state=addInput(state,item,r);
  check(finishShake(state,89,r.findShaker(state.slots),r).result.item==='kaleidoscope_tavern:bloody_mary','native named result');
  check(finishShake(state,68,undefined,r).result.item==='kaleidoscope_tavern:mystery_cocktail','native mystery band');
  const block=dimension.getBlock({x:0,y:100,z:0});check(block,'native chest chunk');
  const saved=block.getComponent('minecraft:inventory')?.container?.getItem(0);
  let restart=false;
  if(saved){const stored=decodePortable(saved.getDynamicProperty(PORTABLE_DATA));check(stored.state.slots.map(row=>row.item).join('|')===inputs.join('|'),'persistent native ItemStack data');check(r.findShaker(stored.state.slots)?.id===N+'mix','persistent foreign recipe');restart=true;}
  else{block.setPermutation(BlockPermutation.resolve('minecraft:chest'));const stack=new ItemStack('kaleidoscope_tavern:shaker');stack.setDynamicProperty(PORTABLE_DATA,encodePortable(state,'native_probe'));block.getComponent('minecraft:inventory').container.setItem(0,stack);}
  r.remove('future_mixology_probe');
  console.warn('[Universal mixology native] PASS '+JSON.stringify({realItemTags:true,rgbOnlyAddon:true,orderCases:checks,qualityCases:6,nativeItemStorage:true,oldLoreMigration:true,customLoreProtected:true,restart,simulatedPlayers:false,client:false}));
 }catch(error){console.error('[Universal mixology native] FAIL '+String(error)+' '+error.stack);}},60);
}catch(error){console.error('[Universal mixology native] FAIL '+String(error)+' '+error.stack);}},120);
