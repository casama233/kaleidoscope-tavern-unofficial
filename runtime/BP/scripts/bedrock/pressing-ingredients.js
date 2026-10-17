import {PRESSING_INGREDIENT_KINDS} from '../data/pressing-ingredient-visuals.js';
import {pressingIngredientLayout} from '../core/ingredient-layout.js';
const N='kaleidoscope_tavern';
export const pressingVisualId=i=>N+(i?`:pressing_tub_ingredients_${i}_visual`:':pressing_tub_ingredients_visual');
export function pressingIngredientVisuals(state){
 const slot=state.slots[0];if(state.kind!=='pressing_tub'||!slot||!PRESSING_INGREDIENT_KINDS[slot.id])return [];
 return Array.from({length:Math.ceil(slot.count/8)},(_,i)=>pressingVisualId(i));
}
export function configurePressingIngredients(entity,core,state){
 const match=/:pressing_tub_ingredients(?:_([1-7]))?_visual$/.exec(entity.typeId);if(!match)return;
 const slot=state.slots[0],layout=pressingIngredientLayout(core.location,slot.count,Number(match[1]??0)*8);
 entity.setProperty(N+':grape_kind',PRESSING_INGREDIENT_KINDS[slot.id]);entity.setProperty(N+':fill_stage',layout.length);
 for(let i=0;i<layout.length;i++){
  const a=layout[i];entity.setProperty(N+`:xz${i}`,Math.round((a.x+4)*128)*1024+Math.round((a.z+4)*128));
  entity.setProperty(N+`:y${i}`,a.y);entity.setProperty(N+`:rot${i}`,Math.round((a.yRot+6.4)*100)*7201+Math.round((a.zRot+360)*10));
 }
 const face=core.permutation.getState('minecraft:block_face'),cardinal=core.permutation.getState('minecraft:cardinal_direction');
 const tilted=['north','east','south','west'].includes(face);
 entity.setProperty(N+':tilt',tilted?1:0);entity.setProperty(N+':facing',({north:0,east:1,south:2,west:3})[cardinal]??0);
}
