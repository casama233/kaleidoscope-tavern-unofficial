const JAVA_COLOR_TAG=/^kaleidoscope_tavern:cocktail_ingredient_[a-z0-9_.-]+$/;
/** Merge declared tag membership, never infer membership from visual RGB.
 * Rebuild from immutable source recipes/inputs so replacing/removing an addon
 * cannot leave stale memberships in the shared recipe cache.
 */
export function expandShakerTags(recipes,inputs=[]){
 const members=new Map();
 const add=(tag,item)=>{if(!tag)return;let set=members.get(tag);if(!set)members.set(tag,set=new Set());set.add(item);};
 for(const recipe of recipes)if(recipe.kind==='shaker')recipe.ingredients.forEach((options,i)=>{
  const tag=recipe.ingredientTags?.[i];if(tag&&!JAVA_COLOR_TAG.test(tag))for(const item of options)add(tag,item);
 });
 for(const input of inputs)for(const tag of input.ingredientTags??[])add(tag,input.item);
 return recipes.map(recipe=>recipe.kind!=='shaker'?recipe:{...recipe,ingredients:recipe.ingredients.map((options,i)=>
  recipe.ingredientTags?.[i]?[...new Set([...(JAVA_COLOR_TAG.test(recipe.ingredientTags[i])?[]:options),...(members.get(recipe.ingredientTags[i])??[])])].sort():[...options]
 )});
}
