/** Deterministic script doubles only; NOT Minecraft SimulatedPlayer or native acceptance. */
import {resolve as baseResolve,load as baseLoad} from '../foundation/mock-loader.mjs';
export const resolve=baseResolve;
export async function load(url,context,next){
 const out=await baseLoad(url,context,next);
 if(!url.endsWith('/tests/fake-server.js'))return out;
 let source=out.source.replaceAll('minecraft:consumable','Consume').replaceAll('minecraft:splash\'','ThrownSplash\'').replaceAll('minecraft:lingering\'','ThrownLingering\'');
 source+=`
const oldItemComponent=ItemStack.prototype.getComponent;
ItemStack.prototype.getComponent=function(id){if(id==='minecraft:dyeable'&&itemInfo.get(this.typeId)?.definition?.components?.[id])return this.meta[id]??=( {color:undefined} );return oldItemComponent.call(this,id);};
Object.defineProperty(Entity.prototype,'isValid',{get(){return !this.removed;}});
Properties.prototype.getDynamicPropertyIds=function(){return [...this.dp.keys()];};
const oldEntityComponent=Entity.prototype.getComponent;
Entity.prototype.getComponent=function(id){
 if(this.typeId==='kaleidoscope_tavern:stored_items'&&id==='minecraft:inventory'){this.storageInventory??=new Container(9);return {container:this.storageInventory};}
 return oldEntityComponent.call(this,id);
};
`;
 return {...out,source};
}
