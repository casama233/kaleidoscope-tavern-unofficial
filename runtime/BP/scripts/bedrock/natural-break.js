import {restorePotion} from './potions.js';
/** Non-player destruction: native engine decides whether the block breaks.
 * This component releases stored items and removes state/helpers after destruction.
 */
import {world,system,ItemStack} from '@minecraft/server';
import {barrelCells} from '../core/machines.js';
import {furnitureBlock,itemId,GLASSWARE_SLOTS} from '../core/furniture.js';
import {boardRuntimeKey,chalkCenter} from '../core/boards.js';
import {cupItem,isBottleBlock} from '../core/extension-content.js';
import {naturalCupStack,naturalShakerStack} from './mixology.js';
const NS='kaleidoscope_tavern',seen=new Map();
const at=p=>`${p.x}_${p.y}_${p.z}`;
const state=(permutation,key,fallback=0)=>permutation.getState(NS+':'+key)??fallback;
function removeBlock(d,p,id){try{const b=d.getBlock(p);if(b?.typeId===id)b.setType('minecraft:air');}catch{}}
function clearHelpers(d,origin,keys){
 for(const entity of d.getEntities({location:origin,maxDistance:5})){
  if(!entity.typeId.startsWith(NS+':')&&!entity.hasTag(NS+':visual_helper'))continue;
  try{
   const match=entity.getDynamicPropertyIds().some(k=>{const value=entity.getDynamicProperty(k);if(typeof value!=='string')return false;if(keys.some(key=>value===key||value.startsWith(key+'/')))return true;try{const p=JSON.parse(value)?.position;return p&&p.x===origin.x&&p.y===origin.y&&p.z===origin.z;}catch{return false;}});
   if(match)entity.remove();
  }catch{}
 }
}
export function naturalBreak(event,params){
 const {block,brokenBlockPermutation:perm}=event,d=block.dimension,id=perm.type.id,p={...block.location},short=id.slice(NS.length+1),dim=d.id.split(':')[1];
 let root={...p},cells=[],drop=params?.params?.drop??id;
 const drops=[],keys=[];
 const add=(item,count=1)=>{if(item&&count>0)drops.push(new ItemStack(item,count));};
 if(short==='barrel_part')root={x:p.x-state(perm,'dx'),y:p.y-state(perm,'dy'),z:p.z-state(perm,'dz')};
 if(short==='barrel_core'||short==='barrel_part'){
  cells=barrelCells(root).map(pos=>({pos,id:pos.core?NS+':barrel_core':NS+':barrel_part'}));drop=NS+':barrel';
 }else if(short.endsWith('_pendant_lamp')){
  root.y+=state(perm,'half')===0?0:1;cells=[{pos:root,id},{pos:{...root,y:root.y-1},id}];
 }else if(short.endsWith('_sandwich_board')||short==='chalkboard'||short==='stepladder'){
  root.y-=state(perm,'half');
  if(short==='chalkboard')root=chalkCenter(root,state(perm,'position'),perm.getState('minecraft:cardinal_direction'));
  const wide=short==='chalkboard'&&state(perm,'position')!==0;
  const v={north:{x:1,z:0},east:{x:0,z:1},south:{x:-1,z:0},west:{x:0,z:-1}}[perm.getState('minecraft:cardinal_direction')]??{x:0,z:0};
  for(let x=wide?-1:0;x<=(wide?1:0);x++)for(let y=0;y<2;y++)cells.push({pos:{x:root.x+v.x*x,y:root.y+y,z:root.z+v.z*x},id});
  if(wide){add(id,2);} // Three single boards form a wide board.
  if(short!=='stepladder')keys.push(boardRuntimeKey(d.id,root));
 }
 if(cells.length){const key=d.id+'/'+at(root)+'/'+drop;if(seen.get(key)===system.currentTick)return;seen.set(key,system.currentTick);for(const [k,t]of seen)if(t<system.currentTick-1)seen.delete(k);}
 const suffix=dim+'/'+at(root),record=(key)=>{keys.push(key);const raw=world.getDynamicProperty(key);return typeof raw==='string'?JSON.parse(raw):undefined;};
 let data;
 if(short==='barrel_core'||short==='barrel_part'||short==='pressing_tub'){
  data=record('kt:machine/'+suffix);if(data?.kind==='pressing_tub')for(const row of data.slots.filter(Boolean))add(row.id,row.count);
 }else if(short==='shaker_station'){
  data=record('kt:shaker/'+suffix);if(data){drops.push(naturalShakerStack(data));drop=undefined;}
 }else if(cupItem(id)){
  data=record('kt:cup/'+suffix);if(data){drops.push(naturalCupStack(data));drop=undefined;}else drop=cupItem(id);
 }else if(isBottleBlock(id)&&short!=='bottle_empty'&&short!=='bottle_water'){
  data=record('kt:bottles/'+suffix);if(data){for(const item of data.items)add(item);drop=undefined;}
 }else if(short==='potion_bottle'||short==='xp_bottle'){
  data=record('kt:vanillaBottleDisplays/'+d.id+'/'+at(root));if(data?.item==='minecraft:potion'){drops.push(restorePotion(data));drop=undefined;}else drop=short==='xp_bottle'?'minecraft:experience_bottle':undefined;
 }else if(params?.params?.storage){
  const key='kt:extension_storage/'+id.replace(':','/')+'/'+suffix;data=record(key);
  if(data&&!data.deleted&&!data.prepared)for(const item of data.slots??[data.left,data.right])add(item);
 }else if(['holder','tilted_rack','circular_rack','cellar_cabinet','bar_cabinet','glass_bar_cabinet'].includes(short)){
  const key=['bar_cabinet','glass_bar_cabinet'].includes(short)?'kt:bar_cabinet/'+dim+'/'+short+'/'+at(root):'kt:'+short+'/'+suffix;
  data=record(key);if(data){for(const item of data.slots??(short==='holder'?[data.item]:[data.left,data.right]))add(item);}
 }
 if(short==='glassware_holder')add(NS+':empty_glassware',GLASSWARE_SLOTS.filter(k=>perm.getState(k)===1).length);
 const f=furnitureBlock(id);if(f)drop=itemId(f);
 if(short==='bottle_empty')drop=NS+':empty_bottle';if(short==='bottle_water'){drops.push(restorePotion({item:'minecraft:potion',potion:{effectId:'minecraft:water',deliveryId:'Consume'}}));drop=undefined;}
 // Consume authoritative state before emitting drops; subsequent multi-part
 // destruction callbacks cannot duplicate inventory. Liquids are lost, as Java.
 if(drop)add(drop);
 for(const key of keys){
  if(key.startsWith('kt:extension_storage/')&&data)world.setDynamicProperty(key,JSON.stringify({schema:1,type:data.type,layout:data.layout,revision:data.revision+1,deleted:true,...(data.migrationDigest?{migrationDigest:data.migrationDigest}:{})}));
  else world.setDynamicProperty(key,undefined);
 }
 for(const cell of cells)removeBlock(d,cell.pos,cell.id);
 clearHelpers(d,root,[...keys,`kt:seat/${d.id}/${at(root)}`]);
 if(event.entitySource?.typeId==='minecraft:player'&&event.entitySource.getGameMode()==='Creative'||world.gameRules.doTileDrops===false)return;
 for(const stack of drops)d.spawnItem(stack,{x:root.x+.5,y:root.y+.5,z:root.z+.5});
}
export function registerNaturalBreak({blockComponentRegistry}){
 blockComponentRegistry.registerCustomComponent(NS+':natural_break',{onBreak:(event,params)=>{try{naturalBreak(event,params);}catch(error){console.warn('[Tavern destruction] '+error);}}});
}
