import {system} from '@minecraft/server';
import {BARREL_INGREDIENT_KINDS} from '../data/barrel-ingredient-visuals.js';
import {barrelIngredientLayout} from '../core/ingredient-layout.js';
const N='kaleidoscope_tavern';
export function barrelIngredientVisuals(state){
 if(state.kind!=='barrel'||!state.open)return [];
 return state.slots.flatMap((slot,i)=>slot&&BARREL_INGREDIENT_KINDS[slot.id]?[N+`:barrel_ingredients_${i}_visual`]:[]);
}
export function configureBarrelIngredients(entity,core,state){
 const match=/:barrel_ingredients_([0-3])_visual$/.exec(entity.typeId);if(!match)return;
 const slot=Number(match[1]),layout=barrelIngredientLayout(core.location,state.slots,slot);
 let born=entity.getDynamicProperty('kt:created_tick');
 if(typeof born!=='number'){born=system.currentTick;entity.setDynamicProperty('kt:created_tick',born);}
 entity.setProperty(N+':kind',BARREL_INGREDIENT_KINDS[state.slots[slot].id]);entity.setProperty(N+':count',layout.length);
 entity.setProperty(N+':phase',((born/10+(layout[0]?.global??0))*180/Math.PI)%360);
 for(let i=0;i<layout.length;i++){
  const p=layout[i],x=Math.round((p.x+8)*128),z=Math.round((p.z+8)*128);
  entity.setProperty(N+`:xz${i}`,x*2048+z);entity.setProperty(N+`:y${i}`,p.y);
  entity.setProperty(N+`:rot${i}`,Math.round((p.yRot+5)*100)*7201+Math.round((p.zRot+360)*10));
 }
}
