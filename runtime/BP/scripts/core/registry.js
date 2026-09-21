import {SHAKER_INPUTS} from '../data/mixology.js';
import {check,id,integer,clone,freeze,localeMap,sorted,TavernError} from './util.js';
export const API_VERSION=1;
export const CAPABILITIES=Object.freeze(['barrel_recipes','pressing_recipes','guide_pages','recipe_auto_pages','atomic_extension_replace','chunk_transport','acknowledgements','shaker_recipes','shaker_batch_snapshot','native_potion_inputs']);
const CORE='kaleidoscope_tavern';
function own(value,source){id(value);check(value.startsWith(source+':'),'FOREIGN_NAMESPACE',value);return value;}
function options(value){check(Array.isArray(value)&&value.length>0&&value.length<=16,'INVALID_INGREDIENT');return [...new Set(value.map(id))].sort();}
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
function normalizePage(raw,source){
 own(raw.id,source);const page={id:raw.id,source,title:localeMap(raw.title),body:localeMap(raw.body),recipeIds:(raw.recipeIds??[]).map(id)};
 check(page.recipeIds.length<=32,'TOO_MANY_PAGE_RECIPES');
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
 rebuild(){const ext=sorted([...this.extensions.values()],x=>x.source);this.recipeCache=freeze([...this.builtins,...ext.flatMap(x=>sorted(x.recipes))]);this.pageCache=freeze([...this.pages,...ext.flatMap(x=>sorted(x.pages))]);this.revision++;for(const listener of [...this.listeners]){try{listener(this);}catch{}}}
 install(raw){
  check(raw&&raw.api===API_VERSION,'API_VERSION_MISMATCH');
  const source=raw.source;check(typeof source==='string'&&/^[a-z][a-z0-9_]{1,47}$/.test(source),'INVALID_SOURCE');
  check(![CORE,'minecraft','kaleidoscope_cookery','__proto__','constructor','prototype'].includes(source),'RESERVED_SOURCE');
  check(typeof raw.version==='string'&&/^\d+\.\d+\.\d+$/.test(raw.version),'INVALID_VERSION');
  check(this.extensions.has(source)||this.extensions.size<64,'EXTENSION_LIMIT');
  const rawRecipes=raw.recipes??[],rawPages=raw.pages??[];
  check(Array.isArray(rawRecipes)&&rawRecipes.length<=128,'RECIPE_LIMIT');check(Array.isArray(rawPages)&&rawPages.length<=64,'PAGE_LIMIT');
  // Normalize everything before changing any registry. Reject an entire bad bundle.
  const recipes=rawRecipes.map(x=>normalizeRecipe(x,source,this.fluids,this.itemExists)),pages=rawPages.map(x=>normalizePage(x,source));
  check(new Set(recipes.map(x=>x.id)).size===recipes.length,'DUPLICATE_RECIPE');check(new Set(pages.map(x=>x.id)).size===pages.length,'DUPLICATE_PAGE');
  check(!pages.some(p=>recipes.some(r=>r.id===p.id)),'PAGE_RECIPE_ID_COLLISION');
  const recipeIds=new Set([...this.builtins,...recipes].map(x=>x.id));
  for(const p of pages)for(const rid of p.recipeIds)check(recipeIds.has(rid),'UNKNOWN_PAGE_RECIPE',rid);
  const total=[...this.extensions.values()].filter(x=>x.source!==source).reduce((n,x)=>n+x.recipes.length+x.pages.length,recipes.length+pages.length);
  check(total<=2048,'GLOBAL_REGISTRY_LIMIT');
  const extension=freeze({api:1,source,version:raw.version,title:raw.title?localeMap(raw.title):{en_US:source},recipes,pages});
  this.extensions.set(source,extension);this.rebuild();return {source,recipes:recipes.length,pages:pages.length,revision:this.revision};
 }
 remove(source){check(source!==CORE,'RESERVED_SOURCE');const removed=this.extensions.delete(source);if(removed)this.rebuild();return removed;}
 subscribe(listener){check(typeof listener==='function','INVALID_LISTENER');this.listeners.add(listener);return()=>this.listeners.delete(listener);}
 allRecipes(){return this.recipeCache;}
 allPages(){return this.pageCache;}
 list(){return sorted([...this.extensions.values()],x=>x.source).map(x=>({source:x.source,version:x.version,recipes:x.recipes.length,pages:x.pages.length}));}
 recipe(recipeId){return this.recipeCache.find(x=>x.id===recipeId);}
 acceptsShakerInput(item){return this.recipeCache.some(r=>r.kind==='shaker'&&r.ingredients.some(s=>s.includes(item)));}
 findShaker(slots){return this.recipeCache.find(r=>r.kind==='shaker'&&matchIngredients(r.ingredients,slots.map(x=>({id:x.item??x.id}))));}
 findPress(item){return this.recipeCache.find(r=>r.kind==='pressing'&&r.input.includes(item));}
 findBarrel(fluid,slots){return this.recipeCache.find(r=>r.kind==='barrel'&&r.fluid===fluid&&matchIngredients(r.ingredients,slots));}
 allowedIngredient(item){return ['minecraft:rotten_flesh','minecraft:dirt','minecraft:stone'].includes(item)||this.recipeCache.some(r=>r.kind==='barrel'&&r.ingredients.some(s=>s.includes(item)));}
}
