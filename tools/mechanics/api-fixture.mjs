/** Explicit deterministic API doubles. Not Minecraft players, simulated players,
 * engine physics, or native/network acceptance. Real runtime modules are loaded.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const ROOT=fileURLToPath(new URL('../../runtime/BP/scripts/',import.meta.url));
export async function effectsFixture({pvp=true,glowing=false}={}){
 const events=[],entities=[],sounds=[],particles=[],data=new Map();
 const system={currentTick:1,run(){return 1;},runInterval(){return 1;},runTimeout(){return 1;},sendScriptEvent(){}};
 const world={gameRules:{pvp},getAllPlayers:()=>entities.filter(e=>e.typeId==='minecraft:player'),getAbsoluteTime:()=>system.currentTick};
 const dimension={id:'minecraft:overworld',queries:[],getEntities(q={}){this.queries.push(q);return entities.filter(e=>!q.type||e.typeId===q.type);},playSound(...args){sounds.push(args);},spawnParticle(...args){particles.push(args);}};
 const no=()=>{};
 class ItemStack{constructor(typeId,amount=1){this.typeId=typeId;this.amount=amount;}clone(){return new ItemStack(this.typeId,this.amount);}}
 class MolangVariableMap{setFloat(){}}
 const server={world,system,InputPermissionCategory:{Camera:"Camera"},ItemStack,MolangVariableMap,EntityDamageCause:{sonicBoom:'sonicBoom'},GameMode:{Survival:'Survival',Adventure:'Adventure',Creative:'Creative',Spectator:'Spectator'},EquipmentSlot:{Mainhand:'Mainhand',Head:'Head',Chest:'Chest',Legs:'Legs',Feet:'Feet'},EffectTypes:{getAll:()=>glowing?[{getName:()=>'minecraft:glowing'}]:[]},ScriptEventSource:{Server:'Server'}};
 const context=vm.createContext({console:{log:no,warn:no},structuredClone,TextEncoder,TextDecoder});const modules=new Map();
 function load(id){if(modules.has(id))return modules.get(id);const m=id==='@minecraft/server'?new vm.SyntheticModule(Object.keys(server),function(){for(const[k,v]of Object.entries(server))this.setExport(k,v);},{context,identifier:id}):new vm.SourceTextModule(fs.readFileSync(id,'utf8'),{context,identifier:id});modules.set(id,m);return m;}
 async function get(relative){const m=load(path.join(ROOT,relative));if(m.status==='unlinked')await m.link((id,from)=>load(id==='@minecraft/server'?id:path.resolve(path.dirname(from.identifier),id)));if(m.status==='linked')await m.evaluate();return m.namespace;}
 function actor({id='caster',typeId='minecraft:player',mode='Survival',location={x:0,y:0,z:0},health=20,damageAccepted=true,extent={x:.3,y:.9,z:.3},center}={}){
  const properties=new Map(),effects=[];
  const e={id,typeId,dimension,location:{...location},isValid:true,isSneaking:false,getGameMode:()=>mode,getHeadLocation:()=>({...e.location,y:e.location.y+1.62}),getViewDirection:()=>({x:0,y:0,z:1}),getAABB:()=>({center:center??{...e.location,y:e.location.y+extent.y},extent}),hasTag:()=>false,getComponent:k=>k==='minecraft:health'?{currentValue:health,effectiveMax:health}:undefined,applyDamage(value,options){events.push({id,kind:'damage',value,options});return damageAccepted;},applyImpulse(value){events.push({id,kind:'impulse',value});},clearVelocity(){events.push({id,kind:'clearVelocity'});},tryTeleport(value){events.push({id,kind:'teleport',value});return true;},getDynamicProperty:k=>properties.get(k),setDynamicProperty:(k,v)=>properties.set(k,v),getEffect:k=>effects.find(row=>row.id===k),addEffect(id,duration,options){effects.push({id,duration,options});},effects};
  return e;
 }
 return {get,actor,events,entities,dimension,world,system,sounds,particles};
}
