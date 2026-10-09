/** Production item/guide formatting; no Minecraft players or engine emulation. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {cocktailLore,normalizeCocktailStack,shakerContentsLore} from '../runtime/BP/scripts/core/cocktail-tooltip.js';
import {SIGNATURE,SIGNATURE_DATA} from '../runtime/BP/scripts/core/mixology.js';
import {buildCookeryGuidePayload} from '../runtime/BP/scripts/data/cookery-guide-payload.js';
import {SHAKER_RECIPES} from '../runtime/BP/scripts/data/mixology.js';

const effect=(id,duration=60,amplifier=0,probability=1)=>({effect:id,duration,amplifier,probability});
function item(typeId,effects=[],extras={}){
 const raw=JSON.stringify({schema:1,color:0x123456,effects,ingredients:Array(3).fill('minecraft:sugar')});
 const stack={typeId,amount:1,lore:[],properties:{[SIGNATURE_DATA]:raw},...extras};
 stack.getDynamicProperty=key=>stack.properties[key];
 stack.getRawLore=()=>structuredClone(stack.lore);
 stack.setLore=rows=>{assert(rows.length<=20);stack.lore=structuredClone(rows);};
 stack.clone=()=>item(typeId,effects,{...structuredClone({amount:stack.amount,lore:stack.lore,properties:stack.properties,nameTag:stack.nameTag,keepOnDeath:stack.keepOnDeath})});
 return stack;
}
const keys=rows=>rows.flatMap(row=>row.rawtext??[]).filter(row=>row.translate).map(row=>row.translate);

test('named cups show source effects, with no fake timer on instantaneous effects',()=>{
 const emerald=cocktailLore(item('kaleidoscope_tavern:emerald'));
 assert.deepEqual(keys(emerald),['effect.kaleidoscope_tavern.long_reach']);
 assert.equal(emerald[0].rawtext.at(-1).text,' (45:00)');
 assert.equal(cocktailLore(item('kaleidoscope_tavern:godfather'))[0].rawtext.at(-1).text,'');
 assert.equal(cocktailLore(item('minecraft:diamond')),undefined);
});

test('signature tooltip reads the cup payload and hides non-guaranteed effects like Java',()=>{
 const stack=item(SIGNATURE,[effect('minecraft:speed',144,1),effect('minecraft:poison',80,0,.5),effect('minecraft:instant_health',0)]);
 const rows=cocktailLore(stack);
 assert.deepEqual(keys(rows),['effect.minecraft.speed','effect.minecraft.instant_health']);
 assert.equal(rows[0].rawtext.at(-1).text,' II (2:24)');
 assert.equal(rows[1].rawtext.at(-1).text,'');
 assert.equal(cocktailLore(item(SIGNATURE,[effect('minecraft:poison')]))[0].rawtext[0].text,'§c');
 stack.properties[SIGNATURE_DATA]='{broken';
 assert.equal(cocktailLore(stack),undefined);
});

test('normalization is idempotent and preserves native names, properties and custom lore',()=>{
 const source=item(SIGNATURE,[effect('minecraft:speed')],{nameTag:'Cary’s special',keepOnDeath:true,properties:{foreign:'keep', [SIGNATURE_DATA]:JSON.stringify({schema:1,color:123,effects:[effect('minecraft:speed')],ingredients:Array(3).fill('minecraft:sugar')})}});
 const normalized=normalizeCocktailStack(source);
 assert.notEqual(normalized,source);
 assert.equal(source.lore.length,0);
 assert.equal(normalized.nameTag,source.nameTag);
 assert.equal(normalized.keepOnDeath,true);
 assert.deepEqual(normalized.properties,source.properties);
 assert.equal(normalizeCocktailStack(normalized),normalized);
 const custom=item(SIGNATURE,[effect('minecraft:speed')],{lore:[{text:'A gift from a friend'}]});
 assert.equal(normalizeCocktailStack(custom),custom);
});

test('over twenty effect rows disclose the remainder without mutating the payload',()=>{
 const stack=item(SIGNATURE,Array.from({length:25},(_,index)=>effect('example:effect_'+index)));
 const before=stack.properties[SIGNATURE_DATA],rows=cocktailLore(stack);
 assert.equal(rows.length,20);
 assert.deepEqual(rows.at(-1).rawtext.at(-1),{translate:'tooltip.kaleidoscope_tavern.cocktail.more_effects',with:['6']});
 assert.equal(stack.properties[SIGNATURE_DATA],before);
});

test('shaker lore uses source colors and resolved potion names, wrapping long names losslessly',()=>{
 const state={result:null,slots:[{item:'minecraft:sugar',color:0xff5555},{item:'minecraft:potion',color:0xffffff,potion:{effectId:'minecraft:strong_healing'}}]};
 const rows=shakerContentsLore(state,slot=>({translate:slot.potion?'item.potion.heal.name':'item.sugar.name'}));
 assert.equal(rows[0].rawtext[1].text,'§c');
 assert.equal(rows[1].rawtext[1].text,'§f');
 assert.equal(rows[1].rawtext.at(-1).translate,'item.potion.heal.name');
 const name='長'.repeat(253)+'😀';
 const wrapped=shakerContentsLore({result:null,slots:[state.slots[0]]},()=>({text:name}));
 assert.equal(wrapped.map(row=>row.rawtext.at(-1).text).join(''),name);
 assert(wrapped.every(row=>row.rawtext.reduce((n,part)=>n+(part.text?.length??0),0)<=50));
});

test('the actual shared guide includes cocktail effects in all three languages and keeps seven entrances',()=>{
 const registry={list:()=>[{source:'kaleidoscope_tavern'}],allRecipes:()=>SHAKER_RECIPES.map(row=>({...row,source:'kaleidoscope_tavern'})),allPages:()=>[]};
 const payload=buildCookeryGuidePayload(registry),emerald=payload.entries.find(row=>row.id==='kaleidoscope_tavern:emerald');
 assert(emerald.mechanicsByLocale.zh_TW.some(line=>line.includes('長臂')&&line.includes('放置酒瓶、雪克杯或倒酒')));
 assert(emerald.mechanicsByLocale.zh_CN.some(line=>line.includes('长臂')&&line.includes('放置酒瓶、雪克杯或倒酒')));
 assert(emerald.mechanicsByLocale.en_US.some(line=>line.includes('Long Reach')&&line.includes('Place bottles and shakers, or pour a drink')));
 assert.equal(payload.categories.filter(row=>!row.parent).length,7);
 const shaker=payload.entries.find(row=>row.id==='kaleidoscope_tavern:shaker');
 assert(shaker.mechanicsByLocale.en_US.some(line=>line.includes('swing into air')));
 assert(!shaker.mechanicsByLocale.en_US.some(line=>line.includes('Sneak-use cancels')));
});
