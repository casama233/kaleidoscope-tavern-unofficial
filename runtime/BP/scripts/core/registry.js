import {normalizeFoundation} from './extension-foundation.js';
import {installContent} from './extension-content.js';
import {SHAKER_INPUTS} from '../data/mixology.js';
import {check,id,integer,clone,freeze,localeMap,sorted,TavernError} from './util.js';
export const API_VERSION=1;
export const CAPABILITIES=Object.freeze(['barrel_recipes','pressing_recipes','guide_pages','guide_product_pages','recipe_auto_pages','atomic_extension_replace','chunk_transport','acknowledgements','shaker_recipes','shaker_batch_snapshot','native_potion_inputs','external_shaker_inputs','drink_content','furniture_storage','external_effect_lifecycle']);
const CORE='kaleidoscope_tavern';
function own(value,source){id(value);check(value.startsWith(source+':'),'FOREIGN_NAMESPACE',value);return value;}
function options(value){check(Array.isArray(value)&&value.length>0&&value.length<=64,'INVALID_INGREDIENT');return [...new Set(value.map(id))].sort();}
function normalizeRecipe(raw,source,fluids,itemExists){
 check(raw&&typeof raw==='object','INVALID_RECIPE');own(raw.id,source);const kind=raw.kind;
 check(['pressing','barrel','shaker'].includes(kind),'UNSUPPORTED_RECIPE_KIND');
 const r={id:raw.id,kind,source};
 if(kind!=='shaker'){id(raw.fluid);check(fluids.has(raw.fluid),'UNKNOWN_FLUID');r.fluid=raw.fluid;}
 if(raw.title!==undefined)r.title=localeMap(raw.title);
 if(kind==='shaker'){
  check(Array.isArray(raw.ingredients)&&raw.ingredients.length===3,'INVALID_SHAKER_SLOTS');r.ingredients=raw.ingredients.map(options);
  for(const item of r.ingredients.flat()){check(itemExists(item),'UNKNOWN_ITEM',item);check(item!=='kaleidoscope_tavern:signature_cocktail','SIGNATURE_INPUT_NOT_ADAPTED');const q=/^kaleidoscope_tavern:.*_q([1-6])$/.exec(item);check(!q||Number(q[1])>=4,'QUALITY_TOO_LOW');check(!q||Object.hasOwn(SHAKER_INPUTS,item),'NOT_MIXABLE_DRINK');}
  check(raw.output&&typeof raw.output.item==='string'&&raw.output.byQuality===undefined,'INVALID_SHAKER_OUTPUT');r.output={item:id(raw.output.item)};check(itemExists(r.output.item),'UNKNOWN_ITEM',r.output.item);
  check(!['kaleidoscope_tavern:signature_cocktail','kaleidoscope_tavern:empty_glassware','kaleidoscope_tavern:shaker','minecraft:potion','minecraft:splash_potion','minecraft:lingering_potion'].includes(r.output.item),'INVALID_SHAKER_OUTPUT');
  r.carrier=id(raw.carrier??'kaleidoscope_tavern:empty_glassware');check(itemExists(r.carrier),'UNKNOWN_ITEM',r.carrier);
 }else if(kind==='pressing'){
  r.input=options(raw.input);r.amount=integer(raw.amount??125,1,1000,'pressing.amount');
  check(1000%r.amount===0,'UNSUPPORTED_PRESSING_QUANTUM');
  for(const item of r.input)check(itemExists(item),'UNKNOWN_ITEM',item);
 }else{
  check(Array.isArray(raw.ingredients)&&raw.ingredients.length<=4,'INVALID_INGREDIENT_SLOTS');
  r.ingredients=raw.ingredients.map(options);
  for(const ids of r.ingredients)for(const item of ids)check(itemExists(item),'UNKNOWN_ITEM',item);
  r.carrier=id(raw.carrier??`${CORE}:empty_bottle`);check(itemExists(r.carrier),'UNKNOWN_ITEM',r.carrier);
  r.unitTime=integer(raw.unitTime??2400,20,72000,'barrel.unitTime');
  r.noIngredientCount=integer(raw.noIngredientCount??16,1,16,'barrel.noIngredientCount');
  check(raw.output&&typeof raw.output==='object','MISSING_OUTPUT');
  const hasItem=typeof raw.output.item==='string',hasQuality=Array.isArray(raw.output.byQuality);
  check(hasItem!==hasQuality,'AMBIGUOUS_OUTPUT');
  if(hasItem){r.output={item:id(raw.output.item)};check(itemExists(r.output.item),'UNKNOWN_ITEM',r.output.item);}
  else{check(raw.output.byQuality.length===6,'INVALID_QUALITY_OUTPUT');r.output={byQuality:raw.output.byQuality.map(id)};for(const item of r.output.byQuality)check(itemExists(item),'UNKNOWN_ITEM',item);}
 }
 return r;
}
function normalizeShakerInput(raw,source,itemExists){
 check(raw&&typeof raw==='object','INVALID_SHAKER_INPUT');const item=own(raw.item,source);check(itemExists(item),'UNKNOWN_ITEM',item);
 let container=raw.container??null;if(container!==null){container=id(container);check(itemExists(container),'UNKNOWN_ITEM',container);}
 const color=integer(raw.color??0xffffff,0,0xffffff,'shakerInput.color'),effects=raw.effects??[];check(Array.isArray(effects)&&effects.length<=32,'BAD_INPUT_EFFECTS');
 const normalized=effects.map(e=>{check(e&&typeof e==='object','BAD_EFFECT');const effect=id(e.effect),duration=integer(e.duration,0,1000000,'duration seconds'),amplifier=integer(e.amplifier,0,255,'amplifier');check(Number.isFinite(e.probability)&&e.probability>=0&&e.probability<=1,'BAD_PROBABILITY');return {effect,duration,amplifier,probability:e.probability};});
 return {item,container,color,effects:normalized};
}
function normalizeContent(raw,source,itemExists){
 check(raw&&['bottle','cocktail'].includes(raw.kind),'INVALID_DRINK_CONTENT');
 const d={kind:raw.kind,block:own(raw.block,source)};
 const effectRows=rows=>{check(Array.isArray(rows)&&rows.length<=32,'INVALID_DRINK_EFFECTS');return rows.map(e=>{id(e.effect);integer(e.duration,0,1000000);integer(e.amplifier,0,255);check(Number.isFinite(e.probability)&&e.probability>=0&&e.probability<=1,'BAD_PROBABILITY');return {...e};});};
 if(raw.kind==='bottle'){
  d.base=own(raw.base,source);d.maxCount=integer(raw.maxCount,1,4);d.compact=raw.compact===true;d.visualKind=integer(raw.visualKind,1000,65535);
  check(Array.isArray(raw.items)&&raw.items.length===6,'INVALID_QUALITY_OUTPUT');d.items=raw.items.map(x=>{own(x,source);check(itemExists(x),'UNKNOWN_ITEM',x);return x;});
  check(Array.isArray(raw.effects)&&raw.effects.length===6,'INVALID_QUALITY_EFFECTS');d.effects=raw.effects.map(effectRows);
  d.visuals={};for(const [key,value] of Object.entries(raw.visuals??{})){check(['holder_bottle_visual','tilted_rack_bottle_visual','circular_rack_bottle_visual','cellar_cabinet_bottle_visual','bar_cabinet_bottle_visual','thrown_drink'].includes(key),'INVALID_VISUAL');d.visuals[key]=own(value,source);}
 }else{d.item=own(raw.item,source);check(itemExists(d.item),'UNKNOWN_ITEM',d.item);d.effects=effectRows(raw.effects);}
 return d;
}
function normalizePage(raw,source){
 own(raw.id,source);const page={id:raw.id,source,title:localeMap(raw.title),body:localeMap(raw.body),recipeIds:(raw.recipeIds??[]).map(id)};
 check(page.recipeIds.length<=32,'TOO_MANY_PAGE_RECIPES');
 if(raw.item!==undefined)page.item=own(raw.item,source);
 if(raw.category!==undefined){check(['equipment','barrel','cocktail','storage','cultivation','furniture','lighting','incense','art','boards','food'].includes(raw.category),'INVALID_GUIDE_CATEGORY');page.category=raw.category;}
 if(raw.crafting!==undefined){
  check(page.item&&Array.isArray(raw.crafting)&&raw.crafting.length<=16,'INVALID_GUIDE_CRAFTING');
  page.crafting=raw.crafting.map(r=>{
   check(r&&r.method==='Crafting Table'&&r.result===page.item,'INVALID_GUIDE_CRAFTING');
   check(Array.isArray(r.ingredients)&&r.ingredients.length>0&&r.ingredients.length<=9,'INVALID_GUIDE_CRAFTING');
   const ingredients=r.ingredients.map(x=>{check(typeof x==='string','INVALID_GUIDE_CRAFTING');id(x.startsWith('#')?x.slice(1):x);return x;});
   return {method:'Crafting Table',result:page.item,count:integer(r.count??1,1,64),time:0,ingredients};
  });
 }
 if(raw.icon!==undefined){check(typeof raw.icon==='string'&&/^textures\/[a-zA-Z0-9_/-]+$/.test(raw.icon)&&!raw.icon.includes('..'),'INVALID_ICON');page.icon=raw.icon;}
 return page;
}
/** Exact multiset matching with alternative slots. Backtracking avoids greedy ambiguity. */
export function matchIngredients(required,stacks){
 const actual=stacks.filter(Boolean);if(required.length!==actual.length)return false;
 const visit=(i,mask)=>i===required.length||actual.some((s,j)=>!(mask&(1<<j))&&required[i].includes(s.id)&&visit(i+1,mask|(1<<j)));
 return visit(0,0);
}
export class ExtensionRegistry {
 constructor({recipes=[],pages=[],fluids=[],itemExists=()=>true}={}){
  this.itemExists=itemExists;this.fluids=new Set(fluids.map(x=>typeof x==='string'?x:x.id));this.extensions=new Map();this.listeners=new Set();this.revision=0;
  this.builtins=freeze(recipes.map(x=>({...clone(x),source:CORE})));this.pages=freeze(pages.map(x=>({...clone(x),source:CORE})));
  this.rebuild();
 }
 rebuild(){const ext=sorted([...this.extensions.values()],x=>x.source);this.recipeCache=freeze([...this.builtins,...ext.flatMap(x=>sorted(x.recipes))]);this.pageCache=freeze([...this.pages,...ext.flatMap(x=>sorted(x.pages))]);this.shakerInputCache=new Map(ext.flatMap(x=>x.shakerInputs).map(x=>[x.item,x]));this.furnitureCache=new Map(ext.flatMap(x=>x.furniture??[]).map(x=>[x.block,x]));this.revision++;for(const listener of [...this.listeners]){try{listener(this);}catch{}}}
 install(raw){
  check(raw&&raw.api===API_VERSION,'API_VERSION_MISMATCH');
  const source=raw.source;check(typeof source==='string'&&/^[a-z][a-z0-9_]{1,47}$/.test(source),'INVALID_SOURCE');
  check(![CORE,'minecraft','kaleidoscope_cookery','__proto__','constructor','prototype'].includes(source),'RESERVED_SOURCE');
  check(typeof raw.version==='string'&&/^\d+\.\d+\.\d+$/.test(raw.version),'INVALID_VERSION');
  check(this.extensions.has(source)||this.extensions.size<64,'EXTENSION_LIMIT');
  const rawRecipes=raw.recipes??[],rawPages=raw.pages??[],rawShakerInputs=raw.shakerInputs??[],rawContent=raw.content??[];check(Array.isArray(rawContent)&&rawContent.length<=128,'CONTENT_LIMIT');const content=rawContent.map(x=>normalizeContent(x,source,this.itemExists));check(new Set(content.map(x=>x.block)).size===content.length,'DUPLICATE_CONTENT');
  check(Array.isArray(rawRecipes)&&rawRecipes.length<=128,'RECIPE_LIMIT');check(Array.isArray(rawPages)&&rawPages.length<=256,'PAGE_LIMIT');check(Array.isArray(rawShakerInputs)&&rawShakerInputs.length<=128,'SHAKER_INPUT_LIMIT');
  // Normalize everything before changing any registry. Reject an entire bad bundle.
  const recipes=rawRecipes.map(x=>normalizeRecipe(x,source,this.fluids,this.itemExists)),pages=rawPages.map(x=>normalizePage(x,source)),shakerInputs=rawShakerInputs.map(x=>normalizeShakerInput(x,source,this.itemExists));
  check(new Set(recipes.map(x=>x.id)).size===recipes.length,'DUPLICATE_RECIPE');check(new Set(pages.map(x=>x.id)).size===pages.length,'DUPLICATE_PAGE');check(new Set(shakerInputs.map(x=>x.item)).size===shakerInputs.length,'DUPLICATE_SHAKER_INPUT');
  check(!pages.some(p=>recipes.some(r=>r.id===p.id)),'PAGE_RECIPE_ID_COLLISION');
  const recipeIds=new Set([...this.builtins,...recipes].map(x=>x.id));
  for(const p of pages)for(const rid of p.recipeIds)check(recipeIds.has(rid),'UNKNOWN_PAGE_RECIPE',rid);
  const foundation=normalizeFoundation(raw,source,this.itemExists);
  const total=[...this.extensions.values()].filter(x=>x.source!==source).reduce((n,x)=>n+x.recipes.length+x.pages.length+x.shakerInputs.length+(x.furniture?.length??0)+(x.effects?.length??0),recipes.length+pages.length+shakerInputs.length+foundation.furniture.length+foundation.effects.length);
  check(total<=2048,'GLOBAL_REGISTRY_LIMIT');
  check(foundation.requires.every(x=>CAPABILITIES.includes(x)),'CAPABILITY_MISMATCH');
  const extension=freeze({...foundation,api:1,source,version:raw.version,title:raw.title?localeMap(raw.title):{en_US:source},recipes,pages,shakerInputs,content});
  this.extensions.set(source,extension);installContent(source,content,foundation);this.rebuild();return {source,recipes:recipes.length,pages:pages.length,shakerInputs:shakerInputs.length,revision:this.revision};
 }
 remove(source){check(source!==CORE,'RESERVED_SOURCE');const removed=this.extensions.delete(source);if(removed){installContent(source,[]);this.rebuild();}return removed;}
 subscribe(listener){check(typeof listener==='function','INVALID_LISTENER');this.listeners.add(listener);return()=>this.listeners.delete(listener);}
 furniture(block){return this.furnitureCache.get(block);}
 allFurniture(){return [...this.furnitureCache.values()];}
 allRecipes(){return this.recipeCache;}
 allPages(){return this.pageCache;}
 list(){return sorted([...this.extensions.values()],x=>x.source).map(x=>({source:x.source,version:x.version,recipes:x.recipes.length,pages:x.pages.length,shakerInputs:x.shakerInputs.length}));}
 recipe(recipeId){return this.recipeCache.find(x=>x.id===recipeId);}
 shakerInput(item){return this.shakerInputCache.get(item);}
 acceptsShakerInput(item){return this.shakerInputCache.has(item)||this.recipeCache.some(r=>r.kind==='shaker'&&r.ingredients.some(s=>s.includes(item)));}
 findShaker(slots){return this.recipeCache.find(r=>r.kind==='shaker'&&matchIngredients(r.ingredients,slots.map(x=>({id:x.item??x.id}))));}
 findPress(item){return this.recipeCache.find(r=>r.kind==='pressing'&&r.input.includes(item));}
 findBarrel(fluid,slots){return this.recipeCache.find(r=>r.kind==='barrel'&&r.fluid===fluid&&matchIngredients(r.ingredients,slots));}
 allowedIngredient(item){return ['minecraft:rotten_flesh','minecraft:dirt','minecraft:stone'].includes(item)||this.recipeCache.some(r=>r.kind==='barrel'&&r.ingredients.some(s=>s.includes(item)));}
}
