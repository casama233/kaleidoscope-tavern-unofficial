import {FLUIDS} from '../data/fluids.js';
const buckets=new Map(FLUIDS.map(f=>[f.id,f.filled]));
buckets.set('minecraft:water','minecraft:water_bucket');buckets.set('minecraft:lava','minecraft:lava_bucket');
// Native Cookery recipe records: all valid sets, one recipe attached to its product.
export function preparationRecipes(recipe,names={}){
 const ingredient=(options,index)=>{
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
 const result=recipe.output?.item??recipe.output?.byQuality?.[0]??buckets.get(recipe.fluid);
 if(recipe.kind==='barrel')sets=sets.map(row=>[...Array(4).fill(buckets.get(recipe.fluid)??recipe.fluid),...row]);
 if(recipe.kind==='pressing')sets=sets.map(row=>Array(Math.ceil(1000/recipe.amount)).fill(row[0]));
 if(sets.length>24||sets.some(row=>row.length>12))throw Error('Cookery recipe limits: '+recipe.id);
 return sets.map(ingredients=>({method,ingredients,result,count:recipe.kind==='barrel'&&!recipe.ingredients.length?(recipe.noIngredientCount??16):1,time:0}));
}
export function preparationFood(recipe){return {eatFromInventory:true,alwaysEat:true,returns:recipe.carrier??(recipe.kind==='shaker'?'kaleidoscope_tavern:empty_glassware':'kaleidoscope_tavern:empty_bottle')};}
