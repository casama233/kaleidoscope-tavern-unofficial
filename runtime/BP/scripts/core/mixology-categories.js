/** Shared Java Ingredient/tag semantics. Addons supply data, never host code. */
import {check,id,integer,localeMap} from './util.js';
import {COCKTAIL_COLOR_CODES} from './cocktail-colors.js';
export const COLOR_TAG_PREFIX='kaleidoscope_tavern:cocktail_ingredient_';
export const JAVA_COLOR_RGB=Object.freeze(Object.fromEntries(Object.keys(COCKTAIL_COLOR_CODES).map((key,index)=>[key,[0x000000,0x0000aa,0x00aa00,0x00aaaa,0xaa0000,0xaa00aa,0xffaa00,0xaaaaaa,0x555555,0x5555ff,0x55ff55,0x55ffff,0xff5555,0xff55ff,0xffff55,0xffffff][index]])));
export const colorTag=value=>typeof value==='string'&&/^[a-z][a-z0-9_.-]*$/.test(value)?COLOR_TAG_PREFIX+value:id(value);
export function normalizeCategoryData(raw){
 const colors=raw.shakerColors??[],changes=raw.itemTagChanges??[];
 check(Array.isArray(colors)&&colors.length<=64,'SHAKER_COLOR_LIMIT');
 check(Array.isArray(changes)&&changes.length<=256,'ITEM_TAG_CHANGE_LIMIT');
 return {shakerColors:colors.map(row=>({tag:id(row.tag),color:integer(row.color,0,0xffffff,'category RGB'),priority:integer(row.priority??100,0,1000,'category priority'),...(row.labels?{labels:localeMap(row.labels)}:{}),translationKey:row.translationKey??('color.'+row.tag.replace(':','.').replace('cocktail_ingredient_',''))})),itemTagChanges:changes.map(row=>{
  const tags=key=>{const values=row[key]??[];check(Array.isArray(values)&&values.length<=32,'ITEM_TAG_CHANGE_LIMIT');return [...new Set(values.map(id))];};
  return {item:id(row.item),add:tags('add'),remove:tags('remove')};
 })};
}
/** Java JSON Ingredient arrays are alternatives, not extra consumed slots. */
export function ingredientPredicate(value){
 const rows=Array.isArray(value)?value:[value];
 check(rows.length>0&&rows.length<=64,'INVALID_INGREDIENT');
 return rows.map(row=>{
  if(typeof row==='string')return row.startsWith('#')?{tag:id(row.slice(1))}:{item:id(row)};
  check(row&&typeof row==='object'&&Number('item' in row)+Number('tag' in row)===1,'INVALID_INGREDIENT');
  return row.tag?{tag:id(row.tag)}:{item:id(row.item)};
 });
}
export function buildCategoryCatalog(inputs,extensions=[],nativeTags=()=>[],legacyTags=new Map()){
 const palette=new Map(Object.entries(JAVA_COLOR_RGB).map(([name,color])=>[COLOR_TAG_PREFIX+name,{tag:COLOR_TAG_PREFIX+name,color,priority:0}]));
 for(const extension of extensions)for(const row of extension.shakerColors??[]){
  const old=palette.get(row.tag);check(!old||old.color===row.color,'SHAKER_COLOR_CONFLICT',row.tag);
  palette.set(row.tag,{...row,priority:Math.max(old?.priority??0,row.priority)});
 }
 const definitions=new Map(inputs.map(row=>[row.item,row]));
 const mutations=new Map();for(const extension of extensions)for(const row of extension.itemTagChanges??[]){
  let list=mutations.get(row.item);if(!list)mutations.set(row.item,list=[]);list.push(row);
 }
 const colorRows=[...palette.values()].sort((a,b)=>b.priority-a.priority||a.tag.localeCompare(b.tag));
 const memberships=new Map();
 function tags(item){
  if(memberships.has(item))return memberships.get(item);
  const row=definitions.get(item),members=new Set([...nativeTags(item),...(legacyTags.get(item)??[])]);
  if(row){
   if(row.ingredientTags!==undefined)for(const tag of row.ingredientTags)members.add(tag);
   else if(row.ingredientColor!==undefined)members.add(colorTag(row.ingredientColor));
   else if(typeof row.color==='string')members.add(colorTag(row.color));
   else if(row.color!==undefined){
    const candidates=colorRows.filter(entry=>entry.color===row.color);
    // A single exact declared category can be inferred. Equal RGB categories
    // need an explicit tag; nearest-colour guesses would change Java recipes.
    if(candidates.length===1)members.add(candidates[0].tag);
   }
  }
  for(const change of mutations.get(item)??[]){for(const tag of change.add)members.add(tag);for(const tag of change.remove)members.delete(tag);}
  const result=[...members].sort();memberships.set(item,result);return result;
 }
 function color(item){
  const member=tags(item),entry=colorRows.find(row=>member.includes(row.tag));
  return entry?{color:entry.color,colorIgnored:false,ingredientColor:entry.tag,translationKey:entry.translationKey??('color.kaleidoscope_tavern.'+entry.tag.slice(COLOR_TAG_PREFIX.length))}:{color:0xffffff,colorIgnored:true};
 }
 function previousColors(item){
  const removed=[...new Set((mutations.get(item)??[]).flatMap(row=>row.remove))];
  return removed.filter(tag=>tag.startsWith(COLOR_TAG_PREFIX)).map(tag=>({ingredientColor:tag,color:palette.get(tag)?.color??0xffffff,colorIgnored:false,translationKey:palette.get(tag)?.translationKey??('color.kaleidoscope_tavern.'+tag.slice(COLOR_TAG_PREFIX.length))}));
 }
 return {tags,color,previousColors,palette,definitions};
}
export function matchShakerRecipe(recipe,slots,catalog){
 if(slots.length!==3)return false;
 const predicates=recipe.ingredientPredicates??recipe.ingredients.map((options,index)=>recipe.ingredientTags?.[index]?[{tag:recipe.ingredientTags[index]}]:options.map(item=>({item})));
 const actual=slots.map(slot=>({item:slot.item??slot.id}));
 const test=(predicate,input)=>predicate.some(rule=>rule.item?rule.item===input.item:catalog.tags(input.item).includes(rule.tag));
 const visit=(index,mask)=>index===3||actual.some((input,slot)=>!(mask&(1<<slot))&&test(predicates[index],input)&&visit(index+1,mask|(1<<slot)));
 return visit(0,0);
}
export function deriveBottleInputs(content,explicit){
 const result=new Map();
 for(const bottle of content)if(bottle.kind==='bottle')for(let quality=4;quality<=6;quality++){
  result.set(bottle.items[quality-1],{item:bottle.items[quality-1],container:bottle.container??'kaleidoscope_tavern:empty_bottle',effects:bottle.effects[quality-1],...(bottle.color!==undefined?{color:bottle.color}:{})});
 }
 for(const row of explicit)result.set(row.item,row);
 return [...result.values()];
}
