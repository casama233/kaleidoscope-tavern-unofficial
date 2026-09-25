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
 source+=`
// Explicit test-only fixture additions for World Liquor and current stable API.
export const EffectTypes={getAll:()=>[]};
export const InputPermissionCategory={Camera:'Camera',Movement:'Movement'};
world.getAbsoluteTime=()=>system.currentTick;
world.getEntity=id=>world.getAllPlayers().find(p=>p.id===id)??[...world.dimensions.values()].flatMap(d=>[...d.entities.values()]).find(e=>e.id===id);
world.afterEvents.playerButtonInput=new Signal();
world.afterEvents.playerBreakBlock=new Signal();
world.afterEvents.worldLoad=new Signal();
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
`;
 return {format:'module',source,shortCircuit:true};
}
