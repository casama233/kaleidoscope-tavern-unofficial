/** Deterministic API-counting double. Not BDS, SimulatedPlayer, FPS or power data. */
export class Signal{listeners=[];subscribe(f){this.listeners.push(f);return f;}emit(e){for(const f of this.listeners)f(e);}}
const signals=()=>new Proxy({}, {get(o,k){return o[k]??=new Signal();}});
let sequence=0;
const dimensions=new Map();
export const counters={};
export function resetCounters(){for(const k of ['queries','propertyWrites','rotations','teleports','spawns','removes','playerReads','playerWrites','playerLists'])counters[k]=0;}
resetCounters();
class Properties{
 dp=new Map();props=new Map();
 getDynamicProperty(k){if(this.typeId==='minecraft:player')counters.playerReads++;return this.dp.get(k);}
 setDynamicProperty(k,v){if(this.typeId==='minecraft:player')counters.playerWrites++;if(this.failWrite){this.failWrite=false;throw Error('injected write failure');}if(v===undefined)this.dp.delete(k);else this.dp.set(k,v);}
 getProperty(k){return this.props.get(k);}
 setProperty(k,v){if(this.dimension?.failProperty){this.dimension.failProperty=false;throw Error('injected property failure');}counters.propertyWrites++;this.props.set(k,v);}
}
export class Entity extends Properties{
 constructor(typeId,dimension,location,rotation=0){super();this.id='e'+String(++sequence).padStart(8,'0');this.typeId=typeId;this.dimension=dimension;this.location={...location};this.rotation={x:0,y:rotation};this.isValid=true;this.tags=new Set();}
 addTag(t){this.tags.add(t);}hasTag(t){return this.tags.has(t);}
 getRotation(){return {...this.rotation};}setRotation(r){counters.rotations++;this.rotation={...r};}
 tryTeleport(p){counters.teleports++;if(this.failTeleport)return false;this.location={...p};return true;}
 remove(){this.isValid=false;this.dimension.entities.delete(this.id);counters.removes++;}
 getComponent(){return undefined;}
}
export class Player extends Entity{
 constructor(d,p={x:0,y:0,z:0}){super('minecraft:player',d,p);this.effects=[];this.isOnGround=false;this.isSprinting=false;this.inputPermissions={isPermissionCategoryEnabled:()=>true};}
 addEffect(id,ticks,options){this.effects.push({id,ticks,options});}
 getGameMode(){return GameMode.Survival;}
}
export class BlockPermutation{
 constructor(type,states={}){this.type={id:type};this.states={...states};}
 static resolve(type,states){return new BlockPermutation(type,states);}
 getState(k){return this.states[k];}withState(k,v){return new BlockPermutation(this.type.id,{...this.states,[k]:v});}
}
export class Dimension{
 constructor(id='minecraft:overworld'){this.id=id;this.entities=new Map();this.blocks=new Map();dimensions.set(id,this);}
 block(type,p={x:0,y:0,z:0},states={}){const block={typeId:type,dimension:this,location:{...p},permutation:BlockPermutation.resolve(type,states),setPermutation(v){this.permutation=v;this.typeId=v.type.id;}};this.blocks.set(JSON.stringify(p),block);return block;}
 getBlock(p){return this.blocks.get(JSON.stringify(p));}
 spawnEntity(type,at,options={}){const e=new Entity(type,this,at,options.initialRotation);this.entities.set(e.id,e);counters.spawns++;return e;}
 getEntities(options={}){counters.queries++;return [...this.entities.values()].filter(e=>e.isValid&&(!options.type||e.typeId===options.type)&&(!options.location||Math.hypot(...['x','y','z'].map(k=>e.location[k]-options.location[k]))<=(options.maxDistance??Infinity)));}
 spawnParticle(){}playSound(){}
}
export const world=Object.assign(new Properties(),{players:[],beforeEvents:signals(),afterEvents:signals(),getAllPlayers(){counters.playerLists++;return this.players;},getDimension(id){const full=id.startsWith('minecraft:')?id:'minecraft:'+id;return dimensions.get(full)??new Dimension(full);},getEntity(id){return this.players.find(p=>p.id===id)??[...dimensions.values()].map(d=>d.entities.get(id)).find(Boolean);},getAbsoluteTime(){return system.currentTick;}});
let runId=0;
export const system={currentTick:0,timers:new Map(),afterEvents:signals(),runInterval(fn,period){const id=runId++;this.timers.set(id,{fn,period});return id;},run(fn){const id=runId++;this.timers.set(id,{fn,once:true});return id;},runTimeout(fn){return this.run(fn);},clearRun(id){this.timers.delete(id);},sendScriptEvent(){}};
export const GameMode={Survival:'Survival',Creative:'Creative',Spectator:'Spectator',Adventure:'Adventure'};
export const EquipmentSlot={Head:'Head',Chest:'Chest',Legs:'Legs',Feet:'Feet',Mainhand:'Mainhand',Offhand:'Offhand'};
export const ScriptEventSource={Server:'Server'},EntityDamageCause={sonicBoom:'sonicBoom'},InputPermissionCategory={Camera:'Camera'};
export const ItemTypes={get:id=>({id}),getAll:()=>[]},Potions={},EffectTypes={getAll:()=>[]};
export class ItemStack{constructor(typeId,amount=1){this.typeId=typeId;this.amount=amount;}getComponent(){}clone(){return new ItemStack(this.typeId,this.amount);}}
export class MolangVariableMap{setFloat(){}setVector3(){}setColorRGB(){}setColorRGBA(){}}
export class ModalFormData{}
