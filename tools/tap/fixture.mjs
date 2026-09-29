/** Deterministic script API double; NOT native BDS or a simulated player. */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";
const ROOT=fileURLToPath(new URL('../../runtime/BP/scripts/',import.meta.url));
const NS='kaleidoscope_tavern',EMPTY=NS+':bottle_empty',ITEM=NS+':empty_bottle';
const no=()=>{},empty=()=>[];

export async function fixture({synchronous=false,detachedBlockHandles=false}={}){
 const records=new Map(),jobs=new Map(),blocks=new Map(),entities=[],changes=[],sounds=[],particles=[];
 let nextJob=1,naturalBreak,failWrite,failBlock,serial=0;
 const system={currentTick:0,runTimeout(fn,delay=1){const id=nextJob++;jobs.set(id,{fn,tick:this.currentTick+Math.max(1,delay)});return id;},run(fn){return this.runTimeout(fn,1);},clearRun(id){jobs.delete(id);}};
 function advance(ticks=1){for(let n=0;n<ticks;n++){system.currentTick++;for(const[id,job]of [...jobs])if(job.tick<=system.currentTick){jobs.delete(id);job.fn();}}}
 const world={gameRules:{doTileDrops:true},getDynamicProperty:k=>records.get(k),setDynamicProperty(k,value){if(failWrite?.(k,value)){failWrite=undefined;throw Error('injected storage failure');}if(value===undefined)records.delete(k);else records.set(k,value);}};
 class Permutation{
  constructor(id,states={}){this.type={id};this.states={...states};}
  getState(k){return this.states[k];}
  getItemStack(){return this.type.id==='minecraft:air'?undefined:new ItemStack(this.type.id===EMPTY?ITEM:this.type.id==='minecraft:redstone_wire'?'minecraft:redstone':this.type.id);}
  withState(k,v){return new Permutation(this.type.id,{...this.states,[k]:v});}
  canContainLiquid(){return true;}
  static resolve(id,states={}){return new Permutation(id,id==='minecraft:furnace'||id==='test:result_block'?{'minecraft:cardinal_direction':'north',...states}:states);}
 }
 class ItemStack{
  constructor(id,amount=1){this.typeId=id;this.amount=amount;this.maxAmount=64;}
  clone(){return Object.assign(new ItemStack(this.typeId,this.amount),this);}
 }
 const coordinate=p=>`${p.x},${p.y},${p.z}`;
 const dimension={id:'minecraft:overworld',getBlock(p){const b=blocks.get(coordinate(p));return !b||!detachedBlockHandles?b:new Proxy(b,{get(t,k){const v=Reflect.get(t,k,t);return typeof v==='function'?v.bind(t):v;},set(t,k,v){return Reflect.set(t,k,v,t);}});},getEntities(query={}){return entities.filter(e=>!e.removed&&(!query.type||e.typeId===query.type)&&(!query.families||e.typeId!=='minecraft:item')&&(!query.volume||['x','y','z'].every(k=>e.location[k]>=query.location[k]&&e.location[k]<query.location[k]+query.volume[k])));},spawnItem(stack,location){const e={id:`item-${++serial}`,typeId:'minecraft:item',location:{...location},stack:stack.clone(),removed:false,hasTag:()=>false,getDynamicPropertyIds:empty,getComponent(id){return id==='minecraft:item'?{itemStack:this.stack.clone()}:undefined;},remove(){this.removed=true;}};entities.push(e);return e;},spawnEntity(typeId,location){const data=new Map(),e={id:`visual-${++serial}`,typeId,location,removed:false,hasTag:()=>false,getDynamicProperty:k=>data.get(k),setDynamicProperty:(k,v)=>data.set(k,v),getDynamicPropertyIds:()=>[...data.keys()],setProperty:no,setRotation:no,remove(){this.removed=true;}};entities.push(e);return e;},playSound(id,p,o){sounds.push({id,p,o,tick:system.currentTick});},spawnParticle(id,p,m){particles.push({id,p,m,tick:system.currentTick});}};
 function block(id,p,states={}){
  const b={dimension,location:{...p},permutation:Permutation.resolve(id,states),isWaterlogged:false,get typeId(){return this.permutation.type.id;},get isAir(){return this.typeId==='minecraft:air';},setWaterlogged(v){this.isWaterlogged=v;},setType(id){this.setPermutation(Permutation.resolve(id));},setPermutation(next){if(failBlock?.(this,next)){failBlock=undefined;throw Error('injected block failure');}const old=this.permutation;this.permutation=next;changes.push({p:{...this.location},from:old.type.id,to:next.type.id});if(old.type.id!==next.type.id&&old.type.id.startsWith(NS+':')&&naturalBreak){const event={block:this,brokenBlockPermutation:old};if(synchronous)naturalBreak(event,{});else system.run(()=>naturalBreak(event,{}));}}};blocks.set(coordinate(p),b);return b;
 }
 const stubs={
  'java-placement-router.js':{nativeEmptyHandBlockUse:no,registerJavaBlockUseHandler:no},
  'pressing-ingredients.js':{pressingIngredientVisuals:empty,configurePressingIngredients:no},
  'immersion.js':{feedback:no},
  'pressing-feedback.js':{pressFeedback:no,spawnRejectedIngredients:no,ingredientFeedback:no},
  'barrel-ingredients.js':{barrelIngredientVisuals:empty,configureBarrelIngredients:no},
  'protected-break-router.js':{registerProtectedBreakRoute:no},
  'transactions.js':{inventory:no},
  'tap-sources.js':{inspectTapSource:no,finishSourceTap:no},
  'potions.js':{restorePotion:()=>new ItemStack('minecraft:potion')},
  'mixology.js':{naturalCupStack:no,naturalShakerStack:no}
 };
 const context=vm.createContext({console:{warn:no,log:no},structuredClone,TextEncoder,TextDecoder});
 const modules=new Map();
 class MolangVariableMap{constructor(){this.values={};}setFloat(k,v){this.values[k]=v;}}
 const server={system,world,ItemStack,MolangVariableMap,ItemTypes:{get:id=>id!=='missing:item'?{id}:undefined},BlockTypes:{get:id=>['minecraft:stone','minecraft:dirt','minecraft:furnace','test:result_block','minecraft:redstone_wire'].includes(id)?{id}:undefined,getAll:()=>['minecraft:stone','minecraft:dirt','minecraft:furnace','test:result_block','minecraft:redstone_wire'].map(id=>({id}))},BlockPermutation:Permutation,GameMode:{Creative:'Creative',Adventure:'Adventure',Spectator:'Spectator'}};
 function synthetic(key,values){const m=new vm.SyntheticModule(Object.keys(values),function(){for(const[k,v]of Object.entries(values))this.setExport(k,v);},{context,identifier:key});modules.set(key,m);return m;}
 function load(id){if(modules.has(id))return modules.get(id);if(id==='@minecraft/server')return synthetic(id,server);const relative=path.relative(ROOT,id);if(relative.startsWith('bedrock'+path.sep)&&stubs[path.basename(id)])return synthetic(id,stubs[path.basename(id)]);const m=new vm.SourceTextModule(fs.readFileSync(id,'utf8'),{context,identifier:id});modules.set(id,m);return m;}
 const link=(specifier,referencing)=>load(specifier==='@minecraft/server'?specifier:path.resolve(path.dirname(referencing.identifier),specifier));
 async function importFile(relative){const m=load(path.join(ROOT,relative));if(m.status==='unlinked')await m.link(link);if(m.status==='linked')await m.evaluate();return m.namespace;}
 const machines=await importFile('bedrock/machines.js');naturalBreak=(await importFile('bedrock/natural-break.js')).naturalBreak;
 const {newMachine,barrelCells}=await importFile('core/machines.js');
 const {machineKey}=await importFile('core/storage.js');
 const {bottleKey}=await importFile('core/bottles.js');
 const origin={x:0,y:0,z:0};
 for(const p of barrelCells(origin))block(NS+(p.core?':barrel_core':':barrel_part'),p,{'minecraft:cardinal_direction':'north',[NS+':dx']:p.dx,[NS+':dy']:p.dy,[NS+':dz']:p.dz});
 const tap=block(NS+':tap',{x:0,y:1,z:-2},{'minecraft:block_face':'north',[NS+':open']:0});
 const bottle=block(EMPTY,{x:0,y:0,z:-2},{'minecraft:cardinal_direction':'east'});
 const state=newMachine('barrel','test-batch');state.open=false;state.batch={recipeId:NS+':wine',carrier:ITEM,remaining:4,quality:3,unitTime:2400,ticksRemaining:100,output:{byQuality:Array.from({length:6},(_,i)=>NS+':wine_q'+(i+1))}};
 const key=machineKey(dimension.id,origin),drinkKey=bottleKey(dimension.id,bottle.location);
 machines.TEST_ACCESS.store.save(key,state,-1);machines.setRegistry({});
 return {machines,block,dimension,bottle,tap,key,drinkKey,records,changes,sounds,particles,system,advance,ItemStack,Permutation,naturalBreak,importFile,
  state:()=>JSON.parse(records.get(key)),display:()=>records.has(drinkKey)?JSON.parse(records.get(drinkKey)):undefined,
  items:()=>entities.filter(e=>e.typeId==='minecraft:item'&&!e.removed).map(e=>e.stack),
  failStorage(fn){failWrite=fn;},failPermutation(fn){failBlock=fn;},writeState(s){records.set(key,JSON.stringify(s));}};
}
