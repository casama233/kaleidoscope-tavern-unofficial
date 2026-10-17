import test from 'node:test';
import assert from 'node:assert/strict';
import {world,Player,ItemStack} from './fake-server.js';
import {installQualityTooltipEvents} from '../runtime/BP/scripts/bedrock/quality-tooltip.js';
import {qualityBottleLore,isManagedQualityBottleLore,BOTTLE_COLOR_KEYS} from '../runtime/BP/scripts/core/quality-tooltip.js';
import {isPlainIngredient} from '../runtime/BP/scripts/core/inventory.js';

installQualityTooltipEvents();
const dim=world.getDimension('overworld');

test('quality bottles use natural names plus Java color and brew-quality lore with a blue Tavern marker',()=>{
 const wine=new ItemStack('kaleidoscope_tavern:wine_q6');
 const lore=qualityBottleLore(wine);
 assert(lore.length>=3);
 assert.deepEqual(lore[0],{rawtext:[{text:'§7'},{translate:'color.kaleidoscope_tavern.prefix'},{text:'§d'},{translate:'color.kaleidoscope_tavern.light_purple'}]});
 assert.equal(lore[1].rawtext[1].translate,'tooltip.kaleidoscope_tavern.bottle_block.brew_level');
 assert.equal(lore[1].rawtext[1].with.rawtext[0].translate,'message.kaleidoscope_tavern.barrel.brew_level.6');
 assert.deepEqual(lore.at(-1),{rawtext:[{text:'§9'},{translate:'item.kaleidoscope_tavern.mod_name'}]});
 const berry=qualityBottleLore(new ItemStack('kaleidoscope_tavern:sweet_berry_wine_q6'));
 assert(berry.some(line=>line.rawtext?.some(part=>part.translate==='effect.kaleidoscope_tavern.slightly_tipsy')));
 const vinegar=qualityBottleLore(new ItemStack('kaleidoscope_tavern:vinegar_q6'));
 assert.equal(vinegar[0].rawtext[1].translate,'tooltip.kaleidoscope_tavern.bottle_block.brew_level');
 assert.equal(vinegar.at(-1).rawtext[1].translate,'item.kaleidoscope_tavern.mod_name');
 assert.equal(Object.keys(BOTTLE_COLOR_KEYS).length,23);
});

test('inventory change and spawn stamp managed lore once without overwriting player lore',()=>{
 const player=new Player('quality-tooltip',dim);player.inventory.setItem(0,new ItemStack('kaleidoscope_tavern:sweet_berry_wine_q4'));
 world.afterEvents.playerInventoryItemChange.emit({player,slot:0});
 let stack=player.inventory.getItem(0);
 assert.deepEqual(stack.getRawLore(),qualityBottleLore(stack));assert(isManagedQualityBottleLore(stack));
 world.afterEvents.playerInventoryItemChange.emit({player,slot:0});
 assert.deepEqual(player.inventory.getItem(0).getRawLore(),qualityBottleLore(stack));
 player.inventory.setItem(1,new ItemStack('kaleidoscope_tavern:wine_q5'));world.afterEvents.playerSpawn.emit({player});
 assert(isManagedQualityBottleLore(player.inventory.getItem(1)));
 const custom=new ItemStack('kaleidoscope_tavern:wine_q6');custom.setLore(['Player gift']);player.inventory.setItem(2,custom);
 world.afterEvents.playerInventoryItemChange.emit({player,slot:2});assert.deepEqual(player.inventory.getItem(2).getLore(),['Player gift']);
});

test('only canonical managed bottle lore bypasses custom-lore ingredient protection',()=>{
 const make=id=>new ItemStack(id,1),clean=new ItemStack('kaleidoscope_tavern:wine_q6');
 clean.setLore(qualityBottleLore(clean));assert(isPlainIngredient(clean,make));
 const altered=new ItemStack('kaleidoscope_tavern:wine_q6');altered.setLore([...qualityBottleLore(altered),'custom']);assert.equal(isPlainIngredient(altered,make),false);
});
