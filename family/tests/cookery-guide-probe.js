/** Owned, test-only observer appended only to an isolated Cookery QA pack. */
import {system} from '@minecraft/server';
import {getGuidebookExtension} from './api/guidebookExtensionRegistry.js';

const ID='kaleidoscope_tavern:tavern';
const IMMERSIVE_ID='kaleidoscope_immersive_eating:guidebook';
const ROOTS=['equipment','barrel','cocktail','cultivation','storage','decor','food'];
const LOCALES=['zh_CN','zh_TW','en_US'];
// Four reviewed AMW pages are mounted in the complete 42-pack family.
const AMW_IDS=['amw:kirsch','amw:kriek','amw:sour_cherry','amw:sour_cherry_bucket'];
const wait=ticks=>new Promise(resolve=>system.runTimeout(resolve,ticks));
const assert=(ok,message)=>{if(!ok)throw Error(message);};
const text=value=>typeof value==='string'&&value.trim().length>0;

system.runTimeout(async()=>{
 let chapter,immersive;
 try{
  for(let attempt=0;attempt<120;attempt++){
   chapter=getGuidebookExtension(ID);
   immersive=getGuidebookExtension(IMMERSIVE_ID);
   if(chapter?.entries?.length===227&&chapter?.categories?.length===31&&immersive?.entries?.length===23)break;
   await wait(10);
  }
  assert(chapter?.entries?.length===227,'Actual Cookery registry must receive 227 reviewed family entries');
  assert(chapter.categories.length===31,'Actual Cookery registry must retain 31 categories');
  const roots=chapter.categories.filter(category=>!category.parent).map(category=>category.id);
  assert(JSON.stringify(roots)===JSON.stringify(ROOTS),'Seven ordered parent categories');
  const categories=new Map(chapter.categories.map(category=>[category.id,category]));
  assert(categories.size===31,'Unique category IDs');
  for(const category of chapter.categories.filter(category=>category.parent)){
   assert(ROOTS.includes(category.parent),'One-level child category: '+category.id);
  }
  const entryIds=chapter.entries.map(entry=>entry.id);
  assert(new Set(entryIds).size===227,'Unique received entry IDs');
  assert(JSON.stringify(entryIds.filter(id=>id.startsWith('amw:')).sort())===JSON.stringify(AMW_IDS),'Exactly four reviewed AMW entry IDs');
  const sources={kaleidoscope_tavern:0,kaleidoscope_world_liquor:0,amw:0};
  for(const entry of chapter.entries){
   const source=entry.id.split(':')[0];
   assert(Object.prototype.hasOwnProperty.call(sources,source),'Unexpected guide source: '+entry.id);
   sources[source]++;
   assert(categories.get(entry.category)?.parent,'Entry must retain its child category: '+entry.id);
   assert(entry.categories.every(id=>categories.get(id)?.parent),'No flattened category override: '+entry.id);
   assert(text(entry.icon),'Received entry icon: '+entry.id);
   for(const locale of LOCALES){
    const name=chapter.names?.[locale]?.[entry.id];
    assert(text(name),'Received item name '+locale+': '+entry.id);
    if(locale==='en_US'&&source==='amw')assert(!/[\u4e00-\u9fff]/u.test(name),'Reviewed AMW English name: '+entry.id);
    const rows=entry.mechanicsByLocale?.[locale];
    assert(Array.isArray(rows)&&rows.length>0&&rows.every(text),'Received instructions '+locale+': '+entry.id);
   }
  }
  assert(sources.kaleidoscope_tavern===156&&sources.kaleidoscope_world_liquor===67&&sources.amw===4,'Actual registered family entry sources');
  assert(immersive?.version==='1.1.0'&&immersive.entries.length===23,'Current author Immersive Eating chapter');
  assert(immersive.categories.length===1&&immersive.categories[0].id==='animated_foods','Separate author chapter must retain its category');
  const immersiveIds=new Set(immersive.entries.map(entry=>entry.id));
  assert(immersiveIds.size===23,'Unique author animated-food entries');
  for(const id of ['buddha_jumps_over_the_wall','flower_tea','sakura_fubuki','spicy_blood_stew']){
   assert(immersiveIds.has('kaleidoscope_cookery:'+id),'New author food entry: '+id);
  }
  for(const locale of LOCALES){
   for(const key of [immersive.titleKey,immersive.introKey,immersive.selectKey,immersive.backKey,'animated_foods','settings','sound_title','sound_body']){
    assert(text(immersive.text?.[locale]?.[key]),'Received author navigation/settings '+locale+': '+key);
   }
  }
  const amwCategories={kirsch:'barrel_addons',kriek:'barrel_addons',sour_cherry:'plants',sour_cherry_bucket:'juices'};
  for(const [short,category] of Object.entries(amwCategories))assert(chapter.entries.find(entry=>entry.id==='amw:'+short)?.category===category,'Reviewed AMW navigation: '+short);
  for(const locale of LOCALES){
   for(const category of chapter.categories){
    assert(text(chapter.text?.[locale]?.[category.labelKey]),'Received category name '+locale+': '+category.id);
   }
   for(const key of [chapter.titleKey,chapter.introKey,chapter.selectKey,chapter.backKey]){
    assert(text(chapter.text?.[locale]?.[key]),'Received navigation text '+locale+': '+key);
   }
  }
  console.log('BASELINE_COOKERY_GUIDE_PASS '+JSON.stringify({accepted:true,receiver:'actual Cookery registry',id:chapter.id,version:chapter.version,entries:227,categories:31,roots,children:24,sources,reviewedAmwIds:AMW_IDS,locales:LOCALES,localizedEntries:681,entryIds:entryIds.sort(),immersiveEating:{id:immersive.id,version:immersive.version,entries:23,separateChapter:true,navigationAndSettingsLocales:LOCALES},client:false,simulatedPlayers:false,testOnly:true}));
 }catch(error){
  console.error('BASELINE_COOKERY_GUIDE_FAIL '+JSON.stringify({accepted:false,receiver:'actual Cookery registry',error:String(error),entries:chapter?.entries?.length??0,categories:chapter?.categories?.length??0,client:false,simulatedPlayers:false,testOnly:true}));
 }
},100);
