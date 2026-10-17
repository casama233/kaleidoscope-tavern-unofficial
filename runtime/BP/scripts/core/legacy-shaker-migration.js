/** Cross-ID migration for the two owned legacy shakers only.
 * ItemStack.clone cannot change typeId. Copy and verify the stable API's writable
 * outer metadata before replacing a slot; this is not an arbitrary NBT codec.
 */
import {canonical,check} from './util.js';
import {commitInventory} from './inventory.js';
import {SHAKER_ID,ACTIVE_SHAKER,POURING_SHAKER} from './immersion.js';
import {rawItemLore} from './cocktail-tooltip.js';

const LEGACY=new Set([ACTIVE_SHAKER,POURING_SHAKER]);
const UNSUPPORTED=['minecraft:inventory','minecraft:durability','minecraft:enchantable','minecraft:dyeable'];
function metadata(item){
 const lore=rawItemLore(item);check(Array.isArray(lore),'SHAKER_MIGRATION_UNREADABLE_LORE');
 const dynamic=Object.fromEntries(item.getDynamicPropertyIds().sort().map(id=>{
  const value=item.getDynamicProperty(id);
  return [id,typeof value==='object'&&value!==null?{x:value.x,y:value.y,z:value.z}:value];
 }));
 return {name:item.nameTag,lore,dynamic,canDestroy:item.getCanDestroy(),canPlaceOn:item.getCanPlaceOn(),
  keepOnDeath:item.keepOnDeath,lockMode:item.lockMode};
}
function identity(item){return item?canonical({type:item.typeId,amount:item.amount,metadata:metadata(item)}):undefined;}

export function migrateLegacyShakerSlot(container,index,makeStack,finish=item=>item){
 const before=container.getItem(index);if(!LEGACY.has(before?.typeId))return false;
 check(before.amount===1,'NOT_PORTABLE_SHAKER');
 // Neither owned definition has these stateful components. Retain unexpected
 // stacks instead of stripping data that the current shaker cannot represent.
 for(const component of UNSUPPORTED)check(!before.getComponent(component),'SHAKER_MIGRATION_UNSUPPORTED_COMPONENT',component);
 const expected=identity(before),data=metadata(before),copy=makeStack(SHAKER_ID,1);
 if(data.name!==undefined)copy.nameTag=data.name;
 copy.setLore(data.lore);
 for(const [id,value]of Object.entries(data.dynamic))copy.setDynamicProperty(id,value);
 copy.setCanDestroy(data.canDestroy);copy.setCanPlaceOn(data.canPlaceOn);
 copy.keepOnDeath=data.keepOnDeath;copy.lockMode=data.lockMode;
 check(canonical(metadata(copy))===canonical(data),'SHAKER_MIGRATION_METADATA_MISMATCH');
 const after=finish(copy,before);
 check(after?.typeId===SHAKER_ID&&after.amount===1,'NOT_PORTABLE_SHAKER');
 const completed=identity(after);
 check(identity(container.getItem(index))===expected,'SHAKER_MIGRATION_SLOT_CHANGED');
 const oldSlots=[],newSlots=[];oldSlots[index]=before;newSlots[index]=after;
 commitInventory({before:oldSlots,after:newSlots,changes:[index]},container,
  ()=>check(identity(container.getItem(index))===completed,'SHAKER_MIGRATION_WRITE_MISMATCH'),
  ()=>check(identity(container.getItem(index))===expected,'SHAKER_MIGRATION_ROLLBACK_MISMATCH'));
 return true;
}
