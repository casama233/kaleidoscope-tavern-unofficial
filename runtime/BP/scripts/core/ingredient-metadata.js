/** Portable, native-equality-checked metadata for stackable shaker ingredients.
 * This is deliberately not an arbitrary NBT codec. The real engine must agree
 * that reconstruction is stackable with the untouched input before any debit.
 * Non-stackable inputs and unreadable native data keep the existing refusal.
 */
import {canonical,check,clone,id,utf8Bytes} from './util.js';

const KEYS=new Set(['schema','name','lore','dynamic','canDestroy','canPlaceOn']);
function rawLore(item){
 const rows=item.getRawLore?.()??item.getLore?.();
 check(Array.isArray(rows),'METADATA_ITEM_REJECTED','unreadable lore');
 return rows.map(row=>typeof row==='string'?{text:row}:row);
}
function propertyValue(value){
 if(typeof value==='boolean'||typeof value==='string')return value;
 if(typeof value==='number'){check(Number.isFinite(value),'METADATA_ITEM_REJECTED');return value;}
 check(value&&typeof value==='object'&&['x','y','z'].every(k=>Number.isFinite(value[k])),'METADATA_ITEM_REJECTED');
 return {x:value.x,y:value.y,z:value.z};
}
function metadata(item){
 const dynamic=item.getDynamicPropertyIds().sort().map(key=>[key,propertyValue(item.getDynamicProperty(key))]);
 const value={schema:1,lore:rawLore(item),dynamic,canDestroy:item.getCanDestroy(),canPlaceOn:item.getCanPlaceOn()};
 if(item.nameTag!==undefined)value.name=item.nameTag;
 return validateIngredientMetadata(value);
}
function adventureBlockId(value){
 // Native adventure-list getters omit the vanilla namespace. Validate its
 // qualified interpretation without changing the original string or order.
 id(typeof value==='string'&&!value.includes(':')?'minecraft:'+value:value);
 return value;
}
export function validateIngredientMetadata(value){
 check(value&&value.schema===1&&Object.keys(value).every(key=>KEYS.has(key)),'INGREDIENT_METADATA_SCHEMA');
 check(value.name===undefined||typeof value.name==='string'&&value.name.length<=255,'INGREDIENT_METADATA_NAME');
 check(Array.isArray(value.lore)&&value.lore.length<=20,'INGREDIENT_METADATA_LORE');
 // RawMessage is retained as JSON, including translations and nested rawtext.
 // Its actual engine validity is checked by setLore before the first debit.
 check(value.lore.every(row=>row&&typeof row==='object'&&!Array.isArray(row)),'INGREDIENT_METADATA_LORE');
 check(Array.isArray(value.dynamic)&&value.dynamic.length<=128,'INGREDIENT_METADATA_PROPERTIES');
 const seen=new Set();for(const entry of value.dynamic){
  check(Array.isArray(entry)&&entry.length===2&&typeof entry[0]==='string'&&entry[0].length>0&&entry[0].length<=32767&&!seen.has(entry[0]),'INGREDIENT_METADATA_PROPERTIES');
  seen.add(entry[0]);propertyValue(entry[1]);
 }
 for(const key of ['canDestroy','canPlaceOn']){check(Array.isArray(value[key])&&value[key].length<=256,'INGREDIENT_METADATA_BLOCKS');value[key].forEach(adventureBlockId);}
 check(utf8Bytes(JSON.stringify(value))<=12000,'INGREDIENT_METADATA_TOO_LARGE');return value;
}
export function restoreStackableIngredient(itemId,value,makeStack){
 id(itemId);validateIngredientMetadata(value);const item=makeStack(itemId,1);
 check(item.maxAmount>1&&!item.getComponent?.('minecraft:inventory'),'METADATA_ITEM_REJECTED','not a portable stackable ingredient');
 if(value.name!==undefined)item.nameTag=value.name;
 if(canonical(rawLore(item))!==canonical(value.lore))item.setLore(clone(value.lore));
 for(const [key,data]of value.dynamic)item.setDynamicProperty(key,typeof data==='object'?{...data}:data);
 if(value.canDestroy.length)item.setCanDestroy([...value.canDestroy]);
 if(value.canPlaceOn.length)item.setCanPlaceOn([...value.canPlaceOn]);
 check(canonical(metadata(item))===canonical(value),'METADATA_ITEM_REJECTED','metadata readback mismatch');
 return item;
}
export function captureStackableIngredient(item,makeStack){
 check(item&&item.maxAmount>1&&!item.keepOnDeath&&(!item.lockMode||item.lockMode==='none')&&!item.getComponent?.('minecraft:inventory'),'METADATA_ITEM_REJECTED');
 const value=metadata(item),restored=restoreStackableIngredient(item.typeId,value,makeStack);
 // Unlike comparing only our own fields, this native comparison also rejects
 // hidden or other-pack data that this pack cannot read and reconstruct.
 check(item.isStackableWith(restored)===true&&restored.isStackableWith(item)===true,'METADATA_ITEM_REJECTED','native item data cannot round-trip');
 return clone(value);
}
