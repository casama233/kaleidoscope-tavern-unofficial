/** Reuse the archived deterministic engine double, loading CURRENT pack definitions.
 * These tests exercise scripts, not Minecraft client/BDS behaviour.
 */
import fs from 'node:fs/promises';
const fixture=new URL('../../history/pre-release-0.6.29/tests/fake-server.js',import.meta.url);
export async function resolve(specifier,context,next){
 if(specifier==='@minecraft/server')return {url:fixture.href,shortCircuit:true};
 if(specifier==='@minecraft/server-ui')return {url:new URL('../../history/pre-release-0.6.29/tests/fake-ui.js',import.meta.url).href,shortCircuit:true};
 return next(specifier,context);
}
export async function load(url,context,next){
 if(url!==fixture.href)return next(url,context);
 let source=await fs.readFile(fixture,'utf8');
 source=source.replace('const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));',"const root=fileURLToPath(new URL('../../../',import.meta.url));");
 source=source.replaceAll('minecraft:consumable','Consume').replaceAll("minecraft:splash'","ThrownSplash'").replaceAll("minecraft:lingering'","ThrownLingering'");
 source+=`
// Explicit test-only fixture additions for World Liquor and current stable API.
// Keep the archived fake-server immutable. Its old delivery IDs and missing
// Entity.isValid/getRotation do not describe the current production API.
potionDeliveries.clear();
for(const [id,item]of [['Consume','minecraft:potion'],['ThrownSplash','minecraft:splash_potion'],['ThrownLingering','minecraft:lingering_potion']])potionDeliveries.set(id,item);
Object.defineProperty(Entity.prototype,'isValid',{get(){return !this.removed;}});
Object.defineProperty(Player.prototype,'isValid',{get(){return !this.removed;}});
// spawnEntity and setRotation already store this.rotation in the archived double.
Entity.prototype.getRotation=function(){return {...(this.rotation??{x:0,y:0})};};
export const EffectTypes={getAll:()=>[]};
export const InputPermissionCategory={Camera:'Camera',Movement:'Movement'};
export class BlockVolume{constructor(from,to){this.from={...from};this.to={...to};}}
world.getAbsoluteTime=()=>system.currentTick;
world.getEntity=id=>world.getAllPlayers().find(p=>p.id===id)??[...world.dimensions.values()].flatMap(d=>[...d.entities.values()]).find(e=>e.id===id);
world.afterEvents.playerButtonInput=new Signal();
export const EntitySwingSource={Attack:'Attack',Build:'Build',DropItem:'DropItem',Event:'Event',Interact:'Interact',Mine:'Mine',None:'None',ThrowItem:'ThrowItem',UseItem:'UseItem'};
world.afterEvents.playerSwingStart=new Signal();
world.afterEvents.playerBreakBlock=new Signal();
world.afterEvents.worldLoad=new Signal();
world.afterEvents.entityRemove=new Signal();
Object.defineProperty(ItemStack.prototype,'keepOnDeath',{get(){return this.meta.keepOnDeath??false;},set(value){this.meta.keepOnDeath=value;}});
Object.defineProperty(ItemStack.prototype,'lockMode',{get(){return this.meta.lockMode??'none';},set(value){this.meta.lockMode=value;}});
ItemStack.prototype.setCanDestroy=function(value){this.meta.canDestroy=structuredClone(value);};
ItemStack.prototype.setCanPlaceOn=function(value){this.meta.canPlaceOn=structuredClone(value);};
export function registerFixtureItem(id,max=64){itemInfo.set(id,{max});}
export function registerFixturePack(root){
 for(const type of ['items','blocks'])for(const f of fs.readdirSync(root+'/runtime/BP/'+type)){
  if(!f.endsWith('.json'))continue;
  const d=JSON.parse(fs.readFileSync(root+'/runtime/BP/'+type+'/'+f));const v=d['minecraft:item']??d['minecraft:block'];
  itemInfo.set(v.description.identifier,{max:v.components?.['minecraft:max_stack_size']??64,definition:v});
 }
 for(const f of fs.readdirSync(root+'/runtime/BP/entities'))if(f.endsWith('.json')){
  const def=JSON.parse(fs.readFileSync(root+'/runtime/BP/entities/'+f))['minecraft:entity'];
  if(def?.description?.identifier)entityFamilies.set(def.description.identifier,[...(def.components?.['minecraft:type_family']?.family??[])]);
 }
}
const oldItemComponent=ItemStack.prototype.getComponent;
ItemStack.prototype.getComponent=function(id){
 if(id==='minecraft:dyeable'&&itemInfo.get(this.typeId)?.definition?.components?.[id])return this.meta[id]??=( {color:undefined} );
 return oldItemComponent.call(this,id);
};
Properties.prototype.getDynamicPropertyIds=function(){return [...this.dp.keys()];};
const oldEntityComponent=Entity.prototype.getComponent;
Entity.prototype.getComponent=function(id){
 if(id==='minecraft:type_family')return {hasTypeFamily:family=>this.families?.includes(family)===true};
 if(this.typeId==='kaleidoscope_tavern:stored_items'&&id==='minecraft:inventory'){this.storageInventory??=new Container(9);return {container:this.storageInventory};}
 return oldEntityComponent.call(this,id);
};

`;
 return {format:'module',source,shortCircuit:true};
}
