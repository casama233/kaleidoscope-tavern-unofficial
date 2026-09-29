// ISOLATED WORLD ONLY: writes a test chest at (1025,80,1025).
import {world,system,BlockPermutation,ItemStack} from '@minecraft/server';
import {planInventory,commitInventory} from './core/inventory.js';
import {normalizeBottleStack,qualityBottleLore} from './core/quality-tooltip.js';
import {renderBoardText,removeBoardText} from './bedrock/board-text.js';
const check=(ok,message)=>{if(!ok)throw Error(message);};
system.runTimeout(async()=>{try{
 const d=world.getDimension('overworld');await world.tickingAreaManager.createTickingArea('inventory_board_audit',{dimension:d,from:{x:1024,y:0,z:1024},to:{x:1039,y:100,z:1039}});
 const p={x:1025,y:80,z:1025};d.getBlock(p).setPermutation(BlockPermutation.resolve('minecraft:chest'));
 const c=d.getBlock(p).getComponent('minecraft:inventory').container,make=(id,n)=>new ItemStack(id,n),wine='kaleidoscope_tavern:wine_q6';
 const clear=()=>{for(let i=0;i<c.size;i++)c.setItem(i,undefined);};
 const add=(id,n=1)=>{const plan=planInventory(c,0,0,[{id,count:n}],make);commitInventory(plan,c,()=>{},()=>{});return plan;};
 clear();c.setItem(1,normalizeBottleStack(make(wine,7)));add(wine);check(c.getItem(1).amount===8&&!c.getItem(0),'stamped wine did not merge / empty hand occupied');
 clear();const legacy=make(wine,4);legacy.setLore(qualityBottleLore(legacy,true));c.setItem(1,legacy);add(wine);check(c.getItem(1).amount===5,'legacy managed lore did not merge');
 clear();c.setItem(1,normalizeBottleStack(make(wine,16)));add(wine,2);check(c.getItem(1).amount===16&&c.getItem(2).amount===2&&!c.getItem(0),'full stack spill/empty hand');
 clear();add(wine);check(!c.getItem(0)&&c.getItem(1).amount===1,'new pickup occupied selected hand');
 clear();c.setItem(1,normalizeBottleStack(make(wine,2)));add('kaleidoscope_tavern:wine_q5');check(c.getItem(1).amount===2&&c.getItem(2).typeId.endsWith('_q5'),'quality merged incorrectly');
 for(const mode of ['name','lore','restriction']){
  clear();const custom=normalizeBottleStack(make(wine,3));if(mode==='name')custom.nameTag='Keep me';if(mode==='lore')custom.setLore(['Player text']);if(mode==='restriction')custom.setCanDestroy(['minecraft:stone']);c.setItem(1,custom);const restrictions=JSON.stringify(c.getItem(1).getCanDestroy());add(wine);
  check(c.getItem(1).amount===3&&c.getItem(2).amount===1,'custom metadata merged '+mode);
  if(mode==='name')check(c.getItem(1).nameTag==='Keep me','name lost');if(mode==='lore')check(c.getItem(1).getLore()[0]==='Player text','lore lost');if(mode==='restriction')check(JSON.stringify(c.getItem(1).getCanDestroy())===restrictions,'restriction lost');
 }
 clear();for(let i=0;i<c.size;i++)c.setItem(i,make('minecraft:stone',64));c.setItem(1,normalizeBottleStack(make(wine,15)));let rejected=false;try{add(wine,2);}catch(e){rejected=e.code==='INVENTORY_FULL';}check(rejected&&c.getItem(1).amount===15,'full inventory changed on rejection');
 c.setItem(0,undefined);add(wine,2);check(c.getItem(1).amount===16&&c.getItem(0).amount===1,'last empty slot fallback');
 clear();c.setItem(1,normalizeBottleStack(make(wine,5)));const plan=planInventory(c,0,0,[{id:wine,count:1}],make);try{commitInventory(plan,c,()=>{throw Error('forced save failure');},()=>{});}catch{}check(c.getItem(1).amount===5&&!c.getItem(0),'rollback failed');
 clear();const signature=make('kaleidoscope_tavern:signature_cocktail',1);signature.setDynamicProperty('test:identity','keep');const signaturePlan=planInventory(c,0,0,[{stack:signature,count:1}],make);commitInventory(signaturePlan,c,()=>{},()=>{});check(c.getItem(1).getDynamicProperty('test:identity')==='keep','signature properties lost');
 // Tool pickup uses the selected slot and preserves the portable recipe payload.
 clear();const shaker=make('kaleidoscope_tavern:shaker',1);shaker.setDynamicProperty('test:recipe','preserve');
 const takeShaker=()=>{const p=planInventory(c,5,0,[{stack:shaker,count:1,preferHand:true}],make);commitInventory(p,c,()=>{},()=>{});};
 takeShaker();check(c.getItem(5)?.getDynamicProperty('test:recipe')==='preserve'&&!c.getItem(0),'shaker not returned to hand');
 clear();c.setItem(5,make('minecraft:stone',64));takeShaker();check(c.getItem(5).typeId==='minecraft:stone'&&c.getItem(0)?.getDynamicProperty('test:recipe')==='preserve','occupied hand overwritten');
 clear();for(let i=0;i<c.size;i++)c.setItem(i,make('minecraft:stone',64));c.setItem(5,undefined);takeShaker();check(c.getItem(5)?.getDynamicProperty('test:recipe')==='preserve','last free hand rejected');
 console.warn('INTERACTION_INVENTORY_PASS 15 scenarios; native ItemStacks and chest container');
 const info={kind:'chalk',large:false,facing:'north',root:{x:1030,y:80,z:1030}},key='parity-board';let rendered=0;
 for(const alignment of ['left','center','right','justify','distributed'])for(const verticalAlignment of ['top','middle','bottom']){
  const data={text:'AB CD EF GH\n一二三',color:'white',glowing:false,waxed:false,alignment,verticalAlignment};
  check(renderBoardText(d,info,data,null,key),'render failed');const glyphs=d.getEntities({type:'kaleidoscope_tavern:board_glyph_visual',location:{x:1030,y:81,z:1030},maxDistance:4}).filter(e=>String(e.getDynamicProperty('kt:writingBoard/anchor')??'').startsWith(key+'|'));
  check(glyphs.length===11,'unexpected glyph count '+glyphs.length);check(!renderBoardText(d,info,data,null,key),'unchanged board rebuilt');rendered++;removeBoardText(d,key,info.root);
 }
 console.warn('INTERACTION_BOARD_PASS '+rendered+' alignment combinations; native glyph entities');clear();console.warn('PARITY_DONE interaction repair');
}catch(e){console.warn('PARITY_ERROR '+e+' '+e.stack);}},80);
