/** Owned, test-only observer appended only to an isolated Cookery QA pack. */
import {system} from '@minecraft/server';
import {getGuidebookExtension} from './api/guidebookExtensionRegistry.js';

const ID='kaleidoscope_tavern:tavern';
const ROOTS=['equipment','barrel','cocktail','cultivation','storage','decor','food'];
const LOCALES=['zh_CN','zh_TW','en_US'];
const wait=ticks=>new Promise(resolve=>system.runTimeout(resolve,ticks));
const assert=(ok,message)=>{if(!ok)throw Error(message);};
const text=value=>typeof value==='string'&&value.trim().length>0;

system.runTimeout(async()=>{
 let chapter;
 try{
  for(let attempt=0;attempt<120;attempt++){
   chapter=getGuidebookExtension(ID);
   if(chapter?.entries?.length===223&&chapter?.categories?.length===31)break;
   await wait(10);
  }
  assert(chapter?.entries?.length===223,'Actual Cookery registry must receive 223 entries');
  assert(chapter.categories.length===31,'Actual Cookery registry must retain 31 categories');
  const roots=chapter.categories.filter(category=>!category.parent).map(category=>category.id);
  assert(JSON.stringify(roots)===JSON.stringify(ROOTS),'Seven ordered parent categories');
  const categories=new Map(chapter.categories.map(category=>[category.id,category]));
  assert(categories.size===31,'Unique category IDs');
  for(const category of chapter.categories.filter(category=>category.parent)){
   assert(ROOTS.includes(category.parent),'One-level child category: '+category.id);
  }
  const entryIds=chapter.entries.map(entry=>entry.id);
  assert(new Set(entryIds).size===223,'Unique received entry IDs');
  const sources={kaleidoscope_tavern:0,kaleidoscope_world_liquor:0};
  for(const entry of chapter.entries){
   const source=entry.id.split(':')[0];
   assert(Object.prototype.hasOwnProperty.call(sources,source),'Unexpected guide source: '+entry.id);
   sources[source]++;
   assert(categories.get(entry.category)?.parent,'Entry must retain its child category: '+entry.id);
   assert(entry.categories.every(id=>categories.get(id)?.parent),'No flattened category override: '+entry.id);
   assert(text(entry.icon),'Received entry icon: '+entry.id);
   for(const locale of LOCALES){
    assert(text(chapter.names?.[locale]?.[entry.id]),'Received item name '+locale+': '+entry.id);
    const rows=entry.mechanicsByLocale?.[locale];
    assert(Array.isArray(rows)&&rows.length>0&&rows.every(text),'Received instructions '+locale+': '+entry.id);
   }
  }
  assert(sources.kaleidoscope_tavern===156&&sources.kaleidoscope_world_liquor===67,'Actual registered family entry sources');
  for(const locale of LOCALES){
   for(const category of chapter.categories){
    assert(text(chapter.text?.[locale]?.[category.labelKey]),'Received category name '+locale+': '+category.id);
   }
   for(const key of [chapter.titleKey,chapter.introKey,chapter.selectKey,chapter.backKey]){
    assert(text(chapter.text?.[locale]?.[key]),'Received navigation text '+locale+': '+key);
   }
  }
  console.log('BASELINE_COOKERY_GUIDE_PASS '+JSON.stringify({accepted:true,receiver:'actual Cookery registry',id:chapter.id,version:chapter.version,entries:223,categories:31,roots,children:24,sources,locales:LOCALES,localizedEntries:669,entryIds:entryIds.sort(),client:false,simulatedPlayers:false,testOnly:true}));
 }catch(error){
  console.error('BASELINE_COOKERY_GUIDE_FAIL '+JSON.stringify({accepted:false,receiver:'actual Cookery registry',error:String(error),entries:chapter?.entries?.length??0,categories:chapter?.categories?.length??0,client:false,simulatedPlayers:false,testOnly:true}));
 }
},100);
