import {FLUIDS} from '../data/fluids.js';
const buckets=new Map(FLUIDS.map(f=>[f.id,f.filled]));
buckets.set('minecraft:water','minecraft:water_bucket');buckets.set('minecraft:lava','minecraft:lava_bucket');
// Native Cookery recipe records: all valid sets, one recipe attached to its product.
export function preparationRecipes(recipe,names={}){
 const ingredient=(options,index)=>{
  const color=/^kaleidoscope_tavern:cocktail_ingredient_(white|yellow|red|green|blue|purple|light_purple|gold|dark_red|dark_blue|dark_purple|aqua|dark_aqua)$/.exec(recipe.ingredientTags?.[index]??'')?.[1];
  if(color){
   const id=recipe.id+'/ingredient_'+index;
   const colors={dark_blue:['深蓝色','深藍色','Dark Blue'],dark_purple:['深紫色','深紫色','Dark Purple'],aqua:['水蓝色','水藍色','Aqua'],dark_aqua:['深青色','深青色','Dark Aqua'],gold:['金色','金色','Gold'],light_purple:['淡紫色','淺紫色','Light Purple'],white:['白色','白色','White'],yellow:['黄色','黃色','Yellow'],red:['红色','紅色','Red'],green:['绿色','綠色','Green'],blue:['蓝色','藍色','Blue'],purple:['紫色','紫色','Purple'],dark_red:['深红色','深紅色','Dark Red']};
   for(const [i,locale] of ['zh_CN','zh_TW','en_US'].entries()){
    (names[locale]??={})[id]=colors[color][i]+['调酒材料（酒品品质 ≥4）','調酒材料（酒品品質 ≥4）',' shaker ingredient (bottled drinks: quality ≥4)'][i];
   }
   return id;
  }
  if(options.length===1)return options[0];
  const id=recipe.id+'/ingredient_'+index;
  for(const locale of ['zh_CN','zh_TW','en_US']){
   const labels=names[locale]??={};const groups=new Map();
   for(const item of options){const m=/^(.*)_q([1-6])$/.exec(item),base=m?.[1]??item;const q=groups.get(base)??[];if(m)q.push(+m[2]);groups.set(base,q);}
   labels[id]=[...groups].map(([base,quality])=>{
    const q=[...new Set(quality)].sort();const name=labels[base]??labels[base+'_q1']??base;
    const values=q.length>1&&q.every((n,i)=>n===q[0]+i)?q[0]+'–'+q.at(-1):q.join('/');
    return name+(q.length?' ('+({en_US:'Quality ',zh_CN:'品质 ',zh_TW:'品質 '})[locale]+values+')':'');
   }).join(locale==='en_US'?' OR ':' 或 ');
  }
  return id;
 };
 let sets=[(recipe.ingredients??[recipe.input??[]]).filter(x=>x.length).map(ingredient)];
 const method={barrel:'Barrel',shaker:'Shaker',pressing:'Pressing Tub'}[recipe.kind];
 if(!method)return [];
 const result=recipe.output?.item??recipe.output?.byQuality?.[0]??(recipe.fluidItem??(recipe.fluidItem??buckets.get(recipe.fluid)));
 if(recipe.kind==='barrel')sets=sets.map(row=>[...Array(4).fill((recipe.fluidItem??(recipe.fluidItem??buckets.get(recipe.fluid)))??recipe.fluid),...row]);
 if(recipe.kind==='pressing')sets=sets.map(row=>Array(Math.ceil(1000/recipe.amount)).fill(row[0]));
 if(sets.length>24||sets.some(row=>row.length>12))throw Error('Cookery recipe limits: '+recipe.id);
 return sets.map(ingredients=>({method,ingredients,result,count:recipe.kind==='barrel'&&!recipe.ingredients.length?(recipe.noIngredientCount??16):1,time:0}));
}
export function preparationFood(recipe){return {eatFromInventory:true,alwaysEat:true,returns:recipe.carrier??(recipe.kind==='shaker'?'kaleidoscope_tavern:empty_glassware':'kaleidoscope_tavern:empty_bottle')};}
