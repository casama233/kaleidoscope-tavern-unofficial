/** Merge regression for the user's friend's live label change and current color/lore fixes. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {ExtensionRegistry,CAPABILITIES} from '../runtime/BP/scripts/core/registry.js';
import {BUILTIN_RECIPES} from '../runtime/BP/scripts/data/recipes.js';
import {SHAKER_RECIPES} from '../runtime/BP/scripts/data/mixology.js';
import {FLUIDS} from '../runtime/BP/scripts/data/fluids.js';
import {qualityBottleLore,normalizeBottleStack,isLegacyManagedQualityBottleLore,configureBottleCategories} from '../runtime/BP/scripts/core/quality-tooltip.js';
import {isPlainIngredient} from '../runtime/BP/scripts/core/inventory.js';
assert.ok(process.env.LIQUOR_SOURCE,'LIQUOR_SOURCE is required');
const {payload}=await import(pathToFileURL(path.resolve(process.env.LIQUOR_SOURCE,'runtime/BP/scripts/payload.js')).href);
const {withFoundation}=await import(pathToFileURL(path.resolve(process.env.LIQUOR_SOURCE,'runtime/BP/scripts/foundation.js')).href);
const sourceKey='item.kaleidoscope_world_liquor.mod_name';
const make=()=>{
 const registry=new ExtensionRegistry({recipes:[...BUILTIN_RECIPES,...SHAKER_RECIPES],fluids:FLUIDS,itemExists:()=>true});
 configureBottleCategories(item=>registry.ingredientColor(item),item=>registry.previousIngredientColors(item));
 return registry;
};
function install(){const r=make();r.install({...payload,modNameKey:sourceKey,requires:[...(payload.requires??[]),'drink_source_labels']});return r;}
class Item{
 constructor(typeId){Object.assign(this,{typeId,amount:1,maxAmount:16,lore:[],props:{}});}
 clone(){return Object.assign(new Item(this.typeId),structuredClone({...this}));}
 getRawLore(){return structuredClone(this.lore);}
 getLore(){return this.lore.map(JSON.stringify);}
 setLore(v){this.lore=structuredClone(v);}
 getDynamicPropertyIds(){return Object.keys(this.props);}
 getComponent(){return undefined;}
 getCanDestroy(){return [];}
 getCanPlaceOn(){return [];}
 isStackableWith(other){return other.typeId===this.typeId&&JSON.stringify(other.lore)===JSON.stringify(this.lore);}
}
test('friend capability is additive and cannot erase current color/destruction capabilities',()=>{
 for(const cap of ['drink_source_labels','shaker_ingredient_tags','destruction_feedback'])assert.ok(CAPABILITIES.includes(cap));
});
test('source label uses owning addon key while ordinary Tavern bottles retain Tavern',()=>{
 install();const tea=qualityBottleLore(new Item('kaleidoscope_world_liquor:ice_tea_q6'));
 assert.equal(tea.at(-1).rawtext.at(-1).translate,sourceKey);
 // Current NeoForge 1.1.11 changes SMC/fallback ice tea from dark_red to
 // the author's brown category. Keep the owner label while using that rule.
 assert.equal(tea[0].rawtext.at(-1).translate,'color.kaleidoscope_tavern.brown');
 assert.equal(qualityBottleLore(new Item('kaleidoscope_tavern:vodka_q6')).at(-1).rawtext.at(-1).translate,'item.kaleidoscope_tavern.mod_name');
});
for(const levels of [false,true])for(const color of [false,true])for(const source of [false,true])test(`legacy merge levels=${levels}, color=${color}, hostSource=${source}`,()=>{
 install();const item=new Item('kaleidoscope_world_liquor:ice_tea_q6');item.lore=qualityBottleLore(item,levels,color,source);
 assert.equal(isLegacyManagedQualityBottleLore(item),true);assert.equal(isPlainIngredient(item,id=>new Item(id)),true);
 assert.deepEqual(normalizeBottleStack(item).lore,qualityBottleLore(item));
});
test('a source cannot spoof another addon label and rejection preserves the previous installed label',()=>{
 const r=install();assert.throws(()=>r.install({...payload,modNameKey:'item.other_addon.mod_name'}),/INVALID_MOD_NAME_KEY/);
 assert.equal(qualityBottleLore(new Item('kaleidoscope_world_liquor:ice_tea_q6')).at(-1).rawtext.at(-1).translate,sourceKey);
});
for(const kind of ['extra','wrong-source','name','property'])test('protected custom metadata '+kind+' survives merged formatter',()=>{
 install();const item=new Item('kaleidoscope_world_liquor:ice_tea_q6');item.lore=qualityBottleLore(item,false,false,true);
 if(kind==='extra')item.lore.push({text:'custom'});
 if(kind==='wrong-source')item.lore.at(-1).rawtext.at(-1).translate='item.other_addon.mod_name';
 if(kind==='name')item.nameTag='Custom tea';
 if(kind==='property')item.props['custom:key']='keep';
 const output=normalizeBottleStack(item);assert.equal(isPlainIngredient(item,id=>new Item(id)),false);
 if(['extra','wrong-source'].includes(kind))assert.deepEqual(output.lore,item.lore);
 assert.equal(output.nameTag,item.nameTag);assert.deepEqual(output.props,item.props);
});

test('actual addon wrapper advertises its own label and preserves both new capabilities',()=>{
 const bundle=withFoundation(payload);assert.equal(bundle.modNameKey,sourceKey);
 for(const cap of ['drink_source_labels','shaker_ingredient_tags','destruction_feedback'])assert.ok(bundle.requires.includes(cap));
 const r=make();r.install(bundle);assert.equal(qualityBottleLore(new Item('kaleidoscope_world_liquor:ice_tea_q6')).at(-1).rawtext.at(-1).translate,sourceKey);
});
