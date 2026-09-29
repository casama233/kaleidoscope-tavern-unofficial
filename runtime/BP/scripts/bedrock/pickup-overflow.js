/** Forge giveItemToPlayer overflow, without overriding minecraft:item/player definitions. */
import {world} from '@minecraft/server';
export const PICKUP_AFTER='kaleidoscope_tavern:pickup_after';
export function preparePickupOverflow(entity){
 entity.setDynamicProperty(PICKUP_AFTER,world.getAbsoluteTime()+40);
 entity.clearVelocity();entity.applyImpulse({x:0,y:.2,z:0});
}
export function delayOverflowPickup(event){
 const until=event.item?.getDynamicProperty(PICKUP_AFTER);
 if(Number.isFinite(until)&&world.getAbsoluteTime()<until)event.cancel=true;
}
let installed=false;
export function installPickupOverflowEvents(){if(installed)return;world.beforeEvents.entityItemPickup.subscribe(delayOverflowPickup);installed=true;}
