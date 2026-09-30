import {world,system,ItemStack,BlockPermutation} from '@minecraft/server';
import {diagnosticSnapshot,runtimeRegistry} from './main.js';
import {legacyBottleDisplay,bottlePermutationStates} from './core/bottle-display-schema.js';
function assert(ok,label){if(!ok)throw Error(label);}
system.runTimeout(()=>{
 try{
  const diag=diagnosticSnapshot(),registry=runtimeRegistry();
  assert(diag.cookeryHandshakeObserved,'official Cookery handshake');
  assert(diag.extensions.some(x=>JSON.stringify(x).includes('world_liquor')),'World Liquor registered');
  const dimension=world.getDimension('overworld');
  const source='kaleidoscope_baseline',items=Array.from({length:6},(_,i)=>source+':bottle_q'+(i+1));
  const states={count:source+':count',facing:source+':facing',quality:source+':quality'};
  registry.install({api:1,source,version:'1.0.0',fluids:[{id:source+':juice',filled:items[0],empty:'minecraft:bucket',rigSuffix:'grape',title:{en_US:'Probe juice'}}],content:[{kind:'bottle',base:source+':probe',block:source+':bottle',items,effects:items.map(()=>[]),maxCount:4,visualKind:2000,displayStates:states,color:'blue'}]});
  const fluids=registry.allFluids();assert(fluids.some(f=>f.id===source+':juice'),'custom fluids');
  let checks=0;
  for(const fluid of registry.extensions.get(source).content){
   if(!fluid.displayStates)continue;
   const keys=fluid.displayStates;
   for(let facing=0;facing<4;facing++)for(let quality=1;quality<=6;quality++){
    const permutation=BlockPermutation.resolve(fluid.block,{[keys.count]:2,[keys.facing]:facing,[keys.quality]:quality});
    const block={typeId:fluid.block,permutation};
    const display=legacyBottleDisplay(block);assert(display?.items.length===2,'legacy bottle count');
    const states=bottlePermutationStates(display);
    assert(states[keys.facing]===facing&&states[keys.quality]===quality,'legacy bottle round trip');checks++;
   }
  }
  assert(checks>0,'external legacy bottles tested');
  console.log('BASELINE_TAVERN_PASS '+JSON.stringify({checks,fluids:fluids.length,extensions:diag.extensions,guide:diag.cookeryGuideChapter,cookeryCapabilities:diag.cookeryCapabilities,client:false}));
 }catch(e){console.error('BASELINE_TAVERN_FAIL '+e+' '+e.stack);}
},240);
