/** Native carriers are pack-owned block inventories, never free-moving mobs. */
import {check,id} from './util.js';
import {validateDisplay} from './bottles.js';
import {bottleBlock} from './extension-content.js';
import {BOTTLES} from '../data/bottles.js';
import {validateMachine} from './machines.js';
const NS='kaleidoscope_tavern',D='(overworld|nether|the_end)',P='(-?\\d+)_(-?\\d+)_(-?\\d+)';
const regular=new RegExp(`^kt:(holder|tilted_rack|circular_rack|cellar_cabinet|shaker)/${D}/${P}$`);
const bar=new RegExp(`^kt:bar_cabinet/${D}/(bar_cabinet|glass_bar_cabinet)/${P}$`);
const extension=new RegExp(`^kt:extension_storage/([a-z0-9_.-]+)/([a-z0-9_./-]+)/${D}/${P}$`);
const other=new RegExp(`^kt:(glassware_holder|vanillaBottleDisplays)/minecraft:${D}/${P}$`);
const bottles=new RegExp(`^kt:bottles/${D}/${P}$`);
const machine=new RegExp(`^kt:machine/${D}/${P}$`);
const position=values=>{const p={x:Number(values[0]),y:Number(values[1]),z:Number(values[2])};check(Object.values(p).every(Number.isSafeInteger),'NATIVE_STORAGE_LOCATION');return p;};
export function nativeStorageAnchor(key,registry,readState){
 check(typeof key==='string','NATIVE_STORAGE_UNKNOWN_ANCHOR');let m=regular.exec(key),type,dimension,p,capacity;
 if(m){type=NS+':'+(m[1]==='shaker'?'shaker_station':m[1]);dimension=m[2];p=position(m.slice(3));capacity={holder:1,tilted_rack:3,circular_rack:6,cellar_cabinet:9,shaker:1}[m[1]];}
 else if((m=bar.exec(key))){type=NS+':'+m[2];dimension=m[1];p=position(m.slice(3));capacity=2;}
 else if((m=other.exec(key))){type=NS+':'+(m[1]==='vanillaBottleDisplays'?'potion_bottle':m[1]);dimension=m[2];p=position(m.slice(3));capacity=m[1]==='vanillaBottleDisplays'?1:9;}
 else if((m=extension.exec(key))){
  type=id(m[1]+':'+m[2]);dimension=m[3];p=position(m.slice(4));
  const def=registry?.furniture?.(type);check(def&&def.source===m[1]&&def.block===type&&['bar_cabinet','cellar_cabinet'].includes(def.kind),'NATIVE_STORAGE_UNKNOWN_ANCHOR');capacity=def.kind==='bar_cabinet'?2:9;
 }else if((m=machine.exec(key))){
  const raw=readState?.(key);check(typeof raw==='string'&&raw.length<=8192,'NATIVE_STORAGE_UNKNOWN_ANCHOR');let state;
  try{state=validateMachine(JSON.parse(raw));}catch{check(false,'NATIVE_STORAGE_UNKNOWN_ANCHOR');}
  check(state.nativeItems===1,'NATIVE_STORAGE_UNKNOWN_ANCHOR');
  type=NS+':'+(state.kind==='barrel'?'barrel_core':'pressing_tub');dimension=m[1];p=position(m.slice(2));capacity=state.slots.length;
  return {key,type,dimension:'minecraft:'+dimension,position:p,capacity,displayIds:state.slots.map(x=>x?.id??null),displayCounts:state.slots.map(x=>x?.count??0),center:{x:p.x+.5,y:p.y+.5,z:p.z+.5}};
 }else if((m=bottles.exec(key))){
  const raw=readState?.(key);check(typeof raw==='string'&&raw.length<=1024,'NATIVE_STORAGE_UNKNOWN_ANCHOR');
  let state;try{state=validateDisplay(JSON.parse(raw));}catch{check(false,'NATIVE_STORAGE_UNKNOWN_ANCHOR');}
  type=bottleBlock(state.base);dimension=m[1];p=position(m.slice(2));capacity=BOTTLES[state.base].maxCount;
  return {key,type,dimension:'minecraft:'+dimension,position:p,capacity,displayIds:state.items.slice(),center:{x:p.x+.5,y:p.y+.5,z:p.z+.5}};
 }else check(false,'NATIVE_STORAGE_UNKNOWN_ANCHOR');
 return {key,type,dimension:'minecraft:'+dimension,position:p,capacity,center:{x:p.x+.5,y:p.y+.5,z:p.z+.5}};
}
export function checkNativeStorageOwner(anchor,block,ids,counts){
 check(block&&block.dimension?.id===anchor.dimension&&block.typeId===anchor.type&&['x','y','z'].every(k=>block.location?.[k]===anchor.position[k]),'NATIVE_STORAGE_OWNER_BLOCK');
 check(Array.isArray(ids)&&ids.length===9&&ids.slice(anchor.capacity).every(x=>x===null),'NATIVE_STORAGE_LAYOUT_MISMATCH');
 if(anchor.displayIds)check(ids.every((value,slot)=>value===(anchor.displayIds[slot]??null)),'NATIVE_STORAGE_LAYOUT_MISMATCH');
 if(anchor.displayCounts)check(Array.isArray(counts)&&counts.length===9&&counts.every((value,slot)=>value===(anchor.displayCounts[slot]??0)),'NATIVE_STORAGE_LAYOUT_MISMATCH');
 if(anchor.type===NS+':glassware_holder')check(ids.every(x=>x===null||x===NS+':empty_glassware'),'NATIVE_STORAGE_LAYOUT_MISMATCH');
 if(anchor.type===NS+':potion_bottle')check(ids[0]==='minecraft:potion','NATIVE_STORAGE_LAYOUT_MISMATCH');
 if(anchor.type===NS+':shaker_station')check(ids[0]===NS+':shaker','NATIVE_STORAGE_LAYOUT_MISMATCH');
 return true;
}
