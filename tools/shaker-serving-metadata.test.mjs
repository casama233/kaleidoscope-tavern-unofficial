/** Read-only production serving callback + transaction checks with API doubles.
 * No native Minecraft player, engine, client, audio or saved-world acceptance.
 */
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {pathToFileURL,fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../',import.meta.url));
const imp=p=>import(pathToFileURL(root+'/runtime/BP/scripts/'+p).href);
const core=await imp('core/mixology.js');
const immersion=await imp('core/immersion.js');
const inventory=await imp('core/inventory.js');
const {check,canonical,clone}=await imp('core/util.js');
const {Locks}=await imp('core/storage.js');
const {cupBlock}=await imp('core/extension-content.js');
const source=readFileSync(root+'/runtime/BP/scripts/bedrock/mixology.js','utf8');
const transactions=readFileSync(root+'/runtime/BP/scripts/bedrock/transactions.js','utf8');
function span(text,start,end){
 const first=text.indexOf(start),last=text.indexOf(end,first);
 assert(first>=0&&last>first,'Missing production function span: '+start);
 return text.slice(first,last).replaceAll('export ','');
}
const functions=
 span(source,'export function readPortableItem','function resultItem')+
 span(source,'function commitBlock','function replaceHeld')+
 span(source,'export function pourHeldShakerNow','export function syncCupVisual')+
 span(transactions,'export function commitPickupInventory','export function hand');
class Item{
 constructor(typeId,amount=1){
  Object.assign(this,{typeId,amount,maxAmount:1,data:{},lore:[],nameTag:undefined,enchantments:[],canPlaceOn:[],canDestroy:[]});
 }
 clone(){
  return Object.assign(new Item(this.typeId,this.amount),structuredClone({data:this.data,lore:this.lore,nameTag:this.nameTag,enchantments:this.enchantments,canPlaceOn:this.canPlaceOn,canDestroy:this.canDestroy}));
 }
 getDynamicProperty(key){return this.data[key];}
 setDynamicProperty(key,value){this.data[key]=value;}
 getRawLore(){return structuredClone(this.lore);}
 getLore(){return this.lore;}
 setLore(value){this.lore=structuredClone(value);}
 isStackableWith(){return false;}
}
const metadata=item=>canonical({nameTag:item.nameTag,foreign:item.data['foreign:marker'],lore:item.lore,enchantments:item.enchantments,canPlaceOn:item.canPlaceOn,canDestroy:item.canDestroy});
const readyState={
 schema:1,revision:4,
 slots:Array(3).fill(0).map(()=>({item:'kaleidoscope_tavern:plum_wine_q4',container:'kaleidoscope_tavern:empty_bottle',color:0xff5555,effects:[]})),
 result:{item:'kaleidoscope_tavern:bloody_mary',carrier:core.EMPTY_CUP,recipeId:'kaleidoscope_tavern:shaker/bloody_mary'}
};
function fixture(failure){
 const properties=new Map(),events=[];
 const actor={id:'probe',selectedSlotIndex:0,dimension:{id:'minecraft:overworld'}};
 const block={
  typeId:'kaleidoscope_tavern:cup_empty_glassware',dimension:actor.dimension,
  location:{x:0,y:0,z:0},permutation:{id:'empty',states:{}},
  setPermutation(value){events.push('permutation');this.permutation=value;this.typeId=value.id;}
 };
 const oldCup={schema:1,revision:0,item:core.EMPTY_CUP,facing:0};
 const key=core.cupKey(actor.dimension.id,block.location);
 properties.set(key,JSON.stringify(oldCup));
 let failed=false;
 const backend={
  getDynamicProperty:key=>properties.get(key),
  setDynamicProperty(key,value){
   if(failure==='save'&&!failed){failed=true;throw Error('injected save');}
   if(value===undefined)properties.delete(key);else properties.set(key,value);
  }
 };
 const cupStore=new core.MixStore(backend,core.validateCup);
 const original=new Item(immersion.SHAKER_ID);
 original.nameTag='Retain';
 original.setDynamicProperty('foreign:marker','Keep');
 original.setDynamicProperty(immersion.PORTABLE_DATA,immersion.encodePortable(readyState,'fixture'));
 original.lore=['Custom',{rawtext:[{translate:'foreign.text'}]}];
 original.enchantments=[{id:'unbreaking',level:3}];
 original.canPlaceOn=['minecraft:stone'];
 original.canDestroy=['minecraft:dirt'];
 const slots=[original,undefined];
 const before=canonical(slots.map(item=>item?.clone()));
 const container={
  size:2,
  // Native inventory reads and writes are independent copies, not live aliases.
  getItem:index=>slots[index]?.clone(),
  setItem(index,value){
   events.push('inventory');
   if(failure==='inventory'&&!failed){failed=true;throw Error('injected inventory');}
   slots[index]=value?.clone();
  }
 };
 const context=vm.createContext({
  ...core,...immersion,...inventory,check,canonical,clone,Locks,cupBlock,
  ItemTypes:{get:()=>true},SHAKER:immersion.SHAKER_ID,cupStore,locks:new Locks(),
  near:()=>{},idle:()=>{},hand:()=>container.getItem(0),inventory:()=>container,
  makeStack:(id,count)=>new Item(id,count),getCup:()=>cupStore.load(key),
  perm:(id,facing)=>({id,states:{facing}}),
  waterSnapshot:block=>({typeId:block.typeId,permutation:block.permutation}),
  setWithWater:(block,value)=>block.setPermutation(value),
  restoreWater:(block,saved)=>{block.typeId=saved.typeId;block.permutation=saved.permutation;},
  syncCupVisual:()=>events.push('visual'),playWorldSound:()=>events.push('sound'),
  cocktailEffect:()=>events.push('particle'),hideShakerHud:()=>events.push('hide'),
  preparePickupOverflow:()=>{}
 });
 vm.runInContext(functions+'\nglobalThis.api={pourHeldShakerNow,portableLore};',context);
 return {context,actor,block,slots,original,oldCup,key,properties,before,events};
}
const rows=[];
for(const failure of [null,'save','inventory']){
 const f=fixture(failure);
 let error;
 try{f.context.api.pourHeldShakerNow(f.actor,f.block);}catch(caught){error=caught;}
 if(failure){
  assert.match(String(error),/injected/);
  assert.equal(canonical(f.slots.map(item=>item?.clone())),f.before);
  assert.equal(f.block.typeId,'kaleidoscope_tavern:cup_empty_glassware');
  assert.equal(f.properties.get(f.key),JSON.stringify(f.oldCup));
  assert.ok(!f.events.includes('sound'));
  assert.ok(!f.events.includes('particle'));
 }else{
  assert.equal(error,undefined);
  assert.equal(metadata(f.slots[0]),metadata(f.original));
  assert.equal(core.validateShaker(JSON.parse(f.slots[0].data[immersion.PORTABLE_DATA]).state).result,null);
  assert.equal(f.block.typeId,'kaleidoscope_tavern:cup_bloody_mary');
  assert.equal(JSON.parse(f.properties.get(f.key)).item,'kaleidoscope_tavern:bloody_mary');
  assert.equal(f.events.filter(event=>event==='sound').length,1);
  assert.equal(f.events.filter(event=>event==='particle').length,1);
 }
 rows.push({name:'production serving '+(failure??'success'),passed:true,events:f.events});
}
{
 const f=fixture(null);
 const carried=JSON.parse(f.original.data[immersion.PORTABLE_DATA]);
 const raw=f.context.api.portableLore(carried.state);
 f.original.lore=raw.map(row=>({rawtext:row.rawtext.map(value=>Object.fromEntries(Object.entries(value).reverse()))}));
 f.slots[0]=f.original;
 f.context.api.pourHeldShakerNow(f.actor,f.block);
 assert.equal(f.slots[0].lore.length,0);
 assert.equal(f.slots[0].nameTag,f.original.nameTag);
 assert.equal(f.slots[0].data['foreign:marker'],'Keep');
 rows.push({name:'owned result lore removed by production serving callback',passed:true,events:f.events});
}
console.log(JSON.stringify({
 root,scope:'Exact production callback/transaction functions and real core transaction/state modules with API doubles only',
 cases:rows.length,passed:rows.filter(row=>row.passed).length,rows,nativeEngine:false,client:false,simulatedPlayers:false
},null,2));
